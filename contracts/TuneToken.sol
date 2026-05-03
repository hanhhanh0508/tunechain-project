// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Token ERC20 dùng trong hệ thống TuneChain để tip nhạc sĩ
 * Kế thừa OpenZeppelin ERC20 + Ownable. Chỉ owner mới được mint thêm token.
 */
contract TuneToken is ERC20, Ownable {
    ///Tổng cung ban đầu: 1,000,000 TCT
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    /**
     * Khởi tạo contract, mint toàn bộ INITIAL_SUPPLY cho deployer
     * Deployer trở thành owner (Ownable)
     */
    constructor() ERC20("TuneToken", "TCT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * Mint thêm token — chỉ owner được gọi
     * Dùng để nạp thêm token vào hệ thống khi cần
     * Địa chỉ ví sẽ nhận token được mint ra
     * số lượng token muốn tạo thêm, tính theo đơn vị wei (18 số 0). 
     * Ví dụ muốn mint 100 TCT thì truyền vào 100 * 10^18
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "TuneToken: mint to zero address");
        require(amount > 0, "TuneToken: amount must be > 0");
        _mint(to, amount);
    }
}