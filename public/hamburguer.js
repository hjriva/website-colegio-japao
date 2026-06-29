const hamburger = document.getElementById("hamburger");
const nav = document.querySelector("nav");


const overlay = document.createElement("div");
overlay.classList.add("nav-overlay");
document.body.appendChild(overlay);

function toggleMenu() {
  nav.classList.toggle("mobile-open");
  overlay.classList.toggle("active");
 
}

hamburger.addEventListener("click", toggleMenu);
overlay.addEventListener("click", toggleMenu);

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("mobile-open");
    overlay.classList.remove("active");
  });
});
