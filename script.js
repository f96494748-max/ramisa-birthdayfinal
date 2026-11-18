
/* =================================
   RAMISA BIRTHDAY WEBSITE
   Made & Designed by Tusar
================================= */

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
let blowThreshold = 0.055;

/* =================================
   AUDIO SYSTEM
================================= */

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

/* =================================
   BACKGROUND MUSIC
================================= */

function updateMusicButton() {
  const button = document.getElementById("musicToggle");

  if (!button) return;

  button.textContent = musicPlaying ? "♫" : "♪";
}

function startMusic() {
  if (!bgMusic) return;

  bgMusic.volume = 0.45;

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
  playSound("click");

  if (!bgMusic) return;

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

/* =================================
   PAGE NAVIGATION
================================= */

function showPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages) return;

  currentPage = pageNumber;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const target = document.getElementById("page" + currentPage);

  if (target) {
    target.classList.add("active");
  }

  const counter = document.getElementById("currentPage");

  if (counter) {
    counter.textContent = currentPage;
  }

  const previousButton = document.getElementById("prevBtn");
  const nextButton = document.getElementById("nextBtn");

  if (previousButton) {
    previousButton.style.visibility =
      currentPage === 1 ? "hidden" : "visible";
  }

  if (nextButton) {
    nextButton.style.visibility =
      currentPage === 7 || currentPage === 2
        ? "hidden"
        : "visible";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function nextPage() {
  if (currentPage === 2 && !candleBlown) {
    return;
  }

  playSound("transition");
  showPage(currentPage + 1);
}

function prevPage() {
  playSound("transition");
  showPage(currentPage - 1);
}

/* =================================
   START SURPRISE
================================= */

function startSurprise() {
  playSound("click");

  startMusic();

  showPage(2);

  startMicrophone();
}

/* =================================
   MICROPHONE SYSTEM
================================= */

async function startMicrophone() {
  const blowText = document.getElementById("blowText");

  if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia) {
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
      window.AudioContext ||
      window.webkitAudioContext
    )();

    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(micStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);

    micData = new Uint8Array(analyser.fftSize);

    if (blowText) {
      blowText.textContent = "🎤 এবার মোমবাতির দিকে ফুঁ দাও!";
    }

    detectBlow();

  } catch (error) {
    console.log("Microphone unavailable:", error);
    showManualOption();
  }
}

function showManualOption() {
  const blowText = document.getElementById("blowText");

  if (blowText) {
    blowText.textContent =
      "মাইক্রোফোন কাজ করছে না? এখানে ট্যাপ করো 🕯️";

    blowText.style.cursor = "pointer";

    blowText.onclick = manualBlow;
  }
}

/* =================================
   BLOW DETECTION
================================= */

function detectBlow() {
  if (!analyser || candleBlown) return;

  analyser.getByteTimeDomainData(micData);

  let sum = 0;

  for (let i = 0; i < micData.length; i++) {
    const value = (micData[i] - 128) / 128;
    sum += value * value;
  }

  const rms = Math.sqrt(sum / micData.length);

  if (rms > blowThreshold) {
    blowFrames++;
  } else {
    blowFrames = Math.max(0, blowFrames - 1);
  }

  if (blowFrames >= 7) {
    extinguishCandles();
    return;
  }

  animationFrameId = requestAnimationFrame(detectBlow);
}

/* =================================
   MANUAL BLOW
================================= */

function manualBlow() {
  if (candleBlown) return;

  extinguishCandles();
}

/* =================================
   EXTINGUISH CANDLES
================================= */

function extinguishCandles() {
  if (candleBlown) return;

  candleBlown = true;

  playSound("blow");

  setTimeout(() => {
    playSound("sparkle");
  }, 350);

  document.querySelectorAll(".flame").forEach(flame => {
    flame.classList.add("off");

    const candle = flame.parentElement;

    createSmoke(candle);
  });

  createMagicEffect();

  const blowText = document.getElementById("blowText");
  const wishMessage = document.getElementById("wishMessage");

  if (blowText) {
    blowText.textContent = "ইয়েই! তোমার ইচ্ছাটা পূরণ হোক! 🎉";
    blowText.onclick = null;
  }

  if (wishMessage) {
    wishMessage.classList.remove("hidden");
  }

  const nextButton = document.querySelector("#page2 .next-btn");

  if (nextButton) {
    nextButton.classList.remove("hidden");
  }

  stopMicrophone();
}

/* =================================
   STOP MICROPHONE
================================= */

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
    audioContext = null;
  }

  analyser = null;
  micData = null;
}

/* =================================
   SMOKE EFFECT
================================= */

function createSmoke(candle) {
  for (let i = 0; i < 5; i++) {
    const smoke = document.createElement("span");

    smoke.className = "smoke";

    smoke.style.left = (35 + Math.random() * 30) + "%";
    smoke.style.animationDelay = (i * 0.15) + "s";

    candle.appendChild(smoke);

    setTimeout(() => {
      smoke.remove();
    }, 3000);
  }
}

/* =================================
   MAGIC PARTICLES
================================= */

function createMagicEffect() {
  const cakeArea = document.getElementById("cakeArea");

  if (!cakeArea) return;

  const symbols = ["✨", "💗", "⭐", "🌸", "💕"];

  for (let i = 0; i < 35; i++) {
    const particle = document.createElement("span");

    particle.className = "magic-particle";

    particle.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = (40 + Math.random() * 60) + "%";

    particle.style.animationDelay =
      (Math.random() * 1.2) + "s";

    cakeArea.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 3500);
  }
}

/* =================================
   FLOATING HEARTS
================================= */

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

  setTimeout(() => {
    heart.remove();
  }, 10000);
}

setInterval(createHeart, 700);

/* =================================
   MESSAGE CARDS
================================= */

function openCard(card) {
  playSound("click");

  card.classList.toggle("flipped");
}

/* =================================
   GIFT OPENING
================================= */

function openGift(gift) {
  if (gift.classList.contains("opened")) return;

  playSound("gift");

  gift.classList.add("opened");

  const message = gift.querySelector(".gift-message");

  if (message) {
    message.classList.remove("hidden");
  }

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

    setTimeout(() => {
      particle.remove();
    }, 3000);
  }
}

/* =================================
   INITIAL SETTINGS
================================= */

document.addEventListener("DOMContentLoaded", () => {
  showPage(1);
  updateMusicButton();
});

/* =================================
   END
================================= */
