// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";

/**
 * @title AdaptiveSharding
 * @dev Implements adaptive sharding for high-efficiency blockchain operations
 * This contract manages multiple shards dynamically based on load and performance
 */
contract AdaptiveSharding is AccessControl {
    
    // Shard structure
    struct Shard {
        uint256 shardId;
        address shardContract;
        uint256 currentLoad;
        uint256 maxCapacity;
        uint256 transactionCount;
        uint256 averageGasUsed;
        bool isActive;
        uint256 createdAt;
        string shardType; // "product", "iot", "participant"
    }
    
    // Performance metrics for adaptive decisions
    struct PerformanceMetrics {
        uint256 avgTransactionTime;
        uint256 avgGasPrice;
        uint256 throughput;
        uint256 errorRate;
        uint256 lastUpdated;
    }
    
    // Sharding configuration
    struct ShardingConfig {
        uint256 maxShardsPerType;
        uint256 loadThreshold; // Percentage (0-100)
        uint256 minShardCapacity;
        uint256 maxShardCapacity;
        uint256 rebalanceInterval; // seconds
        bool autoScaling;
    }
    
    // Events
    event ShardCreated(uint256 indexed shardId, address shardContract, string shardType);
    event ShardActivated(uint256 indexed shardId);
    event ShardDeactivated(uint256 indexed shardId);
    event LoadRebalanced(uint256 fromShardId, uint256 toShardId, uint256 transactionsMoved);
    event PerformanceMetricsUpdated(uint256 indexed shardId, uint256 avgTime, uint256 throughput);
    event ShardingConfigUpdated(uint256 maxShards, uint256 loadThreshold, bool autoScaling);
    
    // State variables
    uint256 private shardCounter;
    mapping(uint256 => Shard) public shards;
    mapping(string => uint256[]) public shardsByType;
    mapping(uint256 => PerformanceMetrics) public shardMetrics;
    mapping(bytes32 => uint256) public transactionToShard;
    
    ShardingConfig public config;
    
    // Modifiers
    modifier onlyActiveShard(uint256 _shardId) {
        require(shards[_shardId].isActive, "Shard is not active");
        _;
    }
    
    modifier validShardType(string memory _shardType) {
        require(
            keccak256(bytes(_shardType)) == keccak256(bytes("product")) ||
            keccak256(bytes(_shardType)) == keccak256(bytes("iot")) ||
            keccak256(bytes(_shardType)) == keccak256(bytes("participant")),
            "Invalid shard type"
        );
        _;
    }
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        
        // Initialize default configuration
        config = ShardingConfig({
            maxShardsPerType: 10,
            loadThreshold: 80, // 80% load triggers new shard
            minShardCapacity: 1000,
            maxShardCapacity: 10000,
            rebalanceInterval: 3600, // 1 hour
            autoScaling: true
        });
    }
    
    /**
     * @dev Create a new shard for a specific type
     */
    function createShard(
        string memory _shardType,
        address _shardContract,
        uint256 _capacity
    ) external onlyRole(ADMIN_ROLE) validShardType(_shardType) returns (uint256) {
        require(_shardContract != address(0), "Invalid shard contract address");
        require(_capacity >= config.minShardCapacity, "Capacity below minimum");
        require(_capacity <= config.maxShardCapacity, "Capacity above maximum");
        
        // Check if we can create more shards of this type
        require(shardsByType[_shardType].length < config.maxShardsPerType, "Maximum shards reached for this type");
        
        shardCounter++;
        
        shards[shardCounter] = Shard({
            shardId: shardCounter,
            shardContract: _shardContract,
            currentLoad: 0,
            maxCapacity: _capacity,
            transactionCount: 0,
            averageGasUsed: 0,
            isActive: true,
            createdAt: block.timestamp,
            shardType: _shardType
        });
        
        shardsByType[_shardType].push(shardCounter);
        
        // Initialize performance metrics
        shardMetrics[shardCounter] = PerformanceMetrics({
            avgTransactionTime: 0,
            avgGasPrice: 0,
            throughput: 0,
            errorRate: 0,
            lastUpdated: block.timestamp
        });
        
        emit ShardCreated(shardCounter, _shardContract, _shardType);
        
        return shardCounter;
    }
    
    /**
     * @dev Get optimal shard for a transaction based on load and performance
     */
    function getOptimalShard(string memory _shardType) external view validShardType(_shardType) returns (uint256) {
        uint256[] memory typeShards = shardsByType[_shardType];
        require(typeShards.length > 0, "No shards available for this type");
        
        uint256 optimalShardId = 0;
        uint256 lowestLoad = type(uint256).max;
        
        for (uint256 i = 0; i < typeShards.length; i++) {
            uint256 shardId = typeShards[i];
            Shard storage shard = shards[shardId];
            
            if (shard.isActive && shard.currentLoad < lowestLoad) {
                lowestLoad = shard.currentLoad;
                optimalShardId = shardId;
            }
        }
        
        require(optimalShardId != 0, "No active shards available");
        return optimalShardId;
    }
    
    /**
     * @dev Get recommended shard for new transaction based on predictive analysis
     */
    function getRecommendedShard(
        string memory _shardType,
        uint256 _estimatedGas,
        uint256 _priority
    ) external view validShardType(_shardType) returns (uint256, string memory) {
        uint256[] memory typeShards = shardsByType[_shardType];
        require(typeShards.length > 0, "No shards available");
        
        uint256 bestShardId = 0;
        uint256 bestScore = 0;
        
        for (uint256 i = 0; i < typeShards.length; i++) {
            uint256 shardId = typeShards[i];
            Shard memory shard = shards[shardId];
            
            if (!shard.isActive) continue;
            
            // Simplified scoring to avoid stack depth
            uint256 availableCapacity = shard.maxCapacity > shard.currentLoad ? 
                shard.maxCapacity - shard.currentLoad : 0;
            
            uint256 score = (availableCapacity * 100) / shard.maxCapacity;
            
            // Adjust score based on estimated gas - prefer shards with capacity for high gas operations
            if (_estimatedGas > 500000 && availableCapacity > 100) {
                score = (score * 110) / 100; // 10% bonus for high gas operations on low-load shards
            }
            
            // Bonus for priority transactions
            if (_priority > 5) {
                score = (score * 120) / 100;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestShardId = shardId;
            }
        }
        
        require(bestShardId != 0, "No suitable shard found");
        
        string memory reason = bestScore > 80 ? "Low load shard" : 
                              bestScore > 50 ? "Balanced selection" : 
                              "Available shard";
        
        return (bestShardId, reason);
    }
    
    /**
     * @dev Update shard load after transaction
     */
    function updateShardLoad(
        uint256 _shardId,
        uint256 _gasUsed,
        uint256 _executionTime,
        bool _success
    ) external onlyRole(PARTICIPANT_ROLE) onlyActiveShard(_shardId) {
        Shard storage shard = shards[_shardId];
        PerformanceMetrics storage metrics = shardMetrics[_shardId];
        
        // Update shard load
        shard.currentLoad = (shard.currentLoad * shard.transactionCount + 1) / (shard.transactionCount + 1);
        shard.transactionCount++;
        
        // Update average gas used
        shard.averageGasUsed = (shard.averageGasUsed * (shard.transactionCount - 1) + _gasUsed) / shard.transactionCount;
        
        // Update performance metrics
        metrics.avgTransactionTime = (metrics.avgTransactionTime * (shard.transactionCount - 1) + _executionTime) / shard.transactionCount;
        metrics.throughput = shard.transactionCount * 1000 / (block.timestamp - shard.createdAt + 1);
        
        if (!_success) {
            metrics.errorRate = (metrics.errorRate * (shard.transactionCount - 1) + 100) / shard.transactionCount;
        } else {
            metrics.errorRate = (metrics.errorRate * (shard.transactionCount - 1)) / shard.transactionCount;
        }
        
        metrics.lastUpdated = block.timestamp;
        
        emit PerformanceMetricsUpdated(_shardId, metrics.avgTransactionTime, metrics.throughput);
    }
    
    /**
     * @dev Rebalance load between shards
     */
    function rebalanceShards(string memory _shardType) external onlyRole(ADMIN_ROLE) validShardType(_shardType) {
        uint256[] memory typeShards = shardsByType[_shardType];
        require(typeShards.length > 1, "Need at least 2 shards to rebalance");
        
        // Find overloaded and underloaded shards
        uint256 overloadedShard = 0;
        uint256 underloadedShard = 0;
        uint256 maxLoad = 0;
        uint256 minLoad = type(uint256).max;
        
        for (uint256 i = 0; i < typeShards.length; i++) {
            uint256 shardId = typeShards[i];
            Shard memory shard = shards[shardId];
            
            if (shard.isActive) {
                if (shard.currentLoad > maxLoad) {
                    maxLoad = shard.currentLoad;
                    overloadedShard = shardId;
                }
                if (shard.currentLoad < minLoad) {
                    minLoad = shard.currentLoad;
                    underloadedShard = shardId;
                }
            }
        }
        
        // Perform rebalancing if significant difference
        if (overloadedShard != 0 && underloadedShard != 0 && maxLoad > minLoad * 2) {
            uint256 transactionsToMove = (maxLoad - minLoad) / 2;
            
            // Update loads
            shards[overloadedShard].currentLoad -= transactionsToMove;
            shards[underloadedShard].currentLoad += transactionsToMove;
            
            emit LoadRebalanced(overloadedShard, underloadedShard, transactionsToMove);
        }
    }
    
    /**
     * @dev Get system-wide statistics
     */
    function getSystemStats() external view returns (
        uint256 totalShards,
        uint256 activeShards,
        uint256 totalTransactions,
        uint256 avgSystemLoad,
        uint256 systemEfficiency
    ) {
        totalShards = shardCounter;
        activeShards = 0;
        totalTransactions = 0;
        uint256 totalLoad = 0;
        
        for (uint256 i = 1; i <= shardCounter; i++) {
            if (shards[i].isActive) {
                activeShards++;
                totalTransactions += shards[i].transactionCount;
                totalLoad += (shards[i].currentLoad * 100) / shards[i].maxCapacity;
            }
        }
        
        avgSystemLoad = activeShards > 0 ? totalLoad / activeShards : 0;
        systemEfficiency = this.getSystemEfficiencyScore();
        
        return (totalShards, activeShards, totalTransactions, avgSystemLoad, systemEfficiency);
    }
    
    /**
     * @dev Calculate system efficiency score
     */
    function getSystemEfficiencyScore() external view returns (uint256) {
        if (shardCounter == 0) return 0;
        
        uint256 totalThroughput = 0;
        uint256 totalErrorRate = 0;
        uint256 activeShards = 0;
        
        for (uint256 i = 1; i <= shardCounter; i++) {
            if (shards[i].isActive) {
                PerformanceMetrics memory metrics = shardMetrics[i];
                totalThroughput += metrics.throughput;
                totalErrorRate += metrics.errorRate;
                activeShards++;
            }
        }
        
        if (activeShards == 0) return 0;
        
        uint256 avgThroughput = totalThroughput / activeShards;
        uint256 avgErrorRate = totalErrorRate / activeShards;
        
        // Calculate efficiency score (0-100)
        uint256 efficiencyScore = avgThroughput > 0 ? 
            (avgThroughput * 100) / (avgThroughput + avgErrorRate + 1) : 0;
            
        return efficiencyScore > 100 ? 100 : efficiencyScore;
    }
    
    /**
     * @dev Get shard information
     */
    function getShardInfo(uint256 _shardId) external view returns (
        address shardContract,
        uint256 currentLoad,
        uint256 maxCapacity,
        uint256 transactionCount,
        bool isActive,
        string memory shardType
    ) {
        Shard memory shard = shards[_shardId];
        require(shard.shardId != 0, "Shard does not exist");
        
        return (
            shard.shardContract,
            shard.currentLoad,
            shard.maxCapacity,
            shard.transactionCount,
            shard.isActive,
            shard.shardType
        );
    }
    
    /**
     * @dev Get performance metrics for a shard
     */
    function getShardMetrics(uint256 _shardId) external view returns (
        uint256 avgTransactionTime,
        uint256 avgGasPrice,
        uint256 throughput,
        uint256 errorRate,
        uint256 lastUpdated
    ) {
        PerformanceMetrics memory metrics = shardMetrics[_shardId];
        
        return (
            metrics.avgTransactionTime,
            metrics.avgGasPrice,
            metrics.throughput,
            metrics.errorRate,
            metrics.lastUpdated
        );
    }
    
    /**
     * @dev Get all shards for a specific type
     */
    function getShardsByType(string memory _shardType) external view validShardType(_shardType) returns (uint256[] memory) {
        return shardsByType[_shardType];
    }
    
    /**
     * @dev Emergency function to redistribute all transactions
     */
    function emergencyRebalance() external onlyRole(ADMIN_ROLE) {
        string[3] memory types = ["product", "iot", "participant"];
        for (uint256 i = 0; i < 3; i++) {
            if (shardsByType[types[i]].length > 1) {
                // Find overloaded and underloaded shards for each type
                uint256[] memory typeShards = shardsByType[types[i]];
                uint256 overloadedShard = 0;
                uint256 underloadedShard = 0;
                uint256 maxLoad = 0;
                uint256 minLoad = type(uint256).max;
                
                for (uint256 j = 0; j < typeShards.length; j++) {
                    uint256 shardId = typeShards[j];
                    Shard memory shard = shards[shardId];
                    
                    if (shard.isActive) {
                        if (shard.currentLoad > maxLoad) {
                            maxLoad = shard.currentLoad;
                            overloadedShard = shardId;
                        }
                        if (shard.currentLoad < minLoad) {
                            minLoad = shard.currentLoad;
                            underloadedShard = shardId;
                        }
                    }
                }
                
                // Perform rebalancing if significant difference
                if (overloadedShard != 0 && underloadedShard != 0 && maxLoad > minLoad * 2) {
                    uint256 transactionsToMove = (maxLoad - minLoad) / 2;
                    
                    // Update loads
                    shards[overloadedShard].currentLoad -= transactionsToMove;
                    shards[underloadedShard].currentLoad += transactionsToMove;
                    
                    emit LoadRebalanced(overloadedShard, underloadedShard, transactionsToMove);
                }
            }
        }
    }
}