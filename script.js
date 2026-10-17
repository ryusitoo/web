/* =========================================================
   Ryuuu — portafolio · interacciones y animaciones
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- capas compartidas ---------- */
  function injectLayers() {
    const add = (html) => document.body.insertAdjacentHTML("afterbegin", html);
    add('<div class="page-curtain" aria-hidden="true"></div>');
    add('<div class="scroll-progress" aria-hidden="true"></div>');
    add('<div class="cursor-glow" aria-hidden="true"></div>');
    add('<canvas id="bg-canvas" aria-hidden="true"></canvas>');
    add('<div class="grid-overlay" aria-hidden="true"></div>');
    document.body.insertAdjacentHTML("beforeend", '<div class="toast" role="status" aria-live="polite"></div>');
  }

  /* ---------- preloader ---------- */
  function preloader() {
    const el = $(".preloader");
    if (!el) return Promise.resolve();
    let seen = false;
    try { seen = sessionStorage.getItem("ryu-intro") === "1"; } catch (e) {}
    if (seen || reduceMotion) { el.remove(); return Promise.resolve(); }
    try { sessionStorage.setItem("ryu-intro", "1"); } catch (e) {}
    return new Promise((res) => {
      setTimeout(() => {
        el.classList.add("done");
        setTimeout(() => el.remove(), 700);
        res();
      }, 1300);
    });
  }

  /* ---------- fondo: red de partículas ---------- */
  function particles() {
    const canvas = $("#bg-canvas");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const colors = ["73,198,229", "78,127,255", "155,107,255"];
    let w, h, pts = [], raf;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 130;

    function resize() {
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const count = Math.min(90, Math.floor((innerWidth * innerHeight) / 17000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .25 * dpr,
        vy: (Math.random() - .5) * .25 * dpr,
        r: (Math.random() * 1.4 + .6) * dpr,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const link = LINK * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        // repulsión suave del cursor
        const dxm = p.x - mouse.x, dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 140 * dpr && dm > 0) {
          p.x += (dxm / dm) * .9;
          p.y += (dym / dm) * .9;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},.75)`;
        ctx.fill();

        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(${p.c},${(1 - d / link) * .18})`;
            ctx.lineWidth = dpr * .8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (dm < link * 1.4) {
          ctx.strokeStyle = `rgba(73,198,229,${(1 - dm / (link * 1.4)) * .35})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    addEventListener("pointermove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
    document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf); else frame();
    });
  }

  /* ---------- glow que sigue al cursor ---------- */
  function cursorGlow() {
    const g = $(".cursor-glow");
    if (!g || !finePointer || reduceMotion) return;
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      document.body.classList.add("has-pointer");
    });
    (function loop() {
      x += (tx - x) * .12; y += (ty - y) * .12;
      g.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- nav ---------- */
  function nav() {
    const navEl = $(".nav");
    const bar = $(".scroll-progress");
    const onScroll = () => {
      const st = scrollY;
      navEl && navEl.classList.toggle("scrolled", st > 10);
      if (bar) {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? st / max : 0})`;
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // indicador deslizante
    const links = $(".nav-links");
    const ind = $(".nav-indicator");
    if (links && ind) {
      const active = $("a.active", links);
      const moveTo = (a) => {
        if (!a) { ind.style.opacity = 0; return; }
        ind.style.opacity = 1;
        ind.style.width = a.offsetWidth + "px";
        ind.style.transform = `translateX(${a.offsetLeft}px)`;
      };
      // posición inicial sin animación (así la transición entre páginas la desliza)
      ind.style.transition = "none";
      moveTo(active);
      requestAnimationFrame(() => requestAnimationFrame(() => { ind.style.transition = ""; }));
      $$("a", links).forEach((a) => a.addEventListener("mouseenter", () => moveTo(a)));
      links.addEventListener("mouseleave", () => moveTo(active));
      addEventListener("resize", () => moveTo(active));
      document.fonts && document.fonts.ready.then(() => moveTo(active));
    }

    // menú móvil
    const toggle = $(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = document.body.classList.toggle("menu-open");
        toggle.setAttribute("aria-expanded", open);
      });
      $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
    }
  }

  /* ---------- dividir títulos en palabras ---------- */
  function splitText() {
    $$(".split").forEach((el) => {
      let i = 0;
      const frag = document.createDocumentFragment();
      const wrap = (node) => {
        const w = document.createElement("span");
        w.className = "w";
        const inner = document.createElement("span");
        inner.style.setProperty("--i", i++);
        inner.appendChild(node);
        w.appendChild(inner);
        return w;
      };
      [...el.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
            else frag.appendChild(wrap(document.createTextNode(part)));
          });
        } else {
          frag.appendChild(wrap(n.cloneNode(true)));
        }
      });
      el.textContent = "";
      el.appendChild(frag);
    });
  }

  /* ---------- aparición al hacer scroll ---------- */
  function reveals() {
    $$("[data-stagger]").forEach((parent) => {
      const step = parseFloat(parent.dataset.stagger) || .1;
      [...parent.children].forEach((c, i) => {
        c.classList.add("reveal");
        c.style.setProperty("--d", `${i * step}s`);
      });
    });
    const targets = $$(".reveal, .split, .stat, .process, .tl-item, [data-count], .terminal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      targets.forEach((t) => { t.classList.add("in"); t.dispatchEvent(new Event("inview")); });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          e.target.dispatchEvent(new Event("inview"));
          io.unobserve(e.target);
        }
      });
    }, { threshold: .15, rootMargin: "0px 0px -40px 0px" });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- máquina de escribir ---------- */
  function typewriter() {
    const el = $(".typed");
    if (!el) return;
    const words = JSON.parse(el.dataset.words || "[]");
    if (!words.length) return;
    if (reduceMotion) { el.textContent = words[0]; return; }
    let wi = 0, ci = 0, del = false;
    (function tick() {
      const word = words[wi];
      el.textContent = word.slice(0, ci);
      let delay = del ? 35 : 70;
      if (!del && ci === word.length) { del = true; delay = 1800; }
      else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; delay = 350; }
      ci += del ? -1 : 1;
      setTimeout(tick, delay);
    })();
  }

  /* ---------- contadores ---------- */
  function counters() {
    $$("[data-count]").forEach((el) => {
      el.addEventListener("inview", () => {
        const end = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const prefix = el.dataset.prefix || "";
        if (reduceMotion) { el.textContent = prefix + end + suffix; return; }
        const dur = 1600;
        const t0 = performance.now();
        (function step(t) {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = prefix + Math.round(end * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, { once: true });
    });
  }

  /* ---------- terminal YAML ---------- */
  function terminal() {
    const term = $(".terminal");
    const body = $(".term-body", term || document);
    const src = $("#term-src");
    if (!term || !body || !src) return;
    // formato del template: cada línea "clase|texto" separada por ¦
    const lines = (src.content || src).textContent.trim().split("\n").map((line) =>
      line.split("¦").map((seg) => {
        const k = seg.indexOf("|");
        return { c: seg.slice(0, k), t: seg.slice(k + 1) };
      })
    );
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const render = (upto) => {
      let left = upto, html = "";
      for (const line of lines) {
        for (const seg of line) {
          if (left <= 0) break;
          const part = seg.t.slice(0, left);
          left -= part.length;
          html += seg.c ? `<span class="${seg.c}">${esc(part)}</span>` : esc(part);
        }
        if (left <= 0) break;
        html += "\n";
        left -= 1;
      }
      return html;
    };
    const total = lines.reduce((a, l) => a + l.reduce((b, s) => b + s.t.length, 0) + 1, 0);
    if (reduceMotion) { body.innerHTML = render(total); return; }
    term.addEventListener("inview", () => {
      let n = 0;
      (function tick() {
        n += 2;
        body.innerHTML = render(n) + '<span class="caret"></span>';
        if (n < total) setTimeout(tick, 14);
      })();
    }, { once: true });
  }

  /* ---------- tarjetas con inclinación 3D + brillo ---------- */
  function tilt() {
    if (!finePointer || reduceMotion) return;
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 8}deg) rotateY(${(px - .5) * 10}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- botones magnéticos ---------- */
  function magnetic() {
    if (!finePointer || reduceMotion) return;
    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * .25}px, ${y * .35}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- línea de tiempo que se dibuja ---------- */
  function timeline() {
    const tl = $(".timeline");
    const fill = $(".timeline-line span");
    if (!tl || !fill) return;
    const update = () => {
      const r = tl.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * .7 - r.top) / r.height, 0), 1);
      fill.style.transform = `scaleY(${p})`;
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- transiciones entre páginas ---------- */
  function pageTransitions() {
    if (reduceMotion) return;
    const order = ["/web/", "/web/trabajos/", "/web/trayectoria/", "/web/contacto/"];
    const idx = (u) => order.indexOf(new URL(u, location.href).pathname.replace(/index\.html$/, ""));
    const direction = (from, to) => {
      const a = idx(from), b = idx(to);
      return a === -1 || b === -1 || a === b ? "fade" : b > a ? "forward" : "backward";
    };

    // Navegadores con transiciones nativas entre páginas (Chrome, Edge, Brave, Opera…)
    if ("onpagereveal" in window) {
      addEventListener("pageswap", (e) => {
        if (e.viewTransition && e.activation && e.activation.entry) {
          e.viewTransition.types.add(direction(location.href, e.activation.entry.url));
        }
      });
      addEventListener("pagereveal", (e) => {
        if (!e.viewTransition) return;
        const from = navigation.activation && navigation.activation.from;
        e.viewTransition.types.add(from ? direction(from.url, location.href) : "fade");
        document.documentElement.classList.add("vt-arrived");
      });
      return;
    }

    // Respaldo para el resto: desvanecido + deslizamiento
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      if (url.href === location.href) { e.preventDefault(); return; }
      e.preventDefault();
      document.body.dataset.dir = direction(location.href, url.href);
      document.body.classList.add("leaving");
      setTimeout(() => { location.href = url.href; }, 380);
    });
    addEventListener("pageshow", () => document.body.classList.remove("leaving"));
  }

  /* ---------- toast y copiar ---------- */
  let toastT;
  function toast(msg) {
    const t = $(".toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function copyButtons() {
    $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      const txt = b.dataset.copy;
      try { await navigator.clipboard.writeText(txt); toast(`✓ Copiado: ${txt}`); }
      catch (e) { toast(`Mi Discord: ${txt}`); }
    }));
  }

  /* ---------- extras ---------- */
  function misc() {
    $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
    $$(".to-top").forEach((b) => b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })));
  }

  /* ---------- presencia de Discord (Lanyard) ---------- */
  const DISCORD_ID = "1299797897201586328";
  const statusLabels = { online: "En línea", idle: "Ausente", dnd: "No molestar", offline: "Desconectado" };
  const statusColors = { online: "#23A55A", idle: "#F0B232", dnd: "#F23F42", offline: "#80848E" };

  async function loadDiscordPresence() {
    const statusEls = $$(".js-dc-status");
    if (!statusEls.length) return;
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
      const json = await res.json();
      if (!json.success) throw new Error("Lanyard no encontró este usuario");
      const data = json.data;
      const user = data.discord_user;
      const status = data.discord_status || "offline";

      if (user.avatar) {
        const src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        $$(".js-dc-avatar").forEach((img) => { if (img.src !== src) img.src = src; });
      }
      $$(".js-dc-name").forEach((el) => (el.textContent = user.global_name || user.username));
      $$(".js-dc-dot").forEach((el) => {
        el.className = el.className.replace(/dc-dot-\w+/g, "").trim() + ` dc-dot-${status}`;
      });
      statusEls.forEach((el) => {
        el.textContent = statusLabels[status] || "Desconectado";
        el.style.setProperty("--status-c", statusColors[status] || statusColors.offline);
      });

      const act = $(".js-dc-activity");
      if (act) {
        const nameEl = $(".js-dc-activity-name");
        const detailEl = $(".js-dc-activity-detail");
        if (data.listening_to_spotify && data.spotify) {
          act.hidden = false;
          nameEl.textContent = `🎧 ${data.spotify.song}`;
          detailEl.textContent = `de ${data.spotify.artist}`;
        } else {
          const a = (data.activities || []).find((x) => x.type !== 4);
          if (a) {
            act.hidden = false;
            nameEl.textContent = `🎮 ${a.name}`;
            detailEl.textContent = a.details || a.state || "";
          } else act.hidden = true;
        }
      }
    } catch (err) {
      statusEls.forEach((el) => (el.textContent = "No disponible"));
    }
  }

  /* ---------- arranque ---------- */
  injectLayers();
  splitText();
  nav();
  particles();
  cursorGlow();
  counters();
  terminal();
  tilt();
  magnetic();
  timeline();
  pageTransitions();
  copyButtons();
  misc();
  typewriter();
  preloader().then(reveals);

  if ($(".js-dc-status")) {
    loadDiscordPresence();
    setInterval(loadDiscordPresence, 20000);
  }
})();
