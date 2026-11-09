// =====================================================================
// CLOUD SYNC: keeps your save in a private GitHub Gist so every device
// shares the same progress. Loads after app.js and uses its globals
// (state, SAVE_KEY, loadState, saveState, render, toast).
// =====================================================================

const CloudSync = (() => {
  const META_KEY = "careerQuest.sync.v1";
  const FILE = "career-quest-save.json";
  const API = "https://api.github.com";
  const PULL_EVERY_MS = 2 * 60 * 1000;

  let meta = readMeta();   // { token, gistId, seen, dirty }
  let pushTimer = null;
  let busy = null;         // the sync currently running, if any
  let status = meta.token ? "Connecting…" : "Off";
  let applyingRemote = false;

  function readMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* ignore */ }
  }
  function setStatus(s) {
    status = s;
    const el = document.getElementById("syncStatus");
    if (el) el.textContent = s;
    const btn = document.getElementById("syncBtn");
    if (btn) btn.textContent = meta.token ? "Cloud sync: on" : "Cloud sync: off";
    const top = document.getElementById("syncTopBtn");
    if (top) top.textContent = meta.token ? "Sync: on" : "Sync: off";
    const foot = document.getElementById("saveNote");
    if (foot) foot.textContent = meta.token
      ? "Progress syncs across your devices."
      : "Progress is saved in this browser.";
  }

  async function gh(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + meta.token,
        ...(opts.body ? { "Content-Type": "application/json" } : {})
      }
    });
    if (res.status === 401) throw new Error("auth");
    if (!res.ok) throw new Error("http " + res.status);
    return res.json();
  }

  // Find the save gist, or make one.
  async function ensureGist() {
    if (meta.gistId) return;
    for (let page = 1; page <= 10; page++) {
      const list = await gh(`/gists?per_page=100&page=${page}`);
      const hit = list.find(g => g.files && g.files[FILE]);
      if (hit) { meta.gistId = hit.id; writeMeta(); return; }
      if (list.length < 100) break;
    }
    const made = await gh("/gists", {
      method: "POST",
      body: JSON.stringify({
        description: "Career Quest save (synced by the game)",
        public: false,
        files: { [FILE]: { content: JSON.stringify({ updatedAt: 0, state: null }) } }
      })
    });
    meta.gistId = made.id;
    writeMeta();
  }

  async function readRemote() {
    const g = await gh(`/gists/${meta.gistId}`);
    const f = g.files && g.files[FILE];
    if (!f) return null;
    let text = f.content;
    if (f.truncated) text = await (await fetch(f.raw_url)).text();
    try {
      const data = JSON.parse(text);
      return data && data.state && Array.isArray(data.state.log) ? data : null;
    } catch (e) { return null; }
  }

  async function writeRemote(s) {
    const payload = { updatedAt: Date.now(), state: s };
    await gh(`/gists/${meta.gistId}`, {
      method: "PATCH",
      body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(payload) } } })
    });
    meta.seen = payload.updatedAt;
    meta.dirty = false;
    writeMeta();
  }

  // Both devices changed since they last agreed: keep every completed quest.
  function merge(local, remote) {
    const seen = new Set();
    const log = local.log.concat(remote.log).filter(e => {
      const k = e.id + "@" + e.at;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => a.at - b.at);
    const bonds = { ...remote.bonds };
    Object.keys(local.bonds || {}).forEach(b => {
      const l = local.bonds[b], r = remote.bonds && remote.bonds[b];
      if (!r) { bonds[b] = l; return; }
      const newer = l.last >= r.last ? l : r;
      bonds[b] = { ...newer, points: Math.max(l.points, r.points) };
    });
    return { ...local, log, bonds };
  }

  function adopt(s) {
    applyingRemote = true;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      state = loadState();
      saveState();
      render();
    } finally {
      applyingRemote = false;
    }
  }

  function hasProgress(s) {
    return s.log.length > 0 || Object.values(s.bonds).some(b => b.points > 0);
  }

  async function syncNow() {
    meta = readMeta(); // another tab may have connected or synced
    if (!meta.token) return;
    if (busy) return busy;
    clearTimeout(pushTimer);
    busy = (async () => {
      setStatus("Syncing…");
      try {
        await ensureGist();
        const remote = await readRemote();
        // A device joining for the first time with its own progress counts as changed.
        const localChanged = meta.dirty || (meta.seen == null && hasProgress(state));
        const remoteChanged = remote && remote.updatedAt !== meta.seen;

        if (!remote) {
          await writeRemote(state);
        } else if (localChanged && remoteChanged) {
          const merged = merge(JSON.parse(JSON.stringify(state)), remote.state);
          adopt(merged);
          await writeRemote(state);
        } else if (localChanged) {
          await writeRemote(state);
        } else if (remoteChanged) {
          adopt(remote.state);
          meta.seen = remote.updatedAt;
          meta.dirty = false;
          writeMeta();
        }
        setStatus("Synced " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      } catch (e) {
        if (e.message === "auth") {
          setStatus("Token rejected. Paste a new one.");
          toast("Cloud sync stopped: GitHub rejected the token.");
        } else {
          setStatus(navigator.onLine === false ? "Offline. Will sync when back online." : "Sync failed. Will retry.");
        }
      } finally {
        busy = null;
      }
    })();
    return busy;
  }

  // Called by saveState() in app.js after every local change.
  function changed() {
    if (applyingRemote) return;
    meta = readMeta();
    meta.dirty = true;
    writeMeta();
    if (!meta.token) return;
    setStatus("Waiting to sync…");
    clearTimeout(pushTimer);
    pushTimer = setTimeout(syncNow, 1500);
  }

  async function connect(token) {
    meta = { token: token.trim(), dirty: meta.dirty };
    writeMeta();
    await syncNow();
    if (status.startsWith("Synced")) toast("Cloud sync is on.");
  }

  function disconnect() {
    meta = { dirty: meta.dirty };
    writeMeta();
    setStatus("Off");
  }

  // ---- Dialog ----------------------------------------------------------
  function openDialog() {
    const d = document.getElementById("syncDialog");
    document.getElementById("syncConnected").hidden = !meta.token;
    document.getElementById("syncSetup").hidden = !!meta.token;
    document.getElementById("syncToken").value = "";
    setStatus(status);
    d.showModal();
  }

  function wire() {
    document.getElementById("syncBtn").addEventListener("click", openDialog);
    document.getElementById("syncTopBtn").addEventListener("click", openDialog);
    document.getElementById("syncClose").addEventListener("click", () => document.getElementById("syncDialog").close());
    document.getElementById("syncForm").addEventListener("submit", async e => {
      e.preventDefault();
      const t = document.getElementById("syncToken").value;
      if (!t.trim()) return;
      await connect(t);
      openDialog();
    });
    document.getElementById("syncNow").addEventListener("click", () => syncNow());
    document.getElementById("syncOff").addEventListener("click", () => {
      if (!confirm("Turn off cloud sync on this device? Your progress stays here and in the cloud.")) return;
      disconnect();
      openDialog();
    });

    document.addEventListener("visibilitychange", () => { if (!document.hidden) syncNow(); });
    window.addEventListener("online", () => syncNow());
    window.addEventListener("pagehide", () => { if (meta.dirty) syncNow(); });
    setInterval(() => { if (!document.hidden) syncNow(); }, PULL_EVERY_MS);

    setStatus(status);
    syncNow();
  }

  return { wire, changed, syncNow };
})();

CloudSync.wire();
