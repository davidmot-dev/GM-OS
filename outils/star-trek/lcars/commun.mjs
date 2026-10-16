import { createElement as h, createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { POSTES, ETATS } from './postes.mjs';
import { validerMedia } from './moteur.mjs';
import { creerVoix } from './voix.mjs';
export const bouton = (texte, props = {}) => h('button', { type: 'button', ...props }, texte);
export const champ = (libelle, props = {}) => h('label', null, h('span', null, libelle), h(props.rows ? 'textarea' : 'input', { 'aria-label': libelle, ...props }));
export const choix = (libelle, valeur, changer, options, props = {}) => h('label', null, h('span', null, libelle), h('select', { 'aria-label': libelle, value: valeur, onChange: e => changer(e.target.value), ...props }, options.map(([v, nom]) => h('option', { key: v, value: v }, nom))));
export const caseACocher = (libelle, checked, changer, disabled = false) => h('label', { className: 'lcars-case' }, h('input', { type: 'checkbox', checked, onChange: e => changer(e.target.checked), disabled }), libelle);
export const carte = (titre, enfants, classe = '') => h('section', { className: `lcars-carte ${classe}`, 'aria-label': titre }, h('h3', null, titre), enfants);
export const nomAlerte = niveau => ({ normal: 'Situation normale', jaune: 'Alerte jaune', rouge: 'Alerte rouge' })[niveau];
export function useCommandes(envoyerCommande) {
  const [occupe, setOccupe] = useState(false), [erreur, setErreur] = useState('');
  const vivant = useRef(false), verrou = useRef(false);
  useEffect(() => { vivant.current = true; return () => { vivant.current = false; }; }, []);
  async function envoyer(id, charge) {
    if (verrou.current) return false;
    verrou.current = true; setOccupe(true); setErreur('');
    try { const r = await envoyerCommande({ id, charge }); if (r?.ok === true) return true; if (vivant.current) setErreur(r?.erreur || 'Commande refusée.'); }
    catch { if (vivant.current) setErreur('Transmission impossible.'); }
    finally { verrou.current = false; if (vivant.current) setOccupe(false); }
    return false;
  }
  return { envoyer, occupe, erreur };
}
export function Destinataires({ valeur, changer }) {
  return h('fieldset', { className: 'lcars-destinations' }, h('legend', null, 'Destinataires'),
    caseACocher('Tout l’équipage', valeur.includes('equipage'), coche => changer(coche ? ['equipage'] : [])),
    Object.entries(POSTES).map(([id, p]) => h('div', { key: id }, caseACocher(p.nom, valeur.includes(id), coche => changer(coche ? [...valeur.filter(v => v !== 'equipage'), id] : valeur.filter(v => v !== id))))));
}
export function PieceJointe({ valeur, changer, disabled, charger = () => {} }) {
  const [erreur, signaler] = useState(''), sequence = useRef(0), fichier = useRef(null);
  useEffect(() => () => { sequence.current++; }, []);
  return h('div', { className: 'lcars-piece' }, h('label', null, h('span', null, 'Pièce jointe (facultative, 4 Mo maximum)'),
    h('input', { ref: fichier, type: 'file', 'aria-label': 'Pièce jointe', disabled, accept: 'image/png,image/jpeg,image/webp,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm', onChange: async e => {
      const numero = ++sequence.current, selection = e.target.files?.[0]; signaler('');
      if (!selection) { charger(false); return; }
      charger(true);
      try {
        if (selection.size > 4 * 1024 * 1024) throw new Error('Fichier trop volumineux (4 Mo maximum).');
        const source = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error('Lecture impossible.')); r.readAsDataURL(selection); });
        const media = { type: selection.type.split('/')[0], nom: selection.name, source }; validerMedia(media);
        if (numero === sequence.current) changer(media);
      } catch (err) { if (numero === sequence.current) { signaler(err.message); changer(null); if (fichier.current) fichier.current.value = ''; } }
      finally { if (numero === sequence.current) charger(false); }
    } })), valeur && h('div', null, h('p', null, valeur.nom), bouton('Retirer la pièce jointe', { disabled, onClick: () => { sequence.current++; changer(null); charger(false); if (fichier.current) fichier.current.value = ''; } })), erreur && h('p', { role: 'alert' }, erreur));
}
const SonLocal = createContext(false);
const RessourcesPrivees = createContext(null);
export function Media({ media }) {
  const autorise = useContext(SonLocal), ressources = useContext(RessourcesPrivees), element = useRef(null), [echec, signaler] = useState(false), [resolution, resoudre] = useState(null);
  const prive = media?.source?.startsWith('/modules-prives/');
  useEffect(() => {
    signaler(false); resoudre(null);
    if (!prive || !ressources || !media) return;
    const annuler = new AbortController(); let url = null, vivant = true;
    const base = ressources.base || `http://${location.hostname}:${ressources.port}`;
    void fetch(new URL(media.source, base), { headers: { 'x-gmos-module-session': ressources.jeton }, cache: 'no-store', credentials: 'omit', signal: annuler.signal })
      .then(async reponse => { if (!reponse.ok) throw new Error(); return reponse.blob(); })
      .then(blob => { if (vivant) { url = URL.createObjectURL(blob); resoudre({ source: media.source, jeton: ressources.jeton, url }); } })
      .catch(() => { if (vivant) signaler(true); });
    return () => { vivant = false; annuler.abort(); if (url) URL.revokeObjectURL(url); };
  }, [media?.source, ressources?.jeton, ressources?.base, ressources?.port, prive]);
  const source = prive ? resolution?.source === media.source && resolution?.jeton === ressources?.jeton ? resolution.url : undefined : media?.source;
  useEffect(() => { const el = element.current; return () => { el?.pause(); }; }, [source]);
  useEffect(() => { if (!autorise && element.current) { element.current.muted = true; element.current.pause(); } }, [autorise, media?.type]);
  if (!media) return null;
  return h('figure', { className: 'lcars-media' }, !source && !echec ? h('p', { role: 'status' }, 'Chargement du média privé…') : source && (media.type === 'image' ? h('img', { src: source, alt: media.nom, onError: () => signaler(true) })
    : h(media.type, { ref: element, src: source, controls: media.type === 'video' || autorise, muted: !autorise, playsInline: true, preload: 'metadata',
      'aria-label': media.nom, onError: () => signaler(true), onVolumeChange: e => { if (!autorise) e.currentTarget.muted = true; } })),
    h('figcaption', null, media.nom, media.type !== 'image' && !autorise ? ' · Son réservé au diffuseur après activation locale.' : ''),
    echec && h('p', { role: 'status' }, 'Lecture du média indisponible sur ce navigateur. Le texte du rapport reste accessible.'));
}
function Son({ vue, envoyer, horloge, active, changer }) {
  const audio = useRef(null), oscillateurs = useRef(new Set()), heure = useRef(horloge), [voix, setVoix] = useState(false), [erreur, signaler] = useState('');
  const parole = useRef(null), localActif = useRef(active), vivant = useRef(true);
  const suivi = useRef({ sequence: vue.alerte.sequence, minute: vue.alerte.fin === null ? null : Math.max(0, Math.ceil((vue.alerte.fin - horloge()) / 60000)) });
  localActif.current = active;
  heure.current = horloge;
  const arreter = () => { for (const o of oscillateurs.current) { try { o.stop(); } catch { /* déjà arrêté */ } } oscillateurs.current.clear(); };
  useEffect(() => {
    vivant.current = true;
    const suspendre = () => { if (!document.hidden) return; arreter(); parole.current?.arreter(); changer(false); void audio.current?.suspend().catch(() => {}); signaler('Son suspendu : réactive-le au retour sur cet écran.'); };
    document.addEventListener('visibilitychange', suspendre);
    return () => { vivant.current = false; document.removeEventListener('visibilitychange', suspendre); arreter(); parole.current?.detruire(); void audio.current?.close().catch(() => {}); };
  }, []);
  useEffect(() => {
    const pulser = () => {
      const restant = vue.alerte.fin === null ? null : Math.max(0, Math.ceil((vue.alerte.fin - heure.current()) / 1000));
      const minute = restant === null ? null : Math.ceil(restant / 60), nouveau = suivi.current.sequence !== vue.alerte.sequence, change = suivi.current.minute !== minute;
      suivi.current = { sequence: vue.alerte.sequence, minute };
      if (!active || !vue.diffusionAutorisee || !vue.effetsActifs || vue.alerte.niveau === 'normal' || restant === 0 || audio.current?.state !== 'running') { arreter(); parole.current?.arreter(); return; }
      if (voix && (nouveau || change && minute !== null)) {
        parole.current ??= creerVoix({ signaler });
        parole.current.parler(nouveau ? nomAlerte(vue.alerte.niveau) : `${minute} minute${minute > 1 ? 's' : ''} restante${minute > 1 ? 's' : ''}`);
      }
      const a = audio.current, o = a.createOscillator(), g = a.createGain();
      o.frequency.setValueAtTime(vue.alerte.niveau === 'rouge' ? 440 : 660, a.currentTime); o.frequency.linearRampToValueAtTime(880, a.currentTime + .35);
      g.gain.setValueAtTime(.018, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .7);
      o.connect(g); g.connect(a.destination); oscillateurs.current.add(o);
      o.onended = () => { oscillateurs.current.delete(o); o.disconnect(); g.disconnect(); }; o.start(); o.stop(a.currentTime + .75);
    };
    pulser(); const t = setInterval(pulser, 1800);
    return () => { clearInterval(t); arreter(); parole.current?.arreter(); };
  }, [active, vue.diffusionAutorisee, vue.effetsActifs, vue.alerte.niveau, vue.alerte.fin, vue.alerte.sequence, voix]);
  async function basculer() {
    try {
      if (active) { arreter(); parole.current?.arreter(); changer(false); await audio.current?.suspend(); return; }
      const Classe = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Classe) throw new Error('Audio indisponible sur cet appareil.');
      audio.current ??= new Classe();
      audio.current.onstatechange = () => { if (vivant.current && localActif.current && audio.current.state !== 'running') { arreter(); parole.current?.arreter(); changer(false); signaler('Son suspendu : touche Activer le son pour reprendre.'); } };
      await audio.current.resume(); if (vivant.current) { changer(true); signaler(''); }
    } catch (e) { signaler(e.message || 'Activation audio impossible.'); }
  }
  return h('div', { className: 'lcars-son' }, bouton(active ? 'Couper le son' : 'Activer le son', { onClick: basculer, 'aria-pressed': active }),
    !vue.integration && bouton(vue.diffusionAutorisee ? 'Ne plus diffuser ici' : 'Diffuser l’alarme ici', { onClick: () => envoyer('choisir-diffusion', { actif: !vue.diffusionAutorisee }), 'aria-pressed': vue.diffusionAutorisee }),
    caseACocher('Annonces vocales', voix, setVoix), h('small', null, vue.diffusionAutorisee ? 'Appareil choisi pour le son. Garde LCARS ouvert pour diffuser.' : 'Affichage visuel ; le MJ choisit l’appareil sonore dans Modules du jeu.'), erreur && h('p', { role: 'status' }, erreur));
}
export function Cadre({ vue, mj = false, erreur, envoyer, horloge = Date.now, children }) {
  const [active, changer] = useState(false), [maintenant, actualiser] = useState(horloge), refHeure = useRef(horloge); refHeure.current = horloge;
  useEffect(() => { const t = setInterval(() => actualiser(refHeure.current()), 500); return () => clearInterval(t); }, []);
  const secondes = vue.alerte.fin === null ? null : Math.max(0, Math.ceil((vue.alerte.fin - maintenant) / 1000));
  return h(RessourcesPrivees.Provider, { value: vue.integration?.ressources || null }, h(SonLocal.Provider, { value: active && vue.diffusionAutorisee }, h('section', { className: `lcars-prototype lcars-alerte-${vue.alerte.niveau}`, 'aria-label': mj ? 'Pupitre LCARS du MJ' : 'Console LCARS' },
    h('header', { className: 'lcars-entete' }, h('div', { className: 'lcars-coude', 'aria-hidden': true }, 'LCARS'),
      h('div', { className: 'lcars-identite' }, h('p', null, `${vue.vaisseau.immatriculation} / SYSTÈMES DE BORD`), h('h2', null, vue.vaisseau.nom)),
      h('div', { className: 'lcars-etat', role: 'status' }, nomAlerte(vue.alerte.niveau))),
    h('div', { className: 'lcars-corps' }, h('aside', { className: 'lcars-rail', 'aria-hidden': true }, ['01', 'LCARS', '02', 'OPS'].map(t => h('span', { key: t }, t))),
      h('div', { className: 'lcars-espace' }, h('div', { className: 'lcars-titre-page' }, h('div', null, h('p', null, mj ? 'CONTRÔLE DE MISSION' : 'PASSERELLE'), h('h3', null, mj ? 'Pupitre du meneur' : vue.officier.nom)), h('span', { className: 'lcars-badge' }, mj ? 'MJ' : 'OFFICIER')),
        h('p', { className: 'lcars-situation' }, vue.situation),
        (vue.alerte.texte || secondes !== null) && carte('Consigne de passerelle', h('div', null, h('p', null, vue.alerte.texte), secondes !== null && h('p', { role: 'timer', 'aria-label': 'Compte à rebours de l’alerte', className: 'lcars-decompte' }, `${String(Math.floor(secondes / 60)).padStart(2, '0')}:${String(secondes % 60).padStart(2, '0')}`))),
        vue.integration?.son !== false && h(Son, { vue, envoyer, horloge, active, changer }), erreur && h('p', { role: 'alert', className: 'lcars-erreur' }, erreur), children)),
    h('footer', { className: 'lcars-pied' }, h('span', null, 'FÉDÉRATION / EXPLORATION'), h('span', null, mj ? 'CONTRÔLE MJ' : 'CONSOLE DE BORD')))));
}
export function Capteurs({ cible, poste, scan, effetsActifs, horloge = Date.now }) {
  const [actif, changer] = useState(false), gradient = useId();
  useEffect(() => { const reste = effetsActifs && scan?.poste === poste ? scan.at + scan.duree - horloge() : 0; changer(reste > 0); if (reste <= 0) return; const t = setTimeout(() => changer(false), reste); return () => clearTimeout(t); }, [scan?.id, scan?.at, scan?.duree, poste, effetsActifs, horloge]);
  return h('div', { className: `lcars-capteurs${actif ? ' lcars-balayage' : ''}` },
    h('p', { className: 'lcars-sur-titre' }, `${POSTES[poste].code} / ${cible ? ETATS[cible.etat] : 'VEILLE'}`),
    h('svg', { viewBox: '0 0 440 260', role: 'img', 'aria-label': `Visualisation ${POSTES[poste].nom}` },
      h('defs', null, h('radialGradient', { id: gradient }, h('stop', { offset: '0%', stopColor: '#cc99ff', stopOpacity: '.16' }), h('stop', { offset: '100%', stopColor: '#cc99ff', stopOpacity: '0' }))),
      h('ellipse', { cx: 220, cy: 132, rx: 200, ry: 115, fill: `url(#${gradient})` }),
      [42, 78, 112].map(r => h('circle', { key: r, cx: 220, cy: 132, r, className: 'lcars-orbite' })),
      h('path', { d: 'M20 132H420 M220 12V252 M80 52L360 212 M80 212L360 52', className: 'lcars-axes' }),
      h('g', { className: 'lcars-rayon' }, h('path', { d: 'M220 132L220 20 A112 112 0 0 1 317 76Z' })),
      poste === 'navigation' ? h('path', { d: 'M100 200L220 132L330 55', className: 'lcars-cible' })
        : poste === 'medecine' ? h('path', { d: 'M65 132H140L158 110L170 170L188 80L207 132H375', className: 'lcars-cible' })
          : h('path', { d: 'M220 117L230 145L220 140L210 145Z', className: 'lcars-vaisseau' }),
      cible && h('circle', { cx: 307, cy: 83, r: 13, className: 'lcars-cible' })),
    h('p', { className: 'lcars-scan-statut', role: 'status' }, actif ? 'Traitement de la demande…' : scan?.poste === poste ? 'Transmission effectuée · résultat attendu du MJ' : 'Console prête'));
}
