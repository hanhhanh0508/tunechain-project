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

    await expect(tuneToken.connect(attacker).mint(recipient.address, 1n * 10n ** 18n)).to.be.revertedWithCustomError(
      tuneToken,
      "OwnableUnauthorizedAccount"
    );
  });
});

describe("TuneChain", function () {
  const initialSupply = 1_000_000n * 10n ** 18n;
  const baseUploadFee = 10n * 10n ** 18n;
  const stakeAmount = 5n * 10n ** 18n;

  async function deployFixture() {
    const [deployer, treasury, oracle, creator, listener1, listener2, listener3, listener4, listener5, listener6, outsider] =
      await ethers.getSigners();

    const tuneToken = await ethers.deployContract("TuneToken", [initialSupply], deployer);
    await tuneToken.waitForDeployment();

    const tuneChain = await ethers.deployContract(
      "TuneChain",
      [await tuneToken.getAddress(), treasury.address, oracle.address],
      deployer
    );
    await tuneChain.waitForDeployment();

    const recipients = [creator, listener1, listener2, listener3, listener4, listener5, listener6, outsider];
    for (const recipient of recipients) {
      await tuneToken.connect(deployer).transfer(recipient.address, 1_000n * 10n ** 18n);
    }

    return { deployer, treasury, oracle, creator, listener1, listener2, listener3, listener4, listener5, listener6, outsider, tuneToken, tuneChain };
  }

  async function increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  it("deploys with the configured token, treasury, and oracle", async function () {
    const { tuneToken, tuneChain, treasury, oracle } = await deployFixture();

    expect(await tuneChain.tuneToken()).to.equal(await tuneToken.getAddress());
    expect(await tuneChain.treasury()).to.equal(treasury.address);
    expect(await tuneChain.oracle()).to.equal(oracle.address);
  });

  it("uploads a track and locks the upload fee", async function () {
    const { creator, tuneToken, tuneChain } = await deployFixture();

    await tuneToken.connect(creator).approve(await tuneChain.getAddress(), baseUploadFee);

    await tuneChain.connect(creator).uploadTrack("metadata-cid-1");

    const track = await tuneChain.getTrack(0);
    expect(track.creator).to.equal(creator.address);
    expect(track.metadataCID).to.equal("metadata-cid-1");
    expect(track.escrowBalance).to.equal(0n);
    expect(await tuneToken.balanceOf(await tuneChain.getAddress())).to.equal(baseUploadFee);
  });

  it("accepts tips and allows withdrawal after escrow expires", async function () {
    const { creator, listener1, tuneToken, tuneChain } = await deployFixture();

    await tuneToken.connect(creator).approve(await tuneChain.getAddress(), baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("metadata-cid-2");

    const tipAmount = 25n * 10n ** 18n;
    await tuneToken.connect(listener1).approve(await tuneChain.getAddress(), tipAmount);

    await tuneChain.connect(listener1).tip(0, tipAmount);

    let track = await tuneChain.getTrack(0);
    expect(track.escrowBalance).to.equal(tipAmount);

    await expect(tuneChain.connect(creator).withdrawTips(0)).to.be.revertedWith(
      "TuneChain: escrow still locked"
    );

    await increaseTime(24 * 60 * 60 + 1);

    await expect(tuneChain.connect(creator).withdrawTips(0))
      .to.emit(tuneChain, "TipsWithdrawn")
      .withArgs(0n, creator.address, tipAmount);

    track = await tuneChain.getTrack(0);
    expect(track.escrowBalance).to.equal(0n);
  });

  it("hides a track after enough reports and pays rewards to reporters", async function () {
    const { creator, listener1, listener2, listener3, listener4, listener5, listener6, outsider, oracle, tuneToken, tuneChain } = await deployFixture();
    const reporters = [listener1, listener2, listener3, listener4, listener5, listener6, outsider];

    await tuneToken.connect(creator).approve(await tuneChain.getAddress(), baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("metadata-cid-3");

    const tipAmount = 100n * 10n ** 18n;
    await tuneToken.connect(listener1).approve(await tuneChain.getAddress(), tipAmount);
    await tuneChain.connect(listener1).tip(0, tipAmount);

    await tuneChain.connect(oracle).syncViews(0, 101n);

    for (const reporter of reporters) {
      await tuneToken.connect(reporter).approve(await tuneChain.getAddress(), stakeAmount);
    }

    await tuneChain.connect(listener1).report(0);

    await tuneChain.connect(listener2).report(0);
    await tuneChain.connect(listener3).report(0);
    await tuneChain.connect(listener4).report(0);
    await tuneChain.connect(listener5).report(0);

    await tuneChain.connect(listener6).report(0);
    await tuneChain.connect(outsider).report(0);

    const hiddenTrack = await tuneChain.getTrack(0);
    expect(hiddenTrack.isHidden).to.equal(true);
    expect(await tuneChain.rewardPool(0)).to.equal(80n * 10n ** 18n);

    const share = (80n * 10n ** 18n) / 7n;

    for (const reporter of reporters) {
      await expect(tuneChain.connect(reporter).claimReward(0))
        .to.emit(tuneChain, "RewardClaimed")
        .withArgs(0n, reporter.address, share + stakeAmount);
    }

    await expect(tuneChain.connect(listener1).claimReward(0)).to.be.revertedWith(
      "TuneChain: already claimed"
    );

    const treasuryShare = 20n * 10n ** 18n;
    const expectedContractBalance = baseUploadFee + tipAmount + 7n * stakeAmount - treasuryShare - 7n * (share + stakeAmount);
    expect(await tuneToken.balanceOf(await tuneChain.getAddress())).to.equal(expectedContractBalance);
  });

  it("processes expired reports and transfers the stake to the treasury", async function () {
    const { creator, listener1, treasury, tuneToken, tuneChain } = await deployFixture();

    await tuneToken.connect(creator).approve(await tuneChain.getAddress(), baseUploadFee);
    await tuneChain.connect(creator).uploadTrack("metadata-cid-4");

    await tuneToken.connect(listener1).approve(await tuneChain.getAddress(), stakeAmount);
    await tuneChain.connect(listener1).report(0);

    await increaseTime(30 * 24 * 60 * 60 + 1);

    await tuneChain.processExpiredReport(0, listener1.address);

    expect(await tuneToken.balanceOf(treasury.address)).to.be.greaterThan(0n);
  });

  it("lets the owner update oracle and treasury", async function () {
    const { deployer, tuneChain, outsider } = await deployFixture();

    await tuneChain.connect(deployer).setOracle(outsider.address);

    await tuneChain.connect(deployer).setTreasury(outsider.address);

    expect(await tuneChain.oracle()).to.equal(outsider.address);
    expect(await tuneChain.treasury()).to.equal(outsider.address);
  });
});
