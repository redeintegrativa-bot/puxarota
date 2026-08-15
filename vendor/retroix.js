/*!
 * Retroix — a tiny, dependency-free retro arcade game engine.
 * https://github.com/DanMat/Retroix   MIT License.
 *
 * Extracted from a family of vanilla-JS arcade games. Gives you the parts every
 * one of them needs — a DPI-aware canvas, a render-safe game loop, keyboard /
 * mouse / touch input, a Supabase-or-localStorage leaderboard, overlay screens
 * with retro 3-initial high-score entry, drawing helpers, synthesized 8-bit
 * sound and looping chiptune music, screen-shake/flash/freeze game-feel,
 * collision tests, namespaced storage, arcade physics, tile grids, a follow
 * camera, a state machine, timers/tweens, and an autopilot dev-mode test bot —
 * so a game is just its own update()/render() and level data.
 *
 * UMD: works as a <script> global (window.Retroix) or via import/require.
 */
(function (root, factory) {
	if (typeof module === 'object' && module.exports) { module.exports = factory(); }
	else { root.Retroix = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	var Retroix = { version: '1.2.0' };

	/* ------------------------------- util --------------------------------- */

	var util = {
		clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
		rand: function (a, b) { return a + Math.random() * (b - a); },
		randInt: function (a, b) { return (a + Math.random() * (b - a + 1)) | 0; },
		pick: function (arr) { return arr[(Math.random() * arr.length) | 0]; },
		hypot: function (x, y) { return Math.sqrt(x * x + y * y); },
		dist2: function (ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; },
		lerp: function (a, b, t) { return a + (b - a) * t; },
		shuffle: function (a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
		escapeHtml: function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
	};
	Retroix.util = util;

	/* ------------------------------ canvas -------------------------------- */

	// DPI-aware canvas: a fixed logical resolution scaled crisply to the element.
	Retroix.canvas = function (el, w, h) {
		var canvas = typeof el === 'string' ? document.querySelector(el) : el;
		var ctx = canvas.getContext('2d');
		var api = { canvas: canvas, ctx: ctx, width: w, height: h, dpr: 1 };
		api.resize = function () {
			var dpr = Math.min(window.devicePixelRatio || 1, 2);
			api.dpr = dpr; canvas.width = w * dpr; canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		// Client coords -> logical game coords.
		api.toLogical = function (clientX, clientY) {
			var r = canvas.getBoundingClientRect();
			return { x: (clientX - r.left) / r.width * w, y: (clientY - r.top) / r.height * h };
		};
		api.resize();
		window.addEventListener('resize', api.resize);
		return api;
	};

	/* ------------------------------- loop --------------------------------- */

	// requestAnimationFrame loop with a clamped delta. `step(dt)` gets seconds.
	// Crash-safe by design: nothing runs until you start(), stop() cancels
	// cleanly, and a throw inside step() is caught and logged (opts.onError to
	// override) then the loop reschedules — one bad frame can never freeze the
	// whole game.
	Retroix.loop = function (step, opts) {
		opts = opts || {};
		var raf = null, last = 0, running = false, maxDt = opts.maxDt || 0.05;
		var onError = opts.onError || function (e) { if (typeof console !== 'undefined' && console.error) { console.error('Retroix.loop: uncaught error in step()', e); } };
		function frame(now) {
			if (!running) { return; }
			var dt = Math.min((now - last) / 1000, maxDt);
			last = now;
			try { step(dt); }
			catch (e) { onError(e); }
			finally { if (running) { raf = requestAnimationFrame(frame); } }
		}
		return {
			start: function () { if (running) { return; } running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
			stop: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
			isRunning: function () { return running; }
		};
	};

	/* ------------------------------- input -------------------------------- */

	// Keyboard (arrows + WASD, mapped to named actions) plus pointer (mouse and
	// touch) reported in logical coordinates. Read `input.actions` / `input.pointer`
	// each frame, or `input.axis()` for 8-way movement.
	Retroix.input = function (canvasApi, opts) {
		opts = opts || {};
		var actions = {}, raw = {}, pointer = { x: null, y: null, down: false, inside: false, moved: false };
		var MAP = {
			ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
			w: 'up', s: 'down', a: 'left', d: 'right',
			' ': 'action', Enter: 'confirm', Escape: 'pause', p: 'pause'
		};
		function norm(k) { return k.length === 1 ? k.toLowerCase() : k; }
		var handlers = { keydown: [], keyup: [] };

		document.addEventListener('keydown', function (e) {
			var k = norm(e.key); raw[k] = true; if (MAP[e.key] || MAP[k]) { actions[MAP[e.key] || MAP[k]] = true; }
			handlers.keydown.forEach(function (fn) { fn(e); });
			if (opts.preventArrows !== false && /^Arrow| $/.test(e.key)) { e.preventDefault(); }
		});
		document.addEventListener('keyup', function (e) {
			var k = norm(e.key); raw[k] = false; if (MAP[e.key] || MAP[k]) { actions[MAP[e.key] || MAP[k]] = false; }
			handlers.keyup.forEach(function (fn) { fn(e); });
		});

		if (canvasApi) {
			var c = canvasApi.canvas;
			c.addEventListener('mousemove', function (e) { var p = canvasApi.toLogical(e.clientX, e.clientY); pointer.x = p.x; pointer.y = p.y; pointer.inside = true; pointer.moved = true; });
			c.addEventListener('mouseleave', function () { pointer.inside = false; });
			c.addEventListener('mousedown', function () { pointer.down = true; });
			c.addEventListener('mouseup', function () { pointer.down = false; });
			function touch(e) { var t = e.touches[0]; if (t) { var p = canvasApi.toLogical(t.clientX, t.clientY); pointer.x = p.x; pointer.y = p.y; pointer.inside = true; pointer.down = true; pointer.moved = true; } e.preventDefault(); }
			c.addEventListener('touchstart', touch, { passive: false });
			c.addEventListener('touchmove', touch, { passive: false });
			c.addEventListener('touchend', function () { pointer.down = false; });
		}

		return {
			actions: actions, raw: raw, pointer: pointer,
			down: function (a) { return !!actions[a] || !!raw[a]; },
			axis: function () {
				return { x: (actions.right ? 1 : 0) - (actions.left ? 1 : 0), y: (actions.down ? 1 : 0) - (actions.up ? 1 : 0) };
			},
			onKeyDown: function (fn) { handlers.keydown.push(fn); },
			onKeyUp: function (fn) { handlers.keyup.push(fn); }
		};
	};

	/* ----------------------------- leaderboard ---------------------------- */

	// Shared high-score store. Pass { supabaseUrl, supabaseAnonKey, gameId, size }
	// (or leave the Supabase fields blank for a local, per-browser board).
	Retroix.leaderboard = function (cfg) {
		cfg = cfg || {};
		var GAME = cfg.gameId || 'game', SIZE = cfg.size || cfg.leaderboardSize || 10;
		var useSb = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
		var LOCAL = 'leaderboard-' + GAME;

		function headers(extra) { var h = { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + cfg.supabaseAnonKey }; for (var k in extra) { h[k] = extra[k]; } return h; }
		function sbTop(limit) {
			var url = cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/scores?game=eq.' + encodeURIComponent(GAME) +
				'&select=initials,score,stage,created_at&order=score.desc,created_at.asc&limit=' + limit;
			return fetch(url, { headers: headers() }).then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); });
		}
		function sbSubmit(entry) {
			return fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/scores', {
				method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify(entry)
			}).then(function (r) { if (!r.ok) { throw new Error(r.status); } return entry; });
		}
		function localAll() { try { return JSON.parse(localStorage.getItem(LOCAL)) || []; } catch (e) { return []; } }
		function localTop(limit) { return Promise.resolve(localAll().sort(function (a, b) { return b.score - a.score; }).slice(0, limit)); }
		function localSubmit(entry) { var r = localAll(); r.push(entry); r.sort(function (a, b) { return b.score - a.score; }); r = r.slice(0, 100); try { localStorage.setItem(LOCAL, JSON.stringify(r)); } catch (e) {} return Promise.resolve(entry); }

		function top(limit) { limit = limit || SIZE; return useSb ? sbTop(limit).catch(function () { return localTop(limit); }) : localTop(limit); }
		function submit(initials, score, stage) {
			var entry = { game: GAME, initials: String(initials).toUpperCase().slice(0, 3), score: Math.max(0, Math.floor(score)), stage: stage || 1, created_at: new Date().toISOString() };
			return useSb ? sbSubmit(entry).catch(function () { return localSubmit(entry); }) : localSubmit(entry);
		}
		function qualifies(score, limit) { limit = limit || SIZE; if (score <= 0) { return Promise.resolve(false); } return top(limit).then(function (rows) { return rows.length < limit || score > rows[rows.length - 1].score; }); }

		return { top: top, submit: submit, qualifies: qualifies, mode: useSb ? 'supabase' : 'local' };
	};

	/* ------------------------------ screens ------------------------------- */

	// Overlay manager: elements with a `data-screen="id"` attribute are shown one
	// at a time (the rest get `hidden`). The [hidden] attribute must win over
	// display in your CSS — retroix.css handles that for `.rx-screen`.
	Retroix.screens = function (rootEl) {
		var root = typeof rootEl === 'string' ? document.querySelector(rootEl) : (rootEl || document);
		var list = [].slice.call(root.querySelectorAll('[data-screen]'));
		var map = {}; list.forEach(function (el) { map[el.getAttribute('data-screen')] = el; });
		return {
			el: map,
			show: function (id) { list.forEach(function (el) { el.hidden = (el.getAttribute('data-screen') !== id); }); return map[id]; },
			hideAll: function () { list.forEach(function (el) { el.hidden = true; }); },
			current: function () { for (var i = 0; i < list.length; i++) { if (!list[i].hidden) { return list[i].getAttribute('data-screen'); } } return null; }
		};
	};

	/* --------------------------- initials entry --------------------------- */

	// Retro 3-letter high-score entry. Renders into `container` (which should
	// contain `.rx-slots` markup, or one is created), wires keyboard + ▲▼, and
	// calls opts.onEnter(initials) on submit.
	Retroix.initials = function (container, opts) {
		opts = opts || {};
		var el = typeof container === 'string' ? document.querySelector(container) : container;
		var len = opts.length || 3, slots = [], cursor = 0, chars = [];
		for (var i = 0; i < len; i++) { chars.push('A'); }

		var wrap = el.querySelector('.rx-slots');
		if (!wrap) { wrap = document.createElement('div'); wrap.className = 'rx-slots'; el.appendChild(wrap); }
		wrap.innerHTML = '';
		for (i = 0; i < len; i++) {
			var s = document.createElement('div'); s.className = 'rx-slot';
			s.innerHTML = '<button class="rx-slot-up" aria-label="up">▲</button><span class="rx-slot-ch">A</span><button class="rx-slot-down" aria-label="down">▼</button>';
			(function (idx, node) {
				node.querySelector('.rx-slot-up').addEventListener('click', function () { cycle(idx, 1); });
				node.querySelector('.rx-slot-down').addEventListener('click', function () { cycle(idx, -1); });
				node.addEventListener('click', function (e) { if (!e.target.closest('button')) { cursor = idx; render(); } });
			})(i, s);
			wrap.appendChild(s); slots.push(s);
		}
		function render() { slots.forEach(function (s, i) { s.querySelector('.rx-slot-ch').textContent = chars[i]; s.classList.toggle('rx-slot--active', i === cursor); }); }
		function cycle(i, d) { var c = (chars[i].charCodeAt(0) - 65 + d + 26) % 26; chars[i] = String.fromCharCode(65 + c); cursor = i; render(); }
		function key(e) {
			var k = e.key;
			if (/^[a-zA-Z]$/.test(k)) { chars[cursor] = k.toUpperCase(); if (cursor < len - 1) { cursor++; } render(); }
			else if (k === 'ArrowUp') { cycle(cursor, 1); }
			else if (k === 'ArrowDown') { cycle(cursor, -1); }
			else if (k === 'ArrowLeft') { cursor = Math.max(0, cursor - 1); render(); }
			else if (k === 'ArrowRight') { cursor = Math.min(len - 1, cursor + 1); render(); }
			else if (k === 'Backspace') { cursor = Math.max(0, cursor - 1); render(); }
			else if (k === 'Enter') { if (opts.onEnter) { opts.onEnter(value()); } }
			else { return; }
			e.preventDefault();
		}
		function value() { return chars.join(''); }
		var api = {
			value: value,
			reset: function () { for (var i = 0; i < len; i++) { chars[i] = 'A'; } cursor = 0; render(); return api; },
			handleKey: key,           // call this from your keydown handler while active
			bindKeys: function () { document.addEventListener('keydown', keyGuard); return api; },
			active: false
		};
		function keyGuard(e) { if (api.active) { key(e); } }
		render();
		return api;
	};

	/* --------------------------- leaderboard UI --------------------------- */

	// Render score rows into a <tbody>. opts: { highlightInitials, highlightScore,
	// columns: ['rank','initials','score','stage'], emptyText, loadingText }.
	Retroix.renderLeaderboard = function (tbody, rows, opts) {
		opts = opts || {};
		var cols = opts.columns || ['rank', 'initials', 'score', 'stage'];
		if (!rows) { tbody.innerHTML = '<tr><td colspan="' + cols.length + '" class="rx-lb-msg">' + (opts.loadingText || 'Loading…') + '</td></tr>'; return; }
		if (!rows.length) { tbody.innerHTML = '<tr><td colspan="' + cols.length + '" class="rx-lb-msg">' + (opts.emptyText || 'No scores yet — be the first!') + '</td></tr>'; return; }
		var used = false;
		tbody.innerHTML = rows.map(function (row, i) {
			var me = !used && opts.highlightInitials && row.initials === opts.highlightInitials && (opts.highlightScore == null || row.score === opts.highlightScore);
			if (me) { used = true; }
			var tds = cols.map(function (c) {
				if (c === 'rank') { return '<td>' + (i + 1) + '</td>'; }
				if (c === 'initials') { return '<td class="rx-lb-ini">' + util.escapeHtml(row.initials) + '</td>'; }
				if (c === 'score') { return '<td class="rx-lb-score">' + Number(row.score).toLocaleString() + '</td>'; }
				if (c === 'stage') { return '<td>' + (row.stage || '-') + '</td>'; }
				return '<td>' + util.escapeHtml(String(row[c] == null ? '' : row[c])) + '</td>';
			}).join('');
			return '<tr' + (me ? ' class="rx-lb-me"' : '') + '>' + tds + '</tr>';
		}).join('');
	};

	/* -------------------------------- gfx --------------------------------- */

	var gfx = {
		roundRect: function (ctx, x, y, w, h, r) {
			ctx.beginPath(); ctx.moveTo(x + r, y);
			ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
			ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
		},
		// A minimal particle burst system. emit() then update(dt)+render(ctx) each frame.
		particles: function () {
			var list = [];
			return {
				list: list,
				emit: function (x, y, color, n, spread) {
					spread = spread || 4;
					for (var i = 0; i < (n || 8); i++) { list.push({ x: x, y: y, vx: util.rand(-spread, spread), vy: util.rand(-spread, spread), life: 1, color: color }); }
				},
				update: function (dt) {
					var f = dt * 60;
					for (var i = list.length - 1; i >= 0; i--) { var p = list[i]; p.x += p.vx * f; p.y += p.vy * f; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt * 2; if (p.life <= 0) { list.splice(i, 1); } }
				},
				render: function (ctx) {
					for (var i = 0; i < list.length; i++) { var p = list[i]; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } ctx.globalAlpha = 1;
				},
				clear: function () { list.length = 0; }
			};
		}
	};
	Retroix.gfx = gfx;

	/* ------------------------------- toast -------------------------------- */

	// Fading center message. Pass the toast element (styled by retroix.css).
	Retroix.toast = function (el) {
		var timer;
		return function (msg, ms) { el.textContent = msg; el.classList.add('rx-toast--show'); clearTimeout(timer); timer = setTimeout(function () { el.classList.remove('rx-toast--show'); }, ms || 1400); };
	};

	/* ------------------------------- audio -------------------------------- */

	// 8-bit sound with zero sample files — everything is synthesized on the Web
	// Audio API. `var sfx = Retroix.audio();` then sfx.coin() / sfx.explosion(),
	// sfx.play('laser'), sfx.jingle('win'), or sfx.tone({ ... }) for a custom
	// blip. Browsers block audio until a user gesture, so the first key or tap
	// auto-unlocks it. Mute/volume persist in localStorage by default.
	var A4 = 440, SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
	function noteFreq(n) {
		if (typeof n === 'number') { return n; }
		var m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(n);
		if (!m) { return 440; }
		var s = SEMI[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) - 4) * 12;
		return A4 * Math.pow(2, s / 12);
	}
	function mergeObj(a, b) { var o = {}, k; for (k in a) { o[k] = a[k]; } for (k in b) { o[k] = b[k]; } return o; }

	Retroix.audio = function (opts) {
		opts = opts || {};
		var AC = window.AudioContext || window.webkitAudioContext;
		var STORE = 'rx-audio', persist = opts.persist !== false, saved = {};
		if (persist) { try { saved = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {} }
		var vol = saved.volume != null ? saved.volume : (opts.volume != null ? opts.volume : 0.35);
		var musicVol = saved.musicVolume != null ? saved.musicVolume : (opts.musicVolume != null ? opts.musicVolume : 0.5);
		var isMuted = saved.muted != null ? saved.muted : !!opts.muted;
		var ctx = null, master = null, sfxGain = null, musicGain = null, noiseBuf = null;

		// Graph: sfx -> sfxGain(vol) ┐            master is a pure mute switch, so
		//        music -> musicGain(musicVol) ┴-> master(0|1) -> destination
		//        one mute silences both, but sfx and music keep independent volumes.
		function ensure() {
			if (!AC) { return false; }
			if (!ctx) {
				ctx = new AC();
				master = ctx.createGain(); master.gain.value = isMuted ? 0 : 1; master.connect(ctx.destination);
				sfxGain = ctx.createGain(); sfxGain.gain.value = vol; sfxGain.connect(master);
				musicGain = ctx.createGain(); musicGain.gain.value = musicVol; musicGain.connect(master);
			}
			if (ctx.state === 'suspended') { ctx.resume(); }
			return true;
		}
		function save() { if (persist) { try { localStorage.setItem(STORE, JSON.stringify({ volume: vol, musicVolume: musicVol, muted: isMuted })); } catch (e) {} } }
		function noiseSource() {
			if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, (ctx.sampleRate * 0.5) | 0, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) { d[i] = Math.random() * 2 - 1; } }
			var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
		}

		// One tone/blip. spec: { wave, freq, freqEnd, dur, attack, release, vol,
		// type:'noise', filter } — freqEnd slides the pitch (jump/laser/hit).
		function tone(spec, when) {
			if (!ensure()) { return 0; }
			spec = spec || {};
			var t0 = when != null ? when : ctx.currentTime;
			var dur = spec.dur || 0.12, atk = spec.attack != null ? spec.attack : 0.005;
			var rel = spec.release != null ? spec.release : Math.min(0.08, dur * 0.5);
			var peak = Math.max(0.0001, (spec.vol != null ? spec.vol : 1));
			var g = ctx.createGain();
			g.gain.setValueAtTime(0.0001, t0);
			g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
			var src;
			if (spec.type === 'noise') {
				src = noiseSource();
				if (spec.filter !== false) {
					var flt = ctx.createBiquadFilter(); flt.type = 'lowpass';
					flt.frequency.setValueAtTime(spec.filter || 1800, t0);
					flt.frequency.exponentialRampToValueAtTime(200, t0 + dur);
					src.connect(flt); flt.connect(g);
				} else { src.connect(g); }
			} else {
				var osc = ctx.createOscillator(); osc.type = spec.wave || 'square';
				osc.frequency.setValueAtTime(noteFreq(spec.freq || 440), t0);
				if (spec.freqEnd) { osc.frequency.exponentialRampToValueAtTime(Math.max(1, noteFreq(spec.freqEnd)), t0 + dur); }
				osc.connect(g); src = osc;
			}
			g.connect(sfxGain);
			src.start(t0); src.stop(t0 + dur + rel);
			return dur;
		}

		// Notes back-to-back. `notes` is [{ freq, dur, wave }] or shorthand
		// strings like 'C5:0.1' / 'E5' (dur falls back to common.dur). Returns
		// the total length in seconds.
		function sequence(notes, common) {
			if (!ensure()) { return 0; }
			common = common || {};
			var t = ctx.currentTime, gap = common.gap || 0, start = t;
			for (var i = 0; i < notes.length; i++) {
				var n = notes[i], spec;
				if (typeof n === 'string') { var p = n.split(':'); spec = mergeObj(common, { freq: p[0], dur: p[1] ? +p[1] : (common.dur || 0.12) }); }
				else { spec = mergeObj(common, n); }
				tone(spec, t);
				t += (spec.dur || 0.12) + gap;
			}
			return t - start;
		}

		var SFX = {
			blip: function () { tone({ wave: 'square', freq: 880, dur: 0.06, vol: 0.7 }); },
			select: function () { tone({ wave: 'square', freq: 660, freqEnd: 990, dur: 0.08, vol: 0.7 }); },
			coin: function () { sequence(['B5:0.07', 'E6:0.16'], { wave: 'square', vol: 0.7 }); },
			jump: function () { tone({ wave: 'square', freq: 220, freqEnd: 660, dur: 0.16, vol: 0.7 }); },
			laser: function () { tone({ wave: 'sawtooth', freq: 900, freqEnd: 120, dur: 0.2, vol: 0.6 }); },
			powerup: function () { sequence(['C5:0.06', 'E5:0.06', 'G5:0.06', 'C6:0.14'], { wave: 'square', vol: 0.6 }); },
			hit: function () { tone({ type: 'noise', dur: 0.12, filter: 1200, vol: 0.7 }); tone({ wave: 'square', freq: 160, freqEnd: 80, dur: 0.12, vol: 0.5 }); },
			explosion: function () { tone({ type: 'noise', dur: 0.5, filter: 900, vol: 0.9 }); duck(0.4, 0.5); }
		};
		var JINGLES = {
			win: ['C5:0.12', 'E5:0.12', 'G5:0.12', 'C6:0.3'],
			lose: ['G4:0.14', 'E4:0.14', 'C4:0.36'],
			levelup: ['E5:0.1', 'G5:0.1', 'C6:0.1', 'E6:0.28'],
			gameover: ['C5:0.18', 'G4:0.18', 'E4:0.18', 'C4:0.42']
		};

		/* -- background music: a looping, multi-voice chiptune sequencer -- */
		// A "track" is data (no files): { tempo, stepsPerBeat, loop, voices:[{ wave,
		// vol, notes }] }. `notes` is a space-separated step grid — a note ('C4',
		// 'F#3'), '-' rest, or '.' to hold the previous note one more step. Voices
		// can differ in length (they loop independently). Notes schedule ahead on
		// the audio clock for tight timing, and route through musicGain.
		var curTrack = null, mvoices = [], stepDur = 0.125, totalSteps = 0;
		var stepIdx = 0, nextStepTime = 0, schedTimer = null, playing = false;
		var LOOKAHEAD = 0.12, TICK = 25;

		function parseVoice(v) {
			var toks = typeof v.notes === 'string' ? v.notes.trim().split(/\s+/) : v.notes;
			var byStep = {}, i = 0;
			while (i < toks.length) {
				var t = toks[i];
				if (t === '-' || t === '.') { i++; continue; }
				var steps = 1, j = i + 1;
				while (j < toks.length && toks[j] === '.') { steps++; j++; }
				byStep[i] = { note: t, steps: steps }; i = j;
			}
			return { wave: v.wave || 'square', vol: v.vol != null ? v.vol : 0.5, len: toks.length, byStep: byStep };
		}
		function musicNote(wave, note, t, dur, vol) {
			var osc = ctx.createOscillator(); osc.type = wave;
			osc.frequency.setValueAtTime(noteFreq(note), t);
			var g = ctx.createGain(), peak = Math.max(0.0001, vol);
			g.gain.setValueAtTime(0.0001, t);
			g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
			g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
			osc.connect(g); g.connect(musicGain);
			osc.start(t); osc.stop(t + dur + 0.02);
		}
		function scheduleStep(s, t) {
			for (var vi = 0; vi < mvoices.length; vi++) {
				var v = mvoices[vi], ev = v.byStep[s % v.len];
				if (ev) { musicNote(v.wave, ev.note, t, ev.steps * stepDur * 0.92, v.vol); }
			}
		}
		function scheduler() {
			if (!ctx || ctx.state !== 'running') { return; }               // wait for unlock
			if (nextStepTime < ctx.currentTime) { nextStepTime = ctx.currentTime + 0.05; } // re-anchor after a stall
			while (nextStepTime < ctx.currentTime + LOOKAHEAD) {
				scheduleStep(stepIdx, nextStepTime);
				nextStepTime += stepDur;
				stepIdx++;
				if (stepIdx >= totalSteps) { if (curTrack && curTrack.loop === false) { playing = false; return; } stepIdx = 0; }
			}
		}
		function startScheduler() { if (!schedTimer) { schedTimer = setInterval(scheduler, TICK); } }
		function stopScheduler() { if (schedTimer) { clearInterval(schedTimer); schedTimer = null; } }
		function rampMusic(to, secs) {
			var t = ctx.currentTime;
			musicGain.gain.cancelScheduledValues(t);
			musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), t);
			musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, to), t + secs);
		}

		// Play a track (object or a name from Retroix.tracks); crossfades from any
		// current track. opts: { fade } seconds.
		function music(track, o) {
			if (typeof track === 'string') { track = Retroix.tracks[track]; }
			if (!track || !ensure()) { return api; }
			o = o || {};
			var fade = o.fade != null ? o.fade : 0.4;
			function begin() {
				curTrack = track;
				mvoices = (track.voices || []).map(parseVoice);
				var spb = track.stepsPerBeat || 4, tempo = track.tempo || 120;
				stepDur = 60 / tempo / spb;
				totalSteps = 0;
				for (var i = 0; i < mvoices.length; i++) { if (mvoices[i].len > totalSteps) { totalSteps = mvoices[i].len; } }
				stepIdx = 0; nextStepTime = ctx.currentTime + 0.06; playing = true;
				musicGain.gain.cancelScheduledValues(ctx.currentTime);
				musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
				musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, musicVol), ctx.currentTime + fade);
				startScheduler();
			}
			if (playing) { rampMusic(0.0001, fade); stopScheduler(); setTimeout(begin, fade * 1000); }
			else { begin(); }
			return api;
		}
		function stopMusic(fade) {
			if (!musicGain || !playing) { playing = false; curTrack = null; return api; }
			fade = fade != null ? fade : 0.3;
			rampMusic(0.0001, fade);
			setTimeout(stopScheduler, fade * 1000 + 20);
			playing = false; curTrack = null;
			return api;
		}
		function pauseMusic() { if (playing && musicGain) { stopScheduler(); rampMusic(0.0001, 0.1); } return api; }
		function resumeMusic() {
			if (playing && musicGain && !schedTimer) { nextStepTime = ctx.currentTime + 0.06; rampMusic(musicVol, 0.15); startScheduler(); }
			return api;
		}
		// Briefly dip the music under a loud SFX so hits punch through.
		function duck(amount, dur) {
			if (!musicGain || !playing) { return api; }
			amount = amount == null ? 0.35 : amount; dur = dur || 0.4;
			var t = ctx.currentTime;
			musicGain.gain.cancelScheduledValues(t);
			musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), t);
			musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, musicVol * amount), t + 0.05);
			musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, musicVol), t + dur);
			return api;
		}
		function musicVolume(v) {
			if (v == null) { return musicVol; }
			musicVol = util.clamp(+v, 0, 1);
			if (musicGain && playing && schedTimer) { musicGain.gain.setValueAtTime(Math.max(0.0001, musicVol), ctx.currentTime); }
			save(); return api;
		}

		var api = {
			ctx: function () { return ctx; },
			tone: tone, sequence: sequence,
			play: function (name, o) { if (SFX[name]) { SFX[name](); } else { tone(mergeObj({ freq: name }, o || {})); } return api; },
			jingle: function (name, common) { var j = JINGLES[name]; if (j) { sequence(j, mergeObj({ wave: 'square', vol: 0.6 }, common || {})); } return api; },
			unlock: function () { ensure(); return api; },
			muted: function () { return isMuted; },
			mute: function (v) { isMuted = v == null ? true : !!v; if (master) { master.gain.value = isMuted ? 0 : 1; } save(); return api; },
			toggle: function () { return api.mute(!isMuted); },
			volume: function (v) { if (v == null) { return vol; } vol = util.clamp(+v, 0, 1); if (sfxGain) { sfxGain.gain.value = vol; } save(); return api; },
			// background music
			music: music, stopMusic: stopMusic, pauseMusic: pauseMusic, resumeMusic: resumeMusic,
			duck: duck, musicVolume: musicVolume, musicPlaying: function () { return playing; },
			sfx: SFX, jingles: JINGLES, noteFreq: noteFreq
		};
		// Direct helpers: sfx.coin(), sfx.explosion(), … each returns api.
		Object.keys(SFX).forEach(function (k) { api[k] = function () { SFX[k](); return api; }; });
		// First user gesture unlocks the audio context (browser autoplay policy).
		function unlock() { ensure(); }
		['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlock, { once: true }); });
		return api;
	};

	// A few iconic starter loops for sfx.music('name'). Games can also pass their
	// own track object per level — see the format on Retroix.audio's music engine.
	Retroix.tracks = {
		// bright, upbeat — title / menu
		title: {
			tempo: 126, stepsPerBeat: 4, voices: [
				{ wave: 'square', vol: 0.30, notes: 'C5 E5 G5 E5 C5 E5 G5 B5 C6 . G5 . E5 . C5 .' },
				{ wave: 'triangle', vol: 0.5, notes: 'C3 . . . G2 . . . A2 . . . G2 . . .' }
			]
		},
		// driving minor groove — action / gameplay
		action: {
			tempo: 138, stepsPerBeat: 4, voices: [
				{ wave: 'square', vol: 0.26, notes: 'C5 - C5 D#5 - D#5 G5 - G5 F5 D#5 - D5 - C5 -' },
				{ wave: 'triangle', vol: 0.5, notes: 'C3 C3 . . D#3 . . . F3 . . . G3 . . .' }
			]
		},
		// tense, chromatic — boss
		boss: {
			tempo: 150, stepsPerBeat: 4, voices: [
				{ wave: 'square', vol: 0.26, notes: 'C5 C#5 C5 C#5 C5 - G5 - G#5 G5 G#5 G5 - - F5 -' },
				{ wave: 'sawtooth', vol: 0.3, notes: 'C3 . C3 . C3 . C3 . G#2 . G#2 . G2 . G2 .' }
			]
		},
		// slow, spacious — calm / results
		calm: {
			tempo: 96, stepsPerBeat: 4, voices: [
				{ wave: 'triangle', vol: 0.4, notes: 'E5 . . . G5 . . . C6 . . . B5 . . .' },
				{ wave: 'triangle', vol: 0.45, notes: 'C3 . . . . . . . A2 . . . . . . .' }
			]
		}
	};

	/* -------------------------------- fx ---------------------------------- */

	// Game feel: screen shake, a full-screen flash, and freeze-frame (hitstop).
	//   var fx = Retroix.fx(view);            // pass the canvas api or {width,height}
	//   fx.update(dt); if (!fx.frozen()) { updateWorld(dt); }
	//   fx.preRender(ctx); drawWorld(); fx.postRender(ctx);
	Retroix.fx = function (dims, opts) {
		opts = opts || {};
		var W = dims.width, H = dims.height;
		var maxShake = opts.maxShake || 14, decay = opts.decay || 1.4, flashTime = opts.flashTime || 0.25;
		var trauma = 0, sx = 0, sy = 0, flashColor = '#fff', flashA = 0, flashDecay = 0, freezeT = 0;
		return {
			// Add shake. amount 0..1 (~0.3 a bump, ~0.7 a big hit); stacks, capped.
			shake: function (amount) { trauma = util.clamp(trauma + (amount == null ? 0.5 : amount), 0, 1); },
			// Flash the screen: flash('#fff', 0.6) or flash('#f22').
			flash: function (color, strength) { flashColor = color || '#fff'; flashA = strength == null ? 0.6 : strength; flashDecay = flashA / flashTime; },
			// Freeze the world for `dur` seconds; gate your updates with frozen().
			freeze: function (dur) { freezeT = Math.max(freezeT, dur == null ? 0.06 : dur); },
			frozen: function () { return freezeT > 0; },
			trauma: function () { return trauma; },
			update: function (dt) {
				if (freezeT > 0) { freezeT -= dt; }
				if (trauma > 0) { trauma = Math.max(0, trauma - decay * dt); var m = maxShake * trauma * trauma; sx = util.rand(-m, m); sy = util.rand(-m, m); }
				else { sx = sy = 0; }
				if (flashA > 0) { flashA = Math.max(0, flashA - flashDecay * dt); }
			},
			// Wrap your world drawing between these two.
			preRender: function (ctx) { ctx.save(); ctx.translate(sx, sy); },
			postRender: function (ctx) { ctx.restore(); if (flashA > 0) { ctx.save(); ctx.globalAlpha = flashA; ctx.fillStyle = flashColor; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
		};
	};

	/* -------------------------------- hit --------------------------------- */

	// Overlap tests. Rects are { x, y, w, h } (top-left); circles are { x, y, r }.
	Retroix.hit = {
		rects: function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },
		circles: function (a, b) { var dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r; return dx * dx + dy * dy < r * r; },
		circleRect: function (c, r) { var nx = util.clamp(c.x, r.x, r.x + r.w), ny = util.clamp(c.y, r.y, r.y + r.h), dx = c.x - nx, dy = c.y - ny; return dx * dx + dy * dy < c.r * c.r; },
		pointRect: function (px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
		pointCircle: function (px, py, c) { var dx = px - c.x, dy = py - c.y; return dx * dx + dy * dy < c.r * c.r; }
	};

	/* ------------------------------ storage ------------------------------- */

	// Namespaced, JSON-friendly localStorage. var store = Retroix.storage('paddix');
	// store.set('best', 1200); store.get('muted', false). No-ops if storage is blocked.
	Retroix.storage = function (ns) {
		var P = 'rx:' + (ns || 'game') + ':';
		function safe(fn, d) { try { return fn(); } catch (e) { return d; } }
		var store = {
			get: function (key, fallback) { var d = fallback == null ? null : fallback; return safe(function () { var v = localStorage.getItem(P + key); return v == null ? d : JSON.parse(v); }, d); },
			set: function (key, val) { safe(function () { localStorage.setItem(P + key, JSON.stringify(val)); }); return val; },
			remove: function (key) { safe(function () { localStorage.removeItem(P + key); }); },
			keys: function () { return safe(function () { var out = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(P) === 0) { out.push(k.slice(P.length)); } } return out; }, []); },
			clear: function () { store.keys().forEach(function (k) { store.remove(k); }); }
		};
		return store;
	};

	/* ------------------------------ physics ------------------------------- */

	// Arcade physics — the lightweight kind platformers use, not a rigid-body
	// engine. A "body" is { x, y, w, h } plus velocity you own; move() integrates
	// gravity/friction and resolves axis-separated AABB collisions against an
	// array of static `solids` ({ x, y, w, h }), setting contact flags.
	// blocked.*/onGround are per-frame *contact* flags — true while a force keeps
	// the body pushing into a solid (gravity, or a held key that re-sets velocity
	// each frame). Cap speed with maxVx/maxVy below your solid/tile size so a
	// single step can't jump clean over a wall (arcade physics has no sweeping).
	Retroix.physics = {
		body: function (o) {
			o = o || {};
			return {
				x: o.x || 0, y: o.y || 0, w: o.w || 0, h: o.h || 0,
				vx: o.vx || 0, vy: o.vy || 0,
				gravity: o.gravity || 0, friction: o.friction || 0, bounce: o.bounce || 0,
				maxVx: o.maxVx || 0, maxVy: o.maxVy || 0,
				blocked: { left: false, right: false, up: false, down: false }, onGround: false
			};
		},
		// Integrate + resolve one frame. dt in seconds (normalized to 60fps steps).
		// Sets b.blocked.* and b.onGround; applies bounce and per-frame friction.
		move: function (b, solids, dt) {
			var f = (dt || 1 / 60) * 60, i, s;
			b.blocked.left = b.blocked.right = b.blocked.up = b.blocked.down = false;
			if (b.gravity) { b.vy += b.gravity * f; }
			if (b.friction) { b.vx *= Math.pow(1 - Math.min(0.999, b.friction), f); }
			if (b.maxVx) { b.vx = util.clamp(b.vx, -b.maxVx, b.maxVx); }
			if (b.maxVy) { b.vy = util.clamp(b.vy, -b.maxVy, b.maxVy); }
			solids = solids || [];
			// X axis.
			b.x += b.vx * f;
			for (i = 0; i < solids.length; i++) {
				s = solids[i];
				if (Retroix.hit.rects(b, s)) {
					if (b.vx > 0) { b.x = s.x - b.w; b.blocked.right = true; }
					else if (b.vx < 0) { b.x = s.x + s.w; b.blocked.left = true; }
					b.vx = -b.vx * b.bounce;
				}
			}
			// Y axis.
			b.onGround = false;
			b.y += b.vy * f;
			for (i = 0; i < solids.length; i++) {
				s = solids[i];
				if (Retroix.hit.rects(b, s)) {
					if (b.vy > 0) { b.y = s.y - b.h; b.blocked.down = true; b.onGround = true; }
					else if (b.vy < 0) { b.y = s.y + s.h; b.blocked.up = true; }
					b.vy = -b.vy * b.bounce;
				}
			}
			return b;
		}
	};

	/* ------------------------------- grid --------------------------------- */

	// Tile grid: values in a flat array, cell<->world conversion, and solids()
	// that turns filled cells into collision rects for physics.move().
	Retroix.grid = function (cols, rows, tile) {
		tile = tile || 1;
		var cells = []; for (var i = 0; i < cols * rows; i++) { cells.push(0); }
		var g = { cols: cols, rows: rows, tile: tile, cells: cells };
		g.inside = function (cx, cy) { return cx >= 0 && cy >= 0 && cx < cols && cy < rows; };
		g.at = function (cx, cy) { return g.inside(cx, cy) ? cells[cy * cols + cx] : undefined; };
		g.set = function (cx, cy, v) { if (g.inside(cx, cy)) { cells[cy * cols + cx] = v; } return g; };
		g.cellAt = function (wx, wy) { return { cx: Math.floor(wx / tile), cy: Math.floor(wy / tile) }; };
		g.rectOf = function (cx, cy) { return { x: cx * tile, y: cy * tile, w: tile, h: tile }; };
		g.forEach = function (fn) { for (var cy = 0; cy < rows; cy++) { for (var cx = 0; cx < cols; cx++) { fn(cells[cy * cols + cx], cx, cy); } } };
		// Collision rects for solid cells (default: any truthy). Pass a `region`
		// rect to only build tiles near it — keeps physics cheap on big maps.
		g.solids = function (isSolid, region) {
			isSolid = isSolid || function (v) { return !!v; };
			var out = [], x0 = 0, y0 = 0, x1 = cols, y1 = rows, cx, cy;
			if (region) {
				x0 = Math.max(0, Math.floor(region.x / tile)); y0 = Math.max(0, Math.floor(region.y / tile));
				x1 = Math.min(cols, Math.ceil((region.x + region.w) / tile)); y1 = Math.min(rows, Math.ceil((region.y + region.h) / tile));
			}
			for (cy = y0; cy < y1; cy++) { for (cx = x0; cx < x1; cx++) { if (isSolid(cells[cy * cols + cx], cx, cy)) { out.push({ x: cx * tile, y: cy * tile, w: tile, h: tile }); } } }
			return out;
		};
		return g;
	};

	/* ------------------------------ camera -------------------------------- */

	// World-space camera. Move cam.x/.y directly or follow(target) each frame,
	// then wrap world drawing: cam.begin(ctx); drawWorld(); cam.end(ctx). `view`
	// is the canvas api (or { width, height }); `bounds` clamps to the level.
	Retroix.camera = function (view, opts) {
		opts = opts || {};
		var W = view.width, H = view.height;
		var cam = { x: 0, y: 0, zoom: opts.zoom || 1, bounds: opts.bounds || null, lerp: opts.lerp || 1 };
		cam.clamp = function () {
			var b = cam.bounds; if (!b) { return cam; }
			cam.x = util.clamp(cam.x, b.x, Math.max(b.x, b.x + b.w - W / cam.zoom));
			cam.y = util.clamp(cam.y, b.y, Math.max(b.y, b.y + b.h - H / cam.zoom));
			return cam;
		};
		// Center on a target ({ x, y } or { x, y, w, h }); l is follow smoothing 0..1.
		cam.follow = function (t, l) {
			var k = l == null ? cam.lerp : l;
			var tx = t.x + (t.w ? t.w / 2 : 0) - W / (2 * cam.zoom);
			var ty = t.y + (t.h ? t.h / 2 : 0) - H / (2 * cam.zoom);
			cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
			return cam.clamp();
		};
		cam.begin = function (ctx) { ctx.save(); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-Math.round(cam.x), -Math.round(cam.y)); };
		cam.end = function (ctx) { ctx.restore(); };
		cam.worldToScreen = function (x, y) { return { x: (x - cam.x) * cam.zoom, y: (y - cam.y) * cam.zoom }; };
		cam.screenToWorld = function (x, y) { return { x: x / cam.zoom + cam.x, y: y / cam.zoom + cam.y }; };
		return cam;
	};

	/* -------------------------------- fsm --------------------------------- */

	// Finite state machine. states = { name: { enter, update, exit } } — each
	// hook optional. set() runs the old state's exit() then the new one's enter()
	// (extra args to set() are forwarded to enter()).
	Retroix.fsm = function (states, initial) {
		states = states || {};
		var cur = null;
		var api = {
			set: function (name) {
				if (name === cur) { return api; }
				var s = states[cur]; if (s && s.exit) { s.exit(); }
				cur = name;
				var n = states[cur]; if (n && n.enter) { n.enter.apply(null, [].slice.call(arguments, 1)); }
				return api;
			},
			update: function (dt) { var s = states[cur]; if (s && s.update) { s.update(dt); } return api; },
			render: function (ctx) { var s = states[cur]; if (s && s.render) { s.render(ctx); } return api; },
			is: function (name) { return cur === name; },
			current: function () { return cur; }
		};
		if (initial != null) { api.set(initial); }
		return api;
	};

	/* --------------------------- ease / timer ----------------------------- */

	// Easing curves, t in [0,1] -> eased [0,1]. Use by name with timer.tween().
	var ease = {
		linear: function (t) { return t; },
		inQuad: function (t) { return t * t; },
		outQuad: function (t) { return t * (2 - t); },
		inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
		inCubic: function (t) { return t * t * t; },
		outCubic: function (t) { return (--t) * t * t + 1; },
		outBack: function (t) { var s = 1.70158; return 1 + (--t) * t * ((s + 1) * t + s); },
		outBounce: function (t) {
			if (t < 1 / 2.75) { return 7.5625 * t * t; }
			if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
			if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
			t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
		}
	};
	Retroix.ease = ease;

	// Scheduled callbacks and property tweens, all driven by one update(dt).
	//   var tm = Retroix.timer();
	//   tm.after(2, boom); tm.every(0.5, blink);
	//   tm.tween(sprite, { x: 300, alpha: 0 }, 0.4, 'outCubic', onDone);
	//   // in the loop:  tm.update(dt);
	Retroix.timer = function () {
		var timers = [], tweens = [];
		return {
			after: function (sec, fn) { var t = { t: 0, dur: sec, fn: fn, repeat: false }; timers.push(t); return t; },
			every: function (sec, fn) { var t = { t: 0, dur: sec, fn: fn, repeat: true }; timers.push(t); return t; },
			cancel: function (t) { var i = timers.indexOf(t); if (i >= 0) { timers.splice(i, 1); } i = tweens.indexOf(t); if (i >= 0) { tweens.splice(i, 1); } },
			tween: function (obj, props, dur, easing, onDone) {
				var from = {}, k; for (k in props) { from[k] = obj[k]; }
				var tw = { obj: obj, from: from, to: props, dur: dur, t: 0, ease: (typeof easing === 'function' ? easing : ease[easing] || ease.linear), onDone: onDone };
				tweens.push(tw); return tw;
			},
			update: function (dt) {
				var i, t, k;
				for (i = timers.length - 1; i >= 0; i--) {
					t = timers[i]; t.t += dt;
					if (t.t >= t.dur) { if (t.fn) { t.fn(); } if (t.repeat) { t.t -= t.dur; } else { timers.splice(i, 1); } }
				}
				for (i = tweens.length - 1; i >= 0; i--) {
					var tw = tweens[i]; tw.t += dt;
					var p = tw.dur <= 0 ? 1 : Math.min(1, tw.t / tw.dur), e = tw.ease(p);
					for (k in tw.to) { tw.obj[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e; }
					if (p >= 1) { tweens.splice(i, 1); if (tw.onDone) { tw.onDone(); } }
				}
			},
			clear: function () { timers.length = 0; tweens.length = 0; }
		};
	};

	/* ---------------------------- jump reach ------------------------------ */

	// Static platformer reachability from arcade-physics jump params (per-60fps-
	// frame units, matching Retroix.physics): how high and how far one jump goes.
	// Compare maxDist against your level's gap widths to catch impossible jumps
	// before the bot even runs — a pure-data finishability check.
	//   var r = Retroix.jumpReach({ jump: 10.6, gravity: 0.62, run: 2.7 });
	//   // r.maxDist ≈ 92 (px), r.maxHeight ≈ 90 (px)
	Retroix.jumpReach = function (o) {
		o = o || {};
		var v0 = o.jump || 0, g = o.gravity || 0.01, run = o.run || 0;
		var airtime = 2 * v0 / g;
		return { apexFrames: v0 / g, airtimeFrames: airtime, maxHeight: (v0 * v0) / (2 * g), maxDist: run * airtime };
	};

	/* ----------------------------- autopilot ------------------------------ */

	// Dev-mode test harness. A secret key combo (Konami code by default) unleashes
	// a bot that plays the game unattended to check it's finishable and surface
	// crashes / soft-locks. The engine can't *win* an arbitrary game, so pass a
	// game-specific bot(api) policy + closures over your state. Two failure models:
	//   • Finishability (recommended): give the game "infinite lives" (respawn in
	//     place) and pass deaths() (a monotonic failure counter) + location(). The
	//     bot keeps trying; if it dies `deathsPerSpot` times within one `bucket` of
	//     units, that spot is flagged an impassable CHOKEPOINT (adjust the map).
	//     Pair with Retroix.jumpReach for a static "gap wider than the jump" check.
	//   • One-shot: pass isFail() to end the run on the first death.
	// Also watches progress() (stuck watchdog), a timeout, isWin() (success) and
	// crashes; prints an on-screen + console report (with the worst death hotspot).
	// Without a bot a generic masher smoke-tests boot->play. cfg: { combo, start(),
	// stop(), bot(api), progress(), location(), deaths(), isWin(), isFail(),
	// deathsPerSpot=6, bucket=24, stuck=12, timeout=300, onReport(r) }. api:
	// { press, release, tap, only, releaseAll, t, frame }. -> { start,stop,running }.
	Retroix.autopilot = function (cfg) {
		cfg = cfg || {};
		var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
		var combo = cfg.combo || KONAMI;
		var TIMEOUT = cfg.timeout || 300, STUCK = cfg.stuck || 12;
		var DEATHS_PER_SPOT = cfg.deathsPerSpot || 6, BUCKET = cfg.bucket || 24;
		var running = false, raf = null, frame = 0, startT = 0, held = {};
		var maxProg = -Infinity, lastProgT = 0, errors = [], badge = null, panel = null;
		var lastDeaths = 0, totalDeaths = 0, spots = {}, worst = { n: 0, loc: 0 };

		function nkey(k) { return k.length === 1 ? k.toLowerCase() : k; }
		function nowMs() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
		function errStr(e) { return (e && (e.message || e.toString())) || 'error'; }
		function safe(fn) { try { return !!fn(); } catch (e) { errors.push(errStr(e)); return false; } }
		function getNum(fn, d) { try { var v = fn(); return typeof v === 'number' && isFinite(v) ? v : d; } catch (e) { errors.push(errStr(e)); return d; } }

		// input synthesis — drives the game's real keydown/keyup handlers
		function press(k) { if (held[k]) { return; } held[k] = 1; document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); }
		function release(k) { if (!held[k]) { return; } delete held[k]; document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true })); }
		function releaseAll() { for (var k in held) { release(k); } }
		function tap(k, ms) { press(k); setTimeout(function () { release(k); }, ms || 70); }
		function only(keys) { var want = {}, i; for (i = 0; i < keys.length; i++) { want[keys[i]] = 1; press(keys[i]); } for (var h in held) { if (!want[h]) { release(h); } } }
		var api = { press: press, release: release, releaseAll: releaseAll, tap: tap, only: only, t: 0, frame: 0 };

		// fallback bot: shove right, hop, shoot, poke confirm past menus
		function masher(a) {
			a.press('ArrowRight'); a.press('x');
			if (frame % 26 === 0) { a.tap(' ', 90); }
			if (frame % 100 === 0) { a.tap('Enter', 90); }
		}
		function log(m, c) { if (typeof console !== 'undefined' && console.log) { console.log('%c[autopilot] ' + m, 'color:' + (c || '#00e5ff')); } }

		function start() {
			if (running) { return; }
			running = true; frame = 0; startT = nowMs(); maxProg = -Infinity; lastProgT = 0; errors.length = 0;
			lastDeaths = cfg.deaths ? getNum(cfg.deaths, 0) : 0; totalDeaths = 0; spots = {}; worst = { n: 0, loc: 0 };
			showBadge(); log('engaged — ' + (cfg.bot ? 'game bot' : 'generic masher'));
			if (cfg.start) { try { cfg.start(); } catch (e) { errors.push(errStr(e)); } }
			raf = requestAnimationFrame(tick);
		}
		function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } releaseAll(); hideBadge(); if (cfg.stop) { try { cfg.stop(); } catch (e) {} } }

		function tick() {
			if (!running) { return; }
			frame++; var t = (nowMs() - startT) / 1000; api.t = t; api.frame = frame;

			if (cfg.isWin && safe(cfg.isWin)) { return finish('finished', t); }

			// death bucketing — count each failure by where it happened; a spot
			// that kills the bot deathsPerSpot times is an impassable chokepoint.
			if (cfg.deaths) {
				var d = getNum(cfg.deaths, lastDeaths);
				if (d > lastDeaths) {
					var loc = cfg.location ? getNum(cfg.location, maxProg) : getNum(cfg.progress || function () { return t; }, 0);
					var key = Math.round(loc / BUCKET);
					spots[key] = (spots[key] || 0) + (d - lastDeaths); totalDeaths += (d - lastDeaths);
					if (spots[key] > worst.n) { worst = { n: spots[key], loc: loc }; }
					lastDeaths = d;
					if (spots[key] >= DEATHS_PER_SPOT) { return finish('chokepoint', t); }
				}
			} else if (cfg.isFail && safe(cfg.isFail)) { return finish('died', t); }

			var prog = getNum(cfg.progress || function () { return t; }, 0);
			if (prog > maxProg + 0.5) { maxProg = prog; lastProgT = t; }
			if (t > TIMEOUT) { return finish('timeout', t); }
			if (t - lastProgT > STUCK) { return finish('stuck', t); }
			try { (cfg.bot || masher)(api); } catch (e) { errors.push(errStr(e)); }
			raf = requestAnimationFrame(tick);
		}

		function finish(result, t) {
			running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } releaseAll(); if (cfg.stop) { try { cfg.stop(); } catch (e) {} }
			var rep = { result: result, elapsedSec: +t.toFixed(1), frames: frame, maxProgress: Math.round(maxProg === -Infinity ? 0 : maxProg),
				deaths: totalDeaths, hotspot: worst.n ? { location: Math.round(worst.loc), deaths: worst.n } : null, errors: errors.slice() };
			var ok = result === 'finished' && !rep.errors.length;
			var hs = rep.hotspot ? ' · worst spot @' + rep.hotspot.location + ' (' + rep.hotspot.deaths + '×)' : '';
			log('RESULT ' + result.toUpperCase() + ' · ' + rep.elapsedSec + 's · ' + rep.frames + 'f · progress ' + rep.maxProgress + ' · deaths ' + rep.deaths + hs + ' · ' + rep.errors.length + ' error(s)', ok ? '#39ff9e' : '#ff5e7e');
			for (var i = 0; i < rep.errors.length; i++) { if (console && console.error) { console.error('[autopilot] ' + rep.errors[i]); } }
			showPanel(rep, ok);
			if (cfg.onReport) { try { cfg.onReport(rep); } catch (e) {} }
			return rep;
		}

		// self-contained DOM badge/panel (inline styles — no CSS dependency)
		function showBadge() {
			if (badge || typeof document === 'undefined' || !document.body) { return; }
			badge = document.createElement('div');
			badge.textContent = '◉ AUTOPILOT';
			badge.setAttribute('style', 'position:fixed;top:10px;left:10px;z-index:99999;font:12px/1 monospace;color:#00e5ff;background:rgba(9,12,28,.85);padding:8px 12px;border:1px solid #00e5ff;border-radius:6px;letter-spacing:1px;pointer-events:none');
			document.body.appendChild(badge);
		}
		function hideBadge() { if (badge && badge.parentNode) { badge.parentNode.removeChild(badge); } badge = null; }
		function showPanel(r, ok) {
			hideBadge();
			if (typeof document === 'undefined' || !document.body) { return; }
			panel = document.createElement('div');
			panel.setAttribute('style', 'position:fixed;top:10px;left:10px;z-index:99999;font:12px/1.6 monospace;color:#eaf0ff;background:rgba(9,12,28,.94);padding:12px 14px;border:2px solid ' + (ok ? '#39ff9e' : '#ff5e7e') + ';border-radius:8px;max-width:340px');
			panel.innerHTML = '<b style="color:' + (ok ? '#39ff9e' : '#ff5e7e') + '">AUTOPILOT · ' + r.result.toUpperCase() + '</b><br>' +
				r.elapsedSec + 's · ' + r.frames + ' frames · progress ' + r.maxProgress + '<br>deaths: ' + r.deaths +
				(r.hotspot ? '<br><span style="color:#ffd166">worst spot: @' + r.hotspot.location + ' · ' + r.hotspot.deaths + ' deaths</span>' : '') +
				(r.result === 'chokepoint' ? '<br><span style="color:#ff8aa0">impassable — adjust the map here</span>' : '') +
				'<br>errors: ' + r.errors.length +
				(r.errors.length ? '<br><span style="color:#ff8aa0">' + util.escapeHtml(r.errors[0]) + '</span>' : '') +
				'<br><span style="color:#9fb0d8">press any key to dismiss</span>';
			document.body.appendChild(panel);
			var dismiss = function () { if (panel && panel.parentNode) { panel.parentNode.removeChild(panel); } panel = null; };
			setTimeout(function () { document.addEventListener('keydown', dismiss, { once: true }); }, 400);
			setTimeout(dismiss, 15000);
		}

		// secret-combo listener (always on; cheap) + crash capture while running
		if (typeof document !== 'undefined') {
			var buf = [];
			document.addEventListener('keydown', function (e) {
				buf.push(nkey(e.key)); if (buf.length > combo.length) { buf.shift(); }
				if (buf.length === combo.length) {
					var hit = true; for (var i = 0; i < combo.length; i++) { if (buf[i] !== nkey(combo[i])) { hit = false; break; } }
					if (hit) { buf.length = 0; running ? stop() : start(); }
				}
			});
			if (typeof window !== 'undefined') { window.addEventListener('error', function (e) { if (running) { errors.push((e.message || 'error') + (e.lineno ? ' @' + e.lineno : '')); } }); }
		}

		return { start: start, stop: stop, running: function () { return running; } };
	};

	return Retroix;
});
