import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const PEGASUS_HOOK_ABI = [
  "function setOracleFee(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint24 fee, bool active) external",
  "function getCurrentFee(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint24)",
  "function getPoolMetrics(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint256 swapCount, uint8 consecutiveDirection, uint256 blockSwapCount, uint24 currentFee, uint256 volatility)",
  "function oracle() external view returns (address)",
  "event FeeUpdated(bytes32 indexed poolId, uint24 oldFee, uint24 newFee, string reason)",
  "event SwapAnalyzed(bytes32 indexed poolId, uint256 volatility, uint8 consecutiveDirection, uint256 blockSwapCount, uint24 resultingFee)",
];

const DYNAMIC_FEE_FLAG = 0x800000;
const TICK_SPACING_DEFAULT = 60;
const MIN_FEE = 100;
const MAX_FEE = 10000;
const BASE_FEE = 3000;
const FEE_DELTA_THRESHOLD = 200; // bps difference required before pushing

class PegasusEngine {
  constructor() {
    if (!process.env.RPC_URL) throw new Error("RPC_URL not set");
    if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY not set");
    if (!process.env.PEGASUS_HOOK_ADDRESS || process.env.PEGASUS_HOOK_ADDRESS === "0x0000000000000000000000000000000000000000")
      throw new Error("PEGASUS_HOOK_ADDRESS not set");
    if (!process.env.TOKEN_A_ADDRESS || process.env.TOKEN_A_ADDRESS === "0x0000000000000000000000000000000000000000")
      throw new Error("TOKEN_A_ADDRESS not set");
    if (!process.env.TOKEN_B_ADDRESS || process.env.TOKEN_B_ADDRESS === "0x0000000000000000000000000000000000000000")
      throw new Error("TOKEN_B_ADDRESS not set");

    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.hook = new ethers.Contract(
      process.env.PEGASUS_HOOK_ADDRESS,
      PEGASUS_HOOK_ABI,
      this.wallet
    );

    // Build PoolKey with sorted currencies (V4 requires currency0 < currency1)
    const a = process.env.TOKEN_A_ADDRESS;
    const b = process.env.TOKEN_B_ADDRESS;
    const [c0, c1] = BigInt(a) < BigInt(b) ? [a, b] : [b, a];
    this.poolKey = {
      currency0: c0,
      currency1: c1,
      fee: DYNAMIC_FEE_FLAG,
      tickSpacing: parseInt(process.env.TICK_SPACING || String(TICK_SPACING_DEFAULT), 10),
      hooks: process.env.PEGASUS_HOOK_ADDRESS,
    };

    this.lastPushedFee = null;
    this.metricsHistory = [];
  }

  // EMA-style volatility — gives more weight to recent observations than the on-chain
  // simple-average calculation, so the oracle can react faster than the pure on-chain logic.
  computeSmoothVolatility(samples) {
    if (samples.length === 0) return 0;
    const alpha = 0.4;
    let ema = samples[0];
    for (let i = 1; i < samples.length; i++) {
      ema = alpha * samples[i] + (1 - alpha) * ema;
    }
    return ema;
  }

  computeOptimalFee(metrics, smoothVol) {
    let fee = BASE_FEE;

    // Volatility surge: scale up to ~1.8x base when EMA volatility exceeds threshold.
    if (smoothVol > 50) {
      const mult = 1 + Math.min(0.8, (smoothVol - 50) / 200);
      fee = Math.floor(fee * mult);
    } else if (smoothVol < 10) {
      // Calm market — compress fees to attract volume.
      fee = Math.floor(fee * 0.6);
    }

    // MEV pattern — escalate aggressively if hook already detected sandwich pattern.
    if (metrics.consecutiveDirection >= 3) {
      fee = Math.max(fee, BASE_FEE + 5000);
    } else if (metrics.consecutiveDirection >= 2) {
      fee = Math.floor(fee * 1.15);
    }

    // Block congestion — many swaps in one block means high contention; demand premium.
    if (metrics.blockSwapCount > 3) {
      fee += metrics.blockSwapCount * 200;
    }

    return Math.max(MIN_FEE, Math.min(MAX_FEE, fee));
  }

  async readMetrics() {
    const [swapCount, consecutiveDirection, blockSwapCount, currentFee, volatility] =
      await this.hook.getPoolMetrics(this.poolKey);
    return {
      swapCount: Number(swapCount),
      consecutiveDirection: Number(consecutiveDirection),
      blockSwapCount: Number(blockSwapCount),
      currentFee: Number(currentFee),
      volatility: Number(volatility),
    };
  }

  async pushOracleFee(fee) {
    console.log(`  >> Pushing oracle fee ${fee} (${(fee / 100).toFixed(1)} bps, ${(fee / 10000 * 100).toFixed(2)}%) on-chain...`);
    try {
      const tx = await this.hook.setOracleFee(this.poolKey, fee, true);
      console.log(`     tx: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`     confirmed in block ${receipt.blockNumber}`);
      this.lastPushedFee = fee;
      return true;
    } catch (err) {
      console.error(`     setOracleFee failed: ${err.message}`);
      return false;
    }
  }

  async tick() {
    const metrics = await this.readMetrics();
    this.metricsHistory.push({ ts: Date.now(), volatility: metrics.volatility });
    if (this.metricsHistory.length > 30) {
      this.metricsHistory = this.metricsHistory.slice(-30);
    }

    const smoothVol = this.computeSmoothVolatility(
      this.metricsHistory.map((m) => m.volatility)
    );
    const optimal = this.computeOptimalFee(metrics, smoothVol);

    console.log(`[${new Date().toISOString()}]`);
    console.log(`  on-chain: fee=${metrics.currentFee} swaps=${metrics.swapCount} consec=${metrics.consecutiveDirection} blockSwaps=${metrics.blockSwapCount} vol=${metrics.volatility}`);
    console.log(`  smooth vol (EMA): ${smoothVol.toFixed(1)}`);
    console.log(`  optimal fee: ${optimal} (${(optimal / 100).toFixed(1)} bps)`);

    const reference = this.lastPushedFee ?? metrics.currentFee;
    if (Math.abs(optimal - reference) >= FEE_DELTA_THRESHOLD) {
      await this.pushOracleFee(optimal);
    } else {
      console.log(`  >> within ${FEE_DELTA_THRESHOLD} bps of reference, skipping push`);
    }
    console.log("");
  }

  subscribeEvents() {
    this.hook.on("FeeUpdated", (poolId, oldFee, newFee, reason) => {
      console.log(`[event] FeeUpdated  ${oldFee} → ${newFee}  (${reason})`);
    });
    this.hook.on("SwapAnalyzed", (poolId, volatility, consec, blockSwaps, fee) => {
      console.log(`[event] SwapAnalyzed  vol=${volatility} consec=${consec} blockSwaps=${blockSwaps} fee=${fee}`);
    });
  }

  async run(intervalMs) {
    console.log("=== Pegasus Oracle Engine ===");
    console.log(`Network:    chainId ${process.env.CHAIN_ID || "1952"} (X Layer Testnet)`);
    console.log(`Hook:       ${process.env.PEGASUS_HOOK_ADDRESS}`);
    console.log(`Oracle:     ${this.wallet.address}`);
    console.log(`Pool currency0: ${this.poolKey.currency0}`);
    console.log(`Pool currency1: ${this.poolKey.currency1}`);
    console.log(`Tick spacing:   ${this.poolKey.tickSpacing}`);

    const onChainOracle = await this.hook.oracle();
    if (onChainOracle.toLowerCase() !== this.wallet.address.toLowerCase()) {
      console.warn(`\nWARN: oracle on-chain is ${onChainOracle}, this wallet is ${this.wallet.address}.`);
      console.warn("setOracleFee txs will revert. Either run from the oracle EOA or call setOracle to rotate.");
    }

    console.log(`\nInterval: ${intervalMs / 1000}s`);
    console.log("");

    this.subscribeEvents();

    await this.tick();
    setInterval(() => {
      this.tick().catch((err) => console.error("tick error:", err.message));
    }, intervalMs);
  }
}

const interval = parseInt(process.env.UPDATE_INTERVAL_MS || "10000", 10);
const engine = new PegasusEngine();
engine.run(interval).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
