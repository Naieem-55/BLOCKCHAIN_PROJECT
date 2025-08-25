// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";
import "./AdaptiveSharding.sol";
import "./HighEfficiencyProcessor.sol";

/**
 * @title SupplyChainTraceability
 * @dev Advanced supply chain traceability system with high efficiency and comprehensive tracking
 */
contract SupplyChainTraceability is AccessControl {
    
    // Integration with sharding and efficiency processor
    AdaptiveSharding public shardingContract;
    HighEfficiencyProcessor public processorContract;
    mapping(uint256 => uint256) public productToShard;
    
    // Events for tracking and transparency
    event ProductCreated(uint256 indexed productId, string name, address indexed creator, uint256 timestamp);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, uint256 timestamp);
    event BatchProcessed(uint256[] productIds, address indexed processor, uint256 timestamp);
    event QualityCheckAdded(uint256 indexed productId, string checkType, bool passed, string notes);
    event LocationUpdated(uint256 indexed productId, string location, uint256 timestamp);
    event TemperatureLogged(uint256 indexed productId, int256 temperature, uint256 timestamp);
    
    // Product lifecycle stages
    enum Stage {
        Created,           // 0
        RawMaterial,       // 1  
        Manufacturing,     // 2
        QualityControl,    // 3
        Packaging,         // 4
        Distribution,      // 5
        Retail,           // 6
        Sold,             // 7
        Recalled          // 8
    }
    
    // Product information structure
    struct Product {
        uint256 id;
        string name;
        string description;
        string category;
        uint256 createdAt;
        Stage currentStage;
        address currentOwner;
        string currentLocation;
        bool isActive;
        uint256 parentProductId; // For products derived from others
        string batchNumber;
        uint256 expiryDate;
    }
    
    // Quality check structure
    struct QualityCheck {
        string checkType;
        bool passed;
        string notes;
        address inspector;
        uint256 timestamp;
    }
    
    // Location history structure
    struct LocationHistory {
        string location;
        uint256 timestamp;
        address updatedBy;
    }
    
    // Temperature log structure
    struct TemperatureLog {
        int256 temperature;
        uint256 timestamp;
        string sensorId;
    }
    
    // Supply chain participant structure
    struct Participant {
        address participantAddress;
        string name;
        string role;
        string location;
        string userKey;
        bool isActive;
        uint256 registeredAt;
    }
    
    // State variables
    uint256 private productCounter;
    uint256 private participantCounter;
    
    // Mappings
    mapping(uint256 => Product) public products;
    mapping(uint256 => QualityCheck[]) public productQualityChecks;
    mapping(uint256 => LocationHistory[]) public productLocationHistory;
    mapping(uint256 => TemperatureLog[]) public productTemperatureLogs;
    mapping(uint256 => address[]) public productOwnershipHistory;
    mapping(address => uint256[]) public participantProducts;
    mapping(uint256 => Participant) public participants;
    mapping(address => uint256) public addressToParticipantId;
    mapping(string => uint256) public userKeyToParticipantId;
    mapping(string => uint256[]) public batchProducts; // batch number to product IDs
    
    // Gas optimization: Pack multiple operations
    struct BatchOperation {
        uint256[] productIds;
        address newOwner;
        string newLocation;
        Stage newStage;
    }
    
    modifier onlyProductOwner(uint256 _productId) {
        require(products[_productId].currentOwner == msg.sender, "Not product owner");
        _;
    }
    
    modifier productExists(uint256 _productId) {
        require(_productId > 0 && _productId <= productCounter, "Product does not exist");
        require(products[_productId].isActive, "Product is inactive");
        _;
    }
    
    modifier onlyRegisteredParticipant() {
        require(addressToParticipantId[msg.sender] > 0, "Not a registered participant");
        _;
    }
    
    modifier onlyActiveParticipant() {
        uint256 participantId = addressToParticipantId[msg.sender];
        require(participantId > 0, "Not a registered participant");
        require(participants[participantId].isActive, "Participant account is suspended");
        _;
    }
    
    constructor(address _shardingContract, address _processorContract) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        
        if (_shardingContract != address(0)) {
            shardingContract = AdaptiveSharding(_shardingContract);
        }
        if (_processorContract != address(0)) {
            processorContract = HighEfficiencyProcessor(_processorContract);
        }
    }
    
    /**
     * @dev Register a new supply chain participant with user key
     */
    function registerParticipant(
        address _participantAddress,
        string memory _name,
        string memory _role,
        string memory _location,
        string memory _userKey
    ) external onlyRole(ADMIN_ROLE) {
        require(addressToParticipantId[_participantAddress] == 0, "Participant already registered");
        require(userKeyToParticipantId[_userKey] == 0, "User key already exists");
        require(bytes(_userKey).length > 0, "User key cannot be empty");
        
        participantCounter++;
        participants[participantCounter] = Participant({
            participantAddress: _participantAddress,
            name: _name,
            role: _role,
            location: _location,
            userKey: _userKey,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        addressToParticipantId[_participantAddress] = participantCounter;
        userKeyToParticipantId[_userKey] = participantCounter;
        grantRole(PARTICIPANT_ROLE, _participantAddress);
    }
    
    /**
     * @dev Register a new supply chain participant (backward compatibility - generates user key)
     */
    function registerParticipant(
        address _participantAddress,
        string memory _name,
        string memory _role,
        string memory _location
    ) external onlyRole(ADMIN_ROLE) {
        require(addressToParticipantId[_participantAddress] == 0, "Participant already registered");
        
        // Generate a simple user key for backward compatibility
        string memory generatedUserKey = string(abi.encodePacked(
            "USR_", 
            _role, 
            "_", 
            uint2str(block.timestamp), 
            "_", 
            uint2str(participantCounter + 1)
        ));
        
        require(userKeyToParticipantId[generatedUserKey] == 0, "Generated user key already exists");
        
        participantCounter++;
        participants[participantCounter] = Participant({
            participantAddress: _participantAddress,
            name: _name,
            role: _role,
            location: _location,
            userKey: generatedUserKey,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        addressToParticipantId[_participantAddress] = participantCounter;
        userKeyToParticipantId[generatedUserKey] = participantCounter;
        grantRole(PARTICIPANT_ROLE, _participantAddress);
    }
    
    /**
     * @dev Convert uint to string (helper function)
     */
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }
    
    /**
     * @dev Create a new product in the supply chain with user key validation
     */
    function createProductWithKey(
        string memory _name,
        string memory _description,
        string memory _category,
        string memory _batchNumber,
        uint256 _expiryDate,
        string memory _initialLocation,
        string memory _userKey
    ) public onlyRole(PARTICIPANT_ROLE) onlyActiveParticipant returns (uint256) {
        // Validate user key matches the sender
        uint256 participantId = addressToParticipantId[msg.sender];
        require(
            keccak256(bytes(participants[participantId].userKey)) == keccak256(bytes(_userKey)),
            "Invalid user key"
        );
        
        // Additional input validation
        require(bytes(_name).length > 0, "Product name cannot be empty");
        require(bytes(_batchNumber).length > 0, "Batch number cannot be empty");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        productCounter++;
        
        // Assign product to optimal shard
        if (address(shardingContract) != address(0)) {
            uint256 shardId = shardingContract.getOptimalShard("product");
            productToShard[productCounter] = shardId;
        }
        
        products[productCounter] = Product({
            id: productCounter,
            name: _name,
            description: _description,
            category: _category,
            createdAt: block.timestamp,
            currentStage: Stage.Created,
            currentOwner: msg.sender,
            currentLocation: _initialLocation,
            isActive: true,
            parentProductId: 0,
            batchNumber: _batchNumber,
            expiryDate: _expiryDate
        });
        
        // Initialize history
        productOwnershipHistory[productCounter].push(msg.sender);
        productLocationHistory[productCounter].push(LocationHistory({
            location: _initialLocation,
            timestamp: block.timestamp,
            updatedBy: msg.sender
        }));
        
        // Add to participant's products
        participantProducts[msg.sender].push(productCounter);
        
        // Add to batch
        batchProducts[_batchNumber].push(productCounter);
        
        emit ProductCreated(productCounter, _name, msg.sender, block.timestamp);
        
        return productCounter;
    }
    
    /**
     * @dev Create a new product (backward compatibility without user key)
     */
    function createProduct(
        string memory _name,
        string memory _description,
        string memory _category,
        string memory _batchNumber,
        uint256 _expiryDate,
        string memory _initialLocation
    ) external onlyRole(PARTICIPANT_ROLE) onlyActiveParticipant returns (uint256) {
        // Get user key from storage
        uint256 participantId = addressToParticipantId[msg.sender];
        string memory userKey = participants[participantId].userKey;
        
        // Call the new function with stored user key
        return createProductWithKey(
            _name,
            _description,
            _category,
            _batchNumber,
            _expiryDate,
            _initialLocation,
            userKey
        );
    }
    
    /**
     * @dev Transfer product ownership with enhanced validation
     */
    function transferProduct(
        uint256 _productId,
        address _newOwner,
        string memory _newLocation
    ) external productExists(_productId) onlyProductOwner(_productId) onlyActiveParticipant {
        require(addressToParticipantId[_newOwner] > 0, "New owner not registered");
        require(participants[addressToParticipantId[_newOwner]].isActive, "New owner account is suspended");
        
        address previousOwner = products[_productId].currentOwner;
        
        // Update product
        products[_productId].currentOwner = _newOwner;
        products[_productId].currentLocation = _newLocation;
        
        // Update histories
        productOwnershipHistory[_productId].push(_newOwner);
        productLocationHistory[_productId].push(LocationHistory({
            location: _newLocation,
            timestamp: block.timestamp,
            updatedBy: msg.sender
        }));
        
        // Update participant products
        participantProducts[_newOwner].push(_productId);
        
        emit ProductTransferred(_productId, previousOwner, _newOwner, block.timestamp);
        emit LocationUpdated(_productId, _newLocation, block.timestamp);
    }
    
    /**
     * @dev Update product stage
     */
    function updateStage(
        uint256 _productId,
        Stage _newStage
    ) external productExists(_productId) onlyProductOwner(_productId) {
        require(uint8(_newStage) > uint8(products[_productId].currentStage), "Invalid stage progression");
        
        products[_productId].currentStage = _newStage;
    }
    
    /**
     * @dev Batch process multiple products (gas optimization)
     */
    function batchTransfer(
        BatchOperation memory _operation
    ) external {
        require(_operation.productIds.length > 0, "No products specified");
        require(addressToParticipantId[_operation.newOwner] > 0, "New owner not registered");
        
        for (uint256 i = 0; i < _operation.productIds.length; i++) {
            uint256 productId = _operation.productIds[i];
            require(products[productId].currentOwner == msg.sender, "Not owner of all products");
            require(products[productId].isActive, "Product inactive");
            
            // Update product
            products[productId].currentOwner = _operation.newOwner;
            products[productId].currentLocation = _operation.newLocation;
            products[productId].currentStage = _operation.newStage;
            
            // Update histories
            productOwnershipHistory[productId].push(_operation.newOwner);
            productLocationHistory[productId].push(LocationHistory({
                location: _operation.newLocation,
                timestamp: block.timestamp,
                updatedBy: msg.sender
            }));
            
            participantProducts[_operation.newOwner].push(productId);
        }
        
        emit BatchProcessed(_operation.productIds, _operation.newOwner, block.timestamp);
    }
    
    /**
     * @dev Add quality check result with user validation
     */
    function addQualityCheck(
        uint256 _productId,
        string memory _checkType,
        bool _passed,
        string memory _notes
    ) external productExists(_productId) onlyRole(PARTICIPANT_ROLE) onlyActiveParticipant {
        productQualityChecks[_productId].push(QualityCheck({
            checkType: _checkType,
            passed: _passed,
            notes: _notes,
            inspector: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit QualityCheckAdded(_productId, _checkType, _passed, _notes);
    }
    
    /**
     * @dev Log temperature data (IoT integration) with validation
     */
    function logTemperature(
        uint256 _productId,
        int256 _temperature,
        string memory _sensorId
    ) external productExists(_productId) onlyRole(PARTICIPANT_ROLE) onlyActiveParticipant {
        productTemperatureLogs[_productId].push(TemperatureLog({
            temperature: _temperature,
            timestamp: block.timestamp,
            sensorId: _sensorId
        }));
        
        emit TemperatureLogged(_productId, _temperature, block.timestamp);
    }
    
    /**
     * @dev Recall a product
     */
    function recallProduct(
        uint256 _productId,
        string memory _reason
    ) external productExists(_productId) onlyRole(ADMIN_ROLE) {
        products[_productId].currentStage = Stage.Recalled;
        products[_productId].isActive = false;
        
        // Add quality check for recall
        productQualityChecks[_productId].push(QualityCheck({
            checkType: "RECALL",
            passed: false,
            notes: _reason,
            inspector: msg.sender,
            timestamp: block.timestamp
        }));
    }
    
    /**
     * @dev Suspend a participant (admin only)
     */
    function suspendParticipant(address _participantAddress) 
        external 
        onlyRole(ADMIN_ROLE) {
        uint256 participantId = addressToParticipantId[_participantAddress];
        require(participantId > 0, "Participant not found");
        participants[participantId].isActive = false;
        revokeRole(PARTICIPANT_ROLE, _participantAddress);
    }
    
    /**
     * @dev Reactivate a participant (admin only)
     */
    function reactivateParticipant(address _participantAddress) 
        external 
        onlyRole(ADMIN_ROLE) {
        uint256 participantId = addressToParticipantId[_participantAddress];
        require(participantId > 0, "Participant not found");
        participants[participantId].isActive = true;
        grantRole(PARTICIPANT_ROLE, _participantAddress);
    }
    
    // View functions for comprehensive traceability
    
    function getProductHistory(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (
            address[] memory owners,
            LocationHistory[] memory locations,
            QualityCheck[] memory qualityChecks
        ) {
        return (
            productOwnershipHistory[_productId],
            productLocationHistory[_productId],
            productQualityChecks[_productId]
        );
    }
    
    function getTemperatureHistory(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (TemperatureLog[] memory) {
        return productTemperatureLogs[_productId];
    }
    
    function getBatchProducts(string memory _batchNumber) 
        external 
        view 
        returns (uint256[] memory) {
        return batchProducts[_batchNumber];
    }
    
    function getParticipantProducts(address _participant) 
        external 
        view 
        returns (uint256[] memory) {
        return participantProducts[_participant];
    }
    
    function isProductAuthentic(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (bool) {
        return products[_productId].isActive && 
               products[_productId].currentStage != Stage.Recalled;
    }
    
    // Utility functions
    function getProductCount() external view returns (uint256) {
        return productCounter;
    }
    
    function getParticipantCount() external view returns (uint256) {
        return participantCounter;
    }
}