// Playlist data lives in one place so the UI and player stay in sync.
const songs = [
  {
    title: "Sunset Drive",
    artist: "WhatsApp Audio 01",
    file: "audio/sunset-drive.mpeg",
    colors: ["#4f80ff", "#6ee7d3", "#ff8f70"]
  },
  {
    title: "Midnight Echo",
    artist: "WhatsApp Audio 02",
    file: "audio/midnight-echo.mpeg",
    colors: ["#785cff", "#3db4ff", "#67e1b8"]
  },
  {
    title: "City Lights",
    artist: "WhatsApp Audio 03",
    file: "audio/city-lights.mp4",
    colors: ["#ff7b72", "#ffb86b", "#55c7ff"]
  }
];

const audio = document.getElementById("audio");
const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");
const statusText = document.getElementById("statusText");
const currentTimeText = document.getElementById("currentTime");
const totalDurationText = document.getElementById("totalDuration");
const playButton = document.getElementById("playButton");
const playIcon = document.getElementById("playIcon");
const playLabel = document.getElementById("playLabel");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const progressTrack = document.getElementById("progressTrack");
const progressFill = document.getElementById("progressFill");
const progressThumb = document.getElementById("progressThumb");
const volumeControl = document.getElementById("volumeControl");
const volumeValue = document.getElementById("volumeValue");
const playlist = document.getElementById("playlist");
const trackCounter = document.getElementById("trackCounter");
const albumArt = document.getElementById("albumArt");
const artworkInitials = document.getElementById("artworkInitials");

let currentSongIndex = 0;
let isPlaying = false;

function formatTime(timeInSeconds) {
  if (!Number.isFinite(timeInSeconds)) {
    return "0:00";
  }

  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getInitials(title) {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function updatePlayStateUI() {
  playIcon.textContent = isPlaying ? "❚❚" : "▶";
  playLabel.textContent = isPlaying ? "Pause" : "Play";
  statusText.textContent = isPlaying ? "Now playing" : "Paused";
  document.body.classList.toggle("is-playing", isPlaying);
}

function updateProgressUI() {
  const duration = audio.duration || 0;
  const progressPercent = duration ? (audio.currentTime / duration) * 100 : 0;

  progressFill.style.width = `${progressPercent}%`;
  progressThumb.style.left = `${progressPercent}%`;
  progressTrack.setAttribute("aria-valuenow", String(Math.round(progressPercent)));
  currentTimeText.textContent = formatTime(audio.currentTime);
  totalDurationText.textContent = formatTime(duration);
}

function updatePlaylistUI() {
  const buttons = playlist.querySelectorAll("button");

  buttons.forEach((button, index) => {
    button.classList.toggle("active", index === currentSongIndex);
  });

  trackCounter.textContent = `${currentSongIndex + 1} / ${songs.length}`;
}

function loadSong(index) {
  const song = songs[index];

  audio.src = song.file;
  audio.load();

  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  artworkInitials.textContent = getInitials(song.title);

  albumArt.style.setProperty("--art-a", song.colors[0]);
  albumArt.style.setProperty("--art-b", song.colors[1]);
  albumArt.style.setProperty("--art-c", song.colors[2]);

  document.title = `${song.title} | Pulse Player`;

  currentTimeText.textContent = "0:00";
  totalDurationText.textContent = "0:00";
  progressFill.style.width = "0%";
  progressThumb.style.left = "0%";

  updatePlaylistUI();
}

function playSong() {
  audio.play()
    .then(() => {
      isPlaying = true;
      updatePlayStateUI();
    })
    .catch(() => {
      pauseSong();
      statusText.textContent = "Playback blocked by the browser";
    });
}

function pauseSong() {
  audio.pause();
  isPlaying = false;
  updatePlayStateUI();
}

function togglePlayPause() {
  if (isPlaying) {
    pauseSong();
    return;
  }

  playSong();
}

function changeSong(direction, shouldAutoPlay = false) {
  currentSongIndex = (currentSongIndex + direction + songs.length) % songs.length;
  loadSong(currentSongIndex);

  if (shouldAutoPlay) {
    playSong();
  } else {
    pauseSong();
  }
}

function seekToPosition(clientX) {
  const rect = progressTrack.getBoundingClientRect();
  const clickPosition = clientX - rect.left;
  const progressPercent = Math.min(Math.max(clickPosition / rect.width, 0), 1);

  if (audio.duration) {
    audio.currentTime = progressPercent * audio.duration;
    updateProgressUI();
  }
}

function renderPlaylist() {
  playlist.innerHTML = songs
    .map((song, index) => {
      const itemNumber = String(index + 1).padStart(2, "0");

      return `
        <li class="playlist-item">
          <button type="button" data-index="${index}">
            <span class="track-number">${itemNumber}</span>
            <span class="track-details">
              <strong>${song.title}</strong>
              <small>${song.artist}</small>
            </span>
            <span class="track-tag">Track</span>
          </button>
        </li>
      `;
    })
    .join("");
}

playButton.addEventListener("click", togglePlayPause);
prevButton.addEventListener("click", () => changeSong(-1, isPlaying));
nextButton.addEventListener("click", () => changeSong(1, isPlaying));

audio.addEventListener("timeupdate", updateProgressUI);
audio.addEventListener("loadedmetadata", updateProgressUI);
audio.addEventListener("ended", () => changeSong(1, true));
audio.addEventListener("pause", () => {
  isPlaying = false;
  updatePlayStateUI();
});
audio.addEventListener("play", () => {
  isPlaying = true;
  updatePlayStateUI();
});
audio.addEventListener("error", () => {
  statusText.textContent = "This track could not be loaded";
});

progressTrack.addEventListener("click", (event) => {
  seekToPosition(event.clientX);
});

progressTrack.addEventListener("keydown", (event) => {
  if (!audio.duration) {
    return;
  }

  const seekStep = 5;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    audio.currentTime = Math.min(audio.currentTime + seekStep, audio.duration);
    updateProgressUI();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    audio.currentTime = Math.max(audio.currentTime - seekStep, 0);
    updateProgressUI();
  }
});

playlist.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");

  if (!button) {
    return;
  }

  currentSongIndex = Number(button.dataset.index);
  loadSong(currentSongIndex);
  playSong();
});

volumeControl.addEventListener("input", () => {
  const volume = Number(volumeControl.value);
  audio.volume = volume;
  volumeValue.textContent = `${Math.round(volume * 100)}%`;
});

renderPlaylist();
audio.volume = Number(volumeControl.value);
loadSong(currentSongIndex);
updatePlayStateUI();
