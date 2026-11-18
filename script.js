
let currentPage = 1;
const totalPages = 7;

let candleBlown = false;
let candleTimer = null;

const sounds = {
  click: "button-click.mp3",
  transition: "page-transition.mp3",
  blow: "candle-blow.mp3",
  sparkle: "sparkle.mp3",
  gift: "gift-open.mp3"
};

function playSound(name) {
  const sound = new Audio(sounds[name]);
  sound.volume = 0.7;
  sound.play().catch(() => {});
}

function startMusic() {
  const music = document.getElementById("bgMusic");
  if (music) {
    music.volume = 0.35;
    music.play().catch(() => {});
  }
}

function toggleMusic() {
  const music = document.getElementById("bgMusic");
  if (!music) return;

  if (music.paused) {
    music.play().catch(() => {});
  } else {
    music.pause();
  }
}

function showPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById("page" + pageNumber);
  if (page) page.classList.add("active");

  currentPage = pageNumber;

  const counter = document.getElementById("pageCounter");
  if (counter) {
    counter.textContent = currentPage + " / " + totalPages;
  }

  const nextButton = document.getElementById("nextBtn");
  const prevButton = document.getElementById("prevBtn");

  if (nextButton) {
    nextButton.style.display =
      currentPage === 2 || currentPage === totalPages ? "none" : "block";
  }

  if (prevButton) {
    prevButton.style.display =
      currentPage === 1 ? "none" : "block";
  }
}

function nextPage() {
  if (currentPage < totalPages) {
    playSound("transition");
    showPage(currentPage + 1);
  }
}

function prevPage() {
  if (currentPage > 1) {
    playSound("transition");
    showPage(currentPage - 1);
  }
}

function startSurprise() {
  playSound("click");
  resetCake();
  startMusic();
  showPage(2);

  clearTimeout(candleTimer);

  // ৫ সেকেন্ড মোমবাতি জ্বলবে
  candleTimer = setTimeout(() => {
    if (currentPage === 2 && !candleBlown) {
      createWindEffect();

      setTimeout(() => {
        extinguishCandles();
      }, 650);
    }
  }, 5000);
}

function createWindEffect() {
  const cakeArea = document.getElementById("cakeArea");
  if (!cakeArea) return;

  const wind = document.createElement("div");
  wind.textContent = "💨";
  wind.style.position = "absolute";
  wind.style.left = "-65px";
  wind.style.top = "35%";
  wind.style.fontSize = "65px";
  wind.style.zIndex = "20";
  wind.style.pointerEvents = "none";

  cakeArea.appendChild(wind);

  wind.animate([
    { transform: "translateX(0) scale(.7)", opacity: 0 },
    { transform: "translateX(100px) scale(1.2)", opacity: 1 },
    { transform: "translateX(300px) scale(1.5)", opacity: 0 }
  ], {
    duration: 850,
    easing: "ease-out"
  });

  setTimeout(() => wind.remove(), 900);
}

function extinguishCandles() {
  if (candleBlown) return;

  candleBlown = true;

  playSound("blow");

  setTimeout(() => {
    playSound("sparkle");
  }, 350);

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

  if (wish) wish.classList.remove("hidden");
  if (button) button.classList.remove("hidden");
}

function createSmoke(parent) {
  if (!parent) return;

  const smoke = document.createElement("div");
  smoke.className = "smoke";
  smoke.textContent = "☁";
  parent.appendChild(smoke);

  setTimeout(() => smoke.remove(), 1800);
}

function createMagicEffect() {
  const area = document.getElementById("cakeArea") || document.body;

  for (let i = 0; i < 25; i++) {
    const particle = document.createElement("span");
    particle.className = "magic-particle";
    particle.textContent = ["✨", "💖", "⭐", "💕"][i % 4];

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";

    area.appendChild(particle);

    setTimeout(() => particle.remove(), 2200);
  }
}

function createHeart() {
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.textContent = "💗";
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.animationDuration = (3 + Math.random() * 3) + "s";

  document.body.appendChild(heart);

  setTimeout(() => heart.remove(), 6000);
}

function openCard(card) {
  playSound("click");
  card.classList.toggle("opened");
}

function openGift(gift) {
  if (gift.classList.contains("opened")) return;

  gift.classList.add("opened");
  playSound("gift");

  createGiftMagic(gift);
}

function createGiftMagic(gift) {
  for (let i = 0; i < 12; i++) {
    const sparkle = document.createElement("span");
    sparkle.textContent = "✨";
    sparkle.style.position = "absolute";
    sparkle.style.left = Math.random() * 100 + "%";
    sparkle.style.top = Math.random() * 100 + "%";
    sparkle.style.pointerEvents = "none";

    gift.appendChild(sparkle);

    setTimeout(() => sparkle.remove(), 1500);
  }
}

function resetCake() {
  clearTimeout(candleTimer);
  candleBlown = false;

  document.querySelectorAll(".flame").forEach(flame => {
    flame.classList.remove("off");
  });

  document.querySelectorAll(".smoke, .magic-particle").forEach(item => {
    item.remove();
  });

  const text = document.getElementById("blowText");
  const wish = document.getElementById("wishMessage");
  const button = document.querySelector("#page2 .next-btn");

  if (text) {
    text.textContent = "মোমবাতিগুলো নিভিয়ে দাও! 💨";
  }

  if (wish) wish.classList.add("hidden");
  if (button) button.classList.add("hidden");
}

// পেজ লোড হলে প্রথম পেজ দেখাবে
document.addEventListener("DOMContentLoaded", () => {
  showPage(1);

  setInterval(() => {
    if (currentPage === 7) return;
    createHeart();
  }, 1800);
});
