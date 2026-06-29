const hamburger = document.getElementById("hamburger");
const nav = document.querySelector("nav");
const darkModeBtn = window.document.getElementById('btn-dark-mode')

const overlay = document.createElement("div");
overlay.classList.add("nav-overlay");
document.body.appendChild(overlay);

function toggleMenu() {
  nav.classList.toggle("mobile-open");
  overlay.classList.toggle("active");
  if (nav.classList.contains("mobile-open")) {
     console.log("menu aberto");
    darkModeBtn.innerHTML = '<i class="fa-regular fa-moon"></i> Modo noturno';
    darkModeBtn.style.width = "auto";
  } else {
    darkModeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    darkModeBtn.style.width = "";
  }
}

hamburger.addEventListener("click", toggleMenu);
overlay.addEventListener("click", toggleMenu);

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("mobile-open");
    overlay.classList.remove("active");
  });
});
