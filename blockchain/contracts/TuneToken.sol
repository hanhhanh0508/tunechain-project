// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TuneToken (TCT)
 * @dev ERC-20 token dùng làm đơn vị thanh toán trong hệ thống TuneChain.
 * Chỉ owner (có thể là deployer hoặc multi-sig) mới có quyền mint token phục vụ testing.
 */
contract TuneToken is ERC20, Ownable {
    /**
     * @dev Khởi tạo token với tên "TuneToken" và ký hiệu "TCT".
     * Mint một lượng ban đầu cho owner để phân phối cho người dùng test.
     * @param initialSupply Số lượng token mint ban đầu (có thể 1 triệu TCT với 18 decimals)
     */
    constructor(uint256 initialSupply) ERC20("TuneToken", "TCT") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Mint thêm token (chỉ owner). Dùng để cấp token cho người dùng mới trong môi trường test.
     * @param to Địa chỉ nhận token
     * @param amount Số lượng token mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}