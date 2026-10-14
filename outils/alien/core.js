/* Logique partagée par la maquette hors ligne et le petit serveur local. */
(() => {
  'use strict';
  const copie = value => JSON.parse(JSON.stringify(value));
  const texte = (value, max = 4000) => String(value ?? '').slice(0, max);
  const borné = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const identifiant = () => globalThis.crypto?.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  function initial() {
    return {
      version: 1, system: 'alien', revision: 0,
      config: { vessel: 'USCSS ORPHEUS', status: 'Navigation nominale. Liaison avec la balise interrompue. Vérification en cours.', adminPassword: 'PROMETHEUS', crt: true, glitches: true },
      documents: [
        { id: 'navigation', title: 'Rapport de navigation', access: 'crew', code: '', body: 'CAP MAINTENU.\nDernière transmission de la balise : 03:17.\nAucun accusé de réception depuis cette heure.\nInvestigation recommandée.' },
        { id: 'ordre', title: 'Directive confidentielle', access: 'code', code: '0042', body: 'DIRECTIVE OMEGA\nIsoler le compartiment de stockage.\nConserver les enregistrements de la dernière transmission.\nAttendre les instructions du commandement.' },
        { id: 'archive', title: 'Archive administrateur', access: 'admin', code: '', body: 'JOURNAL INTERNE\nUne demande d’ouverture du sas a été enregistrée pendant le cycle de sommeil.\nL’identité de l’opérateur n’a pas été confirmée.' },
      ],
      players: {}, tracker: { power: false, intensity: 25, volume: 25, contacts: 3, proximity: 45, noise: 10, target: 'all', seed: 1, anomalyUntil: 0 },
      countdown: null,
    };
  }
  function créer(saved) {
    let state = saved?.version === 1 && saved?.system === 'alien' ? copie(saved) : initial();
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
    function snapshot(role, id) {
      if (role === 'gm') return copie(state);
      const p = state.players[id]; if (!p) throw new Error('Participant inconnu.');
      const tracker = state.tracker.target === 'all' || state.tracker.target === id ? state.tracker : {
        power: false, intensity: 0, volume: 0, contacts: 0, proximity: 0, noise: 0, target: id, seed: 0, anomalyUntil: 0,
      };
      return copie({ version: 1, system: 'alien', revision: state.revision,
        config: { vessel: state.config.vessel, crt: state.config.crt, glitches: state.config.glitches },
        player: p, tracker,
        documents: state.documents.filter(doc => visible(p, doc)).map(({ code, ...doc }) => doc), countdown: state.countdown,
      });
    }
    function commander(p, raw) {
      const input = texte(raw, 2000).trim(); if (!input) return;
      const match = input.match(/^(\S+)(?:\s+([\s\S]*))?$/), command = match[1].toUpperCase(), arg = (match[2] || '').trim();
      if (command === 'CLEAR') { p.messages = []; return; }
      ajouter(p, 'input', command === 'LOGIN' || command === 'CODE' ? command + ' ••••••••' : input);
      if (command === 'HELP') ajouter(p, 'system', 'HELP · STATUS · LIST · READ identifiant\nLOGIN mot_de_passe · CODE code · HACK\n/M message à Maman · CLEAR');
      else if (command === 'STATUS') ajouter(p, 'system', state.config.status);
      else if (command === 'LIST') ajouter(p, 'system', state.documents.map(doc => doc.id.toUpperCase() + ' — ' + (visible(p, doc) ? doc.title : 'ACCÈS RESTREINT')).join('\n'));
      else if (command === 'LOGIN') {
        if (arg && arg === state.config.adminPassword) { p.access = 'admin'; ajouter(p, 'success', 'IDENTIFICATION CONFIRMÉE.\nPrivilèges administrateur accordés.'); }
        else ajouter(p, 'error', 'IDENTIFICATION REFUSÉE.\nMot de passe invalide.');
      } else if (command === 'CODE' || command === 'ORDERS') {
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
    function agir(role, id, action) {
      if (!action || typeof action.type !== 'string') throw new Error('Action invalide.');
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
      } else if (action.type === 'document') {
        const doc = state.documents.find(d => d.id === action.id); if (!doc) throw new Error('Dossier inconnu.');
        const d = action.document || {};
        if (d.title !== undefined) doc.title = texte(d.title, 80);
        if (d.body !== undefined) doc.body = texte(d.body, 10000);
        if (d.access !== undefined) { if (!['crew', 'code', 'admin'].includes(d.access)) throw new Error('Accès invalide.'); doc.access = d.access; }
        if (d.code !== undefined && texte(d.code, 120) !== doc.code) {
          doc.code = texte(d.code, 120);
          Object.values(state.players).forEach(p => p.unlocked = p.unlocked.filter(key => key !== doc.id));
        }
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
        for (const k of ['intensity', 'volume', 'proximity', 'noise']) if (t[k] !== undefined) state.tracker[k] = borné(t[k], 0, 100);
        if (t.contacts !== undefined) state.tracker.contacts = Math.round(borné(t.contacts, 0, 9));
        if (t.power !== undefined) state.tracker.power = !!t.power;
        if (t.target !== undefined) { if (t.target !== 'all' && !state.players[t.target]) throw new Error('Destinataire inconnu.'); state.tracker.target = t.target; }
      } else if (action.type === 'anomaly') {
        state.tracker.anomalyUntil = Date.now() + 9000; state.tracker.seed++;
      } else if (action.type === 'countdown') {
        state.countdown = action.minutes ? { endAt: Date.now() + borné(action.minutes, 0.1, 60) * 60000 } : null;
      } else if (action.type === 'reset') {
        const players = Object.values(state.players).map(p => ({ id: p.id, name: p.name })); state = initial();
        players.forEach(p => joueur(p.id, p.name));
      } else throw new Error('Action inconnue.');
      toucher();
    }
    return Object.freeze({ inscrire, snapshot, agir, sauvegarde: () => copie(state) });
  }
  globalThis.AlienCore = Object.freeze({ créer, initial });
})();
