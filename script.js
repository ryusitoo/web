// Resalta el link del menú según la sección visible
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const setActive = () => {
  let current = "";
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 120 && rect.bottom > 120) {
      current = section.id;
    }
  });
  navLinks.forEach((link) => {
    link.style.color = link.getAttribute("href") === `#${current}` ? "var(--ink)" : "";
  });
};

window.addEventListener("scroll", setActive, { passive: true });
setActive();
