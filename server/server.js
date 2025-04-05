const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Placeholder for routes
app.use('/api/reports', require('./routes/reports'));
// app.use('/api/auth', require('./routes/auth'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
