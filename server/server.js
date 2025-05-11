const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Enable CORS for your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ehs-dashboard.vercel.app',
  credentials: true,
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Root Route (basic health check)
app.get('/', (req, res) => {
  res.send('EHS Dashboard API is running');
});

// Routes
app.use('/api/reports', require('./routes/reports'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/ai', require('./routes/ai')); // AI route
app.use('/api/training', require('./routes/training')); 

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});