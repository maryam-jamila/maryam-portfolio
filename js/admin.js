/* ==========================================================================
   MARYAM JAMILA — PORTFOLIO — ADMIN PANEL LOGIC
   ========================================================================== */

(() => {

  const MAX_RAW_UPLOAD_BYTES = 20 * 1024 * 1024; /* reject absurdly large source files before we even try to process them */
  const IMAGE_TARGET_BYTES = 260 * 1024;         /* compress every image down to roughly this size before storing */
  const IMAGE_MAX_DIMENSION = 1280;               /* longest side, in pixels, after compression */

  /* ---------------------------------------------------------------- helpers */

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function toast(msg) {
    const el = document.getElementById("admin-toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }


  /* Reads an image file, resizes it to fit within IMAGE_MAX_DIMENSION and
     re-encodes it as JPEG, iteratively lowering quality (and, if needed,
     dimensions) until it's around IMAGE_TARGET_BYTES. This is what keeps
     uploaded photos from blowing through the browser's localStorage quota. */
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!file.type || !file.type.startsWith("image/")) {
        reject(new Error(`"${file.name}" isn't an image file.`));
        return;
      }
      if (file.size > MAX_RAW_UPLOAD_BYTES) {
        reject(new Error(`"${file.name}" is too large to process (over 20MB). Please choose a smaller file.`));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error(`"${file.name}" could not be opened as an image.`));
        img.onload = () => {
          try {
            resolve(compressImageToTarget(img));
          } catch (err) {
            reject(new Error(`Could not process "${file.name}".`));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function compressImageToTarget(img) {
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
      if (width >= height) {
        height = Math.round(height * (IMAGE_MAX_DIMENSION / width));
        width = IMAGE_MAX_DIMENSION;
      } else {
        width = Math.round(width * (IMAGE_MAX_DIMENSION / height));
        height = IMAGE_MAX_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.82;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);

    // Step 1: lower JPEG quality first (cheap, keeps full resolution as long as possible).
    while (estimateBytes(dataUrl) > IMAGE_TARGET_BYTES && quality > 0.35) {
      quality -= 0.12;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    // Step 2: if still too big (e.g. a very busy/high-res photo), shrink dimensions too.
    let shrinkPasses = 0;
    while (estimateBytes(dataUrl) > IMAGE_TARGET_BYTES && shrinkPasses < 4) {
      shrinkPasses++;
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    }

    return dataUrl;
  }

  function estimateBytes(dataUrl) {
    // base64 -> roughly 3 bytes per 4 characters
    const commaIdx = dataUrl.indexOf(",");
    const base64Length = commaIdx >= 0 ? dataUrl.length - commaIdx - 1 : dataUrl.length;
    return Math.round(base64Length * 0.75);
  }

  /* Turns a raw browser storage error into guidance the user can act on. */
  function friendlyStorageError(err) {
    const msg = (err && err.message) || "";
    if (err && (err.name === "QuotaExceededError" || /quota/i.test(msg))) {
      return "This browser's storage is full. Try deleting a few existing images or projects, or use an image URL instead of uploading (see Settings for details).";
    }
    return msg || "Something went wrong saving that.";
  }

  function getStorageStats() {
    let totalChars = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k) || "";
        totalChars += k.length + v.length;
      }
    } catch (e) { /* ignore */ }
    const approxKB = Math.round((totalChars * 2) / 1024); // UTF-16 code units
    const assumedQuotaKB = 5 * 1024; // conservative — real quota varies by browser (often 5–10MB)
    const pct = Math.min(100, Math.round((approxKB / assumedQuotaKB) * 100));
    return { approxKB, assumedQuotaKB, pct };
  }

  /* ---------------------------------------------------------------- login gate */

  const loginScreen = document.getElementById("admin-login-screen");
  const shell = document.getElementById("admin-shell");
  const loginForm = document.getElementById("admin-login-form");
  const loginError = document.getElementById("admin-login-error");
  const emailInput = document.getElementById("admin-email-input");
  const passwordInput = document.getElementById("admin-password-input");

  async function showShell() {
    loginScreen.style.display = "none";
    shell.style.display = "grid";
    try {
      await Store.load();
    } catch (error) {
      console.error("Could not load portfolio data:", error);
    }
    renderAllPanels();
  }

  async function verifyAdmin() {
    if (!window.supabaseClient) return false;

    const { data: sessionData, error: sessionError } =
      await window.supabaseClient.auth.getSession();
    if (sessionError || !sessionData.session) return false;

    const { data: adminData, error: adminError } =
      await window.supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", sessionData.session.user.id)
        .maybeSingle();

    if (adminError) {
      console.error("Admin verification failed:", adminError);
      return false;
    }
    return !!adminData;
  }

  (async () => {
    if (await verifyAdmin()) {
      await showShell();
    }
  })();

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "Signing in...";

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (error) {
      loginError.textContent = error.message;
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    const { data: adminData, error: adminError } =
      await window.supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (adminError || !adminData) {
      await window.supabaseClient.auth.signOut();
      loginError.textContent = adminError
        ? "Could not verify admin access."
        : "This account is not authorized to manage this portfolio.";
      return;
    }

    loginError.textContent = "";
    await showShell();
  });

  document.getElementById("admin-logout-btn").addEventListener("click", async () => {
    await window.supabaseClient.auth.signOut();
    location.reload();
  });

  /* ---------------------------------------------------------------- tab navigation */

  document.getElementById("admin-nav").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-panel]");
    if (!btn) return;
    document.querySelectorAll("#admin-nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`panel-${btn.dataset.panel}`).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ================================================================== */
  /* PERSONAL INFORMATION                                                */
  /* ================================================================== */

  function renderPersonalForm() {
    const data = Store.getData();
    const p = data.personal;
    const container = document.getElementById("personal-form");

    container.innerHTML = `
      <div class="admin-card">
        <h3>Profile Photo</h3>
        <div class="admin-photo-preview" id="photo-preview">
          ${p.photo
            ? `<img src="${esc(p.photo)}" alt="Profile photo">`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6"/></svg>`}
        </div>
        <div class="admin-actions">
          <label class="admin-btn admin-btn-sm">
            Upload Photo
            <input type="file" accept="image/*" id="photo-file-input" style="display:none;">
          </label>
          ${p.photo ? `<button class="admin-btn admin-btn-sm admin-btn-danger" id="photo-remove-btn">Remove</button>` : ""}
        </div>
        <div class="admin-field" style="margin-top:14px;">
          <label>Or Paste Image URL</label>
          <input type="url" id="photo-url-input" placeholder="https://..." value="${p.photo && p.photo.startsWith('http') ? esc(p.photo) : ''}">
        </div>
        <p class="admin-field-hint">Uploaded photos are compressed and stored in Supabase Storage. The database stores only the image URL.</p>
      </div>

      <div class="admin-card">
        <h3>Basic Info</h3>
        <div class="admin-field">
          <label>Full Name</label>
          <input type="text" id="pi-name" value="${esc(p.name)}">
        </div>
        <div class="admin-field">
          <label>Professional Title (shown in browser tab / meta)</label>
          <input type="text" id="pi-title" value="${esc(p.title)}">
        </div>
        <div class="admin-field">
          <label>Roles (shown in Hero, one per line — e.g. "Graphic Designer")</label>
          <textarea id="pi-roles">${esc((p.roles || []).join("\n"))}</textarea>
        </div>
        <div class="admin-field">
          <label>Tagline</label>
          <input type="text" id="pi-tagline" value="${esc(p.tagline)}">
        </div>
        <div class="admin-field">
          <label>Short Introduction (Home page, below the hero)</label>
          <textarea id="pi-shortintro">${esc(p.shortIntro)}</textarea>
        </div>
      </div>

      <div class="admin-card">
        <h3>About Page</h3>
        <div class="admin-field">
          <label>About Page Heading</label>
          <input type="text" id="pi-aboutheading" value="${esc(p.aboutHeading)}">
        </div>
        <div class="admin-field">
          <label>About Page Subtext</label>
          <input type="text" id="pi-aboutsubtext" value="${esc(p.aboutSubtext)}">
        </div>
        <div class="admin-field">
          <label>Lead Paragraph</label>
          <textarea id="pi-aboutlead">${esc(p.aboutLead)}</textarea>
        </div>
        <div class="admin-field">
          <label>About Paragraphs (one paragraph per line)</label>
          <textarea id="pi-aboutparas" style="min-height:150px;">${esc((p.aboutParagraphs || []).join("\n"))}</textarea>
        </div>
        <div class="admin-field">
          <label>Focus Chips (comma separated)</label>
          <input type="text" id="pi-chips" value="${esc((p.focusChips || []).join(", "))}">
        </div>
        <div class="admin-field">
          <label>Brand Statement (closing line on About page)</label>
          <textarea id="pi-brandstatement">${esc(p.brandStatement)}</textarea>
        </div>
      </div>

      <div class="admin-actions">
        <button class="admin-btn admin-btn-primary" id="personal-save-btn">Save Personal Information</button>
      </div>
    `;

    document.getElementById("photo-file-input").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataURL(file);
        Store.update(d => { d.personal.photo = dataUrl; });
        toast("Photo updated.");
        renderPersonalForm();
      } catch (err) {
        toast(friendlyStorageError(err));
      }
    });

    const removeBtn = document.getElementById("photo-remove-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        Store.update(d => { d.personal.photo = ""; });
        toast("Photo removed.");
        renderPersonalForm();
      });
    }

    document.getElementById("personal-save-btn").addEventListener("click", () => {
      const photoUrl = document.getElementById("photo-url-input").value.trim();
      Store.update(d => {
        d.personal.name = document.getElementById("pi-name").value.trim();
        d.personal.title = document.getElementById("pi-title").value.trim();
        d.personal.roles = document.getElementById("pi-roles").value.split("\n").map(s => s.trim()).filter(Boolean);
        d.personal.tagline = document.getElementById("pi-tagline").value.trim();
        d.personal.shortIntro = document.getElementById("pi-shortintro").value.trim();
        d.personal.aboutHeading = document.getElementById("pi-aboutheading").value.trim();
        d.personal.aboutSubtext = document.getElementById("pi-aboutsubtext").value.trim();
        d.personal.aboutLead = document.getElementById("pi-aboutlead").value.trim();
        d.personal.aboutParagraphs = document.getElementById("pi-aboutparas").value.split("\n").map(s => s.trim()).filter(Boolean);
        d.personal.focusChips = document.getElementById("pi-chips").value.split(",").map(s => s.trim()).filter(Boolean);
        d.personal.brandStatement = document.getElementById("pi-brandstatement").value.trim();
        if (photoUrl) d.personal.photo = photoUrl;
      });
      toast("Personal information saved.");
    });
  }

  /* ================================================================== */
  /* SKILLS                                                              */
  /* ================================================================== */

  const SKILL_CATEGORIES = ["Graphic Design", "Branding", "UI/UX", "Software Development", "AI", "Professional Skills"];

  function renderSkillsForm() {
    const data = Store.getData();
    const container = document.getElementById("skills-form");

    container.innerHTML = SKILL_CATEGORIES.map(cat => {
      const items = data.skills[cat] || [];
      const safeCat = cat.replace(/[^a-zA-Z0-9]/g, "");
      return `
        <div class="admin-card">
          <h3>${esc(cat)}</h3>
          <div id="skill-list-${safeCat}">
            ${items.length ? items.map((s, i) => skillRowHtml(cat, s, i, items.length)).join("") : '<p class="admin-empty">No skills yet — add one below.</p>'}
          </div>
          <div class="admin-actions">
            <button class="admin-btn admin-btn-sm" data-add-skill="${esc(cat)}">+ Add Skill to ${esc(cat)}</button>
          </div>
        </div>`;
    }).join("");

    container.querySelectorAll("[data-add-skill]").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.addSkill;
        Store.update(d => {
          if (!d.skills[cat]) d.skills[cat] = [];
          d.skills[cat].push({ name: "New Skill", description: "" });
        });
        renderSkillsForm();
      });
    });

    bindSkillRowEvents();
  }

  function skillRowHtml(category, skill, index, total) {
    return `
      <div class="admin-list-row" data-cat="${esc(category)}" data-idx="${index}">
        <div class="admin-field">
          <input type="text" class="skill-name-input" placeholder="Skill name" value="${esc(skill.name)}">
        </div>
        <div class="admin-field">
          <input type="text" class="skill-desc-input" placeholder="Short description (optional)" value="${esc(skill.description || "")}">
        </div>
        <div class="admin-list-row-controls">
          <button class="admin-btn admin-btn-icon skill-up-btn" title="Move up" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="admin-btn admin-btn-icon skill-down-btn" title="Move down" ${index === total - 1 ? "disabled" : ""}>↓</button>
          <button class="admin-btn admin-btn-icon admin-btn-danger skill-remove-btn" title="Remove">✕</button>
        </div>
      </div>`;
  }

  function bindSkillRowEvents() {
    document.querySelectorAll("#skills-form .admin-list-row").forEach(row => {
      const cat = row.dataset.cat;
      const idx = Number(row.dataset.idx);

      row.querySelector(".skill-name-input").addEventListener("change", (e) => {
        Store.update(d => { d.skills[cat][idx].name = e.target.value.trim(); });
      });
      row.querySelector(".skill-desc-input").addEventListener("change", (e) => {
        Store.update(d => { d.skills[cat][idx].description = e.target.value.trim(); });
      });
      row.querySelector(".skill-remove-btn").addEventListener("click", () => {
        Store.update(d => { d.skills[cat].splice(idx, 1); });
        renderSkillsForm();
        toast("Skill removed.");
      });
      const upBtn = row.querySelector(".skill-up-btn");
      const downBtn = row.querySelector(".skill-down-btn");
      if (upBtn) upBtn.addEventListener("click", () => {
        Store.update(d => {
          const arr = d.skills[cat];
          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        });
        renderSkillsForm();
      });
      if (downBtn) downBtn.addEventListener("click", () => {
        Store.update(d => {
          const arr = d.skills[cat];
          [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
        });
        renderSkillsForm();
      });
    });
  }

  /* ================================================================== */
  /* PORTFOLIO PROJECTS                                                  */
  /* ================================================================== */

  function renderProjectsForm() {
    const data = Store.getData();
    const container = document.getElementById("projects-form");
    const cats = data.projectCategories || [];

    container.innerHTML = `
      <div class="admin-actions" style="margin-bottom:20px;">
        <button class="admin-btn admin-btn-primary" id="add-project-btn">+ Add New Project</button>
      </div>
      <div id="project-list">
        ${data.projects.length ? data.projects.map((p, i) => projectCardHtml(p, i)).join("") : '<p class="admin-empty">No projects yet.</p>'}
      </div>
    `;

    document.getElementById("add-project-btn").addEventListener("click", () => {
      Store.update(d => {
        d.projects.push({
          id: Store.uid("project"),
          category: (d.projectCategories && d.projectCategories[0]) || "Graphic Design",
          title: "New Project",
          description: "",
          role: "",
          tools: [],
          images: [],
          featured: false
        });
      });
      renderProjectsForm();
      toast("Project added — edit its details below.");
    });

    bindProjectCardEvents(cats);
  }

  function projectCardHtml(p, index) {
    return `
      <div class="admin-item-card" style="flex-direction:column;align-items:stretch;" data-idx="${index}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
          <div class="admin-item-info">
            <h4>${esc(p.title || "Untitled project")}</h4>
            <div class="admin-item-meta">
              <span class="admin-badge">${esc(p.category)}</span>
              ${p.featured ? '<span class="admin-badge featured">Featured</span>' : ""}
            </div>
          </div>
          <div class="admin-actions" style="margin-top:0;">
            <button class="admin-btn admin-btn-sm project-toggle-btn">Edit</button>
            <button class="admin-btn admin-btn-sm admin-btn-danger project-delete-btn">Delete</button>
          </div>
        </div>

        <div class="project-editor" style="display:none;margin-top:18px;padding-top:18px;border-top:1px solid var(--border);">
          <div class="admin-field">
            <label>Title</label>
            <input type="text" class="proj-title-input" value="${esc(p.title)}">
          </div>
          <div class="admin-row">
            <div class="admin-field">
              <label>Category</label>
              <select class="proj-category-input"></select>
            </div>
            <div class="admin-field">
              <label>My Role</label>
              <input type="text" class="proj-role-input" value="${esc(p.role || "")}" placeholder="e.g. Graphic Designer">
            </div>
          </div>
          <div class="admin-field">
            <label>Description</label>
            <textarea class="proj-desc-input">${esc(p.description || "")}</textarea>
          </div>
          <div class="admin-field">
            <label>Tools / Technologies (comma separated)</label>
            <input type="text" class="proj-tools-input" value="${esc((p.tools || []).join(", "))}" placeholder="e.g. Figma, Illustrator, Photoshop">
          </div>
          <div class="admin-checkbox admin-field">
            <input type="checkbox" class="proj-featured-input" id="featured-${p.id}" ${p.featured ? "checked" : ""}>
            <label for="featured-${p.id}">Mark as Featured (shows on homepage)</label>
          </div>

          <div class="admin-field">
            <label>Project Images</label>
            <div class="admin-image-list" data-images-for="${esc(p.id)}">
              ${(p.images || []).map((img, i) => `
                <div class="admin-image-thumb">
                  <img src="${esc(img)}" alt="">
                  <button class="proj-image-remove-btn" data-img-idx="${i}">✕</button>
                </div>`).join("")}
            </div>
            <div class="admin-actions">
              <label class="admin-btn admin-btn-sm">
                Upload Image(s)
                <input type="file" accept="image/*" multiple class="proj-image-file-input" style="display:none;">
              </label>
              <input type="url" class="proj-image-url-input" placeholder="Or paste an image URL and press Enter" style="min-width:260px;padding:9px 12px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface-2);color:var(--text);font-size:13px;">
            </div>
            <p class="admin-field-hint">First image is used as the project thumbnail. Max ~1.5MB per uploaded image.</p>
          </div>

          <div class="admin-actions">
            <button class="admin-btn admin-btn-primary project-save-btn">Save Project</button>
          </div>
        </div>
      </div>`;
  }

  function bindProjectCardEvents(cats) {
    document.querySelectorAll("#project-list .admin-item-card").forEach(card => {
      const idx = Number(card.dataset.idx);
      const data = Store.getData();
      const project = data.projects[idx];

      const select = card.querySelector(".proj-category-input");
      select.innerHTML = cats.map(c => `<option value="${esc(c)}" ${c === project.category ? "selected" : ""}>${esc(c)}</option>`).join("");

      card.querySelector(".project-toggle-btn").addEventListener("click", () => {
        const editor = card.querySelector(".project-editor");
        const isOpen = editor.style.display !== "none";
        editor.style.display = isOpen ? "none" : "block";
        card.querySelector(".project-toggle-btn").textContent = isOpen ? "Edit" : "Close";
      });

      card.querySelector(".project-delete-btn").addEventListener("click", () => {
        if (!confirm(`Delete "${project.title}"? This can't be undone.`)) return;
        Store.update(d => { d.projects.splice(idx, 1); });
        renderProjectsForm();
        toast("Project deleted.");
      });

      card.querySelector(".project-save-btn").addEventListener("click", () => {
        Store.update(d => {
          const proj = d.projects[idx];
          proj.title = card.querySelector(".proj-title-input").value.trim();
          proj.category = card.querySelector(".proj-category-input").value;
          proj.role = card.querySelector(".proj-role-input").value.trim();
          proj.description = card.querySelector(".proj-desc-input").value.trim();
          proj.tools = card.querySelector(".proj-tools-input").value.split(",").map(s => s.trim()).filter(Boolean);
          proj.featured = card.querySelector(".proj-featured-input").checked;
        });
        renderProjectsForm();
        toast("Project saved.");
      });

      card.querySelectorAll(".proj-image-remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const imgIdx = Number(btn.dataset.imgIdx);
          Store.update(d => { d.projects[idx].images.splice(imgIdx, 1); });
          renderProjectsForm();
        });
      });

      const fileInput = card.querySelector(".proj-image-file-input");
      fileInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          try {
            const dataUrl = await fileToDataURL(file);
            Store.update(d => { d.projects[idx].images.push(dataUrl); });
          } catch (err) {
            toast(friendlyStorageError(err));
          }
        }
        renderProjectsForm();
      });

      const urlInput = card.querySelector(".proj-image-url-input");
      urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && urlInput.value.trim()) {
          e.preventDefault();
          Store.update(d => { d.projects[idx].images.push(urlInput.value.trim()); });
          renderProjectsForm();
        }
      });
    });
  }

  /* ================================================================== */
  /* EXPERIENCE                                                          */
  /* ================================================================== */

  function renderExperienceForm() {
    const data = Store.getData();
    const container = document.getElementById("experience-form");

    container.innerHTML = `
      <div class="admin-actions" style="margin-bottom:20px;">
        <button class="admin-btn admin-btn-primary" id="add-experience-btn">+ Add Experience</button>
      </div>
      <div id="experience-list">
        ${data.experience.length ? data.experience.map((exp, i) => experienceCardHtml(exp, i)).join("") : '<p class="admin-empty">No experience entries yet.</p>'}
      </div>
    `;

    document.getElementById("add-experience-btn").addEventListener("click", () => {
      Store.update(d => {
        d.experience.push({
          id: Store.uid("exp"),
          organization: "New Organization",
          position: "",
          duration: "",
          tag: "",
          description: "",
          skills: [],
          images: []
        });
      });
      renderExperienceForm();
      toast("Experience entry added — edit its details below.");
    });

    bindExperienceCardEvents();
  }

  function experienceCardHtml(exp, index) {
    return `
      <div class="admin-item-card" style="flex-direction:column;align-items:stretch;" data-idx="${index}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
          <div class="admin-item-info">
            <h4>${esc(exp.organization || "Untitled")}</h4>
            <div class="admin-item-meta">${esc(exp.position || "")} ${exp.duration ? "· " + esc(exp.duration) : ""}</div>
          </div>
          <div class="admin-actions" style="margin-top:0;">
            <button class="admin-btn admin-btn-sm exp-toggle-btn">Edit</button>
            <button class="admin-btn admin-btn-sm admin-btn-danger exp-delete-btn">Delete</button>
          </div>
        </div>

        <div class="exp-editor" style="display:none;margin-top:18px;padding-top:18px;border-top:1px solid var(--border);">
          <div class="admin-row">
            <div class="admin-field">
              <label>Organization</label>
              <input type="text" class="exp-org-input" value="${esc(exp.organization)}">
            </div>
            <div class="admin-field">
              <label>Position</label>
              <input type="text" class="exp-position-input" value="${esc(exp.position)}">
            </div>
          </div>
          <div class="admin-row">
            <div class="admin-field">
              <label>Duration (e.g. "3 Months", "Current")</label>
              <input type="text" class="exp-duration-input" value="${esc(exp.duration)}">
            </div>
            <div class="admin-field">
              <label>Tag Label (small badge, e.g. "Current Internship")</label>
              <input type="text" class="exp-tag-input" value="${esc(exp.tag || "")}">
            </div>
          </div>
          <div class="admin-field">
            <label>Description</label>
            <textarea class="exp-desc-input">${esc(exp.description)}</textarea>
          </div>
          <div class="admin-field">
            <label>Skills (comma separated)</label>
            <input type="text" class="exp-skills-input" value="${esc((exp.skills || []).join(", "))}">
          </div>

          <div class="admin-field">
            <label>Images</label>
            <div class="admin-image-list" data-exp-images="${esc(exp.id)}">
              ${(exp.images || []).map((img, i) => `
                <div class="admin-image-thumb">
                  <img src="${esc(img)}" alt="">
                  <button class="exp-image-remove-btn" data-img-idx="${i}">✕</button>
                </div>`).join("")}
            </div>
            <div class="admin-actions">
              <label class="admin-btn admin-btn-sm">
                Upload Image(s)
                <input type="file" accept="image/*" multiple class="exp-image-file-input" style="display:none;">
              </label>
              <input type="url" class="exp-image-url-input" placeholder="Or paste an image URL and press Enter" style="min-width:260px;padding:9px 12px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface-2);color:var(--text);font-size:13px;">
            </div>
          </div>

          <div class="admin-actions">
            <button class="admin-btn admin-btn-primary exp-save-btn">Save Experience</button>
          </div>
        </div>
      </div>`;
  }

  function bindExperienceCardEvents() {
    document.querySelectorAll("#experience-list .admin-item-card").forEach(card => {
      const idx = Number(card.dataset.idx);

      card.querySelector(".exp-toggle-btn").addEventListener("click", () => {
        const editor = card.querySelector(".exp-editor");
        const isOpen = editor.style.display !== "none";
        editor.style.display = isOpen ? "none" : "block";
        card.querySelector(".exp-toggle-btn").textContent = isOpen ? "Edit" : "Close";
      });

      card.querySelector(".exp-delete-btn").addEventListener("click", () => {
        const data = Store.getData();
        if (!confirm(`Delete "${data.experience[idx].organization}"? This can't be undone.`)) return;
        Store.update(d => { d.experience.splice(idx, 1); });
        renderExperienceForm();
        toast("Experience entry deleted.");
      });

      card.querySelector(".exp-save-btn").addEventListener("click", () => {
        Store.update(d => {
          const exp = d.experience[idx];
          exp.organization = card.querySelector(".exp-org-input").value.trim();
          exp.position = card.querySelector(".exp-position-input").value.trim();
          exp.duration = card.querySelector(".exp-duration-input").value.trim();
          exp.tag = card.querySelector(".exp-tag-input").value.trim();
          exp.description = card.querySelector(".exp-desc-input").value.trim();
          exp.skills = card.querySelector(".exp-skills-input").value.split(",").map(s => s.trim()).filter(Boolean);
        });
        renderExperienceForm();
        toast("Experience saved.");
      });

      card.querySelectorAll(".exp-image-remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const imgIdx = Number(btn.dataset.imgIdx);
          Store.update(d => { d.experience[idx].images.splice(imgIdx, 1); });
          renderExperienceForm();
        });
      });

      const fileInput = card.querySelector(".exp-image-file-input");
      fileInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          try {
            const dataUrl = await fileToDataURL(file);
            Store.update(d => { d.experience[idx].images.push(dataUrl); });
          } catch (err) {
            toast(friendlyStorageError(err));
          }
        }
        renderExperienceForm();
      });

      const urlInput = card.querySelector(".exp-image-url-input");
      urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && urlInput.value.trim()) {
          e.preventDefault();
          Store.update(d => { d.experience[idx].images.push(urlInput.value.trim()); });
          renderExperienceForm();
        }
      });
    });
  }

  /* ================================================================== */
  /* COMMUNITY                                                           */
  /* ================================================================== */

  const COMMUNITY_TYPES = ["Session", "Event Participation", "Management"];

  function renderCommunityForm() {
    const data = Store.getData();
    const c = data.community || { name: "", summary: "", tags: [], items: [] };
    const container = document.getElementById("community-form");

    container.innerHTML = `
      <div class="admin-card">
        <h3>Overview</h3>
        <div class="admin-field">
          <label>Community / Organization Name</label>
          <input type="text" id="comm-name" value="${esc(c.name)}">
        </div>
        <div class="admin-field">
          <label>Summary</label>
          <textarea id="comm-summary">${esc(c.summary)}</textarea>
        </div>
        <div class="admin-field">
          <label>Tags (comma separated)</label>
          <input type="text" id="comm-tags" value="${esc((c.tags || []).join(", "))}">
        </div>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-primary" id="comm-save-overview-btn">Save Overview</button>
        </div>
      </div>

      <div class="admin-card">
        <h3>Sessions, Events &amp; Management Activities</h3>
        <div id="community-items-list">
          ${(c.items && c.items.length) ? c.items.map((it, i) => communityItemHtml(it, i)).join("") : '<p class="admin-empty">No activities added yet.</p>'}
        </div>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-sm" id="comm-add-item-btn">+ Add Activity</button>
        </div>
      </div>
    `;

    document.getElementById("comm-save-overview-btn").addEventListener("click", () => {
      Store.update(d => {
        d.community.name = document.getElementById("comm-name").value.trim();
        d.community.summary = document.getElementById("comm-summary").value.trim();
        d.community.tags = document.getElementById("comm-tags").value.split(",").map(s => s.trim()).filter(Boolean);
      });
      toast("Community overview saved.");
    });

    document.getElementById("comm-add-item-btn").addEventListener("click", () => {
      Store.update(d => {
        if (!d.community.items) d.community.items = [];
        d.community.items.push({ type: "Session", title: "New Activity", description: "" });
      });
      renderCommunityForm();
    });

    bindCommunityItemEvents();
  }

  function communityItemHtml(item, index) {
    return `
      <div class="admin-list-row" style="flex-wrap:wrap;" data-idx="${index}">
        <div class="admin-field" style="flex:0 0 160px;">
          <select class="comm-item-type-input">
            ${COMMUNITY_TYPES.map(t => `<option value="${t}" ${t === item.type ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
        <div class="admin-field">
          <input type="text" class="comm-item-title-input" placeholder="Title" value="${esc(item.title)}">
        </div>
        <div class="admin-field">
          <input type="text" class="comm-item-desc-input" placeholder="Description" value="${esc(item.description || "")}">
        </div>
        <div class="admin-list-row-controls">
          <button class="admin-btn admin-btn-icon admin-btn-danger comm-item-remove-btn" title="Remove">✕</button>
        </div>
      </div>`;
  }

  function bindCommunityItemEvents() {
    document.querySelectorAll("#community-items-list .admin-list-row").forEach(row => {
      const idx = Number(row.dataset.idx);

      row.querySelector(".comm-item-type-input").addEventListener("change", (e) => {
        Store.update(d => { d.community.items[idx].type = e.target.value; });
      });
      row.querySelector(".comm-item-title-input").addEventListener("change", (e) => {
        Store.update(d => { d.community.items[idx].title = e.target.value.trim(); });
      });
      row.querySelector(".comm-item-desc-input").addEventListener("change", (e) => {
        Store.update(d => { d.community.items[idx].description = e.target.value.trim(); });
      });
      row.querySelector(".comm-item-remove-btn").addEventListener("click", () => {
        Store.update(d => { d.community.items.splice(idx, 1); });
        renderCommunityForm();
        toast("Activity removed.");
      });
    });
  }

  /* ================================================================== */
  /* CONTACT                                                             */
  /* ================================================================== */

  function renderContactForm() {
    const data = Store.getData();
    const c = data.contact;
    const container = document.getElementById("contact-form");

    container.innerHTML = `
      <div class="admin-card">
        <h3>Primary Contact</h3>
        <div class="admin-field">
          <label>Email</label>
          <input type="email" id="ct-email" value="${esc(c.email)}" placeholder="you@example.com">
        </div>
        <div class="admin-field">
          <label>LinkedIn URL</label>
          <input type="url" id="ct-linkedin" value="${esc(c.linkedin)}" placeholder="https://linkedin.com/in/...">
        </div>
        <div class="admin-field">
          <label>Behance URL</label>
          <input type="url" id="ct-behance" value="${esc(c.behance)}" placeholder="https://behance.net/...">
        </div>
        <div class="admin-field">
          <label>Instagram URL</label>
          <input type="url" id="ct-instagram" value="${esc(c.instagram)}" placeholder="https://instagram.com/...">
        </div>
        <div class="admin-field">
          <label>GitHub URL</label>
          <input type="url" id="ct-github" value="${esc(c.github)}" placeholder="https://github.com/...">
        </div>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-primary" id="contact-save-btn">Save Contact Info</button>
        </div>
      </div>

      <div class="admin-card">
        <h3>Additional Social Links</h3>
        <div id="extra-links-list">
          ${(c.extraLinks && c.extraLinks.length) ? c.extraLinks.map((l, i) => extraLinkHtml(l, i)).join("") : '<p class="admin-empty">No additional links yet.</p>'}
        </div>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-sm" id="extra-link-add-btn">+ Add Link</button>
        </div>
      </div>
    `;

    document.getElementById("contact-save-btn").addEventListener("click", () => {
      Store.update(d => {
        d.contact.email = document.getElementById("ct-email").value.trim();
        d.contact.linkedin = document.getElementById("ct-linkedin").value.trim();
        d.contact.behance = document.getElementById("ct-behance").value.trim();
        d.contact.instagram = document.getElementById("ct-instagram").value.trim();
        d.contact.github = document.getElementById("ct-github").value.trim();
      });
      toast("Contact info saved.");
    });

    document.getElementById("extra-link-add-btn").addEventListener("click", () => {
      Store.update(d => {
        if (!d.contact.extraLinks) d.contact.extraLinks = [];
        d.contact.extraLinks.push({ label: "New Link", url: "" });
      });
      renderContactForm();
    });

    bindExtraLinkEvents();
  }

  function extraLinkHtml(link, index) {
    return `
      <div class="admin-list-row" data-idx="${index}">
        <div class="admin-field" style="flex:0 0 160px;">
          <input type="text" class="extra-link-label-input" placeholder="Label" value="${esc(link.label)}">
        </div>
        <div class="admin-field">
          <input type="url" class="extra-link-url-input" placeholder="https://..." value="${esc(link.url)}">
        </div>
        <div class="admin-list-row-controls">
          <button class="admin-btn admin-btn-icon admin-btn-danger extra-link-remove-btn" title="Remove">✕</button>
        </div>
      </div>`;
  }

  function bindExtraLinkEvents() {
    document.querySelectorAll("#extra-links-list .admin-list-row").forEach(row => {
      const idx = Number(row.dataset.idx);
      row.querySelector(".extra-link-label-input").addEventListener("change", (e) => {
        Store.update(d => { d.contact.extraLinks[idx].label = e.target.value.trim(); });
      });
      row.querySelector(".extra-link-url-input").addEventListener("change", (e) => {
        Store.update(d => { d.contact.extraLinks[idx].url = e.target.value.trim(); });
      });
      row.querySelector(".extra-link-remove-btn").addEventListener("click", () => {
        Store.update(d => { d.contact.extraLinks.splice(idx, 1); });
        renderContactForm();
        toast("Link removed.");
      });
    });
  }

  /* ================================================================== */
  /* SETTINGS                                                            */
  /* ================================================================== */

  function renderSettingsForm() {
    const container = document.getElementById("settings-form");
    const stats = getStorageStats();
    const barColor = stats.pct >= 90 ? "#ff6e6e" : stats.pct >= 70 ? "#f4c15c" : "var(--teal)";

    container.innerHTML = `
      <div class="admin-card">
        <h3>Cloud Storage</h3>
        <p class="admin-field-hint" style="margin-bottom:12px;">
          Your portfolio content is stored in Supabase Postgres and uploaded images are stored in
          Supabase Storage. This removes the old browser localStorage limitation.
        </p>
        <p style="font-size:12.5px;color:var(--text-muted);">Free Supabase projects have quotas, so keep very large video files outside this bucket.</p>
      </div>

      <div class="admin-card">
        <h3>Change Admin Password</h3>
        <div class="admin-row">
          <div class="admin-field">
            <label>New Password</label>
            <input type="password" id="new-password-input" autocomplete="new-password">
          </div>
          <div class="admin-field">
            <label>Confirm New Password</label>
            <input type="password" id="confirm-password-input" autocomplete="new-password">
          </div>
        </div>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-primary" id="change-password-btn">Update Password</button>
        </div>
        <p class="admin-field-hint">This password only protects casual access to this Admin Panel in this browser. It is not a substitute for real server-side security — don't reuse a sensitive password here.</p>
      </div>

      <div class="admin-card">
        <h3>Make Your Changes Permanent For All Visitors</h3>
        <p class="admin-field-hint" style="margin-bottom:14px;">
          Your changes are saved to Supabase and are available to every visitor after the save completes.
          The original data.js is kept in this project as a backup. The buttons below are useful for offline backups.
        </p>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-primary" id="export-datajs-btn">⬇ Export as data.js</button>
          <button class="admin-btn" id="export-json-btn">⬇ Export Backup (JSON)</button>
          <label class="admin-btn">
            ⬆ Import Backup (JSON)
            <input type="file" accept="application/json" id="import-json-input" style="display:none;">
          </label>
        </div>
      </div>

      <div class="admin-card">
        <h3>Restore Original Portfolio</h3>
        <p class="admin-field-hint" style="margin-bottom:14px;">Restores the original portfolio content from data.js and saves it to Supabase. Existing edits will be replaced.</p>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-danger" id="reset-defaults-btn">Reset to Defaults</button>
        </div>
      </div>
    `;

    document.getElementById("change-password-btn").addEventListener("click", async () => {
      const pass = document.getElementById("new-password-input").value;
      const confirmPass = document.getElementById("confirm-password-input").value;
      if (!pass || pass.length < 8) { toast("Password must be at least 8 characters."); return; }
      if (pass !== confirmPass) { toast("Passwords don't match."); return; }

      const { error } = await window.supabaseClient.auth.updateUser({ password: pass });
      if (error) { toast(error.message); return; }

      toast("Admin password updated.");
      document.getElementById("new-password-input").value = "";
      document.getElementById("confirm-password-input").value = "";
    });

    document.getElementById("export-datajs-btn").addEventListener("click", () => {
      downloadFile("data.js", Store.exportAsDataJs(), "text/javascript");
      toast("data.js downloaded.");
    });

    document.getElementById("export-json-btn").addEventListener("click", () => {
      downloadFile("portfolio-backup.json", Store.exportJSON(), "application/json");
      toast("Backup downloaded.");
    });

    document.getElementById("import-json-input").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        await Store.importJSON(text);
        toast("Backup imported successfully.");
        renderAllPanels();
      } catch (err) {
        toast("Could not import that file. Please check it's a valid backup JSON.");
      }
    });

    document.getElementById("reset-defaults-btn").addEventListener("click", () => {
      if (!confirm("This will erase all your Admin Panel edits in this browser and restore the original defaults. Continue?")) return;
      Store.resetToDefaults().then(() => {
        renderAllPanels();
        toast("Portfolio restored to the original data.js content and saved to Supabase.");
      }).catch(err => {
        toast(err.message || "Could not reset the portfolio.");
      });
    });
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------------------------------------------------------------- run */

  function renderAllPanels() {
    renderPersonalForm();
    renderSkillsForm();
    renderProjectsForm();
    renderExperienceForm();
    renderCommunityForm();
    renderContactForm();
    renderSettingsForm();
  }

})();
