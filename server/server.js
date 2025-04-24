const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for larger training data
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define Routes
app.use('/api/reports', require('./routes/reports'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/training', require('./routes/training'));
app.use('/api/ai', require('./routes/ai'));

// Root route
app.get('/', (req, res) => {
  res.send('EHS Dashboard API is running');
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));