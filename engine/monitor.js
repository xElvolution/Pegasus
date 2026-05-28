import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const PEGASUS_HOOK_ABI = [
  "event FeeUpdated(bytes32 indexed poolId, uint24 oldFee, uint24 newFee, string reason)",
  "event SwapAnalyzed(bytes32 indexed poolId, uint256 volatility, uint8 consecutiveDirection, uint256 blockSwapCount, uint24 resultingFee)",
  "event OracleFeeSet(bytes32 indexed poolId, uint24 fee, bool active)",
];

async function monitor() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const hook = new ethers.Contract(
    process.env.PEGASUS_HOOK_ADDRESS,
    PEGASUS_HOOK_ABI,
    provider
  );

  console.log("=== Pegasus Event Monitor ===");
  console.log(`Watching hook: ${process.env.PEGASUS_HOOK_ADDRESS}`);
  console.log("");

  hook.on("FeeUpdated", (poolId, oldFee, newFee, reason) => {
    const oldPct = (Number(oldFee) / 10000 * 100).toFixed(2);
    const newPct = (Number(newFee) / 10000 * 100).toFixed(2);
    console.log(`[FeeUpdated] Pool: ${poolId.slice(0, 10)}...`);
    console.log(`  ${oldPct}% -> ${newPct}% (${reason})`);
    console.log("");
  });

  hook.on("SwapAnalyzed", (poolId, volatility, consecutiveDir, blockSwaps, fee) => {
    console.log(`[SwapAnalyzed] Pool: ${poolId.slice(0, 10)}...`);
    console.log(`  Volatility: ${volatility} bps`);
    console.log(`  Consecutive same-dir: ${consecutiveDir}`);
    console.log(`  Block swaps: ${blockSwaps}`);
    console.log(`  Resulting fee: ${(Number(fee) / 100).toFixed(1)} bps`);
    console.log("");
  });

  hook.on("OracleFeeSet", (poolId, fee, active) => {
    console.log(`[OracleFeeSet] Pool: ${poolId.slice(0, 10)}...`);
    console.log(`  Fee: ${(Number(fee) / 100).toFixed(1)} bps | Active: ${active}`);
    console.log("");
  });

  console.log("Listening for events... (Ctrl+C to stop)");
}

monitor().catch(console.error);
