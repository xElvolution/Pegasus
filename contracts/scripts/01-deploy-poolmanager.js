import { network } from "hardhat";
import { v4Factory } from "./v4-artifacts.js";

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("=== Deploy PoolManager ===");
  console.log("Network:    X Layer Testnet (chainId 1952)");
  console.log("Deployer:   ", deployer.address);
  console.log("Balance:    ", ethers.formatEther(balance), "OKB");

  if (balance === 0n) {
    console.error("\nDeployer has 0 OKB. Get testnet OKB from https://web3.okx.com/xlayer/faucet first.");
    process.exit(1);
  }

  const PoolManager = await v4Factory(ethers, deployer, "PoolManager");
  const pm = await PoolManager.deploy(deployer.address);
  await pm.waitForDeployment();
  const addr = await pm.getAddress();

  console.log("\nPoolManager deployed:", addr);
  console.log("Tx hash:             ", pm.deploymentTransaction()?.hash);
  console.log("\nAdd to .env files:");
  console.log("  POOL_MANAGER_ADDRESS=" + addr);
  console.log("  NEXT_PUBLIC_POOL_MANAGER=" + addr);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
