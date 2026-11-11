"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const icons = () => window.lucide && lucide.createIcons();

const asset = p => (p && !/^([a-z]+:)?\/\//i.test(p)) ? String(p).replace(/^\/+/, "") : (p || "");

/* ---------- renderers ---------- */
// Accepts "HTML" or { name: "HTML", icon: "path/to/icon.svg" }
const badges = items => `
  <div class="badges">
    ${(items || []).map(item => {
      if (typeof item === "string") return `<span class="badge">${esc(item)}</span>`;
      return `<span class="badge">${item.icon ? `<img src="${esc(asset(item.icon))}" alt="" class="skill-icon" data-name="${esc(item.name)}" width="24" height="24" loading="lazy" aria-hidden="true">` : ""}<span>${esc(item.name)}</span></span>`;
    }).join("")}
  </div>`;

const linkBtn = (href, icon, label) => href
  ? `<a class="btn sm" href="${esc(href)}" target="_blank" rel="noopener"><i data-lucide="${icon}"></i>${label}</a>`
  : "";

function renderHeader(d) {
  $("#logo").textContent = d.site.initials;
  $("#tagline").textContent = d.site.tagline;
  $("#nav").innerHTML = d.nav.map(n => `<a href="#${esc(n.target)}" data-target="${esc(n.target)}">${esc(n.label)}</a>`).join("");
}

function renderProfile(p) {
  $("#profile").innerHTML = `
    <img src="${esc(asset(p.photo))}" alt="Portrait of ${esc(p.name)}" width="150" height="150">
    <div>
      <h1>${esc(p.name)} <svg class="verified" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Verified"><circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></h1>
      <p class="loc"><i data-lucide="map-pin"></i>${esc(p.location)}</p>
      <p class="role">${esc(p.title)}</p>
      <div class="btns">
        <a class="btn primary" href="${esc(p.resume)}" target="_blank" rel="noopener"><i data-lucide="file-text"></i>View Resume</a>
        <a class="btn" href="mailto:${esc(p.email)}"><i data-lucide="mail"></i>Send Email</a>
      </div>
      <p class="muted">${esc(p.description)}</p>
    </div>`;
  const img = $("#profile img");
  img.addEventListener("error", () => {
    const ph = document.createElement("div");
    ph.className = "ph";
    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", "Profile photo placeholder");
    img.replaceWith(ph);
  }, { once: true });
}

// data.json skills are grouped: [{ category, items: [...] }]
const renderSkills = list => { $("#skills").innerHTML = list.map(g =>
  `<div class="skill-group"><h3>${esc(g.category)}</h3>${badges(g.items)}</div>`).join(""); };

const renderExperience = list => { $("#exp").innerHTML = list.map(e => `
  <article class="exp-item">
    <p class="lbl">${esc(e.label)}</p>
    <h3>${esc(e.title)}</h3>
    ${(e.org || e.period) ? `<p class="meta">${[e.org, e.period].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
    <ul>${(e.points || []).map(p => `<li>${esc(p)}</li>`).join("")}</ul>
  </article>`).join(""); };

const renderProjects = list => { $("#project-grid").innerHTML = list.map(p => `
  <article class="item">
    ${p.image ? `<img class="thumb" src="${esc(asset(p.image))}" alt="${esc(p.title)} screenshot" loading="lazy">` : ""}
    <h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
    ${badges(p.tags)}
    <div class="item-actions">${linkBtn(p.github, "github", "GitHub")}${linkBtn(p.demo, "external-link", "Live demo")}</div>
  </article>`).join(""); };

const renderCerts = list => { $("#cert-list").innerHTML = list.map(c => `
  <article class="item">
    <h3>${esc(c.title)}</h3><p>${esc(c.issuer)} · ${esc(c.date)}</p>
    <div class="item-actions">${linkBtn(c.link, "external-link", "View certificate")}</div>
  </article>`).join(""); };

const renderGoals = list => { $("#goals").innerHTML = list.map(g => `
  <div class="row goal"><h3><i data-lucide="${esc(g.icon)}"></i>${esc(g.heading)}</h3><p>${esc(g.text)}</p></div>`).join(""); };

const renderSocial = list => { $("#social").innerHTML = list.map(s => `
  <a class="row" href="${esc(s.url)}" target="_blank" rel="noopener"><i data-lucide="${esc(s.icon)}"></i>${esc(s.name)}<i class="go" data-lucide="arrow-up-right"></i></a>`).join(""); };

function renderContact(c, d) {
  $("#contact").insertAdjacentHTML("beforeend", `
    <p>${esc(c.cta)}</p>
    <div class="list">
      <a class="row" href="mailto:${esc(c.email)}"><i data-lucide="mail"></i>${esc(c.email)}</a>
      <div class="row"><i data-lucide="map-pin"></i>${esc(d.profile.location)}</div>
    </div>`);
}

// Uses data already loaded by init() (no second fetch)
async function renderGallery(data) {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  if (!Array.isArray(data?.gallery) || !data.gallery.length) {
    gallery.innerHTML = `<div class="gallery-error"><p>No gallery images found.</p></div>`;
    return;
  }

  // Duplicate for infinite scroll loop
  const images = [...data.gallery, ...data.gallery];
  gallery.innerHTML = images.map((photo, i) => `
    <figure>
      <img src="${esc(asset(photo.src))}" alt="${esc(photo.alt || "Gallery image")}"
           loading="${i < 3 ? "eager" : "lazy"}" decoding="async">
    </figure>`).join("");

  gallery.querySelectorAll("img").forEach(img =>
    img.addEventListener("error", () => img.closest("figure")?.classList.add("image-error"), { once: true })
  );

  // Wait for first 3 images or 1.5s, whichever comes first (avoids iOS Safari stalls)
  const first = [...gallery.querySelectorAll("img")].slice(0, 3).map(img =>
    img.complete ? Promise.resolve() : new Promise(r => {
      img.addEventListener("load", r, { once: true });
      img.addEventListener("error", r, { once: true });
    })
  );
  await Promise.race([Promise.all(first), new Promise(r => setTimeout(r, 1500))]);
  gallery.classList.add("loaded");
}

/* ---------- behaviour ---------- */
function initTheme() {
  const root = document.documentElement, btn = $("#theme");
  let saved = null; try { saved = localStorage.getItem("theme"); } catch {}
  const set = t => {
    root.dataset.theme = t;
    btn.innerHTML = `<i data-lucide="${t === "dark" ? "sun" : "moon"}"></i>`;
    icons();
  };
  set(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  btn.addEventListener("click", () => {
    const t = root.dataset.theme === "dark" ? "light" : "dark";
    set(t); try { localStorage.setItem("theme", t); } catch {}
  });
}

function initMenu() {
  const btn = $("#menu"), nav = $("#nav");
  btn.addEventListener("click", () => btn.setAttribute("aria-expanded", nav.classList.toggle("open")));
  nav.addEventListener("click", e => { if (e.target.closest("a")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
}

function initScroll() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  const links = [...document.querySelectorAll(".nav a")];
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.dataset.target === e.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  links.forEach(a => { const s = document.getElementById(a.dataset.target); if (s) spy.observe(s); });

  const top = $("#top-btn");
  addEventListener("scroll", () => top.classList.toggle("show", scrollY > 500), { passive: true });
  top.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---------- init ---------- */
// Runs each section on its own so one failure doesn't blank the page
async function safe(name, fn) {
  try { await fn(); } catch (err) { console.error(`[${name}]`, err); }
}

async function init() {
  initTheme(); initMenu();

  let d;
  try {
    const res = await fetch("data/data.json");
    if (!res.ok) throw new Error(res.status);
    d = await res.json();
  } catch (err) {
    console.error(err);
    $("#main").innerHTML = `<div class="card error" role="alert"><h2>Couldn't load portfolio data</h2><p class="muted">Check that <code>data/data.json</code> exists and is valid JSON, and open the site with a local server (e.g. VS Code Live Server) instead of double-clicking index.html.</p></div>`;
    icons();
    return;
  }

  await safe("header", () => renderHeader(d));
  await safe("profile", () => renderProfile(d.profile));
  await safe("about", () => { $("#about-text").innerHTML = (d.about || []).map(esc).join("<br><br>"); });
  await safe("skills", () => renderSkills(d.skills || []));
  await safe("experience", () => renderExperience(d.experience || []));
  await safe("projects", () => renderProjects(d.projects || []));
  await safe("certifications", () => renderCerts(d.certifications || []));
  await safe("goals", () => renderGoals(d.goals || []));
  await safe("social", () => renderSocial(d.social || []));
  await safe("contact", () => renderContact(d.contact, d));
  await safe("footer", () => { $("#foot").textContent = `© ${new Date().getFullYear()} ${d.profile.name}. All rights reserved.`; });

  icons();
  initScroll();

  // Gallery last, so slow images never delay the rest of the page
  safe("gallery", () => renderGallery(d));
}

document.addEventListener("DOMContentLoaded", init);