import { network } from "hardhat";
import { v4Factory } from "./v4-artifacts.js";

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [deployer] = await ethers.getSigners();

  console.log("=== Deploy V4 Test Routers (PoolSwapTest + PoolModifyLiquidityTest) ===");
  console.log("Deployer:", deployer.address);

  const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS;
  if (!POOL_MANAGER || POOL_MANAGER === "0x0000000000000000000000000000000000000000") {
    console.error("\nPOOL_MANAGER_ADDRESS not set in env.");
    process.exit(1);
  }
  console.log("PoolManager:", POOL_MANAGER);

  console.log("\nDeploying PoolSwapTest...");
  const PoolSwapTest = await v4Factory(ethers, deployer, "PoolSwapTest");
  const swapRouter = await PoolSwapTest.deploy(POOL_MANAGER);
  await swapRouter.waitForDeployment();
  const swapRouterAddr = await swapRouter.getAddress();
  console.log("PoolSwapTest deployed:", swapRouterAddr);

  console.log("\nDeploying PoolModifyLiquidityTest...");
  const PoolModifyLiquidityTest = await v4Factory(ethers, deployer, "PoolModifyLiquidityTest");
  const lpRouter = await PoolModifyLiquidityTest.deploy(POOL_MANAGER);
  await lpRouter.waitForDeployment();
  const lpRouterAddr = await lpRouter.getAddress();
  console.log("PoolModifyLiquidityTest deployed:", lpRouterAddr);

  console.log("\n=== Add to .env files ===");
  console.log("POOL_SWAP_TEST_ADDRESS=" + swapRouterAddr);
  console.log("POOL_MODIFY_LIQUIDITY_TEST_ADDRESS=" + lpRouterAddr);
  console.log("NEXT_PUBLIC_POOL_SWAP_TEST=" + swapRouterAddr);
  console.log("NEXT_PUBLIC_POOL_MODIFY_LIQUIDITY_TEST=" + lpRouterAddr);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
