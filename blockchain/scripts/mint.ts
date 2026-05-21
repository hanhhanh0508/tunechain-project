import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";

async function main() {
  // Hardhat localhost RPC
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");

  // Account #0 của Hardhat (có rất nhiều ETH)
  const signer = new Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );

  const tokenAddress =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // ABI tối thiểu chỉ cần mint
  const abi = [
    "function mint(address to, uint256 amount) public"
  ];

  const token = new Contract(tokenAddress, abi, signer);

  console.log("Đang mint TCT...");

  const tx = await token.mint(
    "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
    parseUnits("1000", 18)
  );

  console.log("TX:", tx.hash);

  await tx.wait();

  console.log("✅ Mint thành công!");
}

main().catch(console.error);