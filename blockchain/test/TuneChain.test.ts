import { expect } from "chai";
import hardhat from "hardhat";

let connection: Awaited<ReturnType<typeof hardhat.network.connect>>;
let ethers: Awaited<ReturnType<typeof hardhat.network.connect>>["ethers"];

before(async function () {
  connection = await hardhat.network.connect();
  ethers = connection.ethers;
});

after(async function () {
  if (connection) {
    await connection.close();
  }
});

// ──────────────────────────────────────────────────────────────
// TuneToken tests
// ──────────────────────────────────────────────────────────────
describe("TuneToken", function () {
  it("mints the initial supply to the deployer", async function () {
    const [owner] = await ethers.getSigners();
    const initialSupply = 1_000_000n * 10n ** 18n;

    const tuneToken = await ethers.deployContract("TuneToken", [initialSupply]);
    await tuneToken.waitForDeployment();

    expect(await tuneToken.name()).to.equal("TuneToken");
    expect(await tuneToken.symbol()).to.equal("TCT");
    expect(await tuneToken.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("allows the owner to mint and rejects non-owners", async function () {
    const [owner, recipient, attacker] = await ethers.getSigners();
    const initialSupply = 1_000_000n * 10n ** 18n;
    const extraMint = 123n * 10n ** 18n;

    const tuneToken = await ethers.deployContract("TuneToken", [initialSupply], owner);
    await tuneToken.waitForDeployment();

    await tuneToken.connect(owner).mint(recipient.address, extraMint);
    expect(await tuneToken.balanceOf(recipient.address)).to.equal(extraMint);

    await expect(
      tuneToken.connect(attacker).mint(recipient.address, 1n * 10n ** 18n)
    ).to.be.revertedWithCustomError(tuneToken, "OwnableUnauthorizedAccount");
  });
});

// ──────────────────────────────────────────────────────────────
// TuneChain tests
// ──────────────────────────────────────────────────────────────
describe("TuneChain", function () {
  const initialSupply  = 1_000_000n * 10n ** 18n;
  const baseUploadFee  = 10n * 10n ** 18n;

  /** Deploy cả 2 contract, cấp TCT cho các tài khoản test */
  async function deployFixture() {
    const [deployer, treasury, creator, listener1, listener2, admin, outsider] =
      await ethers.getSigners();

    // Deploy TuneToken
    const tuneToken = await ethers.deployContract("TuneToken", [initialSupply], deployer);
    await tuneToken.waitForDeployment();

    // Deploy TuneChain — constructor(tokenAddr, treasury, admins[])
    const tuneChain = await ethers.deployContract(
      "TuneChain",
      [await tuneToken.getAddress(), treasury.address, [admin.address]],
      deployer
    );
    await tuneChain.waitForDeployment();

    // Cấp 1000 TCT cho mỗi account test
    const recipients = [creator, listener1, listener2, admin, outsider];
    for (const r of recipients) {
      await tuneToken.connect(deployer).transfer(r.address, 1_000n * 10n ** 18n);
    }

    return { deployer, treasury, creator, listener1, listener2, admin, outsider, tuneToken, tuneChain };
  }

  /** Tua thời gian trên hardhat node */
  async function increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  // ── Deploy ─────────────────────────────────────────────────
  it("deploys with correct token, treasury, and admin roles", async function () {
    const { deployer, tuneToken, tuneChain, treasury, admin } = await deployFixture();
    const ADMIN_ROLE = await tuneChain.ADMIN_ROLE();

    expect(await tuneChain.tuneToken()).to.equal(await tuneToken.getAddress());
    expect(await tuneChain.treasury()).to.equal(treasury.address);
    expect(await tuneChain.hasRole(ADMIN_ROLE, deployer.address)).to.equal(true);
    expect(await tuneChain.hasRole(ADMIN_ROLE, admin.address)).to.equal(true);
    expect(await tuneChain.nextTrackId()).to.equal(1n);
  });

  // ── uploadTrack ────────────────────────────────────────────
  it("uploadTrack: charges upload fee and stores track data", async function () {
    const { creator, treasury, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);

    const balBefore = await tuneToken.balanceOf(treasury.address);
    await expect(tuneChain.connect(creator).uploadTrack("QmHash123", "My Song"))
      .to.emit(tuneChain, "TrackUploaded")
      .withArgs(1n, creator.address, "QmHash123", "My Song");

    // nextTrackId tăng lên 2
    expect(await tuneChain.nextTrackId()).to.equal(2n);

    // Track lưu đúng
    const track = await tuneChain.tracks(1);
    expect(track.trackId).to.equal(1n);
    expect(track.creator).to.equal(creator.address);
    expect(track.ipfsHash).to.equal("QmHash123");
    expect(track.title).to.equal("My Song");
    expect(track.totalTips).to.equal(0n);
    expect(track.isActive).to.equal(true);

    // Phí upload chuyển vào treasury
    const balAfter = await tuneToken.balanceOf(treasury.address);
    expect(balAfter - balBefore).to.equal(baseUploadFee);
  });

  it("uploadTrack: rejects empty ipfsHash or title", async function () {
    const { creator, tuneToken, tuneChain } = await deployFixture();
    await tuneToken.connect(creator).approve(await tuneChain.getAddress(), baseUploadFee * 2n);

    await expect(
      tuneChain.connect(creator).uploadTrack("", "My Song")
    ).to.be.revertedWith("TuneChain: ipfsHash cannot be empty");

    await expect(
      tuneChain.connect(creator).uploadTrack("QmHash", "")
    ).to.be.revertedWith("TuneChain: title cannot be empty");
  });

  // ── tipTrack + escrow ──────────────────────────────────────
  it("tipTrack: locks tokens in escrow and blocks early withdrawal", async function () {
    const { creator, listener1, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();
    const tipAmount = 25n * 10n ** 18n;

    // Upload track
    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmABC", "Track A");

    // Tip
    await tuneToken.connect(listener1).approve(tuneChainAddr, tipAmount);
    await expect(tuneChain.connect(listener1).tipTrack(1, tipAmount))
      .to.emit(tuneChain, "TrackTipped")
      .withArgs(1n, 1n, listener1.address, tipAmount);

    // Track totalTips tăng
    const track = await tuneChain.tracks(1);
    expect(track.totalTips).to.equal(tipAmount);

    // Escrow bị lock → không thể rút ngay
    await expect(tuneChain.connect(creator).withdrawTips()).to.be.revertedWith(
      "TuneChain: escrow still locked (wait 24h after last tip)"
    );

    // getEscrowInfo
    const [balance, unlockTime] = await tuneChain.getEscrowInfo(creator.address);
    expect(balance).to.equal(tipAmount);
    expect(unlockTime).to.be.greaterThan(0n);
  });

  it("tipTrack + withdrawTips: can withdraw after 24h escrow", async function () {
    const { creator, listener1, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();
    const tipAmount = 50n * 10n ** 18n;

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmXYZ", "Track B");

    await tuneToken.connect(listener1).approve(tuneChainAddr, tipAmount);
    await tuneChain.connect(listener1).tipTrack(1, tipAmount);

    // Tua thời gian qua 24h
    await increaseTime(24 * 60 * 60 + 1);

    // Rút thành công
    const balBefore = await tuneToken.balanceOf(creator.address);
    await expect(tuneChain.connect(creator).withdrawTips())
      .to.emit(tuneChain, "TipWithdrawn")
      .withArgs(creator.address, tipAmount);
    const balAfter = await tuneToken.balanceOf(creator.address);
    expect(balAfter - balBefore).to.equal(tipAmount);

    // Escrow về 0
    const [balance] = await tuneChain.getEscrowInfo(creator.address);
    expect(balance).to.equal(0n);
  });

  it("withdrawTips: resets 24h if new tip arrives before withdrawal", async function () {
    const { creator, listener1, listener2, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();
    const tip1 = 20n * 10n ** 18n;
    const tip2 = 10n * 10n ** 18n;

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmAAA", "Track C");

    // Tip lần 1
    await tuneToken.connect(listener1).approve(tuneChainAddr, tip1);
    await tuneChain.connect(listener1).tipTrack(1, tip1);

    // Chờ 20h
    await increaseTime(20 * 60 * 60);

    // Tip lần 2 → reset đồng hồ
    await tuneToken.connect(listener2).approve(tuneChainAddr, tip2);
    await tuneChain.connect(listener2).tipTrack(1, tip2);

    // Sau 20h nữa (tổng 40h từ tip1 nhưng chỉ 20h từ tip2) → vẫn bị lock
    await increaseTime(20 * 60 * 60);
    await expect(tuneChain.connect(creator).withdrawTips()).to.be.revertedWith(
      "TuneChain: escrow still locked (wait 24h after last tip)"
    );

    // Sau thêm 4h1s nữa → đủ 24h từ tip2 → rút được
    await increaseTime(4 * 60 * 60 + 1);
    await expect(tuneChain.connect(creator).withdrawTips())
      .to.emit(tuneChain, "TipWithdrawn")
      .withArgs(creator.address, tip1 + tip2);
  });

  // ── reportTrack + resolveReport ────────────────────────────
  it("reportTrack: creates report and increments count", async function () {
    const { creator, listener1, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmRep", "Report Test");

    await expect(tuneChain.connect(listener1).reportTrack(1, "Copyright violation"))
      .to.emit(tuneChain, "TrackReported")
      .withArgs(1n, listener1.address, 1n);

    expect(await tuneChain.reportCount(1)).to.equal(1n);

    const report = await tuneChain.reports(1);
    expect(report.reporter).to.equal(listener1.address);
    expect(report.reason).to.equal("Copyright violation");
    expect(report.resolved).to.equal(false);
  });

  it("reportTrack: creator cannot report own track", async function () {
    const { creator, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmOwn", "Own Track");

    await expect(
      tuneChain.connect(creator).reportTrack(1, "Testing")
    ).to.be.revertedWith("TuneChain: cannot report own track");
  });

  it("resolveReport(removed=true): deactivates track and seizes escrow to treasury", async function () {
    const { deployer, creator, listener1, treasury, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();
    const tipAmount = 100n * 10n ** 18n;

    // Upload + tip
    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmSeize", "Seize Test");

    await tuneToken.connect(listener1).approve(tuneChainAddr, tipAmount);
    await tuneChain.connect(listener1).tipTrack(1, tipAmount);

    // Report
    await tuneChain.connect(listener1).reportTrack(1, "Stolen music");

    // Admin resolve → remove
    const treasuryBalBefore = await tuneToken.balanceOf(treasury.address);
    await expect(tuneChain.connect(deployer).resolveReport(1, true))
      .to.emit(tuneChain, "TrackDeactivated").withArgs(1n)
      .to.emit(tuneChain, "ReportResolved").withArgs(1n, true);

    // Track deactivated
    const track = await tuneChain.tracks(1);
    expect(track.isActive).to.equal(false);

    // Escrow chuyển vào treasury
    const treasuryBalAfter = await tuneToken.balanceOf(treasury.address);
    expect(treasuryBalAfter - treasuryBalBefore).to.equal(tipAmount);

    // Creator không còn escrow
    const [balance] = await tuneChain.getEscrowInfo(creator.address);
    expect(balance).to.equal(0n);
  });

  it("resolveReport(removed=false): marks resolved without deactivating", async function () {
    const { deployer, creator, listener1, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmKeep", "Keep Track");
    await tuneChain.connect(listener1).reportTrack(1, "False report");

    await expect(tuneChain.connect(deployer).resolveReport(1, false))
      .to.emit(tuneChain, "ReportResolved").withArgs(1n, false);

    // Track vẫn active
    const track = await tuneChain.tracks(1);
    expect(track.isActive).to.equal(true);
  });

  it("resolveReport: non-admin cannot resolve", async function () {
    const { creator, listener1, outsider, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("QmX", "X");
    await tuneChain.connect(listener1).reportTrack(1, "Reason");

    await expect(
      tuneChain.connect(outsider).resolveReport(1, true)
    ).to.be.revertedWithCustomError(tuneChain, "AccessControlUnauthorizedAccount");
  });

  // ── View helpers ───────────────────────────────────────────
  it("getAllActiveTracks: returns only active tracks", async function () {
    const { deployer, creator, listener1, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee * 2n);
    await tuneChain.connect(creator).uploadTrack("QmA", "Track A"); // id=1
    await tuneChain.connect(creator).uploadTrack("QmB", "Track B"); // id=2

    // Report + deactivate track 1
    await tuneChain.connect(listener1).reportTrack(1, "Bad");
    await tuneChain.connect(deployer).resolveReport(1, true);

    const active = await tuneChain.getAllActiveTracks();
    expect(active.length).to.equal(1);
    expect(active[0].trackId).to.equal(2n);
  });

  it("getCreatorTracks: returns all trackIds for a creator", async function () {
    const { creator, tuneToken, tuneChain } = await deployFixture();
    const tuneChainAddr = await tuneChain.getAddress();

    await tuneToken.connect(creator).approve(tuneChainAddr, baseUploadFee * 3n);
    await tuneChain.connect(creator).uploadTrack("Qm1", "Song 1");
    await tuneChain.connect(creator).uploadTrack("Qm2", "Song 2");
    await tuneChain.connect(creator).uploadTrack("Qm3", "Song 3");

    const ids = await tuneChain.getCreatorTracks(creator.address);
    expect(ids.length).to.equal(3);
    expect(ids.map(Number)).to.deep.equal([1, 2, 3]);
  });

  // ── Admin functions ────────────────────────────────────────
  it("setTreasury: updates treasury (only DEFAULT_ADMIN_ROLE)", async function () {
    const { deployer, outsider, tuneChain } = await deployFixture();

    await tuneChain.connect(deployer).setTreasury(outsider.address);
    expect(await tuneChain.treasury()).to.equal(outsider.address);

    await expect(
      tuneChain.connect(outsider).setTreasury(outsider.address)
    ).to.be.revertedWithCustomError(tuneChain, "AccessControlUnauthorizedAccount");
  });
});
