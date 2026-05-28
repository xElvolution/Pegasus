import { network } from "hardhat";
import { v4ContractAt } from "./v4-artifacts.js";

const TICK_SPACING = 60;
const DYNAMIC_FEE_FLAG = 0x800000;

const MIN_SQRT_PRICE = 4295128739n + 1n;
const MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342n - 1n;

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [deployer] = await ethers.getSigners();

  const HOOK = process.env.PEGASUS_HOOK_ADDRESS;
  const TOKEN_A = process.env.TOKEN_A_ADDRESS;
  const TOKEN_B = process.env.TOKEN_B_ADDRESS;
  const SWAP_ROUTER = process.env.POOL_SWAP_TEST_ADDRESS;

  for (const [name, val] of Object.entries({ HOOK, TOKEN_A, TOKEN_B, SWAP_ROUTER })) {
    if (!val || val === "0x0000000000000000000000000000000000000000") {
      console.error(name + " not set.");
      process.exit(1);
    }
  }

  const [c0, c1] =
    BigInt(TOKEN_A) < BigInt(TOKEN_B) ? [TOKEN_A, TOKEN_B] : [TOKEN_B, TOKEN_A];

  const poolKey = {
    currency0: c0,
    currency1: c1,
    fee: DYNAMIC_FEE_FLAG,
    tickSpacing: TICK_SPACING,
    hooks: HOOK,
  };

  const swapRouter = await v4ContractAt(ethers, deployer, "PoolSwapTest", SWAP_ROUTER);
  const hook = await ethers.getContractAt("PegasusHook", HOOK);

  const tokenC0 = await ethers.getContractAt("MockERC20", c0);
  const tokenC1 = await ethers.getContractAt("MockERC20", c1);
  console.log("Approving swap router...");
  await (await tokenC0.approve(SWAP_ROUTER, ethers.MaxUint256)).wait();
  await (await tokenC1.approve(SWAP_ROUTER, ethers.MaxUint256)).wait();

  console.log("\n=== Stage 3 Gate: Live Swap Through Hook ===");

  const feeBefore = await hook.getCurrentFee(poolKey);
  const metricsBefore = await hook.getPoolMetrics(poolKey);
  console.log("\nBefore swap:");
  console.log("  currentFee:           ", feeBefore.toString(), `(${(Number(feeBefore) / 10000).toFixed(2)}%)`);
  console.log("  swapCount:            ", metricsBefore[0].toString());
  console.log("  consecutiveDirection: ", metricsBefore[1].toString());
  console.log("  blockSwapCount:       ", metricsBefore[2].toString());
  console.log("  volatility:           ", metricsBefore[4].toString(), "bps");

  const swapAmount = ethers.parseEther("100");
  const swapParams = {
    zeroForOne: true,
    amountSpecified: -swapAmount,
    sqrtPriceLimitX96: MIN_SQRT_PRICE,
  };
  const testSettings = { takeClaims: false, settleUsingBurn: false };

  console.log("\nSwapping 100 of currency0 → currency1...");
  const tx = await swapRouter.swap(poolKey, swapParams, testSettings, "0x", {
    gasLimit: 5_000_000,
  });
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Block:  ", receipt.blockNumber);
  console.log("Gas:    ", receipt.gasUsed.toString());

  const swapAnalyzedTopic = hook.interface.getEvent("SwapAnalyzed").topicHash;
  const feeUpdatedTopic = hook.interface.getEvent("FeeUpdated").topicHash;

  console.log("\nHook events:");
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== HOOK.toLowerCase()) continue;
    if (log.topics[0] === swapAnalyzedTopic) {
      const parsed = hook.interface.parseLog(log);
      console.log("  SwapAnalyzed:");
      console.log("    poolId:              ", parsed.args.poolId);
      console.log("    volatility:          ", parsed.args.volatility.toString());
      console.log("    consecutiveDirection:", parsed.args.consecutiveDirection.toString());
      console.log("    blockSwapCount:      ", parsed.args.blockSwapCount.toString());
      console.log("    resultingFee:        ", parsed.args.resultingFee.toString());
    } else if (log.topics[0] === feeUpdatedTopic) {
      const parsed = hook.interface.parseLog(log);
      console.log("  FeeUpdated:", parsed.args.oldFee.toString(), "→", parsed.args.newFee.toString(), `(${parsed.args.reason})`);
    }
  }

  const feeAfter = await hook.getCurrentFee(poolKey);
  const metricsAfter = await hook.getPoolMetrics(poolKey);
  console.log("\nAfter swap:");
  console.log("  currentFee:           ", feeAfter.toString(), `(${(Number(feeAfter) / 10000).toFixed(2)}%)`);
  console.log("  swapCount:            ", metricsAfter[0].toString());
  console.log("  consecutiveDirection: ", metricsAfter[1].toString());
  console.log("  blockSwapCount:       ", metricsAfter[2].toString());

  console.log("\nIf you see SwapAnalyzed above with non-zero numbers, the hook is fully functional on X Layer testnet.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
