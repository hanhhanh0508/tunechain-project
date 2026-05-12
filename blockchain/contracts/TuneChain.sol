// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TuneChain
 * @dev Nền tảng nhạc phi tập trung: upload track, tip escrow, stake-to-report, auto-hide, reward.
 * Tích hợp với TuneToken (TCT) làm đơn vị thanh toán.
 */
contract TuneChain is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public tuneToken;

    struct Track {
        uint256 id;
        address creator;
        string metadataCID;      // CID của metadata JSON (chứa CID nhạc, ảnh bìa, tên...)
        uint256 uploadTimestamp;
        uint256 escrowBalance;    // Tổng token đang trong escrow của bài hát
        uint256 lastTipTimestamp; // Thời điểm tip gần nhất (dùng để tính 24h)
        uint256 reportCount;
        uint256 viewCount;        // Lượt view on-chain (được sync từ off-chain DB)
        bool isHidden;
        uint256 penaltyCount;     // Số lần vi phạm (bị ẩn) của creator
    }

    // Trạng thái (State variables)
    Track[] public tracks;
    mapping(uint256 => mapping(address => bool)) public hasReported; // trackId => reporter => đã report chưa
    mapping(uint256 => address[]) public reporters;                  // trackId => danh sách người report (để chia thưởng)
    mapping(uint256 => mapping(address => bool)) public hasClaimedReward; // trackId => reporter => đã nhận thưởng chưa
    mapping(uint256 => mapping(address => uint256)) public reportTimestamp; // trackId => reporter => timestamp
    mapping(uint256 => mapping(address => bool)) public stakeProcessed; // trackId => reporter => stake processed (expired)
    mapping(address => uint256) public creatorPenalty; // creator => penalty count (O(1))

    uint256 public constant BASE_UPLOAD_FEE = 10 * 10**18;   // 10 TCT (giả định decimals 18)
    uint256 public constant STAKE_AMOUNT = 5 * 10**18;       // 5 TCT để report
    uint256 public constant ESCROW_DURATION = 24 hours;
    uint256 public constant REPORT_THRESHOLD_PERCENT = 5;    // 5%
    uint256 public constant MIN_VIEWS_FOR_REPORT = 100;
    uint256 public constant REPORT_EXPIRY_DAYS = 30 days;    // Sau 30 ngày nếu chưa bị ẩn, stake bị burn

    address public treasury;                                  // Địa chỉ nhận 20% tiền phạt
    address public oracle;                                    // Địa chỉ được phép sync view

    // Events
    event TrackUploaded(uint256 indexed trackId, address indexed creator, string metadataCID, uint256 timestamp);
    event TipReceived(uint256 indexed trackId, address indexed tipper, uint256 amount, uint256 timestamp);
    event TipsWithdrawn(uint256 indexed trackId, address indexed creator, uint256 amount);
    event TrackHidden(uint256 indexed trackId, uint256 reportCount, uint256 viewCount);
    event RewardClaimed(uint256 indexed trackId, address indexed reporter, uint256 reward);
    event ViewsSynced(uint256 indexed trackId, uint256 newViewCount);
    event OracleUpdated(address newOracle);
    event TreasuryUpdated(address newTreasury);
    event Reported(uint256 indexed trackId, address indexed reporter, uint256 timestamp);
    event StakeProcessed(uint256 indexed trackId, address indexed reporter, uint256 amount);

    // ================================
    // Modifiers
    // ================================
    modifier onlyOracle() {
        require(msg.sender == oracle, "TuneChain: only oracle");
        _;
    }

    modifier trackExists(uint256 trackId) {
        require(trackId < tracks.length, "TuneChain: track does not exist");
        _;
    }

    modifier notHidden(uint256 trackId) {
        require(!tracks[trackId].isHidden, "TuneChain: track is hidden");
        _;
    }

    modifier onlyCreator(uint256 trackId) {
        require(tracks[trackId].creator == msg.sender, "TuneChain: not creator");
        _;
    }

    // ================================
    // Constructor
    // ================================
    constructor(address _tokenAddress, address _treasury, address _oracle) Ownable(msg.sender) {
        tuneToken = IERC20(_tokenAddress);
        treasury = _treasury;
        oracle = _oracle;
    }

    // ================================
    // Functions
    // ================================

    /**
     * @dev Upload bài hát mới (mint NFT về mặt kỹ thuật là tạo record track).
     * @param metadataCID CID của metadata JSON (chứa thông tin bài hát, link IPFS nhạc và ảnh bìa)
     */
    function uploadTrack(string memory metadataCID) external {
        uint256 penaltyCount = creatorPenalty[msg.sender];
        // tăng 50% mỗi lần vi phạm: uploadFee = BASE * (1 + 0.5 * penaltyCount)
        uint256 uploadFee = (BASE_UPLOAD_FEE * (100 + penaltyCount * 50)) / 100;
        tuneToken.safeTransferFrom(msg.sender, address(this), uploadFee);

        uint256 trackId = tracks.length;
        tracks.push(Track({
            id: trackId,
            creator: msg.sender,
            metadataCID: metadataCID,
            uploadTimestamp: block.timestamp,
            escrowBalance: 0,
            lastTipTimestamp: 0,
            reportCount: 0,
            viewCount: 0,
            isHidden: false,
            penaltyCount: penaltyCount
        }));

        emit TrackUploaded(trackId, msg.sender, metadataCID, block.timestamp);
    }

    /**
     * @dev Người nghe tip token vào escrow của bài hát.
     * @param trackId ID của bài hát
     * @param amount Số lượng token tip (phải lớn hơn 0)
     */
    function tip(uint256 trackId, uint256 amount) external trackExists(trackId) notHidden(trackId) nonReentrant {
        require(amount > 0, "TuneChain: amount must be > 0");
        tuneToken.safeTransferFrom(msg.sender, address(this), amount);

        Track storage track = tracks[trackId];
        track.escrowBalance += amount;
        track.lastTipTimestamp = block.timestamp;

        emit TipReceived(trackId, msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Creator rút tiền tip sau 24h (nếu bài chưa bị ẩn).
     * @param trackId ID của bài hát
     */
    function withdrawTips(uint256 trackId) external trackExists(trackId) onlyCreator(trackId) nonReentrant {
        Track storage track = tracks[trackId];
        require(!track.isHidden, "TuneChain: track is hidden, cannot withdraw");
        require(block.timestamp >= track.lastTipTimestamp + ESCROW_DURATION, "TuneChain: escrow still locked");

        uint256 amount = track.escrowBalance;
        require(amount > 0, "TuneChain: no balance to withdraw");
        track.escrowBalance = 0;

        tuneToken.safeTransfer(msg.sender, amount);
        emit TipsWithdrawn(trackId, msg.sender, amount);
    }

    /**
     * @dev Người dùng báo cáo vi phạm bản quyền (stake 5 TCT).
     * @param trackId ID của bài hát
     */
    function report(uint256 trackId) external trackExists(trackId) notHidden(trackId) nonReentrant {
        require(msg.sender != tracks[trackId].creator, "TuneChain: cannot report own track");
        require(!hasReported[trackId][msg.sender], "TuneChain: already reported");
        tuneToken.safeTransferFrom(msg.sender, address(this), STAKE_AMOUNT);

        Track storage track = tracks[trackId];
        track.reportCount++;
        hasReported[trackId][msg.sender] = true;
        reporters[trackId].push(msg.sender);
        reportTimestamp[trackId][msg.sender] = block.timestamp;
        stakeProcessed[trackId][msg.sender] = false;
        emit Reported(trackId, msg.sender, block.timestamp);

        // Kiểm tra auto-hide
        if (track.viewCount > MIN_VIEWS_FOR_REPORT) {
            uint256 ratio = (track.reportCount * 100) / track.viewCount;
            if (ratio > REPORT_THRESHOLD_PERCENT) {
                _hideTrack(trackId);
            }
        }
    }

    /**
     * @dev Hàm nội bộ để ẩn bài và xử lý tịch thu escrow, tăng penalty.
     */
    function _hideTrack(uint256 trackId) internal {
        Track storage track = tracks[trackId];
        require(!track.isHidden, "TuneChain: already hidden");
        track.isHidden = true;
        track.penaltyCount++; // Tăng số lần vi phạm
        creatorPenalty[track.creator] += 1;

        // Tịch thu toàn bộ escrow
        uint256 seized = track.escrowBalance;
        track.escrowBalance = 0;
        if (seized > 0) {
            // 80% giữ lại để chia cho reporters, 20% chuyển vào treasury
            uint256 reporterRewardPool = (seized * 80) / 100;
            uint256 treasuryShare = seized - reporterRewardPool;
            _setRewardPool(trackId, reporterRewardPool);
            if (treasuryShare > 0) {
                tuneToken.safeTransfer(treasury, treasuryShare);
            }
        }

        emit TrackHidden(trackId, track.reportCount, track.viewCount);
    }

    mapping(uint256 => uint256) public rewardPool; // trackId => tổng token thưởng cho reporters

    function _setRewardPool(uint256 trackId, uint256 amount) internal {
        rewardPool[trackId] = amount;
    }

    /**
     * @dev Người report nhận thưởng (pull model). Mỗi reporter chỉ nhận một lần.
     * @param trackId ID của bài hát đã bị ẩn
     */
    function claimReward(uint256 trackId) external nonReentrant {
        require(tracks[trackId].isHidden, "TuneChain: track not hidden");
        require(!hasClaimedReward[trackId][msg.sender], "TuneChain: already claimed");
        require(hasReported[trackId][msg.sender], "TuneChain: not a reporter");
        require(!stakeProcessed[trackId][msg.sender], "TuneChain: stake processed, ineligible");

        uint256 pool = rewardPool[trackId];
        require(pool > 0, "TuneChain: no reward pool");

        // Count eligible reporters (exclude those whose stake was processed/expired)
        uint256 eligible = 0;
        address[] storage reps = reporters[trackId];
        for (uint i = 0; i < reps.length; i++) {
            address r = reps[i];
            if (hasReported[trackId][r] && !stakeProcessed[trackId][r]) {
                eligible++;
            }
        }
        require(eligible > 0, "TuneChain: no eligible reporters");

        uint256 share = pool / eligible; // Chia đều 80% seized
        uint256 stakeBack = STAKE_AMOUNT;     // Trả lại tiền cọc

        hasClaimedReward[trackId][msg.sender] = true;
        uint256 totalReward = share + stakeBack;
        tuneToken.safeTransfer(msg.sender, totalReward);

        emit RewardClaimed(trackId, msg.sender, totalReward);
    }

    /**
     * @dev Xử lý stake đã quá hạn (nếu báo cáo không dẫn tới ẩn trong REPORT_EXPIRY_DAYS)
     * Chuyển stake sang `treasury` để tránh reporter giữ stake vô thời hạn.
     */
    function processExpiredReport(uint256 trackId, address reporter) external nonReentrant trackExists(trackId) {
        require(!tracks[trackId].isHidden, "TuneChain: track already hidden");
        require(hasReported[trackId][reporter], "TuneChain: not a reporter");
        require(!stakeProcessed[trackId][reporter], "TuneChain: already processed");
        uint256 ts = reportTimestamp[trackId][reporter];
        require(ts > 0, "TuneChain: no timestamp");
        require(block.timestamp >= ts + REPORT_EXPIRY_DAYS, "TuneChain: not yet expired");

        stakeProcessed[trackId][reporter] = true;
        tuneToken.safeTransfer(treasury, STAKE_AMOUNT);

        emit StakeProcessed(trackId, reporter, STAKE_AMOUNT);
    }

    /**
     * @dev Oracle cập nhật lượt view on-chain từ off-chain database.
     * @param trackId ID bài hát
     * @param newViewCount Tổng lượt view mới (tích lũy)
     */
    function syncViews(uint256 trackId, uint256 newViewCount) external onlyOracle trackExists(trackId) {
        Track storage track = tracks[trackId];
        // Không cho phép giảm view
        require(newViewCount >= track.viewCount, "TuneChain: invalid view count");
        track.viewCount = newViewCount;
        emit ViewsSynced(trackId, newViewCount);
    }

    /**
     * @dev Hàm helper để lấy số lần vi phạm của creator dựa trên các track đã bị ẩn.
     * @param creator Địa chỉ tác giả
     */
    

    /**
     * @dev Lấy thông tin chi tiết một track.
     */
    function getTrack(uint256 trackId) external view returns (Track memory) {
        return tracks[trackId];
    }

    /**
     * @dev Lấy danh sách tất cả track chưa bị ẩn (dùng cho UI).
     */
    function getAllActiveTracks() external view returns (Track[] memory) {
        uint256 activeCount = 0;
        for (uint i = 0; i < tracks.length; i++) {
            if (!tracks[i].isHidden) activeCount++;
        }
        Track[] memory activeTracks = new Track[](activeCount);
        uint256 index = 0;
        for (uint i = 0; i < tracks.length; i++) {
            if (!tracks[i].isHidden) {
                activeTracks[index] = tracks[i];
                index++;
            }
        }
        return activeTracks;
    }

    /**
     * @dev Cập nhật địa chỉ oracle (chỉ owner).
     */
    function setOracle(address newOracle) external onlyOwner {
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    /**
     * @dev Cập nhật treasury (chỉ owner).
     */
    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @dev Fallback: hủy token gửi nhầm (nếu có ai gửi trực tiếp TCT vào contract, có thể rút ra treasury)
     * Thực tế không khuyến khích, nhưng để an toàn.
     */
    function recoverTokens(address tokenAddr, uint256 amount) external onlyOwner {
        require(tokenAddr != address(tuneToken), "TuneChain: cannot recover TCT");
        IERC20(tokenAddr).safeTransfer(owner(), amount);
    }
}