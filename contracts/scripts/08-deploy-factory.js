import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("=== Deploy PegasusFactory ===");
  console.log("Deployer:", deployer.address);
  console.log("Balance: ", ethers.formatEther(balance), "OKB");

  if (balance === 0n) {
    console.error("\nDeployer has 0 OKB. Get testnet OKB from https://web3.okx.com/xlayer/faucet first.");
    process.exit(1);
  }

  const Factory = await ethers.getContractFactory("PegasusFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const addr = await factory.getAddress();

  console.log("\nPegasusFactory deployed:", addr);
  console.log("Tx hash:                 ", factory.deploymentTransaction()?.hash);
  console.log("\nAdd to .env files:");
  console.log("  PEGASUS_FACTORY_ADDRESS=" + addr);
  console.log("  NEXT_PUBLIC_PEGASUS_FACTORY=" + addr);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
