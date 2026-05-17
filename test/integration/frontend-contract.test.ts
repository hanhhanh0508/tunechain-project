/**
 * test/integration/frontend-contract.test.ts
 * ─────────────────────────────────────────────────────────────
 * Integration Tests: Frontend ↔ Contract
 *
 * Giả lập cách frontend React gọi contract:
 *   - UploadPage: connect MetaMask (Hardhat signer), gọi uploadTrack()
 *   - DashboardPage: gọi withdrawTips() sau 24h, verify balance
 *   - HomePage: gọi getAllTracks(), verify data format
 *
 * Người thực hiện: M4 — Tích hợp + Docs
 * Lệnh chạy: npx hardhat test test/integration/frontend-contract.test.ts
 * ─────────────────────────────────────────────────────────────
 */

import { expect } from "chai";
import { network } from "hardhat";

// Hardhat v3: node ảo riêng cho integration tests
const { ethers } = await network.create();

// ─── Helper: Deploy và khởi tạo môi trường test ──────────────

/**
 * Helper function deployAndSetup — dùng chung cho tất cả integration tests
 * Giả lập bước "user mở browser → MetaMask connect → lấy signer"
 *
 * @returns contract, owner, artist (signer giả MetaMask), fan, stranger
 */
async function deployAndSetup() {
    const [owner, artist, fan, admin2, admin3, stranger] = await ethers.getSigners();

    // Bước 1: Deploy TuneToken (giả lập đã có trên chain)
    const TuneTokenFactory = await ethers.getContractFactory("TuneToken");
    const tuneToken = await TuneTokenFactory.deploy();
    await tuneToken.waitForDeployment();

    // Bước 2: Deploy TuneChain (giả lập contract đã deploy trên Hardhat node)
    const TuneChain = await ethers.getContractFactory("TuneChain");
    const contract = await TuneChain.deploy(
        await tuneToken.getAddress(),
        [owner.address, artist.address, admin2.address, admin3.address]
    );
    await contract.waitForDeployment();

    return { contract, tuneToken, owner, artist, fan, admin2, admin3, stranger };
}

// ─────────────────────────────────────────────────────────────
//  INTEGRATION TEST SUITE
// ─────────────────────────────────────────────────────────────

describe("TuneChain — Integration Tests: Frontend ↔ Contract", function () {

    // ══════════════════════════════════════════════════════════
    //  NHÓM 1: UploadPage Integration
    //  Giả lập người dùng mở /upload, điền form, nhấn Upload
    //  Frontend dùng ethers.js gọi contract.uploadTrack()
    // ══════════════════════════════════════════════════════════
    describe("UploadPage Integration", function () {

        // ── INT-UP-01: Upload thành công, nhận txHash ─────────
        it("INT-UP-01: ✅ uploadTrack() → trả về transaction hash hợp lệ", async function () {
            const { contract, artist } = await deployAndSetup();

            // Giả lập: frontend gọi contract.uploadTrack() với signer từ MetaMask
            const tx = await contract
                .connect(artist)         // ← MetaMask signer (Hardhat account[1])
                .uploadTrack("QmHashFrontendTest123", "My UI Track");

            // Frontend nhận txHash — kiểm tra định dạng hợp lệ (66 ký tự: 0x + 64 hex)
            expect(tx.hash).to.match(/^0x[0-9a-fA-F]{64}$/);

            const receipt = await tx.wait();
            expect(receipt).to.not.be.null;
            expect(receipt!.status).to.equal(1); // 1 = success
        });

        // ── INT-UP-02: Event TrackUploaded với đúng data ──────
        it("INT-UP-02: ✅ uploadTrack() → emit TrackUploaded với đúng data", async function () {
            const { contract, artist } = await deployAndSetup();

            // Giả lập: UploadPage gọi contract sau khi nhận CID từ Pinata
            const pinataHash = "QmPinataReturnedCID987654";
            const title = "Bài Hát Từ Frontend";

            await expect(
                contract.connect(artist).uploadTrack(pinataHash, title)
            )
                .to.emit(contract, "TrackUploaded")
                .withArgs(0n, artist.address, pinataHash, title);
        });

        // ── INT-UP-03: trackId trả về đúng để frontend navigate ─
        it("INT-UP-03: ✅ Sau upload, frontend đọc nextTrackId để điều hướng", async function () {
            const { contract, artist } = await deployAndSetup();

            // nextTrackId trước upload
            const idBefore = await contract.nextTrackId();
            expect(idBefore).to.equal(0n);

            await contract.connect(artist).uploadTrack("QmHashNav", "Nav Track");

            // nextTrackId sau upload — frontend dùng để navigate /track/0
            const idAfter = await contract.nextTrackId();
            expect(idAfter).to.equal(1n);
        });

        // ── INT-UP-04: Validation — ipfsHash rỗng ────────────
        it("INT-UP-04: ❌ Frontend gọi uploadTrack với hash rỗng → revert (dễ bắt trong try-catch)", async function () {
            const { contract, artist } = await deployAndSetup();

            // Frontend nên validate trước, nhưng nếu không → contract revert
            await expect(
                contract.connect(artist).uploadTrack("", "Bài Lỗi")
            ).to.be.revertedWith("TuneChain: ipfsHash cannot be empty");
        });
    });

    // ══════════════════════════════════════════════════════════
    //  NHÓM 2: DashboardPage Integration
    //  Giả lập artist mở /dashboard, xem số dư, nhấn "Rút tiền"
    //  Frontend đọc escrowBalance rồi gọi contract.withdrawTips()
    // ══════════════════════════════════════════════════════════
    describe("DashboardPage Integration", function () {

        // ── INT-DB-01: Đọc escrowBalance rồi rút thành công ──
        it("INT-DB-01: ✅ Frontend đọc escrowBalance → hiển thị → rút sau 24h", async function () {
            const { contract, artist, fan } = await deployAndSetup();

            // Setup: upload + tip
            await contract.connect(artist).uploadTrack("QmHash", "Dashboard Track");
            await contract.connect(fan).tipTrack(0n, { value: ethers.parseEther("0.25") });

            // Frontend đọc escrowBalance để hiển thị UI
            const escrowAmountWei = await contract.escrowBalance(0n);
            const escrowAmountEth = ethers.formatEther(escrowAmountWei);
            expect(escrowAmountEth).to.equal("0.25");

            // Advance 24h
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            // Frontend gọi withdrawTips() khi artist nhấn nút Rút tiền
            const artistBalanceBefore = await ethers.provider.getBalance(artist.address);
            const tx = await contract.connect(artist).withdrawTips(0n);
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

            const artistBalanceAfter = await ethers.provider.getBalance(artist.address);

            // UI nhận được đúng amount: balance tăng 0.25 ETH (trừ gas)
            const expectedIncrease = ethers.parseEther("0.25") - gasUsed;
            expect(artistBalanceAfter).to.equal(artistBalanceBefore + expectedIncrease);
        });

        // ── INT-DB-02: Dashboard hiển thị "Chưa đủ 24h" ──────
        it("INT-DB-02: ❌ Rút trước 24h → revert (frontend bắt lỗi hiển thị countdown)", async function () {
            const { contract, artist, fan } = await deployAndSetup();

            await contract.connect(artist).uploadTrack("QmHash", "New Song");
            await contract.connect(fan).tipTrack(0n, { value: ethers.parseEther("0.1") });

            // Frontend nên check thời gian còn lại
            const lastTip = await contract.lastTipTime(0n);
            const now = BigInt(Math.floor(Date.now() / 1000));
            // Thời gian unlock = lastTip + 24h
            const unlockTime = lastTip + BigInt(86400);

            // Gọi sớm → revert
            await expect(
                contract.connect(artist).withdrawTips(0n)
            ).to.be.revertedWith("Escrow period not ended");
        });

        // ── INT-DB-03: Không có tiền để rút ──────────────────
        it("INT-DB-03: ❌ Withdraw khi balance = 0 → revert (UI ẩn nút Rút tiền)", async function () {
            const { contract, artist } = await deployAndSetup();

            await contract.connect(artist).uploadTrack("QmHash", "No Tips Song");

            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            await expect(
                contract.connect(artist).withdrawTips(0n)
            ).to.be.revertedWith("Nothing to withdraw");
        });
    });

    // ══════════════════════════════════════════════════════════
    //  NHÓM 3: HomePage Integration
    //  Giả lập trang chủ đọc danh sách track để hiển thị feed
    //  Frontend gọi contract.getAllTracks()
    // ══════════════════════════════════════════════════════════
    describe("HomePage Integration", function () {

        // ── INT-HP-01: getAllTracks() trả về đúng format ──────
        it("INT-HP-01: ✅ getAllTracks() → data đúng format { trackId, ipfsHash, title, artist, totalTips }", async function () {
            const { contract, artist, fan } = await deployAndSetup();

            // Setup: 2 track
            await contract.connect(artist).uploadTrack("QmHash001", "Bài Đầu Tiên");
            await contract.connect(fan).uploadTrack("QmHash002", "Bài Thứ Hai");

            // Thêm tip để totalTips > 0
            await contract.connect(fan).tipTrack(0n, { value: ethers.parseEther("0.05") });

            // Frontend gọi getAllTracks() để render danh sách
            const allTracks = await contract.getAllTracks();

            // Kiểm tra số lượng
            expect(allTracks.length).to.equal(2);

            // Kiểm tra format của track[0]
            const track0 = allTracks[0];
            expect(track0.trackId).to.equal(0n);
            expect(track0.ipfsHash).to.equal("QmHash001");
            expect(track0.title).to.equal("Bài Đầu Tiên");
            expect(track0.creator).to.equal(artist.address);    // artist field
            expect(track0.totalTips).to.equal(ethers.parseEther("0.05"));
            expect(track0.isActive).to.be.true;

            // Kiểm tra format của track[1]
            const track1 = allTracks[1];
            expect(track1.trackId).to.equal(1n);
            expect(track1.ipfsHash).to.equal("QmHash002");
            expect(track1.title).to.equal("Bài Thứ Hai");
            expect(track1.creator).to.equal(fan.address);       // fan là creator của track 1
            expect(track1.totalTips).to.equal(0n);              // chưa có tip
        });

        // ── INT-HP-02: Feed rỗng khi chưa có track ───────────
        it("INT-HP-02: ✅ getAllTracks() trả về [] khi platform chưa có track nào", async function () {
            const { contract } = await deployAndSetup();

            const allTracks = await contract.getAllTracks();
            expect(allTracks.length).to.equal(0);

            // Frontend nên render trạng thái "Chưa có bài hát nào"
        });

        // ── INT-HP-03: creatorTracks — filter theo artist ─────
        it("INT-HP-03: ✅ getCreatorTracks() → frontend filter track của một artist", async function () {
            const { contract, artist, fan } = await deployAndSetup();

            // Artist upload 2 bài, fan upload 1 bài
            await contract.connect(artist).uploadTrack("QmHash001", "Artist Song 1");
            await contract.connect(fan).uploadTrack("QmHash002", "Fan Song 1");
            await contract.connect(artist).uploadTrack("QmHash003", "Artist Song 2");

            // Frontend dùng getCreatorTracks() để lọc track của artist
            const artistTracks = await contract.getCreatorTracks(artist.address);
            const fanTracks = await contract.getCreatorTracks(fan.address);

            expect(artistTracks.length).to.equal(2);
            expect(fanTracks.length).to.equal(1);
            expect(artistTracks[0]).to.equal(0n); // trackId 0
            expect(artistTracks[1]).to.equal(2n); // trackId 2
            expect(fanTracks[0]).to.equal(1n);    // trackId 1
        });

        // ── INT-HP-04: totalTips cập nhật sau nhiều lần tip ───
        it("INT-HP-04: ✅ totalTips trong getAllTracks() cập nhật đúng sau tip", async function () {
            const { contract, artist, fan, stranger } = await deployAndSetup();

            await contract.connect(artist).uploadTrack("QmHash", "Hot Song");

            // Fan và stranger cùng tip
            await contract.connect(fan).tipTrack(0n, { value: ethers.parseEther("0.1") });
            await contract.connect(stranger).tipTrack(0n, { value: ethers.parseEther("0.2") });

            const allTracks = await contract.getAllTracks();
            // totalTips = 0.1 + 0.2 = 0.3 ETH
            expect(allTracks[0].totalTips).to.equal(ethers.parseEther("0.3"));
        });
    });
});
