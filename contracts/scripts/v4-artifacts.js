import fs from "node:fs";
import path from "node:path";

// V4 ships pre-built foundry artifacts inside the npm packages.
// These are not picked up by Hardhat's compiler (different format and outside the sources path),
// so we read them directly and feed abi + bytecode into ethers.ContractFactory.

const v4CoreOut = path.resolve(
  "node_modules/.pnpm/@uniswap+v4-core@1.0.2/node_modules/@uniswap/v4-core/out"
);

function loadFoundryArtifact(contractName) {
  const file = path.join(v4CoreOut, contractName + ".sol", contractName + ".json");
  if (!fs.existsSync(file)) {
    throw new Error("Foundry artifact not found: " + file);
  }
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    abi: json.abi,
    bytecode: json.bytecode.object,
  };
}

export function loadV4Artifact(contractName) {
  return loadFoundryArtifact(contractName);
}

export async function v4Factory(ethers, signer, contractName) {
  const { abi, bytecode } = loadFoundryArtifact(contractName);
  return new ethers.ContractFactory(abi, bytecode, signer);
}

export async function v4ContractAt(ethers, signer, contractName, address) {
  const { abi } = loadFoundryArtifact(contractName);
  return new ethers.Contract(address, abi, signer);
}
