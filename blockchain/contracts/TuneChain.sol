// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TuneChain
 * @dev Nền tảng nhạc phi tập trung: upload track, tip escrow 24h, report hệ thống.
 *
 *  Interface khớp với frontend (contractUtils.ts):
 *   - uploadTrack(ipfsHash, title)         → emit TrackUploaded(trackId, creator, ipfsHash, title)
 *   - tipTrack(trackId, amount)            → emit TrackTipped(tipId, trackId, tipper, amount)
 *   - withdrawTips()                       → rút tất cả escrow đã unlock → emit TipWithdrawn(creator, amount)
 *   - reportTrack(trackId, reason)         → emit TrackReported(reportId, reporter, trackId)
 *   - resolveReport(reportId, removed)     → emit ReportResolved(reportId, removed)
 *                                          nếu removed=true: emit TrackDeactivated(trackId)
 *
 *  Storage khớp:
 *   - tracks(uint) public → Track { trackId, creator, ipfsHash, title, totalTips, isActive, createdAt }
 *   - nextTrackId() public view
 *   - tipRecords(uint) public → TipRecord { tipper, trackId, amount, timestamp }
 *   - reports(uint) public   → Report { reportId, reporter, trackId, reason, resolved, createdAt }
 *   - reportCount(trackId)   → uint256
 */
contract TuneChain is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────
    // Roles
    // ─────────────────────────────────────────────────────────
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ─────────────────────────────────────────────────────────
    // Token
    // ─────────────────────────────────────────────────────────
    IERC20 public tuneToken;

    // ─────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────
    uint256 public constant BASE_UPLOAD_FEE  = 10 * 10**18;  // 10 TCT
    uint256 public constant STAKE_AMOUNT     = 5  * 10**18;  // 5 TCT stake để report
    uint256 public constant ESCROW_DURATION  = 24 hours;      // Khóa tiền 24h trước khi rút

    // ─────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────

    /**
     * @dev Track struct — khớp field với frontend TrackStruct
     * isActive = true  → track đang active (chưa bị ẩn)
     * isActive = false → track bị deactivated bởi admin
     */
    struct Track {
        uint256 trackId;
        address creator;
        string  ipfsHash;       // CID nhạc/metadata trên IPFS
        string  title;          // Tiêu đề bài hát
        uint256 totalTips;      // Tổng token đang trong escrow
        bool    isActive;       // true = còn hoạt động
        uint256 createdAt;      // block.timestamp khi upload
    }

    /**
     * @dev Mỗi lần ai đó tip sẽ tạo 1 TipRecord
     */
    struct TipRecord {
        address tipper;
        uint256 trackId;
        uint256 amount;
        uint256 timestamp;
    }

    /**
     * @dev Mỗi lần report vi phạm sẽ tạo 1 Report
     */
    struct Report {
        uint256 reportId;
        address reporter;
        uint256 trackId;
        string  reason;
        bool    resolved;
        uint256 createdAt;
    }

    // ─────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────
    uint256 public nextTrackId;    // Bắt đầu từ 1, tăng dần khi upload
    uint256 public nextTipId;
    uint256 public nextReportId;

    mapping(uint256 => Track)      public tracks;
    mapping(uint256 => TipRecord)  public tipRecords;
    mapping(uint256 => Report)     public reports;

    // reportCount[trackId] = số lần report chưa resolve
    mapping(uint256 => uint256) public reportCount;

    // escrowBalance[creator] = tổng TCT đang bị khóa escrow chưa đủ 24h
    // escrowUnlockTime[creator] = thời điểm có thể rút (= lastTipTime + 24h)
    mapping(address => uint256) private _escrowBalance;
    mapping(address => uint256) private _escrowUnlockTime;

    address public treasury;

    // ─────────────────────────────────────────────────────────
    // Events — khớp với contractUtils.ts
    // ─────────────────────────────────────────────────────────
    event TrackUploaded(uint256 indexed trackId, address indexed creator, string ipfsHash, string title);
    event TrackTipped(uint256 indexed tipId, uint256 indexed trackId, address indexed tipper, uint256 amount);
    event TipWithdrawn(address indexed creator, uint256 amount);
    event TrackReported(uint256 indexed reportId, address indexed reporter, uint256 indexed trackId);
    event ReportResolved(uint256 indexed reportId, bool removed);
    event TrackDeactivated(uint256 indexed trackId);
    event TreasuryUpdated(address newTreasury);

    // ─────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────
    modifier trackExists(uint256 trackId) {
        require(trackId > 0 && trackId < nextTrackId, "TuneChain: track does not exist");
        _;
    }

    modifier trackActive(uint256 trackId) {
        require(tracks[trackId].isActive, "TuneChain: track is not active");
        _;
    }

    // ─────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────
    /**
     * @param _tokenAddress Địa chỉ TuneToken (TCT)
     * @param _treasury     Địa chỉ nhận phí (upload fee)
     * @param _admins       Danh sách địa chỉ được cấp ADMIN_ROLE
     */
    constructor(
        address _tokenAddress,
        address _treasury,
        address[] memory _admins
    ) {
        tuneToken = IERC20(_tokenAddress);
        treasury  = _treasury;

        // Cấp DEFAULT_ADMIN_ROLE và ADMIN_ROLE cho deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Cấp ADMIN_ROLE cho danh sách admins truyền vào
        for (uint i = 0; i < _admins.length; i++) {
            if (_admins[i] != address(0)) {
                _grantRole(ADMIN_ROLE, _admins[i]);
            }
        }

        nextTrackId  = 1; // Track ID bắt đầu từ 1
        nextTipId    = 1;
        nextReportId = 1;
    }

    // ─────────────────────────────────────────────────────────
    // WRITE — Core business logic
    // ─────────────────────────────────────────────────────────

    /**
     * @notice UC-02: Creator upload bài hát mới.
     * @dev    Trả phí upload BASE_UPLOAD_FEE TCT (chuyển vào treasury).
     *         Người dùng phải approve TuneChain trước khi gọi hàm này.
     * @param ipfsHash CID của file nhạc/metadata trên IPFS
     * @param title    Tiêu đề bài hát hiển thị
     */
    function uploadTrack(string memory ipfsHash, string memory title)
        external
        nonReentrant
    {
        require(bytes(ipfsHash).length > 0, "TuneChain: ipfsHash cannot be empty");
        require(bytes(title).length > 0,    "TuneChain: title cannot be empty");

        // Thu phí upload, chuyển thẳng vào treasury
        tuneToken.safeTransferFrom(msg.sender, treasury, BASE_UPLOAD_FEE);

        uint256 trackId = nextTrackId;
        nextTrackId++;

        tracks[trackId] = Track({
            trackId:   trackId,
            creator:   msg.sender,
            ipfsHash:  ipfsHash,
            title:     title,
            totalTips: 0,
            isActive:  true,
            createdAt: block.timestamp
        });

        emit TrackUploaded(trackId, msg.sender, ipfsHash, title);
    }

    /**
     * @notice UC-04: Listener tip TCT cho tác giả của 1 track.
     * @dev    Token được khóa trong escrow của creator 24h.
     *         Mỗi lần tip mới → reset đồng hồ 24h (lastTipTimestamp của creator).
     *         Người dùng phải approve TuneChain trước khi gọi hàm này.
     * @param trackId ID của bài hát nhận tip
     * @param amount  Số TCT muốn tip (18 decimals)
     */
    function tipTrack(uint256 trackId, uint256 amount)
        external
        trackExists(trackId)
        trackActive(trackId)
        nonReentrant
    {
        require(amount > 0, "TuneChain: amount must be > 0");

        // Lấy token từ ví người tip về contract
        tuneToken.safeTransferFrom(msg.sender, address(this), amount);

        // Ghi nhận TipRecord
        uint256 tipId = nextTipId;
        nextTipId++;
        tipRecords[tipId] = TipRecord({
            tipper:    msg.sender,
            trackId:   trackId,
            amount:    amount,
            timestamp: block.timestamp
        });

        // Cộng vào totalTips của track
        tracks[trackId].totalTips += amount;

        // Cộng vào escrow của creator và reset thời gian unlock
        address creator = tracks[trackId].creator;
        _escrowBalance[creator]    += amount;
        _escrowUnlockTime[creator]  = block.timestamp + ESCROW_DURATION;

        emit TrackTipped(tipId, trackId, msg.sender, amount);
    }

    /**
     * @notice UC-05: Creator rút toàn bộ tips đã unlock khỏi escrow.
     * @dev    Escrow lock 24h tính từ lần tip cuối cùng vào bất kỳ track nào của creator.
     *         Nếu trong 24h có tip mới → đồng hồ reset lại từ đầu.
     *         Chỉ rút được khi không còn track nào của creator đang bị lock.
     */
    function withdrawTips()
        external
        nonReentrant
    {
        uint256 amount = _escrowBalance[msg.sender];
        require(amount > 0, "TuneChain: no tips to withdraw");
        require(
            block.timestamp >= _escrowUnlockTime[msg.sender],
            "TuneChain: escrow still locked (wait 24h after last tip)"
        );

        // Reset trước khi transfer (checks-effects-interactions)
        _escrowBalance[msg.sender]   = 0;
        _escrowUnlockTime[msg.sender] = 0;

        tuneToken.safeTransfer(msg.sender, amount);
        emit TipWithdrawn(msg.sender, amount);
    }

    /**
     * @notice UC-06: Người dùng báo cáo vi phạm bản quyền.
     * @dev    Không cần stake TCT ở phiên bản này (admin resolve thủ công).
     * @param trackId ID của bài hát bị report
     * @param reason  Lý do báo cáo
     */
    function reportTrack(uint256 trackId, string memory reason)
        external
        trackExists(trackId)
        trackActive(trackId)
        nonReentrant
    {
        require(msg.sender != tracks[trackId].creator, "TuneChain: cannot report own track");
        require(bytes(reason).length > 0, "TuneChain: reason cannot be empty");

        uint256 reportId = nextReportId;
        nextReportId++;

        reports[reportId] = Report({
            reportId:  reportId,
            reporter:  msg.sender,
            trackId:   trackId,
            reason:    reason,
            resolved:  false,
            createdAt: block.timestamp
        });

        reportCount[trackId]++;

        emit TrackReported(reportId, msg.sender, trackId);
    }

    /**
     * @notice Admin resolve một report.
     * @dev    Chỉ địa chỉ có ADMIN_ROLE mới gọi được.
     *         Nếu removed = true → deactivate track, tịch thu escrow vào treasury.
     * @param reportId ID của report cần resolve
     * @param removed  true = ẩn track; false = bác bỏ report
     */
    function resolveReport(uint256 reportId, bool removed)
        external
        onlyRole(ADMIN_ROLE)
        nonReentrant
    {
        require(reportId > 0 && reportId < nextReportId, "TuneChain: report does not exist");
        Report storage r = reports[reportId];
        require(!r.resolved, "TuneChain: already resolved");

        r.resolved = true;

        if (removed) {
            uint256 trackId = r.trackId;
            Track storage track = tracks[trackId];
            require(track.isActive, "TuneChain: track already deactivated");
            track.isActive = false;

            // Tịch thu toàn bộ escrow của creator → treasury
            address creator = track.creator;
            uint256 seized  = _escrowBalance[creator];
            if (seized > 0) {
                _escrowBalance[creator]    = 0;
                _escrowUnlockTime[creator] = 0;
                tuneToken.safeTransfer(treasury, seized);
            }

            emit TrackDeactivated(trackId);
        }

        emit ReportResolved(reportId, removed);
    }

    // ─────────────────────────────────────────────────────────
    // READ — View functions
    // ─────────────────────────────────────────────────────────

    /**
     * @dev Lấy thông tin escrow của 1 creator (tiền đang bị lock + thời gian unlock).
     * @param creator Địa chỉ creator
     * @return balance     Số TCT đang trong escrow
     * @return unlockTime  Thời điểm có thể rút (unix timestamp)
     */
    function getEscrowInfo(address creator)
        external
        view
        returns (uint256 balance, uint256 unlockTime)
    {
        return (_escrowBalance[creator], _escrowUnlockTime[creator]);
    }

    /**
     * @dev Kiểm tra creator có thể rút tips ngay bây giờ không.
     */
    function canWithdraw(address creator) external view returns (bool) {
        return (
            _escrowBalance[creator] > 0 &&
            block.timestamp >= _escrowUnlockTime[creator]
        );
    }

    /**
     * @dev Lấy danh sách tất cả track đang active (dùng cho UI).
     *      Vòng lặp O(n) — chỉ dùng cho read-only call, không tốn gas trực tiếp.
     */
    function getAllActiveTracks() external view returns (Track[] memory) {
        uint256 total = nextTrackId - 1;
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (tracks[i].isActive) activeCount++;
        }

        Track[] memory result = new Track[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (tracks[i].isActive) {
                result[idx] = tracks[i];
                idx++;
            }
        }
        return result;
    }

    /**
     * @dev Lấy danh sách trackId của 1 creator (để hiển thị trang profile).
     */
    function getCreatorTracks(address creator)
        external
        view
        returns (uint256[] memory)
    {
        uint256 total = nextTrackId - 1;
        uint256 count = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (tracks[i].creator == creator) count++;
        }

        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (tracks[i].creator == creator) {
                result[idx] = i;
                idx++;
            }
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────

    /**
     * @dev Cập nhật treasury (chỉ DEFAULT_ADMIN_ROLE).
     */
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "TuneChain: zero address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @dev Khẩn cấp: rút token gửi nhầm (không phải TCT) về treasury.
     */
    function recoverTokens(address tokenAddr, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(tokenAddr != address(tuneToken), "TuneChain: cannot recover TCT");
        IERC20(tokenAddr).safeTransfer(treasury, amount);
    }
}