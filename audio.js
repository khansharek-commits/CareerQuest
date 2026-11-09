// =====================================================================
// CAREER QUEST: sounds
// Everything here is synthesised live with the Web Audio API.
// No audio files. The fanfare is an original acid jazz phrase:
// a squelchy bassline, bright chord stabs, swung drums and a
// harpsichord-like lead for a medieval feel.
// =====================================================================

const Sound = (() => {
  let ctx = null;
  let master = null;
  let bus = null;      // the fanfare currently playing, so it can be cut short
  let noise = null;    // one second of white noise, reused for drums
  let enabled = true;  // sound effects and fanfares

  // ---- setup ---------------------------------------------------------
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(comp).connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

  function filter(type, freq, q = 1, gain = 0) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    f.gain.value = gain;
    return f;
  }

  function osc(type, freq, start, stop, dest, level = 1, detune = 0) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = level;
    o.connect(g).connect(dest);
    o.start(start);
    o.stop(stop);
    return o;
  }

  function noiseHit(start, length, dest) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.connect(dest);
    src.start(start);
    src.stop(start + length + 0.05);
  }

  // ---- instruments ---------------------------------------------------

  // Harpsichord-like pluck: bright, nasal, fast decay.
  function harpsichord(out, t, midi, dur, vol = 0.11) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
    const hp = filter("highpass", 300);
    const nasal = filter("peaking", 3000, 1.5, 9);
    hp.connect(nasal).connect(g).connect(out);
    const end = t + dur + 0.45;
    osc("sawtooth", hz(midi), t, end, hp, 1);
    osc("square", hz(midi) * 2, t, end, hp, 0.3);
    osc("sawtooth", hz(midi), t, end, hp, 0.6, 8);
  }

  // Acid bass: resonant filter snapping shut on every note, plus a sub for punch.
  function bass(out, t, midi, dur) {
    const lp = filter("lowpass", 2600, 13);
    lp.frequency.setValueAtTime(2600, t);
    lp.frequency.exponentialRampToValueAtTime(260, t + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.14));
    lp.connect(g).connect(out);
    const end = t + Math.max(dur, 0.14) + 0.05;
    osc("sawtooth", hz(midi), t, end, lp, 1);
    osc("sine", hz(midi), t, end, g, 0.9);
  }

  // Chord stab: square + triangle, softened, slightly detuned for width.
  function stab(out, t, notes, dur, vol = 0.045) {
    dur = Math.max(dur, 0.15);
    const lp = filter("lowpass", 3600, 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.1);
    g.gain.setValueAtTime(vol * 0.55, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.14);
    lp.connect(g).connect(out);
    notes.forEach(m => {
      osc("square", hz(m), t, t + dur + 0.2, lp, 0.6, -6);
      osc("triangle", hz(m), t, t + dur + 0.2, lp, 1, 6);
    });
  }

  function kick(out, t, vol = 0.9) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.35);
  }

  function snare(out, t, vol = 0.28) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    const hp = filter("highpass", 1500);
    hp.connect(g).connect(out);
    noiseHit(t, 0.16, hp);
    const body = ctx.createGain();
    body.gain.setValueAtTime(vol * 0.7, t);
    body.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    body.connect(out);
    osc("triangle", 200, t, t + 0.1, body);
  }

  function hat(out, t, vol = 0.06, len = 0.04) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const hp = filter("highpass", 7500);
    hp.connect(g).connect(out);
    noiseHit(t, len, hp);
  }

  function crash(out, t, len = 1.6, vol = 0.16) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const hp = filter("highpass", 5000);
    hp.connect(g).connect(out);
    noiseHit(t, len, hp);
  }

  // ---- the composition -----------------------------------------------
  // Two bars, one chord every two beats.
  const PROGRESSION = [
    { root: 38, chord: [53, 57, 60, 64] }, // D minor 9
    { root: 43, chord: [53, 59, 64, 69] }, // G 13
    { root: 46, chord: [62, 65, 69, 72] }, // B-flat major 9
    { root: 45, chord: [55, 61, 64, 72] }  // A 7 sharp 9 (the tension before home)
  ];

  // Harpsichord lead over those two bars: [beat, note, length in beats]
  const LEAD = [
    [0, 81, .5], [.5, 79, .25], [.75, 81, .25], [1, 86, .5], [1.5, 84, .5],
    [2, 83, .5], [2.5, 79, .25], [2.75, 81, .25], [3, 83, .75],
    [4, 84, .5], [4.5, 81, .25], [4.75, 77, .25], [5, 86, .5], [5.5, 84, .5],
    [6, 85, .25], [6.25, 88, .25], [6.5, 91, .25], [6.75, 93, .25],
    [7, 91, .25], [7.25, 88, .25], [7.5, 85, .5]
  ];

  // Bass figure for each chord: [beat offset, semitones above root, length in beats]
  const BASS_FIGURE = [[0, 0, .35], [.75, 12, .2], [1.25, 0, .2], [1.5, 7, .15], [1.75, 10, .15]];

  // Home chord: D major 9, bright and triumphant.
  const HOME = [62, 66, 69, 73, 76];

  // King only: a rising cadence, B-flat then C, before landing on D.
  const CADENCE = [
    { root: 46, chord: [62, 65, 69, 74] },
    { root: 48, chord: [64, 67, 72, 74] }
  ];
  const CADENCE_LEAD = [
    [0, 86, .5], [.5, 89, .5], [1, 93, 1],
    [2, 88, .5], [2.5, 91, .5], [3, 96, .5], [3.5, 97, .5]
  ];

  function fanfare(king) {
    if (!enabled) return 0;
    const c = audio();
    if (!c) return 0;
    stop();
    bus = c.createGain();
    bus.connect(master);
    const out = bus;

    const secPerBeat = 60 / 118;
    const t0 = c.currentTime + 0.06;
    // Swing: every off-beat sixteenth lands a little late, for the groove.
    const at = beat => {
      const swung = Math.abs((beat % 0.5) - 0.25) < 0.001 ? 0.05 : 0;
      return t0 + (beat + swung) * secPerBeat;
    };
    const beats = n => n * secPerBeat;

    function drums(bar) {
      [0, .75, 2, 2.75].forEach(b => kick(out, at(bar + b)));
      [1, 3].forEach(b => snare(out, at(bar + b)));
      for (let b = 0; b < 4; b += .25) {
        if (b === 3.5) hat(out, at(bar + b), 0.07, 0.2);
        else hat(out, at(bar + b), b % .5 ? 0.04 : 0.07);
      }
    }

    function groove(start, chords) {
      chords.forEach((step, i) => {
        const s = start + i * 2;
        BASS_FIGURE.forEach(([off, interval, len]) => bass(out, at(s + off), step.root + interval, beats(len) + 0.05));
        stab(out, at(s), step.chord, beats(.4));
        stab(out, at(s + 1.25), step.chord, beats(.3), 0.035);
      });
      for (let bar = 0; bar < chords.length * 2; bar += 4) drums(start + bar);
    }

    function lead(start, notes, shift = 0, vol = 0.11) {
      notes.forEach(([b, m, len]) => harpsichord(out, at(start + b), m + shift, beats(len), vol));
    }

    let beat = 0;

    if (king) {
      // Drum fill and a rising harpsichord run to announce the crowning.
      kick(out, at(0));
      crash(out, at(0), 1.2, 0.12);
      [2, 2.5, 3, 3.25, 3.5, 3.75].forEach((b, i) => snare(out, at(b), 0.12 + i * 0.04));
      [62, 64, 65, 67, 69, 71, 72, 74].forEach((m, i) => harpsichord(out, at(i * .25), m, beats(.25), 0.09));
      beat = 4;
    }

    groove(beat, PROGRESSION);
    lead(beat, LEAD);
    beat += 8;

    if (king) {
      // Second time round: lead doubled an octave down for weight.
      groove(beat, PROGRESSION);
      lead(beat, LEAD);
      lead(beat, LEAD, -12, 0.07);
      beat += 8;
      groove(beat, CADENCE);
      lead(beat, CADENCE_LEAD);
      lead(beat, CADENCE_LEAD, -12, 0.07);
      [3, 3.5, 3.75].forEach(b => kick(out, at(beat + b)));
      beat += 4;
    }

    // Land on the home chord.
    const hold = king ? 2.8 : 1.6;
    kick(out, at(beat));
    crash(out, at(beat), king ? 3 : 1.8);
    bass(out, at(beat), 38, hold);
    stab(out, at(beat), HOME, hold, 0.06);
    const roll = king ? [62, 66, 69, 73, 74, 78, 81, 85, 86, 90, 93, 98] : [74, 78, 81, 85, 86, 90];
    roll.forEach((m, i) => harpsichord(out, at(beat) + i * (king ? 0.05 : 0.04), m, 1.2, 0.08));
    harpsichord(out, at(beat), king ? 98 : 90, hold, 0.1);

    if (king) {
      // A final punch after the ring-out.
      const end = beat + 3;
      kick(out, at(end));
      crash(out, at(end), 2.4, 0.18);
      bass(out, at(end), 38, 1.2);
      stab(out, at(end), [62, 66, 69, 74, 78], beats(1.5), 0.06);
      harpsichord(out, at(end), 86, 1.5, 0.1);
    }
    const length = king ? beats(beat + 6) : beats(beat + 3);
    duckMusic(length);
    return length;
  }

  // Short bright pluck for finishing a quest.
  function pluck() {
    if (!enabled) return;
    const c = audio();
    if (!c) return;
    const t = c.currentTime + 0.02;
    harpsichord(master, t, 74, 0.15, 0.16);
    harpsichord(master, t + 0.08, 81, 0.3, 0.16);
    stab(master, t + 0.08, [62, 66, 69], 0.15, 0.04);
  }

  // Warm arpeggio for bonds.
  function chime() {
    if (!enabled) return;
    const c = audio();
    if (!c) return;
    const t = c.currentTime + 0.02;
    [66, 69, 74, 78].forEach((m, i) => harpsichord(master, t + i * 0.09, m, 0.4, 0.14));
    stab(master, t, [57, 62, 66], 0.5, 0.025);
  }

  function stop() {
    unduckMusic();
    if (!bus) return;
    const old = bus;
    bus = null;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    setTimeout(() => old.disconnect(), 800);
  }

  function setEnabled(on) {
    enabled = on;
    if (!on) stop();
  }

  // =====================================================================
  // BACKGROUND MUSIC
  // An original lounge-jazz loop in E minor: 8 swung bars at 96 BPM,
  // electric piano chords, a round bassline, brushed drums, and a lead
  // that alternates between flute and harpsichord.
  // If a file called music.mp3 sits in this folder, that plays instead.
  // =====================================================================
  const MUSIC_BPM = 96;
  const MUSIC_LEVEL = 0.85;

  const SONG = [
    { root: 40, chord: [55, 59, 62, 66] }, // E minor 9
    { root: 33, chord: [55, 61, 66, 71] }, // A 13
    { root: 38, chord: [54, 57, 61, 64] }, // D major 9
    { root: 43, chord: [54, 59, 62, 69] }, // G major 9
    { root: 36, chord: [52, 59, 64, 66] }, // C major 7 sharp 11
    { root: 35, chord: [57, 63, 67, 74] }, // B 7 sharp 9
    { root: 40, chord: [55, 59, 62, 66] }, // E minor 9
    { root: 35, chord: [57, 63, 67, 74] }  // B 7 sharp 9 (turnaround)
  ];

  // Lead line across all 8 bars: [beat, note, length in beats]
  const MELODY = [
    [0, 71, .5], [.5, 74, .5], [1, 76, 1], [2.5, 78, .5], [3, 76, .5], [3.5, 74, .5],
    [4, 73, 1.5], [5.5, 71, .5], [6, 69, .5], [6.5, 71, .5], [7, 66, 1],
    [8.5, 69, .5], [9, 73, .5], [9.5, 76, .5], [10, 78, 1.5], [11.5, 76, .5],
    [12, 74, 1], [13, 71, .5], [13.5, 69, .5], [14, 71, 2],
    [16.5, 79, .5], [17, 78, .5], [17.5, 76, .5], [18, 71, 1], [19, 76, .5], [19.5, 78, .5],
    [20, 79, 1], [21, 78, .5], [21.5, 75, .5], [22, 71, 1], [23, 66, 1],
    [24.5, 76, .5], [25, 79, .5], [25.5, 83, .5], [26, 81, 1], [27, 78, .5], [27.5, 79, .5],
    [28, 76, 1.5], [29.5, 74, .5], [30, 75, 1], [31, 78, 1]
  ];

  let musicBus = null;
  let musicTimer = null;
  let nextBarTime = 0;
  let barIndex = 0;
  let duckTimer = null;

  const ownTrack = new Audio("music.mp3");
  ownTrack.loop = true;
  ownTrack.preload = "auto";
  let ownTrackReady = false;
  ownTrack.addEventListener("canplay", () => { ownTrackReady = true; });
  ownTrack.addEventListener("error", () => { ownTrackReady = false; });

  // Electric piano: a sine bent by another sine, giving a bell-like bark that mellows.
  function ePiano(out, t, midi, dur, vol = 0.035) {
    const f = hz(midi);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const mod = ctx.createOscillator();
    mod.frequency.value = f;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(f * 2.2, t);
    depth.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.5);
    mod.connect(depth).connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
    car.connect(g).connect(out);
    [car, mod].forEach(o => { o.start(t); o.stop(t + dur + 0.7); });
  }

  // Breathy flute: soft attack, gentle vibrato, a puff of air at the start.
  function flute(out, t, midi, dur, vol = 0.05) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.linearRampToValueAtTime(vol * 0.8, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    const lp = filter("lowpass", 2800);
    lp.connect(g).connect(out);
    const end = t + dur + 0.25;
    const tone = osc("triangle", hz(midi), t, end, lp, 1);
    osc("sine", hz(midi) * 2, t, end, lp, 0.15);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.2;
    const wobble = ctx.createGain();
    wobble.gain.value = 9;
    lfo.connect(wobble).connect(tone.detune);
    lfo.start(t);
    lfo.stop(end);
    const air = ctx.createGain();
    air.gain.setValueAtTime(vol * 0.5, t);
    air.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    const band = filter("bandpass", hz(midi) * 2, 1.5);
    band.connect(air).connect(out);
    noiseHit(t, 0.08, band);
  }

  // Round finger bass.
  function softBass(out, t, midi, dur) {
    const lp = filter("lowpass", 900, 2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.24, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    lp.connect(g).connect(out);
    osc("triangle", hz(midi), t, t + dur + 0.15, lp, 1);
    osc("sine", hz(midi), t, t + dur + 0.15, lp, 0.8);
  }

  function ride(out, t, vol = 0.025) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    const hp = filter("highpass", 6000);
    const ring = filter("peaking", 8500, 3, 6);
    hp.connect(ring).connect(g).connect(out);
    noiseHit(t, 0.3, hp);
  }

  function scheduleBar(i, t) {
    const spb = 60 / MUSIC_BPM;
    // Swung eighths: the "and" of each beat lands late, triplet style.
    const at = b => t + (b + (Math.abs((b % 1) - 0.5) < 0.001 ? 0.16 : 0)) * spb;
    const bar = SONG[i % SONG.length];
    const next = SONG[(i + 1) % SONG.length];
    const loop = Math.floor(i / SONG.length);
    const out = musicBus;

    // Bass: root, fifth, flat seventh, octave, then a step into the next chord.
    [[0, bar.root, .9], [1.5, bar.root + 7, .4], [2, bar.root + 10, .9], [3, bar.root + 12, .4], [3.5, next.root - 1, .4]]
      .forEach(([b, m, len]) => softBass(out, at(b), m, len * spb));

    // Electric piano comping, alternating two rhythms.
    const comp = i % 2 ? [[.5, .8], [2, 1.6]] : [[0, 1.4], [2.5, .9]];
    comp.forEach(([b, len]) => bar.chord.forEach(m => ePiano(out, at(b), m, len * spb)));

    // Brushed kit.
    [0, 1, 1.5, 2, 3, 3.5].forEach(b => ride(out, at(b), b % 1 ? 0.018 : 0.026));
    kick(out, at(0), 0.3);
    kick(out, at(2.5), 0.18);
    [1, 3].forEach(b => snare(out, at(b), 0.05));
    [1, 3].forEach(b => hat(out, at(b), 0.03));

    // Lead: flute, then harpsichord, then a loop off to let the groove breathe.
    const voice = loop % 3;
    if (voice === 2) return;
    const start = (i % SONG.length) * 4;
    MELODY.filter(([b]) => b >= start && b < start + 4).forEach(([b, m, len]) => {
      if (voice === 0) flute(out, at(b - start), m, len * spb);
      else harpsichord(out, at(b - start), m, len * spb, 0.06);
    });
  }

  function startMusic() {
    if (ownTrackReady) {
      ownTrack.volume = 0.6;
      ownTrack.play().catch(() => {});
      return;
    }
    const c = audio();
    if (!c || musicTimer) return;
    musicBus = c.createGain();
    musicBus.gain.setValueAtTime(0.0001, c.currentTime);
    musicBus.gain.exponentialRampToValueAtTime(MUSIC_LEVEL, c.currentTime + 1.5);
    musicBus.connect(master);
    nextBarTime = c.currentTime + 0.1;
    barIndex = 0;
    // Schedule a few seconds ahead so the music never stutters.
    const tick = () => {
      while (nextBarTime < ctx.currentTime + 2.5) {
        scheduleBar(barIndex++, nextBarTime);
        nextBarTime += 4 * 60 / MUSIC_BPM;
      }
    };
    tick();
    musicTimer = setInterval(tick, 250);
  }

  function stopMusic() {
    ownTrack.pause();
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (!musicBus) return;
    const old = musicBus;
    musicBus = null;
    old.gain.cancelScheduledValues(ctx.currentTime);
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => old.disconnect(), 3000);
  }

  function musicPlaying() {
    return !!musicTimer || !ownTrack.paused;
  }

  // Quiet the music while a fanfare plays, then bring it back.
  function duckMusic(seconds) {
    clearTimeout(duckTimer);
    ownTrack.volume = 0.08;
    if (musicBus) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0.03, ctx.currentTime, 0.1);
    }
    duckTimer = setTimeout(unduckMusic, seconds * 1000);
  }

  function unduckMusic() {
    clearTimeout(duckTimer);
    ownTrack.volume = 0.6;
    if (musicBus) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(MUSIC_LEVEL, ctx.currentTime, 0.5);
    }
  }

  return { fanfare, pluck, chime, stop, setEnabled, startMusic, stopMusic, musicPlaying };
})();
