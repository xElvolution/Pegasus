import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Pegasus contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const oracleAddress = deployer.address;

  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Pegasus Token A", "PEGA", 18);
  await tokenA.waitForDeployment();
  console.log("Token A deployed to:", await tokenA.getAddress());

  const tokenB = await MockERC20.deploy("Pegasus Token B", "PEGB", 18);
  await tokenB.waitForDeployment();
  console.log("Token B deployed to:", await tokenB.getAddress());

  const mintAmount = hre.ethers.parseEther("1000000");
  await tokenA.mint(deployer.address, mintAmount);
  await tokenB.mint(deployer.address, mintAmount);
  console.log("Minted 1,000,000 of each token to deployer");

  console.log("\n--- Deployment Summary ---");
  console.log("Oracle:  ", oracleAddress);
  console.log("Token A: ", await tokenA.getAddress());
  console.log("Token B: ", await tokenB.getAddress());
  console.log("\nNote: PegasusHook deployment requires CREATE2 address mining.");
  console.log("Use the deploy-hook script for hook-specific deployment.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
