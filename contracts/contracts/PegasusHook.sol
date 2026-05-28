// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

/// @title PegasusHook — Adaptive Dynamic Fee Hook for Uniswap V4
/// @notice Dynamically adjusts LP fees based on volatility, volume, and MEV signals
contract PegasusHook is IHooks {
    using PoolIdLibrary for PoolKey;

    IPoolManager public immutable poolManager;

    // --- Fee Bounds ---
    uint24 public constant MIN_FEE = 100;       // 0.01%
    uint24 public constant MAX_FEE = 10000;      // 1%
    uint24 public constant BASE_FEE = 3000;      // 0.3% default

    // --- Volatility Detection ---
    uint256 public constant VOLATILITY_WINDOW = 10;
    uint256 public constant PRICE_SHIFT_THRESHOLD = 50; // 0.5% in basis points

    // --- MEV Detection ---
    uint8 public constant MEV_CONSECUTIVE_THRESHOLD = 3;
    uint24 public constant MEV_FEE_SURGE = 5000; // 0.5% surge on MEV detection

    // --- Per-Pool State ---
    struct PoolState {
        uint160[] priceHistory;
        uint256 priceIndex;
        uint256 swapCount;
        uint256 lastBlockSwapCount;
        uint256 lastBlockNumber;
        uint8 consecutiveSameDirection;
        bool lastDirection;
        uint24 currentFee;
    }

    mapping(PoolId => PoolState) public poolStates;

    // --- Oracle (off-chain updatable) ---
    address public oracle;
    mapping(PoolId => uint24) public oracleOverrideFee;
    mapping(PoolId => bool) public oracleOverrideActive;

    // --- Events ---
    event FeeUpdated(PoolId indexed poolId, uint24 oldFee, uint24 newFee, string reason);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event OracleFeeSet(PoolId indexed poolId, uint24 fee, bool active);
    event SwapAnalyzed(
        PoolId indexed poolId,
        uint256 volatility,
        uint8 consecutiveDirection,
        uint256 blockSwapCount,
        uint24 resultingFee
    );

    modifier onlyPoolManager() {
        require(msg.sender == address(poolManager), "PegasusHook: not pool manager");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "PegasusHook: not oracle");
        _;
    }

    constructor(IPoolManager _poolManager, address _oracle) {
        poolManager = _poolManager;
        oracle = _oracle;
    }

    // ==================== IHooks Implementation ====================

    function beforeInitialize(address, PoolKey calldata key, uint160 sqrtPriceX96)
        external
        onlyPoolManager
        returns (bytes4)
    {
        PoolId poolId = key.toId();
        PoolState storage state = poolStates[poolId];
        state.priceHistory = new uint160[](VOLATILITY_WINDOW);
        state.priceHistory[0] = sqrtPriceX96;
        state.priceIndex = 1;
        state.currentFee = BASE_FEE;
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24)
        external
        pure
        returns (bytes4)
    {
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.beforeAddLiquidity.selector;
    }

    function afterAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata)
        external
        pure
        returns (bytes4, BalanceDelta)
    {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeRemoveLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata)
        external
        pure
        returns (bytes4, BalanceDelta)
    {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeSwap(address, PoolKey calldata key, SwapParams calldata params, bytes calldata)
        external
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        PoolId poolId = key.toId();
        PoolState storage state = poolStates[poolId];

        // Always track swap metrics, regardless of fee source (oracle vs adaptive)
        _trackSwapMetrics(state, params, poolId);

        // If oracle override is active, use oracle fee
        if (oracleOverrideActive[poolId]) {
            uint24 oFee = oracleOverrideFee[poolId];
            uint24 oldFee = state.currentFee;
            state.currentFee = oFee;
            emit FeeUpdated(poolId, oldFee, oFee, "oracle_override");
            return (
                IHooks.beforeSwap.selector,
                BeforeSwapDeltaLibrary.ZERO_DELTA,
                oFee | LPFeeLibrary.OVERRIDE_FEE_FLAG
            );
        }

        uint24 newFee = _calculateDynamicFee(poolId, state, params);
        uint24 prev = state.currentFee;
        state.currentFee = newFee;

        if (prev != newFee) {
            emit FeeUpdated(poolId, prev, newFee, "adaptive");
        }

        return (
            IHooks.beforeSwap.selector,
            BeforeSwapDeltaLibrary.ZERO_DELTA,
            newFee | LPFeeLibrary.OVERRIDE_FEE_FLAG
        );
    }

    function _trackSwapMetrics(PoolState storage state, SwapParams calldata params, PoolId poolId) internal {
        // Per-block swap count
        if (block.number != state.lastBlockNumber) {
            state.lastBlockSwapCount = 1;
            state.lastBlockNumber = block.number;
        } else {
            state.lastBlockSwapCount++;
        }

        // Consecutive same-direction tracking
        bool currentDirection = params.zeroForOne;
        if (state.swapCount > 0 && currentDirection == state.lastDirection) {
            state.consecutiveSameDirection++;
        } else {
            state.consecutiveSameDirection = 1;
        }
        state.lastDirection = currentDirection;

        state.swapCount++;
    }

    function afterSwap(address, PoolKey calldata, SwapParams calldata, BalanceDelta, bytes calldata)
        external
        pure
        returns (bytes4, int128)
    {
        return (IHooks.afterSwap.selector, 0);
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.afterDonate.selector;
    }

    // ==================== Core Fee Logic ====================

    function _calculateDynamicFee(
        PoolId poolId,
        PoolState storage state,
        SwapParams calldata /* params */
    ) internal returns (uint24) {
        uint24 fee = BASE_FEE;

        // 1. Volatility component
        uint256 volatility = _calculateVolatility(state);
        if (volatility > PRICE_SHIFT_THRESHOLD) {
            uint256 volMultiplier = 100 + (volatility * 100 / PRICE_SHIFT_THRESHOLD);
            fee = uint24((uint256(fee) * volMultiplier) / 100);
        }

        // 2. MEV detection — surge if consecutive same-direction threshold hit
        // (counter is updated in _trackSwapMetrics, called before this)
        if (state.consecutiveSameDirection >= MEV_CONSECUTIVE_THRESHOLD) {
            fee = fee + MEV_FEE_SURGE;
        }

        // 3. Volume spike — many swaps in one block
        // (counter is updated in _trackSwapMetrics)
        if (state.lastBlockSwapCount > 3) {
            fee = fee + uint24(state.lastBlockSwapCount * 200);
        }

        // 4. Clamp to bounds
        if (fee < MIN_FEE) fee = MIN_FEE;
        if (fee > MAX_FEE) fee = MAX_FEE;

        emit SwapAnalyzed(
            poolId,
            volatility,
            state.consecutiveSameDirection,
            state.lastBlockSwapCount,
            fee
        );

        return fee;
    }

    function _calculateVolatility(PoolState storage state) internal view returns (uint256) {
        if (state.priceIndex < 2) return 0;

        uint256 totalShift = 0;
        uint256 count = 0;
        uint256 len = state.priceIndex < VOLATILITY_WINDOW ? state.priceIndex : VOLATILITY_WINDOW;

        for (uint256 i = 1; i < len; i++) {
            uint256 idx = (state.priceIndex - 1 - i + VOLATILITY_WINDOW) % VOLATILITY_WINDOW;
            uint256 prevIdx = (idx + VOLATILITY_WINDOW - 1) % VOLATILITY_WINDOW;

            uint160 current = state.priceHistory[idx];
            uint160 prev = state.priceHistory[prevIdx];

            if (prev == 0 || current == 0) continue;

            uint256 diff = current > prev ? current - prev : prev - current;
            totalShift += (diff * 10000) / prev;
            count++;
        }

        return count > 0 ? totalShift / count : 0;
    }

    // ==================== External Functions ====================

    function recordPrice(PoolKey calldata key, uint160 sqrtPriceX96) external {
        PoolId poolId = key.toId();
        PoolState storage state = poolStates[poolId];
        uint256 idx = state.priceIndex % VOLATILITY_WINDOW;
        state.priceHistory[idx] = sqrtPriceX96;
        state.priceIndex++;
    }

    function setOracle(address _oracle) external onlyOracle {
        address old = oracle;
        oracle = _oracle;
        emit OracleUpdated(old, _oracle);
    }

    function setOracleFee(PoolKey calldata key, uint24 fee, bool active) external onlyOracle {
        require(fee >= MIN_FEE && fee <= MAX_FEE, "PegasusHook: fee out of bounds");
        PoolId poolId = key.toId();
        oracleOverrideFee[poolId] = fee;
        oracleOverrideActive[poolId] = active;
        emit OracleFeeSet(poolId, fee, active);
    }

    // ==================== View Functions ====================

    function getCurrentFee(PoolKey calldata key) external view returns (uint24) {
        return poolStates[key.toId()].currentFee;
    }

    function getPoolMetrics(PoolKey calldata key) external view returns (
        uint256 swapCount,
        uint8 consecutiveDirection,
        uint256 blockSwapCount,
        uint24 currentFee,
        uint256 volatility
    ) {
        PoolId poolId = key.toId();
        PoolState storage state = poolStates[poolId];
        return (
            state.swapCount,
            state.consecutiveSameDirection,
            state.lastBlockSwapCount,
            state.currentFee,
            _calculateVolatility(state)
        );
    }
}
