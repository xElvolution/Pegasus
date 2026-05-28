import "@nomicfoundation/hardhat-mocha";
import HardhatEthers from "@nomicfoundation/hardhat-ethers";
import fs from "node:fs";

if (fs.existsSync(".env")) {
  process.loadEnvFile(".env");
}

/** @type {import("hardhat/config").HardhatUserConfig} */
const config = {
  plugins: [HardhatEthers],
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
    },
    xlayerTestnet: {
      type: "http",
      url: "https://testrpc.xlayer.tech",
      chainId: 1952,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    xlayerMainnet: {
      type: "http",
      url: "https://rpc.xlayer.tech",
      chainId: 196,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: {
      mocha: "./test",
    },
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
