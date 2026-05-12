import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_SUPPLY = 1_000_000n * 10n ** 18n;

const TuneChainModule = buildModule("TuneChainModule", (m) => {
  const deployer = m.getAccount(0);
  const treasury = deployer;
  const oracle = deployer;

  const tuneToken = m.contract("TuneToken", [INITIAL_SUPPLY], {
    from: deployer,
  });

  const tuneChain = m.contract("TuneChain", [tuneToken, treasury, oracle], {
    from: deployer,
  });

  return { tuneToken, tuneChain };
});

export default TuneChainModule;