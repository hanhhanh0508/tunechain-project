// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./TuneToken.sol";

/**
 * @title TuneChain
 * @author Mem 1 - Hạnh
 * @notice Hợp đồng chính của nền tảng: upload nhạc, tip ETH, escrow 24h, report vi phạm
 * @dev Tuần 3 — uploadTrack, tipTrack (ETH escrow), withdrawTips đã được implement
 */
contract TuneChain is ReentrancyGuard, AccessControl {

    /// @notice Role admin — cả 4 thành viên nhóm đều được cấp
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ─────────────────────────────────────────────
    //  Token
    // ─────────────────────────────────────────────

    /// @notice Địa chỉ TuneToken (TCT) dùng để tip (tuần 2 TCT flow)
    TuneToken public immutable tuneToken;

    // ─────────────────────────────────────────────
    //  Structs
    // ─────────────────────────────────────────────

    /**
     * @notice Thông tin một bài hát được upload lên chuỗi
     * @param trackId   ID duy nhất của bài hát (tăng dần)
     * @param creator   Địa chỉ ví của nhạc sĩ
     * @param ipfsHash  CID trỏ đến file nhạc trên IPFS/Pinata
     * @param title     Tên bài hát
     * @param totalTips Tổng ETH đã được tip (wei)
     * @param isActive  Bài hát còn hiệu lực hay đã bị gỡ
     * @param createdAt Timestamp lúc upload
     */
    struct Track {
        uint256 trackId;
        address creator;
        string  ipfsHash;
        string  title;
        uint256 totalTips;
        bool    isActive;
        uint256 createdAt;
    }

    /**
     * @notice Thông tin một lần tip từ listener đến bài hát
     * @param tipper    Địa chỉ người tip
     * @param trackId   ID bài hát được tip
     * @param amount    Số ETH đã tip (wei)
     * @param timestamp Thời điểm tip
     */
    struct TipRecord {
        address tipper;
        uint256 trackId;
        uint256 amount;
        uint256 timestamp;
    }

    /**
     * @notice Báo cáo vi phạm bản quyền
     * @param reportId   ID báo cáo (tăng dần)
     * @param reporter   Địa chỉ người báo cáo
     * @param trackId    ID bài hát bị tố cáo
     * @param reason     Mô tả lý do vi phạm
     * @param resolved   Đã xử lý xong chưa
     * @param createdAt  Timestamp lúc báo cáo
     */
    struct Report {
        uint256 reportId;
        address reporter;
        uint256 trackId;
        string  reason;
        bool    resolved;
        uint256 createdAt;
    }

    // ─────────────────────────────────────────────
    //  Mappings
    // ─────────────────────────────────────────────

    /// @notice trackId → Track
    mapping(uint256 => Track) public tracks;

    /// @notice tipId → TipRecord
    mapping(uint256 => TipRecord) public tipRecords;

    /// @notice reportId → Report
    mapping(uint256 => Report) public reports;

    /// @notice creator address → danh sách trackId của họ
    mapping(address => uint256[]) public creatorTracks;

    /// @notice trackId → số lần bị report
    mapping(uint256 => uint256) public reportCount;

    // ─────────────────────────────────────────────
    //  Escrow (Tuần 3 — ETH-based tipping)
    // ─────────────────────────────────────────────

    /// @notice trackId → tổng ETH đang giữ trong escrow (chưa rút)
    mapping(uint256 => uint256) public escrowBalance;

    /// @notice trackId → timestamp của lần tip cuối cùng
    mapping(uint256 => uint256) public lastTipTime;

    /// @notice Thời gian khoá escrow (24 giờ)
    uint256 public constant ESCROW_PERIOD = 24 hours;

    // ─────────────────────────────────────────────
    //  Counters
    // ─────────────────────────────────────────────

    uint256 public nextTrackId;
    uint256 public nextTipId;
    uint256 public nextReportId;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    /// @notice Upload bài hát mới
    event TrackUploaded(
        uint256 indexed trackId,
        address indexed creator,
        string  ipfsHash,
        string  title
    );

    /// @notice Tip ETH thành công — escrow 24h
    event TipReceived(
        uint256 indexed trackId,
        uint256 amount,
        address indexed sender
    );

    /// @notice Tip TCT thành công (flow tuần 2)
    event TrackTipped(
        uint256 indexed tipId,
        uint256 indexed trackId,
        address indexed tipper,
        uint256 amount
    );

    /// @notice Creator rút tip ETH thành công
    event TipWithdrawn(
        address indexed creator,
        uint256 indexed trackId,
        uint256 amount
    );

    /// @notice Báo cáo vi phạm được gửi
    event TrackReported(
        uint256 indexed reportId,
        address indexed reporter,
        uint256 indexed trackId
    );

    /// @notice Admin xử lý báo cáo
    event ReportResolved(
        uint256 indexed reportId,
        bool removed
    );

    /// @notice Bài hát bị gỡ khỏi platform
    event TrackDeactivated(uint256 indexed trackId);

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    /**
     * @param _tuneToken Địa chỉ contract TuneToken đã deploy
     * @param _admins    Mảng 4 địa chỉ ví của các thành viên nhóm
     */
    constructor(address _tuneToken, address[] memory _admins) {
        require(_tuneToken != address(0), "TuneChain: zero token address");
        require(_admins.length == 4, "TuneChain: need exactly 4 admins");
        tuneToken = TuneToken(_tuneToken);

        // Cấp DEFAULT_ADMIN_ROLE cho người deploy
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Cấp ADMIN_ROLE cho cả 4 thành viên nhóm
        for (uint256 i = 0; i < _admins.length; i++) {
            require(_admins[i] != address(0), "TuneChain: admin cannot be zero address");
            _grantRole(ADMIN_ROLE, _admins[i]);
        }
    }

    // ─────────────────────────────────────────────
    //  Core Functions — Tuần 3
    // ─────────────────────────────────────────────

    /**
     * @notice Upload bài hát mới lên platform
     * @param ipfsHash CID của file nhạc trên IPFS/Pinata
     * @param title    Tên bài hát (không được rỗng)
     * @dev Gán trackId tăng dần, lưu metadata on-chain, emit TrackUploaded
     */
    function uploadTrack(string calldata ipfsHash, string calldata title) external {
        require(bytes(ipfsHash).length > 0, "TuneChain: ipfsHash cannot be empty");
        require(bytes(title).length > 0, "TuneChain: title cannot be empty");

        uint256 trackId = nextTrackId;

        tracks[trackId] = Track({
            trackId:   trackId,
            creator:   msg.sender,
            ipfsHash:  ipfsHash,
            title:     title,
            totalTips: 0,
            isActive:  true,
            createdAt: block.timestamp
        });

        creatorTracks[msg.sender].push(trackId);
        nextTrackId++;

        emit TrackUploaded(trackId, msg.sender, ipfsHash, title);
    }

    /**
     * @notice Gửi tip ETH cho một bài hát — tiền được giữ trong escrow 24h
     * @param trackId ID bài hát muốn tip
     * @dev msg.value phải > 0; trackId phải hợp lệ và active
     *      Mỗi lần tip mới sẽ reset đồng hồ 24h của escrow
     */
    function tipTrack(uint256 trackId) external payable {
        require(msg.value > 0, "Must send ETH");
        require(trackId < nextTrackId, "Track does not exist");
        require(tracks[trackId].isActive, "Track is not active");

        // Cộng ETH vào escrow của track này
        escrowBalance[trackId] += msg.value;
        // Cập nhật thời gian tip cuối — reset đồng hồ 24h
        lastTipTime[trackId] = block.timestamp;
        // Cập nhật tổng tips trên Track struct
        tracks[trackId].totalTips += msg.value;

        emit TipReceived(trackId, msg.value, msg.sender);
    }

    /**
     * @notice Rút toàn bộ ETH escrow của một bài hát về ví creator
     * @param trackId ID bài hát muốn rút
     * @dev Chỉ creator của track mới được rút; phải đợi ít nhất 24h sau lần tip
     *      cuối cùng; phải có balance > 0
     */
    function withdrawTips(uint256 trackId) external nonReentrant {
        require(trackId < nextTrackId, "Track does not exist");

        Track storage track = tracks[trackId];
        require(track.creator == msg.sender, "Not the artist");
        require(escrowBalance[trackId] > 0, "Nothing to withdraw");
        require(
            block.timestamp >= lastTipTime[trackId] + ESCROW_PERIOD,
            "Escrow period not ended"
        );

        uint256 amount = escrowBalance[trackId];
        escrowBalance[trackId] = 0; // Reset trước khi transfer (reentrancy guard)

        emit TipWithdrawn(msg.sender, trackId, amount);

        // Transfer ETH về ví creator
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    // ─────────────────────────────────────────────
    //  View Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Lấy danh sách tất cả track đang active
     * @return Mảng Track[] chứa tất cả bài hát
     */
    function getAllTracks() external view returns (Track[] memory) {
        uint256 total = nextTrackId;
        Track[] memory result = new Track[](total);
        for (uint256 i = 0; i < total; i++) {
            result[i] = tracks[i];
        }
        return result;
    }

    /**
     * @notice Lấy danh sách trackId của một creator
     * @param creator Địa chỉ creator
     * @return Mảng trackId
     */
    function getCreatorTracks(address creator) external view returns (uint256[] memory) {
        return creatorTracks[creator];
    }

    // ─────────────────────────────────────────────
    //  Admin Functions (placeholder — tuần 4)
    // ─────────────────────────────────────────────

    /// @notice Báo cáo vi phạm bản quyền — logic tuần 4
    function reportTrack(uint256 /*trackId*/, string calldata /*reason*/) external {
        revert("TuneChain: not implemented yet");
    }

    /// @notice Admin xử lý báo cáo — chỉ ADMIN_ROLE được gọi
    function resolveReport(uint256 /*reportId*/, bool /*removeTrack*/) external onlyRole(ADMIN_ROLE) {
        revert("TuneChain: not implemented yet");
    }

    /// @notice Cho phép contract nhận ETH trực tiếp
    receive() external payable {}
}