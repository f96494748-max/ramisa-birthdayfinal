
/* RAMISA BIRTHDAY WEBSITE
   Made & Designed by Tusar
*/

let currentPage = 1;
const totalPages = 7;

let candleBlown = false;
let musicPlaying = false;

let micStream = null;
let audioContext = null;
let analyser = null;
let micData = null;
let animationFrameId = null;

let blowFrames = 0;
let blowThreshold = 0.035;
let ambientLevel = 0;
let isCalibrating = false;

/* AUDIO */

const sounds = {
  click: new Audio("button-click.mp3"),
  transition: new Audio("page-transition.mp3"),
  sparkle: new Audio("sparkle.mp3"),
  blow: new Audio("candle-blow.mp3"),
  gift: new Audio("gift-open.mp3")
};

const bgMusic = document.getElementById("bgMusic");

Object.values(sounds).forEach(sound => {
  sound.preload = "auto";
});

function playSound(name) {
  const sound = sounds[name];
  if (!sound) return;

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

/* BACKGROUND MUSIC */

function updateMusicButton() {
  const button = document.getElementById("musicToggle");
  if (button) button.textContent = musicPlaying ? "♫" : "♪";
}

function startMusic() {
  if (!bgMusic) return;

  bgMusic.volume = 0.45;

  bgMusic.play().then(() => {
    musicPlaying = true;
    updateMusicButton();
  }).catch(() => {
    musicPlaying = false;
    updateMusicButton();
  });
}

function toggleMusic() {
  playSound("click");

  if (bgMusic.paused) {
    startMusic();
  } else {
    bgMusic.pause();
    musicPlaying = false;
    updateMusicButton();
  }
}

document.getElementById("musicToggle")
  ?.addEventListener("click", toggleMusic);

/* PAGE NAVIGATION */

function showPage(number) {
  if (number < 1 || number > totalPages) return;

  currentPage = number;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById("page" + number)
    ?.classList.add("active");

  const counter = document.getElementById("currentPage");
  if (counter) counter.textContent = number;

  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");

  if (prev) {
    prev.style.visibility = number === 1 ? "hidden" : "visible";
  }

  if (next) {
    next.style.visibility =
      number === 7 || number === 2 ? "hidden" : "visible";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function nextPage() {
  if (currentPage === 2 && !candleBlown) return;

  playSound("transition");
  showPage(currentPage + 1);
}

function prevPage() {
  playSound("transition");
  showPage(currentPage - 1);
}

/* RESET CAKE */

function resetCake() {
  candleBlown = false;
  blowFrames = 0;

  document.querySelectorAll(".flame").forEach(flame => {
    flame.classList.remove("off");
  });

  document.querySelectorAll(".smoke, .magic-particle").forEach(item => {
    item.remove();
  });

  document.getElementById("wishMessage")
    ?.classList.add("hidden");

  document.querySelector("#page2 .next-btn")
    ?.classList.add("hidden");

  const text = document.getElementById("blowText");

  if (text) {
    text.textContent = "🎤 মাইক্রোফোনে ফুঁ দাও";
    text.style.cursor = "default";
    text.onclick = null;
  }
}

/* START SURPRISE */

function startSurprise() {
  playSound("click");

  resetCake();
  startMusic();
  showPage(2);
  startMicrophone();
}

/* MICROPHONE */

async function startMicrophone() {
  const text = document.getElementById("blowText");

  if (!navigator.mediaDevices?.getUserMedia) {
    showManualOption();
    return;
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(micStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);

    micData = new Uint8Array(analyser.fftSize);

    if (text) {
      text.textContent = "🎤 মাইক্রোফোন প্রস্তুত হচ্ছে...";
    }

    calibrateMicrophone();

  } catch (error) {
    console.log("Microphone error:", error);
    showManualOption();
  }
}

/* MEASURE AMBIENT SOUND */

function getMicrophoneVolume() {
  analyser.getByteTimeDomainData(micData);

  let sum = 0;

  for (let i = 0; i < micData.length; i++) {
    const value = (micData[i] - 128) / 128;
    sum += value * value;
  }

  return Math.sqrt(sum / micData.length);
}

/* CALIBRATION */

function calibrateMicrophone() {
  if (!analyser || candleBlown) return;

  isCalibrating = true;

  const samples = [];
  const startTime = performance.now();

  function measure() {
    if (!analyser || candleBlown) return;

    samples.push(getMicrophoneVolume());

    if (performance.now() - startTime < 1500) {
      animationFrameId = requestAnimationFrame(measure);
      return;
    }

    samples.sort((a, b) => a - b);

    ambientLevel =
      samples[Math.floor(samples.length * 0.75)] || 0;

    // Ambient noise থেকে অনেক বেশি শব্দ প্রয়োজন
    blowThreshold = Math.min(
  0.09,
  Math.max(0.025, ambientLevel * 1.8)
);

    isCalibrating = false;

    const text = document.getElementById("blowText");

    if (text) {
      text.textContent = "🎤 এবার মোমবাতির দিকে ফুঁ দাও!";
    }

    blowFrames = 0;
    detectBlow();
  }

  measure();
}

/* BLOW DETECTION */

function detectBlow() {
  if (!analyser || candleBlown || isCalibrating) return;

  const volume = getMicrophoneVolume();

  if (volume > blowThreshold) {
    blowFrames++;
  } else {
    blowFrames = Math.max(0, blowFrames - 2);
  }

  // প্রায় ০.২৫ সেকেন্ড জোরে শব্দ থাকতে হবে
  if (blowFrames >= 8) {
    extinguishCandles();
    return;
  }

  animationFrameId = requestAnimationFrame(detectBlow);
}

/* MANUAL OPTION */

function showManualOption() {
  const text = document.getElementById("blowText");

  if (text) {
    text.textContent =
      "মাইক্রোফোন কাজ করছে না? এখানে ট্যাপ করো 🕯️";

    text.style.cursor = "pointer";
    text.onclick = manualBlow;
  }
}

function manualBlow() {
  if (!candleBlown) extinguishCandles();
}

/* EXTINGUISH CANDLES */

function extinguishCandles() {
  if (candleBlown) return;

  candleBlown = true;

  stopMicrophone();

  playSound("blow");

  setTimeout(() => playSound("sparkle"), 350);

  document.querySelectorAll(".flame").forEach(flame => {
    flame.classList.add("off");
    createSmoke(flame.parentElement);
  });

  createMagicEffect();

  const text = document.getElementById("blowText");
  const wish = document.getElementById("wishMessage");
  const button = document.querySelector("#page2 .next-btn");

  if (text) {
    text.textContent = "ইয়েই! তোমার ইচ্ছাটা পূরণ হোক! 🎉";
    text.onclick = null;
  }

  wish?.classList.remove("hidden");
  button?.classList.remove("hidden");
}

/* STOP MICROPHONE */

function stopMicrophone() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }

  audioContext = null;
  analyser = null;
  micData = null;
}

/* SMOKE */

function createSmoke(candle) {
  for (let i = 0; i < 5; i++) {
    const smoke = document.createElement("span");

    smoke.className = "smoke";
    smoke.style.left = (35 + Math.random() * 30) + "%";
    smoke.style.animationDelay = (i * 0.15) + "s";

    candle.appendChild(smoke);

    setTimeout(() => smoke.remove(), 3000);
  }
}

/* MAGIC EFFECT */

function createMagicEffect() {
  const area = document.getElementById("cakeArea");
  if (!area) return;

  const symbols = ["✨", "💗", "⭐", "🌸", "💕"];

  for (let i = 0; i < 35; i++) {
    const particle = document.createElement("span");

    particle.className = "magic-particle";
    particle.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = (40 + Math.random() * 60) + "%";
    particle.style.animationDelay = Math.random() + "s";

    area.appendChild(particle);

    setTimeout(() => particle.remove(), 3500);
  }
}

/* FLOATING HEARTS */

function createHeart() {
  const container = document.getElementById("hearts");
  if (!container) return;

  const heart = document.createElement("span");

  heart.className = "heart";
  heart.textContent = "♥";
  heart.style.left = Math.random() * 100 + "%";
  heart.style.fontSize = (12 + Math.random() * 18) + "px";
  heart.style.animationDuration = (5 + Math.random() * 5) + "s";

  container.appendChild(heart);

  setTimeout(() => heart.remove(), 10000);
}

setInterval(createHeart, 700);

/* MESSAGE CARDS */

function openCard(card) {
  playSound("click");
  card.classList.toggle("flipped");
}

/* GIFTS */

function openGift(gift) {
  if (gift.classList.contains("opened")) return;

  playSound("gift");
  gift.classList.add("opened");

  gift.querySelector(".gift-message")
    ?.classList.remove("hidden");

  createGiftMagic(gift);
}

function createGiftMagic(gift) {
  const symbols = ["✨", "💗", "⭐", "💕"];

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement("span");

    particle.className = "magic-particle";
    particle.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";

    gift.appendChild(particle);

    setTimeout(() => particle.remove(), 3000);
  }
}

/* INITIAL SETTINGS */

document.addEventListener("DOMContentLoaded", () => {
  resetCake();
  showPage(1);
  updateMusicButton();
});
