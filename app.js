// =====================================================================
// CAREER QUEST: game rules and screens
// quests.js loads first and provides SEASON_END, RANK_TITLES,
// RANK_THRESHOLDS, STATS, QUESTS, BONDS, BOND_THRESHOLDS, BOND_QUESTS.
// =====================================================================

const SAVE_KEY = "careerQuest.save.v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const DECAY_DAYS = 14;
const SLOTS = ["Morning", "Day", "Evening"];
const ROMAN = ["I", "II", "III", "IV", "V"];
const STAT_NAMES = Object.keys(STATS);
const KING = RANK_TITLES.length;
const TODAY = "Today"; // the board that gathers every ready quest

const QUEST_BY_ID = {};
QUESTS.concat(BOND_QUESTS).forEach(q => { QUEST_BY_ID[q.id] = q; });

// Heraldic charge drawn on each stat's and bond's shield.
const STAT_CHARGE = {
  Intelligence: "book", Expertise: "tower", Charisma: "sun", Leadership: "crown",
  Wisdom: "eye", Strength: "sword", Craft: "hammer", Influence: "key"
};
const BOND_CHARGE = { Girlfriend: "heart", Friends: "goblet", Family: "keep" };

const $ = sel => document.querySelector(sel);

let state = loadState();
let selectedStat = TODAY;
let slotFilter = "All";
let justDone = null;      // quest id to animate the stamp on
let undoSnapshot = null;  // state before the last completion
let toastTimer = null;
let splashTimer = null;
let afterSplash = null;
let quoteOffset = 0;     // how many times "Another" was pressed today
let animateBoard = true; // play card entrance animations on the next board draw

// ---------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------
function freshState() {
  const bonds = {};
  BONDS.forEach(b => { bonds[b] = { points: 0, last: Date.now(), decayed: 0 }; });
  return { log: [], bonds, sound: true, music: true, muse: true };
}

function loadState() {
  const s = freshState();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* no save yet */ }
  if (saved && Array.isArray(saved.log)) {
    s.log = saved.log;
    s.sound = saved.sound !== false;
    s.music = saved.music !== false;
    s.muse = saved.muse !== false;
    BONDS.forEach(b => { if (saved.bonds && saved.bonds[b]) s.bonds[b] = saved.bonds[b]; });
  }
  return s;
}

let saveWarned = false;
function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    if (!saveWarned) toast("This browser is blocking saves. Progress will be lost on refresh.");
    saveWarned = true;
  }
}

// ---------------------------------------------------------------------
// Stats and ranks
// ---------------------------------------------------------------------
function lastDone(id) {
  for (let i = state.log.length - 1; i >= 0; i--) {
    if (state.log[i].id === id) return state.log[i].at;
  }
  return null;
}

function statXP(stat) {
  return state.log.reduce((sum, entry) => {
    const q = QUEST_BY_ID[entry.id];
    return q && q.stat === stat ? sum + q.xp : sum;
  }, 0);
}

function trialFor(stat, rank) {
  return QUESTS.find(q => q.stat === stat && q.rank === rank && q.trial);
}

function trialDone(stat, rank) {
  const t = trialFor(stat, rank);
  return !!t && lastDone(t.id) !== null;
}

// A stat ranks up only with enough XP AND the current rank's trial done.
function statRank(stat) {
  const xp = statXP(stat);
  let rank = 1;
  while (rank < KING && xp >= RANK_THRESHOLDS[rank] && trialDone(stat, rank)) rank++;
  return rank;
}

function progress(stat) {
  const xp = statXP(stat);
  const rank = statRank(stat);
  if (rank === KING) {
    return { rank, xp, pct: 100, awaits: false, text: trialDone(stat, KING) ? "Crowned" : "Highest rank" };
  }
  const lo = RANK_THRESHOLDS[rank - 1];
  const hi = RANK_THRESHOLDS[rank];
  const next = RANK_TITLES[rank];
  if (xp >= hi) return { rank, xp, pct: 100, awaits: true, text: "Trial awaits" };
  const pct = Math.max(0, Math.min(100, ((xp - lo) / (hi - lo)) * 100));
  const prefix = trialDone(stat, rank) ? "Trial done · " : "";
  return { rank, xp, pct, awaits: false, text: `${prefix}${fmt(hi - xp)} XP to ${next}` };
}

// ---------------------------------------------------------------------
// Cooldowns
// ---------------------------------------------------------------------
function dayKey(d) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }

function weekStart(d) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); // back to Monday
  return s;
}

function periodKey(cooldown, d) {
  if (cooldown === "daily") return dayKey(d);
  if (cooldown === "weekly") return dayKey(weekStart(d));
  if (cooldown === "monthly") return `${d.getFullYear()}-${d.getMonth() + 1}`;
  return "once";
}

function isReady(q) {
  const at = lastDone(q.id);
  if (at === null) return true;
  return periodKey(q.cooldown, new Date(at)) !== periodKey(q.cooldown, new Date());
}

function readyText(q) {
  if (q.cooldown === "daily") return "Back tomorrow";
  if (q.cooldown === "weekly") return "Back Monday";
  if (q.cooldown === "monthly") {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return "Back " + first.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  return q.trial ? "Conquered" : "Complete";
}

const COOLDOWN_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", once: "One time" };

// ---------------------------------------------------------------------
// Bonds
// ---------------------------------------------------------------------
function bondRank(points) {
  let rank = 1;
  while (rank < BOND_THRESHOLDS.length && points >= BOND_THRESHOLDS[rank]) rank++;
  return rank;
}

// Lose 1 point per 14 days without a bond quest, never below the current rank's floor.
function applyBondDecay() {
  const now = Date.now();
  let changed = false;
  BONDS.forEach(b => {
    const bond = state.bonds[b];
    const periods = Math.floor((now - bond.last) / (DECAY_DAYS * DAY_MS));
    if (periods > bond.decayed) {
      const floor = BOND_THRESHOLDS[bondRank(bond.points) - 1];
      bond.points = Math.max(floor, bond.points - (periods - bond.decayed));
      bond.decayed = periods;
      changed = true;
    }
  });
  if (changed) saveState();
}

// ---------------------------------------------------------------------
// Completing quests
// ---------------------------------------------------------------------
function completeQuest(id) {
  const q = QUEST_BY_ID[id];
  if (!q || !isReady(q)) return;
  undoSnapshot = JSON.stringify(state);
  justDone = id;

  if (q.bond) {
    const bond = state.bonds[q.bond];
    const before = bondRank(bond.points);
    state.log.push({ id, at: Date.now() });
    bond.points += q.points;
    bond.last = Date.now();
    bond.decayed = 0;
    const after = bondRank(bond.points);
    saveState();
    render();
    if (after > before) {
      Sound.chime();
      toast(`Bond deepened · <b>${q.bond}</b> reached rank ${after}`, true);
      museReact("bondUp", { bond: q.bond, rank: after });
    } else {
      Sound.pluck();
      toast(`+${q.points} bond · <b>${q.bond}</b>`, true);
      museReact("bond", { bond: q.bond });
    }
    return;
  }

  const stat = q.stat;
  const before = progress(stat);
  state.log.push({ id, at: Date.now() });
  const after = progress(stat);
  saveState();
  render();

  if (after.rank > before.rank) {
    showRankUp(stat, after.rank);
  } else if (q.trial && after.rank < KING) {
    Sound.pluck();
    const need = RANK_THRESHOLDS[after.rank] - after.xp;
    toast(`Trial conquered! Earn <b>${fmt(need)} XP</b> more to become ${RANK_TITLES[after.rank]}.`, true);
    museReact("trial", { need: fmt(need), next: RANK_TITLES[after.rank] });
  } else if (after.awaits && !before.awaits) {
    Sound.pluck();
    toast(`<b>Trial awaits!</b> ${stat} has the XP for ${RANK_TITLES[after.rank]}.`, true);
    museReact("awaits", { stat, next: RANK_TITLES[after.rank] });
  } else {
    Sound.pluck();
    toast(`+${q.xp} XP · <b>${stat}</b>`, true);
    museReact("quest", { xp: q.xp, stat });
  }
}

function museReact(kind, data) {
  if (typeof Muse !== "undefined") Muse.react(kind, data);
}

function undo() {
  if (!undoSnapshot) return;
  state = JSON.parse(undoSnapshot);
  undoSnapshot = null;
  justDone = null;
  saveState();
  render();
  toast("Undone.");
  museReact("undo");
}

// ---------------------------------------------------------------------
// Drawing: shields and icons
// ---------------------------------------------------------------------
const CHARGES = {
  book: '<path d="M10 16 L20 19 L30 16 V31 L20 34 L10 31 Z"/><path class="cut" d="M20 19 V34"/>',
  tower: '<path d="M12 33 V18 H15 V14 H18 V18 H22 V14 H25 V18 H28 V33 Z"/><path class="cut" d="M17.5 33 V27 Q20 24 22.5 27 V33"/>',
  sun: '<circle cx="20" cy="23" r="5"/><path d="M20 12 L21.5 16.5 H18.5Z M20 34 L21.5 29.5 H18.5Z M9 23 L13.5 21.5 V24.5Z M31 23 L26.5 21.5 V24.5Z M12.2 15.2 L16.1 17 L14 19.1Z M27.8 15.2 L23.9 17 L26 19.1Z M12.2 30.8 L16.1 29 L14 26.9Z M27.8 30.8 L23.9 29 L26 26.9Z"/>',
  crown: '<path d="M11 31 V18 L16 23.5 L20 15 L24 23.5 L29 18 V31 Z"/><rect x="11" y="32.5" width="18" height="2.5"/>',
  eye: '<path d="M8 23 Q20 12 32 23 Q20 34 8 23 Z"/><circle class="cut-fill" cx="20" cy="23" r="4.5"/><circle cx="20" cy="23" r="2"/>',
  sword: '<path d="M20 10 L22.2 13.5 V27 H17.8 V13.5 Z"/><rect x="13" y="27" width="14" height="2.6"/><rect x="18.8" y="29.6" width="2.4" height="4.4"/><circle cx="20" cy="35.6" r="1.9"/>',
  hammer: '<path d="M12 14 H26 L28 16.5 V20 H12 Z"/><rect x="18.4" y="20" width="3.2" height="15"/>',
  key: '<circle cx="15" cy="17" r="5"/><circle class="cut-fill" cx="15" cy="17" r="2"/><path d="M17.8 20.6 L31 33.8 L29 35.8 L26.5 33.3 L24.8 35 L23 33.2 L24.7 31.5 L15.8 22.6 Z"/>',
  heart: '<path d="M20 34 C10 27 10 18 14.5 16.5 C17.5 15.5 19.4 17.5 20 19 C20.6 17.5 22.5 15.5 25.5 16.5 C30 18 30 27 20 34 Z"/>',
  goblet: '<path d="M13 13 H27 Q27 23 20 24.5 Q13 23 13 13 Z"/><rect x="19" y="24" width="2" height="7"/><path d="M14.5 34 Q20 30 25.5 34 Z"/>',
  keep: '<path d="M11 33 V20 L20 13 L29 20 V33 Z"/><path class="cut" d="M17.5 33 V27 Q20 24 22.5 27 V33"/>'
};

function shield(charge, tincture = "") {
  return `<svg class="shield ${tincture}" viewBox="0 0 40 48" aria-hidden="true">
    <path class="field" d="M4 4 H36 V22 C36 34 28 41 20 45 C12 41 4 34 4 22 Z"/>
    <path class="half" d="M20 4 H36 V22 C36 34 28 41 20 45 Z"/>
    <g class="charge">${CHARGES[charge] || CHARGES.sword}</g>
  </svg>`;
}

const SWORDS_ICON = `<svg class="swords" viewBox="0 0 32 32" aria-hidden="true">
  <g class="sw-a"><path d="M4 3 L7 3 L20 16 L18 18 L5 6 Z"/><path d="M23 17 L17 23 L18.5 24.5 L21 22 L25.5 26.5 L24.5 27.5 L26.5 29.5 L29.5 26.5 L27.5 24.5 L26.5 25.5 L22 21 L24.5 18.5 Z"/></g>
  <g class="sw-b"><path d="M28 3 L25 3 L12 16 L14 18 L27 6 Z"/><path d="M9 17 L15 23 L13.5 24.5 L11 22 L6.5 26.5 L7.5 27.5 L5.5 29.5 L2.5 26.5 L4.5 24.5 L5.5 25.5 L10 21 L7.5 18.5 Z"/></g>
  <circle class="spark" cx="16" cy="12" r="6"/>
</svg>`;
const LOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10 V7 a6 6 0 0 1 12 0 V10 H20 V22 H4 V10 Z M9 10 H15 V7 a3 3 0 0 0 -6 0 Z"/></svg>';

const SLOT_ICON = {
  Morning: '<svg viewBox="0 0 16 16" aria-hidden="true"><path class="ln" d="M1.5 12.5 H14.5 M4.5 12.5 a3.5 3.5 0 0 1 7 0 M8 4 V6.2 M3.2 6.6 L4.6 7.9 M12.8 6.6 L11.4 7.9"/></svg>',
  Day: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path class="ln" d="M8 1.5 V3.2 M8 12.8 V14.5 M1.5 8 H3.2 M12.8 8 H14.5 M3.4 3.4 L4.6 4.6 M11.4 11.4 L12.6 12.6 M12.6 3.4 L11.4 4.6 M4.6 11.4 L3.4 12.6"/></svg>',
  Evening: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 1.8 A6.4 6.4 0 1 0 14.2 11 A5.2 5.2 0 0 1 10.5 1.8 Z"/></svg>'
};

function statTincture(stat) {
  return STAT_NAMES.indexOf(stat) % 2 ? "sable" : "";
}

// ---------------------------------------------------------------------
// Drawing: screens
// ---------------------------------------------------------------------
function fmt(n) { return n.toLocaleString(); }
function plural(n, word) { return `${n} ${word}${n === 1 ? "" : "s"}`; }

function currentSlot(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Morning" : h < 17 ? "Day" : "Evening";
}

function slotOk(q) { return slotFilter === "All" || q.slot === slotFilter; }

function daysUntil(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - today) / DAY_MS);
}

function renderTop() {
  const now = new Date();
  $("#todayDate").textContent = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const left = daysUntil(SEASON_END);
  $("#countdown").innerHTML = left > 0
    ? `<b>${left}</b> ${left === 1 ? "day" : "days"} until the season ends`
    : left === 0 ? "<b>Final day</b> of the season" : "<b>Season over</b>";

  const nowSlot = currentSlot(now);
  $("#slots").innerHTML = ["All"].concat(SLOTS).map(s => `
    <button type="button" class="slot ${slotFilter === s ? "is-active" : ""} ${s === nowSlot ? "is-now" : ""}" data-slot="${s}" aria-pressed="${slotFilter === s}">
      ${s === "All" ? "All day" : s}${s === nowSlot ? "<small>Now</small>" : ""}
    </button>`).join("");

  const musicLabel = !state.music ? "off" : Sound.musicPlaying() ? "on" : "click to start";
  $("#musicBtn").textContent = "Music: " + musicLabel;
  $("#soundBtn").textContent = state.sound ? "Effects: on" : "Effects: off";
}

function renderSheet() {
  const renown = STAT_NAMES.reduce((sum, s) => sum + statRank(s), 0);
  const trials = QUESTS.filter(q => q.trial);
  const conquered = trials.filter(q => lastDone(q.id) !== null).length;
  $("#heroMeta").innerHTML = `
    <div class="gauge"><small>Renown</small><b>${renown}</b><span>/ ${STAT_NAMES.length * KING}</span></div>
    <div class="gauge"><small>Trials</small><b>${conquered}</b><span>/ ${trials.length}</span></div>`;

  const todayReady = readyQuestsNow().length;
  const todaySelected = selectedStat === TODAY;
  const todayItem = `<li style="--i:0">
      <button type="button" class="stat is-today ${todaySelected ? "is-selected" : ""}" data-stat="${TODAY}" aria-pressed="${todaySelected}">
        <span class="stat-word">Today</span>
        <span class="stat-tag"><b>${todayReady} ready</b> · ${doneToday().length} done</span>
        <span class="stat-next">Every quest you can do right now</span>
      </button>
    </li>`;

  $("#stats").innerHTML = todayItem + STAT_NAMES.map((stat, i) => {
    const p = progress(stat);
    const selected = stat === selectedStat;
    return `<li style="--i:${i + 1}">
      <button type="button" class="stat ${selected ? "is-selected" : ""} ${p.awaits ? "is-awaiting" : ""}" data-stat="${stat}" aria-pressed="${selected}">
        <span class="stat-word">${stat}</span>
        <span class="stat-tag"><b>${RANK_TITLES[p.rank - 1]}</b> · ${fmt(p.xp)} XP</span>
        <span class="bar"><span style="width:${p.pct}%"></span></span>
        <span class="stat-next">${p.text}</span>
      </button>
    </li>`;
  }).join("");
}

function questCard(q, currentRank, index, showOwner = false) {
  const ready = isReady(q);
  const reward = q.bond ? `+${q.points}<small>Bond</small>` : `+${q.xp}<small>XP</small>`;
  const owner = showOwner ? `<span class="chip owner">${q.stat || q.bond}</span>` : "";
  const title = q.title.replace(/^TRIAL:\s*/, "");
  let trialNote = "";
  if (q.trial) {
    trialNote = q.rank === KING ? "The final trial"
      : q.rank === currentRank ? `Defeat it to become ${RANK_TITLES[q.rank]}`
      : `Rank ${ROMAN[q.rank - 1]} trial`;
  }
  return `<article class="quest ${q.trial ? "trial" : "parchment"} ${q.bond ? "bond-quest" : ""} ${ready ? "" : "is-done"} ${justDone === q.id ? "just-done" : ""}" style="animation-delay:${index * 35}ms">
    ${q.trial ? `<div class="trial-banner">${SWORDS_ICON}<span>Trial</span><small>${trialNote}</small></div>` : ""}
    <div class="xp-tag">${reward}</div>
    <h4>${title}</h4>
    <p class="how">${q.how}</p>
    <div class="quest-foot">
      ${owner}<span class="chip">${SLOT_ICON[q.slot] || ""}${q.slot}</span>
      <span class="chip">${COOLDOWN_LABEL[q.cooldown]}</span>
      ${ready
        ? `<button type="button" class="act" data-complete="${q.id}">${q.trial ? "Face the trial" : "Complete"}</button>`
        : `<span class="cool">${readyText(q)}</span>`}
    </div>
    ${ready ? "" : `<div class="stamp">${q.trial ? "Conquered" : "Done"}</div>`}
  </article>`;
}

function readyQuestsNow() {
  const ready = [];
  STAT_NAMES.forEach(stat => {
    const rank = statRank(stat);
    QUESTS.forEach(q => { if (q.stat === stat && q.rank <= rank && isReady(q)) ready.push(q); });
  });
  BOND_QUESTS.forEach(q => { if (isReady(q)) ready.push(q); });
  return ready;
}

function doneToday() {
  const today = dayKey(new Date());
  return state.log.filter(e => dayKey(new Date(e.at)) === today);
}

// Same quote all day, a new one tomorrow; "Another" steps through the list.
function dailyQuote() {
  const now = new Date();
  const dayNumber = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / DAY_MS);
  return QUOTES[(dayNumber + quoteOffset) % QUOTES.length];
}

function counselCard() {
  if (typeof QUOTES === "undefined" || !QUOTES.length) return "";
  const q = dailyQuote();
  return `<figure class="counsel">
      <p class="eyebrow">Daily counsel</p>
      <blockquote>${q.text}</blockquote>
      <figcaption>${q.by}</figcaption>
      <button type="button" class="counsel-next" data-quote-next>Another</button>
    </figure>`;
}

function todayBoard() {
  const ready = readyQuestsNow();
  const done = doneToday();
  const xpToday = done.reduce((sum, e) => sum + ((QUEST_BY_ID[e.id] || {}).xp || 0), 0);
  const nowSlot = currentSlot();
  const pct = done.length + ready.length ? (done.length / (done.length + ready.length)) * 100 : 0;

  let html = `<header class="board-head">
      <div class="board-title">
        <p class="eyebrow">Quest board</p>
        <h2>Today</h2>
        <p class="desc">Every quest you can do right now, across all eight stats and your bonds.</p>
      </div>
      <div class="board-side">
        ${shield("sun", "")}
        <span class="board-tag">Now: ${nowSlot}</span>
        <div class="gauge"><small>Ready</small><b>${ready.length}</b><span></span></div>
        <div class="gauge"><small>Done today</small><b>${done.length}</b><span>+${fmt(xpToday)} XP</span></div>
      </div>
      <div class="board-progress">
        <span class="bar"><span style="width:${pct}%"></span></span>
        <small>${done.length ? `${plural(done.length, "quest")} done today. Keep the streak alive.` : "Nothing done yet today. Start with something small."}</small>
      </div>
    </header>`;

  let cardIndex = 0;
  SLOTS.filter(s => slotFilter === "All" || slotFilter === s).forEach(slot => {
    // Quick habits first, big trials last.
    const quests = ready.filter(q => q.slot === slot).sort((a, b) => (a.trial ? 1 : 0) - (b.trial ? 1 : 0));
    const cards = quests.map(q => questCard(q, q.stat ? statRank(q.stat) : 0, cardIndex++, true)).join("");
    html += `<section class="rank-block ${slot === nowSlot ? "is-current" : ""}">
      <h3 class="rank-head"><span class="roman slot-icon">${SLOT_ICON[slot]}</span>${slot}${slot === nowSlot ? "<em>Now</em>" : ""}<span class="rank-count">${quests.length ? `${quests.length} ready` : ""}</span></h3>
      <div class="quest-grid">${cards || `<p class="empty">Nothing left for the ${slot.toLowerCase()}. Well fought.</p>`}</div>
    </section>`;
  });
  return html;
}

function renderBoard() {
  if (selectedStat === TODAY) {
    const board = $("#board");
    board.classList.toggle("animate", animateBoard);
    animateBoard = false;
    board.innerHTML = todayBoard();
    return;
  }
  const stat = selectedStat;
  const p = progress(stat);
  const rank = p.rank;

  const unlocked = QUESTS.filter(q => q.stat === stat && q.rank <= rank);
  const readyCount = unlocked.filter(isReady).length;
  const nextXP = rank < KING ? RANK_THRESHOLDS[rank] : null;

  let html = `<header class="board-head">
      <div class="board-title">
        <p class="eyebrow">Quest board</p>
        <h2>${stat}</h2>
        <p class="desc">${STATS[stat]}</p>
      </div>
      <div class="board-side">
        ${shield(STAT_CHARGE[stat], statTincture(stat))}
        <span class="board-tag">${RANK_TITLES[rank - 1]}</span>
        <div class="gauge"><small>XP</small><b>${fmt(p.xp)}</b><span>${nextXP ? "/ " + fmt(nextXP) : ""}</span></div>
        <div class="gauge"><small>Ready</small><b>${readyCount}</b><span>/ ${unlocked.length}</span></div>
      </div>
      <div class="board-progress">
        <span class="bar"><span style="width:${p.pct}%"></span></span>
        <small>${p.text}</small>
      </div>
    </header>`;

  if (p.awaits) {
    const t = trialFor(stat, rank);
    html += `<p class="awaits-banner">Trial awaits! You have the XP for ${RANK_TITLES[rank]}. Conquer <em>${t.title.replace(/^TRIAL:\s*/, "")}</em> to rank up.</p>`;
  }

  // Current rank first, then the lower ranks you have already passed.
  let cardIndex = 0;
  for (let r = rank; r >= 1; r--) {
    const quests = QUESTS.filter(q => q.stat === stat && q.rank === r && slotOk(q));
    // Ready quests first (trial last among them), finished ones sink to the bottom.
    const order = q => (isReady(q) ? 0 : 2) + (q.trial ? 1 : 0);
    const sorted = quests.slice().sort((a, b) => order(a) - order(b));
    const ready = quests.filter(isReady).length;
    const cards = sorted.map(q => questCard(q, rank, cardIndex++)).join("");
    html += `<section class="rank-block ${r === rank ? "is-current" : ""}">
      <h3 class="rank-head"><span class="roman">${ROMAN[r - 1]}</span>${RANK_TITLES[r - 1]}${r === rank ? "<em>Current</em>" : ""}<span class="rank-count">${quests.length ? (ready ? `${ready} of ${quests.length} ready` : "All done for now") : ""}</span></h3>
      <div class="quest-grid">${cards || `<p class="empty">No ${slotFilter.toLowerCase()} quests at this rank.</p>`}</div>
    </section>`;
  }

  if (rank < KING) {
    const sealed = [];
    for (let r = rank + 1; r <= KING; r++) {
      const n = QUESTS.filter(q => q.stat === stat && q.rank === r).length;
      sealed.push(`<div class="sealed">
        <b>${LOCK_ICON}${RANK_TITLES[r - 1]}</b>
        <small>${plural(n, "quest")} sealed until you reach ${RANK_TITLES[r - 1]}</small>
      </div>`);
    }
    html += `<section class="rank-block">
      <h3 class="rank-head"><span class="roman">${LOCK_ICON.replace("<svg", '<svg width="16" height="16" fill="currentColor"')}</span>Sealed ranks</h3>
      <div class="sealed-row">${sealed.join("")}</div>
    </section>`;
  }

  const board = $("#board");
  board.classList.toggle("animate", animateBoard);
  animateBoard = false;
  board.innerHTML = html;
}

function renderBonds() {
  const now = Date.now();
  let cardIndex = 0;
  const sections = BONDS.map(b => {
    const bond = state.bonds[b];
    const rank = bondRank(bond.points);
    const maxRank = BOND_THRESHOLDS.length;
    const lo = BOND_THRESHOLDS[rank - 1];
    const hi = BOND_THRESHOLDS[rank];
    const pct = rank === maxRank ? 100 : ((bond.points - lo) / (hi - lo)) * 100;
    const days = Math.floor((now - bond.last) / DAY_MS);
    const fadeIn = DECAY_DAYS - (days % DECAY_DAYS);

    let note;
    if (bond.points === lo) note = days === 0 ? "Tended today" : `Last tended ${plural(days, "day")} ago · safe at this rank`;
    else note = `${days === 0 ? "Tended today" : `Last tended ${plural(days, "day")} ago`} · fades in ${plural(fadeIn, "day")}`;
    const warn = bond.points > lo && fadeIn <= 3;

    const all = BOND_QUESTS.filter(q => q.bond === b);
    const readyN = all.filter(isReady).length;
    const quests = all.filter(slotOk).sort((x, y) => (isReady(x) ? 0 : 1) - (isReady(y) ? 0 : 1));
    const pips = Array.from({ length: maxRank }, (_, i) => `<i class="${i < rank ? "on" : ""}"></i>`).join("");

    return `<section class="bond">
      <header class="bond-head">
        <h3>${b}</h3>
        ${shield(BOND_CHARGE[b] || "heart")}
      </header>
      <div class="bond-gauges">
        <span class="board-tag">Rank ${rank}<small> / ${maxRank}</small></span>
        <div class="gauge"><small>Bond</small><b>${bond.points}</b><span>${rank < maxRank ? "/ " + hi : ""}</span></div>
        <div class="gauge"><small>Ready</small><b>${readyN}</b><span>/ ${all.length}</span></div>
      </div>
      <div class="pips">${pips}</div>
      <span class="bar"><span style="width:${pct}%"></span></span>
      <p class="bond-note ${warn ? "warn" : ""}">${note}${rank < maxRank ? ` · ${plural(hi - bond.points, "point")} to rank ${rank + 1}` : ""}</p>
      <div class="bond-quests">${quests.map(q => questCard(q, 0, cardIndex++)).join("") || `<p class="empty">No ${slotFilter.toLowerCase()} quests.</p>`}</div>
    </section>`;
  }).join("");

  $("#bonds").innerHTML = `<h2 class="panel-title">Bonds<small>A bond fades 1 point every ${DECAY_DAYS} days without a bond quest.</small></h2>
    <div class="bond-list">${sections}</div>`;
}

function render() {
  renderTop();
  renderSheet();
  renderBoard();
  renderBonds();
}

// ---------------------------------------------------------------------
// Toast and RANK UP splash
// ---------------------------------------------------------------------
function toast(html, withUndo = false) {
  const el = $("#toast");
  el.innerHTML = `<span>${html}</span>${withUndo ? '<button type="button" data-undo>Undo</button>' : ""}`;
  el.classList.remove("show");
  void el.offsetWidth; // restart the slide-in
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), withUndo ? 6000 : 3500);
}

function buildShards(count) {
  const colors = ["var(--crimson)", "var(--gold)", "#000", "var(--crimson-deep)", "var(--parch)", "var(--gold-deep)"];
  const shapes = [
    "polygon(0 35%, 100% 0, 100% 60%, 0 100%)",
    "polygon(0 0, 100% 40%, 100% 100%, 0 55%)",
    "polygon(0 20%, 100% 0, 92% 100%, 4% 80%)",
    "polygon(6% 0, 100% 25%, 100% 75%, 0 100%)"
  ];
  let html = "";
  for (let i = 0; i < count; i++) {
    const top = Math.round((i / count) * 115 - 10 + ((i * 37) % 9));
    const height = 5 + ((i * 53) % 13);
    const rot = -26 + (i % 3) * 6;
    const from = i % 2 ? "130%" : "-130%";
    html += `<div class="shard" style="top:${top}%;height:${height}vh;--rot:${rot}deg;--from:${from};--delay:${(i * 0.045).toFixed(3)}s;background:${colors[i % colors.length]};clip-path:${shapes[i % shapes.length]}"></div>`;
  }
  return html;
}

function showRankUp(stat, rank) {
  const king = rank === KING;
  const el = $("#splash");
  el.className = "splash" + (king ? " king" : "");
  el.innerHTML = `
    <div class="flash"></div>
    ${king ? '<div class="rays"></div>' : ""}
    ${buildShards(king ? 18 : 10)}
    <div class="splash-core" role="alertdialog" aria-label="Rank up: ${stat} is now ${RANK_TITLES[rank - 1]}">
      <div class="splash-shield">${shield(king ? "crown" : STAT_CHARGE[stat], "or")}</div>
      <div class="splash-stat">${stat}</div>
      <div class="splash-title">Rank up</div>
      <div class="splash-rank">${RANK_TITLES[rank - 1]}</div>
      ${king ? `<div class="splash-sub">Long live the King of ${stat}</div>` : ""}
      <div class="splash-hint">Click anywhere to continue</div>
    </div>`;
  el.hidden = false;

  const seconds = state.sound ? Sound.fanfare(king) : 0;
  afterSplash = () => {
    toast(`<b>${stat}</b> is now ${RANK_TITLES[rank - 1]}.`, true);
    museReact("rankup", { stat, rank: RANK_TITLES[rank - 1] });
  };
  clearTimeout(splashTimer);
  splashTimer = setTimeout(closeSplash, Math.max(seconds * 1000 + 700, king ? 9000 : 5000));
}

function closeSplash() {
  const el = $("#splash");
  if (el.hidden) return;
  clearTimeout(splashTimer);
  el.hidden = true;
  el.innerHTML = "";
  Sound.stop();
  if (afterSplash) afterSplash();
  afterSplash = null;
}

// ---------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------
function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `career-quest-backup-${dayKey(new Date())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.log) || !data.bonds) throw new Error("not a backup");
      if (!confirm("Replace your current progress with this backup?")) return;
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      state = loadState();
      render();
      toast("Backup restored.");
    } catch (e) {
      toast("That file is not a Career Quest backup.");
    }
  };
  reader.readAsText(file);
}

// ---------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------
document.addEventListener("click", e => {
  const target = e.target.closest("[data-complete], [data-stat], [data-slot], [data-undo], [data-quote-next]");
  if (!target) return;
  if (target.dataset.complete) completeQuest(target.dataset.complete);
  else if (target.dataset.stat) {
    selectedStat = target.dataset.stat;
    justDone = null;
    animateBoard = true;
    render();
    if (window.innerWidth <= 820) $("#board").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (target.dataset.slot) {
    slotFilter = target.dataset.slot;
    justDone = null;
    animateBoard = true;
    render();
  } else if (target.hasAttribute("data-quote-next")) {
    quoteOffset++;
    const card = document.querySelector(".counsel");
    if (card) card.outerHTML = counselCard();
  } else if (target.hasAttribute("data-undo")) undo();
});

$("#splash").addEventListener("click", closeSplash);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSplash(); });

$("#soundBtn").addEventListener("click", () => {
  state.sound = !state.sound;
  Sound.setEnabled(state.sound);
  Sound.pluck(); // so you hear that effects are back on
  saveState();
  renderTop();
});

$("#musicBtn").addEventListener("click", () => {
  // If music is meant to be on but the browser held it back, just start it.
  if (state.music && Sound.musicPlaying()) {
    state.music = false;
    Sound.stopMusic();
  } else {
    state.music = true;
    Sound.startMusic();
  }
  saveState();
  renderTop();
});

// Browsers only allow sound after you interact with the page,
// so music starts on your first click anywhere.
document.addEventListener("pointerdown", e => {
  if (!state.music || Sound.musicPlaying() || e.target.closest("#musicBtn")) return;
  Sound.startMusic();
  setTimeout(renderTop, 50);
}, true);

$("#exportBtn").addEventListener("click", exportBackup);
$("#importInput").addEventListener("change", e => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
  e.target.value = "";
});

// Keep the date, slot, cooldowns and bond decay current while the page stays open.
let lastTick = dayKey(new Date()) + currentSlot();
setInterval(() => {
  applyBondDecay();
  const tick = dayKey(new Date()) + currentSlot();
  if (tick !== lastTick) {
    lastTick = tick;
    justDone = null;
    render();
  } else {
    renderTop();
    renderBonds();
  }
}, 60 * 1000);

Sound.setEnabled(state.sound);
applyBondDecay();
render();
