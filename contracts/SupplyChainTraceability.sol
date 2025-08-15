// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";

/**
 * @title SupplyChainTraceability
 * @dev Advanced supply chain traceability system with high efficiency and comprehensive tracking
 */
contract SupplyChainTraceability is AccessControl {
    
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
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a new supply chain participant
     */
    function registerParticipant(
        address _participantAddress,
        string memory _name,
        string memory _role,
        string memory _location
    ) external onlyRole(ADMIN_ROLE) {
        require(addressToParticipantId[_participantAddress] == 0, "Participant already registered");
        
        participantCounter++;
        participants[participantCounter] = Participant({
            participantAddress: _participantAddress,
            name: _name,
            role: _role,
            location: _location,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        addressToParticipantId[_participantAddress] = participantCounter;
        grantRole(PARTICIPANT_ROLE, _participantAddress);
    }
    
    /**
     * @dev Create a new product in the supply chain
     */
    function createProduct(
        string memory _name,
        string memory _description,
        string memory _category,
        string memory _batchNumber,
        uint256 _expiryDate,
        string memory _initialLocation
    ) external onlyRole(PARTICIPANT_ROLE) returns (uint256) {
        productCounter++;
        
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
     * @dev Transfer product ownership
     */
    function transferProduct(
        uint256 _productId,
        address _newOwner,
        string memory _newLocation
    ) external productExists(_productId) onlyProductOwner(_productId) {
        require(addressToParticipantId[_newOwner] > 0, "New owner not registered");
        
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
     * @dev Add quality check result
     */
    function addQualityCheck(
        uint256 _productId,
        string memory _checkType,
        bool _passed,
        string memory _notes
    ) external productExists(_productId) onlyRole(PARTICIPANT_ROLE) {
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
     * @dev Log temperature data (IoT integration)
     */
    function logTemperature(
        uint256 _productId,
        int256 _temperature,
        string memory _sensorId
    ) external productExists(_productId) onlyRole(PARTICIPANT_ROLE) {
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