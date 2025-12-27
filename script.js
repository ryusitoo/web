// ICONO MENU NAVBAR
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
}

// SCROLL SECTIONS
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 100;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if(top >= offset && top < offset + height) {
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a[href*=' + id + ']').classList.add('active');
            });
            sec.classList.add('show-animate');
        } else {
            sec.classList.remove('show-animate');
        }
    });

    let header = document.querySelector('header');
    header.classList.toggle('sticky', window.scrollY > 100);

    menuIcon.classList.remove('bx-x');
    navbar.classList.remove('active');

    let footer = document.querySelector('footer');
    footer.classList.toggle('show-animate', this.innerHeight + this.scrollY >= document.scrollingElement.scrollHeight);
}

// TRADUCCIONES
const translations = {
    es: {
        "nav.home": "Inicio",
        "nav.about": "Acerca",
        "nav.skills": "Habilidades",
        "nav.references": "Referencias",
        "nav.contact": "Contacto",
        "home.title": "Hola, soy <span>Ryuu</span>",
        "home.role": "Configurador Profesional",
        "home.desc": "A lo largo de mi trayectoria, he desarrollado una profunda comprensión de la arquitectura de servidores de Minecraft y su ecosistema de plugins. Mis habilidades en lenguajes como Java, Python y Bash —sumadas a mi dominio en configuración YAML— me permiten crear entornos personalizados, estables y altamente optimizados para comunidades exigentes.<br><br>Me especializo en transformar ideas en experiencias de juego únicas mediante plugins personalizados, automatización y ajustes técnicos avanzados.",
        "home.contact-btn": "Contáctame",
        "about.heading": "Acerca <span>de Mí</span>",
        "about.role": "Configurador & Desarrollador",
        "about.desc": "Soy apasionado por la infraestructura técnica detrás de los servidores de Minecraft. Mi enfoque combina precisión técnica, solución creativa de problemas y una alta capacidad de adaptación a las necesidades específicas de cada proyecto.",
        "about.contact-btn": "Escríbeme",
        "skills.heading": "Mis <span>Habilidades</span>",
        "skills.tech-title": "Técnicas",
        "references.heading": "Referencias <span>y Proyectos</span>",
        "references.current": "Actual",
        "references.completed": "Completado",
        "ref.minesplash": "Configuración avanzada de plugins, rangos, eventos y modalidades usando YAML.",
        "ref.rayomc": "Cree plugins de cosméticos y cree una modalidad completa desde cero.",
        "testimonial.iwidayoo": "me gusto mucho el servicio, yo pedí un plugin personalizado de cosméticos, el tiempo de entrega del plugin fue rapido, muy buena atención, en todo momento hizo caso a mis indicaciones, sin duda el mejor 10/10",
        "contact.heading": "Contáctame",
        "contact.info": "<strong>Discord:</strong> <a href='https://discord.gg/2h5TyuCh' target='_blank'>@ryusitoo.</a>",
        "footer.text": "Hecho con 💻 y ♥ por Ryuuu &nbsp; • &nbsp; © 2025"
    },
    en: {
        "nav.home": "Home",
        "nav.about": "About",
        "nav.skills": "Skills",
        "nav.references": "References",
        "nav.contact": "Contact",
        "home.title": "Hi, I'm <span>Ryuu</span>",
        "home.role": "Professional Configurator",
        "home.desc": "Throughout my career, I've developed a deep understanding of Minecraft server architecture and its plugin ecosystem. My skills in languages like Java, Python, and Bash —combined with my mastery of YAML configuration— allow me to create customized, stable, and highly optimized environments for demanding communities.<br><br>I specialize in transforming ideas into unique gaming experiences through custom plugins, automation, and advanced technical adjustments.",
        "home.contact-btn": "Contact Me",
        "about.heading": "About <span>Me</span>",
        "about.role": "Configurator & Developer",
        "about.desc": "I am passionate about the technical infrastructure behind Minecraft servers. My approach combines technical precision, creative problem solving and a high capacity to adapt to the specific needs of each project.",
        "about.contact-btn": "Write to Me",
        "skills.heading": "My <span>Skills</span>",
        "skills.tech-title": "Technical",
        "references.heading": "References <span>& Projects</span>",
        "references.current": "Current",
        "references.completed": "Completed",
        "ref.minesplash": "Advanced configuration of plugins, ranks, events and game modes using YAML.",
        "ref.rayomc": "I created cosmetics plugins and developed a full game mode from scratch.",
        "testimonial.iwidayoo": "I really liked the service, I ordered a custom cosmetics plugin, the delivery time was fast, great attention, 10/10.",
        "contact.heading": "Contact Me",
        "contact.info": "<strong>Discord:</strong> <a href='https://discord.gg/2h5TyuCh' target='_blank'>@ryusitoo.</a>",
        "footer.text": "Made with 💻 and ♥ by Ryuuu &nbsp; • &nbsp; © 2025"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const langOptions = document.querySelectorAll('.lang-option');
    let lang = localStorage.getItem('lang') || 'es';
    
    const updateText = (l) => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[l][key]) el.innerHTML = translations[l][key];
        });
    };

    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            lang = opt.dataset.lang;
            localStorage.setItem('lang', lang);
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            updateText(lang);
        });
    });

    const currentOpt = Array.from(langOptions).find(o => o.dataset.lang === lang);
    if(currentOpt) {
        langOptions.forEach(o => o.classList.remove('active'));
        currentOpt.classList.add('active');
    }
    updateText(lang);
});
