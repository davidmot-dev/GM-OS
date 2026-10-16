/* Interface sans dépendance réseau ; le mode fichier est un atelier local. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const local = location.protocol === 'file:';
  const storageKey = 'alien-accessoires:atelier:v1';
  const sessionKey = 'alien-accessoires:connexion';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let engine, state, role = 'gm', token = '', preview = false, instrument = 'muthur';
  let currentOperator = '', firstRender = true, lastCue = '', toastTimer, requestQueue = Promise.resolve();
  let audio = null, alarme = null, soundEnabled = false, lastBeep = 0, lastTypeBeep = 0, lastNoise = 0, streamAbort;
  let filmPrioritaire = false, liaisonActive = false;
  const film = AlienVideoAlerte.creer({ element: $('videoAlerte'), source: 'medias/nostromo-autodestruction.webm',
    signaler: message => { $('videoStatus').textContent = message; },
    lectureChange: actif => { filmPrioritaire = actif; suivreAlarme(); } });
  function suivreAlarme() { if (state) alarme?.suivre(state.autodestruction, state.countdown?.endAt, liaisonActive && soundEnabled && state.diffusionAutorisee && !filmPrioritaire); }
  const typing = new Map();
  const notification = (message, error = false) => {
    $('toast').textContent = message; $('toast').classList.toggle('error', error); $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3200);
  };
  const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSave = () => { try { localStorage.setItem(storageKey, JSON.stringify(engine.sauvegarde())); } catch { notification('Sauvegarde locale indisponible.', true); } };
  function connection(connected, label) { liaisonActive = connected; $('connectionDot').classList.toggle('offline', !connected); $('connectionLabel').textContent = label; if (!connected) { alarme?.arreter(); film.arreter(); } }
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
  function demandeSelectionnee() { return selectedPlayer()?.requests.find(d => d.id === $('demandeSelect').value && d.status === 'pending'); }
  function renderDemandes() {
    const p = selectedPlayer(), attentes = p?.requests.filter(d => d.status === 'pending') || [];
    options($('demandeSelect'), [...attentes.map((d, i) => [d.id, `${i + 1}. ${d.type === 'hack' ? 'Piratage' : d.content.slice(0, 65)}`]), ['', 'Message libre à cet opérateur']]);
    const demande = demandeSelectionnee();
    $('demandeContenu').textContent = demande?.content || '';
    $('hackButtons').classList.toggle('hidden', demande?.type !== 'hack');
    $('replyText').disabled = !p || demande?.type === 'hack'; $('replyForm').querySelector('button').disabled = $('replyText').disabled;
    $('demandesTraitees').replaceChildren();
    for (const d of p?.requests.filter(d => d.status !== 'pending') || []) {
      const ligne = document.createElement('p');
      ligne.textContent = `${({ answered: 'Répondu', accepted: 'Autorisé', refused: 'Refusé', cancelled: 'Annulé' })[d.status]} : ${d.content}\n${d.response}`;
      $('demandesTraitees').append(ligne);
    }
  }
  function renderPrereglages(force = false) {
    options($('prereglageSelect'), [['', 'Nouveau préréglage…'], ...state.prereglagesDetecteur.map(p => [p.id, p.nom])]);
    const pr = state.prereglagesDetecteur.find(p => p.id === $('prereglageSelect').value);
    if (force) { $('prereglageNom').value = pr?.nom || ''; $('confirmerPrereglage').checked = false; }
    $('chargerPrereglage').disabled = !pr;
    $('supprimerPrereglage').disabled = !pr || !$('confirmerPrereglage').checked;
  }
  function trackerState() {
    const t = state?.tracker; if (!t) return null;
    if (preview && t.target !== 'all' && t.target !== currentOperator) return { ...t, power: false };
    return t;
  }
  function act(action) {
    if (['command', 'reply', 'hack', 'revoke'].includes(action.type) && role === 'gm') action.playerId = currentOperator;
    if (local) {
      try { engine.agir('gm', '', action, { appareilId: 'atelier-local' }); state = engine.snapshot('gm', '', 'atelier-local'); safeSave(); render(); return Promise.resolve(true); }
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
  function reglerVisibiliteCode(id, visible = false) {
    const saisie = $(id), bouton = document.querySelector(`[data-code="${id}"]`);
    saisie.type = visible ? 'text' : 'password';
    bouton.textContent = visible ? 'Masquer' : 'Afficher';
    bouton.setAttribute('aria-label', bouton.textContent + ' le ' + bouton.dataset.libelle);
    bouton.setAttribute('aria-pressed', String(visible));
  }
  document.querySelectorAll('[data-code]').forEach(bouton => {
    bouton.onclick = () => reglerVisibiliteCode(bouton.dataset.code, $(bouton.dataset.code).type === 'password');
  });
  function masquerCodes() {
    document.querySelectorAll('[data-code]').forEach(bouton => reglerVisibiliteCode(bouton.dataset.code));
  }
  function renderDocument(force = false) {
    if (role !== 'gm' || !state) return;
    if ($('documentForm').dataset.dirty === 'true' && !force) return;
    const doc = state.documents.find(d => d.id === $('documentSelect').value);
    $('documentId').value = doc?.id || ''; $('documentId').readOnly = !!doc;
    if (doc) $('documentId').removeAttribute('pattern'); else $('documentId').pattern = '[a-z](?:[a-z0-9]|-){0,63}';
    $('documentLecture').textContent = doc ? 'Commande de lecture : READ ' + doc.id : 'Identifiant pour READ : lettres minuscules sans accent, chiffres et tirets ; commencer par une lettre.';
    $('documentTitle').value = doc?.title || ''; $('documentAccess').value = doc?.access || 'crew'; $('documentCode').value = doc?.code || ''; $('documentBody').value = doc?.body || '';
    $('documentCode').disabled = $('documentAccess').value !== 'code'; $('documentCode').required = !doc && $('documentAccess').value === 'code';
    $('afficherCodeDossier').disabled = $('documentCode').disabled;
    if (force) reglerVisibiliteCode('documentCode');
    $('documentEnregistrer').textContent = doc ? 'Enregistrer le dossier' : 'Créer le dossier';
    const index = state.documents.findIndex(d => d.id === doc?.id);
    $('monterDossier').disabled = index <= 0; $('descendreDossier').disabled = index < 0 || index === state.documents.length - 1;
    $('supprimerDossier').disabled = !doc || !$('confirmerDossier').checked;
    if (force) { $('confirmerDossier').checked = false; $('supprimerDossier').disabled = true; }
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
  function renderProtocole(force = false) {
    if (role !== 'gm' || !state) return;
    options($('protocoleSelect'), [['nouveau', 'Nouveau protocole…'], ...state.protocoles.map(pr => [pr.id, pr.nom + (pr.actif ? '' : ' · Inactif')])]);
    if ($('protocoleForm').dataset.dirty === 'true' && !force) return;
    if (force) reglerVisibiliteCode('protocoleCode');
    const pr = state.protocoles.find(element => element.id === $('protocoleSelect').value);
    $('protocoleForm').dataset.id = pr?.id || $('protocoleForm').dataset.id || 'protocole-' + crypto.randomUUID();
    for (const [champ, cle, defaut] of [['Nom', 'nom', ''], ['Code', 'code', ''], ['Message', 'message', ''], ['Effet', 'effet', 'message'], ['Minutes', 'minutes', 10], ['Portee', 'portee', 'equipage']]) $('protocole' + champ).value = pr?.[cle] ?? defaut;
    $('protocoleActif').checked = pr?.actif || false; $('supprimerProtocole').classList.toggle('hidden', !pr);
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
      options($('documentSelect'), [['', 'Nouveau dossier…'], ...state.documents.map(d => [d.id, d.title])]); renderDocument();
      renderProtocole();
      fill('vesselInput', state.config.vessel, 'configForm'); fill('statusInput', state.config.status, 'configForm'); fill('adminPassword', state.config.adminPassword, 'passwordForm');
      $('crtToggle').checked = state.config.crt; $('glitchToggle').checked = state.config.glitches;
      const p = selectedPlayer(), waiting = p?.request;
      $('request').classList.toggle('pending', !!waiting); $('request').lastElementChild.textContent = waiting?.type === 'hack' ? 'Intrusion demandée. Vous décidez de son issue.' : waiting ? 'Une transmission attend votre réponse.' : players.length ? 'Aucune requête en attente.' : 'En attente d’un opérateur connecté.';
      $('hackButtons').classList.toggle('hidden', waiting?.type !== 'hack');
      $('replyText').disabled = !p; $('replyForm').querySelector('button').disabled = !p; $('revokeButton').disabled = !p;
      renderDemandes(); renderPrereglages();
      for (const key of ['intensity', 'contacts', 'proximity', 'noise', 'volume']) { if (document.activeElement !== $(key)) $(key).value = state.tracker[key]; $(key + 'Value').textContent = state.tracker[key]; }
      $('powerButton').textContent = state.tracker.power ? 'Arrêter le détecteur' : 'Activer le détecteur'; $('powerButton').setAttribute('aria-pressed', String(state.tracker.power));
      document.querySelectorAll('[data-intensity]').forEach(b => b.classList.toggle('selected', Number(b.dataset.intensity) === state.tracker.intensity));
      $('resetButton').textContent = local ? 'Réinitialiser la maquette' : 'Réinitialiser la table';
    }
    const p = selectedPlayer(); $('sessionName').textContent = p?.name || 'EN ATTENTE';
    document.body.classList.toggle('alerte-autodestruction', !!state.autodestruction);
    $('autoDestruction').classList.toggle('hidden', !state.autodestruction);
    $('autoDestructionMessage').textContent = state.autodestruction?.message || '';
    $('diffusionButton').setAttribute('aria-pressed', String(state.diffusionAutorisee));
    $('diffusionButton').textContent = state.diffusionAutorisee ? 'Ne plus diffuser ici' : 'Diffuser l’alarme ici';
    film.suivre(state.autodestruction, state.countdown?.endAt, liaisonActive && soundEnabled && state.diffusionAutorisee);
    suivreAlarme();
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
    masquerCodes();
    document.querySelectorAll('[data-panel]').forEach(b => { const selected = b === button; b.setAttribute('aria-selected', String(selected)); $('panel-' + b.dataset.panel).classList.toggle('hidden', !selected); });
    if (button.dataset.panel === 'tracker') chooseInstrument('tracker'); else chooseInstrument('muthur');
  });
  document.querySelectorAll('[data-instrument]').forEach(button => button.onclick = () => chooseInstrument(button.dataset.instrument));
  $('previewButton').onclick = () => { preview = !preview; masquerCodes(); render(); };
  $('operator').onchange = () => { currentOperator = $('operator').value; $('hackOverlay').dataset.until = '0'; render(); };
  $('soundButton').onclick = async () => {
    try { if (!audio) { audio = new (window.AudioContext || window.webkitAudioContext)(); alarme = AlienAlarme.creer({ audio, signaler: message => { $('alarmStatus').textContent = message; } }); } await audio.resume(); soundEnabled = !soundEnabled; if (!soundEnabled) alarme?.arreter(); $('soundButton').setAttribute('aria-pressed', String(soundEnabled)); $('soundButton').textContent = soundEnabled ? 'Son activé' : 'Son désactivé'; if (soundEnabled) beep(780, .08, .05); render(); }
    catch { notification('Le navigateur n’a pas autorisé le son.', true); }
  };
  $('diffusionButton').onclick = () => act({ type: 'diffusion', actif: !state?.diffusionAutorisee });
  $('reprendreVideo').onclick = () => film.reprendre();
  $('protocoleSelect').onchange = () => { $('protocoleForm').dataset.dirty = 'false'; $('protocoleForm').dataset.id = ''; renderProtocole(true); };
  $('protocoleForm').oninput = () => { $('protocoleForm').dataset.dirty = 'true'; };
  $('protocoleForm').onsubmit = async event => {
    event.preventDefault(); const id = $('protocoleForm').dataset.id;
    const protocole = { id, nom: $('protocoleNom').value, code: $('protocoleCode').value.trim(), message: $('protocoleMessage').value, effet: $('protocoleEffet').value,
      minutes: Number($('protocoleMinutes').value), portee: $('protocolePortee').value, actif: $('protocoleActif').checked };
    if (await act({ type: 'protocole', protocole })) { $('protocoleForm').dataset.dirty = 'false'; renderProtocole(true); $('protocoleSelect').value = id; renderProtocole(true); notification('Protocole enregistré.'); }
  };
  $('supprimerProtocole').onclick = async () => {
    if (!confirm('Supprimer ce protocole ? Une séquence déjà lancée reste active jusqu’à son annulation.')) return;
    if (await act({ type: 'supprimer-protocole', id: $('protocoleSelect').value })) { $('protocoleForm').dataset.dirty = 'false'; $('protocoleForm').dataset.id = ''; $('protocoleSelect').value = 'nouveau'; renderProtocole(true); }
  };
  $('commandForm').onsubmit = event => { event.preventDefault(); const text = $('commandInput').value; $('commandInput').value = ''; act({ type: 'command', text }); };
  $('commandInput').oninput = () => { $('commandInput').type = /^(LOGIN|CODE|ORDERS)\s/i.test($('commandInput').value) ? 'password' : 'text'; };
  document.querySelectorAll('[data-command]').forEach(button => button.onclick = () => act({ type: 'command', text: button.dataset.command }));
  $('loginButton').onclick = () => { $('loginPassword').value = ''; $('loginDialog').showModal(); $('loginPassword').focus(); };
  $('cancelLogin').onclick = () => $('loginDialog').close();
  $('loginForm').onsubmit = event => { event.preventDefault(); const value = $('loginPassword').value; $('loginPassword').value = ''; $('loginDialog').close(); act({ type: 'command', text: 'LOGIN ' + value }); };
  for (const id of ['configForm', 'passwordForm', 'documentForm']) $(id).addEventListener('input', () => $(id).dataset.dirty = 'true');
  $('replyForm').onsubmit = async event => { event.preventDefault(); if (await act({ type: 'reply', text: $('replyText').value, requestId: demandeSelectionnee()?.id ?? null })) $('replyText').value = ''; };
  $('demandeSelect').onchange = () => { $('replyText').value = ''; renderDemandes(); };
  $('configForm').onsubmit = async event => { event.preventDefault(); const c = { vessel: $('vesselInput').value, status: $('statusInput').value }; if (await act({ type: 'config', config: c })) { $('configForm').dataset.dirty = 'false'; render(); notification('État du vaisseau enregistré.'); } };
  $('passwordForm').onsubmit = async event => { event.preventDefault(); if (await act({ type: 'config', config: { adminPassword: $('adminPassword').value } })) { $('passwordForm').dataset.dirty = 'false'; reglerVisibiliteCode('adminPassword'); render(); notification('Mot de passe enregistré.'); } };
  $('documentSelect').onchange = () => { $('documentForm').dataset.dirty = 'false'; renderDocument(true); };
  $('documentAccess').onchange = () => { $('documentCode').disabled = $('documentAccess').value !== 'code'; $('documentCode').required = !$('documentSelect').value && $('documentAccess').value === 'code'; $('afficherCodeDossier').disabled = $('documentCode').disabled; };
  $('documentForm').onsubmit = async event => {
    event.preventDefault(); const nouveau = !$('documentSelect').value, id = nouveau ? $('documentId').value.trim() : $('documentSelect').value;
    const d = { title: $('documentTitle').value, access: $('documentAccess').value, code: $('documentCode').disabled ? '' : $('documentCode').value, body: $('documentBody').value };
    const action = nouveau ? { type: 'creer-document', document: { id, ...d } } : { type: 'document', id, document: d };
    if (await act(action)) { $('documentForm').dataset.dirty = 'false'; $('documentSelect').value = id; renderDocument(true); notification(nouveau ? 'Dossier créé.' : 'Dossier enregistré.'); }
  };
  $('crtToggle').onchange = () => act({ type: 'config', config: { crt: $('crtToggle').checked } }); $('glitchToggle').onchange = () => act({ type: 'config', config: { glitches: $('glitchToggle').checked } });
  $('hackSuccess').onclick = () => act({ type: 'hack', success: true, requestId: demandeSelectionnee()?.id }); $('hackFail').onclick = () => act({ type: 'hack', success: false, requestId: demandeSelectionnee()?.id });
  $('confirmerDossier').onchange = () => { $('supprimerDossier').disabled = !$('confirmerDossier').checked || !$('documentSelect').value; };
  $('supprimerDossier').onclick = async () => {
    if (!$('confirmerDossier').checked) return;
    if (await act({ type: 'supprimer-document', id: $('documentSelect').value })) { $('documentForm').dataset.dirty = 'false'; renderDocument(true); }
  };
  for (const [bouton, delta] of [['monterDossier', -1], ['descendreDossier', 1]]) $(bouton).onclick = () => {
    const ids = state.documents.map(d => d.id), index = ids.indexOf($('documentSelect').value);
    if (index + delta < 0 || index + delta >= ids.length) return;
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    void act({ type: 'classer-documents', ids });
  };
  $('prereglageSelect').onchange = () => renderPrereglages(true);
  $('confirmerPrereglage').onchange = () => renderPrereglages();
  $('prereglageForm').onsubmit = async e => {
    e.preventDefault(); const id = $('prereglageSelect').value || 'prereglage-' + crypto.randomUUID();
    if (await act({ type: 'enregistrer-prereglage', id, nom: $('prereglageNom').value })) { $('prereglageSelect').value = id; renderPrereglages(true); }
  };
  $('chargerPrereglage').onclick = () => act({ type: 'rappeler-prereglage', id: $('prereglageSelect').value });
  $('supprimerPrereglage').onclick = async () => {
    if ($('confirmerPrereglage').checked && await act({ type: 'supprimer-prereglage', id: $('prereglageSelect').value })) renderPrereglages(true);
  };
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

  const radar = $('radarCanvas'), dessinerRadar = AlienDetecteur.creerRendu(radar), noise = $('noiseCanvas'), nctx = noise.getContext('2d'), noiseData = nctx.createImageData(160, 120);
  function drawRadar(time) {
    if (instrument !== 'tracker' || !state) return;
    const t = trackerState(), count = dessinerRadar(t, { parasites: state.config.glitches, mouvementReduit: reduceMotion }, time);
    if (!t.power) return;
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
    $('terminalScreen').classList.toggle('hack-actif', activeHack);
    $('terminalScreen').classList.toggle('hack-refuse', activeHack && $('hackOverlay').classList.contains('failure'));
    if (activeHack) { const elapsed = Date.now() - Number($('hackOverlay').dataset.start), progress = Math.min(100, elapsed / 70); $('hackProgress').style.width = progress + '%'; const lines = ['> INITIALISATION DU CANAL', '> ANALYSE DES AUTORISATIONS', '> RECHERCHE DE MOT DE PASSE…', '> VÉRIFICATION DES CONTRE-MESURES', '> NÉGOCIATION DES PRIVILÈGES']; $('hackText').textContent = lines.slice(0, Math.min(5, 1 + Math.floor(progress / 20))).join('\n') + '\n\n' + (progress > 80 ? ($('hackOverlay').classList.contains('failure') ? 'ACCÈS REFUSÉ.' : 'ACCÈS ACCORDÉ.') : 'TRAITEMENT ' + Math.floor(progress) + '%'); }
    const glitch = state.config.glitches && !reduceMotion;
    $('terminalScreen').classList.toggle('hack-parasites', activeHack && glitch);
    $('noiseCanvas').style.display = glitch ? 'block' : 'none';
    if (instrument === 'muthur' && glitch && time - lastNoise > 100) {
      lastNoise = time; for (let i = 0; i < noiseData.data.length; i += 4) { const v = Math.random() * 255; noiseData.data[i] = v; noiseData.data[i + 1] = v; noiseData.data[i + 2] = v; noiseData.data[i + 3] = 255; } nctx.putImageData(noiseData, 0, 0);
      const phase = Math.floor(time / 140) % 61;
      const burst = activeHack ? Math.sin(time / 130) * 5 : phase === 55 ? 3 : phase === 56 ? -3 : phase === 57 ? 1 : 0;
      $('terminalScreen').style.setProperty('--glitch-shift', burst + 'px');
      $('noiseCanvas').style.opacity = activeHack ? '.12' : phase >= 55 && phase <= 57 ? '.18' : '.09';
    } else if (!glitch) $('terminalScreen').style.setProperty('--glitch-shift', '0px');
    drawRadar(time); const c = state.countdown; $('countdown').classList.toggle('hidden', !c || !!state.autodestruction);
    if (c) { const seconds = Math.max(0, Math.ceil((c.endAt - Date.now()) / 1000)); const valeur = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); $('countdownTime').textContent = valeur; $('autoDestructionTime').textContent = valeur; }
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
        connection(false, 'RECONNEXION…');
      } catch { connection(false, 'RECONNEXION…'); }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  async function connect() {
    const result = await api('/api/session'); role = result.role;
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
      if (saved) { saved.tracker.power = false; saved.countdown = null; saved.autodestruction = null; saved.diffusionAlarme = null; Object.values(saved.players || {}).forEach(p => p.cue = null); }
      engine = AlienCore.créer(saved); engine.inscrire('reyes', 'REYES'); engine.inscrire('sato', 'SATO'); state = engine.snapshot('gm', '', 'atelier-local'); currentOperator = 'reyes';
      connection(true, 'ATELIER LOCAL'); $('tableCode').textContent = 'Mode fichier : aperçu meneur et joueur dans ce navigateur.'; $('playerAddress').textContent = 'Le serveur local permet la connexion des tablettes.'; render();
    } else {
      const fragment = new URLSearchParams(location.hash.slice(1)); token = fragment.get('mj') || ''; if (token) history.replaceState(null, '', location.pathname + location.search);
      try { if (!token) token = sessionStorage.getItem(sessionKey) || ''; else sessionStorage.setItem(sessionKey, token); } catch { /* Pas de stockage requis pour la session actuelle. */ }
      if (token) { try { await connect(); } catch { token = ''; $('join').classList.remove('hidden'); connection(false, 'CONNEXION REQUISE'); } }
      else { $('join').classList.remove('hidden'); connection(false, 'CONNEXION REQUISE'); }
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('pagehide', () => { liaisonActive = false; soundEnabled = false; streamAbort?.abort(); film.detruire(); alarme?.detruire(); if (audio) void audio.close().catch(() => {}); }); start().catch(error => notification(error.message, true));
})();
