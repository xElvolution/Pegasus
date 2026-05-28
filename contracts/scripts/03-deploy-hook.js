import { network } from "hardhat";
import fs from "fs";

const REQUIRED_FLAGS = 0x2080;
const FLAG_MASK = 0x3FFF;
const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

async function main() {
  const { ethers } = await network.connect({ network: "xlayerTestnet" });
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("=== Deploy PegasusHook (CREATE2 with mined address) ===");
  console.log("Deployer:", deployer.address);
  console.log("Balance: ", ethers.formatEther(balance), "OKB");

  const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS;
  if (!POOL_MANAGER || POOL_MANAGER === "0x0000000000000000000000000000000000000000") {
    console.error("\nPOOL_MANAGER_ADDRESS not set. Run 01-deploy-poolmanager.js first and put the address in your env.");
    process.exit(1);
  }
  const ORACLE = deployer.address;

  console.log("PoolManager:", POOL_MANAGER);
  console.log("Oracle:     ", ORACLE);
  console.log("Required flag bits: 0x" + REQUIRED_FLAGS.toString(16).padStart(4, "0"), "(beforeInitialize + beforeSwap)");

  const PegasusHook = await ethers.getContractFactory("PegasusHook");
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [POOL_MANAGER, ORACLE]
  );
  const initCode = ethers.concat([PegasusHook.bytecode, constructorArgs]);
  const initCodeHash = ethers.keccak256(initCode);

  console.log("\nMining for hook address (this can take a few minutes)...");
  const mineStart = Date.now();
  let salt = 0n;
  let hookAddress;
  const maxAttempts = 5_000_000;

  for (let i = 0; i < maxAttempts; i++) {
    const saltBytes = ethers.zeroPadValue(ethers.toBeHex(salt), 32);
    const addr = ethers.getCreate2Address(CREATE2_DEPLOYER, saltBytes, initCodeHash);
    if ((BigInt(addr) & BigInt(FLAG_MASK)) === BigInt(REQUIRED_FLAGS)) {
      hookAddress = addr;
      console.log(`Found in ${i + 1} attempts (${((Date.now() - mineStart) / 1000).toFixed(1)}s)`);
      console.log("Salt:        ", saltBytes);
      console.log("Hook address:", hookAddress);
      break;
    }
    salt++;
    if (i > 0 && i % 250000 === 0) {
      console.log(`  ...tried ${i.toLocaleString()} salts`);
    }
  }

  if (!hookAddress) {
    console.error("Failed to find matching address within", maxAttempts, "attempts");
    process.exit(1);
  }

  const existingCode = await ethers.provider.getCode(hookAddress);
  if (existingCode !== "0x") {
    console.error("Address already has bytecode. Pick a different salt or change constructor args.");
    process.exit(1);
  }

  console.log("\nDeploying via CREATE2...");
  const saltBytes = ethers.zeroPadValue(ethers.toBeHex(salt), 32);
  const tx = await deployer.sendTransaction({
    to: CREATE2_DEPLOYER,
    data: ethers.concat([saltBytes, initCode]),
  });
  const receipt = await tx.wait();

  const deployedCode = await ethers.provider.getCode(hookAddress);
  if (deployedCode === "0x") {
    console.error("Deployment tx confirmed but no code at expected address.");
    process.exit(1);
  }

  console.log("Tx hash:     ", tx.hash);
  console.log("Block:       ", receipt.blockNumber);
  console.log("Code size:   ", (deployedCode.length - 2) / 2, "bytes");

  if (!fs.existsSync("deployments")) fs.mkdirSync("deployments");
  fs.writeFileSync(
    "deployments/hook.json",
    JSON.stringify({ hookAddress, salt: saltBytes, poolManager: POOL_MANAGER, oracle: ORACLE, txHash: tx.hash, block: receipt.blockNumber }, null, 2)
  );
  console.log("\nSaved deployments/hook.json");

  console.log("\n=== Add to .env files ===");
  console.log("PEGASUS_HOOK_ADDRESS=" + hookAddress);
  console.log("NEXT_PUBLIC_PEGASUS_HOOK=" + hookAddress);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
