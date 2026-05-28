import { network } from "hardhat";
import { v4ContractAt } from "./v4-artifacts.js";

const TICK_SPACING = 60;
const DYNAMIC_FEE_FLAG = 0x800000;
const TICK_LOWER = -6000;
const TICK_UPPER = 6000;

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [deployer] = await ethers.getSigners();

  const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS;
  const HOOK = process.env.PEGASUS_HOOK_ADDRESS;
  const TOKEN_A = process.env.TOKEN_A_ADDRESS;
  const TOKEN_B = process.env.TOKEN_B_ADDRESS;
  const LP_ROUTER = process.env.POOL_MODIFY_LIQUIDITY_TEST_ADDRESS;

  for (const [name, val] of Object.entries({ POOL_MANAGER, HOOK, TOKEN_A, TOKEN_B, LP_ROUTER })) {
    if (!val || val === "0x0000000000000000000000000000000000000000") {
      console.error(name + " not set.");
      process.exit(1);
    }
  }

  console.log("=== Add Liquidity ===");
  console.log("Deployer:        ", deployer.address);
  console.log("LP Router:       ", LP_ROUTER);
  console.log("Tick range:       [" + TICK_LOWER + ", " + TICK_UPPER + "]");

  const [c0, c1] =
    BigInt(TOKEN_A) < BigInt(TOKEN_B) ? [TOKEN_A, TOKEN_B] : [TOKEN_B, TOKEN_A];

  const poolKey = {
    currency0: c0,
    currency1: c1,
    fee: DYNAMIC_FEE_FLAG,
    tickSpacing: TICK_SPACING,
    hooks: HOOK,
  };

  const tokenC0 = await ethers.getContractAt("MockERC20", c0);
  const tokenC1 = await ethers.getContractAt("MockERC20", c1);

  const mintAmount = ethers.parseEther("1000000");
  console.log("\nMinting 1M of each to deployer (no-op if already minted)...");
  await (await tokenC0.mint(deployer.address, mintAmount)).wait();
  await (await tokenC1.mint(deployer.address, mintAmount)).wait();

  console.log("\nApproving LP router to spend tokens...");
  const max = ethers.MaxUint256;
  await (await tokenC0.approve(LP_ROUTER, max)).wait();
  await (await tokenC1.approve(LP_ROUTER, max)).wait();

  const liquidityDelta = ethers.parseEther("100000");
  const params = {
    tickLower: TICK_LOWER,
    tickUpper: TICK_UPPER,
    liquidityDelta,
    salt: ethers.ZeroHash,
  };

  console.log("\nCalling modifyLiquidity (delta = +100,000)...");
  const lpRouter = await v4ContractAt(ethers, deployer, "PoolModifyLiquidityTest", LP_ROUTER);
  const tx = await lpRouter.modifyLiquidity(poolKey, params, "0x", false, false, {
    gasLimit: 5_000_000,
  });
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Block:  ", receipt.blockNumber);
  console.log("Gas:    ", receipt.gasUsed.toString());

  console.log("\nLiquidity added. Pool is ready for swaps.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
