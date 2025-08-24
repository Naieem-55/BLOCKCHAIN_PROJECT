const crypto = require('crypto');

/**
 * Generate Merkle Root for product data
 * Provides cryptographic hash for immutability verification
 */
class MerkleRootGenerator {
  
  /**
   * Generate deterministic hash from product data
   * @param {Object} productData - Product information
   * @returns {String} - Merkle root hash (0x prefixed)
   */
  static generateMerkleRoot(productData) {
    try {
      // Create a copy to avoid modifying original
      const data = { ...productData };
      
      // Remove fields that shouldn't be part of immutability check
      delete data._id;
      delete data.__v;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.merkleRoot; // Don't include the hash itself
      delete data.blockchainId;
      delete data.transactionHash;
      
      // Sort keys for deterministic hashing
      const sortedKeys = Object.keys(data).sort();
      const dataString = sortedKeys.map(key => {
        const value = data[key];
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `${key}:${JSON.stringify(value, Object.keys(value).sort())}`;
        }
        return `${key}:${value}`;
      }).join('|');
      
      // Generate SHA-256 hash
      const hash = crypto.createHash('sha256').update(dataString).digest('hex');
      return '0x' + hash;
    } catch (error) {
      throw new Error(`Failed to generate Merkle root: ${error.message}`);
    }
  }

  /**
   * Verify product data integrity
   * @param {Object} productData - Current product data
   * @param {String} storedHash - Previously stored Merkle root
   * @returns {Object} - Verification result
   */
  static verifyIntegrity(productData, storedHash) {
    try {
      const currentHash = this.generateMerkleRoot(productData);
      const isValid = currentHash === storedHash;
      
      return {
        isValid,
        currentHash,
        storedHash,
        verified: isValid,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        verified: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Detect tampering by comparing hashes
   * @param {Object} originalData - Original product data
   * @param {Object} currentData - Current product data
   * @returns {Object} - Tampering detection result
   */
  static detectTampering(originalData, currentData) {
    try {
      const originalHash = this.generateMerkleRoot(originalData);
      const currentHash = this.generateMerkleRoot(currentData);
      
      const isAltered = originalHash !== currentHash;
      const changedFields = [];
      
      if (isAltered) {
        // Identify changed fields
        const originalKeys = Object.keys(originalData);
        const currentKeys = Object.keys(currentData);
        
        // Check for changed values
        [...new Set([...originalKeys, ...currentKeys])].forEach(key => {
          if (JSON.stringify(originalData[key]) !== JSON.stringify(currentData[key])) {
            changedFields.push({
              field: key,
              originalValue: originalData[key],
              currentValue: currentData[key]
            });
          }
        });
      }
      
      return {
        tamperingDetected: isAltered,
        originalHash,
        currentHash,
        changedFields,
        severity: isAltered ? 'HIGH' : 'NONE',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        tamperingDetected: true,
        error: error.message,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate test scenarios for tampering detection
   * @param {Object} originalProduct - Original product data
   * @returns {Array} - Array of tampered scenarios
   */
  static generateTamperingScenarios(originalProduct) {
    const scenarios = [
      {
        name: 'Price Manipulation',
        description: 'Attacker increases product price',
        tamperedData: {
          ...originalProduct,
          price: originalProduct.price !== undefined 
            ? parseFloat(originalProduct.price) * 2 + 100  
            : 100
        }
      },
      {
        name: 'Quality Grade Fraud',
        description: 'Attacker upgrades product quality',
        tamperedData: {
          ...originalProduct,
          description: originalProduct.description + ' - Premium Grade A+',
          category: 'Premium ' + originalProduct.category
        }
      },
      {
        name: 'Quantity Inflation',
        description: 'Attacker increases inventory quantity',
        tamperedData: {
          ...originalProduct,
          quantity: originalProduct.quantity !== undefined
            ? parseInt(originalProduct.quantity) * 5 + 10
            : 50
        }
      },
      {
        name: 'Batch Number Alteration',
        description: 'Attacker changes batch identification',
        tamperedData: {
          ...originalProduct,
          batchNumber: originalProduct.batchNumber + '-PREMIUM'
        }
      },
      {
        name: 'Ownership Transfer Fraud',
        description: 'Attacker changes manufacturer information',
        tamperedData: {
          ...originalProduct,
          manufacturer: 'PREMIUM_MANUFACTURER_ID',
          createdBy: 'FAKE_USER_ID'
        }
      }
    ];

    return scenarios.map(scenario => {
      const detection = this.detectTampering(originalProduct, scenario.tamperedData);
      return {
        ...scenario,
        ...detection
      };
    });
  }
}

module.exports = MerkleRootGenerator;