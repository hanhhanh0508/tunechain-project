import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  // kết nối local hardhat node
  const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );

  // account đầu tiên của hardhat node
  const deployer = await provider.getSigner(0);

  console.log("\n🚀 Deploying TuneChain contracts...");
  console.log(`   Deployer: ${await deployer.getAddress()}`);

  const balance = await provider.getBalance(
    await deployer.getAddress()
  );

  console.log(
    `   Balance : ${ethers.formatEther(balance)} ETH\n`
  );

  // ─── Deploy TuneToken ─────────────────────
  const initialSupply =
    ethers.parseUnits("1000000", 18);

  const tuneTokenArtifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/TuneToken.sol/TuneToken.json",
      "utf8"
    )
  );

  const TuneTokenFactory =
    new ethers.ContractFactory(
      tuneTokenArtifact.abi,
      tuneTokenArtifact.bytecode,
      deployer
    );

  const tuneToken =
    await TuneTokenFactory.deploy(
      initialSupply
    );

  await tuneToken.waitForDeployment();

  const tuneTokenAddress =
    await tuneToken.getAddress();

  console.log(
    `✅ TuneToken deployed : ${tuneTokenAddress}`
  );

  // ─── Deploy TuneChain ─────────────────────
  const admins = [
    await deployer.getAddress(),
  ];

  const tuneChainArtifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/TuneChain.sol/TuneChain.json",
      "utf8"
    )
  );

  const TuneChainFactory =
    new ethers.ContractFactory(
      tuneChainArtifact.abi,
      tuneChainArtifact.bytecode,
      deployer
    );

  const tuneChain =
    await TuneChainFactory.deploy(
      tuneTokenAddress,
      await deployer.getAddress(),
      admins
    );

  await tuneChain.waitForDeployment();

  const tuneChainAddress =
    await tuneChain.getAddress();

  console.log(
    `✅ TuneChain deployed : ${tuneChainAddress}`
  );

  // ─── deployments.json ─────────────────────
  const deployments = {
    TuneToken: tuneTokenAddress,
    TuneChain: tuneChainAddress,
  };

  fs.writeFileSync(
    "deployments.json",
    JSON.stringify(
      deployments,
      null,
      2
    )
  );

  console.log(
    "📄 deployments.json updated"
  );
}

main().catch((error) => {
  console.error(
    "❌ Deploy failed:",
    error
  );
  process.exitCode = 1;
});