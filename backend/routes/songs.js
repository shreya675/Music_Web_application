const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Song = require('../models/song');

// Set up Multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Define where the uploaded files should be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Create a unique filename based on timestamp
  }
});

const upload = multer({ storage: storage });

// GET all songs
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST a new song
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

// 🔥 Get only new releases
router.get('/new-releases', async (req, res) => {
  try {
    const newReleases = await Song.find({ isNewRelease: true });
    res.json(newReleases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Route to return trending songs
router.get('/trending', async (req, res) => {
  try {
    const trendingSongs = await Song.find({ isTrending: true }); // Make sure your schema allows this
    res.json(trendingSongs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/hello', (req, res) => {
  res.send('🔥 Hello from songs.js route');
});

// GET songs by artist name

router.get('/', async (req, res) => {
  const artist = req.query.artist;
  try {
    const songs = artist
      ? await Song.find({ artist: artist })
      : await Song.find();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

