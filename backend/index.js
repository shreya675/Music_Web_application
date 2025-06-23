require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');           // already present
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ Serve the static frontend files
app.use(express.static(path.join(__dirname, 'frontend'))); 

// Test route
app.get('/ping', (req, res) => {
  res.send('Pong 🏓'); 
});

// Connect routes
const songRoutes = require('./routes/songs'); 
app.use('/api/songs', songRoutes); 

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Catch-all to serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

