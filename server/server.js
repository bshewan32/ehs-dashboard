const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
// Place this before any other middleware or routes
app.use((req, res, next) => {
  // Log every request for debugging
  console.log(`${new Date().toISOString()} - ${req.method} request to ${req.originalUrl}`);
  
  // Allowed origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['https://ehs-dashboard.vercel.app', 'http://localhost:3000'];
  
  const origin = req.headers.origin;
  
  // Log detailed CORS info for debugging
  console.log(`Request origin: ${origin || 'unknown'}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  
  // Set CORS headers directly
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Regular middleware
app.use(express.json({limit: '5mb'}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB successfully');
  
  // Log environment info for debugging
  console.log('Server environment:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`- CORS allowed origins: ${process.env.ALLOWED_ORIGINS || 'default list'}`);
  console.log(`- Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
  console.log(`- Port: ${PORT}`);
  
  // Verify the Training model is registered
  const models = mongoose.modelNames();
  console.log('Registered MongoDB models:', models);
  if (models.includes('Training')) {
    console.log('✅ Training model is properly registered');
  } else {
    console.warn('⚠️ Training model is not registered!');
  }
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Root Route (health check)
app.get('/', (req, res) => {
  res.send(`EHS Dashboard API is running. Server time: ${new Date().toISOString()}`);
});

// Routes
app.use('/api/reports', require('./routes/reports'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/ai', require('./routes/ai')); // AI route
app.use('/api/training', require('./routes/training')); 
const kpiRoutes = require('./routes/kpis');
app.use('/api/kpis', kpiRoutes);

// Only add the DeepSeek route if the file exists and API key is configured
try {
  const fs = require('fs');
  if (fs.existsSync('./routes/deepseekAI.js') && process.env.DEEPSEEK_API_KEY) {
    console.log('Loading DeepSeek AI route');
    app.use('/api/ai', require('./routes/deepseekAI')); 
  } else {
    console.log('DeepSeek AI route not loaded: File missing or API key not configured');
  }
} catch (err) {
  console.error('Error loading DeepSeek AI route:', err);
}

// Error handling middleware (place after routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

