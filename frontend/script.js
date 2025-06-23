let audioQueue = [];
let currentIndex = 0;
let currentAudio = null;
let recentlyPlayed = []; // Keeps history without duplicates
let trendingSongs = [];


// ✅ Load Songs from Backend
// ✅ Attach artist image click inside window.onload
window.onload = function () {
  fetch('http://localhost:5000/api/songs')
    .then(res => res.json())
    .then(allSongs => {
      renderRecentlyPlayed();
      loadTrendingSongs(() => {
        loadNewReleasesFromDB();
      });

      // ✅ Now attach artist image click here (AFTER DOM is ready)
      document.querySelectorAll('.popular-artist-img').forEach(img => {
        img.addEventListener('click', () => {
          const artistName = img.getAttribute('data-artist');
          showArtistOverlay(artistName);  // Call this version only
        });
      });
    })
    .catch(err => console.error("❌ Failed to fetch songs:", err));
};


function loadTrendingSongs(callback) {
  fetch('http://localhost:5000/api/songs/trending')
    .then(res => res.json())
    .then(fetchedTrendingSongs => {
      trendingSongs = fetchedTrendingSongs;

      const trendingContainer = document.getElementById('trending-songs-list');
      trendingContainer.innerHTML = '';

      trendingSongs.forEach(song => {
        const card = document.createElement('div');
        card.classList.add('track-card');
        card.setAttribute('data-title', song.title);
        card.setAttribute('data-artist', song.artist);
        card.setAttribute('data-image', song.imageUrl);
        card.setAttribute('data-audio', `http://localhost:5000${song.audioUrl}`);

        card.innerHTML = `
          <div class="play-overlay play-card-btn"
               data-title="${song.title}"
               data-artist="${song.artist}"
               data-image="${song.imageUrl}"
               data-audio="http://localhost:5000${song.audioUrl}">
            <i class="fas fa-play"></i>
          </div>
          <img src="${song.imageUrl}" alt="${song.title} Cover" class="artist-image" data-artist="${song.artist}">

          <div class="track-info">
            <h4>${song.title}</h4>
            <p>${song.artist}</p>
          </div>
          <div class="track-actions">
            <span class="duration">${song.duration}</span>
          </div>
        `;
        trendingContainer.appendChild(card);
      });

      if (typeof callback === 'function') {
        callback(fetchedTrendingSongs); // ✅ Pass the trending list
      }
    })
    .catch(err => console.error("❌ Failed to load trending songs", err));
}

function loadNewReleasesFromDB() {
  fetch('http://localhost:5000/api/songs/new-releases')
    .then(res => res.json())
    
    .then(newReleases => {
      const container = document.getElementById('new-releases-list');
      const section = document.getElementById('new-releases-section');

      if (!newReleases || newReleases.length === 0) {
        section.style.display = 'none';
        return;
      }

      section.style.display = 'block';
      container.innerHTML = '';

      newReleases.forEach(song => {
        const card = document.createElement('div');
        card.classList.add('track-card');
        card.innerHTML = `
          <img src="${song.imageUrl}" alt="${song.title} Cover">

          <div class="track-info">
            <h4>${song.title}</h4>
            <p>${song.artist}</p>
          </div>
          <div class="track-actions">
            <span class="duration">${song.duration || '--:--'}</span>
            <button class="play-card-btn"
              data-title="${song.title}"
              data-artist="${song.artist}"
              data-image="${song.imageUrl}"
              data-audio="http://localhost:5000${song.audioUrl}">
              <i class="fas fa-play"></i>
            </button>
          </div>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("❌ Failed to load new releases:", err);
    });
}



// ✅ Add song to queue and start playing
document.addEventListener('click', function (e) {
  const playBtn = e.target.closest('.play-card-btn');
  const clickedCard = e.target.closest('.track-card');

  // ✅ If play button is clicked
  if (playBtn) {
    const song = {
      title: playBtn.getAttribute('data-title'),
      artist: playBtn.getAttribute('data-artist'),
      imageUrl: playBtn.getAttribute('data-image'),
      audioUrl: playBtn.getAttribute('data-audio')
    };

    audioQueue = [song];
    currentIndex = 0;
    playSongFromQueue();
    return; // prevent triggering card too
  }

  // ✅ If full card is clicked (but not the button)
  if (clickedCard && !e.target.closest('.play-card-btn')) {
    const song = {
      title: clickedCard.getAttribute('data-title'),
      artist: clickedCard.getAttribute('data-artist'),
      imageUrl: clickedCard.getAttribute('data-image'),
      audioUrl: clickedCard.getAttribute('data-audio')
    };

    audioQueue = [song];
    currentIndex = 0;
    playSongFromQueue();
  }
});


// ✅ Play song from queue
function playSongFromQueue() {
  const song = audioQueue[currentIndex];
  if (!song) return;

  if (currentAudio) currentAudio.pause();
  currentAudio = new Audio(song.audioUrl);
  currentAudio.play();

  updateRecentlyPlayed(song);
  
  const seekBar = document.getElementById('seek-bar');
  const currentTimeText = document.getElementById('current-time');
  const totalTimeText = document.getElementById('total-duration');

  // ✅ Set total duration and reset fill when metadata loads
      currentAudio.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(currentAudio.duration);
      seekBar.max = duration;
      totalTimeText.textContent = formatTime(duration);
      seekBar.value = 0;
      seekBar.style.backgroundSize = `0% 100%`;

      // ✅ Store duration in the song object
      song.duration = formatTime(duration);
  });

  // ✅ Update progress and fill while playing
  currentAudio.ontimeupdate = () => {
    seekBar.value = Math.floor(currentAudio.currentTime);
    currentTimeText.textContent = formatTime(currentAudio.currentTime);

    // 👇 update the green fill
    const percent = (seekBar.value / seekBar.max) * 100;
    seekBar.style.backgroundSize = `${percent}% 100%`;
  };

  console.log('🎧 Now playing:', song.title);

  // 👇 ACTIVATE PLAYER BAR
  const playerBar = document.getElementById('music-player');
  if (playerBar) {
    playerBar.classList.add('active');
    console.log('✅ Player shown');
  }

  // UPDATE UI
  document.getElementById('now-playing-img').src = song.imageUrl;
  document.getElementById('now-playing-title').textContent = song.title.trim();
  document.getElementById('now-playing-artist').textContent = song.artist.trim();

  // Play icon change
  const icon = document.querySelector('.play-toggle i');
  icon.classList.remove('fa-play');
  icon.classList.add('fa-pause');

  // Reset play icon on end
  currentAudio.onended = () => {
  // ✅ Add to recentlyPlayed if not already present
  const songExists = recentlyPlayed.find(
    s => s.title === song.title && s.artist === song.artist
  );
  if (!songExists) {
    recentlyPlayed.unshift(song);
    if (recentlyPlayed.length > 12) recentlyPlayed.pop();
  }

  // ✅ Show Recently Played Section (if hidden)
  const section = document.getElementById('recently-played-section');
  if (section && recentlyPlayed.length > 0) {
    section.style.display = 'block';
  }

  renderRecentlyPlayed(); // 🔁 update the UI

  // Next song (if any)
  const icon = document.querySelector('.play-toggle i');
  icon.classList.remove('fa-pause');
  icon.classList.add('fa-play');

  playerBar.classList.remove('active');

  if (currentIndex < audioQueue.length - 1) {
    currentIndex++;
    playSongFromQueue(); // Autoplay next
    }
  };

}


document.getElementById('seek-bar').addEventListener('input', function () {
  if (currentAudio) {
    currentAudio.currentTime = this.value;
  }
});


function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}


// ✅ Toggle play/pause from player bar
document.querySelector('.play-toggle').addEventListener('click', () => {
  const icon = document.querySelector('.play-toggle i');
  if (!currentAudio) return;

  if (currentAudio.paused) {
    currentAudio.play();
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
  } else {
    currentAudio.pause();
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
  }
});

// ✅ Next / Previous
document.querySelector('.next-btn').addEventListener('click', () => {
  if (currentIndex < audioQueue.length - 1) {
    currentIndex++;
    playSongFromQueue();
  }
});

document.querySelector('.prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    playSongFromQueue();
  }
});


function updateRecentlyPlayed(song) {
  const exists = recentlyPlayed.find(s => s.title === song.title && s.artist === song.artist);
  if (!exists) {
    recentlyPlayed.unshift(song);
    if (recentlyPlayed.length > 12) recentlyPlayed.pop();
  }

  // Show the section when a song has been played
  const container = document.getElementById('recently-played-list');
  container.classList.add('active');

  renderRecentlyPlayed();
}


// ✅ Close overlay when back button is clicked
document.querySelector('.close-overlay').addEventListener('click', () => {
  document.getElementById('artist-overlay').style.display = 'none';
});


function renderRecentlyPlayed() {
  const container = document.getElementById('recently-played-list');
  container.innerHTML = '';

  recentlyPlayed.forEach(song => {
    const card = document.createElement('div');
    card.classList.add('track-card');
    card.innerHTML = `
      <img src="${song.imageUrl}" alt="${song.title} Cover" class="artist-image" data-artist="${song.artist}">

      <div class="track-info">
        <h4>${song.title}</h4>
        <p>${song.artist}</p>
      </div>
      <div class="track-actions">
        <span class="duration">${song.duration || '--:--'}</span>
      </div>
      <div class="card-actions">
        <button class="play-card-btn"
          data-title="${song.title}"
          data-artist="${song.artist}"
          data-image="${song.imageUrl}"
          data-audio="${song.audioUrl}">
          <i class="fas fa-play"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}


function showArtistOverlay(artistName) {
  fetch('http://localhost:5000/api/songs')
    .then(res => res.json())
    .then(songs => {
      const filtered = songs.filter(song => song.artist.toLowerCase() === artistName.toLowerCase());

      const overlay = document.getElementById('artist-overlay');
      const nameField = document.getElementById('artist-overlay-name');
      const list = document.getElementById('artist-song-list');

      nameField.textContent = `Songs by ${artistName}`;
      list.innerHTML = '';

      filtered.forEach(song => {
        const card = document.createElement('div');
        card.classList.add('artist-song-card');
        card.innerHTML = `
          <div class="song-img-wrapper">
            <img src="${song.imageUrl}" alt="${song.title}">
            <div class="overlay-play-button play-card-btn"
              data-title="${song.title}"
              data-artist="${song.artist}"
              data-image="${song.imageUrl}"
              data-audio="http://localhost:5000${song.audioUrl}">
              <i class="fas fa-play"></i>
            </div>
          </div>
          <div class="song-info">
            <h4>${song.title}</h4>
            <p>${song.artist}</p>
          </div>
          <div class="song-duration">${song.duration}</div>
        `;

        list.appendChild(card);
      });

      overlay.style.display = 'flex';
    });
}

