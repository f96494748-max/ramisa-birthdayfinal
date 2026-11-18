
"use strict";

/* ==============================
   RAMISA BIRTHDAY WEBSITE
   Complete JavaScript
================================ */

let currentPageNumber = 1;
const totalPages = 7;

let candleBlown = false;
let candleTimer = null;
let windTimer = null;

let musicStarted = false;

const soundFiles = {
  click: "button-click.mp3",
  transition: "page-transition.mp3",
  blow: "candle-blow.mp3",
  sparkle: "sparkle.mp3",
  gift: "gift-open.mp3"
};

/* ==============================
   SOUND EFFECTS
================================ */

function playSound(name) {
  const file = soundFiles[name];

  if (!file) return;

  const audio = new Audio(file);
  audio.volume = 0.65;

  audio.play().catch(() => {});
}

/* ==============================
   BACKGROUND MUSIC
================================ */

function startMusic() {
  const music = document.getElementById("bgMusic");

  if (!music) return;

  music.volume = 0.35;

  music.play()
    .then(() => {
      musicStarted = true;
    })
    .catch(() => {});
}

function toggleMusic() {
  const music = document.getElementById("bgMusic");

  if (!music) return;

  if (music.paused) {
    music.play().catch(() => {});
  } else {
    music.pause();
  }

  playSound("click");
}

/* ==============================
   PAGE NAVIGATION
================================ */

function showPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const selectedPage = document.getElementById("page" + pageNumber);

  if (!selectedPage) return;

  selectedPage.classList.add("active");
  currentPageNumber = pageNumber;

  const counter = document.getElementById("currentPage");

  if (counter) {
    counter.textContent = pageNumber + " / " + totalPages;
  }

  const previousButton = document.getElementById("prevBtn");
  const nextButton = document.getElementById("nextBtn");

  if (previousButton) {
    previousButton.style.display =
      pageNumber === 1 ? "none" : "block";
  }

  if (nextButton) {
    nextButton.style.display =
      pageNumber === 1 ||
      pageNumber === 2 ||
      pageNumber === totalPages
        ? "none"
        : "block";
  }

  if (pageNumber !== 2) {
    clearTimeout(candleTimer);
    clearTimeout(windTimer);
  }
}

function nextPage() {
  if (currentPageNumber >= totalPages) return;

  playSound("transition");
  showPage(currentPageNumber + 1);
}

function prevPage() {
  if (currentPageNumber <= 1) return;

  playSound("transition");
  showPage(currentPageNumber - 1);
}

/* ==============================
   START BIRTHDAY SURPRISE
================================ */

function startSurprise() {
  playSound("click");

  resetCake();
  startMusic();

  showPage(2);

  // মোমবাতি ৫ সেকেন্ড জ্বলবে
  candleTimer = setTimeout(() => {

    if (currentPageNumber !== 2 || candleBlown) return;

    createWindEffect();

    windTimer = setTimeout(() => {
      if (currentPageNumber === 2) {
        extinguishCandles();
      }
    }, 650);

  }, 5000);
}

/* ==============================
   WIND EFFECT
================================ */

function createWindEffect() {
  const cakeArea = document.getElementById("cakeArea");

  if (!cakeArea) return;

  const wind = document.createElement("div");

  wind.textContent = "💨";

  Object.assign(wind.style, {
    position: "absolute",
    left: "-60px",
    top: "30%",
    fontSize: "60px",
    zIndex: "20",
    pointerEvents: "none"
  });

  cakeArea.appendChild(wind);

  wind.animate(
    [
      {
        transform: "translateX(0) scale(.7)",
        opacity: 0
      },
      {
        transform: "translateX(130px) scale(1.2)",
        opacity: 1
      },
      {
        transform: "translateX(300px) scale(1.5)",
        opacity: 0
      }
    ],
    {
      duration: 850,
      easing: "ease-out"
    }
  );

  setTimeout(() => wind.remove(), 900);
}

/* ==============================
   EXTINGUISH CANDLES
================================ */

function extinguishCandles() {
  if (candleBlown) return;

  candleBlown = true;

  playSound("blow");

  setTimeout(() => {
    playSound("sparkle");
  }, 350);

  document.querySelectorAll("#cakeArea .flame").forEach(flame => {
    flame.classList.add("off");
    createSmoke(flame.parentElement);
  });

  createMagicEffect();

  const blowText = document.getElementById("blowText");
  const wishMessage = document.getElementById("wishMessage");
  const nextButton = document.querySelector("#page2 .next-btn");

  if (blowText) {
    blowText.textContent = "ইয়েই! তোমার ইচ্ছাটা পূরণ হোক! 🎉";
  }

  if (wishMessage) {
    wishMessage.classList.remove("hidden");
  }

  if (nextButton) {
    nextButton.classList.remove("hidden");
  }
}

/* ==============================
   SMOKE EFFECT
================================ */

function createSmoke(parent) {
  if (!parent) return;

  const smoke = document.createElement("div");

  smoke.className = "smoke";
  smoke.textContent = "☁";

  parent.appendChild(smoke);

  setTimeout(() => {
    smoke.remove();
  }, 1600);
}

/* ==============================
   MAGIC EFFECT
================================ */

function createMagicEffect() {
  const area = document.getElementById("cakeArea");

  if (!area) return;

  const symbols = ["✨", "💖", "⭐", "💕"];

  for (let i = 0; i < 18; i++) {
    const particle = document.createElement("span");

    particle.className = "magic-particle";
    particle.textContent = symbols[i % symbols.length];

    particle.style.left = Math.random() * 90 + "%";
    particle.style.top = Math.random() * 90 + "%";

    area.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 2100);
  }
}

/* ==============================
   HEART ANIMATION
================================ */

function createHeart() {
  if (document.hidden) return;

  const heart = document.createElement("div");

  heart.className = "heart";
  heart.textContent = "💗";

  heart.style.left = Math.random() * 95 + "vw";
  heart.style.animationDuration =
    4 + Math.random() * 2 + "s";

  document.body.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 6500);
}

/* ==============================
   PAGE 5 - FLIP CARDS
================================ */

function openCard(card) {
  if (!card) return;

  playSound("click");

  card.classList.toggle("flipped");
}

/* ==============================
   PAGE 6 - OPEN GIFTS
================================ */

function openGift(gift) {
  if (!gift) return;

  const message = gift.querySelector(".gift-message");

  if (!message) return;

  const alreadyOpened = gift.classList.contains("opened");

  if (alreadyOpened) return;

  gift.classList.add("opened");

  message.classList.remove("hidden");

  playSound("gift");

  createGiftMagic(gift);
}

/* ==============================
   GIFT SPARKLE EFFECT
================================ */

function createGiftMagic(gift) {
  const symbols = ["✨", "⭐", "💖"];

  for (let i = 0; i < 6; i++) {
    const sparkle = document.createElement("span");

    sparkle.textContent = symbols[i % symbols.length];

    Object.assign(sparkle.style, {
      position: "absolute",
      left: Math.random() * 85 + "%",
      top: Math.random() * 70 + "%",
      pointerEvents: "none",
      fontSize: "20px"
    });

    gift.appendChild(sparkle);

    setTimeout(() => {
      sparkle.remove();
    }, 1300);
  }
}

/* ==============================
   RESET CAKE
================================ */

function resetCake() {
  clearTimeout(candleTimer);
  clearTimeout(windTimer);

  candleBlown = false;

  document.querySelectorAll("#cakeArea .flame").forEach(flame => {
    flame.classList.remove("off");
  });

  document.querySelectorAll(
    "#cakeArea .smoke, #cakeArea .magic-particle"
  ).forEach(element => {
    element.remove();
  });

  const blowText = document.getElementById("blowText");
  const wishMessage = document.getElementById("wishMessage");
  const nextButton = document.querySelector("#page2 .next-btn");

  if (blowText) {
    blowText.textContent = "মোমবাতিগুলো জ্বলছে... 💗";
  }

  if (wishMessage) {
    wishMessage.classList.add("hidden");
  }

  if (nextButton) {
    nextButton.classList.add("hidden");
  }
}

/* ==============================
   WEBSITE INITIALIZATION
================================ */

document.addEventListener("DOMContentLoaded", () => {

  showPage(1);

  // অল্প অল্প করে হার্ট তৈরি হবে
  setInterval(() => {
    if (currentPageNumber === 7) return;

    createHeart();
  }, 3500);

});
