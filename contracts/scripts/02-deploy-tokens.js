import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [deployer] = await ethers.getSigners();

  console.log("=== Deploy Test Tokens (PEGA + PEGB) ===");
  console.log("Deployer:", deployer.address);

  const MockERC20 = await ethers.getContractFactory("MockERC20");

  console.log("\nDeploying PEGA...");
  const tokenA = await MockERC20.deploy("Pegasus Token A", "PEGA", 18);
  await tokenA.waitForDeployment();
  const tokenAAddr = await tokenA.getAddress();
  console.log("PEGA deployed:", tokenAAddr);

  console.log("\nDeploying PEGB...");
  const tokenB = await MockERC20.deploy("Pegasus Token B", "PEGB", 18);
  await tokenB.waitForDeployment();
  const tokenBAddr = await tokenB.getAddress();
  console.log("PEGB deployed:", tokenBAddr);

  const mintAmount = ethers.parseEther("1000000");
  console.log("\nMinting 1,000,000 of each to deployer...");
  await (await tokenA.mint(deployer.address, mintAmount)).wait();
  await (await tokenB.mint(deployer.address, mintAmount)).wait();

  // V4 requires currency0 < currency1 in PoolKey ordering
  const [c0, c1, sym0, sym1] =
    BigInt(tokenAAddr) < BigInt(tokenBAddr)
      ? [tokenAAddr, tokenBAddr, "PEGA", "PEGB"]
      : [tokenBAddr, tokenAAddr, "PEGB", "PEGA"];

  console.log("\n=== Token Addresses ===");
  console.log("PEGA:                ", tokenAAddr);
  console.log("PEGB:                ", tokenBAddr);
  console.log("\nSorted for PoolKey (currency0 < currency1):");
  console.log("  currency0 (" + sym0 + "): " + c0);
  console.log("  currency1 (" + sym1 + "): " + c1);
  console.log("\nAdd to .env files:");
  console.log("  TOKEN_A_ADDRESS=" + c0);
  console.log("  TOKEN_B_ADDRESS=" + c1);
  console.log("  NEXT_PUBLIC_TOKEN_A=" + c0);
  console.log("  NEXT_PUBLIC_TOKEN_B=" + c1);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
