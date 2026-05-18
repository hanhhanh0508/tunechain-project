/**
 * test/integration.test.ts
 * ─────────────────────────────────────────────────────────────
 * Integration test cho TuneChain — kiểm tra deploy thành công
 * (tuần 1: skeleton với revert "not implemented yet")
 *
 * Các test case:
 *   TC-INT-01: Deploy TuneToken + TuneChain không lỗi
 *   TC-INT-02: tuneToken address đúng với TuneToken đã deploy
 *   TC-INT-03: 4 admin có ADMIN_ROLE
 *   TC-INT-04: nextTrackId == 0 (state khởi tạo đúng)
 *   TC-INT-05: uploadTrack() revert đúng message skeleton
 *   TC-INT-06: tipTrack() revert đúng message skeleton
 *   TC-INT-07: withdrawTips() revert đúng message skeleton
 *
 * Lệnh chạy:
 *   npx hardhat test test/integration.test.ts
 *   (hoặc: npx hardhat test test/integration.test.ts --network hardhatMainnet)
 *
 * Người thực hiện: M4 — Tích hợp + Docs
 * ─────────────────────────────────────────────────────────────
 */

import { expect } from "chai";
import { network } from "hardhat";

// ── Hardhat v3: tạo network instance riêng cho test suite ─────
// Khác với Hardhat v2 (dùng hre.ethers), v3 dùng network.create()
// để tạo một node ảo độc lập cho mỗi describe block.
const { ethers } = await network.create();

// ── Hằng số ───────────────────────────────────────────────────

/** Hash của ADMIN_ROLE trong TuneChain (keccak256("ADMIN_ROLE")) */
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

/** Message revert khi gọi hàm chưa implement ở tuần 1 */
const NOT_IMPLEMENTED = "TuneChain: not implemented yet";

// ── Helper: deploy cả 2 contract ─────────────────────────────

/**
 * Deploy TuneToken trước, sau đó deploy TuneChain với 4 admin.
 * Dùng 4 account đầu tiên từ Hardhat test accounts làm admin.
 */
async function deployContracts() {
    // Lấy danh sách signer từ Hardhat (mặc định 20 accounts)
    const signers = await ethers.getSigners();

    // account[0] = artist/deployer, account[1] = listener,
    // account[2] = admin3, account[3] = admin4
    const [deployer, listener, admin2, admin3, ...rest] = signers;

    // ── Bước 1: Deploy TuneToken ──────────────────────────────
    const TuneTokenFactory = await ethers.getContractFactory("TuneToken");
    const tuneToken = await TuneTokenFactory.deploy();
    await tuneToken.waitForDeployment();

    // ── Bước 2: Deploy TuneChain ──────────────────────────────
    // Constructor yêu cầu đúng 4 admin address (BR từ require())
    const admins: string[] = [
        deployer.address,  // admin[0] — deployer / artist
        listener.address,  // admin[1] — listener (cũng là admin trong test)
        admin2.address,    // admin[2]
        admin3.address,    // admin[3]
    ];

    const TuneChainFactory = await ethers.getContractFactory("TuneChain");
    const tuneChain = await TuneChainFactory.deploy(
        await tuneToken.getAddress(), // _tuneToken
        admins                        // _admins (4 phần tử)
    );
    await tuneChain.waitForDeployment();

    return {
        tuneToken,
        tuneChain,
        deployer,
        listener,
        admin2,
        admin3,
        admins,
    };
}

// ─────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────

describe("TuneChain — Integration Test (Skeleton Tuần 1)", function () {

    // ── Nhóm 1: Deploy ──────────────────────────────────────────
    describe("TC-INT-01 — Deploy thành công", function () {
        it("TuneToken deploy không lỗi, có địa chỉ hợp lệ", async function () {
            const { tuneToken } = await deployContracts();
            const addr = await tuneToken.getAddress();

            // Địa chỉ hợp lệ: 20 bytes = 42 ký tự hex bắt đầu bằng 0x
            expect(addr).to.match(/^0x[0-9a-fA-F]{40}$/);
            expect(addr).to.not.equal(ethers.ZeroAddress);
        });

        it("TuneChain deploy không lỗi, có địa chỉ hợp lệ", async function () {
            const { tuneChain } = await deployContracts();
            const addr = await tuneChain.getAddress();

            expect(addr).to.match(/^0x[0-9a-fA-F]{40}$/);
            expect(addr).to.not.equal(ethers.ZeroAddress);
        });
    });

    // ── Nhóm 2: Kiểm tra địa chỉ TuneToken ─────────────────────
    describe("TC-INT-02 — tuneToken address đúng", function () {
        it("tuneChain.tuneToken() trả về địa chỉ của TuneToken đã deploy", async function () {
            const { tuneToken, tuneChain } = await deployContracts();

            const storedTokenAddr = await tuneChain.tuneToken();
            const actualTokenAddr = await tuneToken.getAddress();

            // Địa chỉ lưu trong contract phải khớp với TuneToken đã deploy
            expect(storedTokenAddr.toLowerCase()).to.equal(actualTokenAddr.toLowerCase());
        });
    });

    // ── Nhóm 3: Kiểm tra ADMIN_ROLE ────────────────────────────
    describe("TC-INT-03 — 4 admin có ADMIN_ROLE", function () {
        it("admin[0] (deployer) có ADMIN_ROLE", async function () {
            const { tuneChain, deployer } = await deployContracts();
            expect(await tuneChain.hasRole(ADMIN_ROLE, deployer.address)).to.be.true;
        });

        it("admin[1] (listener) có ADMIN_ROLE", async function () {
            const { tuneChain, listener } = await deployContracts();
            expect(await tuneChain.hasRole(ADMIN_ROLE, listener.address)).to.be.true;
        });

        it("admin[2] có ADMIN_ROLE", async function () {
            const { tuneChain, admin2 } = await deployContracts();
            expect(await tuneChain.hasRole(ADMIN_ROLE, admin2.address)).to.be.true;
        });

        it("admin[3] có ADMIN_ROLE", async function () {
            const { tuneChain, admin3 } = await deployContracts();
            expect(await tuneChain.hasRole(ADMIN_ROLE, admin3.address)).to.be.true;
        });

        it("Địa chỉ ngẫu nhiên (account[5]) KHÔNG có ADMIN_ROLE", async function () {
            const { tuneChain } = await deployContracts();
            const signers = await ethers.getSigners();
            const stranger = signers[5];

            expect(await tuneChain.hasRole(ADMIN_ROLE, stranger.address)).to.be.false;
        });
    });

    // ── Nhóm 4: State khởi tạo ──────────────────────────────────
    describe("TC-INT-04 — State khởi tạo đúng", function () {
        it("nextTrackId == 0 sau khi deploy", async function () {
            const { tuneChain } = await deployContracts();
            expect(await tuneChain.nextTrackId()).to.equal(0n);
        });

        it("nextTipId == 0 sau khi deploy", async function () {
            const { tuneChain } = await deployContracts();
            expect(await tuneChain.nextTipId()).to.equal(0n);
        });

        it("nextReportId == 0 sau khi deploy", async function () {
            const { tuneChain } = await deployContracts();
            expect(await tuneChain.nextReportId()).to.equal(0n);
        });
    });

    // Các skeleton tests đã được loại bỏ vì hợp đồng đã được implement thực tế ở tuần 3

    // ── Nhóm 8: Constructor validation ──────────────────────────
    describe("TC-INT-08 — Constructor validation", function () {
        it("Deploy với zero address cho TuneToken phải revert", async function () {
            const TuneChainFactory = await ethers.getContractFactory("TuneChain");
            const signers = await ethers.getSigners();

            await expect(
                TuneChainFactory.deploy(
                    ethers.ZeroAddress, // _tuneToken = address(0) → phải revert
                    [
                        signers[0].address,
                        signers[1].address,
                        signers[2].address,
                        signers[3].address,
                    ]
                )
            ).to.be.revertedWith("TuneChain: zero token address");
        });

        it("Deploy với ít hơn 4 admin phải revert", async function () {
            const TuneTokenFactory = await ethers.getContractFactory("TuneToken");
            const tuneToken = await TuneTokenFactory.deploy();
            await tuneToken.waitForDeployment();

            const TuneChainFactory = await ethers.getContractFactory("TuneChain");
            const signers = await ethers.getSigners();

            await expect(
                TuneChainFactory.deploy(
                    await tuneToken.getAddress(),
                    [signers[0].address, signers[1].address, signers[2].address] // chỉ 3 admin
                )
            ).to.be.revertedWith("TuneChain: need exactly 4 admins");
        });
    });
});
