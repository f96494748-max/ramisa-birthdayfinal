/* ==========================================
   RAMISA BIRTHDAY WEBSITE
   Complete JavaScript
========================================== */

"use strict";

// ==========================================
// 1. GLOBAL SETTINGS
// ==========================================

let currentPage = 1;
const totalPages = 7;

let musicPlaying = false;
let candleBlown = false;

let micStream = null;
let micContext = null;
let analyser = null;
let micData = null;

let blowDetectionActive = false;
let blowFrames = 0;
let animationFrameId = null;

let ambientLevel = 0;
let blowThreshold = 0.055;

const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");


// ==========================================
// 2. AUDIO SYSTEM
// ==========================================

function playSound(file, volume = 0.4) {
  try {
    const audio = new Audio(file);
    audio.volume = volume;

    audio.play().catch(() => {});
    return audio;
  } catch (error) {
    console.warn("Audio error:", error);
  }
}

function buttonSound() {
  playSound("assets/audio/button-click.mp3", 0.35);
}

function pageSound() {
  playSound("assets/audio/page-transition.mp3", 0.3);
}

function sparkleSound() {
  playSound("assets/audio/sparkle.mp3", 0.45);
}


// ==========================================
// 3. BACKGROUND MUSIC
// ==========================================

function startMusic() {
  if (!bgMusic) return;

  bgMusic.volume = 0.25;

  bgMusic.play()
    .then(() => {
      musicPlaying = true;
      updateMusicButton();
    })
    .catch(() => {
      musicPlaying = false;
      updateMusicButton();
    });
}

function toggleMusic() {
  if (!bgMusic) return;

  buttonSound();

  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
  } else {
    bgMusic.play()
      .then(() => {
        musicPlaying = true;
        updateMusicButton();
      })
      .catch(() => {
        musicPlaying = false;
        updateMusicButton();
      });
  }

  updateMusicButton();
}

function updateMusicButton() {
  if (!musicToggle) return;

  musicToggle.textContent = musicPlaying ? "♫" : "♪";
}

if (musicToggle) {
  musicToggle.addEventListener("click", toggleMusic);
}


// ==========================================
// 4. PAGE NAVIGATION
// ==========================================

function showPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages) return;

  const oldPage = document.getElementById(`page${currentPage}`);
  const newPage = document.getElementById(`page${pageNumber}`);

  if (!newPage) return;

  if (oldPage) {
    oldPage.classList.remove("active");
  }

  newPage.classList.remove("active");

  // Restart page animation
  void newPage.offsetWidth;

  newPage.classList.add("active");

  currentPage = pageNumber;

  updatePageCounter();
  updateNavigation();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function nextPage() {
  if (currentPage >= totalPages) return;

  buttonSound();
  pageSound();

  showPage(currentPage + 1);
}

function prevPage() {
  if (currentPage <= 1) return;

  buttonSound();
  pageSound();

  showPage(currentPage - 1);
}

function updatePageCounter() {
  const counter = document.getElementById("currentPage");

  if (counter) {
    counter.textContent = currentPage;
  }
}

function updateNavigation() {
  const previous = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");

  if (previous) {
    previous.style.opacity = currentPage === 1 ? "0.35" : "1";
  }

  if (next) {
    next.style.opacity = currentPage === totalPages ? "0.35" : "1";
  }
}


// ==========================================
// 5. START WEBSITE
// ==========================================

async function startSurprise() {
  buttonSound();

  startMusic();

  showPage(2);

  await startMicrophone();
}


// ==========================================
// 6. MICROPHONE START
// ==========================================

async function startMicrophone() {
  if (blowDetectionActive || candleBlown) return;

  const blowText = document.getElementById("blowText");

  try {
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone is not supported.");
    }

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    micContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    await micContext.resume();

    const source = micContext.createMediaStreamSource(micStream);

    analyser = micContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.15;

    source.connect(analyser);

    micData = new Uint8Array(analyser.fftSize);

    blowDetectionActive = true;
    blowFrames = 0;

    if (blowText) {
      blowText.textContent = "🎤 Microphone ready — blow at the candles!";
      blowText.onclick = manualBlow;
      blowText.style.cursor = "pointer";
    }

    // Measure background noise before detecting blow
    await calibrateMicrophone();

    detectBlow();

  } catch (error) {
    console.error("Microphone setup failed:", error);
    microphoneFallback();
  }
}


// ==========================================
// 7. MICROPHONE CALIBRATION
// ==========================================

async function calibrateMicrophone() {
  if (!analyser || !micData) return;

  const samples = [];
  const startTime = performance.now();

  while (performance.now() - startTime < 900) {
    analyser.getByteTimeDomainData(micData);

    const level = calculateVolume();

    samples.push(level);

    await new Promise(resolve => setTimeout(resolve, 35));
  }

  if (samples.length > 0) {
    ambientLevel = Math.max(...samples);

    // Adjust sensitivity according to ambient sound
    blowThreshold = Math.max(
      0.045,
      Math.min(0.13, ambientLevel * 2.5 + 0.035)
    );
  }

  console.log("Ambient level:", ambientLevel);
  console.log("Blow threshold:", blowThreshold);
}


// ==========================================
// 8. CALCULATE MICROPHONE VOLUME
// ==========================================

function calculateVolume() {
  if (!analyser || !micData) return 0;

  let sum = 0;

  for (let i = 0; i < micData.length; i++) {
    const value = (micData[i] - 128) / 128;
    sum += value * value;
  }

  return Math.sqrt(sum / micData.length);
}


// ==========================================
// 9. BLOW DETECTION
// ==========================================

function detectBlow() {
  if (!blowDetectionActive || candleBlown || !analyser) {
    return;
  }

  analyser.getByteTimeDomainData(micData);

  const volume = calculateVolume();

  // Detect strong airflow/noise
  if (volume > blowThreshold) {
    blowFrames++;
  } else {
    blowFrames = Math.max(0, blowFrames - 2);
  }

  // Require sustained sound
  if (blowFrames >= 8) {
    extinguishCandles();
    return;
  }

  animationFrameId = requestAnimationFrame(detectBlow);
}


// ==========================================
// 10. MANUAL CANDLE BLOW
// ==========================================

function manualBlow() {
  if (candleBlown) return;

  extinguishCandles();
}


// ==========================================
// 11. MICROPHONE FALLBACK
// ==========================================

function microphoneFallback() {
  const text = document.getElementById("blowText");

  if (text) {
    text.innerHTML =
      "মাইক্রোফোন কাজ করছে না? এখানে ট্যাপ করে মোমবাতিগুলো নিভিয়ে দাও 🕯️";

    text.onclick = manualBlow;
    text.style.cursor = "pointer";
  }

  // Always allow tap as a backup
  if (text) {
    text.onclick = manualBlow;
  }
}


// ==========================================
// 12. EXTINGUISH CANDLES
// ==========================================

function extinguishCandles() {
  if (candleBlown) return;

  candleBlown = true;
  blowDetectionActive = false;

  stopMicrophone();

  const cakeArea = document.getElementById("cakeArea");
  const blowText = document.getElementById("blowText");
  const wishMessage = document.getElementById("wishMessage");
  const nextButton = document.querySelector("#page2 .next-btn");

  // Candle animation
  if (cakeArea) {
    cakeArea.classList.add("blown");
  }

  // Blow sound
  playSound("assets/audio/candle-blow.mp3", 0.65);

  // Candle extinguish sound
  setTimeout(() => {
    playSound("assets/audio/candle-extinguish.mp3", 0.6);
  }, 250);

  // Magic effect
  setTimeout(() => {
    createSmoke();
    createMagicEffect();
    sparkleSound();
  }, 450);

  // Hide instruction
  if (blowText) {
    blowText.style.opacity = "0";

    setTimeout(() => {
      blowText.classList.add("hidden");
    }, 400);
  }

  // Reveal message
  setTimeout(() => {
    if (wishMessage) {
      wishMessage.classList.remove("hidden");
    }

    if (nextButton) {
      nextButton.classList.remove("hidden");
    }

    createFloatingHearts(25);
  }, 1000);
}


// ==========================================
// 13. STOP MICROPHONE
// ==========================================

function stopMicrophone() {
  blowDetectionActive = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  if (micContext) {
    micContext.close().catch(() => {});
    micContext = null;
  }

  analyser = null;
  micData = null;
}


// ==========================================
// 14. SMOKE EFFECT
// ==========================================

function createSmoke() {
  const cakeArea = document.getElementById("cakeArea");

  if (!cakeArea) return;

  const candles = cakeArea.querySelectorAll(".candle");

  candles.forEach((candle, index) => {
    const smoke = document.createElement("span");

    smoke.className = "smoke";
    smoke.style.animationDelay = `${index * 0.15}s`;

    candle.appendChild(smoke);

    setTimeout(() => smoke.remove(), 2500);
  });
}


// ==========================================
// 15. MAGIC PARTICLES
// ==========================================

function createMagicEffect() {
  const cakeArea = document.getElementById("cakeArea");

  if (!cakeArea) return;

  const symbols = ["✨", "💗", "♡", "✦", "🌸"];

  for (let i = 0; i < 35; i++) {
    const particle = document.createElement("span");

    particle.className = "magic-particle";

    particle.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 0.7 + "s";

    cakeArea.appendChild(particle);

    setTimeout(() => particle.remove(), 3000);
  }
}


// ==========================================
// 16. FLOATING HEARTS
// ==========================================

function createFloatingHearts(amount = 1) {
  const container = document.getElementById("hearts");

  if (!container) return;

  const symbols = ["♡", "♥", "💗", "💕"];

  for (let i = 0; i < amount; i++) {
    const heart = document.createElement("span");

    heart.className = "heart";

    heart.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    heart.style.left = Math.random() * 100 + "%";
    heart.style.fontSize = (12 + Math.random() * 22) + "px";
    heart.style.animationDuration = (5 + Math.random() * 5) + "s";

    container.appendChild(heart);

    setTimeout(() => heart.remove(), 10000);
  }
}


// ==========================================
// 17. MESSAGE CARDS
// ==========================================

function openCard(card) {
  buttonSound();
  card.classList.toggle("open");
}


// ==========================================
// 18. GIFTS
// ==========================================

function openGift(gift) {
  if (gift.classList.contains("opened")) return;

  buttonSound();

  gift.classList.add("opened");

  const message = gift.querySelector(".gift-message");

  if (message) {
    message.classList.remove("hidden");
  }

  gift.style.transform = "scale(1.05)";

  sparkleSound();
  createFloatingHearts(8);
}


// ==========================================
// 19. HEART ANIMATION LOOP
// ==========================================

setInterval(() => {
  createFloatingHearts(1);
}, 3000);


// ==========================================
// 20. INITIALIZE WEBSITE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  currentPage = 1;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const firstPage = document.getElementById("page1");

  if (firstPage) {
    firstPage.classList.add("active");
  }

  updatePageCounter();
  updateNavigation();
});


// ==========================================
// END
// =====================================Microphone