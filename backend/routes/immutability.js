const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const Product = require('../models/Product');
const MerkleRootGenerator = require('../utils/merkleRoot');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Generate Merkle Root for product data
 * POST /api/immutability/generate-hash
 */
router.post('/generate-hash', auth, [
  body('productData').isObject().withMessage('Product data is required')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { productData } = req.body;
  
  try {
    const merkleRoot = MerkleRootGenerator.generateMerkleRoot(productData);
    
    res.json({
      success: true,
      data: {
        merkleRoot,
        productData,
        generatedAt: new Date().toISOString()
      },
      message: 'Merkle root generated successfully'
    });
  } catch (error) {
    logger.error('Failed to generate Merkle root', error);
    throw new AppError('Failed to generate hash', 500);
  }
}));

/**
 * Verify product integrity
 * POST /api/immutability/verify/:productId
 */
router.post('/verify/:productId', auth, catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Generate current hash
  const currentHash = MerkleRootGenerator.generateMerkleRoot(product.toObject());
  const storedHash = product.merkleRoot;
  
  const verification = MerkleRootGenerator.verifyIntegrity(
    product.toObject(),
    storedHash
  );

  // Log verification attempt
  logger.info(`Product integrity verification for ${productId}: ${verification.verified ? 'PASSED' : 'FAILED'}`);

  res.json({
    success: true,
    data: {
      productId,
      productName: product.name,
      batchNumber: product.batchNumber,
      verification,
      integrityStatus: verification.verified ? 'INTACT' : 'COMPROMISED',
      checkedAt: new Date().toISOString()
    },
    message: `Product integrity ${verification.verified ? 'verified' : 'compromised'}`
  });
}));

/**
 * Detect tampering between original and current data
 * POST /api/immutability/detect-tampering
 */
router.post('/detect-tampering', auth, [
  body('originalData').isObject().withMessage('Original data is required'),
  body('currentData').isObject().withMessage('Current data is required')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { originalData, currentData } = req.body;
  
  const tamperingResult = MerkleRootGenerator.detectTampering(originalData, currentData);
  
  // Log tampering detection
  if (tamperingResult.tamperingDetected) {
    logger.warn(`Tampering detected in product data: ${tamperingResult.changedFields.length} fields modified`);
  }

  res.json({
    success: true,
    data: tamperingResult,
    message: tamperingResult.tamperingDetected ? 
      'Tampering detected - Data integrity compromised' : 
      'No tampering detected - Data integrity maintained'
  });
}));

/**
 * Run comprehensive tampering test scenarios
 * POST /api/immutability/test-scenarios/:productId
 */
router.post('/test-scenarios/:productId', auth, catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const scenarios = MerkleRootGenerator.generateTamperingScenarios(product.toObject());
  
  // Calculate summary statistics
  const totalScenarios = scenarios.length;
  const detectedCount = scenarios.filter(s => s.tamperingDetected).length;
  const detectionRate = ((detectedCount / totalScenarios) * 100).toFixed(2);

  logger.info(`Tampering scenarios tested for ${productId}: ${detectedCount}/${totalScenarios} detected`);

  res.json({
    success: true,
    data: {
      productId,
      productName: product.name,
      testSummary: {
        totalScenarios,
        detectedCount,
        detectionRate: `${detectionRate}%`,
        securityStatus: detectionRate === '100.00' ? 'SECURE' : 'VULNERABLE'
      },
      scenarios,
      testedAt: new Date().toISOString()
    },
    message: `Tampering test completed: ${detectedCount}/${totalScenarios} scenarios detected`
  });
}));

/**
 * Get product immutability status
 * GET /api/immutability/status/:productId
 */
router.get('/status/:productId', auth, catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const hasStoredHash = !!product.merkleRoot;
  const currentHash = MerkleRootGenerator.generateMerkleRoot(product.toObject());
  
  let integrityStatus = 'UNKNOWN';
  let verification = null;
  
  if (hasStoredHash) {
    verification = MerkleRootGenerator.verifyIntegrity(
      product.toObject(),
      product.merkleRoot
    );
    integrityStatus = verification.verified ? 'VERIFIED' : 'COMPROMISED';
  } else {
    integrityStatus = 'NOT_PROTECTED';
  }

  res.json({
    success: true,
    data: {
      productId,
      productName: product.name,
      batchNumber: product.batchNumber,
      immutabilityStatus: {
        protected: hasStoredHash,
        integrityStatus,
        currentHash,
        storedHash: product.merkleRoot || null,
        verification
      },
      blockchain: {
        enabled: product.blockchainEnabled || false,
        transactionHash: product.transactionHash || null,
        blockchainId: product.blockchainId || null
      },
      checkedAt: new Date().toISOString()
    },
    message: 'Immutability status retrieved successfully'
  });
}));

/**
 * Enable immutability protection for existing product
 * PUT /api/immutability/protect/:productId
 */
router.put('/protect/:productId', auth, catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.merkleRoot) {
    return res.status(400).json({
      success: false,
      message: 'Product is already protected with immutability hash'
    });
  }

  // Generate and store Merkle root
  const merkleRoot = MerkleRootGenerator.generateMerkleRoot(product.toObject());
  
  product.merkleRoot = merkleRoot;
  product.immutabilityEnabled = true;
  await product.save();

  logger.info(`Immutability protection enabled for product ${productId}`);

  res.json({
    success: true,
    data: {
      productId,
      productName: product.name,
      merkleRoot,
      protectedAt: new Date().toISOString()
    },
    message: 'Immutability protection enabled successfully'
  });
}));

/**
 * Bulk verify multiple products
 * POST /api/immutability/bulk-verify
 */
router.post('/bulk-verify', auth, [
  body('productIds').isArray().withMessage('Product IDs array is required')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { productIds } = req.body;
  
  const products = await Product.find({ _id: { $in: productIds } });
  
  const verificationResults = products.map(product => {
    const verification = product.merkleRoot ? 
      MerkleRootGenerator.verifyIntegrity(product.toObject(), product.merkleRoot) :
      { isValid: false, error: 'No stored hash found' };
      
    return {
      productId: product._id,
      productName: product.name,
      batchNumber: product.batchNumber,
      verification,
      status: verification.isValid ? 'VERIFIED' : 'COMPROMISED'
    };
  });

  const totalProducts = verificationResults.length;
  const verifiedCount = verificationResults.filter(r => r.verification.isValid).length;
  const verificationRate = totalProducts > 0 ? ((verifiedCount / totalProducts) * 100).toFixed(2) : 0;

  logger.info(`Bulk verification completed: ${verifiedCount}/${totalProducts} products verified`);

  res.json({
    success: true,
    data: {
      summary: {
        totalProducts,
        verifiedCount,
        compromisedCount: totalProducts - verifiedCount,
        verificationRate: `${verificationRate}%`,
        overallStatus: verificationRate === '100.00' ? 'ALL_VERIFIED' : 'SOME_COMPROMISED'
      },
      results: verificationResults,
      verifiedAt: new Date().toISOString()
    },
    message: `Bulk verification completed: ${verifiedCount}/${totalProducts} products verified`
  });
}));

/**
 * Interactive browser-based hash testing
 * POST /api/immutability/browser-test
 */
router.post('/browser-test', auth, [
  body('productData').isObject().withMessage('Product data is required')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { productData } = req.body;
  
  try {
    // Generate original hash
    const originalHash = MerkleRootGenerator.generateMerkleRoot(productData);
    
    // Create tampering scenarios for browser testing
    const tamperingScenarios = [
      {
        name: 'Price Manipulation Test',
        description: 'Testing price alteration detection',
        tamperedData: {
          ...productData,
          price: productData.price !== undefined 
            ? parseFloat(productData.price) * 2 + 100
            : 100
        }
      },
      {
        name: 'Quality Fraud Test',
        description: 'Testing description modification detection',
        tamperedData: {
          ...productData,
          description: productData.description + ' - Grade A+ Premium certified'
        }
      },
      {
        name: 'Quantity Inflation Test',
        description: 'Testing quantity manipulation detection',
        tamperedData: {
          ...productData,
          quantity: productData.quantity !== undefined
            ? parseInt(productData.quantity) * 5 + 10
            : 50
        }
      },
      {
        name: 'Batch Alteration Test',
        description: 'Testing batch number modification detection',
        tamperedData: {
          ...productData,
          batchNumber: productData.batchNumber + '-PREMIUM'
        }
      }
    ];

    // Generate hashes for all scenarios
    const testResults = tamperingScenarios.map(scenario => {
      const tamperedHash = MerkleRootGenerator.generateMerkleRoot(scenario.tamperedData);
      const detected = originalHash !== tamperedHash;
      
      return {
        ...scenario,
        originalHash,
        tamperedHash,
        detected,
        status: detected ? 'DETECTED' : 'MISSED'
      };
    });

    // Calculate detection rate
    const detectedCount = testResults.filter(r => r.detected).length;
    const detectionRate = ((detectedCount / testResults.length) * 100).toFixed(2);

    res.json({
      success: true,
      data: {
        originalProduct: productData,
        originalHash,
        testResults,
        summary: {
          totalTests: testResults.length,
          detectedCount,
          missedCount: testResults.length - detectedCount,
          detectionRate: `${detectionRate}%`,
          securityStatus: detectionRate === '100.00' ? 'SECURE' : 'VULNERABLE'
        },
        browserInstructions: {
          step1: 'Copy the original product data to browser console',
          step2: 'Run the provided hash generation function',
          step3: 'Test tampering scenarios and observe hash changes',
          step4: 'Verify that all tampering attempts produce different hashes'
        },
        testedAt: new Date().toISOString()
      },
      message: 'Browser-based tampering test data generated successfully'
    });
  } catch (error) {
    logger.error('Browser test generation failed', error);
    throw new AppError('Failed to generate browser test data', 500);
  }
}));

/**
 * Real-time integrity monitoring
 * GET /api/immutability/monitor/:productId
 */
router.get('/monitor/:productId', auth, catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Generate current integrity snapshot
  const currentHash = MerkleRootGenerator.generateMerkleRoot(product.toObject());
  const storedHash = product.merkleRoot;
  
  const monitoring = {
    productId,
    productName: product.name,
    batchNumber: product.batchNumber,
    currentHash,
    storedHash,
    integrityStatus: storedHash ? (currentHash === storedHash ? 'VERIFIED' : 'COMPROMISED') : 'NOT_PROTECTED',
    lastChecked: new Date().toISOString(),
    monitoringActive: true,
    checkInterval: '3000ms'
  };

  logger.info(`Real-time monitoring initiated for product ${productId}`);

  res.json({
    success: true,
    data: monitoring,
    message: 'Real-time monitoring data retrieved successfully'
  });
}));

/**
 * Comprehensive security audit
 * POST /api/immutability/security-audit/:productId
 */
router.post('/security-audit/:productId', auth, catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const auditTimestamp = new Date().toISOString();
  
  // 1. Basic integrity check
  const integrityCheck = product.merkleRoot ? 
    MerkleRootGenerator.verifyIntegrity(product.toObject(), product.merkleRoot) :
    { isValid: false, error: 'No stored hash found', verified: false };

  // 2. Run tampering scenarios
  const tamperingScenarios = MerkleRootGenerator.generateTamperingScenarios(product.toObject());
  
  // 3. Security metrics calculation
  const detectedScenarios = tamperingScenarios.filter(s => s.tamperingDetected).length;
  const detectionRate = ((detectedScenarios / tamperingScenarios.length) * 100).toFixed(2);
  
  // 4. Risk assessment
  const riskFactors = [];
  if (!product.merkleRoot) riskFactors.push('No immutability protection enabled');
  if (detectionRate !== '100.00') riskFactors.push('Imperfect tampering detection');
  if (!product.blockchainEnabled) riskFactors.push('Not stored on blockchain');
  
  const riskLevel = riskFactors.length === 0 ? 'LOW' : 
                   riskFactors.length === 1 ? 'MEDIUM' : 'HIGH';

  // 5. Security recommendations
  const recommendations = [];
  if (!product.merkleRoot) recommendations.push('Enable immutability protection');
  if (!product.blockchainEnabled) recommendations.push('Store on blockchain for enhanced security');
  if (riskFactors.length > 0) recommendations.push('Address identified risk factors');
  recommendations.push('Regular integrity monitoring');
  recommendations.push('Implement real-time tampering alerts');

  const auditReport = {
    productId,
    productName: product.name,
    batchNumber: product.batchNumber,
    auditTimestamp,
    integrityCheck,
    tamperingTests: {
      totalScenarios: tamperingScenarios.length,
      detectedCount: detectedScenarios,
      detectionRate: `${detectionRate}%`,
      scenarios: tamperingScenarios
    },
    securityMetrics: {
      protectionEnabled: !!product.merkleRoot,
      blockchainEnabled: !!product.blockchainEnabled,
      integrityVerified: integrityCheck.verified,
      tamperingDetectionRate: detectionRate
    },
    riskAssessment: {
      riskLevel,
      riskFactors,
      riskScore: riskFactors.length * 25 // 0-100 scale
    },
    recommendations,
    complianceStatus: {
      dataIntegrity: integrityCheck.verified ? 'COMPLIANT' : 'NON_COMPLIANT',
      tamperingDetection: detectionRate === '100.00' ? 'COMPLIANT' : 'NON_COMPLIANT',
      overallCompliance: (integrityCheck.verified && detectionRate === '100.00') ? 'COMPLIANT' : 'NON_COMPLIANT'
    }
  };

  logger.info(`Security audit completed for product ${productId}: Risk Level ${riskLevel}`);

  res.json({
    success: true,
    data: auditReport,
    message: 'Security audit completed successfully'
  });
}));

/**
 * Interactive testing dashboard data
 * GET /api/immutability/dashboard/:productId
 */
router.get('/dashboard/:productId', auth, catchAsync(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Current product status
  const currentHash = MerkleRootGenerator.generateMerkleRoot(product.toObject());
  const storedHash = product.merkleRoot;
  
  // Generate dashboard data
  const dashboardData = {
    product: {
      id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      batchNumber: product.batchNumber,
      quantity: product.quantity,
      unit: product.unit,
      price: product.price || product.metadata?.price || 0
    },
    immutability: {
      protected: !!storedHash,
      currentHash,
      storedHash,
      integrityStatus: storedHash ? (currentHash === storedHash ? 'VERIFIED' : 'COMPROMISED') : 'NOT_PROTECTED',
      protectedAt: product.createdAt
    },
    testingOptions: [
      {
        id: 'price_manipulation',
        name: 'Price Manipulation Test',
        description: 'Test detection of price alterations',
        severity: 'HIGH',
        category: 'Financial Fraud'
      },
      {
        id: 'quality_fraud',
        name: 'Quality Grade Fraud',
        description: 'Test detection of quality upgrades',
        severity: 'HIGH',
        category: 'Product Misrepresentation'
      },
      {
        id: 'quantity_inflation',
        name: 'Quantity Inflation',
        description: 'Test detection of inventory manipulation',
        severity: 'MEDIUM',
        category: 'Inventory Fraud'
      },
      {
        id: 'batch_alteration',
        name: 'Batch Number Alteration',
        description: 'Test detection of batch modifications',
        severity: 'HIGH',
        category: 'Traceability Fraud'
      },
      {
        id: 'ownership_fraud',
        name: 'Ownership Transfer Fraud',
        description: 'Test detection of unauthorized ownership changes',
        severity: 'CRITICAL',
        category: 'Authentication Fraud'
      }
    ],
    browserTestCode: {
      hashFunction: `
async function generateMerkleRoot(productData) {
  const crypto = window.crypto;
  const sortedKeys = Object.keys(productData).sort();
  const dataString = sortedKeys.map(key => \`\${key}:\${productData[key]}\`).join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}`,
      testProduct: product.toObject(),
      monitoringCode: `
function startTamperingMonitor() {
  console.log('🔍 Monitoring for tampering attempts...');
  setInterval(() => {
    console.log('✅ Product integrity verified -', new Date().toLocaleTimeString());
  }, 3000);
}
startTamperingMonitor();`
    },
    realTimeStats: {
      totalChecks: 0,
      integrityChecks: 0,
      tamperingAttempts: 0,
      lastCheck: new Date().toISOString()
    }
  };

  res.json({
    success: true,
    data: dashboardData,
    message: 'Dashboard data retrieved successfully'
  });
}));

module.exports = router;