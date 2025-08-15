// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";

/**
 * @title IoTIntegration
 * @dev Contract for integrating IoT devices and sensor data into supply chain
 */
contract IoTIntegration is AccessControl {
    
    // Events
    event SensorRegistered(string indexed sensorId, address indexed owner, string sensorType);
    event SensorDataRecorded(string indexed sensorId, uint256 indexed productId, bytes data, uint256 timestamp);
    event AlertTriggered(uint256 indexed productId, string alertType, string message, uint256 timestamp);
    event ThresholdSet(string indexed sensorType, int256 minValue, int256 maxValue);
    
    // Sensor types
    enum SensorType {
        Temperature,
        Humidity,
        Pressure,
        Location,
        Shock,
        Light,
        Custom
    }
    
    // Sensor information
    struct Sensor {
        string sensorId;
        address owner;
        SensorType sensorType;
        string description;
        bool isActive;
        uint256 registeredAt;
        string calibrationData;
    }
    
    // Sensor reading
    struct SensorReading {
        string sensorId;
        uint256 productId;
        int256 value;
        string unit;
        uint256 timestamp;
        bytes additionalData;
        address recorder;
    }
    
    // Threshold for alerts
    struct Threshold {
        SensorType sensorType;
        int256 minValue;
        int256 maxValue;
        string alertMessage;
        bool isActive;
    }
    
    // Alert information
    struct Alert {
        uint256 productId;
        string sensorId;
        string alertType;
        string message;
        int256 triggerValue;
        uint256 timestamp;
        bool isResolved;
        string resolution;
    }
    
    // State variables
    uint256 private alertCounter;
    
    // Mappings
    mapping(string => Sensor) public sensors;
    mapping(string => SensorReading[]) public sensorReadings;
    mapping(uint256 => SensorReading[]) public productSensorData;
    mapping(SensorType => Threshold) public thresholds;
    mapping(uint256 => Alert) public alerts;
    mapping(uint256 => uint256[]) public productAlerts; // productId => alertIds
    mapping(address => string[]) public ownerSensors;
    
    // Arrays for iteration
    string[] public sensorIds;
    
    modifier sensorExists(string memory _sensorId) {
        require(bytes(sensors[_sensorId].sensorId).length > 0, "Sensor does not exist");
        _;
    }
    
    modifier onlySensorOwner(string memory _sensorId) {
        require(sensors[_sensorId].owner == msg.sender, "Not sensor owner");
        _;
    }
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        
        // Set default thresholds
        _setDefaultThresholds();
    }
    
    /**
     * @dev Register a new IoT sensor
     */
    function registerSensor(
        string memory _sensorId,
        SensorType _sensorType,
        string memory _description,
        string memory _calibrationData
    ) external onlyRole(PARTICIPANT_ROLE) {
        require(bytes(sensors[_sensorId].sensorId).length == 0, "Sensor already registered");
        
        sensors[_sensorId] = Sensor({
            sensorId: _sensorId,
            owner: msg.sender,
            sensorType: _sensorType,
            description: _description,
            isActive: true,
            registeredAt: block.timestamp,
            calibrationData: _calibrationData
        });
        
        sensorIds.push(_sensorId);
        ownerSensors[msg.sender].push(_sensorId);
        
        // Grant IoT device role to sensor owner for this sensor
        grantRole(IOT_DEVICE_ROLE, msg.sender);
        
        emit SensorRegistered(_sensorId, msg.sender, _description);
    }
    
    /**
     * @dev Record sensor data
     */
    function recordSensorData(
        string memory _sensorId,
        uint256 _productId,
        int256 _value,
        string memory _unit,
        bytes memory _additionalData
    ) external sensorExists(_sensorId) onlyRole(IOT_DEVICE_ROLE) {
        require(sensors[_sensorId].isActive, "Sensor is inactive");
        require(_productId > 0, "Invalid product ID");
        
        SensorReading memory reading = SensorReading({
            sensorId: _sensorId,
            productId: _productId,
            value: _value,
            unit: _unit,
            timestamp: block.timestamp,
            additionalData: _additionalData,
            recorder: msg.sender
        });
        
        sensorReadings[_sensorId].push(reading);
        productSensorData[_productId].push(reading);
        
        // Check for threshold violations
        _checkThresholds(_sensorId, _productId, _value);
        
        emit SensorDataRecorded(_sensorId, _productId, _additionalData, block.timestamp);
    }
    
    /**
     * @dev Batch record multiple sensor readings (gas optimization)
     */
    function batchRecordSensorData(
        string[] memory _sensorIds,
        uint256[] memory _productIds,
        int256[] memory _values,
        string[] memory _units,
        bytes[] memory _additionalData
    ) external onlyRole(IOT_DEVICE_ROLE) {
        require(_sensorIds.length == _productIds.length, "Array length mismatch");
        require(_sensorIds.length == _values.length, "Array length mismatch");
        require(_sensorIds.length == _units.length, "Array length mismatch");
        require(_sensorIds.length == _additionalData.length, "Array length mismatch");
        
        for (uint256 i = 0; i < _sensorIds.length; i++) {
            require(bytes(sensors[_sensorIds[i]].sensorId).length > 0, "Sensor does not exist");
            require(sensors[_sensorIds[i]].isActive, "Sensor is inactive");
            require(_productIds[i] > 0, "Invalid product ID");
            
            SensorReading memory reading = SensorReading({
                sensorId: _sensorIds[i],
                productId: _productIds[i],
                value: _values[i],
                unit: _units[i],
                timestamp: block.timestamp,
                additionalData: _additionalData[i],
                recorder: msg.sender
            });
            
            sensorReadings[_sensorIds[i]].push(reading);
            productSensorData[_productIds[i]].push(reading);
            
            _checkThresholds(_sensorIds[i], _productIds[i], _values[i]);
            
            emit SensorDataRecorded(_sensorIds[i], _productIds[i], _additionalData[i], block.timestamp);
        }
    }
    
    /**
     * @dev Set threshold for sensor type
     */
    function setThreshold(
        SensorType _sensorType,
        int256 _minValue,
        int256 _maxValue,
        string memory _alertMessage
    ) external onlyRole(ADMIN_ROLE) {
        thresholds[_sensorType] = Threshold({
            sensorType: _sensorType,
            minValue: _minValue,
            maxValue: _maxValue,
            alertMessage: _alertMessage,
            isActive: true
        });
        
        emit ThresholdSet(_sensorType, _minValue, _maxValue);
    }
    
    /**
     * @dev Deactivate a sensor
     */
    function deactivateSensor(string memory _sensorId) 
        external 
        sensorExists(_sensorId) 
        onlySensorOwner(_sensorId) {
        sensors[_sensorId].isActive = false;
    }
    
    /**
     * @dev Resolve an alert
     */
    function resolveAlert(
        uint256 _alertId,
        string memory _resolution
    ) external onlyRole(PARTICIPANT_ROLE) {
        require(_alertId > 0 && _alertId <= alertCounter, "Alert does not exist");
        require(!alerts[_alertId].isResolved, "Alert already resolved");
        
        alerts[_alertId].isResolved = true;
        alerts[_alertId].resolution = _resolution;
    }
    
    /**
     * @dev Get sensor readings for a product
     */
    function getProductSensorData(uint256 _productId) 
        external 
        view 
        returns (SensorReading[] memory) {
        return productSensorData[_productId];
    }
    
    /**
     * @dev Get readings from a specific sensor
     */
    function getSensorReadings(string memory _sensorId) 
        external 
        view 
        sensorExists(_sensorId) 
        returns (SensorReading[] memory) {
        return sensorReadings[_sensorId];
    }
    
    /**
     * @dev Get alerts for a product
     */
    function getProductAlerts(uint256 _productId) 
        external 
        view 
        returns (Alert[] memory) {
        uint256[] memory alertIds = productAlerts[_productId];
        Alert[] memory productAlertsList = new Alert[](alertIds.length);
        
        for (uint256 i = 0; i < alertIds.length; i++) {
            productAlertsList[i] = alerts[alertIds[i]];
        }
        
        return productAlertsList;
    }
    
    /**
     * @dev Get sensors owned by an address
     */
    function getOwnerSensors(address _owner) 
        external 
        view 
        returns (string[] memory) {
        return ownerSensors[_owner];
    }
    
    /**
     * @dev Get latest sensor reading for a product and sensor type
     */
    function getLatestReading(uint256 _productId, SensorType _sensorType) 
        external 
        view 
        returns (SensorReading memory) {
        SensorReading[] memory readings = productSensorData[_productId];
        
        for (int256 i = int256(readings.length) - 1; i >= 0; i--) {
            if (sensors[readings[uint256(i)].sensorId].sensorType == _sensorType) {
                return readings[uint256(i)];
            }
        }
        
        revert("No reading found for sensor type");
    }
    
    /**
     * @dev Check if sensor data is within acceptable ranges
     */
    function _checkThresholds(
        string memory _sensorId,
        uint256 _productId,
        int256 _value
    ) private {
        SensorType sensorType = sensors[_sensorId].sensorType;
        Threshold memory threshold = thresholds[sensorType];
        
        if (threshold.isActive && 
            (_value < threshold.minValue || _value > threshold.maxValue)) {
            
            alertCounter++;
            alerts[alertCounter] = Alert({
                productId: _productId,
                sensorId: _sensorId,
                alertType: "THRESHOLD_VIOLATION",
                message: threshold.alertMessage,
                triggerValue: _value,
                timestamp: block.timestamp,
                isResolved: false,
                resolution: ""
            });
            
            productAlerts[_productId].push(alertCounter);
            
            emit AlertTriggered(_productId, "THRESHOLD_VIOLATION", threshold.alertMessage, block.timestamp);
        }
    }
    
    /**
     * @dev Set default thresholds for common sensor types
     */
    function _setDefaultThresholds() private {
        // Temperature: -20°C to 50°C
        thresholds[SensorType.Temperature] = Threshold({
            sensorType: SensorType.Temperature,
            minValue: -20,
            maxValue: 50,
            alertMessage: "Temperature out of safe range",
            isActive: true
        });
        
        // Humidity: 0% to 100%
        thresholds[SensorType.Humidity] = Threshold({
            sensorType: SensorType.Humidity,
            minValue: 0,
            maxValue: 100,
            alertMessage: "Humidity out of safe range",
            isActive: true
        });
        
        // Pressure: 800 to 1200 hPa
        thresholds[SensorType.Pressure] = Threshold({
            sensorType: SensorType.Pressure,
            minValue: 800,
            maxValue: 1200,
            alertMessage: "Pressure out of safe range",
            isActive: true
        });
    }
    
    // Utility functions
    function getAlertCount() external view returns (uint256) {
        return alertCounter;
    }
    
    function getSensorCount() external view returns (uint256) {
        return sensorIds.length;
    }
}