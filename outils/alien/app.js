/* Interface sans dépendance réseau ; le mode fichier est un atelier local. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const local = location.protocol === 'file:';
  const storageKey = 'alien-accessoires:atelier:v1';
  const sessionKey = 'alien-accessoires:connexion';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let engine, state, role = 'gm', token = '', playerId = '', preview = false, instrument = 'muthur';
  let currentOperator = '', firstRender = true, lastCue = '', toastTimer, requestQueue = Promise.resolve();
  let audio = null, soundEnabled = false, lastBeep = 0, lastTypeBeep = 0, lastNoise = 0, streamAbort;
  const typing = new Map();
  const notification = (message, error = false) => {
    $('toast').textContent = message; $('toast').classList.toggle('error', error); $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3200);
  };
  const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSave = () => { try { localStorage.setItem(storageKey, JSON.stringify(engine.sauvegarde())); } catch { notification('Sauvegarde locale indisponible.', true); } };
  function connection(connected, label) { $('connectionDot').classList.toggle('offline', !connected); $('connectionLabel').textContent = label; }
  function beep(frequency = 660, duration = .07, volume = .06) {
    if (!audio || !soundEnabled || audio.state !== 'running') return;
    const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, audio.currentTime); gain.gain.linearRampToValueAtTime(volume, audio.currentTime + .008); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration + .01);
  }
  async function api(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers } });
    const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Liaison interrompue.'); return payload;
  }
  function selectedPlayer() { return role === 'gm' ? state?.players[currentOperator] : state?.player; }
  function trackerState() {
    const t = state?.tracker; if (!t) return null;
    if (preview && t.target !== 'all' && t.target !== currentOperator) return { ...t, power: false };
    return t;
  }
  function act(action) {
    if (['command', 'reply', 'hack', 'revoke'].includes(action.type) && role === 'gm') action.playerId = currentOperator;
    if (local) {
      try { engine.agir('gm', '', action); state = engine.snapshot('gm'); safeSave(); render(); return Promise.resolve(true); }
      catch (error) { notification(error.message, true); return Promise.resolve(false); }
    }
    const next = requestQueue.then(async () => {
      try { await api('/api/action', { method: 'POST', body: JSON.stringify(action) }); state = await api('/api/state'); render(); return true; }
      catch (error) { notification(error.message, true); return false; }
    }); requestQueue = next; return next;
  }
  function options(select, entries) {
    const previous = select.value, signature = JSON.stringify(entries);
    if (select.dataset.signature === signature) return;
    select.dataset.signature = signature; select.replaceChildren();
    entries.forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; select.append(option); });
    if (entries.some(([value]) => value === previous)) select.value = previous;
  }
  function fill(id, value, formId) {
    if ($(formId)?.dataset.dirty === 'true' || document.activeElement === $(id)) return;
    $(id).value = value ?? '';
  }
  function renderDocument(force = false) {
    if (role !== 'gm' || !state) return;
    if ($('documentForm').dataset.dirty === 'true' && !force) return;
    const doc = state.documents.find(d => d.id === $('documentSelect').value); if (!doc) return;
    $('documentTitle').value = doc.title; $('documentAccess').value = doc.access; $('documentCode').value = doc.code; $('documentBody').value = doc.body;
    $('documentCode').disabled = doc.access !== 'code';
  }
  function appendMessage(message, animated) {
    const item = document.createElement('div'); item.className = 'log-message ' + message.kind; item.dataset.messageId = message.id;
    const label = document.createElement('div'); label.className = 'message-label';
    label.textContent = message.kind === 'input' ? 'OPÉRATEUR' : message.kind === 'mother' ? 'MU/TH/UR · TRANSMISSION' : 'MU/TH/UR · SYSTÈME';
    const text = document.createElement('span'); item.append(label, text); $('log').append(item);
    if (animated && !reduceMotion && message.kind !== 'input') {
      text.classList.add('type-cursor'); typing.set(message.id, { el: text, value: message.content, at: performance.now(), duration: Math.min(6000, message.content.length * 16) });
      beep(message.kind === 'error' ? 210 : 880, .08, .045);
    } else text.textContent = message.content;
  }
  function renderLog(p) {
    const log = $('log'); const identity = p?.id || '';
    if (log.dataset.operator !== identity) { log.replaceChildren(); log.dataset.operator = identity; typing.clear(); firstRender = true; lastCue = ''; }
    const messages = p?.messages || [], ids = new Set(messages.map(m => m.id));
    log.querySelectorAll('[data-message-id]').forEach(el => { if (!ids.has(el.dataset.messageId)) { typing.delete(el.dataset.messageId); el.remove(); } });
    if (!log.querySelector('.boot')) { const boot = document.createElement('div'); boot.className = 'boot'; boot.textContent = 'MU/TH/UR 6000 — INTERFACE ÉQUIPAGE\nCONNEXION ÉTABLIE.\n\nQue puis-je faire pour vous ?'; log.prepend(boot); }
    let changed = false;
    messages.forEach((m, i) => { if (!Array.from(log.querySelectorAll('[data-message-id]')).some(el => el.dataset.messageId === m.id)) { appendMessage(m, !firstRender && i === messages.length - 1); changed = true; } });
    if (changed) log.scrollTop = log.scrollHeight;
    if (p?.cue && p.cue.id !== lastCue) {
      lastCue = p.cue.id;
      if (!firstRender && Date.now() - p.cue.at < p.cue.duration) { $('hackOverlay').dataset.until = p.cue.at + p.cue.duration; $('hackOverlay').dataset.start = p.cue.at; $('hackOverlay').classList.toggle('failure', !p.cue.success); }
    }
    firstRender = false;
  }
  function render() {
    if (!state) return;
    $('join').classList.add('hidden'); $('workspace').classList.remove('hidden');
    const gm = role === 'gm';
    $('controls').classList.toggle('hidden', !gm || preview); $('layout').classList.toggle('player-view', !gm || preview);
    $('previewButton').classList.toggle('hidden', !gm); $('previewButton').textContent = preview ? 'Retour au poste meneur ↙' : 'Vue joueur ↗';
    $('modeLabel').textContent = gm && !preview ? 'POSTE MENEUR' : gm ? 'APERÇU JOUEUR' : 'POSTE ÉQUIPAGE';
    $('modeHint').textContent = gm && !preview ? 'Vous contrôlez ce que l’équipage reçoit.' : 'Interface de bord · liaison privée';
    $('vessel').textContent = state.config.vessel; $('terminalVessel').textContent = state.config.vessel;
    $('footerMode').textContent = local ? 'ATELIER LOCAL · DONNÉES DANS CE NAVIGATEUR' : 'LIAISON AU SERVEUR DE TABLE';
    if (gm) {
      const players = Object.values(state.players); options($('operator'), players.map(p => [p.id, p.name]));
      if (!state.players[currentOperator]) currentOperator = players[0]?.id || '';
      $('operator').value = currentOperator; options($('trackerTarget'), [['all', 'Tout l’équipage'], ...players.map(p => [p.id, p.name])]); $('trackerTarget').value = state.tracker.target;
      options($('documentSelect'), state.documents.map(d => [d.id, d.title])); renderDocument();
      fill('vesselInput', state.config.vessel, 'configForm'); fill('statusInput', state.config.status, 'configForm'); fill('adminPassword', state.config.adminPassword, 'passwordForm');
      $('crtToggle').checked = state.config.crt; $('glitchToggle').checked = state.config.glitches;
      const p = selectedPlayer(), waiting = p?.request;
      $('request').classList.toggle('pending', !!waiting); $('request').lastElementChild.textContent = waiting?.type === 'hack' ? 'Intrusion demandée. Vous décidez de son issue.' : waiting ? 'Une transmission attend votre réponse.' : players.length ? 'Aucune requête en attente.' : 'En attente d’un opérateur connecté.';
      $('hackButtons').classList.toggle('hidden', waiting?.type !== 'hack');
      $('replyText').disabled = !p; $('replyForm').querySelector('button').disabled = !p; $('revokeButton').disabled = !p;
      for (const key of ['intensity', 'contacts', 'proximity', 'noise', 'volume']) { if (document.activeElement !== $(key)) $(key).value = state.tracker[key]; $(key + 'Value').textContent = state.tracker[key]; }
      $('powerButton').textContent = state.tracker.power ? 'Arrêter le détecteur' : 'Activer le détecteur'; $('powerButton').setAttribute('aria-pressed', String(state.tracker.power));
      document.querySelectorAll('[data-intensity]').forEach(b => b.classList.toggle('selected', Number(b.dataset.intensity) === state.tracker.intensity));
      $('resetButton').textContent = local ? 'Réinitialiser la maquette' : 'Réinitialiser la table';
    }
    const p = selectedPlayer(); $('sessionName').textContent = p?.name || 'EN ATTENTE';
    $('accessBadge').textContent = p?.access === 'admin' ? 'ADMINISTRATEUR' : 'ÉQUIPAGE'; $('accessBadge').classList.toggle('admin', p?.access === 'admin');
    $('commandInput').disabled = !p; document.querySelectorAll('.terminal-shortcuts button').forEach(b => b.disabled = !p);
    $('terminalScreen').classList.toggle('crt-off', !state.config.crt); $('radarScreen').classList.toggle('crt-off', !state.config.crt);
    renderLog(p); const t = trackerState();
    $('radarIdle').classList.toggle('hidden', !!t?.power); $('trackerBadge').textContent = t?.power ? 'SCAN ACTIF' : 'VEILLE';
    const label = !t?.power ? 'AUCUN BALAYAGE' : t.intensity < 30 ? 'SIGNAL FAIBLE' : t.intensity < 65 ? 'CONTACTS INTERMITTENTS' : t.intensity < 90 ? 'CONTACTS EN APPROCHE' : 'SIGNAL CRITIQUE';
    $('signalLabel').textContent = label; $('scanLabel').textContent = t?.power ? 'BALAYAGE EN COURS' : 'VEILLE'; $('radarState').textContent = t?.power ? 'ACQUISITION' : 'VEILLE';
    $('radarEcho').textContent = t?.power ? 'ÉCHOS : ' + (t.contacts + (t.anomalyUntil > Date.now() ? 1 : 0)) : '—';
  }
  function chooseInstrument(value) {
    instrument = value === 'tracker' ? 'tracker' : 'muthur'; $('terminalInstrument').classList.toggle('hidden', instrument !== 'muthur'); $('trackerInstrument').classList.toggle('hidden', instrument !== 'tracker');
    document.querySelectorAll('[data-instrument]').forEach(b => b.classList.toggle('selected', b.dataset.instrument === instrument));
  }
  document.querySelectorAll('[data-panel]').forEach(button => button.onclick = () => {
    document.querySelectorAll('[data-panel]').forEach(b => { const selected = b === button; b.setAttribute('aria-selected', String(selected)); $('panel-' + b.dataset.panel).classList.toggle('hidden', !selected); });
    if (button.dataset.panel === 'tracker') chooseInstrument('tracker'); else chooseInstrument('muthur');
  });
  document.querySelectorAll('[data-instrument]').forEach(button => button.onclick = () => chooseInstrument(button.dataset.instrument));
  $('previewButton').onclick = () => { preview = !preview; render(); };
  $('operator').onchange = () => { currentOperator = $('operator').value; $('hackOverlay').dataset.until = '0'; render(); };
  $('soundButton').onclick = async () => {
    try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); await audio.resume(); soundEnabled = !soundEnabled; $('soundButton').setAttribute('aria-pressed', String(soundEnabled)); $('soundButton').textContent = soundEnabled ? 'Son activé' : 'Son désactivé'; if (soundEnabled) beep(780, .08, .05); }
    catch { notification('Le navigateur n’a pas autorisé le son.', true); }
  };
  $('commandForm').onsubmit = event => { event.preventDefault(); const text = $('commandInput').value; $('commandInput').value = ''; act({ type: 'command', text }); };
  document.querySelectorAll('[data-command]').forEach(button => button.onclick = () => act({ type: 'command', text: button.dataset.command }));
  $('loginButton').onclick = () => { $('loginPassword').value = ''; $('loginDialog').showModal(); $('loginPassword').focus(); };
  $('cancelLogin').onclick = () => $('loginDialog').close();
  $('loginForm').onsubmit = event => { event.preventDefault(); const value = $('loginPassword').value; $('loginPassword').value = ''; $('loginDialog').close(); act({ type: 'command', text: 'LOGIN ' + value }); };
  for (const id of ['configForm', 'passwordForm', 'documentForm']) $(id).addEventListener('input', () => $(id).dataset.dirty = 'true');
  $('replyForm').onsubmit = async event => { event.preventDefault(); if (await act({ type: 'reply', text: $('replyText').value })) $('replyText').value = ''; };
  $('configForm').onsubmit = async event => { event.preventDefault(); const c = { vessel: $('vesselInput').value, status: $('statusInput').value }; if (await act({ type: 'config', config: c })) { $('configForm').dataset.dirty = 'false'; render(); notification('État du vaisseau enregistré.'); } };
  $('passwordForm').onsubmit = async event => { event.preventDefault(); if (await act({ type: 'config', config: { adminPassword: $('adminPassword').value } })) { $('passwordForm').dataset.dirty = 'false'; render(); notification('Mot de passe enregistré.'); } };
  $('documentSelect').onchange = () => { $('documentForm').dataset.dirty = 'false'; renderDocument(true); };
  $('documentAccess').onchange = () => $('documentCode').disabled = $('documentAccess').value !== 'code';
  $('documentForm').onsubmit = async event => { event.preventDefault(); const d = { title: $('documentTitle').value, access: $('documentAccess').value, code: $('documentCode').value, body: $('documentBody').value }; if (await act({ type: 'document', id: $('documentSelect').value, document: d })) { $('documentForm').dataset.dirty = 'false'; render(); notification('Dossier enregistré.'); } };
  $('crtToggle').onchange = () => act({ type: 'config', config: { crt: $('crtToggle').checked } }); $('glitchToggle').onchange = () => act({ type: 'config', config: { glitches: $('glitchToggle').checked } });
  $('hackSuccess').onclick = () => act({ type: 'hack', success: true }); $('hackFail').onclick = () => act({ type: 'hack', success: false });
  $('revokeButton').onclick = () => act({ type: 'revoke' });
  $('powerButton').onclick = () => act({ type: 'tracker', tracker: { power: !state.tracker.power } });
  document.querySelectorAll('[data-intensity]').forEach(button => button.onclick = () => act({ type: 'tracker', tracker: { intensity: Number(button.dataset.intensity) } }));
  const rangeTimers = {};
  for (const key of ['intensity', 'contacts', 'proximity', 'noise', 'volume']) {
    $(key).oninput = () => { $(key + 'Value').textContent = $(key).value; clearTimeout(rangeTimers[key]); const value = Number($(key).value); rangeTimers[key] = setTimeout(() => act({ type: 'tracker', tracker: { [key]: value } }), 70); };
  }
  $('trackerTarget').onchange = () => act({ type: 'tracker', tracker: { target: $('trackerTarget').value } });
  $('anomalyButton').onclick = () => act({ type: 'anomaly' });
  $('startCountdown').onclick = () => { if ($('minutes').reportValidity()) act({ type: 'countdown', minutes: Number($('minutes').value) }); }; $('stopCountdown').onclick = () => act({ type: 'countdown', minutes: 0 });
  $('resetButton').onclick = async () => { if (!confirm('Réinitialiser les dialogues, codes, accès et effets de cette table Alien ?')) return; if (await act({ type: 'reset' })) { for (const id of ['configForm', 'documentForm', 'passwordForm']) $(id).dataset.dirty = 'false'; render(); notification('Table réinitialisée.'); } };

  const radar = $('radarCanvas'), ctx = radar.getContext('2d'), noise = $('noiseCanvas'), nctx = noise.getContext('2d'), noiseData = nctx.createImageData(160, 120);
  function drawRadar(time) {
    if (instrument !== 'tracker' || !state) return;
    const t = trackerState(), rect = radar.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    if (!rect.width || !rect.height) return;
    if (radar.width !== Math.round(rect.width * dpr) || radar.height !== Math.round(rect.height * dpr)) { radar.width = Math.round(rect.width * dpr); radar.height = Math.round(rect.height * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const w = rect.width, h = rect.height, cx = w / 2, cy = h / 2, radius = Math.min(w, h) * .38;
    ctx.clearRect(0, 0, w, h); ctx.lineWidth = .8; ctx.strokeStyle = '#4a885338';
    for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, radius * i / 4, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, r = radius + 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.lineTo(cx + Math.cos(a) * (r + (i % 5 ? 3 : 7)), cy + Math.sin(a) * (r + (i % 5 ? 3 : 7))); ctx.stroke(); }
    if (!t.power) return;
    const angle = time / (7000 - t.intensity * 40) * Math.PI * 2;
    for (let i = 30; i >= 0; i--) { const a = angle - i * .013; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, a, a + .015); ctx.closePath(); ctx.fillStyle = 'rgba(128,228,157,' + (.17 * (1 - i / 31)) + ')'; ctx.fill(); }
    ctx.strokeStyle = '#9bddae99'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx.stroke();
    const anomaly = t.anomalyUntil > Date.now(), count = t.contacts + (anomaly ? 1 : 0), tone = t.intensity > 89 ? '#e7b17d' : '#b9f8c9';
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996 + t.seed * .67 + Math.sin(time / 800 + i) * t.intensity / 1000;
      const r = radius * (.2 + (1 - t.proximity / 100) * .57) * (.75 + (i % 3) * .12);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, pulse = .6 + Math.sin(time / (500 - t.intensity * 3) + i) * .3;
      ctx.globalAlpha = pulse; ctx.shadowColor = tone; ctx.shadowBlur = 14; ctx.fillStyle = tone; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = tone; ctx.globalAlpha = .12; ctx.beginPath(); ctx.arc(x, y, 8 + Math.sin(time / 600 + i) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#dcfce4'; ctx.beginPath(); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy + 4); ctx.closePath(); ctx.fill();
    if (t.noise > 0 && state.config.glitches && !reduceMotion) {
      ctx.globalAlpha = t.noise / 100 * .17; ctx.fillStyle = '#98bd9f'; const y = (time * .09) % h; ctx.fillRect(0, y, w, 3); ctx.globalAlpha = 1;
    }
    $('radarEcho').textContent = 'ÉCHOS : ' + count;
    if (time - lastBeep > Math.max(260, 2300 - t.intensity * 21) && t.intensity > 0 && count > 0) { lastBeep = time; beep(t.intensity > 70 ? 960 : 760, .09, t.volume / 100 * .15); }
  }
  function frame(time) {
    requestAnimationFrame(frame); if (!state || document.hidden) return;
    for (const [id, work] of typing) {
      if (!work.el.isConnected) { typing.delete(id); continue; }
      const progress = Math.min(1, (time - work.at) / Math.max(1, work.duration)); work.el.textContent = work.value.slice(0, Math.ceil(work.value.length * progress));
      if (instrument === 'muthur' && time - lastTypeBeep > 90) { lastTypeBeep = time; beep(1600 + (Math.floor(time) % 400), .017, .014); }
      if (progress === 1) { work.el.classList.remove('type-cursor'); typing.delete(id); } $('log').scrollTop = $('log').scrollHeight;
    }
    const until = Number($('hackOverlay').dataset.until || 0), activeHack = Date.now() < until;
    $('hackOverlay').classList.toggle('hidden', !activeHack);
    if (activeHack) { const elapsed = Date.now() - Number($('hackOverlay').dataset.start), progress = Math.min(100, elapsed / 70); $('hackProgress').style.width = progress + '%'; const lines = ['> INITIALISATION DU CANAL', '> ANALYSE DES AUTORISATIONS', '> RECHERCHE DE MOT DE PASSE…', '> VÉRIFICATION DES CONTRE-MESURES', '> NÉGOCIATION DES PRIVILÈGES']; $('hackText').textContent = lines.slice(0, Math.min(5, 1 + Math.floor(progress / 20))).join('\n') + '\n\n' + (progress > 80 ? ($('hackOverlay').classList.contains('failure') ? 'ACCÈS REFUSÉ.' : 'ACCÈS ACCORDÉ.') : 'TRAITEMENT ' + Math.floor(progress) + '%'); }
    const glitch = state.config.glitches && !reduceMotion;
    $('noiseCanvas').style.display = glitch ? 'block' : 'none';
    if (instrument === 'muthur' && glitch && time - lastNoise > 100) {
      lastNoise = time; for (let i = 0; i < noiseData.data.length; i += 4) { const v = Math.random() * 255; noiseData.data[i] = v; noiseData.data[i + 1] = v; noiseData.data[i + 2] = v; noiseData.data[i + 3] = 255; } nctx.putImageData(noiseData, 0, 0);
      const burst = activeHack ? Math.sin(time / 130) * 3 : Math.floor(time / 160) % 47 === 0 ? 2 : 0; $('terminalScreen').style.setProperty('--glitch-shift', burst + 'px'); $('noiseCanvas').style.opacity = activeHack ? '.08' : '.025';
    } else if (!glitch) $('terminalScreen').style.setProperty('--glitch-shift', '0px');
    drawRadar(time); const c = state.countdown; $('countdown').classList.toggle('hidden', !c);
    if (c) { const seconds = Math.max(0, Math.ceil((c.endAt - Date.now()) / 1000)); $('countdownTime').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
  }
  async function stream() {
    while (token) {
      streamAbort = new AbortController();
      try {
        const response = await fetch('/api/events', { headers: { Authorization: 'Bearer ' + token }, signal: streamAbort.signal });
        if (!response.ok || !response.body) throw new Error('Liaison interrompue.'); connection(true, 'LIAISON ACTIVE');
        const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
        while (true) { const part = await reader.read(); if (part.done) break; buffer += decoder.decode(part.value, { stream: true }); let end;
          while ((end = buffer.indexOf('\n\n')) >= 0) { const block = buffer.slice(0, end); buffer = buffer.slice(end + 2); const line = block.split('\n').find(s => s.startsWith('data: ')); if (line) { state = JSON.parse(line.slice(6)); render(); } }
        }
      } catch { connection(false, 'RECONNEXION…'); }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  async function connect() {
    const result = await api('/api/session'); role = result.role; playerId = result.playerId || '';
    state = await api('/api/state');
    if (role === 'gm') { const table = await api('/api/table'); $('tableCode').textContent = 'Code de table : ' + table.code; $('playerAddress').textContent = table.addresses.join(' · '); }
    $('demoCredentials').classList.toggle('hidden', !local); render(); stream();
  }
  $('joinForm').onsubmit = async event => {
    event.preventDefault();
    try { const result = await api('/api/join', { method: 'POST', body: JSON.stringify({ name: $('joinName').value, code: $('joinCode').value }) }); token = result.token; try { sessionStorage.setItem(sessionKey, token); } catch { /* La liaison reste utilisable. */ } await connect(); }
    catch (error) { notification(error.message, true); }
  };
  async function start() {
    chooseInstrument(new URLSearchParams(location.search).get('outil'));
    if (local) {
      let saved; try { saved = JSON.parse(safeGet(storageKey) || 'null'); } catch { notification('Ancienne sauvegarde illisible : nouvel atelier.', true); }
      if (saved) { saved.tracker.power = false; saved.countdown = null; Object.values(saved.players || {}).forEach(p => p.cue = null); }
      engine = AlienCore.créer(saved); engine.inscrire('reyes', 'REYES'); engine.inscrire('sato', 'SATO'); state = engine.snapshot('gm'); currentOperator = 'reyes';
      connection(true, 'ATELIER LOCAL'); $('tableCode').textContent = 'Mode fichier : aperçu meneur et joueur dans ce navigateur.'; $('playerAddress').textContent = 'Le serveur local permet la connexion des tablettes.'; render();
    } else {
      const fragment = new URLSearchParams(location.hash.slice(1)); token = fragment.get('mj') || ''; if (token) history.replaceState(null, '', location.pathname + location.search);
      try { if (!token) token = sessionStorage.getItem(sessionKey) || ''; else sessionStorage.setItem(sessionKey, token); } catch { /* Pas de stockage requis pour la session actuelle. */ }
      if (token) { try { await connect(); } catch { token = ''; $('join').classList.remove('hidden'); connection(false, 'CONNEXION REQUISE'); } }
      else { $('join').classList.remove('hidden'); connection(false, 'CONNEXION REQUISE'); }
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('pagehide', () => streamAbort?.abort()); start().catch(error => notification(error.message, true));
})();
