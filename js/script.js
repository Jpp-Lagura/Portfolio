"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const icons = () => window.lucide && lucide.createIcons();

/* ---------- renderers ---------- */
const badges = items => `<div class="badges">${items.map(t => `<span class="badge">${esc(t)}</span>`).join("")}</div>`;
const linkBtn = (href, icon, label) => href ? `<a class="btn sm" href="${esc(href)}" target="_blank" rel="noopener"><i data-lucide="${icon}"></i>${label}</a>` : "";

function renderHeader(d) {
  $("#logo").textContent = d.site.initials;
  $("#tagline").textContent = d.site.tagline;
  $("#nav").innerHTML = d.nav.map(n => `<a href="#${esc(n.target)}" data-target="${esc(n.target)}">${esc(n.label)}</a>`).join("");
}

function renderProfile(p) {
  $("#profile").innerHTML = `
    <img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}" width="150" height="150">
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
  img.addEventListener("error", () => img.replaceWith(Object.assign(document.createElement("div"), { className: "ph", role: "img", ariaLabel: "Profile photo placeholder" })), { once: true });
}

const renderSkills = list => $("#skills").innerHTML = list.map(g =>
  `<div class="skill-group"><h3>${esc(g.category)}</h3>${badges(g.items)}</div>`).join("");

const renderExperience = list => $("#exp").innerHTML = list.map(e => `
  <article class="exp-item">
    <p class="lbl">${esc(e.label)}</p>
    <h3>${esc(e.title)}</h3>
    ${(e.org || e.period) ? `<p class="meta">${[e.org, e.period].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
    <ul>${e.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
  </article>`).join("");

const renderProjects = list => $("#project-grid").innerHTML = list.map(p => `
  <article class="item">
    ${p.image ? `<img class="thumb" src="${esc(p.image)}" alt="${esc(p.title)} screenshot" loading="lazy">` : ""}
    <h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
    ${badges(p.tags)}
    <div class="item-actions">${linkBtn(p.github, "github", "GitHub")}${linkBtn(p.demo, "external-link", "Live demo")}</div>
  </article>`).join("");

const renderCerts = list => $("#cert-list").innerHTML = list.map(c => `
  <article class="item">
    <h3>${esc(c.title)}</h3><p>${esc(c.issuer)} · ${esc(c.date)}</p>
    <div class="item-actions">${linkBtn(c.link, "external-link", "View certificate")}</div>
  </article>`).join("");

const renderGoals = list => $("#goals").innerHTML = list.map(g => `
  <div class="row goal"><h3><i data-lucide="${esc(g.icon)}"></i>${esc(g.heading)}</h3><p>${esc(g.text)}</p></div>`).join("");

const renderSocial = list => $("#social").innerHTML = list.map(s => `
  <a class="row" href="${esc(s.url)}" target="_blank" rel="noopener"><i data-lucide="${esc(s.icon)}"></i>${esc(s.name)}<i class="go" data-lucide="arrow-up-right"></i></a>`).join("");

function renderContact(c, d) {
  const links = d.social.filter(s => c.links.includes(s.name));
  $("#contact").insertAdjacentHTML("beforeend", `
    <p>${esc(c.cta)}</p>
    <div class="list">
      <a class="row" href="mailto:${esc(c.email)}"><i data-lucide="mail"></i>${esc(c.email)}</a>
      <div class="row"><i data-lucide="map-pin"></i>${esc(d.profile.location)}</div>
    </div>`);
}


async function renderGallery() {
    const gallery = document.getElementById('gallery');

    if (!gallery) return;

    // Show loading indicator
    gallery.innerHTML = `
        <div class="gallery-loading">
            <span class="loader"></span>
            <p>Loading gallery...</p>
        </div>
    `;

    try {
        const response = await fetch('/data/data.json');

        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.gallery) || data.gallery.length === 0) {
            throw new Error('No gallery images found.');
        }

        // Duplicate images for infinite scrolling
        const images = [...data.gallery, ...data.gallery];

        gallery.innerHTML = images.map((photo, index) => `
            <figure>
                <img
                    src="${photo.src}"
                    alt="${photo.alt || 'Gallery image'}"
                    loading="${index < 3 ? 'eager' : 'lazy'}"
                    decoding="async"
                >
            </figure>
        `).join('');

        // Wait for the first 3 images to load or fail
        const firstImages = [...gallery.querySelectorAll('img')].slice(0, 3);

        await Promise.all(
            firstImages.map(img => {
                if (img.complete) return Promise.resolve();

                return new Promise(resolve => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                });
            })
        );

        gallery.classList.add('loaded');

        // Handle broken image paths
        gallery.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', () => {
                img.closest('figure')?.classList.add('image-error');
            });
        });

    } catch (error) {
        console.error('Gallery error:', error);

        gallery.innerHTML = `
            <div class="gallery-error">
                <p>Unable to load gallery images.</p>
                <button onclick="renderGallery()">Try Again</button>
            </div>
        `;
    }
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
async function init() {
  initTheme(); initMenu();
  try {
    const res = await fetch("data/data.json");
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    renderHeader(d); renderProfile(d.profile);
    document.querySelector("#about-text").innerHTML = d.about.join("<br><br>");
    renderSkills(d.skills); renderExperience(d.experience);
    renderProjects(d.projects); renderCerts(d.certifications);
    renderGoals(d.goals); renderSocial(d.social); renderContact(d.contact, d);
    renderGallery();
    $("#foot").textContent = `© ${new Date().getFullYear()} ${d.profile.name}. All rights reserved.`;
  } catch (err) {
    console.error(err);
    $("#main").innerHTML = `<div class="card error" role="alert"><h2>Couldn't load portfolio data</h2><p class="muted">Check that <code>data/data.json</code> exists and is valid JSON, and open the site with a local server (e.g. VS Code Live Server) instead of double-clicking index.html.</p></div>`;
  }
  icons(); initScroll();
}
document.addEventListener("DOMContentLoaded", init);