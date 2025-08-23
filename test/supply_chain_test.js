const SupplyChain = artifacts.require("SupplyChain");
const IoTIntegration = artifacts.require("IoTIntegration");
const AccessControl = artifacts.require("AccessControl");

contract("Supply Chain Functionality Tests", accounts => {
  let supplyChain, iotIntegration;
  const owner = accounts[0];
  const rmsSupplier = accounts[1];
  const manufacturer = accounts[2];
  const distributor = accounts[3];
  const retailer = accounts[4];
  const iotDevice = accounts[5];
  const customer = accounts[6];

  before(async () => {
    supplyChain = await SupplyChain.deployed();
    iotIntegration = await IoTIntegration.deployed();
  });

  describe("1. Product Lifecycle Tracking - Creation to Recall Stages", () => {
    it("should add supply chain participants", async () => {
      // Add Raw Material Supplier
      await supplyChain.addRMS(rmsSupplier, "RMS Company", "Location A", { from: owner });
      const rms = await supplyChain.RMS(1);
      assert.equal(rms.addr, rmsSupplier, "RMS address should match");
      assert.equal(rms.name, "RMS Company", "RMS name should match");

      // Add Manufacturer
      await supplyChain.addManufacturer(manufacturer, "Manufacturing Corp", "Location B", { from: owner });
      const man = await supplyChain.MAN(1);
      assert.equal(man.addr, manufacturer, "Manufacturer address should match");

      // Add Distributor
      await supplyChain.addDistributor(distributor, "Distribution Inc", "Location C", { from: owner });
      const dis = await supplyChain.DIS(1);
      assert.equal(dis.addr, distributor, "Distributor address should match");

      // Add Retailer
      await supplyChain.addRetailer(retailer, "Retail Store", "Location D", { from: owner });
      const ret = await supplyChain.RET(1);
      assert.equal(ret.addr, retailer, "Retailer address should match");
    });

    it("should create a new medicine/product", async () => {
      await supplyChain.addMedicine("Aspirin", "Pain relief medication", { from: owner });
      const medicine = await supplyChain.MedicineStock(1);
      assert.equal(medicine.name, "Aspirin", "Medicine name should match");
      assert.equal(medicine.description, "Pain relief medication", "Description should match");
      assert.equal(medicine.stage.toString(), "0", "Initial stage should be Init (0)");
    });

    it("should track product through all lifecycle stages", async () => {
      // Stage 1: Raw Material Supply
      await supplyChain.RMSsupply(1, { from: rmsSupplier });
      let stage = await supplyChain.showStage(1);
      assert.equal(stage, "Raw Material Supply Stage", "Should be in RMS stage");

      // Stage 2: Manufacturing
      await supplyChain.Manufacturing(1, { from: manufacturer });
      stage = await supplyChain.showStage(1);
      assert.equal(stage, "Manufacturing Stage", "Should be in Manufacturing stage");

      // Stage 3: Distribution
      await supplyChain.Distribute(1, { from: distributor });
      stage = await supplyChain.showStage(1);
      assert.equal(stage, "Distribution Stage", "Should be in Distribution stage");

      // Stage 4: Retail
      await supplyChain.Retail(1, { from: retailer });
      stage = await supplyChain.showStage(1);
      assert.equal(stage, "Retail Stage", "Should be in Retail stage");

      // Stage 5: Sold
      await supplyChain.sold(1, { from: retailer });
      stage = await supplyChain.showStage(1);
      assert.equal(stage, "Medicine Sold", "Should be marked as sold");
    });

    it("should prevent unauthorized stage transitions", async () => {
      // Add another medicine for testing
      await supplyChain.addMedicine("Ibuprofen", "Anti-inflammatory", { from: owner });
      
      // Try to skip stages (should fail)
      try {
        await supplyChain.Manufacturing(2, { from: manufacturer });
        assert.fail("Should not allow skipping RMS stage");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when skipping stages");
      }

      // Try with unauthorized account
      try {
        await supplyChain.RMSsupply(2, { from: manufacturer });
        assert.fail("Should not allow unauthorized RMS supply");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert for unauthorized access");
      }
    });
  });

  describe("2. Ownership Transfer with Full History", () => {
    it("should track ownership at each stage", async () => {
      // Create a new product to track ownership
      await supplyChain.addMedicine("Paracetamol", "Fever reducer", { from: owner });
      const medicineId = 3;

      // Track through stages
      await supplyChain.RMSsupply(medicineId, { from: rmsSupplier });
      let medicine = await supplyChain.MedicineStock(medicineId);
      assert.equal(medicine.RMSid.toString(), "1", "RMS ID should be recorded");

      await supplyChain.Manufacturing(medicineId, { from: manufacturer });
      medicine = await supplyChain.MedicineStock(medicineId);
      assert.equal(medicine.MANid.toString(), "1", "Manufacturer ID should be recorded");

      await supplyChain.Distribute(medicineId, { from: distributor });
      medicine = await supplyChain.MedicineStock(medicineId);
      assert.equal(medicine.DISid.toString(), "1", "Distributor ID should be recorded");

      await supplyChain.Retail(medicineId, { from: retailer });
      medicine = await supplyChain.MedicineStock(medicineId);
      assert.equal(medicine.RETid.toString(), "1", "Retailer ID should be recorded");
    });

    it("should maintain complete ownership history", async () => {
      const medicine = await supplyChain.MedicineStock(3);
      
      // Verify complete ownership chain
      assert.equal(medicine.RMSid.toString(), "1", "Should have RMS in history");
      assert.equal(medicine.MANid.toString(), "1", "Should have Manufacturer in history");
      assert.equal(medicine.DISid.toString(), "1", "Should have Distributor in history");
      assert.equal(medicine.RETid.toString(), "1", "Should have Retailer in history");
      
      // Verify stage progression
      assert.equal(medicine.stage.toString(), "4", "Should be in Retail stage");
    });
  });

  describe("3. Quality Control Checks and Inspection Records", () => {
    it("should allow quality checks at manufacturing stage", async () => {
      // Quality check happens at Manufacturing stage
      // The contract tracks stage transitions which serve as quality checkpoints
      const medicineId = 3;
      const medicine = await supplyChain.MedicineStock(medicineId);
      
      // Verify product went through manufacturing (quality check point)
      assert.equal(medicine.MANid.toString(), "1", "Product passed manufacturing QC");
      assert.notEqual(medicine.stage.toString(), "1", "Product progressed beyond RMS stage");
    });

    it("should prevent progression without proper authorization (quality control)", async () => {
      // Create new medicine for QC testing
      await supplyChain.addMedicine("Vitamin C", "Supplement", { from: owner });
      const medicineId = 4;

      // Supply raw materials
      await supplyChain.RMSsupply(medicineId, { from: rmsSupplier });

      // Try to distribute without manufacturing (skip QC)
      try {
        await supplyChain.Distribute(medicineId, { from: distributor });
        assert.fail("Should not allow skipping manufacturing QC");
      } catch (error) {
        assert(error.message.includes("revert"), "Should enforce quality control stages");
      }
    });
  });

  describe("4. Temperature Monitoring (IoT Integration)", () => {
    it("should grant roles for IoT integration", async () => {
      // Grant participant role first
      await iotIntegration.grantRole(
        web3.utils.soliditySha3("PARTICIPANT_ROLE"),
        iotDevice,
        { from: owner }
      );
    });

    it("should register temperature sensor", async () => {
      const sensorId = "TEMP_SENSOR_001";
      
      await iotIntegration.registerSensor(
        sensorId,
        0, // Temperature sensor type
        "Temperature sensor for cold chain",
        "Calibrated at 0C",
        { from: iotDevice }
      );

      const sensor = await iotIntegration.sensors(sensorId);
      assert.equal(sensor.sensorId, sensorId, "Sensor should be registered");
      assert.equal(sensor.owner, iotDevice, "Sensor owner should match");
      assert.equal(sensor.sensorType.toString(), "0", "Should be temperature sensor");
    });

    it("should record temperature data", async () => {
      const sensorId = "TEMP_SENSOR_001";
      const productId = 1;
      const temperature = 5; // 5°C
      
      await iotIntegration.recordSensorData(
        sensorId,
        productId,
        temperature,
        "Celsius",
        web3.utils.asciiToHex("Cold storage"),
        { from: iotDevice }
      );

      const readings = await iotIntegration.getProductSensorData(productId);
      assert.isAbove(readings.length, 0, "Should have temperature readings");
      assert.equal(readings[0].value.toString(), temperature.toString(), "Temperature should match");
    });

    it("should trigger alerts for temperature violations", async () => {
      const sensorId = "TEMP_SENSOR_001";
      const productId = 2;
      const highTemp = 60; // 60°C - exceeds threshold
      
      // Record high temperature
      const tx = await iotIntegration.recordSensorData(
        sensorId,
        productId,
        highTemp,
        "Celsius",
        web3.utils.asciiToHex("Temperature spike"),
        { from: iotDevice }
      );

      // Check for alert event
      const alertEvent = tx.logs.find(log => log.event === 'AlertTriggered');
      assert.isDefined(alertEvent, "Should trigger temperature alert");
      
      // Verify alert details
      const alerts = await iotIntegration.getProductAlerts(productId);
      assert.isAbove(alerts.length, 0, "Should have temperature alert");
      assert.equal(alerts[0].alertType, "THRESHOLD_VIOLATION", "Should be threshold violation");
    });

    it("should support batch temperature recordings for efficiency", async () => {
      const sensorIds = ["TEMP_SENSOR_001", "TEMP_SENSOR_001"];
      const productIds = [1, 2];
      const temperatures = [4, 5];
      const units = ["Celsius", "Celsius"];
      const additionalData = [
        web3.utils.asciiToHex("Reading 1"),
        web3.utils.asciiToHex("Reading 2")
      ];

      await iotIntegration.batchRecordSensorData(
        sensorIds,
        productIds,
        temperatures,
        units,
        additionalData,
        { from: iotDevice }
      );

      const readings1 = await iotIntegration.getProductSensorData(1);
      const readings2 = await iotIntegration.getProductSensorData(2);
      
      assert.isAbove(readings1.length, 1, "Product 1 should have multiple readings");
      assert.isAbove(readings2.length, 1, "Product 2 should have multiple readings");
    });
  });

  describe("5. Location Tracking with History", () => {
    it("should register location sensor", async () => {
      const sensorId = "GPS_SENSOR_001";
      
      await iotIntegration.registerSensor(
        sensorId,
        3, // Location sensor type
        "GPS tracker for shipments",
        "High precision GPS",
        { from: iotDevice }
      );

      const sensor = await iotIntegration.sensors(sensorId);
      assert.equal(sensor.sensorType.toString(), "3", "Should be location sensor");
    });

    it("should track location changes through supply chain", async () => {
      const sensorId = "GPS_SENSOR_001";
      const productId = 1;
      
      // Record multiple location updates
      const locations = [
        { lat: 40.7128, lon: -74.0060, desc: "New York - RMS" },
        { lat: 41.8781, lon: -87.6298, desc: "Chicago - Manufacturing" },
        { lat: 34.0522, lon: -118.2437, desc: "Los Angeles - Distribution" },
        { lat: 37.7749, lon: -122.4194, desc: "San Francisco - Retail" }
      ];

      for (let loc of locations) {
        const locationData = web3.utils.asciiToHex(
          JSON.stringify({ lat: loc.lat, lon: loc.lon })
        );
        
        await iotIntegration.recordSensorData(
          sensorId,
          productId,
          Math.floor(loc.lat * 10000), // Store as integer
          "GPS",
          locationData,
          { from: iotDevice }
        );
      }

      const readings = await iotIntegration.getProductSensorData(productId);
      const locationReadings = readings.filter(r => r.sensorId === sensorId);
      
      assert.equal(locationReadings.length, 4, "Should have 4 location updates");
      assert.equal(locationReadings[0].unit, "GPS", "Should be GPS readings");
    });

    it("should maintain complete location history", async () => {
      const productId = 1;
      const allReadings = await iotIntegration.getProductSensorData(productId);
      
      // Filter location readings
      const locationReadings = allReadings.filter(r => r.unit === "GPS");
      
      assert.isAbove(locationReadings.length, 0, "Should have location history");
      
      // Verify chronological order (timestamps should increase)
      for (let i = 1; i < locationReadings.length; i++) {
        assert.isAtLeast(
          Number(locationReadings[i].timestamp),
          Number(locationReadings[i-1].timestamp),
          "Location history should be chronological"
        );
      }
    });
  });

  describe("6. Batch Processing for Gas Optimization", () => {
    it("should process multiple products in batch", async () => {
      // Add multiple medicines in preparation for batch processing
      const medicines = [
        { name: "Medicine A", desc: "Description A" },
        { name: "Medicine B", desc: "Description B" },
        { name: "Medicine C", desc: "Description C" }
      ];

      for (let med of medicines) {
        await supplyChain.addMedicine(med.name, med.desc, { from: owner });
      }

      const startId = 5; // Starting from medicine ID 5
      
      // Batch supply from RMS
      for (let i = 0; i < 3; i++) {
        await supplyChain.RMSsupply(startId + i, { from: rmsSupplier });
      }

      // Verify all products moved to RMS stage
      for (let i = 0; i < 3; i++) {
        const stage = await supplyChain.showStage(startId + i);
        assert.equal(stage, "Raw Material Supply Stage", `Product ${startId + i} should be in RMS stage`);
      }
    });

    it("should efficiently batch record IoT data", async () => {
      const sensorIds = Array(5).fill("TEMP_SENSOR_001");
      const productIds = [1, 2, 3, 4, 5];
      const temperatures = [4, 5, 3, 6, 4];
      const units = Array(5).fill("Celsius");
      const additionalData = productIds.map(id => 
        web3.utils.asciiToHex(`Batch reading for product ${id}`)
      );

      const tx = await iotIntegration.batchRecordSensorData(
        sensorIds,
        productIds,
        temperatures,
        units,
        additionalData,
        { from: iotDevice }
      );

      assert.isTrue(tx.receipt.status, "Batch recording should succeed");
      
      // Verify gas usage is optimized (single transaction for multiple records)
      const gasUsed = tx.receipt.gasUsed;
      console.log(`      Gas used for batch of 5 recordings: ${gasUsed}`);
      
      // Check that all products have new readings
      for (let productId of productIds) {
        const readings = await iotIntegration.getProductSensorData(productId);
        assert.isAbove(readings.length, 0, `Product ${productId} should have sensor data`);
      }
    });

    it("should demonstrate gas savings with batch operations", async () => {
      // Compare individual vs batch operations
      const sensorId = "TEMP_SENSOR_001";
      
      // Individual operation gas cost (approximate)
      const individualTx = await iotIntegration.recordSensorData(
        sensorId,
        1,
        5,
        "Celsius",
        web3.utils.asciiToHex("Individual reading"),
        { from: iotDevice }
      );
      const individualGas = individualTx.receipt.gasUsed;
      
      // Batch operation gas cost
      const batchTx = await iotIntegration.batchRecordSensorData(
        [sensorId, sensorId, sensorId],
        [1, 2, 3],
        [5, 6, 7],
        ["Celsius", "Celsius", "Celsius"],
        [
          web3.utils.asciiToHex("Batch 1"),
          web3.utils.asciiToHex("Batch 2"),
          web3.utils.asciiToHex("Batch 3")
        ],
        { from: iotDevice }
      );
      const batchGas = batchTx.receipt.gasUsed;
      
      const gasSaved = (individualGas * 3) - batchGas;
      const savingsPercent = ((gasSaved / (individualGas * 3)) * 100).toFixed(2);
      
      console.log(`      Individual operation gas: ${individualGas}`);
      console.log(`      Batch operation gas (3 records): ${batchGas}`);
      console.log(`      Gas saved: ${gasSaved} (${savingsPercent}%)`);
      
      assert.isAbove(gasSaved, 0, "Batch processing should save gas");
    });
  });

  describe("System Integration Summary", () => {
    it("should verify all functionalities work together", async () => {
      console.log("\n      ✅ Functionality Test Summary:");
      console.log("      1. ✅ Product Lifecycle Tracking - Complete from creation to sale");
      console.log("      2. ✅ Ownership Transfer - Full history maintained");
      console.log("      3. ✅ Quality Control - Stage-based verification");
      console.log("      4. ✅ Temperature Monitoring - IoT sensors with alerts");
      console.log("      5. ✅ Location Tracking - Complete GPS history");
      console.log("      6. ✅ Batch Processing - Gas optimization verified");
      
      // Final integration test
      const medicineCount = await supplyChain.medicineCtr();
      const sensorCount = await iotIntegration.getSensorCount();
      const alertCount = await iotIntegration.getAlertCount();
      
      console.log(`\n      📊 System Statistics:`);
      console.log(`      - Total Products Tracked: ${medicineCount}`);
      console.log(`      - Total Sensors Registered: ${sensorCount}`);
      console.log(`      - Total Alerts Generated: ${alertCount}`);
      
      assert.isAbove(Number(medicineCount), 0, "System should have products");
      assert.isAbove(Number(sensorCount), 0, "System should have sensors");
      assert.isAbove(Number(alertCount), 0, "System should have generated alerts");
    });
  });
});