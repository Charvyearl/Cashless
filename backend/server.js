const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallets');
const transactionRoutes = require('./routes/transactions');
const menuRoutes = require('./routes/menu');
const adminRoutes = require('./routes/admin');
const rfidRoutes = require('./routes/rfid');
const canteenOrderRoutes = require('./routes/canteenOrders');

const app = express();

// CORS configuration (place BEFORE security middlewares to ensure preflight headers are set)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://cashless-production-065d.up.railway.app'
      ]
    : function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Allow localhost and local network IPs for development
        const allowedPatterns = [
          /^http:\/\/localhost(:\d+)?$/,
          /^http:\/\/127\.0\.0\.1(:\d+)?$/,
          /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,  // Local network 192.168.x.x
          /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,  // Local network 10.x.x.x
          /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/,  // Local network 172.16-31.x.x
        ];
        
        const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn('⚠️  CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true,
};
app.use(cors(corsOptions));
// Explicitly handle preflight
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.'
});

// Only enable rate limiter in production
if (config.nodeEnv === 'production') {
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/canteen-orders', canteenOrderRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    if (config.nodeEnv !== 'production') {
      // Safe boolean-only log for device key presence
      console.log('IOT_DEVICE_KEY set:', Boolean(process.env.IOT_DEVICE_KEY));
    }

    // Listen on 0.0.0.0 to allow connections from network devices (Expo Go, etc.)
    const host = config.nodeEnv === 'production' ? undefined : '0.0.0.0';
    app.listen(config.port, host, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Local: http://localhost:${config.port}/health`);
      if (host === '0.0.0.0') {
        console.log(`🌐 Network: http://<your-ip>:${config.port}/health`);
        console.log(`📱 For Expo Go: Make sure your phone and computer are on the same network`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
