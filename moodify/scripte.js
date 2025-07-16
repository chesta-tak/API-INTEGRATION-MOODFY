const YOUTUBE_API_KEY = "AIzaSyD3WmczifXfpDJJSwOuCQKD7ZC5Gp4m64s";

const moodQueries = {
  happy: "happy upbeat music",
  sad: "sad emotional music",
  energetic: "energetic workout music",
  calm: "calm relaxing music",
  romantic: "romantic love songs",
  devotion: "devotional songs",
  kids: "kids nursery rhymes"
};

const moodButtons = Array.from(document.querySelectorAll('.mood-btn'));
const playlist = document.getElementById('playlist');
const searchInput = document.getElementById('search-input');
const startBtn = document.getElementById('start-btn');
const favoritesSection = document.getElementById('favorites-section');
const favList = document.getElementById('fav-list');
const showFavBtn = document.getElementById('show-favorites-btn');
const favCloseBtn = document.getElementById('fav-close-btn');

const FAVORITES_KEY = 'moodifyFavorites';
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

let currentTracks = [];
let openPlayerIndex = -1;

function setMoodTheme(mood) {
  if (mood && moodQueries[mood]) {
    document.body.dataset.mood = mood;
  } else {
    document.body.removeAttribute('data-mood');
  }
}

function showLoading() {
  playlist.setAttribute('aria-busy', 'true');
  playlist.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const placeholder = document.createElement('div');
    placeholder.className = "track-card";
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.innerHTML = `
      <div style="background:#ddd; height:165px; border-radius:0.75rem 0.75rem 0 0;"></div>
      <div class="track-body">
        <h3 style="background:#ddd; border-radius:0.3rem; width:70%; height:20px; margin-bottom:0.6rem;"></h3>
        <p style="background:#ccc; border-radius:0.3rem; width:50%; height:14px; margin:0;"></p>
        <div style="height:30px;"></div>
      </div>
    `;
    playlist.appendChild(placeholder);
  }
}

function clearLoading() {
  playlist.setAttribute('aria-busy', 'false');
}

async function fetchYouTubeVideos(query) {
  if (!YOUTUBE_API_KEY) {
    alert("Please set your YouTube API Key in the code.");
    return [];
  }
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodedQuery}&key=${YOUTUBE_API_KEY}`;
  try {
    showLoading();
    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube API status: ${response.status}`);
    const data = await response.json();
    clearLoading();
    if (!data.items) return [];
    return data.items.map((item, index) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url,
      index
    }));
  } catch (e) {
    clearLoading();
    console.error("YouTube video fetch error", e);
    alert("Failed to fetch music videos. Check the console for details.");
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function toggleFavorite(video) {
  const index = favorites.findIndex(fav => fav.videoId === video.videoId);
  if (index === -1) {
    favorites.push(video);
  } else {
    favorites.splice(index, 1);
  }
  saveFavorites();
  renderPlaylist(currentTracks);
  renderFavorites();
}

function renderFavorites() {
  favList.innerHTML = '';
  if (favorites.length === 0) {
    favList.innerHTML = `<p style="color: var(--mood-text-secondary); font-style:italic;">You have no favorite songs yet.</p>`;
    return;
  }
  favorites.forEach(video => {
    const div = document.createElement('div');
    div.style.width = '150px';
    div.style.textAlign = 'center';
    div.style.userSelect = 'none';

    div.innerHTML = `
      <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" rel="noopener noreferrer" title="Open ${video.title} on YouTube">
        <img src="${video.thumbnail}" alt="${video.title}" style="width:100%; border-radius: 0.5rem;"/>
      </a>
      <p style="font-size:0.9rem; font-weight:600; margin:0.4rem 0 0 0; color: var(--mood-text-primary);">${video.title}</p>
      <p style="font-size:0.8rem; margin:0; color: var(--mood-text-secondary);">${video.channelTitle}</p>
    `;
    favList.appendChild(div);
  });
  favoritesSection.style.display = 'block';
  favoritesSection.scrollIntoView({behavior: 'smooth'});
}

function togglePlayer(index, videoId) {
  if (openPlayerIndex === index) {
    const openPlayer = document.getElementById(`player-${openPlayerIndex}`);
    if (openPlayer) {
      openPlayer.innerHTML = "";
      openPlayer.classList.remove('visible');
    }
    openPlayerIndex = -1;
  } else {
    if (openPlayerIndex !== -1) {
      const openPlayer = document.getElementById(`player-${openPlayerIndex}`);
      if (openPlayer) {
        openPlayer.innerHTML = "";
        openPlayer.classList.remove('visible');
      }
    }
    const player = document.getElementById(`player-${index}`);
    if (player) {
      player.innerHTML = `<iframe
        src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&controls=1"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        title="YouTube video player"
        ></iframe>`;
      player.classList.add('visible');
    }
    openPlayerIndex = index;
  }
}

function renderPlaylist(tracks) {
  currentTracks = tracks;
  playlist.innerHTML = "";
  if (tracks.length === 0) {
    playlist.innerHTML = `<p style="color: var(--mood-text-secondary); text-align: center; padding: 4rem;">No tracks found. Try a different search or mood.</p>`;
    return;
  }
  tracks.forEach(track => {
    const card = document.createElement('article');
    card.className = "track-card";
    card.tabIndex = 0;
    const isFavorited = favorites.some(fav => fav.videoId === track.videoId);

    card.innerHTML = `
      <img src="${track.thumbnail}" alt="Thumbnail for ${track.title}" loading="lazy" class="track-thumb" />
      <div class="track-body">
        <h3 class="track-title" title="${track.title}">${track.title}</h3>
        <p class="track-channel">${track.channelTitle}</p>
        <div class="action-bar">
          <button class="action-btn like-btn ${isFavorited ? 'liked' : ''}" aria-label="${isFavorited ? 'Unlike' : 'Like'} ${track.title}" aria-pressed="${isFavorited}">
            ♥
          </button>
          <a class="action-btn" href="https://www.youtube.com/watch?v=${track.videoId}" target="_blank" rel="noopener noreferrer" aria-label="Open ${track.title} on YouTube">
            🔗
          </a>
        </div>
        <div class="player-wrapper" aria-label="YouTube player for ${track.title}" id="player-${track.index}"></div>
      </div>
    `;

    card.querySelector('.track-thumb').style.cursor = "pointer";
    card.querySelector('.track-thumb').addEventListener('click', () => {
      togglePlayer(track.index, track.videoId);
    });

    card.querySelector('.like-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(track);
    });

    playlist.appendChild(card);
  });
  openPlayerIndex = -1;
}

async function onMoodSelect(e) {
  const mood = e.currentTarget.getAttribute('data-mood');
  if (!mood) return;
  setMoodTheme(mood);
  moodButtons.forEach(btn => {
    const active = btn.getAttribute('data-mood') === mood;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active.toString());
  });
  searchInput.value = "";
  const tracks = await fetchYouTubeVideos(moodQueries[mood]);
  renderPlaylist(tracks);
  playlist.scrollIntoView({behavior:'smooth'});
  renderFavorites();
}

moodButtons.forEach(button => {
  button.addEventListener('click', async (event) => {
    const selectedMood = button.getAttribute('data-mood') || '';

    console.log(`Mood button clicked: ${selectedMood}`); // DEBUG: Check which mood is selected

    if (selectedMood) {
      setMoodTheme(selectedMood);
    } else {
      document.body.removeAttribute('data-mood');
    }

    moodButtons.forEach(btn => {
      btn.classList.toggle('active', btn === button);
      btn.setAttribute('aria-pressed', btn === button ? 'true' : 'false');
    });

    const searchQuery = moodQueries[selectedMood];

    console.log(`Search query: ${searchQuery}`); // DEBUG: Check the search query

    if (!searchQuery) {
      console.warn(`No search query defined for mood: ${selectedMood}`); // DEBUG: Warn if no query
      playlist.innerHTML = `<p style="color: var(--mood-text-secondary); text-align: center; padding: 4rem;">No tracks found for this mood.</p>`;
      return; // Exit the function if there's no query
    }

    try {
      const tracks = await fetchYouTubeVideos(searchQuery);

      console.log("Fetched tracks:", tracks); // DEBUG: Check the fetched tracks

      renderPlaylist(tracks);
      playlist.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error fetching or rendering videos:", error); // DEBUG: Catch errors
      playlist.innerHTML = `<p style="color: var(--mood-text-secondary); text-align: center; padding: 4rem;">Failed to load tracks. Please check the console for errors.</p>`;
    }
  });
});

async function onSearchKeyDown(e) {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (!query) return;
    setMoodTheme(null);
    moodButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    const tracks = await fetchYouTubeVideos(query);
    renderPlaylist(tracks);
    playlist.scrollIntoView({behavior:'smooth'});
  }
}

searchInput.addEventListener('keydown', onSearchKeyDown);

startBtn.addEventListener('click', () => {
  const happyBtn = moodButtons.find(b => b.getAttribute('data-mood') === "happy");
  happyBtn?.click();
});

showFavBtn.addEventListener('click', () => {
  if (favoritesSection.style.display === 'block') {
    favoritesSection.style.display = 'none';
  } else {
    favoritesSection.style.display = 'block';
    favoritesSection.scrollIntoView({behavior:'smooth'});
  }
});

favCloseBtn.addEventListener('click', () => {
  favoritesSection.style.display = 'none';
});

// Header scroll effect for transparency
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    document.body.classList.add('scroll-header');
  } else {
    document.body.classList.remove('scroll-header');
  }
});

// Prevent default auto scroll if URL has hash on load
window.addEventListener('load', () => {
  if (window.location.hash) {
    window.scrollTo(0, 0);
    history.replaceState(null, null, window.location.pathname);
  }
});

// On page load
window.addEventListener('DOMContentLoaded', () => {
  const happyBtn = moodButtons.find(b => b.getAttribute('data-mood') === "happy");
  happyBtn?.click();
  renderFavorites();
});
