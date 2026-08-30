/* ========================================================================
   PORTFOLIO PAGE — filtering + lightbox
   ======================================================================== */

(() => {
  let initialized = false;
  let currentProjects = {};

  function iconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="8" cy="9" r="1.4"/></svg>';
  }

  function init() {
    const lightbox = document.getElementById("lightbox");
    const cards = document.querySelectorAll(".portfolio-card");
    if (!cards.length) return;

    const data = Store.getData();
    currentProjects = {};
    (data.projects || []).forEach(p => { currentProjects[p.id] = p; });

    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.dataset.filter;
        cards.forEach(card => {
          const match = filter === "all" || card.dataset.category === filter;
          if (match) {
            card.style.display = "";
            requestAnimationFrame(() => card.classList.remove("hide"));
          } else {
            card.classList.add("hide");
            setTimeout(() => {
              if (card.classList.contains("hide")) card.style.display = "none";
            }, 400);
          }
        });
      };
    });

    if (!lightbox) return;

    const lbCategory = document.getElementById("lb-category");
    const lbTitle = document.getElementById("lb-title");
    const lbOverview = document.getElementById("lb-overview");
    const lbContribution = document.getElementById("lb-contribution");
    const lbTools = document.getElementById("lb-tools");
    const galleryTrack = document.getElementById("gallery-track");
    const galleryDots = document.getElementById("gallery-dots");
    let slideIndex = 0;
    let slideCount = 0;

    function updateGallery() {
      galleryTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
      [...galleryDots.children].forEach((d, i) => d.classList.toggle("active", i === slideIndex));
    }

    function goToSlide(i) {
      slideIndex = (i + slideCount) % slideCount;
      updateGallery();
    }

    function openLightbox(id) {
      const p = currentProjects[id];
      if (!p) return;

      lbCategory.textContent = p.category || "";
      lbTitle.textContent = p.title || "";
      lbOverview.textContent = p.description || "";
      lbContribution.textContent = p.role || "Add via Admin Panel";
      lbTools.innerHTML = "";

      const tools = p.tools?.length ? p.tools : ["Add tools via Admin Panel"];
      tools.forEach(t => {
        const span = document.createElement("span");
        span.textContent = t;
        lbTools.appendChild(span);
      });

      galleryTrack.innerHTML = "";
      galleryDots.innerHTML = "";
      const images = p.images?.length ? p.images : [null];
      slideCount = images.length;
      slideIndex = 0;

      images.forEach((src, i) => {
        const slide = document.createElement("div");
        slide.className = "gallery-slide";
        if (src) {
          const img = document.createElement("img");
          img.src = src;
          img.alt = p.title || "Project image";
          img.style.cssText = "width:100%;height:100%;object-fit:contain;object-position:center;display:block;";
          slide.appendChild(img);
        } else {
          slide.innerHTML = iconSvg() + `<span>Project Image — Add via Admin Panel</span>`;
        }
        galleryTrack.appendChild(slide);

        const dot = document.createElement("span");
        if (i === 0) dot.classList.add("active");
        dot.onclick = () => goToSlide(i);
        galleryDots.appendChild(dot);
      });

      updateGallery();
      document.body.style.overflow = "hidden";
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    cards.forEach(card => {
      card.onclick = () => openLightbox(card.dataset.project);
    });

    lightbox.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-backdrop")?.addEventListener("click", closeLightbox);
    lightbox.querySelector(".gallery-nav.prev")?.addEventListener("click", () => goToSlide(slideIndex - 1));
    lightbox.querySelector(".gallery-nav.next")?.addEventListener("click", () => goToSlide(slideIndex + 1));

    if (!initialized) {
      document.addEventListener("keydown", e => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") goToSlide(slideIndex - 1);
        if (e.key === "ArrowRight") goToSlide(slideIndex + 1);
      });
      initialized = true;
    }
  }

  document.addEventListener("site-rendered", init);
  document.addEventListener("DOMContentLoaded", init);
})();
