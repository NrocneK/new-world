/* Dị Môn — offline character motion playground. Source PNGs remain unchanged. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = 1280;
  const H = 720;
  const GROUND = 558;
  const START_X = 490;
  const TARGET_X = 858;
  const HERO_HEIGHT = 202;
  const HERO_HEAD_WIDTH = 132;
  const COMBO_CHAIN = ['attack1', 'attack2', 'attack3', 'attack4'];
  const COMBO_INPUT_WINDOW = 0.42;
  const WALK_SPEED = 235;
  const RUN_SPEED = 370;
  const JUMP_VELOCITY = -700;
  // Fists come from the intact drawings; box is the solid air-pressure core.
  // Local [left, top, right, bottom] bounds also drive gameplay, independent of VFX visibility.
  const MELEE_FX = {
    attack1: { contactFrame: 1, fist: [54, -70], box: [35,-109,185,-39], duration: .16, color: '#dcf4ed', impact: .20 },
    attack2: { contactFrame: 1, fist: [53, -73], box: [35,-123,205,-25], duration: .16, color: '#f2e8c9', impact: .22 },
    attack3: { contactFrame: 2, fist: [47, -117], box: [20,-232,155,-30], duration: .17, color: '#e2f6ed', impact: .24 },
    attack4: { contactFrame: 2, fist: [48, -13], box: [15,-95,240,0], duration: .21, color: '#f2dfb4', impact: .28 }
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const definitions = [
    ['idle', 'Đứng yên', 'move', '·', '—', 4, true],
    ['walk', 'Đi bộ', 'move', '↔', 'A/D', 10, true],
    ['run', 'Chạy nhanh', 'move', '»', 'SHIFT', 13, true],
    ['jump', 'Nhảy', 'move', '↥', 'SPACE', 9, false],
    ['doubleJump', 'Nhảy lần hai', 'move', '↟', 'SPACE ×2', 12.5, false],
    ['fall', 'Rơi', 'move', '↓', '—', 7, true],
    ['land', 'Tiếp đất', 'move', '⌄', '—', 11, false],
    ['dodge', 'Né', 'move', '⤳', 'K', 12, false],
    ['attack1', 'Đấm thẳng · Tay 1', 'combat', '✕', 'J · 1', 12, false],
    ['attack2', 'Đấm thẳng · Tay 2', 'combat', '✕', 'J · 2', 12, false],
    ['attack3', 'Đấm móc', 'combat', '↟', 'J · 3', 11, false],
    ['attack4', 'Đòn kết thúc', 'combat', '⌁', 'J · 4', 9, false],
    ['airAttack', 'Đá trên không', 'combat', '↝', 'J + ↥', 10, false],
    ['fire', 'Thi triển lửa', 'magic', '♨', 'U', 8, false],
    ['wind', 'Thi triển gió', 'magic', '≋', 'I', 8, false],
    ['hurt', 'Chịu đòn', 'react', '◇', 'H', 9, false],
    ['death', 'Gục ngã', 'react', '⏚', 'X', 6, false]
  ];
  const motions = new Map(definitions.map(([id, label, group, icon, key, fps, loop]) => [id, { id, label, group, icon, key, fps, loop, frames: [], blinkFrames: [] }]));
  const iconPaths = {
    idle: 'M6 12h12', walk: 'M3 12h18m-14-4-4 4 4 4m10-8 4 4-4 4',
    run: 'm4 6 6 6-6 6m9-12 6 6-6 6', jump: 'M12 20V4m-5 5 5-5 5 5',
    doubleJump: 'M7 20V4m-4 4 4-4 4 4M17 20V8m-3 3 3-3 3 3',
    fall: 'M12 4v16m-5-5 5 5 5-5', land: 'M4 20h16M12 3v12m-4-4 4 4 4-4',
    dodge: 'M3 16h6l5-8h7m-4-4 4 4-4 4',
    attack1: 'm5 5 14 14M5 19 19 5', attack2: 'm5 5 14 14M5 19 19 5',
    attack3: 'M6 20V9h12m-4-4 4 4-4 4', attack4: 'M4 5h5l3 12 3-12h5M5 21h14', airAttack: 'm3 18 6-6 10 3m-10-3 5-8m5 11 3 3',
    fire: 'M13 3c1 5 6 6 6 12a7 7 0 0 1-14 0c0-3 2-5 4-7-1 4 1 5 2 5 2-2 3-5 2-10Z',
    wind: 'M3 8h12c5 0 5-6 1-6M3 12h16c4 0 4 6 0 6M3 16h8c4 0 4 6 0 6',
    hurt: 'm12 3 9 9-9 9-9-9 9-9Z', death: 'M12 3v13M7 11l5 5 5-5M4 20h16'
  };
  const state = {
    ready: false, action: 'idle', frame: 0, actionTime: 0,
    x: START_X, y: GROUND, vy: 0, vx: 0, facing: 1, grounded: true,
    doubleJumpUsed: false, doubleJumpCount: 0,
    paused: false, speed: 1, hitCount: 0, effectsEnabled: true, mode: 'play',
    time: 0, actionEffectDone: false, combo: 0, comboQueued: 0, lastAttack: -10, attackHistory: [],
    sound: false, shake: 0, targetFlash: 0, targetKick: 0, stridePhase: 0, gaitPhase: 0, zoom: 1
  };
  let pages = [];
  let particles = [];
  let projectiles = [];
  let floating = [];
  let meleeImpacts = [];
  const fxCanvas = document.createElement('canvas');
  fxCanvas.width = W / 2; fxCanvas.height = H / 2;
  const fx = fxCanvas.getContext('2d');
  let activeGroup = 'all';
  let lastTime = 0;
  let uiTime = 0;
  let fpsTime = 0;
  let fpsFrames = 0;
  let fps = 60;
  let audio;
  const held = new Set();
  const touchHeld = new Set();
  const buttons = new Map();
  const frameButtons = [];
  const ambient = Array.from({ length: 30 }, (_, i) => ({ x: (i * 163 + 47) % W, y: (i * 73 + 81) % 510, size: i % 5 === 0 ? 3 : 2, phase: i * 1.7 }));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const moving = () => Number(held.has('right') || touchHeld.has('right')) - Number(held.has('left') || touchHeld.has('left'));
  const isAttack = (id) => id.startsWith('attack') || id === 'airAttack';
  const isGroundAttack = (id) => COMBO_CHAIN.includes(id);
  const isGait = (id) => id === 'walk' || id === 'run';
  const isBusy = () => !['idle', 'walk', 'run', 'jump', 'doubleJump', 'fall', 'land'].includes(state.action);

  function sound(kind) {
    if (!state.sound || !audio) return;
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const tones = { hit: [150, 55, 0.09], fire: [280, 85, 0.22], wind: [370, 650, 0.18], jump: [180, 300, 0.12], dodge: [100, 230, 0.07], menu: [460, 400, 0.045] };
    const [from, to, duration] = tones[kind] || tones.hit;
    osc.type = kind === 'wind' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.065, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t); osc.stop(t + duration + 0.015);
  }

  function notify(text) { $('statusText').textContent = text; }

  function action(id, force = false) {
    if (!motions.has(id) || (!force && state.action === id)) return;
    const wasStriding = state.action === 'walk' || state.action === 'run';
    if (!wasStriding || (id !== 'walk' && id !== 'run')) state.stridePhase = 0;
    state.gaitPhase = state.stridePhase;
    state.action = id;
    state.actionTime = 0;
    state.frame = 0;
    state.actionEffectDone = false;
    if (isAttack(id) && state.mode === 'play') {
      state.attackHistory.push(id);
      if (state.attackHistory.length > 16) state.attackHistory.shift();
    }
    uiTime = 1;
    updateSelection();
    renderFrameStrip();
  }

  function preview(id) {
    if (!state.ready || !motions.has(id)) return;
    held.clear(); touchHeld.clear();
    clearControlStyles();
    state.mode = 'preview';
    state.vx = 0; state.vy = 0; state.y = GROUND; state.grounded = true;
    state.doubleJumpUsed = false;
    state.comboQueued = 0; state.lastAttack = -10;
    state.stridePhase = 0; state.gaitPhase = 0;
    projectiles = []; meleeImpacts = [];
    action(id, true);
    notify('Xem động tác · Dùng phím để điều khiển');
    sound('menu');
  }

  function enterPlay() {
    if (state.mode !== 'play') {
      state.mode = 'play';
      if (state.grounded) action('idle', true);
      notify('Đang điều khiển · Tiến lại gần mục tiêu để đánh');
    }
  }

  function control(name) {
    if (!state.ready || state.paused) return;
    enterPlay();
    if (state.action === 'death') { notify('Nhấn R hoặc Làm lại để tiếp tục'); return; }
    if (name === 'jump' && state.grounded && !isBusy()) {
      state.comboQueued = 0; state.lastAttack = -10;
      // Carry launch velocity through the airborne animation, including kicks.
      const direction = moving();
      if (direction) state.facing = direction;
      state.vx = direction * (held.has('run') ? RUN_SPEED : WALK_SPEED);
      state.vy = JUMP_VELOCITY; state.grounded = false;
      state.doubleJumpUsed = false;
      action('jump', true); sound('jump');
    } else if (name === 'jump' && !state.grounded && !state.doubleJumpUsed && ['jump', 'fall', 'airAttack'].includes(state.action)) {
      state.doubleJumpUsed = true;
      state.doubleJumpCount++;
      // A second jump changes only vertical velocity. Horizontal movement
      // keeps following exactly the same input/momentum rules as the first.
      state.vy = JUMP_VELOCITY;
      state.comboQueued = 0; state.lastAttack = -10;
      action('doubleJump', true); sound('jump');
      notify('Nhảy lần hai · Tiếp đất để dùng lại');
    } else if (name === 'attack') {
      if (state.action === 'airAttack') return;
      if (isGroundAttack(state.action)) {
        // One input reserves exactly one subsequent strike, up to the finisher.
        const capacity = COMBO_CHAIN.length - 1 - state.combo;
        if (state.comboQueued < capacity) {
          state.comboQueued++;
          state.lastAttack = state.time;
        }
        return;
      }
      if (isBusy()) return;
      if (!state.grounded) {
        state.comboQueued = 0; state.lastAttack = -10;
        action('airAttack', true);
      }
      else {
        state.combo = state.time - state.lastAttack <= COMBO_INPUT_WINDOW && state.combo < 3 ? state.combo + 1 : 0;
        state.comboQueued = 0;
        state.lastAttack = state.time;
        action(COMBO_CHAIN[state.combo], true);
      }
      sound('hit');
    } else if (name === 'dodge' && state.grounded && !isBusy()) {
      state.comboQueued = 0; state.lastAttack = -10;
      action('dodge', true); sound('dodge');
    } else if (['fire', 'wind', 'hurt', 'death'].includes(name) && (!isBusy() || name === 'death' || name === 'hurt')) {
      state.comboQueued = 0; state.lastAttack = -10;
      action(name, true);
      if (name === 'fire' || name === 'wind') sound(name);
    }
  }

  function reset() {
    held.clear(); touchHeld.clear(); clearControlStyles();
    Object.assign(state, { time: 0, x: START_X, y: GROUND, vx: 0, vy: 0, grounded: true, facing: 1, paused: false, hitCount: 0, mode: 'play', combo: 0, comboQueued: 0, lastAttack: -10, attackHistory: [], shake: 0, targetFlash: 0, targetKick: 0, stridePhase: 0, gaitPhase: 0 });
    Object.assign(state, { doubleJumpUsed: false, doubleJumpCount: 0 });
    particles = []; projectiles = []; floating = []; meleeImpacts = [];
    action('idle', true);
    $('playPause').textContent = 'Tạm dừng';
    $('playPause').setAttribute('aria-pressed', 'false');
    $('hitCount').textContent = '0';
    notify('Sẵn sàng · Dùng phím hoặc nút bên dưới');
  }

  function clearControlStyles() {
    document.querySelectorAll('[data-control]').forEach((el) => el.classList.remove('is-active'));
  }

  function togglePause() {
    state.paused = !state.paused;
    const motion = motions.get(state.action);
    if (!state.paused && state.mode === 'preview' && !motion.loop && state.frame === motion.frames.length - 1) state.actionTime = 0;
    $('playPause').textContent = state.paused ? 'Tiếp tục' : 'Tạm dừng';
    $('playPause').setAttribute('aria-pressed', String(state.paused));
    notify(state.paused ? 'Đã tạm dừng · Chọn khung để xem kỹ' : state.mode === 'preview' ? 'Đang xem động tác' : 'Đang điều khiển');
  }

  function updateSelection() {
    for (const [id, button] of buttons) {
      const selected = id === state.action;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
  }

  function renderFrameStrip() {
    const motion = motions.get(state.action);
    if (!motion.frames.length) return;
    if (frameButtons.length !== motion.frames.length) {
      $('frameStrip').replaceChildren();
      frameButtons.length = 0;
      for (let i = 0; i < motion.frames.length; i++) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.frame = String(i);
        const thumb = document.createElement('canvas'); thumb.width = 56; thumb.height = 35; thumb.setAttribute('aria-hidden', 'true');
        button.append(thumb);
        button.addEventListener('click', () => {
          const current = motions.get(state.action);
          if (i >= current.frames.length) return;
          state.paused = true; state.mode = 'preview';
          state.frame = i; state.actionTime = (i + 0.05) / current.fps;
          state.gaitPhase = i / current.frames.length;
          $('playPause').textContent = 'Tiếp tục'; $('playPause').setAttribute('aria-pressed', 'true');
          notify('Đang xem khung ' + (i + 1) + ' / ' + current.frames.length);
          updateUI();
        });
        $('frameStrip').append(button); frameButtons.push(button);
      }
    }
    $('frameStrip').classList.toggle('is-extended', motion.frames.length > 4);
    frameButtons.forEach((button, i) => {
      const thumb = button.firstElementChild;
      const c = thumb.getContext('2d');
      c.clearRect(0, 0, thumb.width, thumb.height);
      c.imageSmoothingEnabled = false;
      const f = motion.frames[i];
      const scale = 16 / f.headWidth;
      c.drawImage(f.page.image, f.x, f.y, f.w, f.h, thumb.width / 2 - f.anchorX * scale, 33 - f.anchorY * scale, f.w * scale, f.h * scale);
      button.setAttribute('aria-label', motion.label + ' — khung ' + (i + 1));
    });
  }

  function buildControls() {
    document.querySelector('.motion-count').textContent = String(motions.size);
    for (const motion of motions.values()) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.motion = motion.id; button.dataset.group = motion.group;
      button.setAttribute('aria-pressed', 'false');
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', iconPaths[motion.id]); icon.append(path);
      const label = document.createElement('span'); label.className = 'motion-label'; label.textContent = motion.label;
      const key = document.createElement('small'); key.textContent = motion.key;
      button.append(icon, label, key);
      button.addEventListener('click', () => preview(motion.id));
      $('motionGrid').append(button); buttons.set(motion.id, button);
    }
    document.querySelectorAll('#motionTabs [data-group]').forEach((button) => {
      button.addEventListener('click', () => {
        activeGroup = button.dataset.group;
        document.querySelectorAll('#motionTabs [data-group]').forEach((tab) => {
          const selected = tab === button; tab.classList.toggle('is-active', selected); tab.setAttribute('aria-pressed', String(selected));
        });
        for (const [id, el] of buttons) el.hidden = activeGroup !== 'all' && motions.get(id).group !== activeGroup;
      });
    });
    $('playPause').addEventListener('click', togglePause);
    $('zoomToggle').addEventListener('click', () => {
      state.zoom = state.zoom === 1 ? 2 : 1;
      $('zoomToggle').setAttribute('aria-pressed', String(state.zoom === 2));
      $('zoomToggle').setAttribute('aria-label', state.zoom === 2 ? 'Trở về toàn cảnh' : 'Cận cảnh nhân vật');
    });
    $('resetButton').addEventListener('click', reset);
    $('speedControl').addEventListener('input', (event) => {
      state.speed = Number(event.target.value);
      $('speedValue').textContent = state.speed.toLocaleString('vi-VN') + '×';
    });
    $('effectsToggle').addEventListener('click', () => {
      state.effectsEnabled = !state.effectsEnabled;
      $('effectsToggle').setAttribute('aria-pressed', String(state.effectsEnabled));
      $('effectsToggle').setAttribute('aria-label', state.effectsEnabled ? 'Tắt hiệu ứng' : 'Bật hiệu ứng');
      if (!state.effectsEnabled) { particles = []; meleeImpacts = []; state.shake = 0; }
    });
    $('soundToggle').addEventListener('click', async () => {
      state.sound = !state.sound;
      if (state.sound) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (Audio) { audio ||= new Audio(); await audio.resume(); sound('menu'); }
        else state.sound = false;
      }
      $('soundToggle').setAttribute('aria-pressed', String(state.sound));
      $('soundToggle').setAttribute('aria-label', state.sound ? 'Tắt âm thanh' : 'Bật âm thanh');
      $('soundToggle').querySelector('path').setAttribute('d', state.sound ? 'M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14' : 'M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6');
    });
    $('helpToggle').addEventListener('click', () => {
      $('helpPanel').hidden = !$('helpPanel').hidden;
      $('helpToggle').setAttribute('aria-expanded', String(!$('helpPanel').hidden));
    });
    const keyboard = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyJ: 'attack', KeyK: 'dodge', KeyU: 'fire', KeyI: 'wind', KeyH: 'hurt', KeyX: 'death' };
    window.addEventListener('keydown', (event) => {
      const tag = event.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target.isContentEditable) return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.code === 'Escape') { $('helpPanel').hidden = true; $('helpToggle').setAttribute('aria-expanded', 'false'); return; }
      if (event.code === 'KeyR') { event.preventDefault(); if (!event.repeat) reset(); return; }
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') { held.add('run'); return; }
      const name = keyboard[event.code];
      if (!name) return;
      // Focused buttons retain standard keyboard activation with Space/Enter.
      if (tag === 'BUTTON' && event.code === 'Space') return;
      event.preventDefault();
      if (name === 'left' || name === 'right') {
        if (!state.paused) { enterPlay(); held.add(name); }
      } else if (!event.repeat) control(name);
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.delete('run');
      const name = keyboard[event.code];
      if (name === 'left' || name === 'right') held.delete(name);
    });
    const releaseAll = () => { held.clear(); touchHeld.clear(); clearControlStyles(); };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
    document.querySelectorAll('[data-control]').forEach((button) => {
      const name = button.dataset.control;
      let pointer = null;
      const release = (event) => {
        if (pointer !== null && event.pointerId !== undefined && pointer !== event.pointerId) return;
        pointer = null; touchHeld.delete(name); button.classList.remove('is-active');
      };
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (pointer !== null) return;
        pointer = event.pointerId; button.setPointerCapture(event.pointerId);
        button.classList.add('is-active');
        if (name === 'left' || name === 'right') { if (!state.paused) { enterPlay(); touchHeld.add(name); } }
        else control(name);
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      // Accessibility: Enter/Space and programmatic click have no pointer sequence.
      button.addEventListener('click', (event) => { if (event.detail === 0 && name !== 'left' && name !== 'right') control(name); });
      button.addEventListener('keydown', (event) => {
        if ((event.code === 'Space' || event.code === 'Enter') && (name === 'left' || name === 'right')) {
          event.preventDefault(); enterPlay(); touchHeld.add(name); button.classList.add('is-active');
        }
      });
      button.addEventListener('keyup', (event) => { if (event.code === 'Space' || event.code === 'Enter') release(event); });
    });
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));
  }

  function burst(x, y, color, amount = 12) {
    if (!state.effectsEnabled) return;
    for (let i = 0; i < amount; i++) {
      const angle = i * 2.399 + state.time;
      const speed = 35 + (i * 47) % 190;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 70, life: 0.3 + i % 4 * 0.08, max: 0.6, size: i % 3 + 2, color });
    }
  }

  function hitTarget(kind) {
    state.hitCount++; state.targetFlash = 0.25; state.targetKick = state.facing * (kind === 'wind' ? 15 : 7);
    if (!reducedMotion && state.effectsEnabled) state.shake = kind === 'attack4' ? 5 : 2.5;
    $('hitCount').textContent = String(state.hitCount);
    floating.push({ text: kind === 'wind' ? 'GIÓ' : kind === 'fire' ? 'LỬA' : 'TRÚNG ĐÒN', x: TARGET_X, y: GROUND - 160, life: 0.8, color: kind === 'wind' ? '#9cddd0' : '#f3c086' });
    if (MELEE_FX[kind]) {
      // The target's facing surface, rather than the center of its torso.
      const spec = MELEE_FX[kind];
      if (state.effectsEnabled) meleeImpacts.push({ kind, x: TARGET_X - state.facing * 32,
        y: GROUND - (kind === 'attack3' ? 120 : kind === 'attack4' ? 65 : 81),
        facing: state.facing, age: 0, duration: spec.impact });
      burst(TARGET_X - state.facing * 32, GROUND - 81, spec.color, kind === 'attack4' ? 14 : 6);
    } else burst(TARGET_X, GROUND - 93, kind === 'wind' ? '#96d8ca' : '#efba80');
    sound('hit');
  }

  function doActionEffect() {
    if (state.mode !== 'play' || state.actionEffectDone) return;
    state.actionEffectDone = true;
    const id = state.action;
    if (isAttack(id)) {
      const delta = TARGET_X - state.x, box = meleeBox(id);
      if (box ? box.x < TARGET_X + 32 && box.x + box.w > TARGET_X - 32 &&
          box.y < GROUND - 47 && box.y + box.h > GROUND - 139 :
          Math.abs(delta) < 145 && Math.sign(delta) === state.facing && Math.abs(state.y - GROUND) < 135) hitTarget(id);
      if (id === 'airAttack') burst(state.x + state.facing * 64, state.y - 86, '#dce8bd', 4);
    } else if (id === 'fire') {
      projectiles.push({ kind: 'fire', x: state.x + state.facing * 79, y: state.y - 90, vx: state.facing * 670, life: 1.4, size: 18 });
    } else if (id === 'wind') {
      projectiles.push({ kind: 'wind', x: state.x + state.facing * 88, y: state.y - 95, vx: state.facing * 820, life: 0.85, size: 29 });
      burst(state.x + state.facing * 80, state.y - 95, '#98d9ce', 8);
    }
  }

  function update(dt) {
    state.time += dt;
    state.actionTime += dt;
    const motion = motions.get(state.action);
    if (state.mode === 'preview') {
      // Preview repeats all motions, but lets defeat rest on its final frame.
      const count = motion.frames.length;
      if (isGait(state.action)) state.gaitPhase = (state.actionTime * motion.fps / count) % 1;
      state.frame = state.action === 'death' ? Math.min(count - 1, Math.floor(state.actionTime * motion.fps)) : Math.floor(state.actionTime * motion.fps) % count;
      return updateWorld(dt);
    }

    if (!state.grounded) {
      state.vy += 1850 * dt; state.y += state.vy * dt;
      if (state.vy > 0 && state.action === 'jump') action('fall');
      if (state.y >= GROUND && state.vy >= 0) {
        state.y = GROUND; state.vy = 0; state.grounded = true;
        state.doubleJumpUsed = false;
        if (['jump', 'fall', 'airAttack', 'doubleJump'].includes(state.action)) { action('land', true); burst(state.x, GROUND - 4, '#7e8e76', 6); }
      }
    }

    const direction = moving();
    if (!state.grounded) {
      // Attacking changes the pose, never the current ballistic path or momentum.
      if (direction) {
        if (!isBusy()) state.facing = direction;
        state.vx = direction * (held.has('run') ? RUN_SPEED : WALK_SPEED);
      }
    } else if (state.action === 'dodge') {
      state.vx = state.facing * 600 * Math.max(0.1, 1 - state.actionTime / 0.45);
    } else if (!isBusy()) {
      if (direction) state.facing = direction;
      state.vx = direction * (held.has('run') ? RUN_SPEED : WALK_SPEED);
    } else state.vx = 0;
    const previousX = state.x;
    state.x = clamp(state.x + state.vx * dt, 100, 1170);
    const traveled = Math.abs(state.x - previousX);
    // A step advances with real travel, rather than cycling against a wall.
    if (state.grounded && (state.action === 'walk' || state.action === 'run')) {
      const strideLength = state.action === 'run' ? 228 : 188;
      state.stridePhase = (state.stridePhase + traveled / strideLength) % 1;
      state.gaitPhase = state.stridePhase;
    }
    const effectiveDirection = traveled > 0.001 ? direction : 0;

    const contactFrame = MELEE_FX[state.action]?.contactFrame ?? (state.action === 'airAttack' ? 1 : 2);
    if ((isAttack(state.action) || state.action === 'fire' || state.action === 'wind') && state.actionTime >= contactFrame / motions.get(state.action).fps) doActionEffect();
    const current = motions.get(state.action);
    const count = current.frames.length;
    state.frame = (state.action === 'walk' || state.action === 'run')
      ? Math.floor(state.stridePhase * count) % count
      : current.loop ? Math.floor(state.actionTime * current.fps) % count : Math.min(count - 1, Math.floor(state.actionTime * current.fps));
    if (!current.loop && state.actionTime >= count / current.fps && state.action !== 'death' && state.action !== 'jump') {
      if (isGroundAttack(state.action) && state.comboQueued > 0 && state.combo < 3 && state.grounded) {
        state.comboQueued--;
        state.combo++;
        action(COMBO_CHAIN[state.combo], true); sound('hit');
      } else {
        state.comboQueued = 0;
        action(state.grounded ? direction ? held.has('run') ? 'run' : 'walk' : 'idle' : 'fall', true);
      }
    }
    if (state.grounded && ['idle', 'walk', 'run'].includes(state.action)) {
      action(effectiveDirection ? held.has('run') ? 'run' : 'walk' : 'idle');
    }
    updateWorld(dt);
  }

  function updateWorld(dt) {
    for (const impact of meleeImpacts) impact.age += dt;
    meleeImpacts = meleeImpacts.filter(impact => impact.age < impact.duration);
    state.shake = Math.max(0, state.shake - dt * 22);
    state.targetFlash = Math.max(0, state.targetFlash - dt);
    state.targetKick *= Math.exp(-dt * 16);
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 230 * dt; }
    particles = particles.filter((p) => p.life > 0);
    for (const f of floating) { f.life -= dt; f.y -= dt * 32; }
    floating = floating.filter((f) => f.life > 0);
    for (const p of projectiles) {
      const previousX = p.x;
      p.x += p.vx * dt; p.life -= dt;
      // Swept collision prevents fast projectiles skipping over the target.
      if ((previousX - TARGET_X) * (p.x - TARGET_X) <= 0 && Math.abs(p.y - (GROUND - 90)) < 100 && p.life > 0) { hitTarget(p.kind); p.life = 0; }
    }
    projectiles = projectiles.filter((p) => p.life > 0 && p.x > -80 && p.x < W + 80);
  }

  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function line(x1, y1, x2, y2, color, width = 1) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function text(value, x, y, size = 12, color = '#849285', align = 'left') {
    ctx.font = size + 'px Consolas, monospace'; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y);
  }

  function drawScene() {
    rect(0, 0, W, H, '#111a1b');
    const sky = ctx.createLinearGradient(0, 0, 0, 475);
    sky.addColorStop(0, '#111b20'); sky.addColorStop(1, '#263335');
    ctx.fillStyle = sky; ctx.fillRect(47, 65, 1187, 450);
    ctx.fillStyle = '#bbc7a1'; ctx.beginPath(); ctx.arc(349, 168, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#263337'; ctx.beginPath(); ctx.arc(366, 156, 33, 0, Math.PI * 2); ctx.fill();
    // The city outside the office: rectilinear silhouettes and sparse lit windows.
    for (let i = 0; i < 17; i++) {
      const x = 52 + i * 74;
      const height = 76 + (i * 47) % 160;
      rect(x, 470 - height, 60, height, i % 2 ? '#19272b' : '#1c2b2f');
      for (let j = 0; j < 4; j++) for (let k = 0; k < 3; k++) {
        if ((i + j * 2 + k) % 4 === 0) rect(x + 10 + k * 15, 486 - height + j * 27, 4, 9, '#6f77604d');
      }
    }
    rect(0, 0, W, 63, '#131b1d'); rect(0, 487, W, 73, '#172224');
    rect(0, 60, W, 7, '#35403a'); rect(0, 70, W, 2, '#b6b58c25');
    rect(49, 68, 7, 420, '#3e4943'); rect(1230, 68, 7, 420, '#3e4943');
    for (const x of [273, 520, 768, 1016]) { rect(x, 68, 8, 420, '#323e3b'); rect(x + 8, 68, 2, 420, '#0b171b'); }
    rect(50, 312, 1187, 6, '#34413d'); rect(50, 484, 1187, 7, '#485348');
    // Ceiling fixtures, cables and the evacuated office.
    for (const x of [175, 621, 1080]) {
      rect(x, 0, 2, 68, '#42504a'); rect(x - 45, 62, 94, 8, '#535f4f');
      rect(x - 39, 70, 80, 3, '#d2cd9b');
    }
    rect(58, 419, 174, 13, '#536051'); rect(72, 432, 7, 112, '#34433d'); rect(211, 432, 7, 112, '#34433d');
    rect(104, 368, 67, 42, '#101b1f'); rect(108, 372, 59, 33, '#2c433f'); rect(131, 410, 10, 9, '#3c4b40');
    rect(140, 382, 3, 11, '#b5cb8e'); rect(114, 382, 20, 2, '#5c7965'); rect(114, 390, 14, 2, '#5c7965');
    rect(67, 417, 15, 4, '#bac1a2');
    rect(296, 512, 38, 39, '#23312c'); rect(300, 515, 30, 3, '#475142');
    rect(304, 523, 23, 19, '#192823'); line(303, 523, 325, 542, '#46513e');
    // Dim scratches and structural seams make the room feel inhabited.
    for (let i = 0; i < 10; i++) rect(71 + i * 113, 500 + i % 3 * 12, 21 + i % 3 * 5, 1, '#53614d30');
    drawPortal();
    rect(0, GROUND - 3, W, 6, '#667358'); rect(0, GROUND + 3, W, 8, '#28372e');
    const floor = ctx.createLinearGradient(0, GROUND + 11, 0, H);
    floor.addColorStop(0, '#1a2823'); floor.addColorStop(1, '#131d1a');
    ctx.fillStyle = floor; ctx.fillRect(0, GROUND + 11, W, H - GROUND);
    for (let x = -50; x < W + 100; x += 100) line(x, GROUND + 12, (x - W / 2) * 1.5 + W / 2, H, '#30403170');
    for (const y of [596, 650, 714]) line(0, y, W, y, '#30403170');
    for (const x of [100, 1160]) { rect(x, GROUND + 24, 3, 20, '#74825c'); rect(x + 7, GROUND + 24, 3, 20, '#74825c'); }
    text('07', 65, 137, 18, '#66765c'); text('THOÁT HIỂM', 94, 137, 10, '#738466');
    line(69, 149, 192, 149, '#56654f');
    text('CỔNG 01 / CHƯA ỔN ĐỊNH', 1052, 605, 10, '#7c9b94', 'center');
    text('A / D  DI CHUYỂN', 74, 676, 11, '#62745f');
    text('J  CẬN CHIẾN     U / I  NGUYÊN TỐ', 1205, 676, 11, '#62745f', 'right');
    if (state.effectsEnabled) for (const p of ambient) {
      const t = reducedMotion ? 0 : state.time;
      const y = 65 + ((p.y - t * (4 + p.size) + 500) % 440 + 440) % 440;
      ctx.globalAlpha = 0.18 + Math.sin(p.phase + t) * 0.1;
      rect(p.x, y, p.size, p.size, '#d6d7a8');
    }
    ctx.globalAlpha = 1;
  }

  function drawPortal() {
    const x = 1070, y = 336;
    rect(x - 94, 126, 12, 428, '#263336'); rect(x + 81, 126, 12, 428, '#263336');
    rect(x - 95, 126, 189, 13, '#4c615b'); rect(x - 95, 546, 189, 8, '#4c615b');
    ctx.fillStyle = '#101e25'; ctx.beginPath(); ctx.ellipse(x, y, 73, 197, 0, 0, Math.PI * 2); ctx.fill();
    const time = state.effectsEnabled && !reducedMotion ? state.time : 0;
    const glow = ctx.createRadialGradient(x, y, 12, x, y, 193);
    glow.addColorStop(0, '#243c4a'); glow.addColorStop(0.48, '#1d3642'); glow.addColorStop(1, '#476a6500');
    ctx.fillStyle = glow; ctx.fillRect(x - 140, 135, 280, 410);
    ctx.save(); ctx.translate(x, y);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = i % 2 ? '#8bc2af' : '#577f8f'; ctx.globalAlpha = 0.3 + i * 0.09; ctx.lineWidth = i === 4 ? 2 : 1;
      ctx.beginPath(); ctx.ellipse(0, 0, 52 + i * 5, 169 + i * 5, Math.sin(time * 0.2 + i) * 0.025, time * 0.3 + i * 0.6, time * 0.3 + i * 0.6 + Math.PI * 1.6); ctx.stroke();
    }
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + time * 0.26;
      rect(Math.cos(a) * 71, Math.sin(a) * 185, 3, 7, '#a1d1bb');
    }
    ctx.restore();
  }

  function drawTarget() {
    const x = TARGET_X + state.targetKick;
    ctx.fillStyle = '#07130f88'; ctx.beginPath(); ctx.ellipse(TARGET_X, GROUND + 8, 52, 9, 0, 0, Math.PI * 2); ctx.fill();
    rect(x - 24, GROUND - 5, 48, 6, '#566050');
    rect(x - 5, GROUND - 114, 10, 109, '#475348');
    rect(x - 31, GROUND - 109, 62, 62, state.targetFlash > 0 ? '#b58d59' : '#35483d');
    rect(x - 35, GROUND - 105, 5, 48, '#56634d'); rect(x + 30, GROUND - 105, 5, 48, '#56634d');
    rect(x - 20, GROUND - 139, 40, 30, state.targetFlash > 0 ? '#d2bd8b' : '#465a48');
    rect(x - 13, GROUND - 130, 26, 4, '#121f1b');
    ctx.strokeStyle = state.targetFlash > 0 ? '#fff2c3' : '#c4a46e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, GROUND - 81, 14, 0, Math.PI * 2); ctx.stroke();
    rect(x - 3, GROUND - 84, 6, 6, '#cbb681');
    text('MỤC TIÊU TẬP', TARGET_X, GROUND + 34, 10, '#8c9c7b', 'center');
  }

  function renderedFrame() {
    const motion = motions.get(state.action);
    const cycle = Math.floor(state.time * motion.fps / motion.frames.length);
    if (motion.blink && cycle % motion.blink.everyCycles === motion.blink.cycleOffset && motion.blink.poses.includes(state.frame)) {
      const blink = motion.blinkFrames.find(f => f.order === state.frame);
      if (blink) return blink;
    }
    return motion.frames[state.frame];
  }

  function drawHero() {
    const f = renderedFrame();
    if (!f) return;
    // One uniform scale on the intact drawing, calibrated independently per frame.
    const scale = HERO_HEAD_WIDTH / f.headWidth;
    let y = state.y;
    if (state.mode === 'preview') {
      if (state.action === 'jump') y -= [0, 24, 62, 80][state.frame];
      if (state.action === 'fall') y -= [75, 53, 30, 10][state.frame];
      if (state.action === 'airAttack') y -= 65;
      if (state.action === 'doubleJump') y -= 90;
    }
    const airborne = Math.max(0, GROUND - y);
    ctx.fillStyle = '#06110b70'; ctx.beginPath(); ctx.ellipse(state.x, GROUND + 5, Math.max(16, 43 - airborne * 0.07), 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(Math.round(state.x), Math.round(y)); ctx.scale(state.facing, 1);
    ctx.imageSmoothingEnabled = false;
    // Draw the complete original character frame; no separated body parts.
    ctx.drawImage(f.page.image, f.x, f.y, f.w, f.h, -f.anchorX * scale, -f.anchorY * scale, f.w * scale, f.h * scale);
    ctx.restore();
    const spiritX = state.x - state.facing * 91;
    const spiritY = y - HERO_HEIGHT + 35 + (reducedMotion ? 0 : Math.sin(state.time * 2.2) * 7);
    if (state.effectsEnabled) {
      const glow = ctx.createRadialGradient(spiritX, spiritY, 0, spiritX, spiritY, 31);
      glow.addColorStop(0, '#e2edab88'); glow.addColorStop(1, '#c0dd8f00'); ctx.fillStyle = glow; ctx.fillRect(spiritX - 32, spiritY - 32, 64, 64);
    }
    rect(spiritX - 4, spiritY - 4, 8, 8, '#cce69e'); rect(spiritX - 2, spiritY - 2, 4, 4, '#f2ffd5');
    text('NHÂN VIÊN 01', state.x, GROUND + 34, 10, '#c5d5a3', 'center');
    if (state.mode === 'play' && isAttack(state.action) && state.grounded) text('ĐÒN 0' + (state.combo + 1), state.x, y - HERO_HEIGHT - 17, 10, '#d4e6ae', 'center');
  }

  function meleeBox(kind = state.action) {
    const spec = MELEE_FX[kind]; if (!spec) return null;
    const [left, top, right, bottom] = spec.box;
    return { x: state.x + (state.facing > 0 ? left : -right), y: state.y + top,
      w: right - left, h: bottom - top };
  }

  function meleeTrail() {
    const spec = MELEE_FX[state.action];
    if (!spec || !state.effectsEnabled) return null;
    const motion = motions.get(state.action);
    const time = state.mode === 'preview' ? state.actionTime % (motion.frames.length / motion.fps) : state.actionTime;
    const age = time - spec.contactFrame / motion.fps;
    const lead = state.action === 'attack3' ? .10 : state.action === 'attack4' ? .08 : .04;
    if (age < -lead || age >= spec.duration) return null;
    const active = age >= 0 && age < 1 / motion.fps;
    return { kind: state.action, age, lead, duration: spec.duration, active, box: active ? meleeBox() : null,
      x: state.x + state.facing * spec.fist[0], y: state.y + spec.fist[1], facing: state.facing };
  }

  function pixelEffect(paint) {
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    fx.save(); fx.scale(.5, .5); paint(); fx.restore();
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fxCanvas, 0, 0, W, H); ctx.restore();
  }

  function fxShape(points, color) {
    fx.fillStyle = color; fx.beginPath();
    points.forEach(([x, y], i) => i ? fx.lineTo(x, y) : fx.moveTo(x, y));
    fx.closePath(); fx.fill();
  }

  function fxLine(points, color, width = 2) {
    fx.strokeStyle = color; fx.lineWidth = width; fx.beginPath();
    points.forEach(([x, y], i) => i ? fx.lineTo(x, y) : fx.moveTo(x, y)); fx.stroke();
  }

  function fxArc(cx, cy, rx, ry, start, end, width, color) {
    const points = [], steps = 12;
    for (let i = 0; i <= steps; i++) {
      const angle = start + (end - start) * i / steps;
      points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
    }
    for (let i = steps; i >= 0; i--) {
      const angle = start + (end - start) * i / steps;
      points.push([cx + Math.cos(angle) * (rx - width), cy + Math.sin(angle) * (ry - width)]);
    }
    fxShape(points, color);
  }

  function drawMeleeTrails() {
    const trail = meleeTrail(); if (!trail) return;
    pixelEffect(() => {
      const { kind, age, lead, duration } = trail, spec = MELEE_FX[kind];
      const progress = clamp(age / duration, 0, 1), q = reducedMotion ? .2 : progress;
      fx.translate(Math.round(state.x / 2) * 2, Math.round(state.y / 2) * 2); fx.scale(state.facing, 1);
      fx.globalAlpha = age < 0 ? .7 * (1 + age / lead) : (1 - progress) ** .65;
      if (age < 0) {
        // Small compression at the hand; the long damaging core starts at contact.
        const [x,y] = spec.fist;
        fxArc(x - 5, y, 18, 24, -.9, .9, 4, '#c3e7e5');
        fxLine([[x-24,y-10],[x-5,y-6]], '#e5f5ea', 3);
        fxLine([[x-24,y+10],[x-5,y+6]], '#86b9c2', 2);
        return;
      }
      if (kind === 'attack1' || kind === 'attack2') {
        const end = spec.box[2], y = spec.fist[1], tall = kind === 'attack2' ? 46 : 33;
        const drift = q * 12, rim = end - 23;
        fx.save(); fx.globalAlpha *= .23;
        fxShape([[30,y-9],[99,y-tall-7],[rim,y-tall-7],[end+8,y],[rim,y+tall+7],[96,y+tall+7],[30,y+8]], '#9bd6dd');
        fx.restore();
        fx.save(); fx.globalAlpha *= .50;
        fxShape([[42,y-4],[104,y-tall+9],[rim,y-tall+5],[end,y],[rim,y+tall-5],[103,y+tall-9],[42,y+4]], '#b4deda');
        fx.restore();
        // Hollow compression bow, with a tapered white jet inside.
        fxArc(rim+drift, y, 23, tall+q*8, -1.56, 1.56, 7, '#79b7c2');
        fxArc(rim+drift-2, y, 21, tall-3+q*8, -1.5, 1.5, 4, '#f4ffef');
        fxShape([[49,y-5],[103,y-14],[rim-3,y-10],[end-5,y],[rim-8,y+5],[106,y+6],[49,y+4]], spec.color);
        fxShape([[63,y-2],[123,y-5],[end-8,y],[122,y+2]], '#ffffff');
        fxArc(85+q*24, y, 11, tall*.65, -1.35, 1.35, 3, '#e8f8ed');
        if(kind==='attack2') fxArc(123+q*17,y,13,tall*.85,-1.4,1.4,3,'#f7e6b6');
        for(let i=0;i<5;i++) {
          const sign=i%2?1:-1, x=67+i*25+q*18, dy=sign*(tall+10+i%2*6);
          fxLine([[x-24,y+dy],[x,y+dy*.86],[x+14,y+dy*.82]], i%2?'#a1ccd0':'#e1f1dc', 2);
        }
      } else if (kind === 'attack3') {
        // A broad rising crescent: separate outside contour, hollow center and wind ribbons.
        fx.save();fx.globalAlpha *= .25;
        fxShape([[14,-22],[84,-49],[128,-98],[134,-157],[109,-202],[72,-241],
          [123,-215],[158,-162],[166,-108],[144,-60],[93,-26],[38,-13]],'#95d1dc');
        fx.restore();
        fxShape([[21,-25],[82,-53],[119,-100],[126,-154],[107,-197],[81,-232],
          [120,-207],[150,-158],[155,-110],[135,-67],[89,-37],[41,-22]],'#83bfc6');
        fxShape([[32,-29],[88,-59],[127,-112],[131,-160],[108,-205],[84,-231],
          [117,-204],[144,-156],[146,-109],[126,-71],[83,-44]], '#e9fff0');
        fxShape([[52,-37],[107,-82],[134,-126],[132,-169],[113,-205],
          [139,-169],[145,-124],[121,-79]], '#ffffff');
        fxLine([[38,-41],[81,-67],[109,-107],[115,-153],[100,-186]], '#c3e8df',4);
        fx.save();fx.translate(119,-182-q*10);fx.rotate(-.6);
        fxArc(0,0,33,12,-Math.PI*.85,Math.PI*.5,3,'#e9f5d8');fx.restore();
        fxLine([[161,-74],[174,-106],[175,-139]],'#c9e5dc',3);
        fxLine([[145,-196],[128,-222],[110,-241]],'#b0d5dc',2);
        fxArc(38,-4,51,10,Math.PI,Math.PI*1.9,3,'#93bfc0');
      } else {
        const x=54, r=150+q*52;
        fx.save();fx.globalAlpha*=.22;
        fxShape([[36,-4],[64,-67],[120,-95],[178,-75],[215,-43],[240,-4]],'#a4d5d6');fx.restore();
        fxShape([[31,-81],[47,-58],[66,-17],[55,-1],[40,-34]],'#c9ede4');
        fxShape([[43,-64],[55,-42],[63,-10],[56,-5]],'#ffffff');
        fxArc(x,-3,r,21+q*7,Math.PI,Math.PI*2,5,'#88b9c1');
        fxArc(x,-3,r-7,17+q*7,Math.PI,Math.PI*2,3,'#f2f7d8');
        fxArc(x,0,r*.78,11+q*8,0,Math.PI,3,'#c6dcd1');
        // Three forward compression fronts, tallest near the point of impact.
        for(let i=0;i<3;i++) {
          const cx=88+i*55+q*7, ry=84-i*16;
          fxArc(cx,-8,20+i*4,ry,-1.55,.04,7,'#89b8be');
          fxArc(cx-2,-8,18+i*4,ry-3,-1.53,.04,4,i===2?'#fff6dc':'#dff6e7');
        }
        fxShape([[36,-3],[40,-25],[50,-15],[56,-52],[66,-18],[86,-30],[79,-3]],'#f6f7d7');
        fxLine([[79,-4],[133,-11],[172,-6],[236,-4]],'#fff4d2',4);
        for(let i=0;i<10;i++) {
          const sign=i%3?1:-1, distance=26+i*15+q*35, dy=-7-(1-q)*(12+i%4*8);
          fx.fillStyle=i%3?'#9ab9b4':'#e5d5ae';
          fx.fillRect(x+sign*distance,dy,4+i%3*2,4+i%2*2);
        }
        fxLine([[x-90,2],[x-55,-2],[x-37,3]],'#87958b',3);
        fxLine([[x+34,3],[x+80,-1],[x+107,4],[x+167,1]],'#c1b48c',3);
      }
    });
  }

  function drawMeleeImpacts() {
    if (!state.effectsEnabled || !meleeImpacts.length) return;
    pixelEffect(() => {
      for (const impact of meleeImpacts) {
        const q = clamp(impact.age / impact.duration, 0, 1), motion = reducedMotion ? .25 : q;
        fx.save(); fx.translate(Math.round(impact.x / 2) * 2, Math.round(impact.y / 2) * 2); fx.scale(impact.facing, 1);
        fx.globalAlpha = (1 - q) ** 1.3;
        const size = (impact.kind === 'attack4' ? 42 : impact.kind === 'attack3' ? 33 : 26) + motion * 14;
        fxArc(0,0,size*1.35,size*1.1,-1.5,1.5,3,'#9bd2d5');
        const points = [];
        for (let i = 0; i < 16; i++) {
          const angle = i * Math.PI / 8, radius = i % 2 ? size * .28 : size * (i % 4 ? .7 : 1);
          points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
        }
        fxShape(points, MELEE_FX[impact.kind].color);
        fxShape([[-5, 0], [0, -8], [5, 0], [0, 8]], '#fff8df');
        if (q > .12) for (let i = 0; i < 5; i++) {
          const angle = -1.1 + i * .55, d = size + 8 + motion * 19;
          fxLine([[Math.cos(angle) * d, Math.sin(angle) * d], [Math.cos(angle) * (d + 7), Math.sin(angle) * (d + 7)]], '#e7bb7f', 2);
        }
        fx.restore();
      }
    });
  }

  function drawEffects() {
    drawMeleeImpacts();
    for (const p of projectiles) {
      ctx.save(); ctx.translate(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2); if (p.vx < 0) ctx.scale(-1, 1);
      if (p.kind === 'fire') {
        for (let i = 0; i < 4; i++) rect(-29 - i * 7, -5 + i % 2 * 5, 10, 4, i % 2 ? '#d2763b' : '#e6a251');
        rect(-14, -12, 24, 24, '#d77a37'); rect(-5, -17, 12, 32, '#edaf50'); rect(2, -9, 14, 18, '#ffe7a3'); rect(11, -5, 7, 10, '#f9f0b2');
      } else {
        ctx.strokeStyle = '#b4f0dd'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(-6, 0, 27, -1.3, 1.3); ctx.stroke();
        ctx.strokeStyle = '#689d9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-14, 0, 33, -1.25, 1.25); ctx.stroke();
        line(-49, -11, -24, -11, '#8cbfb3', 2); line(-58, 4, -28, 4, '#8cbfb3', 2);
      }
      ctx.restore();
    }
    for (const p of particles) { ctx.globalAlpha = clamp(p.life / 0.35, 0, 1); rect(p.x, p.y, p.size, p.size, p.color); }
    for (const f of floating) { ctx.globalAlpha = Math.min(1, f.life * 2); text(f.text, f.x, f.y, 12, f.color, 'center'); }
    ctx.globalAlpha = 1;
  }

  function draw() {
    rect(0, 0, W, H, '#111a1b');
    ctx.save();
    if (state.zoom !== 1) {
      ctx.translate(W / 2, GROUND); ctx.scale(state.zoom, state.zoom);
      ctx.translate(-state.x, -GROUND);
    }
    if (state.shake && state.effectsEnabled && !reducedMotion) ctx.translate(Math.round(Math.sin(state.time * 151) * state.shake), Math.round(Math.cos(state.time * 137) * state.shake * 0.5));
    drawScene(); drawTarget(); drawMeleeTrails(); drawHero(); drawEffects();
    ctx.restore();
    if (state.paused) {
      rect(0, 0, W, H, '#0a120b40');
      rect(W / 2 - 57, 85, 114, 30, '#17231fed');
      text('TẠM DỪNG', W / 2, 104, 11, '#d4e5b4', 'center');
    }
  }

  function updateUI() {
    const motion = motions.get(state.action);
    $('currentAction').textContent = motion.label;
    $('currentFrame').textContent = String(state.frame + 1).padStart(2, '0') + ' / ' + String(motion.frames.length).padStart(2, '0');
    $('fpsValue').textContent = String(fps);
    $('jumpLabel').textContent = state.grounded || state.mode === 'preview' ? 'Nhảy' : state.doubleJumpUsed ? 'Đã dùng' : 'Nhảy 2';
    document.querySelector('[data-control="jump"]').setAttribute('aria-label', state.grounded || state.mode === 'preview' ? 'Nhảy; bấm lần nữa trên không để nhảy lần hai' : state.doubleJumpUsed ? 'Nhảy lần hai đã dùng; tiếp đất để hồi lại' : 'Nhảy lần hai trên không');
    frameButtons.forEach((button, i) => {
      button.classList.toggle('is-active', i === state.frame);
      button.setAttribute('aria-pressed', String(i === state.frame));
    });
  }

  function loop(now) {
    const realDt = lastTime ? clamp((now - lastTime) / 1000, 0, 0.04) : 0;
    lastTime = now;
    if (!state.paused) update(realDt * state.speed);
    draw();
    uiTime += realDt; fpsTime += realDt; fpsFrames++;
    if (fpsTime >= 0.6) { fps = Math.round(fpsFrames / fpsTime); fpsFrames = 0; fpsTime = 0; }
    if (uiTime > 0.08) { updateUI(); uiTime = 0; }
    requestAnimationFrame(loop);
  }

  async function initialize() {
    try {
      const manifest = window.DEMO_SPRITE_MANIFEST || await fetch('./sprite-manifest.json').then((response) => {
        if (!response.ok) throw new Error('Không tải được dữ liệu chuyển động');
        return response.json();
      });
      pages = manifest.pages;
      await Promise.all(pages.map(async (page) => {
        page.image = new Image();
        page.image.src = page.src;
        await page.image.decode();
        for (const frame of page.frames) {
          if (!motions.has(frame.action)) throw new Error('Động tác chưa được khai báo: ' + frame.action);
          const motion = motions.get(frame.action);
          if (page.blink) motion.blink = page.blink;
          if (page.fps) motion.fps = page.fps;
          if (!(frame.headWidth > 0)) throw new Error('Thiếu kích thước đầu: ' + frame.action);
          (frame.variant === 'blink' ? motion.blinkFrames : motion.frames).push({ ...frame, page });
        }
      }));
      for (const motion of motions.values()) {
        motion.frames.sort((a, b) => (a.order ?? a.row * 4 + a.col) - (b.order ?? b.row * 4 + b.col));
        const validCounts = isGait(motion.id) || motion.id === 'doubleJump' ? [8] : ['attack1', 'attack2'].includes(motion.id) ? [3] : [4];
        if (!validCounts.includes(motion.frames.length)) throw new Error('Số khung không hợp lệ: ' + motion.label);
      }
      buildControls();
      state.ready = true;
      $('loadingState').hidden = true;
      reset();
      updateUI();
      requestAnimationFrame(loop);
    } catch (error) {
      $('loadingState').textContent = 'Không tải được nhân vật. Hãy mở lại trang demo hoặc chạy npm start.';
      console.error(error);
    }
  }

  window.demo = Object.freeze({
    getAttackBox: meleeBox,
    getEffects: () => ({ trail: meleeTrail(), impacts: meleeImpacts.map(impact => ({ ...impact })) }),
    getState: () => ({ ready: state.ready, action: state.action, frame: state.frame, frameCount: motions.get(state.action).frames.length, stridePhase: state.stridePhase, x: state.x, y: state.y, vx: state.vx, vy: state.vy, time: state.time, actionTime: state.actionTime, doubleJumpUsed: state.doubleJumpUsed, doubleJumpAvailable: !state.doubleJumpUsed, doubleJumpCount: state.doubleJumpCount, comboStep: state.combo + 1, queuedStrikes: state.comboQueued, attackHistory: [...state.attackHistory], comboInputWindow: COMBO_INPUT_WINDOW, facing: state.facing, grounded: state.grounded, paused: state.paused, speed: state.speed, hitCount: state.hitCount, effectsEnabled: state.effectsEnabled, mode: state.mode, zoom: state.zoom, targetX: TARGET_X, attackReach: MELEE_FX.attack1.box[2], groundY: GROUND, loadedPages: pages.filter((p) => p.image?.complete).length, renderer: 'whole-character-frames', renderedHeadWidth: state.ready ? renderedFrame().headWidth * (HERO_HEAD_WIDTH / renderedFrame().headWidth) : 0, frameVariant: state.ready ? renderedFrame().variant || 'open' : 'open', reducedMotion }),
    setAction: preview,
    reset
  });
  initialize();
})();
