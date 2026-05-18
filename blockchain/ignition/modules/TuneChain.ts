import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_SUPPLY = 1_000_000n * 10n ** 18n;

/**
 * TuneChainModule — Deploy TuneToken (TCT) rồi deploy TuneChain.
 *
 * Constructor TuneChain: (address _tokenAddress, address _treasury, address[] _admins)
 *  - Khi deploy local hardhat: deployer vừa làm treasury vừa làm admin.
 *  - Khi deploy Sepolia: thay treasury bằng địa chỉ ví thật.
 */
const TuneChainModule = buildModule("TuneChainModule", (m) => {
  const deployer = m.getAccount(0);

  // 1. Deploy TuneToken
  const tuneToken = m.contract("TuneToken", [INITIAL_SUPPLY], {
    from: deployer,
  });

  // 2. Deploy TuneChain
  //    _treasury = deployer (local test), _admins = [deployer] (1 admin mặc định)
  const tuneChain = m.contract(
    "TuneChain",
    [tuneToken, deployer, [deployer]],
    { from: deployer }
  );

  return { tuneToken, tuneChain };
});

export default TuneChainModule;