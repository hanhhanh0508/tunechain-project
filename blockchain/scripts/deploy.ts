/**
 * scripts/deploy.ts
 *
 * Script deploy TuneToken + TuneChain lên hardhat local node,
 * sau đó tự động:
 *  1. Ghi địa chỉ vào blockchain/deployments.json
 *  2. Copy ABI JSON vào frontend/src/abi/ABI/
 *  3. In ra màn hình thông tin cần điền .env
 *
 * Cách chạy:
 *   Terminal 1: npx hardhat node
 *   Terminal 2: npx hardhat run scripts/deploy.ts --network localhost
 *
 * Hoặc:
 *   npm run deploy:local
 */

import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = hre;

  const [deployer] = await ethers.getSigners();

  console.log("\n🚀 Deploying TuneChain contracts...");
  console.log(`   Deployer: ${deployer.address}`);

  const balance =
    await deployer.provider.getBalance(
      deployer.address
    );

  console.log(
    `   Balance : ${ethers.formatEther(
      balance
    )} ETH\n`
  );

  // ─── 1. Deploy TuneToken ─────────────────────────────
  const initialSupply =
    ethers.parseUnits(
      "1000000",
      18
    );

  const TuneToken =
    await ethers.getContractFactory(
      "TuneToken"
    );

  const tuneToken =
    await TuneToken.deploy(
      initialSupply
    );

  await tuneToken.waitForDeployment();

  const tuneTokenAddress =
    await tuneToken.getAddress();

  console.log(
    `✅ TuneToken deployed : ${tuneTokenAddress}`
  );

  // ─── 2. Deploy TuneChain ─────────────────────────────
  const admins = [
    deployer.address,
  ];

  const TuneChain =
    await ethers.getContractFactory(
      "TuneChain"
    );

  const tuneChain =
    await TuneChain.deploy(
      tuneTokenAddress,
      deployer.address,
      admins
    );

  await tuneChain.waitForDeployment();

  const tuneChainAddress =
    await tuneChain.getAddress();

  console.log(
    `✅ TuneChain deployed : ${tuneChainAddress}\n`
  );

  // ─── 3. Ghi deployments.json ─────────────────────────
  const deploymentsPath =
    path.resolve(
      "deployments.json"
    );

  const deployments = {
    TuneToken:
      tuneTokenAddress,
    TuneChain:
      tuneChainAddress,
  };

  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(
      deployments,
      null,
      2
    )
  );

  console.log(
    `📄 deployments.json updated: ${deploymentsPath}`
  );

  // ─── 4. Copy ABI sang frontend ──────────────────────
  const artifactsBase =
    path.resolve(
      "artifacts/contracts"
    );

  const frontendAbiDir =
    path.resolve(
      "../frontend/src/abi/ABI"
    );

  if (
    !fs.existsSync(
      frontendAbiDir
    )
  ) {
    fs.mkdirSync(
      frontendAbiDir,
      {
        recursive: true,
      }
    );
  }

  const abisToCopy = [
    {
      src: path.join(
        artifactsBase,
        "TuneToken.sol",
        "TuneToken.json"
      ),
      dst: path.join(
        frontendAbiDir,
        "TuneToken.json"
      ),
    },
    {
      src: path.join(
        artifactsBase,
        "TuneChain.sol",
        "TuneChain.json"
      ),
      dst: path.join(
        frontendAbiDir,
        "TuneChain.json"
      ),
    },
  ];

  for (const {
    src,
    dst,
  } of abisToCopy) {
    if (
      fs.existsSync(src)
    ) {
      fs.copyFileSync(
        src,
        dst
      );

      console.log(
        `📋 ABI copied: ${path.basename(
          dst
        )}`
      );
    } else {
      console.warn(
        `⚠️ ABI not found: ${src}`
      );
    }
  }

  // ─── 5. Mint TCT cho test accounts ──────────────────
  const signers =
    await ethers.getSigners();

  const mintAmount =
    ethers.parseUnits(
      "1000",
      18
    );

  console.log(
    `\n🪙 Minting 1000 TCT cho ${
      Math.min(
        signers.length,
        10
      )
    } accounts test...`
  );

  for (
    let i = 1;
    i <
    Math.min(
      signers.length,
      10
    );
    i++
  ) {
    await tuneToken.mint(
      signers[i].address,
      mintAmount
    );

    console.log(
      `   [${i}] ${
        signers[i].address
      } → +1000 TCT`
    );
  }

  // ─── 6. In thông tin env ────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🎵 DEPLOY THÀNH CÔNG 🎵                    ║
╠══════════════════════════════════════════════════════════════╣
║  VITE_TUNECHAIN_ADDRESS=${tuneChainAddress}
║  VITE_TUNETOKEN_ADDRESS=${tuneTokenAddress}
╠══════════════════════════════════════════════════════════════╣
║  Điền 2 dòng trên vào file: frontend/.env                    ║
║  ABI đã copy vào: frontend/src/abi/ABI/                      ║
╚══════════════════════════════════════════════════════════════╝
`);
}

main().catch((error) => {
  console.error(
    "❌ Deploy failed:",
    error
  );

  process.exitCode = 1;
});