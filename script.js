// Resalta el link del menú según la sección visible
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const setActive = () => {
  let current = sections[0] ? sections[0].id : "";
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 120) {
      current = section.id;
    }
  });
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
};

window.addEventListener("scroll", setActive, { passive: true });
setActive();
