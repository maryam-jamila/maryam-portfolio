/* ========================================================================
   MARYAM JAMILA — PORTFOLIO DATA STORE
   Supabase-backed persistence with safe public/admin access.
   ======================================================================== */

const Store = (() => {
  const TABLE = "portfolio_content";
  const ROW_ID = "main";
  const BUCKET = "portfolio-images";

  let cache = clone(DEFAULT_DATA);
  let listeners = [];
  let loadPromise = null;
  let loaded = false;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function configured() {
    const c = window.SUPABASE_CONFIG;
    return !!(c && c.url && c.key && window.supabaseClient);
  }

  function client() {
    if (!configured()) throw new Error("Supabase is not configured.");
    return window.supabaseClient;
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(x => x !== fn); };
  }

  function notify() {
    listeners.forEach(fn => {
      try { fn(cache); } catch (e) { console.error("Store listener error:", e); }
    });
  }

  function getData() { return cache; }

  function deepMerge(base, overrides) {
    if (Array.isArray(base)) return Array.isArray(overrides) ? overrides : base;
    if (!base || typeof base !== "object") return overrides !== undefined ? overrides : base;
    const result = { ...base };
    if (!overrides || typeof overrides !== "object") return result;

    Object.keys(overrides).forEach(key => {
      const bv = base[key];
      const ov = overrides[key];
      if (bv && typeof bv === "object" && !Array.isArray(bv) && ov && typeof ov === "object" && !Array.isArray(ov)) {
        result[key] = deepMerge(bv, ov);
      } else if (ov !== undefined) {
        result[key] = ov;
      }
    });
    return result;
  }

  async function load() {
    if (loaded) return cache;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      if (!configured()) {
        cache = clone(DEFAULT_DATA);
        loaded = true;
        notify();
        return cache;
      }

      try {
        const { data, error } = await client()
          .from(TABLE)
          .select("content")
          .eq("id", ROW_ID)
          .maybeSingle();

        if (error) throw error;

        if (data?.content) {
          // Merge so an older/partial Supabase record cannot blank the frontend.
          cache = deepMerge(clone(DEFAULT_DATA), data.content);
        } else {
          // Public visitors must never attempt the admin-only insert.
          cache = clone(DEFAULT_DATA);
        }

        loaded = true;
        notify();
        return cache;
      } catch (error) {
        console.error("Could not load portfolio data from Supabase:", error);
        cache = clone(DEFAULT_DATA);
        loaded = true;
        notify();
        return cache;
      }
    })();

    return loadPromise;
  }

  async function isAdmin() {
    if (!configured()) return false;

    const { data: sessionData, error: sessionError } = await client().auth.getSession();
    if (sessionError || !sessionData.session) return false;

    const userId = sessionData.session.user.id;
    const { data, error } = await client()
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Admin verification failed:", error);
      return false;
    }

    return !!data;
  }

  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mime = (parts[0].match(/:(.*?);/) || [, "image/jpeg"])[1];
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function isDataUrl(value) {
    return typeof value === "string" && value.startsWith("data:image/");
  }

  async function uploadDataUrl(dataUrl, folder) {
    const blob = dataUrlToBlob(dataUrl);
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await client().storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type,
      upsert: false,
      cacheControl: "31536000"
    });

    if (error) throw error;

    return client().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function moveImagesToStorage(data) {
    if (isDataUrl(data.personal?.photo)) {
      data.personal.photo = await uploadDataUrl(data.personal.photo, "profile");
    }

    for (const project of data.projects || []) {
      if (!Array.isArray(project.images)) continue;
      for (let i = 0; i < project.images.length; i++) {
        if (isDataUrl(project.images[i])) {
          project.images[i] = await uploadDataUrl(project.images[i], `projects/${project.id || "project"}`);
        }
      }
    }

    for (const item of data.experience || []) {
      if (!Array.isArray(item.images)) continue;
      for (let i = 0; i < item.images.length; i++) {
        if (isDataUrl(item.images[i])) {
          item.images[i] = await uploadDataUrl(item.images[i], `experience/${item.id || "experience"}`);
        }
      }
    }

    return data;
  }

  async function persist() {
    if (!configured()) throw new Error("Supabase is not configured. Check js/supabase-config.js.");
    if (!(await isAdmin())) throw new Error("This account is not authorized to manage the portfolio.");

    const payload = await moveImagesToStorage(clone(cache));
    const { error } = await client().from(TABLE).upsert({
      id: ROW_ID,
      content: payload,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

    if (error) throw error;

    cache = payload;
    loaded = true;
    notify();
    return cache;
  }

  async function update(mutator) {
    const previous = clone(cache);
    const next = clone(cache);
    mutator(next);
    cache = next;
    notify();

    try {
      return await persist();
    } catch (error) {
      cache = previous;
      notify();
      throw error;
    }
  }

  async function resetToDefaults() {
    const previous = clone(cache);
    cache = clone(DEFAULT_DATA);
    notify();
    try {
      return await persist();
    } catch (error) {
      cache = previous;
      notify();
      throw error;
    }
  }

  async function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup.");
    const previous = clone(cache);
    cache = deepMerge(clone(DEFAULT_DATA), parsed);
    notify();
    try {
      return await persist();
    } catch (error) {
      cache = previous;
      notify();
      throw error;
    }
  }

  function exportJSON() { return JSON.stringify(cache, null, 2); }

  function exportAsDataJs() {
    return "const DEFAULT_DATA = " + JSON.stringify(cache, null, 2) +
      ";\nif (typeof window !== 'undefined') window.DEFAULT_DATA = DEFAULT_DATA;\n";
  }

  function uid(prefix) {
    return `${prefix || "item"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getStorageUsageBytes() { return 0; }

  load();

  return {
    getData,
    onChange,
    load,
    update,
    resetToDefaults,
    importJSON,
    exportJSON,
    exportAsDataJs,
    uid,
    getStorageUsageBytes,
    isAdmin
  };
})();
