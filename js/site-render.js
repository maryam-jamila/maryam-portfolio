/* ==========================================================================
   MARYAM JAMILA — PORTFOLIO — SITE RENDER ENGINE
   --------------------------------------------------------------------------
   Reads content from Store (localStorage, seeded from js/data.js) and
   fills in every page's dynamic sections. Include this AFTER js/data.js
   and js/store.js, and BEFORE js/main.js, on every public page.
   ========================================================================== */

(() => {

  /* ---------------------------------------------------------------- helpers */

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  const CATEGORY_GROUP = {
    "Graphic Design": "creative",
    "Branding": "creative",
    "UI/UX": "merge",
    "Software Development": "tech",
    "AI": "tech",
    "Professional Skills": "merge"
  };

  const CATEGORY_ICON = {
    "Graphic Design": '<path d="M16.5 3.5l4 4L8 20l-5 1 1-5z"/>',
    "Branding": '<circle cx="8" cy="8" r="4"/><circle cx="15" cy="15" r="4"/>',
    "UI/UX": '<rect x="3.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="8.5" y="13.5" width="7" height="7" rx="1.3"/>',
    "Software Development": '<path d="M8 6L3 12l5 6M16 6l5 6-5 6"/>',
    "AI": '<path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/>',
    "Professional Skills": '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.45 1 .95 1 1.6h5c0-.65.4-1.15 1-1.6A6 6 0 0012 3z"/>'
  };

  const THUMB_ICON = {
    "Graphic Design": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="8" cy="9" r="1.4"/>',
    "Branding & Identity": '<circle cx="8" cy="8" r="4"/><circle cx="15" cy="15" r="4"/>',
    "UI/UX & Applications": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>',
    "AI & Software": '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    "Internship Work": '<path d="M12 3l7 4v10l-7 4-7-4V7z"/>'
  };

  function thumbStyle(category, idx) {
    const pos = ["30% 30%", "70% 30%", "30% 70%", "70% 70%", "50% 50%"][idx % 5];
    switch (category) {
      case "Graphic Design":
        return `background:radial-gradient(circle at ${pos}, var(--violet), transparent 65%);`;
      case "Branding & Identity":
        return `background:radial-gradient(circle at ${pos}, var(--teal), transparent 65%);`;
      case "UI/UX & Applications":
        return `background:radial-gradient(circle at ${pos}, var(--violet), var(--teal) 130%);`;
      case "AI & Software":
        return `background:radial-gradient(circle at 40% 35%, var(--teal), var(--violet) 140%); opacity:.6;`;
      case "Internship Work":
        return `background:conic-gradient(from ${(idx * 70) % 360}deg, var(--violet), var(--teal), var(--violet)); opacity:.3;`;
      default:
        return `background:radial-gradient(circle at ${pos}, var(--violet), transparent 65%);`;
    }
  }

  function thumbInner(project, idx) {
    if (project.images && project.images[0]) {
      return `<img src="${esc(project.images[0])}" alt="${esc(project.title)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
    }
    const icon = THUMB_ICON[project.category] || THUMB_ICON["Graphic Design"];
    return `<div class="thumb-gradient" style="${thumbStyle(project.category, idx)}"></div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">${icon}</svg>
      <span class="thumb-label">Thumbnail — Add via Admin Panel</span>`;
  }

  function photoMarkup(photo) {
    if (photo) {
      return `<img src="${esc(photo)}" alt="Profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
    }
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
        <circle cx="12" cy="8.5" r="3.6"/>
        <path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6"/>
      </svg>
      <span>Profile Photo — Add via Admin Panel</span>`;
  }

  const SOCIAL_ICON = {
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5v6M8 7.5v.01M12 16.5v-3.7c0-1.2.9-2.3 2.2-2.3s2.3 1 2.3 2.3v3.7"/>',
    behance: '<path d="M3 7h6M3 7v10h5.5c1.6 0 2.9-1.1 2.9-2.6 0-1.3-.9-2.2-2-2.4 1-.3 1.7-1.1 1.7-2.2C11.1 8.2 9.9 7 8.2 7H3z"/><path d="M14 13.5a3.6 3.6 0 007 1.3M14 13a3.4 3.4 0 016.8 0"/>',
    github: '<path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.6 1 1.5 1 2.6 0 3.8-2.4 4.7-4.6 4.9.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0012 2z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.6" fill="currentColor"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 10-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 105.7 5.7l1-1"/>'
  };

  /* ---------------------------------------------------------------- brand / footer / contact icons (all pages) */

  function renderBrandAndFooter(data) {
    document.querySelectorAll('[data-field="brand-name"]').forEach(el => { el.textContent = data.personal.name; });
    document.querySelectorAll('[data-field="footer-note"]').forEach(el => { el.textContent = data.meta.footerNote; });

    const socials = [
      ["linkedin", data.contact.linkedin],
      ["behance", data.contact.behance],
      ["github", data.contact.github],
      ["instagram", data.contact.instagram]
    ];

    document.querySelectorAll(".footer-social").forEach(container => {
      container.innerHTML = "";
      socials.forEach(([key, url]) => {
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", key.charAt(0).toUpperCase() + key.slice(1));
        a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${SOCIAL_ICON[key]}</svg>`;
        container.appendChild(a);
      });
      (data.contact.extraLinks || []).forEach(link => {
        if (!link.url) return;
        const a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", link.label || "Link");
        a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${SOCIAL_ICON.link}</svg>`;
        container.appendChild(a);
      });
      if (!container.children.length) {
        container.innerHTML = '<span style="color:var(--text-dim);font-size:.85rem;">Social links — Add via Admin Panel</span>';
      }
    });
  }

  /* ---------------------------------------------------------------- HOME (index.html) */

  function renderHome(data) {
    const heroName = document.getElementById("hero-name");
    if (heroName) heroName.textContent = data.personal.name;

    const heroRoles = document.getElementById("hero-roles");
    if (heroRoles) {
      heroRoles.innerHTML = data.personal.roles
        .map(r => `<span>${esc(r)}</span>`)
        .join('<span class="dot">•</span>');
    }

    const heroTagline = document.getElementById("hero-tagline");
    if (heroTagline) heroTagline.textContent = `"${data.personal.tagline}"`;

    const heroPhoto = document.getElementById("hero-photo");
    if (heroPhoto) heroPhoto.innerHTML = photoMarkup(data.personal.photo);

    const introPara = document.getElementById("intro-paragraph");
    if (introPara) introPara.textContent = data.personal.shortIntro;

    const skillsGrid = document.getElementById("skills-grid");
    if (skillsGrid) renderSkillsGrid(skillsGrid, data);

    const workGrid = document.getElementById("work-grid");
    if (workGrid) {
      const featured = data.projects.filter(p => p.featured).slice(0, 4);
      const list = featured.length ? featured : data.projects.slice(0, 4);
      workGrid.innerHTML = list.map((p, i) => `
        <article class="work-card reveal">
          <div class="work-thumb">${thumbInner(p, i)}</div>
          <div class="work-body">
            <span class="work-tag">${esc(p.category)}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
            <a href="portfolio.html" class="work-link">View Case Study
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        </article>`).join("");
    }

    const homeTimeline = document.getElementById("home-timeline");
    if (homeTimeline) renderExperienceTimeline(homeTimeline, data, false);

    const communityContainer = document.getElementById("community-card-container");
    if (communityContainer) renderCommunityCard(communityContainer, data);
  }

  /* ---------------------------------------------------------------- ABOUT (about.html) */

  function renderAbout(data) {
    const aboutPhoto = document.getElementById("about-photo");
    if (aboutPhoto) aboutPhoto.innerHTML = photoMarkup(data.personal.photo);

    const aboutHeading = document.getElementById("about-heading");
    if (aboutHeading) aboutHeading.textContent = data.personal.aboutHeading;

    const aboutSubtext = document.getElementById("about-subtext");
    if (aboutSubtext) aboutSubtext.textContent = data.personal.aboutSubtext;

    const aboutLead = document.getElementById("about-lead");
    if (aboutLead) aboutLead.textContent = data.personal.aboutLead;

    const aboutParas = document.getElementById("about-paragraphs");
    if (aboutParas) {
      aboutParas.innerHTML = (data.personal.aboutParagraphs || []).map(p => `<p>${esc(p)}</p>`).join("");
    }

    const focusChips = document.getElementById("focus-chips");
    if (focusChips) {
      focusChips.innerHTML = (data.personal.focusChips || []).map(c => `<span>${esc(c)}</span>`).join("");
    }

    const brandStatement = document.getElementById("brand-statement-text");
    if (brandStatement) brandStatement.textContent = data.personal.brandStatement;

    renderSkillPanels(data);
  }

  function renderSkillPanels(data) {
    const designPanel = document.getElementById("skill-panel-design");
    const techPanel = document.getElementById("skill-panel-tech");
    const proPanel = document.getElementById("skill-panel-professional");
    const groups = { design: ["Graphic Design", "Branding"], tech: ["UI/UX", "Software Development", "AI"], professional: ["Professional Skills"] };

    function fillPanel(panel, cats) {
      if (!panel) return;
      const names = [];
      cats.forEach(cat => (data.skills[cat] || []).forEach(s => names.push(s.name)));
      panel.innerHTML = names.length
        ? names.map(n => `<span class="skill-tag">${esc(n)}</span>`).join("")
        : '<span class="skill-tag" style="opacity:.6;">Add skills via Admin Panel</span>';
    }
    fillPanel(designPanel, groups.design);
    fillPanel(techPanel, groups.tech);
    fillPanel(proPanel, groups.professional);
  }

  function renderSkillsGrid(container, data) {
    const cards = [];
    Object.keys(data.skills).forEach(category => {
      (data.skills[category] || []).forEach(skill => {
        cards.push({ category, skill });
      });
    });
    container.innerHTML = cards.map(({ category, skill }) => `
      <div class="skill-card ${CATEGORY_GROUP[category] || "creative"} reveal">
        <div class="skill-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${CATEGORY_ICON[category] || ""}</svg></div>
        <h3>${esc(skill.name)}</h3>
        <p>${esc(skill.description || "")}</p>
      </div>`).join("");
  }

  /* ---------------------------------------------------------------- PORTFOLIO (portfolio.html) */

  function renderPortfolio(data) {
    const filterBar = document.getElementById("portfolio-filter");
    if (filterBar) {
      const cats = data.projectCategories || [];
      filterBar.innerHTML = `<button class="filter-btn active" data-filter="all">All Work</button>` +
        cats.map(c => `<button class="filter-btn" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
    }

    const grid = document.getElementById("portfolio-grid");
    if (grid) {
      grid.innerHTML = data.projects.map((p, i) => `
        <article class="portfolio-card reveal${p.featured ? " featured" : ""}" data-category="${esc(p.category)}" data-project="${esc(p.id)}">
          <div class="portfolio-thumb">${thumbInner(p, i)}
            <div class="portfolio-overlay">View Project <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
          </div>
          <div class="portfolio-meta">
            <span class="work-tag">${esc(p.category)}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
            <div class="portfolio-tags"><span>Role: ${esc(p.role || "Add via Admin Panel")}</span></div>
          </div>
        </article>`).join("");
    }
  }

  /* ---------------------------------------------------------------- EXPERIENCE (experience.html + index.html + about.html reuse) */

  function renderExperienceTimeline(container, data, withSkillTags) {
    container.innerHTML = (data.experience || []).map(exp => `
      <div class="timeline-item reveal">
        <div class="timeline-dot"></div>
        <span class="timeline-tag">${esc(exp.tag || exp.duration)}</span>
        <h3>${esc(exp.organization)}</h3>
        <p class="timeline-role">${esc(exp.position)}</p>
        <p>${esc(exp.description)}</p>
        ${withSkillTags && exp.skills && exp.skills.length ? `<div class="portfolio-tags">${exp.skills.map(s => `<span>${esc(s)}</span>`).join("")}</div>` : ""}
      </div>`).join("");
  }

  function renderCommunityCard(container, data) {
    const c = data.community || {};
    const itemsHtml = (c.items && c.items.length)
      ? `<div class="community-items">` + c.items.map(it => `
          <div class="community-item">
            <span class="work-tag">${esc(it.type)}</span>
            <h4>${esc(it.title)}</h4>
            <p>${esc(it.description)}</p>
          </div>`).join("") + `</div>`
      : "";
    container.innerHTML = `
      <div class="community-card reveal">
        <div class="community-mark">${esc((c.name || "GDG").split(" ")[0])}</div>
        <div class="community-body">
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.summary)}</p>
          <div class="community-tags">${(c.tags || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>
          ${itemsHtml}
        </div>
      </div>`;
  }

  function renderExperiencePage(data) {
    const profTimeline = document.getElementById("professional-timeline");
    if (profTimeline) renderExperienceTimeline(profTimeline, data, true);

    const communityContainer = document.getElementById("community-card-container");
    if (communityContainer) renderCommunityCard(communityContainer, data);
  }

  /* ---------------------------------------------------------------- CONTACT (contact.html) */

  function renderContact(data) {
    const list = document.getElementById("contact-info-list");
    if (!list) return;
    const c = data.contact || {};
    const rows = [
      { key: "email", label: "Email", value: c.email, href: c.email ? `mailto:${c.email}` : "#" },
      { key: "linkedin", label: "LinkedIn", value: c.linkedin, href: c.linkedin || "#" },
      { key: "behance", label: "Behance", value: c.behance, href: c.behance || "#" },
      { key: "instagram", label: "Instagram", value: c.instagram, href: c.instagram || "#" },
      { key: "github", label: "GitHub", value: c.github, href: c.github || "#" }
    ];
    (c.extraLinks || []).forEach(link => {
      rows.push({ key: "link", label: link.label || "Link", value: link.url, href: link.url || "#" });
    });

    list.innerHTML = rows.map(r => `
      <div class="contact-info-item">
        <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${SOCIAL_ICON[r.key] || SOCIAL_ICON.link}</svg></div>
        <div class="contact-info-text">
          <span>${esc(r.label)}</span>
          <a href="${esc(r.href)}" ${r.value ? 'target="_blank" rel="noopener"' : ""}>${r.value ? esc(r.value) : "Add via Admin Panel"}</a>
        </div>
      </div>`).join("");
  }

  /* ---------------------------------------------------------------- run */

  function renderAll() {
    const data = Store.getData();
    renderBrandAndFooter(data);
    renderHome(data);
    renderAbout(data);
    renderPortfolio(data);
    renderExperiencePage(data);
    renderContact(data);
    document.dispatchEvent(new CustomEvent("site-rendered"));
  }

  async function startSite() {
    await Store.load();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", startSite);
  Store.onChange(() => {
    if (document.readyState !== "loading") renderAll();
  });

  window.SiteRender = { renderAll };

})();
