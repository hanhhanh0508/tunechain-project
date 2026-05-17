/**
 * test/TuneChain.test.ts
 * ─────────────────────────────────────────────────────────────
 * Unit tests cho TuneChain — Tuần 3
 * Bao gồm 3 hàm mới: uploadTrack, tipTrack, withdrawTips
 *
 * Người thực hiện: M4 — Tích hợp + Docs
 * Lệnh chạy:
 *   npx hardhat test test/TuneChain.test.ts
 * ─────────────────────────────────────────────────────────────
 */

import { expect } from "chai";
import { network } from "hardhat";

// Hardhat v3: tạo node ảo độc lập cho test suite này
const { ethers } = await network.create();

// ─── Hằng số ─────────────────────────────────────────────────
const ONE_ETH = ethers.parseEther("1.0");
const HALF_ETH = ethers.parseEther("0.5");
const TWENTY_FOUR_HOURS = 86400;

// ─── Helper: deploy TuneToken + TuneChain ────────────────────

/**
 * Deploy cả hai contract với 4 admin mặc định.
 * Trả về: contract, artist (account[1]), fan (account[2]), stranger (account[5])
 */
async function deployContracts() {
    const signers = await ethers.getSigners();
    const [owner, artist, fan, admin2, admin3, stranger] = signers;

    // Deploy TuneToken
    const TuneTokenFactory = await ethers.getContractFactory("TuneToken");
    const tuneToken = await TuneTokenFactory.deploy();
    await tuneToken.waitForDeployment();

    // Deploy TuneChain với 4 admin
    const TuneChainFactory = await ethers.getContractFactory("TuneChain");
    const tuneChain = await TuneChainFactory.deploy(
        await tuneToken.getAddress(),
        [owner.address, artist.address, admin2.address, admin3.address]
    );
    await tuneChain.waitForDeployment();

    return { tuneChain, tuneToken, owner, artist, fan, admin2, admin3, stranger };
}

// ─────────────────────────────────────────────────────────────
//  TEST SUITE CHÍNH
// ─────────────────────────────────────────────────────────────

describe("TuneChain — Unit Tests Tuần 3", function () {

    // ══════════════════════════════════════════════════════════
    //  NHÓM 1: uploadTrack()
    //  Kiểm tra upload bài hát: thành công, trackId, validation
    // ══════════════════════════════════════════════════════════
    describe("uploadTrack()", function () {

        // ── TC-UT-01: Upload thành công ──────────────────────
        it("TC-UT-01: Upload thành công → emit event TrackUploaded với đúng data", async function () {
            const { tuneChain, artist } = await deployContracts();

            const tx = await tuneChain
                .connect(artist)
                .uploadTrack("QmHash123456789", "My First Song");

            // Kiểm tra event TrackUploaded được emit đúng tham số
            await expect(tx)
                .to.emit(tuneChain, "TrackUploaded")
                .withArgs(0n, artist.address, "QmHash123456789", "My First Song");
        });

        // ── TC-UT-02: trackId tăng đúng ─────────────────────
        it("TC-UT-02: trackId tăng đúng sau mỗi lần upload", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            // Upload bài 1 (trackId = 0)
            await tuneChain.connect(artist).uploadTrack("QmHash001", "Song One");
            expect(await tuneChain.nextTrackId()).to.equal(1n);

            // Upload bài 2 (trackId = 1)
            await tuneChain.connect(fan).uploadTrack("QmHash002", "Song Two");
            expect(await tuneChain.nextTrackId()).to.equal(2n);

            // Kiểm tra creator được lưu đúng
            const track0 = await tuneChain.tracks(0n);
            const track1 = await tuneChain.tracks(1n);
            expect(track0.creator).to.equal(artist.address);
            expect(track1.creator).to.equal(fan.address);
        });

        // ── TC-UT-03: Metadata được lưu đúng ────────────────
        it("TC-UT-03: Metadata track được lưu đúng on-chain", async function () {
            const { tuneChain, artist } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHashABC", "Test Track");

            const track = await tuneChain.tracks(0n);
            expect(track.trackId).to.equal(0n);
            expect(track.creator).to.equal(artist.address);
            expect(track.ipfsHash).to.equal("QmHashABC");
            expect(track.title).to.equal("Test Track");
            expect(track.totalTips).to.equal(0n);
            expect(track.isActive).to.be.true;
        });

        // ── TC-UT-04: Revert khi ipfsHash rỗng ──────────────
        it("TC-UT-04: ❌ Upload với ipfsHash rỗng → revert", async function () {
            const { tuneChain, artist } = await deployContracts();

            await expect(
                tuneChain.connect(artist).uploadTrack("", "Valid Title")
            ).to.be.revertedWith("TuneChain: ipfsHash cannot be empty");
        });

        // ── TC-UT-05: Revert khi title rỗng ─────────────────
        it("TC-UT-05: ❌ Upload với title rỗng → revert", async function () {
            const { tuneChain, artist } = await deployContracts();

            await expect(
                tuneChain.connect(artist).uploadTrack("QmValidHash123", "")
            ).to.be.revertedWith("TuneChain: title cannot be empty");
        });
    });

    // ══════════════════════════════════════════════════════════
    //  NHÓM 2: tipTrack()
    //  Kiểm tra tip ETH: escrow, event, validation đầu vào
    // ══════════════════════════════════════════════════════════
    describe("tipTrack()", function () {

        // ── TC-TT-01: Tip thành công, ETH được giữ trong contract ─
        it("TC-TT-01: ✅ Tip thành công → ETH được giữ trong contract (escrow)", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            // Artist upload bài hát
            await tuneChain.connect(artist).uploadTrack("QmHash123", "Favorite Song");

            const contractAddr = await tuneChain.getAddress();
            const balanceBefore = await ethers.provider.getBalance(contractAddr);

            // Fan tip 0.5 ETH cho trackId = 0
            await tuneChain.connect(fan).tipTrack(0n, { value: HALF_ETH });

            const balanceAfter = await ethers.provider.getBalance(contractAddr);
            // Contract phải giữ đúng 0.5 ETH
            expect(balanceAfter - balanceBefore).to.equal(HALF_ETH);
            // escrowBalance của track phải đúng
            expect(await tuneChain.escrowBalance(0n)).to.equal(HALF_ETH);
        });

        // ── TC-TT-02: Emit event TipReceived đúng args ───────
        it("TC-TT-02: ✅ Emit event TipReceived với đúng trackId, amount, sender", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");

            const tx = await tuneChain.connect(fan).tipTrack(0n, { value: ONE_ETH });
            await expect(tx)
                .to.emit(tuneChain, "TipReceived")
                .withArgs(0n, ONE_ETH, fan.address);
        });

        // ── TC-TT-03: Nhiều fan tip, escrow tích lũy đúng ───
        it("TC-TT-03: ✅ Nhiều lần tip → escrowBalance tích lũy đúng", async function () {
            const { tuneChain, artist, fan, stranger } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "Popular Song");

            await tuneChain.connect(fan).tipTrack(0n, { value: HALF_ETH });
            await tuneChain.connect(stranger).tipTrack(0n, { value: HALF_ETH });

            // Tổng escrow phải là 0.5 + 0.5 = 1 ETH
            expect(await tuneChain.escrowBalance(0n)).to.equal(ONE_ETH);
            // totalTips trên Track struct cũng phải đúng
            const track = await tuneChain.tracks(0n);
            expect(track.totalTips).to.equal(ONE_ETH);
        });

        // ── TC-TT-04: Revert khi value = 0 ──────────────────
        it("TC-TT-04: ❌ Tip với value = 0 → revert 'Must send ETH'", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");

            await expect(
                tuneChain.connect(fan).tipTrack(0n, { value: 0n })
            ).to.be.revertedWith("Must send ETH");
        });

        // ── TC-TT-05: Revert khi trackId không tồn tại ───────
        it("TC-TT-05: ❌ Tip trackId không tồn tại → revert 'Track does not exist'", async function () {
            const { tuneChain, fan } = await deployContracts();

            // Chưa upload track nào, trackId 999 không tồn tại
            await expect(
                tuneChain.connect(fan).tipTrack(999n, { value: ONE_ETH })
            ).to.be.revertedWith("Track does not exist");
        });
    });

    // ══════════════════════════════════════════════════════════
    //  NHÓM 3: withdrawTips()
    //  Kiểm tra rút tiền: 24h lock, quyền artist, empty balance
    // ══════════════════════════════════════════════════════════
    describe("withdrawTips()", function () {

        // ── TC-WD-01: Rút thành công sau 24h ─────────────────
        it("TC-WD-01: ✅ Rút thành công sau 24h → balance artist tăng đúng", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");
            await tuneChain.connect(fan).tipTrack(0n, { value: ONE_ETH });

            // Tăng thời gian blockchain lên 24h + 1 giây
            await ethers.provider.send("evm_increaseTime", [TWENTY_FOUR_HOURS + 1]);
            await ethers.provider.send("evm_mine");

            const artistBalanceBefore = await ethers.provider.getBalance(artist.address);

            const tx = await tuneChain.connect(artist).withdrawTips(0n);
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

            const artistBalanceAfter = await ethers.provider.getBalance(artist.address);

            // Balance artist phải tăng đúng 1 ETH (trừ gas)
            expect(artistBalanceAfter).to.equal(artistBalanceBefore + ONE_ETH - gasUsed);
            // escrowBalance của track phải về 0
            expect(await tuneChain.escrowBalance(0n)).to.equal(0n);
        });

        // ── TC-WD-02: Emit event TipWithdrawn ────────────────
        it("TC-WD-02: ✅ Emit event TipWithdrawn với đúng args", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");
            await tuneChain.connect(fan).tipTrack(0n, { value: ONE_ETH });

            await ethers.provider.send("evm_increaseTime", [TWENTY_FOUR_HOURS + 1]);
            await ethers.provider.send("evm_mine");

            await expect(tuneChain.connect(artist).withdrawTips(0n))
                .to.emit(tuneChain, "TipWithdrawn")
                .withArgs(artist.address, 0n, ONE_ETH);
        });

        // ── TC-WD-03: Revert khi rút trước 24h ───────────────
        it("TC-WD-03: ❌ Rút trước 24h → revert 'Escrow period not ended'", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");
            await tuneChain.connect(fan).tipTrack(0n, { value: ONE_ETH });

            // Chỉ tăng 1 giờ — chưa đủ 24h
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine");

            await expect(
                tuneChain.connect(artist).withdrawTips(0n)
            ).to.be.revertedWith("Escrow period not ended");
        });

        // ── TC-WD-04: Revert khi người không phải artist rút ──
        it("TC-WD-04: ❌ Người không phải artist cố rút → revert 'Not the artist'", async function () {
            const { tuneChain, artist, fan, stranger } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");
            await tuneChain.connect(fan).tipTrack(0n, { value: ONE_ETH });

            await ethers.provider.send("evm_increaseTime", [TWENTY_FOUR_HOURS + 1]);
            await ethers.provider.send("evm_mine");

            // stranger cố rút tiền của artist → revert
            await expect(
                tuneChain.connect(stranger).withdrawTips(0n)
            ).to.be.revertedWith("Not the artist");
        });

        // ── TC-WD-05: Revert khi balance = 0 ─────────────────
        it("TC-WD-05: ❌ Rút khi escrow balance = 0 → revert 'Nothing to withdraw'", async function () {
            const { tuneChain, artist } = await deployContracts();

            // Upload track nhưng không có ai tip
            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");

            await ethers.provider.send("evm_increaseTime", [TWENTY_FOUR_HOURS + 1]);
            await ethers.provider.send("evm_mine");

            await expect(
                tuneChain.connect(artist).withdrawTips(0n)
            ).to.be.revertedWith("Nothing to withdraw");
        });

        // ── TC-WD-06: Revert khi trackId không tồn tại ───────
        it("TC-WD-06: ❌ Rút với trackId không tồn tại → revert 'Track does not exist'", async function () {
            const { tuneChain, artist } = await deployContracts();

            await expect(
                tuneChain.connect(artist).withdrawTips(999n)
            ).to.be.revertedWith("Track does not exist");
        });

        // ── TC-WD-07: Contract balance về 0 sau khi rút ──────
        it("TC-WD-07: ✅ Contract balance về 0 sau khi rút toàn bộ ETH", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash123", "My Song");
            await tuneChain.connect(fan).tipTrack(0n, { value: HALF_ETH });

            await ethers.provider.send("evm_increaseTime", [TWENTY_FOUR_HOURS + 1]);
            await ethers.provider.send("evm_mine");

            await tuneChain.connect(artist).withdrawTips(0n);

            const contractBalance = await ethers.provider.getBalance(
                await tuneChain.getAddress()
            );
            expect(contractBalance).to.equal(0n);
        });
    });

    // ══════════════════════════════════════════════════════════
    //  NHÓM 4: getAllTracks() — View function
    //  Kiểm tra trả về đúng danh sách track
    // ══════════════════════════════════════════════════════════
    describe("getAllTracks()", function () {

        it("TC-GT-01: Trả về mảng rỗng khi chưa có track nào", async function () {
            const { tuneChain } = await deployContracts();
            const tracks = await tuneChain.getAllTracks();
            expect(tracks.length).to.equal(0);
        });

        it("TC-GT-02: Trả về đúng số lượng và data của các track đã upload", async function () {
            const { tuneChain, artist, fan } = await deployContracts();

            await tuneChain.connect(artist).uploadTrack("QmHash001", "Song One");
            await tuneChain.connect(fan).uploadTrack("QmHash002", "Song Two");

            const tracks = await tuneChain.getAllTracks();
            expect(tracks.length).to.equal(2);
            expect(tracks[0].title).to.equal("Song One");
            expect(tracks[1].title).to.equal("Song Two");
            expect(tracks[0].ipfsHash).to.equal("QmHash001");
            expect(tracks[1].creator).to.equal(fan.address);
        });
    });
});
