// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./mocks/MockERC20.sol";

/// @title PegasusFactory — Permissionless token + pool registry for Pegasus
/// @notice Lets any user deploy their own ERC20 token and register a Pegasus-hooked pool on X Layer.
contract PegasusFactory {
    // ============ Token tracking ============

    struct TokenInfo {
        address token;
        address creator;
        string name;
        string symbol;
        uint8 decimals;
        uint256 initialSupply;
        uint256 createdAt;
    }

    address[] public allTokens;
    mapping(address => TokenInfo) public tokenInfo;
    mapping(address => address[]) public tokensByCreator;

    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint8 decimals,
        uint256 initialSupply
    );

    // ============ Pool tracking ============

    struct PoolInfo {
        bytes32 poolId;
        address creator;
        address currency0;
        address currency1;
        uint24 fee;
        int24 tickSpacing;
        address hooks;
        uint256 createdAt;
    }

    bytes32[] public allPoolIds;
    mapping(bytes32 => PoolInfo) public poolInfo;
    mapping(address => bytes32[]) public poolsByCreator;

    event PoolRegistered(
        bytes32 indexed poolId,
        address indexed creator,
        address currency0,
        address currency1,
        uint24 fee,
        int24 tickSpacing,
        address hooks
    );

    // ============ Token Factory ============

    /// @notice Deploy a new ERC20 token and mint initial supply to the caller.
    function createToken(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 initialSupply
    ) external returns (address tokenAddress) {
        MockERC20 token = new MockERC20(name, symbol, decimals);
        tokenAddress = address(token);

        if (initialSupply > 0) {
            token.mint(msg.sender, initialSupply);
        }

        TokenInfo memory info = TokenInfo({
            token: tokenAddress,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            decimals: decimals,
            initialSupply: initialSupply,
            createdAt: block.timestamp
        });

        tokenInfo[tokenAddress] = info;
        allTokens.push(tokenAddress);
        tokensByCreator[msg.sender].push(tokenAddress);

        emit TokenCreated(tokenAddress, msg.sender, name, symbol, decimals, initialSupply);
    }

    // ============ Pool Registry ============

    /// @notice Register a pool that the caller initialized via Uniswap V4 PoolManager.
    /// @dev Anyone can call this; we trust the PoolManager already validated initialization.
    ///      The frontend should call this after PoolManager.initialize succeeds.
    function registerPool(
        bytes32 poolId,
        address currency0,
        address currency1,
        uint24 fee,
        int24 tickSpacing,
        address hooks
    ) external {
        require(poolInfo[poolId].poolId == bytes32(0), "Pool already registered");
        require(currency0 < currency1, "Currencies must be sorted");

        PoolInfo memory info = PoolInfo({
            poolId: poolId,
            creator: msg.sender,
            currency0: currency0,
            currency1: currency1,
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: hooks,
            createdAt: block.timestamp
        });

        poolInfo[poolId] = info;
        allPoolIds.push(poolId);
        poolsByCreator[msg.sender].push(poolId);

        emit PoolRegistered(poolId, msg.sender, currency0, currency1, fee, tickSpacing, hooks);
    }

    // ============ View helpers ============

    function totalTokens() external view returns (uint256) {
        return allTokens.length;
    }

    function totalPools() external view returns (uint256) {
        return allPoolIds.length;
    }

    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }

    function getPoolsByCreator(address creator) external view returns (bytes32[] memory) {
        return poolsByCreator[creator];
    }

    /// @notice Page through tokens with pagination (for explore UI)
    function getTokens(uint256 offset, uint256 limit)
        external
        view
        returns (TokenInfo[] memory tokens)
    {
        uint256 end = offset + limit;
        if (end > allTokens.length) end = allTokens.length;
        if (offset >= end) return new TokenInfo[](0);

        tokens = new TokenInfo[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            tokens[i - offset] = tokenInfo[allTokens[i]];
        }
    }

    /// @notice Page through pools with pagination (for explore UI)
    function getPools(uint256 offset, uint256 limit)
        external
        view
        returns (PoolInfo[] memory pools)
    {
        uint256 end = offset + limit;
        if (end > allPoolIds.length) end = allPoolIds.length;
        if (offset >= end) return new PoolInfo[](0);

        pools = new PoolInfo[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            pools[i - offset] = poolInfo[allPoolIds[i]];
        }
    }
}
