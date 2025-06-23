require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// 👇 Test route to check backend is running
app.get('/', (req, res) => {
  res.send('EchoVerse backend is running 🎶');
});

// 👇 Connect routes
const songRoutes = require('./routes/songs'); // ← this is the new line
app.use('/api/songs', songRoutes);           // ← this is the new line

// 👇 MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 👇 Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
