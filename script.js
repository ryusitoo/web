(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  function injectLayers() {
    document.body.insertAdjacentHTML("afterbegin",
      '<div class="scroll-progress" aria-hidden="true"></div>' +
      '<div class="ambient" aria-hidden="true"><span></span><span></span><span></span></div>' +
      '<canvas id="bg-canvas" aria-hidden="true"></canvas>' +
      '<div class="noise" aria-hidden="true"></div>');
    document.body.insertAdjacentHTML("beforeend", '<div class="toast" role="status" aria-live="polite"></div>');
  }

  function loader() {
    const el = $(".loader");
    const ready = () => document.body.classList.add("is-ready");
    if (!el) { ready(); return Promise.resolve(); }
    let seen = false;
    try { seen = sessionStorage.getItem("ryu-intro") === "1"; } catch (e) {}
    if (seen || reduceMotion) {
      el.remove();
      document.body.classList.remove("is-loading");
      ready();
      return Promise.resolve();
    }
    try { sessionStorage.setItem("ryu-intro", "1"); } catch (e) {}
    return new Promise((res) => {
      setTimeout(() => {
        el.classList.add("is-done");
        document.body.classList.remove("is-loading");
        ready();
        setTimeout(() => el.remove(), 800);
        res();
      }, 2300);
    });
  }

  function particles() {
    const canvas = $("#bg-canvas");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const colors = ["73,198,229", "78,127,255", "155,107,255"];
    let w, h, pts = [], raf;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 120;

    function resize() {
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const count = Math.min(60, Math.floor((innerWidth * innerHeight) / 24000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .2 * dpr,
        vy: (Math.random() - .5) * .2 * dpr,
        r: (Math.random() * 1.3 + .5) * dpr,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const link = LINK * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dxm = p.x - mouse.x, dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 130 * dpr && dm > 0) { p.x += (dxm / dm) * .8; p.y += (dym / dm) * .8; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},.7)`;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(${p.c},${(1 - d / link) * .14})`;
            ctx.lineWidth = dpr * .8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    addEventListener("pointermove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf); else frame();
    });
  }

  function nav() {
    const navEl = $(".nav");
    const bar = $(".scroll-progress");
    const onScroll = () => {
      const st = scrollY;
      navEl && navEl.classList.toggle("is-scrolled", st > 30);
      if (bar) {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? st / max : 0})`;
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const links = $(".nav__links");
    const pill = $(".nav__pill");
    if (!links) return;
    const anchors = $$("a", links);
    let current = anchors.find((a) => a.classList.contains("is-active")) || null;

    const moveTo = (a) => {
      if (!pill) return;
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      pill.style.width = a.offsetWidth + "px";
      pill.style.transform = `translateX(${a.offsetLeft - 4}px)`;
    };
    const setActive = (a) => {
      if (a === current) return;
      current = a;
      anchors.forEach((x) => x.classList.toggle("is-active", x === a));
      moveTo(a);
    };

    if (pill) {
      pill.style.transition = "none";
      moveTo(current);
      requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ""; }));
      anchors.forEach((a) => a.addEventListener("mouseenter", () => moveTo(a)));
      links.addEventListener("mouseleave", () => moveTo(current));
      addEventListener("resize", () => moveTo(current));
      document.fonts && document.fonts.ready.then(() => moveTo(current));
    }

    const sections = anchors
      .map((a) => { const id = (a.getAttribute("href") || "").split("#")[1]; return id ? { a, el: document.getElementById(id) } : null; })
      .filter((x) => x && x.el);
    if (sections.length) {
      const spy = () => {
        const probe = innerHeight * .35;
        let found = sections[0];
        for (const s of sections) if (s.el.getBoundingClientRect().top <= probe) found = s;
        if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) found = sections[sections.length - 1];
        setActive(found.a);
      };
      addEventListener("scroll", spy, { passive: true });
      spy();
    }

    const toggle = $(".nav__toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = document.body.classList.toggle("menu-open");
        toggle.setAttribute("aria-expanded", open);
      });
      anchors.forEach((a) => a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      }));
    }
  }

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

  function reveals() {
    $$("[data-stagger]").forEach((parent) => {
      const step = parseFloat(parent.dataset.stagger) || .1;
      [...parent.children].forEach((c, i) => {
        if (!c.classList.contains("reveal")) c.classList.add("reveal");
        c.style.setProperty("--d", `${i * step}s`);
      });
    });
    const targets = $$(".reveal, .split, .stat, .process, .server, .skill, [data-count], .terminal");
    const show = (t) => { t.classList.add("is-visible"); t.dispatchEvent(new Event("inview")); };
    if (!("IntersectionObserver" in window) || reduceMotion) { targets.forEach(show); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: .15, rootMargin: "0px 0px -40px 0px" });
    targets.forEach((t) => io.observe(t));
  }

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
      let delay = del ? 32 : 68;
      if (!del && ci === word.length) { del = true; delay = 1900; }
      else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; delay = 380; }
      ci += del ? -1 : 1;
      setTimeout(tick, delay);
    })();
  }

  function counters() {
    $$("[data-count]").forEach((el) => {
      el.addEventListener("inview", () => {
        const end = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        if (reduceMotion) { el.textContent = end + suffix; return; }
        const dur = 1700;
        const t0 = performance.now();
        (function step(t) {
          const p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, { once: true });
    });
  }

  function terminal() {
    const term = $(".terminal");
    const src = $("#term-src");
    if (!term || !src) return;
    const body = $(".terminal__body", term);
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

  function spotlight() {
    if (!finePointer) return;
    $$(".spot").forEach((card) => {
      const tilt = card.classList.contains("service") && !reduceMotion;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        if (tilt) card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 7}deg) rotateY(${(px - .5) * 9}deg) translateY(-4px)`;
      });
      if (tilt) card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  function magnetic() {
    if (!finePointer || reduceMotion) return;
    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .32}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  function serversLine() {
    const list = $(".servers");
    const fill = $(".servers__line span");
    if (!list || !fill) return;
    const update = () => {
      const r = list.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * .7 - r.top) / r.height, 0), 1);
      fill.style.transform = `scaleY(${p})`;
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  function references() {
    $$(".ref").forEach((card) => {
      const text = $(".ref__text", card);
      const btn = $(".ref__more", card);
      if (!text || !btn) return;
      const check = () => { btn.hidden = text.scrollHeight <= text.clientHeight + 2 && !card.classList.contains("is-open"); };
      btn.addEventListener("click", () => {
        const open = card.classList.toggle("is-open");
        btn.textContent = open ? "Ver menos" : "Ver más";
      });
      check();
      addEventListener("resize", check);
      document.fonts && document.fonts.ready.then(check);
    });
  }

  let toastT;
  function toast(msg) {
    const t = $(".toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function copyButtons() {
    $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      const txt = b.dataset.copy;
      try { await navigator.clipboard.writeText(txt); toast(`✓ Copiado: ${txt}`); }
      catch (e) { toast(`Mi Discord: ${txt}`); }
    }));
  }

  function misc() {
    $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
    $$(".to-top").forEach((b) => b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })));
  }

  function voidBlocks() {
    const box = $(".void-blocks");
    if (!box || reduceMotion) return;
    const colors = ["#5D8C3E", "#7A5536", "#8B8B8B", "#49C6E5", "#4E7FFF", "#6B4A2E", "#3DBE6A"];
    for (let i = 0; i < 16; i++) {
      const b = document.createElement("span");
      const size = 14 + Math.random() * 26;
      b.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;background:${colors[i % colors.length]};animation-duration:${4 + Math.random() * 5}s;animation-delay:${-Math.random() * 8}s;--r:${Math.random() * 720 - 360}deg`;
      box.appendChild(b);
    }
  }

  function creeperEgg() {
    const word = "creeper";
    let buffer = "", busy = false;
    addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, [contenteditable]")) return;
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-word.length);
      if (buffer === word) { buffer = ""; boom(); }
    });
    let taps = 0, tapT;
    $$(".photo, .contact__avatar").forEach((el) => el.addEventListener("click", () => {
      taps++;
      clearTimeout(tapT);
      tapT = setTimeout(() => (taps = 0), 1200);
      if (taps >= 5) { taps = 0; boom(); }
    }));
    console.log("%c psst… escribe 'creeper' en la página 👀", "color:#49C6E5;font:600 13px monospace");

    function boom() {
      if (busy) return;
      busy = true;
      const fuse = document.createElement("div");
      fuse.className = "egg-fuse";
      fuse.textContent = "Ssssss…";
      document.body.appendChild(fuse);
      document.body.classList.add("egg-hiss");

      setTimeout(() => {
        fuse.remove();
        document.body.classList.remove("egg-hiss");
        const flash = document.createElement("div");
        flash.className = "egg-flash";
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 700);
        document.body.classList.add("egg-shake");
        setTimeout(() => document.body.classList.remove("egg-shake"), 600);
        if (!reduceMotion) debris();

        const targets = $$("main h1, main h2, main p, main .btn, .stat, .service, .server__card, .logo-chip, .photo, .presence, .terminal, .skill, .ref, .step, .contact, .faq details, .eyebrow, .social-btn")
          .filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
        const cx = innerWidth / 2, cy = innerHeight / 2;
        targets.forEach((el) => {
          const r = el.getBoundingClientRect();
          const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
          const d = Math.hypot(dx, dy) || 1;
          const force = 260 + Math.random() * 260;
          el.classList.add("egg-blown");
          el.style.transform = `translate(${(dx / d) * force}px, ${(dy / d) * force - 120}px) rotate(${Math.random() * 120 - 60}deg) scale(.8)`;
          el.style.opacity = "0";
        });

        setTimeout(() => {
          targets.forEach((el, i) => {
            el.classList.add("egg-rebuild");
            el.style.transitionDelay = `${i * 25}ms`;
            el.style.transform = "";
            el.style.opacity = "";
          });
          setTimeout(() => {
            targets.forEach((el) => { el.classList.remove("egg-blown", "egg-rebuild"); el.style.transitionDelay = ""; });
            busy = false;
          }, 1400 + targets.length * 25);
          toast("💥 ¡Boom! Encontraste el easter egg");
        }, 1900);
      }, 1500);
    }

    function debris() {
      const c = document.createElement("canvas");
      c.className = "egg-canvas";
      document.body.appendChild(c);
      const ctx = c.getContext("2d");
      c.width = innerWidth; c.height = innerHeight;
      const colors = ["#5D8C3E", "#4C7A2F", "#7A5536", "#8B8B8B", "#6B6B6B", "#3DBE6A", "#2F2F2F"];
      const parts = Array.from({ length: 90 }, () => {
        const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 14;
        return { x: innerWidth / 2, y: innerHeight / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, s: 6 + Math.random() * 14, r: Math.random() * 6, vr: Math.random() * .4 - .2, c: colors[Math.floor(Math.random() * colors.length)] };
      });
      const t0 = performance.now();
      (function frame(t) {
        const life = (t - t0) / 1800;
        ctx.clearRect(0, 0, c.width, c.height);
        parts.forEach((p) => {
          p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - life);
          ctx.translate(p.x, p.y); ctx.rotate(p.r);
          ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
          ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(0, 0, p.s / 2, p.s / 2);
          ctx.restore();
        });
        if (life < 1) requestAnimationFrame(frame); else c.remove();
      })(t0);
    }
  }

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
      const color = statusColors[status] || statusColors.offline;

      if (user.avatar) {
        const src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        $$(".js-dc-avatar").forEach((img) => { if (img.src !== src) img.src = src; });
      }
      $$(".js-dc-name").forEach((el) => (el.textContent = user.global_name || user.username));
      $$(".js-dc-dot").forEach((el) => {
        el.className = el.className.replace(/dc-dot-\w+/g, "").trim() + ` dc-dot-${status}`;
      });
      statusEls.forEach((el) => { el.textContent = statusLabels[status] || "Desconectado"; });
      $$(".js-dc-color").forEach((el) => el.style.setProperty("--status-c", color));

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

  injectLayers();
  splitText();
  nav();
  particles();
  counters();
  terminal();
  spotlight();
  magnetic();
  serversLine();
  references();
  copyButtons();
  misc();
  typewriter();
  voidBlocks();
  creeperEgg();
  loader().then(reveals);

  if ($(".js-dc-status")) {
    loadDiscordPresence();
    setInterval(loadDiscordPresence, 20000);
  }
})();
