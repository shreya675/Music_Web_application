const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Song = require('../models/song');

// Set up Multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// ✅ GET all songs or filter by artist
router.get('/', async (req, res) => {
  const { artist } = req.query;
  try {
    const songs = artist ? await Song.find({ artist }) : await Song.find();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ POST a new song
router.post('/', upload.single('audio'), async (req, res) => {
  const { title, artist, duration, imageUrl } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No audio file uploaded' });
  }

  const newSong = new Song({
    title,
    artist,
    duration,
    imageUrl,
    audioUrl: `/uploads/${req.file.filename}`
  });

  try {
    const savedSong = await newSong.save();
    res.status(201).json(savedSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// ✅ Get new releases
router.get('/new-releases', async (req, res) => {
  try {
    const newReleases = await Song.find({ isNewRelease: true });
    res.json(newReleases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Get trending songs
router.get('/trending', async (req, res) => {
  try {
    const trendingSongs = await Song.find({ isTrending: true });
    res.json(trendingSongs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Test route
router.get('/hello', (req, res) => {
  res.send('🔥 Hello from songs.js route');
});

module.exports = router;

