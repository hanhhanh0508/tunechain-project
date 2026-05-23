import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const deployer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  const tokenAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const abi = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
  ];

  const token = new ethers.Contract(tokenAddress, abi, deployer);

  // Địa chỉ cần cấp TCT
  const CREATOR_ADDRESS  = "0xaA4867405Ad9AA2fef701B6F388a27394Afa3838";  // ← thay vào
  const LISTENER_ADDRESS = "0xCF5a0f2a8e8a6F54381bf2adE09336E50b8934F2"; // ← thay vào

  console.log("Minting TCT...");

  // Mint 10000 TCT cho creator
  const tx1 = await token.mint(CREATOR_ADDRESS, ethers.parseUnits("10000", 18));
  await tx1.wait();
  console.log("✅ Minted 10000 TCT cho creator");

  // Mint 10000 TCT cho listener
  const tx2 = await token.mint(LISTENER_ADDRESS, ethers.parseUnits("10000", 18));
  await tx2.wait();
  console.log("✅ Minted 10000 TCT cho listener");

  // Kiểm tra balance
  const bal1 = await token.balanceOf(CREATOR_ADDRESS);
  const bal2 = await token.balanceOf(LISTENER_ADDRESS);
  console.log("Creator TCT:", ethers.formatUnits(bal1, 18));
  console.log("Listener TCT:", ethers.formatUnits(bal2, 18));
}

main().catch(console.error);