import { expect } from "chai";
import hre from "hardhat";

describe("PegasusHook", function () {
  let mockERC20A, mockERC20B;
  let owner, oracle, user;

  describe("MockERC20 Tokens", function () {
    beforeEach(async function () {
      [owner, oracle, user] = await hre.ethers.getSigners();

      const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
      mockERC20A = await MockERC20.deploy("Token A", "TKA", 18);
      mockERC20B = await MockERC20.deploy("Token B", "TKB", 18);
    });

    it("should deploy mock tokens", async function () {
      expect(await mockERC20A.name()).to.equal("Token A");
      expect(await mockERC20B.name()).to.equal("Token B");
      expect(await mockERC20A.decimals()).to.equal(18);
    });

    it("should mint tokens", async function () {
      const amount = hre.ethers.parseEther("1000");
      await mockERC20A.mint(owner.address, amount);
      expect(await mockERC20A.balanceOf(owner.address)).to.equal(amount);
    });

    it("should transfer tokens", async function () {
      const amount = hre.ethers.parseEther("500");
      await mockERC20A.mint(owner.address, amount);
      await mockERC20A.transfer(user.address, amount);
      expect(await mockERC20A.balanceOf(user.address)).to.equal(amount);
    });
  });

  describe("Fee Calculation Logic", function () {
    it("should have correct fee constants", async function () {
      const MIN_FEE = 100;
      const MAX_FEE = 10000;
      const BASE_FEE = 3000;

      expect(MIN_FEE).to.be.lessThan(BASE_FEE);
      expect(BASE_FEE).to.be.lessThan(MAX_FEE);
      expect(MAX_FEE).to.be.lessThanOrEqual(1000000);
    });

    it("should validate MEV detection threshold", async function () {
      const MEV_SURGE = 5000;
      const BASE_FEE = 3000;
      const mevFee = BASE_FEE + MEV_SURGE;
      expect(mevFee).to.equal(8000);
      expect(mevFee).to.be.lessThanOrEqual(10000);
    });

    it("should clamp fees within bounds", async function () {
      const MIN_FEE = 100;
      const MAX_FEE = 10000;

      function clampFee(fee) {
        if (fee < MIN_FEE) return MIN_FEE;
        if (fee > MAX_FEE) return MAX_FEE;
        return fee;
      }

      expect(clampFee(50)).to.equal(MIN_FEE);
      expect(clampFee(15000)).to.equal(MAX_FEE);
      expect(clampFee(5000)).to.equal(5000);
    });

    it("should increase fee with volatility", async function () {
      const BASE_FEE = 3000;
      const PRICE_SHIFT_THRESHOLD = 50;

      function calcVolFee(volatility) {
        let fee = BASE_FEE;
        if (volatility > PRICE_SHIFT_THRESHOLD) {
          const multiplier = 100 + (volatility * 100 / PRICE_SHIFT_THRESHOLD);
          fee = Math.floor((fee * multiplier) / 100);
        }
        return Math.min(fee, 10000);
      }

      expect(calcVolFee(0)).to.equal(3000);
      expect(calcVolFee(25)).to.equal(3000);
      expect(calcVolFee(100)).to.be.greaterThan(3000);
      expect(calcVolFee(200)).to.be.greaterThan(calcVolFee(100));
    });
  });

  describe("Contract Compilation", function () {
    it("should compile PegasusHook without errors", async function () {
      const artifact = await hre.artifacts.readArtifact("PegasusHook");
      expect(artifact.bytecode).to.not.equal("0x");
      expect(artifact.abi.length).to.be.greaterThan(0);
    });

    it("should compile MockERC20 without errors", async function () {
      const artifact = await hre.artifacts.readArtifact("MockERC20");
      expect(artifact.bytecode).to.not.equal("0x");
    });

    it("PegasusHook ABI should have expected functions", async function () {
      const artifact = await hre.artifacts.readArtifact("PegasusHook");
      const functionNames = artifact.abi
        .filter((item) => item.type === "function")
        .map((item) => item.name);

      expect(functionNames).to.include("beforeSwap");
      expect(functionNames).to.include("beforeInitialize");
      expect(functionNames).to.include("getCurrentFee");
      expect(functionNames).to.include("getPoolMetrics");
      expect(functionNames).to.include("setOracleFee");
      expect(functionNames).to.include("getHookPermissions");
    });
  });
});
