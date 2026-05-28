export const PEGASUS_HOOK_ABI = [
  {
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
    ],
    name: "getCurrentFee",
    outputs: [{ name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
    ],
    name: "getPoolMetrics",
    outputs: [
      { name: "swapCount", type: "uint256" },
      { name: "consecutiveDirection", type: "uint8" },
      { name: "blockSwapCount", type: "uint256" },
      { name: "currentFee", type: "uint24" },
      { name: "volatility", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
      { name: "fee", type: "uint24" },
      { name: "active", type: "bool" },
    ],
    name: "setOracleFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "oracle",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "bytes32" },
      { indexed: false, name: "oldFee", type: "uint24" },
      { indexed: false, name: "newFee", type: "uint24" },
      { indexed: false, name: "reason", type: "string" },
    ],
    name: "FeeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "bytes32" },
      { indexed: false, name: "volatility", type: "uint256" },
      { indexed: false, name: "consecutiveDirection", type: "uint8" },
      { indexed: false, name: "blockSwapCount", type: "uint256" },
      { indexed: false, name: "resultingFee", type: "uint24" },
    ],
    name: "SwapAnalyzed",
    type: "event",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const POOL_SWAP_TEST_ABI = [
  {
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
      { name: "params", type: "tuple", components: [
        { name: "zeroForOne", type: "bool" },
        { name: "amountSpecified", type: "int256" },
        { name: "sqrtPriceLimitX96", type: "uint160" },
      ]},
      { name: "testSettings", type: "tuple", components: [
        { name: "takeClaims", type: "bool" },
        { name: "settleUsingBurn", type: "bool" },
      ]},
      { name: "hookData", type: "bytes" },
    ],
    name: "swap",
    outputs: [{ name: "delta", type: "int256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export const POOL_MODIFY_LIQUIDITY_TEST_ABI = [
  {
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
      { name: "params", type: "tuple", components: [
        { name: "tickLower", type: "int24" },
        { name: "tickUpper", type: "int24" },
        { name: "liquidityDelta", type: "int256" },
        { name: "salt", type: "bytes32" },
      ]},
      { name: "hookData", type: "bytes" },
      { name: "settleUsingBurn", type: "bool" },
      { name: "takeClaims", type: "bool" },
    ],
    name: "modifyLiquidity",
    outputs: [
      { name: "delta", type: "int256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;
