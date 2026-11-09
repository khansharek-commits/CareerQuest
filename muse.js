// =====================================================================
// CAREER QUEST: Lumi, your muse
// A small original chibi companion who hops along the bottom of the
// page, cheers when you finish quests, and nudges you when things wait.
// Loads after app.js and uses its helpers (state, readyQuestsNow...).
// =====================================================================

const Muse = (() => {
  const NAME = "Lumi";
  const root = document.getElementById("muse");
  const body = root.querySelector(".muse-body");
  const bubble = root.querySelector(".muse-bubble");
  let hideTimer = null;
  let lastSpoke = 0;
  let x = 0.9;       // position along the bottom of the screen, 0 = left, 1 = right
  let facing = -1;   // -1 faces left (towards the page), 1 faces right

  const pick = list => list[Math.floor(Math.random() * list.length)];
  const fill = (text, data) => text.replace(/\{(\w+)\}/g, (_, k) => data[k] ?? "");

  // ---- lines -----------------------------------------------------------
  const CHEERS = [
    "Yes! +{xp} {stat}!",
    "That's how knights are made!",
    "Another stone carried. Keep going!",
    "I knew you had it in you!",
    "Huzzah! {stat} grows stronger.",
    "Look at you go, Sharek!",
    "Quest complete! I'm writing this one down."
  ];
  const BOND_CHEERS = [
    "{bond} will remember that.",
    "That's what bonds are made of.",
    "Small gestures, big hearts. Well done."
  ];
  const CLICK_LINES = [
    "Hi! Need a push? Pick the smallest quest on the board.",
    "Tiny steps still count as steps!",
    "You don't have to finish today. You just have to start.",
    "Drink some water, brave one.",
    "I believe in you. Truly.",
    "Every King started as a Squire.",
    "One quest. Just one. Then see how you feel."
  ];

  // ---- body language ---------------------------------------------------
  function play(cls, ms) {
    body.classList.remove("hop", "cheer", "spin");
    void body.offsetWidth; // restart the animation
    body.classList.add(cls);
    setTimeout(() => body.classList.remove(cls), ms);
  }

  function say(text, ms = 6500) {
    if (!state.muse) return;
    bubble.innerHTML = `<b>${NAME}</b>${text}`;
    root.classList.add("is-talking");
    lastSpoke = Date.now();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => root.classList.remove("is-talking"), ms);
  }

  function place() {
    root.style.setProperty("--x", x);
    root.style.setProperty("--face", facing);
    root.classList.toggle("on-left", x < 0.5);
  }

  function hopTo(nx) {
    facing = nx < x ? -1 : 1;
    x = nx;
    place();
    play("hop", 700);
  }

  // Wander along the bottom; stays to the right on wide screens so she
  // doesn't sit over the stat menu.
  function wander() {
    if (!state.muse || document.hidden || root.classList.contains("is-talking")) return;
    const min = window.innerWidth > 820 ? 0.55 : 0.05;
    hopTo(min + Math.random() * (0.95 - min));
  }

  // ---- what she says -----------------------------------------------------
  function suggestion() {
    const slot = currentSlot();
    const ready = readyQuestsNow().filter(q => q.slot === slot && !q.trial);
    return ready.length ? pick(ready) : null;
  }

  function fadingBond() {
    const now = Date.now();
    return BONDS.map(b => ({ b, days: Math.floor((now - state.bonds[b].last) / DAY_MS) }))
      .filter(x => x.days >= 10)
      .sort((a, c) => c.days - a.days)[0];
  }

  function greet() {
    const slot = currentSlot();
    const n = readyQuestsNow().filter(q => q.slot === slot).length;
    const hello = { Morning: "Good morning, Sharek!", Day: "Afternoon check-in!", Evening: "Good evening, Sharek." }[slot];
    if (!n) return say(`${hello} Everything for the ${slot.toLowerCase()} is done. Rest well, knight.`);
    const q = suggestion();
    say(`${hello} ${n} ${slot.toLowerCase()} ${n === 1 ? "quest is" : "quests are"} ready.${q ? ` Why not start with <i>${q.title}</i>?` : ""}`, 9000);
  }

  function nudge() {
    if (!state.muse || document.hidden) return;
    if (Date.now() - lastSpoke < 3 * 60 * 1000) return;
    const bond = fadingBond();
    if (bond && Math.random() < 0.5) {
      play("hop", 700);
      return say(`${bond.b} hasn't heard from you in ${bond.days} days. A small gesture keeps the bond strong.`);
    }
    const q = suggestion();
    play("hop", 700);
    if (q) say(`Psst… <i>${q.title}</i> is ready. ${q.how.split(". ")[0]}.`, 9000);
    else say(pick(CLICK_LINES));
  }

  // Called by app.js when something happens.
  function react(kind, data = {}) {
    if (!state.muse) return;
    if (kind === "quest") { play("cheer", 1200); say(fill(pick(CHEERS), data)); }
    else if (kind === "bond") { play("cheer", 1200); say(fill(pick(BOND_CHEERS), data)); }
    else if (kind === "bondUp") { play("spin", 1400); say(`Your bond with ${data.bond} just reached rank ${data.rank}!`); }
    else if (kind === "trial") { play("spin", 1400); say(`A trial conquered! Now earn ${data.need} more XP and you'll be ${data.next}.`, 8000); }
    else if (kind === "awaits") { play("cheer", 1200); say(`You have the XP for ${data.next}! Now face the ${data.stat} trial.`, 8000); }
    else if (kind === "rankup") { play("spin", 1400); say(`${data.rank} of ${data.stat}! I'm so proud of you!`, 8000); }
    else if (kind === "undo") { say("No worries, it's undone."); }
  }

  body.addEventListener("click", () => {
    play("cheer", 1200);
    const quote = typeof dailyQuote === "function" && Math.random() < 0.35 ? dailyQuote() : null;
    say(quote ? `“${quote.text}”<br><small>${quote.by}</small>` : pick(CLICK_LINES), 8000);
  });

  function setVisible(on) {
    root.hidden = !on;
    if (on) { place(); setTimeout(greet, 600); }
  }

  place();
  root.hidden = !state.muse;
  if (state.muse) setTimeout(greet, 1500);
  setInterval(wander, 30 * 1000);
  setInterval(nudge, 60 * 1000);

  return { react, say, setVisible };
})();
