import { network } from "hardhat";
import { v4ContractAt } from "./v4-artifacts.js";

const DYNAMIC_FEE_FLAG = 0x800000;
const TICK_SPACING = 60;
const SQRT_PRICE_X96_1_TO_1 = 79228162514264337593543950336n;

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [signer] = await ethers.getSigners();

  const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS;
  const HOOK = process.env.PEGASUS_HOOK_ADDRESS;
  const TOKEN_A = process.env.TOKEN_A_ADDRESS;
  const TOKEN_B = process.env.TOKEN_B_ADDRESS;

  for (const [name, val] of Object.entries({ POOL_MANAGER, HOOK, TOKEN_A, TOKEN_B })) {
    if (!val || val === "0x0000000000000000000000000000000000000000") {
      console.error(name + " not set. Run prior deploy scripts and update env first.");
      process.exit(1);
    }
  }

  console.log("=== Initialize Pool ===");
  console.log("PoolManager:", POOL_MANAGER);
  console.log("Hook:       ", HOOK);
  console.log("Token A:    ", TOKEN_A);
  console.log("Token B:    ", TOKEN_B);

  const [c0, c1] =
    BigInt(TOKEN_A) < BigInt(TOKEN_B) ? [TOKEN_A, TOKEN_B] : [TOKEN_B, TOKEN_A];

  const poolKey = {
    currency0: c0,
    currency1: c1,
    fee: DYNAMIC_FEE_FLAG,
    tickSpacing: TICK_SPACING,
    hooks: HOOK,
  };

  console.log("\nPoolKey:");
  console.log("  currency0:  ", poolKey.currency0);
  console.log("  currency1:  ", poolKey.currency1);
  console.log("  fee:         0x" + poolKey.fee.toString(16), "(DYNAMIC_FEE_FLAG)");
  console.log("  tickSpacing:", poolKey.tickSpacing);
  console.log("  hooks:      ", poolKey.hooks);

  const pm = await v4ContractAt(ethers, signer, "PoolManager", POOL_MANAGER);

  console.log("\nCalling initialize at sqrtPriceX96 = 1:1 ...");
  const tx = await pm.initialize(poolKey, SQRT_PRICE_X96_1_TO_1);
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  const poolIdHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint24", "int24", "address"],
      [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
    )
  );
  console.log("\nPoolId:", poolIdHash);
  console.log("\nPool initialized. Next: 06-add-liquidity.js");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
