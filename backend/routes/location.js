const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

// Record new location for product
router.post('/product/:id/location', auth, asyncHandler(async (req, res) => {
  const {
    location,
    coordinates,
    address,
    locationType,
    transportDetails
  } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Create location entry
  const locationEntry = {
    location: location || product.currentLocation,
    coordinates,
    address,
    timestamp: new Date(),
    recordedBy: req.user._id,
    locationType,
    transportDetails
  };

  // Add to location history
  if (!product.locationHistory) {
    product.locationHistory = [];
  }
  product.locationHistory.push(locationEntry);

  // Update current location
  product.currentLocation = location || product.currentLocation;

  // Add to general history
  product.history.push({
    action: 'transferred',
    fromLocation: product.currentLocation,
    toLocation: location,
    timestamp: new Date(),
    notes: `Location updated to ${location}`,
    performedBy: req.user._id
  });

  // Update on blockchain if IoT integration is available
  if (product.blockchain?.productId && blockchainService.isInitialized) {
    try {
      // Record location on blockchain using IoT integration
      const iotContract = blockchainService.iotContract;
      if (iotContract) {
        const tx = await iotContract.methods.recordSensorData(
          'GPS_TRACKER',
          product.blockchain.productId,
          Math.floor(coordinates?.latitude * 10000) || 0,
          'GPS',
          web3.utils.asciiToHex(JSON.stringify({
            lat: coordinates?.latitude,
            lon: coordinates?.longitude,
            location
          }))
        ).send({ from: blockchainService.accounts[0], gas: 300000 });
        
        locationEntry.transactionHash = tx.transactionHash;
      }
    } catch (error) {
      logger.error(`Failed to record location on blockchain: ${error.message}`);
    }
  }

  await product.save();

  res.json({
    success: true,
    message: 'Location updated successfully',
    location: locationEntry
  });
}));

// Get location history for product
router.get('/product/:id/locations', auth, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('locationHistory.recordedBy', 'name email role');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Get blockchain location data if available
  let blockchainLocations = [];
  if (product.blockchain?.productId && blockchainService.isInitialized) {
    try {
      const iotContract = blockchainService.iotContract;
      if (iotContract) {
        const sensorData = await iotContract.methods
          .getProductSensorData(product.blockchain.productId)
          .call();
        
        blockchainLocations = sensorData
          .filter(data => data.unit === 'GPS')
          .map(data => ({
            timestamp: new Date(data.timestamp * 1000),
            value: data.value,
            additionalData: data.additionalData
          }));
      }
    } catch (error) {
      logger.error(`Failed to get blockchain locations: ${error.message}`);
    }
  }

  const response = {
    success: true,
    currentLocation: product.currentLocation,
    locationHistory: product.locationHistory || [],
    blockchainLocations,
    totalLocations: (product.locationHistory?.length || 0) + blockchainLocations.length,
    journey: generateJourney(product.locationHistory || [])
  };

  res.json(response);
}));

// Get current location with real-time tracking
router.get('/product/:id/location/current', auth, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const lastLocation = product.locationHistory && product.locationHistory.length > 0
    ? product.locationHistory[product.locationHistory.length - 1]
    : null;

  res.json({
    success: true,
    currentLocation: {
      name: product.currentLocation,
      coordinates: lastLocation?.coordinates,
      address: lastLocation?.address,
      locationType: lastLocation?.locationType,
      lastUpdated: lastLocation?.timestamp || product.updatedAt,
      recordedBy: lastLocation?.recordedBy
    },
    inTransit: lastLocation?.locationType === 'transport',
    transportDetails: lastLocation?.transportDetails
  });
}));

// Track product journey on map
router.get('/product/:id/journey', auth, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const journey = generateJourney(product.locationHistory || []);
  
  // Calculate journey statistics
  const stats = {
    totalDistance: calculateTotalDistance(journey.waypoints),
    totalDuration: calculateDuration(journey.waypoints),
    averageSpeed: 0,
    stops: journey.waypoints.length
  };

  if (stats.totalDuration > 0) {
    stats.averageSpeed = stats.totalDistance / (stats.totalDuration / 3600); // km/h
  }

  res.json({
    success: true,
    journey,
    statistics: stats
  });
}));

// Batch update locations for multiple products
router.post('/products/batch-location', auth, asyncHandler(async (req, res) => {
  const { productIds, location, coordinates, locationType } = req.body;

  if (!productIds || productIds.length === 0) {
    return res.status(400).json({ message: 'Product IDs required' });
  }

  const locationEntry = {
    location,
    coordinates,
    timestamp: new Date(),
    recordedBy: req.user._id,
    locationType
  };

  // Update all products
  const updatePromises = productIds.map(async (productId) => {
    const product = await Product.findById(productId);
    if (product) {
      if (!product.locationHistory) {
        product.locationHistory = [];
      }
      product.locationHistory.push(locationEntry);
      product.currentLocation = location;
      
      product.history.push({
        action: 'transferred',
        toLocation: location,
        timestamp: new Date(),
        notes: `Batch location update to ${location}`,
        performedBy: req.user._id
      });
      
      return product.save();
    }
    return null;
  });

  const results = await Promise.all(updatePromises);
  const updatedCount = results.filter(r => r !== null).length;

  res.json({
    success: true,
    message: `${updatedCount} products updated`,
    updatedProducts: updatedCount,
    failedProducts: productIds.length - updatedCount
  });
}));

// Get products at specific location
router.get('/location/:location/products', auth, asyncHandler(async (req, res) => {
  const { location } = req.params;
  
  const products = await Product.find({ 
    currentLocation: new RegExp(location, 'i'),
    isActive: true 
  })
  .populate('currentOwner', 'name email')
  .select('name batchNumber category currentStage currentLocation');

  const grouped = {};
  products.forEach(product => {
    const stage = product.stageName || 'Unknown';
    if (!grouped[stage]) {
      grouped[stage] = [];
    }
    grouped[stage].push(product);
  });

  res.json({
    success: true,
    location,
    totalProducts: products.length,
    productsByStage: grouped,
    products
  });
}));

// Get location analytics
router.get('/locations/analytics', auth, asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true });

  const locationStats = {};
  const transportStats = {
    inTransit: 0,
    atFacility: 0,
    delivered: 0
  };

  products.forEach(product => {
    // Count by current location
    if (!locationStats[product.currentLocation]) {
      locationStats[product.currentLocation] = {
        count: 0,
        stages: {}
      };
    }
    locationStats[product.currentLocation].count++;
    
    const stageName = STAGES[product.currentStage]?.name || 'Unknown';
    if (!locationStats[product.currentLocation].stages[stageName]) {
      locationStats[product.currentLocation].stages[stageName] = 0;
    }
    locationStats[product.currentLocation].stages[stageName]++;

    // Transport statistics
    const lastLocation = product.locationHistory?.[product.locationHistory.length - 1];
    if (lastLocation?.locationType === 'transport') {
      transportStats.inTransit++;
    } else if (product.currentStage === 7) {
      transportStats.delivered++;
    } else {
      transportStats.atFacility++;
    }
  });

  // Find hotspots (locations with most products)
  const hotspots = Object.entries(locationStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([location, stats]) => ({
      location,
      productCount: stats.count,
      stages: stats.stages
    }));

  res.json({
    success: true,
    analytics: {
      totalLocations: Object.keys(locationStats).length,
      totalProducts: products.length,
      locationDistribution: locationStats,
      transportStatus: transportStats,
      hotspots
    }
  });
}));

// Helper function to generate journey waypoints
function generateJourney(locationHistory) {
  const waypoints = locationHistory.map((loc, index) => ({
    position: index + 1,
    location: loc.location,
    coordinates: loc.coordinates,
    address: loc.address,
    timestamp: loc.timestamp,
    locationType: loc.locationType,
    duration: index > 0 ? 
      Math.abs(new Date(loc.timestamp) - new Date(locationHistory[index - 1].timestamp)) / 1000 : 
      0
  }));

  return {
    origin: waypoints[0] || null,
    destination: waypoints[waypoints.length - 1] || null,
    waypoints,
    totalStops: waypoints.length
  };
}

// Calculate distance between coordinates
function calculateTotalDistance(waypoints) {
  let totalDistance = 0;
  
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1].coordinates;
    const curr = waypoints[i].coordinates;
    
    if (prev && curr) {
      totalDistance += calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }
  }
  
  return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
}

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Calculate total journey duration
function calculateDuration(waypoints) {
  if (waypoints.length < 2) return 0;
  
  const first = new Date(waypoints[0].timestamp);
  const last = new Date(waypoints[waypoints.length - 1].timestamp);
  
  return Math.abs(last - first) / 1000; // Duration in seconds
}

// Stage mapping
const STAGES = {
  0: { name: 'Created' },
  1: { name: 'Raw Material' },
  2: { name: 'Manufacturing' },
  3: { name: 'Quality Control' },
  4: { name: 'Packaging' },
  5: { name: 'Distribution' },
  6: { name: 'Retail' },
  7: { name: 'Sold' },
  8: { name: 'Recalled' }
};

module.exports = router;