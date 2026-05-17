/**
 * test/e2e/fullFlow.test.ts
 * ─────────────────────────────────────────────────────────────
 * End-to-End Test: Upload → Tip → Withdraw
 *
 * Mô phỏng toàn bộ quy trình thực tế của TuneChain:
 *   1. Deploy contract
 *   2. Artist upload track
 *   3. Fan tip ETH (escrow 24h)
 *   4. Thử rút ngay → expect revert
 *   5. Tăng thời gian 24h+1s
 *   6. Artist rút thành công
 *   7. Kiểm tra: contract balance = 0, artist balance tăng
 *
 * Người thực hiện: M4 — Tích hợp + Docs
 * Lệnh chạy: npx hardhat test test/e2e/fullFlow.test.ts
 * ─────────────────────────────────────────────────────────────
 */

import { expect } from "chai";
import { network } from "hardhat";

// Hardhat v3: mỗi test suite có node ảo riêng biệt
const { ethers } = await network.create();

// ─── Hằng số ─────────────────────────────────────────────────
const TIP_AMOUNT = ethers.parseEther("0.1");   // 0.1 ETH
const TWENTY_FOUR_HOURS_PLUS = 86401;           // 24h + 1 giây

// ─────────────────────────────────────────────────────────────
//  E2E FLOW TEST
// ─────────────────────────────────────────────────────────────

describe("TuneChain — E2E: Upload → Tip → Withdraw", function () {

    // ══════════════════════════════════════════════════════════
    //  FLOW CHÍNH: Toàn bộ quy trình từ đầu đến cuối
    // ══════════════════════════════════════════════════════════
    describe("Full Flow: Upload → Tip → Wait 24h → Withdraw", function () {

        it("E2E-01: Toàn bộ luồng chạy đúng và contract balance về 0", async function () {
            // ── Bước 1: Deploy contract ────────────────────────
            const signers = await ethers.getSigners();
            const [owner, artist, fan, admin2, admin3] = signers;

            const TuneTokenFactory = await ethers.getContractFactory("TuneToken");
            const tuneToken = await TuneTokenFactory.deploy();
            await tuneToken.waitForDeployment();

            const TuneChainFactory = await ethers.getContractFactory("TuneChain");
            const contract = await TuneChainFactory.deploy(
                await tuneToken.getAddress(),
                [owner.address, artist.address, admin2.address, admin3.address]
            );
            await contract.waitForDeployment();

            const contractAddress = await contract.getAddress();

            // ── Bước 2: Artist upload track ───────────────────
            const uploadTx = await contract
                .connect(artist)
                .uploadTrack("QmHash123", "My Song");

            await expect(uploadTx)
                .to.emit(contract, "TrackUploaded")
                .withArgs(0n, artist.address, "QmHash123", "My Song");

            // Lấy trackId vừa upload
            const track = await contract.tracks(0n);
            expect(track.trackId).to.equal(0n);

            // ── Bước 3: Fan tip ETH cho trackId = 0 ──────────
            const tipTx = await contract
                .connect(fan)
                .tipTrack(0n, { value: TIP_AMOUNT });

            await expect(tipTx)
                .to.emit(contract, "TipReceived")
                .withArgs(0n, TIP_AMOUNT, fan.address);

            // ── Bước 4: Kiểm tra contract balance tăng 0.1 ETH
            const contractBalanceAfterTip = await ethers.provider.getBalance(contractAddress);
            expect(contractBalanceAfterTip).to.equal(TIP_AMOUNT);
            expect(await contract.escrowBalance(0n)).to.equal(TIP_AMOUNT);

            // ── Bước 5: Thử rút ngay → expect revert ─────────
            await expect(
                contract.connect(artist).withdrawTips(0n)
            ).to.be.revertedWith("Escrow period not ended");

            // ── Bước 6: Tăng thời gian 24h + 1 giây ──────────
            await ethers.provider.send("evm_increaseTime", [TWENTY_FOUR_HOURS_PLUS]);
            await ethers.provider.send("evm_mine");

            // ── Bước 7: Rút thành công sau 24h ────────────────
            const artistBalanceBefore = await ethers.provider.getBalance(artist.address);

            const withdrawTx = await contract.connect(artist).withdrawTips(0n);
            const withdrawReceipt = await withdrawTx.wait();
            const gasUsed = withdrawReceipt!.gasUsed * withdrawReceipt!.gasPrice;

            await expect(withdrawTx)
                .to.emit(contract, "TipWithdrawn")
                .withArgs(artist.address, 0n, TIP_AMOUNT);

            // ── Bước 8: Kiểm tra kết quả cuối ────────────────
            // Contract balance phải về 0
            const contractBalanceFinal = await ethers.provider.getBalance(contractAddress);
            expect(contractBalanceFinal).to.equal(0n);

            // Artist balance phải tăng đúng 0.1 ETH (trừ gas)
            const artistBalanceAfter = await ethers.provider.getBalance(artist.address);
            expect(artistBalanceAfter).to.equal(
                artistBalanceBefore + TIP_AMOUNT - gasUsed
            );

            // escrowBalance phải về 0
            expect(await contract.escrowBalance(0n)).to.equal(0n);
        });

        // ══════════════════════════════════════════════════════
        //  E2E-02: Nhiều fan tip, artist rút một lần
        // ══════════════════════════════════════════════════════
        it("E2E-02: Nhiều fan tip tích lũy → artist rút một lần nhận đủ", async function () {
            const signers = await ethers.getSigners();
            const [owner, artist, fan1, fan2, admin2, admin3] = signers;

            // Deploy
            const TuneTokenFactory = await ethers.getContractFactory("TuneToken");
            const tuneToken = await TuneTokenFactory.deploy();
            await tuneToken.waitForDeployment();

            const TuneChainFactory = await ethers.getContractFactory("TuneChain");
            const contract = await TuneChainFactory.deploy(
                await tuneToken.getAddress(),
                [owner.address, artist.address, admin2.address, admin3.address]
            );
            await contract.waitForDeployment();

            // Artist upload track
            await contract.connect(artist).uploadTrack("QmHashPopular", "Popular Song");

            // Fan1 tip 0.1 ETH
            await contract.connect(fan1).tipTrack(0n, { value: ethers.parseEther("0.1") });
            // Fan2 tip 0.2 ETH
            await contract.connect(fan2).tipTrack(0n, { value: ethers.parseEther("0.2") });

            // Tổng escrow: 0.3 ETH
            expect(await contract.escrowBalance(0n)).to.equal(ethers.parseEther("0.3"));

            // Advance 24h
            await ethers.provider.send("evm_increaseTime", [TWENTY_FOUR_HOURS_PLUS]);
            await ethers.provider.send("evm_mine");

            // Artist rút tất cả một lần
            await contract.connect(artist).withdrawTips(0n);

            // Contract về 0
            const contractBalance = await ethers.provider.getBalance(
                await contract.getAddress()
            );
            expect(contractBalance).to.equal(0n);
            expect(await contract.escrowBalance(0n)).to.equal(0n);
        });

        // ══════════════════════════════════════════════════════
        //  E2E-03: Reset đồng hồ 24h khi có tip mới
        // ══════════════════════════════════════════════════════
        it("E2E-03: Tip mới sau 23h → reset đồng hồ → phải đợi thêm 24h", async function () {
            const signers = await ethers.getSigners();
            const [owner, artist, fan, admin2, admin3] = signers;

            // Deploy
            const TuneTokenFactory = await ethers.getContractFactory("TuneToken");
            const tuneToken = await TuneTokenFactory.deploy();
            await tuneToken.waitForDeployment();

            const TuneChainFactory = await ethers.getContractFactory("TuneChain");
            const contract = await TuneChainFactory.deploy(
                await tuneToken.getAddress(),
                [owner.address, artist.address, admin2.address, admin3.address]
            );
            await contract.waitForDeployment();

            await contract.connect(artist).uploadTrack("QmHash", "Clock Reset Song");

            // Tip lần 1
            await contract.connect(fan).tipTrack(0n, { value: ethers.parseEther("0.05") });

            // Advance 23 giờ
            await ethers.provider.send("evm_increaseTime", [23 * 3600]);
            await ethers.provider.send("evm_mine");

            // Tip lần 2 → reset đồng hồ về 0
            await contract.connect(fan).tipTrack(0n, { value: ethers.parseEther("0.05") });

            // Advance thêm 2 giờ (23+2=25h từ tip 1, nhưng chỉ 2h từ tip 2)
            await ethers.provider.send("evm_increaseTime", [2 * 3600]);
            await ethers.provider.send("evm_mine");

            // Vẫn chưa đủ 24h từ tip 2 → revert
            await expect(
                contract.connect(artist).withdrawTips(0n)
            ).to.be.revertedWith("Escrow period not ended");
        });
    });
});
