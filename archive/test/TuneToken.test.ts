import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("TuneToken", function () {

  async function deployTuneToken() {
    const [owner, alice, bob] = await ethers.getSigners();
    const TuneToken = await ethers.getContractFactory("TuneToken");
    const token = await TuneToken.deploy();
    return { token, owner, alice, bob };
  }

  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  // ─── Deploy ──────────────────────────────────────────────────
  describe("Deploy", function () {
    it("Tên token phải là TuneToken, symbol là TCT", async function () {
      const { token } = await deployTuneToken();
      expect(await token.name()).to.equal("TuneToken");
      expect(await token.symbol()).to.equal("TCT");
    });

    it("Decimals phải là 18", async function () {
      const { token } = await deployTuneToken();
      expect(await token.decimals()).to.equal(18);
    });

    it("Owner nhận đủ 1,000,000 TCT sau khi deploy", async function () {
      const { token, owner } = await deployTuneToken();
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("TotalSupply bằng đúng 1,000,000 TCT", async function () {
      const { token } = await deployTuneToken();
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Owner của contract đúng là deployer", async function () {
      const { token, owner } = await deployTuneToken();
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  // ─── Mint ────────────────────────────────────────────────────
  describe("mint()", function () {
    it("Owner mint thêm token thành công", async function () {
      const { token, alice } = await deployTuneToken();
      const mintAmount = ethers.parseEther("500");
      await token.mint(alice.address, mintAmount);
      expect(await token.balanceOf(alice.address)).to.equal(mintAmount);
    });

    it("TotalSupply tăng đúng sau mint", async function () {
      const { token, alice } = await deployTuneToken();
      const mintAmount = ethers.parseEther("1000");
      await token.mint(alice.address, mintAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
    });

    it("Non-owner KHÔNG thể mint — revert", async function () {
      const { token, alice } = await deployTuneToken();
      await expect(
        token.connect(alice).mint(alice.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Mint về zero address phải revert", async function () {
      const { token } = await deployTuneToken();
      await expect(
        token.mint(ethers.ZeroAddress, ethers.parseEther("100"))
      ).to.be.revertedWith("TuneToken: mint to zero address");
    });

    it("Mint amount = 0 phải revert", async function () {
      const { token, alice } = await deployTuneToken();
      await expect(
        token.mint(alice.address, 0n)
      ).to.be.revertedWith("TuneToken: amount must be > 0");
    });
  });

  // ─── Approve ─────────────────────────────────────────────────
  describe("approve()", function () {
    it("Approve đúng amount cho spender", async function () {
      const { token, owner, alice } = await deployTuneToken();
      const amount = ethers.parseEther("200");
      await token.approve(alice.address, amount);
      expect(await token.allowance(owner.address, alice.address)).to.equal(amount);
    });

    it("Approve phát ra event Approval", async function () {
      const { token, owner, alice } = await deployTuneToken();
      await expect(token.approve(alice.address, ethers.parseEther("200")))
        .to.emit(token, "Approval")
        .withArgs(owner.address, alice.address, ethers.parseEther("200"));
    });
  });

  // ─── Transfer ────────────────────────────────────────────────
  describe("transfer()", function () {
    it("Transfer thành công — balance thay đổi đúng", async function () {
      const { token, owner, alice } = await deployTuneToken();
      const amount = ethers.parseEther("300");
      await token.transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - amount);
    });

    it("Transfer phát ra event Transfer", async function () {
      const { token, owner, alice } = await deployTuneToken();
      await expect(token.transfer(alice.address, ethers.parseEther("100")))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, ethers.parseEther("100"));
    });

    it("Transfer vượt balance phải revert", async function () {
      const { token, alice, bob } = await deployTuneToken();
      await expect(
        token.connect(alice).transfer(bob.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  // ─── TransferFrom ─────────────────────────────────────────────
  describe("transferFrom()", function () {
    it("transferFrom đúng sau khi approve", async function () {
      const { token, owner, alice, bob } = await deployTuneToken();
      const amount = ethers.parseEther("150");
      await token.approve(alice.address, amount);
      await token.connect(alice).transferFrom(owner.address, bob.address, amount);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
      expect(await token.allowance(owner.address, alice.address)).to.equal(0n);
    });

    it("transferFrom vượt allowance phải revert", async function () {
      const { token, owner, alice, bob } = await deployTuneToken();
      await token.approve(alice.address, ethers.parseEther("50"));
      await expect(
        token.connect(alice).transferFrom(owner.address, bob.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });
});