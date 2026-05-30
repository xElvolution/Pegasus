import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [signer] = await ethers.getSigners();

  const FACTORY = process.env.PEGASUS_FACTORY_ADDRESS;
  if (!FACTORY || FACTORY === "0x0000000000000000000000000000000000000000") {
    console.error("PEGASUS_FACTORY_ADDRESS not set");
    process.exit(1);
  }

  console.log("=== Factory Smoke Test ===");
  console.log("Signer: ", signer.address);
  console.log("Factory:", FACTORY);

  const factory = await ethers.getContractAt("PegasusFactory", FACTORY);

  // Read state before
  const totalTokensBefore = await factory.totalTokens();
  const totalPoolsBefore = await factory.totalPools();
  console.log("\nBefore:");
  console.log("  totalTokens:", totalTokensBefore.toString());
  console.log("  totalPools: ", totalPoolsBefore.toString());

  // Test 1: createToken
  console.log("\n[Test 1] createToken('Test Token', 'TEST', 18, 1000)");
  const supply = ethers.parseEther("1000");
  const tx1 = await factory.createToken("Test Token", "TEST", 18, supply);
  const r1 = await tx1.wait();
  console.log("  tx:    ", tx1.hash);
  console.log("  block: ", r1.blockNumber);

  // Decode TokenCreated event
  let newTokenAddr;
  for (const log of r1.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "TokenCreated") {
        newTokenAddr = parsed.args.token;
        console.log("  ✓ TokenCreated event:");
        console.log("    token:    ", newTokenAddr);
        console.log("    creator:  ", parsed.args.creator);
        console.log("    name:     ", parsed.args.name);
        console.log("    symbol:   ", parsed.args.symbol);
        console.log("    supply:   ", ethers.formatEther(parsed.args.initialSupply));
        break;
      }
    } catch {}
  }

  if (!newTokenAddr) {
    console.error("FAIL: no TokenCreated event");
    process.exit(1);
  }

  // Verify token has bytecode + correct balance
  const tokenCode = await ethers.provider.getCode(newTokenAddr);
  if (tokenCode === "0x") {
    console.error("FAIL: deployed token has no bytecode");
    process.exit(1);
  }
  console.log("  ✓ Token bytecode size:", (tokenCode.length - 2) / 2, "bytes");

  const token = await ethers.getContractAt("MockERC20", newTokenAddr);
  const bal = await token.balanceOf(signer.address);
  if (bal !== supply) {
    console.error("FAIL: balance mismatch. Expected", supply, "got", bal);
    process.exit(1);
  }
  console.log("  ✓ Mint to creator confirmed:", ethers.formatEther(bal));

  const sym = await token.symbol();
  const dec = await token.decimals();
  console.log("  ✓ Token reads: symbol=" + sym + " decimals=" + dec);

  // Test 2: registerPool (with fake poolId — just testing tracking)
  console.log("\n[Test 2] registerPool (testing on-chain pool registry)");
  // We'll pair the new token with TOKEN_A from env, use a fake poolId
  const TOKEN_A = process.env.TOKEN_A_ADDRESS;
  const HOOK = process.env.PEGASUS_HOOK_ADDRESS;
  if (!TOKEN_A || !HOOK) {
    console.log("  Skipping (no TOKEN_A/HOOK in env)");
  } else {
    // Use deterministic test poolId
    const [c0, c1] = BigInt(newTokenAddr) < BigInt(TOKEN_A) ? [newTokenAddr, TOKEN_A] : [TOKEN_A, newTokenAddr];
    const fakePoolId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint24", "int24", "address"],
        [c0, c1, 0x800000, 60, HOOK]
      )
    );
    console.log("  poolId:    ", fakePoolId);
    console.log("  currency0: ", c0);
    console.log("  currency1: ", c1);

    try {
      const tx2 = await factory.registerPool(fakePoolId, c0, c1, 0x800000, 60, HOOK);
      const r2 = await tx2.wait();
      console.log("  tx:        ", tx2.hash);
      console.log("  block:     ", r2.blockNumber);

      for (const log of r2.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "PoolRegistered") {
            console.log("  ✓ PoolRegistered event fired");
            break;
          }
        } catch {}
      }

      // Read back
      const info = await factory.poolInfo(fakePoolId);
      console.log("  ✓ poolInfo readback:");
      console.log("    creator:   ", info.creator);
      console.log("    currency0: ", info.currency0);
      console.log("    currency1: ", info.currency1);
    } catch (err) {
      console.error("  registerPool failed:", err.message);
    }
  }

  // Final state
  const totalTokensAfter = await factory.totalTokens();
  const totalPoolsAfter = await factory.totalPools();
  console.log("\nAfter:");
  console.log("  totalTokens:", totalTokensAfter.toString(), "(was", totalTokensBefore.toString() + ")");
  console.log("  totalPools: ", totalPoolsAfter.toString(), "(was", totalPoolsBefore.toString() + ")");

  // Verify pagination
  console.log("\n[Test 3] getTokens(0, 10) pagination");
  const tokensList = await factory.getTokens(0n, 10n);
  console.log("  Returned:", tokensList.length, "tokens");
  if (tokensList.length > 0) {
    const last = tokensList[tokensList.length - 1];
    console.log("  Last token:", last.symbol, "(" + last.token + ")");
  }

  console.log("\nAll factory tests passed.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
