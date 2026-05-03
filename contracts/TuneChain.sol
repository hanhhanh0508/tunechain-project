// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./TuneToken.sol";

/**
 * @title TuneChain
 * @author Mem 1 - Hạnh
 * @notice Hợp đồng chính của nền tảng: upload nhạc, tip, escrow, report vi phạm
 * @dev Skeleton tuần 1 — chỉ định nghĩa struct, mapping, events.
 *      Logic sẽ được bổ sung ở tuần 2.
 *      Dùng AccessControl thay Ownable để cả nhóm 4 người đều có quyền admin.
 */
contract TuneChain is ReentrancyGuard, AccessControl {

    /// @notice Role admin — cả 4 thành viên nhóm đều được cấp
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ─────────────────────────────────────────────
    //  Token
    // ─────────────────────────────────────────────

    /// @notice Địa chỉ TuneToken (TCT) dùng để tip
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
     * @param totalTips Tổng TCT đã được tip cho bài này
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
     * @param amount    Số TCT đã tip
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

    /// @notice Tip thành công
    event TrackTipped(
        uint256 indexed tipId,
        uint256 indexed trackId,
        address indexed tipper,
        uint256 amount
    );

    /// @notice Creator rút tip
    event TipWithdrawn(
        address indexed creator,
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
    //  Placeholder functions (logic ở tuần 2)
    // ─────────────────────────────────────────────

    /// @notice Upload bài hát mới — logic tuần 2
    function uploadTrack(string calldata /*ipfsHash*/, string calldata /*title*/) external {
        revert("TuneChain: not implemented yet");
    }

    /// @notice Tip TCT cho một bài hát — logic tuần 2
    function tipTrack(uint256 /*trackId*/, uint256 /*amount*/) external nonReentrant {
        revert("TuneChain: not implemented yet");
    }

    /// @notice Creator rút tip về ví — logic tuần 2
    function withdrawTips() external nonReentrant {
        revert("TuneChain: not implemented yet");
    }

    /// @notice Báo cáo vi phạm bản quyền — logic tuần 2
    function reportTrack(uint256 /*trackId*/, string calldata /*reason*/) external {
        revert("TuneChain: not implemented yet");
    }

    /// @notice Admin xử lý báo cáo — chỉ ADMIN_ROLE được gọi
    function resolveReport(uint256 /*reportId*/, bool /*removeTrack*/) external onlyRole(ADMIN_ROLE) {
        revert("TuneChain: not implemented yet");
    }
}