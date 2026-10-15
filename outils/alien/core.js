/* Logique partagée par la maquette hors ligne et le petit serveur local. */
(() => {
  'use strict';
  const copie = value => JSON.parse(JSON.stringify(value));
  const texte = (value, max = 4000) => String(value ?? '').slice(0, max);
  const borné = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const identifiant = () => globalThis.crypto?.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  /** Positions normalisées au rayon du radar, identiques sur tous les appareils de la table. */
  function positionsDuDetecteur(tracker, fauxEcho = false) {
    let graine = Number(tracker.seed) >>> 0;
    const hasard = () => {
      graine = (graine + 0x6d2b79f5) >>> 0;
      let valeur = Math.imul(graine ^ graine >>> 15, 1 | graine);
      valeur ^= valeur + Math.imul(valeur ^ valeur >>> 7, 61 | valeur);
      return ((valeur ^ valeur >>> 14) >>> 0) / 4294967296;
    };
    const rayonMax = .2 + (1 - borné(tracker.proximity, 0, 100) / 100) * .57;
    const nombre = Math.round(borné(tracker.contacts, 0, 9)) + (fauxEcho ? 1 : 0), positions = [];
    for (let i = 0; i < nombre; i++) {
      let meilleur, ecartMax = -1;
      // Éviter autant que possible les contacts superposés, sans dépasser la zone choisie.
      for (let essai = 0; essai < 40; essai++) {
        const angle = hasard() * Math.PI * 2;
        const rayon = Math.sqrt(.08 ** 2 + hasard() * (rayonMax ** 2 - .08 ** 2));
        const point = { x: Math.cos(angle) * rayon, y: Math.sin(angle) * rayon };
        const ecart = Math.min(...positions.map(autre => (point.x - autre.x) ** 2 + (point.y - autre.y) ** 2));
        if (ecart > ecartMax) { meilleur = point; ecartMax = ecart; }
        if (ecart >= .07 ** 2) break;
      }
      positions.push(meilleur);
    }
    return positions;
  }
  function initial() {
    return {
      version: 2, system: 'alien', revision: 0,
      config: { vessel: 'USCSS ORPHEUS', status: 'Navigation nominale. Liaison avec la balise interrompue. Vérification en cours.', adminPassword: 'PROMETHEUS', crt: true, glitches: true },
      documents: [
        { id: 'navigation', title: 'Rapport de navigation', access: 'crew', code: '', body: 'CAP MAINTENU.\nDernière transmission de la balise : 03:17.\nAucun accusé de réception depuis cette heure.\nInvestigation recommandée.' },
        { id: 'ordre', title: 'Directive confidentielle', access: 'code', code: '0042', body: 'DIRECTIVE OMEGA\nIsoler le compartiment de stockage.\nConserver les enregistrements de la dernière transmission.\nAttendre les instructions du commandement.' },
        { id: 'archive', title: 'Archive administrateur', access: 'admin', code: '', body: 'JOURNAL INTERNE\nUne demande d’ouverture du sas a été enregistrée pendant le cycle de sommeil.\nL’identité de l’opérateur n’a pas été confirmée.' },
      ],
      players: {}, tracker: { power: false, intensity: 25, volume: 25, contacts: 3, proximity: 45, noise: 10, target: 'all', seed: 1, anomalyUntil: 0 },
      countdown: null, portes: 'inconnues', autodestruction: null, diffusionAlarme: null,
      protocoles: [
        { id: 'ouvrir-portes', nom: 'Ouverture des portes', code: 'PORTES-OUVRIR', message: 'DÉVERROUILLAGE CONFIRMÉ.\nPortes ouvertes.', effet: 'ouvrir-portes', minutes: 10, actif: true, portee: 'equipage' },
        { id: 'fermer-portes', nom: 'Fermeture des portes', code: 'PORTES-FERMER', message: 'VERROUILLAGE CONFIRMÉ.\nPortes fermées.', effet: 'fermer-portes', minutes: 10, actif: true, portee: 'equipage' },
        { id: 'autodestruction', nom: 'Autodestruction', code: 'OMEGA-10', message: 'PROTOCOLE D’AUTODESTRUCTION ENGAGÉ.\nÉvacuation immédiate. Rejoignez les navettes de secours.', effet: 'autodestruction', minutes: 10, actif: true, portee: 'equipage' },
        { id: 'annuler-autodestruction', nom: 'Annulation de l’autodestruction', code: 'OMEGA-STOP', message: 'AUTODESTRUCTION ANNULÉE.\nRetour aux procédures normales.', effet: 'annuler-autodestruction', minutes: 10, actif: true, portee: 'equipage' },
      ],
    };
  }
  function créer(saved) {
    let state = [1, 2].includes(saved?.version) && saved?.system === 'alien' ? copie(saved) : initial();
    // 15/10 : une ancienne table ne reçoit aucun nouveau code actif à son insu.
    if (state.version === 1) Object.assign(state, { version: 2, protocoles: [], portes: 'inconnues', autodestruction: null, diffusionAlarme: null });
    function joueur(id, name) {
      if (!state.players[id]) state.players[id] = { id, name: texte(name || 'Voyageur', 40), access: 'crew', unlocked: [], messages: [], request: null, cue: null };
      return state.players[id];
    }
    function ajouter(p, kind, content) {
      p.messages.push({ id: identifiant(), kind, content: texte(content, 10000), at: Date.now() });
      p.messages = p.messages.slice(-200);
    }
    function visible(p, doc) { return doc.access === 'crew' || p.access === 'admin' || p.unlocked.includes(doc.id); }
    function toucher() { state.revision++; }
    function inscrire(id, name) { joueur(id, name); toucher(); return snapshot('player', id); }
    function snapshot(role, id, appareilId) {
      const diffusionAutorisee = typeof appareilId === 'string' && appareilId === state.diffusionAlarme;
      if (role === 'gm') return copie({ ...state, diffusionAutorisee });
      const p = state.players[id]; if (!p) throw new Error('Participant inconnu.');
      const tracker = state.tracker.target === 'all' || state.tracker.target === id ? state.tracker : {
        power: false, intensity: 0, volume: 0, contacts: 0, proximity: 0, noise: 0, target: id, seed: 0, anomalyUntil: 0,
      };
      return copie({ version: 2, system: 'alien', revision: state.revision,
        config: { vessel: state.config.vessel, crt: state.config.crt, glitches: state.config.glitches },
        player: p, tracker,
        documents: state.documents.filter(doc => visible(p, doc)).map(({ code, ...doc }) => doc), countdown: state.countdown,
        portes: state.portes, autodestruction: state.autodestruction, diffusionAutorisee,
      });
    }
    function diffuser(p, protocole) {
      const destinataires = protocole.portee === 'equipage' ? Object.values(state.players) : [p];
      destinataires.forEach(j => ajouter(j, 'mother', protocole.message));
    }
    function executerProtocole(p, protocole) {
      if (protocole.effet === 'autodestruction') {
        if (state.autodestruction) { ajouter(p, 'system', 'SÉQUENCE DÉJÀ ENGAGÉE. L’échéance reste inchangée.'); return; }
        const maintenant = Date.now();
        // David, 15/10 : lire le film entier et prolonger l'alerte à sa durée.
        state.countdown = { endAt: maintenant + Math.max(protocole.minutes * 60000, globalThis.AlienVideoAlerte.dureeSecondes * 1000) };
        state.autodestruction = { id: identifiant(), startedAt: maintenant, message: protocole.message };
      } else if (protocole.effet === 'annuler-autodestruction') {
        state.autodestruction = null; state.countdown = null;
      } else if (protocole.effet === 'ouvrir-portes') state.portes = 'ouvertes';
      else if (protocole.effet === 'fermer-portes') state.portes = 'fermees';
      diffuser(p, protocole);
    }
    function commander(p, raw) {
      const input = texte(raw, 2000).trim(); if (!input) return;
      const match = input.match(/^(\S+)(?:\s+([\s\S]*))?$/), command = match[1].toUpperCase(), arg = (match[2] || '').trim();
      if (command === 'CLEAR') { p.messages = []; return; }
      ajouter(p, 'input', ['LOGIN', 'CODE', 'ORDERS'].includes(command) ? command + ' ••••••••' : input);
      if (command === 'HELP') ajouter(p, 'system', 'HELP · STATUS · LIST · READ identifiant\nLOGIN mot_de_passe · CODE code · HACK\n/M message à Maman · CLEAR');
      else if (command === 'STATUS') ajouter(p, 'system', state.config.status);
      else if (command === 'LIST') ajouter(p, 'system', state.documents.map(doc => doc.id.toUpperCase() + ' — ' + (visible(p, doc) ? doc.title : 'ACCÈS RESTREINT')).join('\n'));
      else if (command === 'LOGIN') {
        if (arg && arg === state.config.adminPassword) { p.access = 'admin'; ajouter(p, 'success', 'IDENTIFICATION CONFIRMÉE.\nPrivilèges administrateur accordés.'); }
        else ajouter(p, 'error', 'IDENTIFICATION REFUSÉE.\nMot de passe invalide.');
      } else if (command === 'CODE' || command === 'ORDERS') {
        const protocole = state.protocoles.find(pr => pr.actif && pr.code === arg);
        if (protocole) { executerProtocole(p, protocole); return; }
        const docs = state.documents.filter(doc => doc.access === 'code' && doc.code && doc.code === arg);
        if (docs.length) { docs.forEach(doc => { if (!p.unlocked.includes(doc.id)) p.unlocked.push(doc.id); }); ajouter(p, 'success', 'CODE VALIDÉ.\nDossier accessible : ' + docs.map(doc => doc.id.toUpperCase()).join(', ')); }
        else ajouter(p, 'error', 'CODE NON RECONNU.\nAutorisation refusée.');
      } else if (command === 'READ') {
        const doc = state.documents.find(d => d.id.toLowerCase() === arg.toLowerCase());
        if (doc && visible(p, doc)) ajouter(p, 'system', doc.title.toUpperCase() + '\n────────────────────\n' + doc.body);
        else ajouter(p, 'error', 'DOSSIER INACCESSIBLE.\nIdentification ou code requis.');
      } else if (command === 'HACK') {
        if (p.request) ajouter(p, 'system', 'REQUÊTE DÉJÀ EN ATTENTE.');
        else { p.request = { id: identifiant(), type: 'hack', at: Date.now() }; ajouter(p, 'system', 'TENTATIVE D’INTRUSION…\nEn attente du résultat.'); }
      } else if (command === '/M' || command === 'MESSAGE') {
        if (arg) { p.request = p.request?.type === 'hack' ? p.request : { id: identifiant(), type: 'message', at: Date.now() }; ajouter(p, 'system', 'TRANSMISSION À MU/TH/UR CONFIRMÉE.'); }
      } else ajouter(p, 'error', 'COMMANDE NON RECONNUE.\nSaisir HELP pour consulter les commandes.');
    }
    function agir(role, id, action, contexte = {}) {
      if (!action || typeof action.type !== 'string') throw new Error('Action invalide.');
      if (action.type === 'diffusion' && ['gm', 'player'].includes(role)) {
        if (role === 'player' && !state.players[id]) throw new Error('Participant inconnu.');
        if (typeof action.actif !== 'boolean' || typeof contexte.appareilId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(contexte.appareilId)) throw new Error('Appareil de diffusion requis.');
        if (action.actif) state.diffusionAlarme = contexte.appareilId;
        else if (state.diffusionAlarme === contexte.appareilId) state.diffusionAlarme = null;
        toucher(); return;
      }
      if (role === 'player') {
        const p = state.players[id]; if (!p) throw new Error('Participant inconnu.');
        if (action.type !== 'command') throw new Error('Action réservée au meneur.');
        commander(p, action.text); toucher(); return;
      }
      if (role !== 'gm') throw new Error('Accès refusé.');
      if (action.type === 'config') {
        const c = action.config || {};
        if (c.vessel !== undefined) state.config.vessel = texte(c.vessel, 64);
        if (c.status !== undefined) state.config.status = texte(c.status, 2000);
        if (c.adminPassword !== undefined) { if (!String(c.adminPassword).trim()) throw new Error('Choisissez un mot de passe.'); state.config.adminPassword = texte(c.adminPassword, 120); }
        for (const k of ['crt', 'glitches']) if (c[k] !== undefined) state.config[k] = !!c[k];
      } else if (action.type === 'creer-document') {
        const d = action.document;
        if (!d || typeof d.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(d.id)
          || Object.hasOwn(Object.prototype, d.id) || d.id === 'prototype'
          || typeof d.title !== 'string' || !d.title.trim() || d.title.length > 80
          || typeof d.body !== 'string' || d.body.length > 10000
          || !['crew', 'code', 'admin'].includes(d.access)
          || typeof d.code !== 'string' || d.code.length > 120) throw new Error('Dossier invalide.');
        if (state.documents.length >= 256) throw new Error('Limite de 256 dossiers atteinte.');
        // READ ignore la casse : deux identifiants équivalents rendraient un dossier inaccessible.
        if (state.documents.some(doc => doc.id.toLowerCase() === d.id)) throw new Error('Cet identifiant de dossier existe déjà.');
        const code = d.access === 'code' ? d.code.trim() : '';
        if (d.access === 'code' && !code) throw new Error('Indiquez le code du dossier.');
        if (code && state.protocoles.some(pr => pr.code === code)) throw new Error('Ce code est déjà réservé à un protocole.');
        state.documents.push({ id: d.id, title: d.title.trim(), access: d.access, code, body: d.body });
      } else if (action.type === 'document') {
        const doc = state.documents.find(d => d.id === action.id); if (!doc) throw new Error('Dossier inconnu.');
        const d = action.document || {};
        if (d.code !== undefined && state.protocoles.some(pr => pr.code === String(d.code).trim())) throw new Error('Ce code est déjà réservé à un protocole.');
        if (d.title !== undefined) doc.title = texte(d.title, 80);
        if (d.body !== undefined) doc.body = texte(d.body, 10000);
        if (d.access !== undefined) { if (!['crew', 'code', 'admin'].includes(d.access)) throw new Error('Accès invalide.'); doc.access = d.access; }
        if (d.code !== undefined && texte(d.code, 120) !== doc.code) {
          doc.code = texte(d.code, 120);
          Object.values(state.players).forEach(p => p.unlocked = p.unlocked.filter(key => key !== doc.id));
        }
      } else if (action.type === 'protocole') {
        const pr = action.protocole;
        if (!pr || Object.keys(pr).some(cle => !['id', 'nom', 'code', 'message', 'effet', 'minutes', 'actif', 'portee'].includes(cle))
          || typeof pr.id !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(pr.id)
          || typeof pr.nom !== 'string' || !pr.nom.trim() || pr.nom.length > 80
          || typeof pr.code !== 'string' || !pr.code.trim() || pr.code.length > 120
          || typeof pr.message !== 'string' || !pr.message.trim() || pr.message.length > 4000
          || !['message', 'ouvrir-portes', 'fermer-portes', 'autodestruction', 'annuler-autodestruction'].includes(pr.effet)
          || !Number.isFinite(pr.minutes) || pr.minutes < 0.1 || pr.minutes > 60
          || typeof pr.actif !== 'boolean' || !['operateur', 'equipage'].includes(pr.portee)) throw new Error('Protocole invalide.');
        const candidat = { ...pr, code: pr.code.trim() };
        if (state.protocoles.some(autre => autre.id !== pr.id && autre.code === candidat.code)
          || state.documents.some(doc => doc.access === 'code' && doc.code === candidat.code)) throw new Error('Ce code est déjà utilisé.');
        const index = state.protocoles.findIndex(autre => autre.id === pr.id);
        if (index >= 0) state.protocoles[index] = copie(candidat);
        else { if (state.protocoles.length >= 64) throw new Error('Limite de 64 protocoles atteinte.'); state.protocoles.push(copie(candidat)); }
      } else if (action.type === 'supprimer-protocole') {
        if (!state.protocoles.some(pr => pr.id === action.id)) throw new Error('Protocole inconnu.');
        state.protocoles = state.protocoles.filter(pr => pr.id !== action.id);
      } else if (action.type === 'command') {
        const p = state.players[action.playerId]; if (!p) throw new Error('Participant inconnu.');
        commander(p, action.text);
      } else if (action.type === 'reply') {
        const p = state.players[action.playerId]; if (!p) throw new Error('Participant inconnu.');
        if (!String(action.text || '').trim()) throw new Error('La réponse est vide.');
        ajouter(p, 'mother', action.text); if (p.request?.type === 'message') p.request = null;
      } else if (action.type === 'hack') {
        const p = state.players[action.playerId]; if (!p || p.request?.type !== 'hack') throw new Error('Aucune tentative en attente.');
        p.request = null; p.cue = { id: identifiant(), type: 'hack', success: !!action.success, at: Date.now(), duration: 7000 };
        if (action.success) p.access = 'admin';
        ajouter(p, action.success ? 'success' : 'error', action.success ? 'INTRUSION RÉUSSIE.\nPrivilèges administrateur obtenus.' : 'CONTRE-MESURES ACTIVES.\nIntrusion repoussée.');
      } else if (action.type === 'revoke') {
        const p = state.players[action.playerId]; if (!p) throw new Error('Participant inconnu.');
        p.access = 'crew'; p.unlocked = []; p.request = null; p.cue = null; ajouter(p, 'system', 'SESSION RÉINITIALISÉE.\nAccès équipage restauré.');
      } else if (action.type === 'tracker') {
        const t = action.tracker || {};
        if (t.target !== undefined && t.target !== 'all' && !state.players[t.target]) throw new Error('Destinataire inconnu.');
        for (const k of ['intensity', 'volume', 'proximity', 'noise']) if (t[k] !== undefined) state.tracker[k] = borné(t[k], 0, 100);
        if (t.contacts !== undefined) state.tracker.contacts = Math.round(borné(t.contacts, 0, 9));
        if (t.power !== undefined) {
          const allume = !!t.power;
          if (allume && !state.tracker.power) {
            let graine = Math.floor(Math.random() * 4294967296);
            if (graine === state.tracker.seed) graine = (graine + 1) >>> 0;
            state.tracker.seed = graine;
          }
          state.tracker.power = allume;
        }
        if (t.target !== undefined) state.tracker.target = t.target;
      } else if (action.type === 'anomaly') {
        state.tracker.anomalyUntil = Date.now() + 9000;
      } else if (action.type === 'countdown') {
        if (state.autodestruction && action.minutes) throw new Error('Annulez d’abord l’autodestruction.');
        state.countdown = action.minutes ? { endAt: Date.now() + borné(action.minutes, 0.1, 60) * 60000 } : null;
        if (!state.countdown) state.autodestruction = null;
      } else if (action.type === 'reset') {
        const players = Object.values(state.players).map(p => ({ id: p.id, name: p.name })); state = initial();
        players.forEach(p => joueur(p.id, p.name));
      } else throw new Error('Action inconnue.');
      toucher();
    }
    return Object.freeze({ inscrire, snapshot, agir, sauvegarde: () => copie(state) });
  }
  globalThis.AlienCore = Object.freeze({ créer, initial, positionsDuDetecteur });
})();
