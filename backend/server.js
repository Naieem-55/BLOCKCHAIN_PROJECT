const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { globalErrorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const testAuthRoutes = require('./routes/testAuth');
const productRoutes = require('./routes/products');
const participantRoutes = require('./routes/participants');
const iotRoutes = require('./routes/iot');
const analyticsRoutes = require('./routes/analytics');
const shardingRoutes = require('./routes/sharding');
const lifecycleRoutes = require('./routes/lifecycle');
const locationRoutes = require('./routes/location');
const blockchainService = require('./services/blockchainService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Connect to databases
connectDB();
connectRedis();

// Initialize blockchain service
blockchainService.initialize();

// Trust proxy for rate limiting when behind a proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001", // Alternative frontend port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Swagger documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Supply Chain Traceability API',
      version: '1.0.0',
      description: 'High-Efficiency Blockchain-Based Supply Chain Traceability System API',
      contact: {
        name: 'Supply Chain Team',
        email: 'team@supplychain.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/test-auth', testAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sharding', shardingRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/location', locationRoutes);

// WebSocket handling for real-time updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-product-room', (productId) => {
    socket.join(`product-${productId}`);
    logger.info(`Client ${socket.id} joined product room ${productId}`);
  });
  
  socket.on('join-participant-room', (participantId) => {
    socket.join(`participant-${participantId}`);
    logger.info(`Client ${socket.id} joined participant room ${participantId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = { app, io };