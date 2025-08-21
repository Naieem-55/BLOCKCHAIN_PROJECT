// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";

/**
 * @title AdaptiveSharding
 * @dev Contract for adaptive sharding to improve scalability and performance
 * This implements a dynamic sharding mechanism based on transaction load and network conditions
 */
contract AdaptiveSharding is AccessControl {
    
    // Events
    event ShardCreated(uint256 indexed shardId, address shardManager, uint256 minCapacity, uint256 maxCapacity);
    event ShardActivated(uint256 indexed shardId, uint256 timestamp);
    event ShardDeactivated(uint256 indexed shardId, string reason, uint256 timestamp);
    event ProductAssignedToShard(uint256 indexed productId, uint256 indexed shardId, uint256 timestamp);
    event ShardRebalanced(uint256[] affectedShards, uint256 timestamp);
    event LoadThresholdUpdated(uint256 highThreshold, uint256 lowThreshold);
    
    // Shard status
    enum ShardStatus {
        Inactive,
        Active,
        Rebalancing,
        Maintenance
    }
    
    // Shard information
    struct Shard {
        uint256 shardId;
        address shardManager;
        ShardStatus status;
        uint256 currentLoad; // Number of products/transactions
        uint256 minCapacity;
        uint256 maxCapacity;
        uint256 createdAt;
        uint256 lastRebalanced;
        string region; // Geographic region for optimization
        uint256[] assignedProducts;
        mapping(uint256 => bool) productExists;
    }
    
    // Load metrics for adaptive decisions
    struct LoadMetrics {
        uint256 totalTransactions;
        uint256 avgResponseTime;
        uint256 throughput;
        uint256 errorRate;
        uint256 timestamp;
    }
    
    // Rebalancing configuration
    struct RebalancingConfig {
        uint256 highLoadThreshold; // Percentage (e.g., 80 = 80%)
        uint256 lowLoadThreshold;  // Percentage (e.g., 20 = 20%)
        uint256 rebalanceInterval; // Minimum time between rebalances
        uint256 migrationBatchSize; // Products to migrate per transaction
        bool autoRebalanceEnabled;
    }
    
    // State variables
    uint256 private shardCounter;
    uint256 private rebalanceCounter;
    
    // Mappings
    mapping(uint256 => Shard) public shards;
    mapping(uint256 => uint256) public productToShard; // productId => shardId
    mapping(address => uint256[]) public managerShards;
    mapping(string => uint256[]) public regionShards; // region => shardIds
    mapping(uint256 => LoadMetrics) public shardMetrics;
    
    // Configuration
    RebalancingConfig public rebalancingConfig;
    
    // Arrays for iteration
    uint256[] public activeShards;
    uint256[] public inactiveShards;
    
    modifier shardExists(uint256 _shardId) {
        require(_shardId > 0 && _shardId <= shardCounter, "Shard does not exist");
        _;
    }
    
    modifier onlyShardManager(uint256 _shardId) {
        require(shards[_shardId].shardManager == msg.sender, "Not shard manager");
        _;
    }
    
    modifier onlyActiveShard(uint256 _shardId) {
        require(shards[_shardId].status == ShardStatus.Active, "Shard not active");
        _;
    }
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        
        // Set default rebalancing configuration
        rebalancingConfig = RebalancingConfig({
            highLoadThreshold: 80, // 80%
            lowLoadThreshold: 20,  // 20%
            rebalanceInterval: 300, // 5 minutes
            migrationBatchSize: 100,
            autoRebalanceEnabled: true
        });
    }
    
    /**
     * @dev Create a new shard
     */
    function createShard(
        address _shardManager,
        uint256 _minCapacity,
        uint256 _maxCapacity,
        string memory _region
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(_shardManager != address(0), "Invalid shard manager");
        require(_maxCapacity > _minCapacity, "Invalid capacity range");
        require(_minCapacity > 0, "Minimum capacity must be > 0");
        
        shardCounter++;
        
        Shard storage newShard = shards[shardCounter];
        newShard.shardId = shardCounter;
        newShard.shardManager = _shardManager;
        newShard.status = ShardStatus.Inactive;
        newShard.currentLoad = 0;
        newShard.minCapacity = _minCapacity;
        newShard.maxCapacity = _maxCapacity;
        newShard.createdAt = block.timestamp;
        newShard.lastRebalanced = block.timestamp;
        newShard.region = _region;
        
        managerShards[_shardManager].push(shardCounter);
        regionShards[_region].push(shardCounter);
        inactiveShards.push(shardCounter);
        
        // Grant shard manager role
        grantRole(SHARD_MANAGER_ROLE, _shardManager);
        
        emit ShardCreated(shardCounter, _shardManager, _minCapacity, _maxCapacity);
        
        return shardCounter;
    }
    
    /**
     * @dev Activate a shard
     */
    function activateShard(uint256 _shardId) 
        external 
        shardExists(_shardId) 
        onlyRole(ADMIN_ROLE) {
        require(shards[_shardId].status == ShardStatus.Inactive, "Shard not inactive");
        
        shards[_shardId].status = ShardStatus.Active;
        
        // Move from inactive to active array
        _removeFromArray(inactiveShards, _shardId);
        activeShards.push(_shardId);
        
        emit ShardActivated(_shardId, block.timestamp);
    }
    
    /**
     * @dev Deactivate a shard
     */
    function deactivateShard(uint256 _shardId, string memory _reason) 
        external 
        shardExists(_shardId) 
        onlyRole(ADMIN_ROLE) {
        require(shards[_shardId].status == ShardStatus.Active, "Shard not active");
        require(shards[_shardId].currentLoad == 0, "Shard has active products");
        
        shards[_shardId].status = ShardStatus.Inactive;
        
        // Move from active to inactive array
        _removeFromArray(activeShards, _shardId);
        inactiveShards.push(_shardId);
        
        emit ShardDeactivated(_shardId, _reason, block.timestamp);
    }
    
    /**
     * @dev Assign product to optimal shard
     */
    function assignProductToShard(uint256 _productId, string memory _preferredRegion) 
        external 
        onlyRole(PARTICIPANT_ROLE) 
        returns (uint256) {
        require(_productId > 0, "Invalid product ID");
        require(productToShard[_productId] == 0, "Product already assigned");
        
        uint256 optimalShardId = _findOptimalShard(_preferredRegion);
        require(optimalShardId > 0, "No available shard");
        
        // Assign product to shard
        productToShard[_productId] = optimalShardId;
        shards[optimalShardId].assignedProducts.push(_productId);
        shards[optimalShardId].productExists[_productId] = true;
        shards[optimalShardId].currentLoad++;
        
        // Check if rebalancing is needed
        if (rebalancingConfig.autoRebalanceEnabled) {
            _checkRebalanceNeed(optimalShardId);
        }
        
        emit ProductAssignedToShard(_productId, optimalShardId, block.timestamp);
        
        return optimalShardId;
    }
    
    /**
     * @dev Update load metrics for a shard
     */
    function updateShardMetrics(
        uint256 _shardId,
        uint256 _totalTransactions,
        uint256 _avgResponseTime,
        uint256 _throughput,
        uint256 _errorRate
    ) external shardExists(_shardId) onlyShardManager(_shardId) {
        shardMetrics[_shardId] = LoadMetrics({
            totalTransactions: _totalTransactions,
            avgResponseTime: _avgResponseTime,
            throughput: _throughput,
            errorRate: _errorRate,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @dev Trigger manual rebalancing
     */
    function triggerRebalancing() external onlyRole(ADMIN_ROLE) {
        require(activeShards.length > 1, "Need at least 2 active shards");
        
        uint256[] memory overloadedShards = _getOverloadedShards();
        uint256[] memory underloadedShards = _getUnderloadedShards();
        
        if (overloadedShards.length > 0 && underloadedShards.length > 0) {
            _performRebalancing(overloadedShards, underloadedShards);
        }
    }
    
    /**
     * @dev Update rebalancing configuration
     */
    function updateRebalancingConfig(
        uint256 _highThreshold,
        uint256 _lowThreshold,
        uint256 _rebalanceInterval,
        uint256 _migrationBatchSize,
        bool _autoRebalanceEnabled
    ) external onlyRole(ADMIN_ROLE) {
        require(_highThreshold > _lowThreshold, "Invalid threshold range");
        require(_highThreshold <= 100, "High threshold cannot exceed 100%");
        
        rebalancingConfig.highLoadThreshold = _highThreshold;
        rebalancingConfig.lowLoadThreshold = _lowThreshold;
        rebalancingConfig.rebalanceInterval = _rebalanceInterval;
        rebalancingConfig.migrationBatchSize = _migrationBatchSize;
        rebalancingConfig.autoRebalanceEnabled = _autoRebalanceEnabled;
        
        emit LoadThresholdUpdated(_highThreshold, _lowThreshold);
    }
    
    /**
     * @dev Get shard information
     */
    function getShardInfo(uint256 _shardId) 
        external 
        view 
        shardExists(_shardId) 
        returns (
            address shardManager,
            ShardStatus status,
            uint256 currentLoad,
            uint256 minCapacity,
            uint256 maxCapacity,
            string memory region,
            uint256[] memory assignedProducts
        ) {
        Shard storage shard = shards[_shardId];
        return (
            shard.shardManager,
            shard.status,
            shard.currentLoad,
            shard.minCapacity,
            shard.maxCapacity,
            shard.region,
            shard.assignedProducts
        );
    }
    
    /**
     * @dev Get optimal shard for a product
     */
    function getOptimalShard(string memory _preferredRegion) 
        external 
        view 
        returns (uint256) {
        return _findOptimalShard(_preferredRegion);
    }
    
    /**
     * @dev Get shard load percentage
     */
    function getShardLoadPercentage(uint256 _shardId) 
        external 
        view 
        shardExists(_shardId) 
        returns (uint256) {
        Shard storage shard = shards[_shardId];
        if (shard.maxCapacity == 0) return 0;
        return (shard.currentLoad * 100) / shard.maxCapacity;
    }
    
    /**
     * @dev Find optimal shard based on load and region
     */
    function _findOptimalShard(string memory _preferredRegion) 
        private 
        view 
        returns (uint256) {
        uint256 bestShard = 0;
        uint256 lowestLoad = type(uint256).max;
        
        // First, try to find shard in preferred region
        uint256[] memory regionShardIds = regionShards[_preferredRegion];
        for (uint256 i = 0; i < regionShardIds.length; i++) {
            uint256 shardId = regionShardIds[i];
            Shard storage shard = shards[shardId];
            
            if (shard.status == ShardStatus.Active && 
                shard.currentLoad < shard.maxCapacity &&
                shard.currentLoad < lowestLoad) {
                bestShard = shardId;
                lowestLoad = shard.currentLoad;
            }
        }
        
        // If no shard found in preferred region, check all active shards
        if (bestShard == 0) {
            for (uint256 i = 0; i < activeShards.length; i++) {
                uint256 shardId = activeShards[i];
                Shard storage shard = shards[shardId];
                
                if (shard.currentLoad < shard.maxCapacity &&
                    shard.currentLoad < lowestLoad) {
                    bestShard = shardId;
                    lowestLoad = shard.currentLoad;
                }
            }
        }
        
        return bestShard;
    }
    
    /**
     * @dev Check if rebalancing is needed for a shard
     */
    function _checkRebalanceNeed(uint256 _shardId) private {
        if (!rebalancingConfig.autoRebalanceEnabled) return;
        
        Shard storage shard = shards[_shardId];
        uint256 loadPercentage = (shard.currentLoad * 100) / shard.maxCapacity;
        
        if (loadPercentage >= rebalancingConfig.highLoadThreshold &&
            block.timestamp >= shard.lastRebalanced + rebalancingConfig.rebalanceInterval) {
            
            // Find underloaded shards for migration
            uint256[] memory underloadedShards = _getUnderloadedShards();
            if (underloadedShards.length > 0) {
                uint256[] memory overloaded = new uint256[](1);
                overloaded[0] = _shardId;
                _performRebalancing(overloaded, underloadedShards);
            }
        }
    }
    
    /**
     * @dev Get overloaded shards
     */
    function _getOverloadedShards() private view returns (uint256[] memory) {
        uint256[] memory overloaded = new uint256[](activeShards.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeShards.length; i++) {
            uint256 shardId = activeShards[i];
            Shard storage shard = shards[shardId];
            uint256 loadPercentage = (shard.currentLoad * 100) / shard.maxCapacity;
            
            if (loadPercentage >= rebalancingConfig.highLoadThreshold) {
                overloaded[count] = shardId;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = overloaded[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get underloaded shards
     */
    function _getUnderloadedShards() private view returns (uint256[] memory) {
        uint256[] memory underloaded = new uint256[](activeShards.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeShards.length; i++) {
            uint256 shardId = activeShards[i];
            Shard storage shard = shards[shardId];
            uint256 loadPercentage = (shard.currentLoad * 100) / shard.maxCapacity;
            
            if (loadPercentage <= rebalancingConfig.lowLoadThreshold) {
                underloaded[count] = shardId;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = underloaded[i];
        }
        
        return result;
    }
    
    /**
     * @dev Perform rebalancing between shards
     */
    function _performRebalancing(
        uint256[] memory _overloadedShards,
        uint256[] memory _underloadedShards
    ) private {
        rebalanceCounter++;
        uint256[] memory affectedShards = new uint256[](_overloadedShards.length + _underloadedShards.length);
        
        // Copy shard IDs to affected shards array
        for (uint256 i = 0; i < _overloadedShards.length; i++) {
            affectedShards[i] = _overloadedShards[i];
        }
        for (uint256 i = 0; i < _underloadedShards.length; i++) {
            affectedShards[_overloadedShards.length + i] = _underloadedShards[i];
        }
        
        // Migrate products from overloaded to underloaded shards
        uint256 underloadedIndex = 0;
        
        for (uint256 i = 0; i < _overloadedShards.length && underloadedIndex < _underloadedShards.length; i++) {
            uint256 overloadedShardId = _overloadedShards[i];
            uint256 underloadedShardId = _underloadedShards[underloadedIndex];
            
            Shard storage overloadedShard = shards[overloadedShardId];
            Shard storage underloadedShard = shards[underloadedShardId];
            
            // Calculate how many products to migrate
            uint256 excessLoad = overloadedShard.currentLoad - (overloadedShard.maxCapacity * rebalancingConfig.highLoadThreshold / 100);
            uint256 availableCapacity = underloadedShard.maxCapacity - underloadedShard.currentLoad;
            uint256 toMigrate = excessLoad < availableCapacity ? excessLoad : availableCapacity;
            
            if (toMigrate > rebalancingConfig.migrationBatchSize) {
                toMigrate = rebalancingConfig.migrationBatchSize;
            }
            
            // Migrate products
            _migrateProducts(overloadedShardId, underloadedShardId, toMigrate);
            
            // Update last rebalanced timestamp
            overloadedShard.lastRebalanced = block.timestamp;
            underloadedShard.lastRebalanced = block.timestamp;
            
            // Move to next underloaded shard if current one is getting full
            if (underloadedShard.currentLoad >= underloadedShard.maxCapacity * 80 / 100) {
                underloadedIndex++;
            }
        }
        
        emit ShardRebalanced(affectedShards, block.timestamp);
    }
    
    /**
     * @dev Migrate products between shards
     */
    function _migrateProducts(uint256 _fromShard, uint256 _toShard, uint256 _count) private {
        Shard storage fromShard = shards[_fromShard];
        Shard storage toShard = shards[_toShard];
        
        uint256 migrated = 0;
        uint256 i = fromShard.assignedProducts.length;
        
        while (migrated < _count && i > 0) {
            i--;
            uint256 productId = fromShard.assignedProducts[i];
            
            // Update product assignment
            productToShard[productId] = _toShard;
            
            // Add to destination shard
            toShard.assignedProducts.push(productId);
            toShard.productExists[productId] = true;
            toShard.currentLoad++;
            
            // Remove from source shard
            fromShard.productExists[productId] = false;
            fromShard.currentLoad--;
            
            // Remove from array (swap with last element and pop)
            fromShard.assignedProducts[i] = fromShard.assignedProducts[fromShard.assignedProducts.length - 1];
            fromShard.assignedProducts.pop();
            
            migrated++;
        }
    }
    
    /**
     * @dev Remove element from array
     */
    function _removeFromArray(uint256[] storage _array, uint256 _element) private {
        for (uint256 i = 0; i < _array.length; i++) {
            if (_array[i] == _element) {
                _array[i] = _array[_array.length - 1];
                _array.pop();
                break;
            }
        }
    }
    
    // Utility functions
    function getActiveShardCount() external view returns (uint256) {
        return activeShards.length;
    }
    
    function getInactiveShardCount() external view returns (uint256) {
        return inactiveShards.length;
    }
    
    function getTotalShardCount() external view returns (uint256) {
        return shardCounter;
    }
    
    function getActiveShards() external view returns (uint256[] memory) {
        return activeShards;
    }
}