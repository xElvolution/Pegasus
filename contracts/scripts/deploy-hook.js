import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PegasusHook with CREATE2 address mining...");
  console.log("Deployer:", deployer.address);

  const REQUIRED_FLAGS = 0x2080; // beforeInitialize (bit 13) + beforeSwap (bit 7)
  const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

  const PegasusHook = await hre.ethers.getContractFactory("PegasusHook");

  const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000001";
  const ORACLE = deployer.address;

  const constructorArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [POOL_MANAGER, ORACLE]
  );

  const initCode = hre.ethers.concat([PegasusHook.bytecode, constructorArgs]);
  const initCodeHash = hre.ethers.keccak256(initCode);

  console.log("Init code hash:", initCodeHash);
  console.log("Mining for address with flags:", "0x" + REQUIRED_FLAGS.toString(16));

  let salt = 0n;
  let hookAddress;
  const maxAttempts = 1000000;

  for (let i = 0; i < maxAttempts; i++) {
    const saltBytes = hre.ethers.zeroPadValue(hre.ethers.toBeHex(salt), 32);
    const addr = hre.ethers.getCreate2Address(CREATE2_DEPLOYER, saltBytes, initCodeHash);
    const addrNum = BigInt(addr);

    if ((addrNum & BigInt(0x3FFF)) === BigInt(REQUIRED_FLAGS)) {
      hookAddress = addr;
      console.log(`\nFound matching address after ${i + 1} attempts!`);
      console.log("Salt:", saltBytes);
      console.log("Hook address:", hookAddress);
      break;
    }

    salt++;
    if (i % 100000 === 0 && i > 0) {
      console.log(`  Tried ${i} salts...`);
    }
  }

  if (!hookAddress) {
    console.log("Could not find matching address in", maxAttempts, "attempts");
    return;
  }

  console.log("\nDeploying hook contract...");
  const tx = await deployer.sendTransaction({
    to: CREATE2_DEPLOYER,
    data: hre.ethers.concat([
      hre.ethers.zeroPadValue(hre.ethers.toBeHex(salt), 32),
      initCode,
    ]),
  });

  await tx.wait();
  console.log("PegasusHook deployed to:", hookAddress);

  console.log("\n--- Hook Deployment Summary ---");
  console.log("Hook Address:    ", hookAddress);
  console.log("Pool Manager:    ", POOL_MANAGER);
  console.log("Oracle:          ", ORACLE);
  console.log("Permissions:     beforeInitialize + beforeSwap");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
