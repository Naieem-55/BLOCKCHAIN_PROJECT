const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

// Stage mapping for blockchain compatibility
const STAGES = {
  0: { name: 'Created', next: [1], description: 'Product created in system' },
  1: { name: 'Raw Material', next: [2], description: 'Raw materials sourced' },
  2: { name: 'Manufacturing', next: [3], description: 'Product being manufactured' },
  3: { name: 'Quality Control', next: [4], description: 'Quality checks in progress' },
  4: { name: 'Packaging', next: [5], description: 'Product packaged' },
  5: { name: 'Distribution', next: [6], description: 'In distribution network' },
  6: { name: 'Retail', next: [7, 8], description: 'Available at retail' },
  7: { name: 'Sold', next: [], description: 'Sold to customer' },
  8: { name: 'Recalled', next: [], description: 'Product recalled' }
};

// Get product lifecycle status
router.get('/product/:id/lifecycle', auth, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('history.performedBy', 'name email role')
    .populate('history.fromOwner', 'name email')
    .populate('history.toOwner', 'name email');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Get blockchain lifecycle data if available
  let blockchainData = null;
  if (product.blockchain?.productId && blockchainService.isInitialized) {
    try {
      const stage = await blockchainService.contract.methods
        .showStage(product.blockchain.productId)
        .call();
      blockchainData = { currentStage: stage };
    } catch (error) {
      logger.error(`Failed to get blockchain lifecycle: ${error.message}`);
    }
  }

  const lifecycle = {
    currentStage: product.currentStage,
    stageName: STAGES[product.currentStage].name,
    stageDescription: STAGES[product.currentStage].description,
    possibleNextStages: STAGES[product.currentStage].next.map(s => ({
      stage: s,
      name: STAGES[s].name,
      description: STAGES[s].description
    })),
    history: product.history.filter(h => h.action === 'stage_updated').map(h => ({
      stage: h.stage,
      stageName: STAGES[h.stage]?.name,
      timestamp: h.timestamp,
      performedBy: h.performedBy,
      notes: h.notes,
      transactionHash: h.transactionHash
    })),
    blockchain: blockchainData,
    isComplete: product.currentStage === 7 || product.currentStage === 8,
    canRecall: product.currentStage < 7
  };

  res.json({
    success: true,
    lifecycle
  });
}));

// Update product lifecycle stage
router.put('/product/:id/stage', auth, asyncHandler(async (req, res) => {
  const { newStage, notes, location } = req.body;
  
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Validate stage transition
  const currentStageInfo = STAGES[product.currentStage];
  if (!currentStageInfo.next.includes(parseInt(newStage))) {
    return res.status(400).json({
      message: `Invalid stage transition from ${currentStageInfo.name} to ${STAGES[newStage].name}`
    });
  }

  // Record old values
  const oldStage = product.currentStage;
  const oldLocation = product.currentLocation;

  // Update stage
  product.currentStage = newStage;
  if (location) {
    product.currentLocation = location;
  }

  // Add to history
  product.history.push({
    action: 'stage_updated',
    stage: newStage,
    fromLocation: oldLocation,
    toLocation: location || oldLocation,
    timestamp: new Date(),
    notes,
    performedBy: req.user.id
  });

  // Update blockchain if available
  let blockchainTx = null;
  if (product.blockchain?.productId && blockchainService.isInitialized) {
    try {
      // Call appropriate blockchain function based on stage
      const stageToFunction = {
        1: 'RMSsupply',
        2: 'Manufacturing',
        5: 'Distribute',
        6: 'Retail',
        7: 'sold'
      };

      const functionName = stageToFunction[newStage];
      if (functionName && blockchainService.contract.methods[functionName]) {
        const tx = await blockchainService.contract.methods[functionName](
          product.blockchain.productId
        ).send({ 
          from: blockchainService.accounts[0], 
          gas: 300000,
          gasPrice: '20000000000' // 20 Gwei - avoid EIP-1559 issues
        });
        
        blockchainTx = tx.transactionHash;
        product.history[product.history.length - 1].transactionHash = blockchainTx;
      }
    } catch (error) {
      logger.error(`Blockchain stage update failed: ${error.message}`);
    }
  }

  await product.save();

  res.json({
    success: true,
    message: `Product moved to ${STAGES[newStage].name} stage`,
    product: {
      id: product._id,
      currentStage: product.currentStage,
      stageName: STAGES[product.currentStage].name,
      location: product.currentLocation,
      blockchainTx
    }
  });
}));

// Get complete lifecycle timeline
router.get('/product/:id/timeline', auth, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('history.performedBy', 'name email role')
    .populate('qualityChecks.inspector', 'name email');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Combine all events into timeline
  const events = [];

  // Add creation event
  events.push({
    type: 'creation',
    timestamp: product.createdAt,
    title: 'Product Created',
    description: `Product ${product.name} was created`,
    performer: product.createdBy,
    icon: 'add_circle'
  });

  // Add history events
  product.history.forEach(h => {
    let title, icon;
    switch (h.action) {
      case 'stage_updated':
        title = `Stage Changed to ${STAGES[h.stage]?.name}`;
        icon = 'timeline';
        break;
      case 'transferred':
        title = 'Ownership Transferred';
        icon = 'swap_horiz';
        break;
      case 'quality_checked':
        title = 'Quality Check Performed';
        icon = 'verified';
        break;
      case 'recalled':
        title = 'Product Recalled';
        icon = 'error';
        break;
      default:
        title = h.action;
        icon = 'info';
    }

    events.push({
      type: h.action,
      timestamp: h.timestamp,
      title,
      description: h.notes || '',
      performer: h.performedBy,
      location: h.toLocation,
      transactionHash: h.transactionHash,
      icon
    });
  });

  // Add quality checks
  product.qualityChecks.forEach(qc => {
    events.push({
      type: 'quality_check',
      timestamp: qc.timestamp,
      title: `Quality Check: ${qc.checkType.replace('_', ' ')}`,
      description: `${qc.passed ? 'Passed' : 'Failed'} - ${qc.notes || 'No notes'}`,
      performer: qc.inspector,
      passed: qc.passed,
      icon: qc.passed ? 'check_circle' : 'cancel'
    });
  });

  // Sort by timestamp
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    success: true,
    timeline: events,
    totalEvents: events.length,
    productInfo: {
      name: product.name,
      batchNumber: product.batchNumber,
      currentStage: STAGES[product.currentStage].name
    }
  });
}));

// Recall a product
router.post('/product/:id/recall', auth, asyncHandler(async (req, res) => {
  const { reason, severity, affectedBatches } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Check if product can be recalled
  if (product.currentStage === 7 || product.currentStage === 8) {
    return res.status(400).json({ 
      message: 'Product cannot be recalled (already sold or recalled)' 
    });
  }

  // Update to recalled stage
  product.currentStage = 8;
  product.history.push({
    action: 'recalled',
    stage: 8,
    timestamp: new Date(),
    notes: `Recall Reason: ${reason}. Severity: ${severity}`,
    performedBy: req.user.id
  });

  await product.save();

  // If batch recall, recall all products in batch
  if (affectedBatches && affectedBatches.length > 0) {
    await Product.updateMany(
      { 
        batchNumber: { $in: affectedBatches },
        currentStage: { $lt: 7 }
      },
      {
        $set: { currentStage: 8 },
        $push: {
          history: {
            action: 'recalled',
            stage: 8,
            timestamp: new Date(),
            notes: `Batch Recall - Reason: ${reason}`,
            performedBy: req.user.id
          }
        }
      }
    );
  }

  res.json({
    success: true,
    message: 'Product recalled successfully',
    recallInfo: {
      productId: product._id,
      batchNumber: product.batchNumber,
      reason,
      severity,
      affectedBatches,
      timestamp: new Date()
    }
  });
}));

// Get lifecycle analytics
router.get('/lifecycle/analytics', auth, asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true });

  const analytics = {
    totalProducts: products.length,
    byStage: {},
    averageTimePerStage: {},
    bottlenecks: [],
    completionRate: 0
  };

  // Count products by stage
  Object.keys(STAGES).forEach(stage => {
    analytics.byStage[STAGES[stage].name] = 0;
  });

  let completedCount = 0;
  products.forEach(product => {
    analytics.byStage[STAGES[product.currentStage].name]++;
    if (product.currentStage === 7) completedCount++;
  });

  analytics.completionRate = products.length > 0 
    ? Math.round((completedCount / products.length) * 100) 
    : 0;

  // Identify bottlenecks (stages with high product count)
  Object.entries(analytics.byStage).forEach(([stage, count]) => {
    if (count > products.length * 0.2 && stage !== 'Sold' && stage !== 'Created') {
      analytics.bottlenecks.push({
        stage,
        count,
        percentage: Math.round((count / products.length) * 100)
      });
    }
  });

  res.json({
    success: true,
    analytics
  });
}));

module.exports = router;