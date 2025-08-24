const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Test login endpoint that creates a test user session
router.post('/test-login', async (req, res) => {
  try {
    // Create a test user object
    const testUser = {
      id: '68aa8f4bcf4c31570ba38d28',
      email: 'test@example.com',
      name: 'Test User',
      role: 'manufacturer',
      company: 'Test Company',
    };

    // Generate token
    const token = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: testUser,
        token,
        refreshToken: token,
        expiresIn: 7 * 24 * 60 * 60,
      },
      message: 'Test login successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test login failed',
      error: error.message,
    });
  }
});

module.exports = router;