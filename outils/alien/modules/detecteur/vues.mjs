/** Instrument autonome : l'hôte fournit la vue et les commandes, jamais un transport. */
import { createElement as h, useCallback, useEffect, useRef, useState } from 'react';
import '../../core.js';
import '../../detecteur.js';
import { DiscretMJ, LectureDiscrete } from './discret-vues.mjs';

const bouton = (texte, props = {}) => h('button', { type: 'button', ...props }, texte);
function useMouvementsReduits() {
  const [reduit, definir] = useState(() => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const media = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    const changer = () => definir(media.matches);
    media?.addEventListener('change', changer);
    return () => media?.removeEventListener('change', changer);
  }, []);
  return reduit;
}
/** Lit la dernière horloge reçue de l'hôte (heure du serveur) sans recréer la boucle de dessin. */
function useHeureStable(horloge) {
  const derniere = useRef(horloge);
  derniere.current = horloge;
  return useCallback(() => (derniere.current || Date.now)(), []);
}
function Radar({ vue, reduit, horloge }) {
  const heure = useHeureStable(horloge);
  const canvas = useRef(null), [maintenant, actualiser] = useState(heure);
  const t = vue.tracker;
  useEffect(() => {
    actualiser(heure());
    const restant = t.anomalyUntil - heure();
    if (restant <= 0) return;
    const minuterie = setTimeout(() => actualiser(heure()), restant + 1);
    return () => clearTimeout(minuterie);
  }, [t.anomalyUntil, heure]);
  const nombre = t.power ? t.contacts + (t.anomalyUntil > maintenant ? 1 : 0) : 0;
  useEffect(() => {
    const dessiner = globalThis.AlienDetecteur.creerRendu(canvas.current);
    let animation, derniere = -Infinity;
    const image = temps => {
      if (!document.hidden && temps - derniere >= 1000 / 30) {
        dessiner(t, { parasites: vue.config.glitches, mouvementReduit: reduit, instant: heure() }, temps); derniere = temps;
      }
      animation = requestAnimationFrame(image);
    };
    const rafraichir = () => dessiner(t, { parasites: vue.config.glitches, mouvementReduit: reduit, instant: heure() }, 0);
    rafraichir();
    if (!reduit && t.power) animation = requestAnimationFrame(image);
    globalThis.addEventListener('resize', rafraichir);
    return () => { if (animation !== undefined) cancelAnimationFrame(animation); globalThis.removeEventListener('resize', rafraichir); };
  }, [t, vue.config.glitches, reduit, nombre, heure]);
  return h('div', { className: `detecteur-ecran${vue.config.crt ? ' detecteur-crt' : ''}` },
    h('div', { className: 'detecteur-bandeau' }, h('span', null, 'WEYLAND-YUTANI'), h('strong', null, t.power ? 'SCAN ACTIF' : 'VEILLE')),
    h('canvas', { ref: canvas, role: 'img', 'aria-label': `Radar : ${nombre} écho${nombre > 1 ? 's' : ''}`, className: 'detecteur-canvas' }),
    !t.power && h('p', { className: 'detecteur-veille' }, 'EN ATTENTE DU SCAN'),
    h('div', { className: 'detecteur-bandeau' }, h('span', { role: 'status' }, `ÉCHOS : ${nombre}`), h('span', null, t.power ? 'ACQUISITION' : 'LIAISON ÉTABLIE')));
}
function Son({ tracker: t, horloge }) {
  const heure = useHeureStable(horloge);
  const [active, activer] = useState(false), [erreur, signaler] = useState('');
  const audio = useRef(null), vivant = useRef(true), bascule = useRef(false);
  useEffect(() => {
    vivant.current = true;
    return () => { vivant.current = false; if (audio.current) { void audio.current.close().catch(() => {}); audio.current = null; } };
  }, []);
  useEffect(() => {
    const contexte = audio.current;
    if (!active || !t.power || t.volume <= 0 || t.intensity <= 0 || !contexte) return;
    let minuterie, oscillateur, gain;
    const silence = () => {
      clearTimeout(minuterie);
      if (oscillateur) { oscillateur.onended = null; try { oscillateur.stop(); } catch { /* Déjà terminé. */ } oscillateur.disconnect(); oscillateur = null; }
      if (gain) { gain.disconnect(); gain = null; }
    };
    const jouer = () => {
      if (document.hidden || contexte.state !== 'running') return;
      const nombre = t.contacts + (t.anomalyUntil > heure() ? 1 : 0);
      if (nombre > 0) {
        oscillateur = contexte.createOscillator(); gain = contexte.createGain();
        oscillateur.frequency.value = t.intensity > 70 ? 960 : 760;
        gain.gain.setValueAtTime(t.volume / 100 * .15, contexte.currentTime);
        gain.gain.exponentialRampToValueAtTime(.0001, contexte.currentTime + .09);
        oscillateur.connect(gain); gain.connect(contexte.destination);
        oscillateur.onended = () => { oscillateur?.disconnect(); gain?.disconnect(); oscillateur = null; gain = null; };
        oscillateur.start(); oscillateur.stop(contexte.currentTime + .1);
      }
      minuterie = setTimeout(jouer, Math.max(260, 2300 - t.intensity * 21));
    };
    const visibilite = () => { silence(); if (!document.hidden) jouer(); };
    jouer(); document.addEventListener('visibilitychange', visibilite);
    return () => { document.removeEventListener('visibilitychange', visibilite); silence(); };
  }, [active, t.power, t.intensity, t.volume, t.contacts, t.anomalyUntil, heure]);
  async function basculer() {
    if (bascule.current) return;
    bascule.current = true;
    try {
      const ClasseAudio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!ClasseAudio) throw new Error();
      if (!audio.current) audio.current = new ClasseAudio();
      if (active) await audio.current.suspend(); else await audio.current.resume();
      if (vivant.current) { activer(!active); signaler(''); }
    } catch { if (vivant.current) signaler('Son indisponible sur cet appareil. Le radar reste utilisable.'); }
    finally { bascule.current = false; }
  }
  return h('div', { className: 'detecteur-son' }, bouton(active ? 'Couper les bips' : 'Activer les bips ici', { onClick: basculer, 'aria-pressed': active }),
    h('small', null, 'Son local à cet appareil. Les bips suivent l’intensité décidée par le meneur.'), erreur && h('p', { role: 'status' }, erreur));
}
function Instrument({ vue, children, horloge }) {
  const reduit = useMouvementsReduits();
  return h('section', { className: 'gmos-detecteur' },
    h('header', null, h('p', { className: 'detecteur-sur-titre' }, 'INSTRUMENT PORTATIF · MODÈLE M314'),
      h('h2', null, 'Détecteur de mouvement'), h('p', null, vue.lectureDiscrete ? 'M314 · échos du dernier scan de jeu.' : 'Signal scénarisé · aucune distance physique mesurée.')),
    h('div', { className: children ? 'detecteur-grille' : '' }, h('div', null, h(Radar, { vue, reduit, horloge }), h(Son, { tracker: vue.tracker, horloge }),vue.lectureDiscrete&&h(LectureDiscrete,{lecture:vue.lectureDiscrete})), children));
}
export function VueJoueur({ vue, horloge }) { return h(Instrument, { vue, horloge }); }

function Reglages({ vue, envoyer, occupe }) {
  function enregistrer(e) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget), charge = {};
    for (const cle of ['contacts', 'proximite', 'intensite', 'volume', 'parasites']) charge[cle] = Number(donnees.get(cle));
    charge.crt = donnees.has('crt'); charge.effetsParasites = donnees.has('effetsParasites');
    void envoyer('configurer', charge);
  }
  return h('form', { onSubmit: enregistrer, className: 'detecteur-reglages', 'aria-label': 'Réglages du détecteur' },
    h('h3', null, 'Mise en scène'),
    h('p', null, 'Ouvre les accès aux PJ depuis la liste des modules, puis démarre le scan. Un même tirage est partagé entre les destinataires.'),
    h('fieldset', { disabled: occupe || vue.discret?.actif },
      ...[['Contacts', 'contacts', 'contacts', 9], ['Proximité (0 loin · 100 près)', 'proximite', 'proximity', 100], ['Intensité', 'intensite', 'intensity', 100], ['Volume des bips', 'volume', 'volume', 100], ['Parasites', 'parasites', 'noise', 100]].map(([libelle, nom, cle, max]) =>
        h('label', { key: nom }, libelle, h('input', { type: 'number', name: nom, defaultValue: vue.tracker[cle], min: 0, max, step: 1, required: true }))),
      h('label', { className: 'detecteur-case' }, h('input', { type: 'checkbox', name: 'crt', defaultChecked: vue.config.crt }), 'Effet CRT'),
      h('label', { className: 'detecteur-case' }, h('input', { type: 'checkbox', name: 'effetsParasites', defaultChecked: vue.config.glitches }), 'Effets parasites'),
      h('button', { type: 'submit' }, 'Enregistrer les réglages')));
}
function Prereglages({ vue, envoyer, occupe }) {
  const [choisi, choisir] = useState(''), [confirmation, confirmer] = useState(false);
  const pr = vue.prereglages.find(p => p.id === choisi);
  async function enregistrer(e) {
    e.preventDefault();
    const nom = new FormData(e.currentTarget).get('nom');
    const prereglageId = pr?.id || 'prereglage-' + crypto.randomUUID();
    if (await envoyer('enregistrer-prereglage', { prereglageId, nom })) choisir(prereglageId);
  }
  return h('section', { className: 'detecteur-reglages', 'aria-label': 'Préréglages du détecteur' },
    h('h3', null, 'Préréglages nommés'),
    h('p', null, 'Enregistre les réglages déjà appliqués ci-dessus. Charger un préréglage arrête le scan ; démarre-le lorsque tu es prêt.'),
    h('label', null, 'Préréglage', h('select', { value: pr?.id || '', disabled: occupe, onChange: e => { choisir(e.target.value); confirmer(false); } },
      h('option', { value: '' }, 'Nouveau préréglage…'), vue.prereglages.map(p => h('option', { value: p.id, key: p.id }, p.nom)))),
    h('form', { key: pr ? JSON.stringify(pr) : 'nouveau', onSubmit: enregistrer },
      h('label', null, 'Nom du préréglage', h('input', { name: 'nom', defaultValue: pr?.nom || '', maxLength: 80, required: true, disabled: occupe })),
      h('button', { type: 'submit', disabled: occupe }, pr ? 'Remplacer par les réglages actuels' : 'Enregistrer les réglages actuels')),
    pr && h('div', null,
      h('p', null, `${pr.reglages.contacts} contacts · proximité ${pr.reglages.proximity} · intensité ${pr.reglages.intensity} · volume ${pr.reglages.volume} · parasites ${pr.reglages.noise}`),
      bouton('Charger et arrêter le scan', { disabled: occupe, onClick: () => envoyer('rappeler-prereglage', { prereglageId: pr.id }) }),
      h('label', { className: 'detecteur-case' }, h('input', { type: 'checkbox', checked: confirmation, disabled: occupe, onChange: e => confirmer(e.target.checked) }), 'Confirmer la suppression du préréglage'),
      bouton('Supprimer le préréglage', { disabled: occupe || !confirmation, onClick: async () => {
        if (await envoyer('supprimer-prereglage', { prereglageId: pr.id })) { choisir(''); confirmer(false); }
      } })));
}
export function PupitreMJ({ vue, envoyerCommande }) {
  const [occupe, occuper] = useState(false), [erreur, signaler] = useState('');
  const enCours = useRef(false), vivant = useRef(true);
  useEffect(() => { vivant.current = true; return () => { vivant.current = false; }; }, []);
  async function envoyer(id, charge) {
    if (enCours.current) return false;
    enCours.current = true; occuper(true); signaler('');
    try { const resultat = await envoyerCommande({ id, charge }); if (!resultat?.ok && vivant.current) signaler(resultat?.erreur || 'Commande refusée.'); return resultat?.ok === true; }
    catch { if (vivant.current) signaler('La commande n’a pas pu être transmise.'); return false; }
    finally { enCours.current = false; if (vivant.current) occuper(false); }
  }
  return h(Instrument, { vue }, h('aside', null,
    h('h3', null, 'Poste meneur'),
    h('div', { className: 'detecteur-actions' },
      bouton(vue.tracker.power ? 'Arrêter le scan' : 'Démarrer le scan', { disabled: occupe || (vue.discret?.actif && !vue.tracker.power), 'aria-pressed': vue.tracker.power, onClick: () => envoyer('scanner', { actif: !vue.tracker.power }) }),
      bouton('Faux écho · 9 s', { disabled: occupe || !vue.tracker.power || vue.discret?.actif, onClick: () => envoyer('faux-echo', {}) })),
    erreur && h('p', { role: 'alert' }, erreur),
    h(Reglages, { key: JSON.stringify([vue.config, vue.tracker.contacts, vue.tracker.proximity, vue.tracker.intensity, vue.tracker.volume, vue.tracker.noise]), vue, envoyer, occupe }),
    h(Prereglages, { vue, envoyer, occupe }),
    h(DiscretMJ, { d:vue.discret, envoyer, occupe }),
    h('p', null, 'Arrêter le scan conserve les accès et les réglages. Aucun effet automatique sur le Stress.')));
}
