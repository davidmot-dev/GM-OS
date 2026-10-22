/** Composants de module : aucune connexion réseau ni lecture des magasins GM-OS. */
import { createElement as h, useCallback, useEffect, useId, useRef, useState } from 'react';
import '../../alarme.js';
import '../../video-alerte.js';
import { videoAlerteUrl } from './medias.mjs';
import { ActesMJ } from './actes-vues.mjs';

const bouton = (texte, props = {}) => h('button', { type: 'button', ...props }, texte);
const champ = (libelle, nom, props = {}) => h('label', null, h('span', null, libelle),
  h(props.multiligne ? 'textarea' : 'input', { name: nom, ...Object.fromEntries(Object.entries(props).filter(([cle]) => cle !== 'multiligne')) }));

function ChampCode({ libelle, nom, ...props }) {
  const [visible, setVisible] = useState(false), identifiant = useId();
  const action = visible ? 'Masquer' : 'Afficher';
  return h('div', { className: 'muthur-champ-code' },
    h('label', { htmlFor: identifiant }, libelle),
    h('div', { className: 'muthur-code-ligne' },
      h('input', { ...props, name: nom, id: identifiant, type: visible ? 'text' : 'password', autoCapitalize: 'off', spellCheck: false }),
      bouton(action, { onClick: () => setVisible(!visible), disabled: props.disabled,
        'aria-label': `${action} le ${libelle.toLowerCase()}`, 'aria-controls': identifiant, 'aria-pressed': visible })));
}

function useCommandes(envoyerCommande) {
  const [occupe, setOccupe] = useState(false), [erreur, setErreur] = useState('');
  const actif = useRef(true), enCours = useRef(false);
  useEffect(() => { actif.current = true; return () => { actif.current = false; }; }, []);
  async function envoyer(id, charge) {
    if (enCours.current) return false;
    enCours.current = true; setOccupe(true); setErreur('');
    try {
      const resultat = await envoyerCommande({ id, charge });
      if (resultat?.ok !== true) {
        if (actif.current) setErreur(typeof resultat?.erreur === 'string' ? resultat.erreur : 'La commande a été refusée.');
        return false;
      }
      return true;
    } catch {
      if (actif.current) setErreur('La commande n’a pas pu être transmise.');
      return false;
    } finally {
      enCours.current = false;
      if (actif.current) setOccupe(false);
    }
  }
  return { envoyer, occupe, erreur };
}

/** Une fonction stable qui lit la dernière horloge reçue : le film et l'alarme, créés une fois,
 * suivent ainsi l'heure du serveur sans être recréés à chaque projection. */
function useHeureStable(horloge) {
  const derniere = useRef(horloge);
  derniere.current = horloge;
  return useCallback(() => (derniere.current || Date.now)(), []);
}

function CompteARebours({ fin, alerte = false, horloge = Date.now }) {
  const [maintenant, setMaintenant] = useState(horloge);
  useEffect(() => {
    if (!fin) return;
    setMaintenant(horloge());
    const minuterie = setInterval(() => setMaintenant(horloge()), 1000);
    return () => clearInterval(minuterie);
  }, [fin, horloge]);
  if (!fin) return null;
  const secondes = Math.max(0, Math.ceil((fin - maintenant) / 1000));
  return h('div', { className: `muthur-compte${alerte ? ' muthur-compte-urgence' : ''}`, role: 'timer', 'aria-label': 'Compte à rebours fictif' },
    `${String(Math.floor(secondes / 60)).padStart(2, '0')}:${String(secondes % 60).padStart(2, '0')}`);
}

function Son({ dernierMessage, vue, envoyer, active, setActive, filmEnCours, horloge }) {
  const [erreur, setErreur] = useState('');
  const audio = useRef(null), vivant = useRef(true), precedent = useRef(dernierMessage), alarme = useRef(null);
  const maintenant = useHeureStable(horloge);
  useEffect(() => {
    vivant.current = true;
    return () => { vivant.current = false; alarme.current?.detruire(); alarme.current = null; if (audio.current) { void audio.current.close().catch(() => {}); audio.current = null; } };
  }, []);
  useEffect(() => {
    alarme.current?.suivre(vue.autodestruction, vue.countdown?.endAt, active && vue.diffusionAutorisee && !filmEnCours);
  }, [active, vue.autodestruction?.id, vue.countdown?.endAt, vue.diffusionAutorisee, filmEnCours]);
  useEffect(() => {
    const nouveau = precedent.current !== dernierMessage;
    precedent.current = dernierMessage;
    const contexte = audio.current;
    if (!active || filmEnCours || !nouveau || !dernierMessage || contexte?.state !== 'running') return;
    const oscillateur = contexte.createOscillator(), gain = contexte.createGain();
    oscillateur.frequency.value = 780;
    gain.gain.setValueAtTime(0.025, contexte.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, contexte.currentTime + 0.07);
    oscillateur.connect(gain); gain.connect(contexte.destination);
    oscillateur.onended = () => { oscillateur.disconnect(); gain.disconnect(); };
    oscillateur.start(); oscillateur.stop(contexte.currentTime + 0.08);
  }, [active, dernierMessage, filmEnCours]);
  async function basculer() {
    try {
      const ClasseAudio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!ClasseAudio) throw new Error('Indisponible');
      if (!audio.current) {
        audio.current = new ClasseAudio();
        alarme.current = globalThis.AlienAlarme.creer({ audio: audio.current, maintenant, signaler: message => { if (vivant.current) setErreur(message); } });
      }
      if (active) { alarme.current?.arreter(); await audio.current.suspend(); } else await audio.current.resume();
      if (vivant.current) { setActive(!active); setErreur(''); }
    } catch { if (vivant.current) setErreur('Son indisponible sur cet appareil.'); }
  }
  return h('div', { className: 'muthur-son' }, bouton(active ? 'Couper le son' : 'Activer le son', { onClick: basculer, 'aria-pressed': active }),
    bouton(vue.diffusionAutorisee ? 'Ne plus diffuser ici' : 'Diffuser l’alarme ici', { 'aria-pressed': !!vue.diffusionAutorisee, onClick: () => envoyer('choisir-diffusion', { actif: !vue.diffusionAutorisee }) }),
    h('small', null, vue.diffusionAutorisee ? 'Appareil choisi pour le film, la sirène et la voix.' : 'Bande-son et alarme réservées à l’appareil choisi.'),
    erreur && h('span', { role: 'status' }, erreur));
}

function Journal({ operateur, horloge = Date.now }) {
  const log = useRef(null);
  const [sequence, setSequence] = useState(null);
  const messages = operateur?.messages || [], dernier = messages.at(-1)?.id;
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [dernier, sequence?.id]);
  useEffect(() => {
    const cue = operateur?.cue;
    const maintenant = horloge();
    const restant = cue ? cue.at + cue.duration - maintenant : 0;
    if (restant <= 0) { setSequence(null); return; }
    // Rejoindre une séquence encore en cours après changement de vue, sans rejouer ses sept secondes.
    const depart = operateur.request?.type === 'hack' && operateur.request.id === cue.id;
    setSequence({ ...cue, depart, decalage: Math.min(0, cue.at - maintenant) });
    const minuterie = setTimeout(() => setSequence(null), restant);
    return () => clearTimeout(minuterie);
  }, [operateur?.cue?.id, operateur?.cue?.at, operateur?.cue?.duration, operateur?.cue?.success, operateur?.request?.id, horloge]);
  return h('div', { key: sequence?.id || 'terminal', className: `muthur-journal${sequence ? ` muthur-piratage muthur-piratage-${sequence.depart ? 'depart' : sequence.success ? 'accorde' : 'refuse'}` : ''}`,
    style: sequence ? { '--muthur-piratage-decalage': `${sequence.decalage}ms` } : undefined,
    role: 'log', 'aria-label': 'Dialogue MU/TH/UR', 'aria-live': 'polite' },
    h('div', { className: 'muthur-journal-contenu', ref: log },
    h('p', { className: 'muthur-demarrage' }, 'MU/TH/UR 6000 · INTERFACE ÉQUIPAGE\nConnexion établie. Saisir HELP pour les commandes.'),
    messages.map(message => h('div', { key: message.id, className: `muthur-message muthur-message-${message.kind}` },
      h('span', { className: 'muthur-auteur' }, message.kind === 'input' ? 'OPÉRATEUR' : message.kind === 'mother' ? 'MU/TH/UR · TRANSMISSION' : 'SYSTÈME'),
      h('p', null, message.content))),
    sequence && h('p', { className: 'muthur-sequence', role: 'status' }, sequence.depart ? 'INTRUSION EN COURS · ATTENTE DU MJ' : sequence.success ? 'INTRUSION · ACCÈS ACCORDÉ' : 'CONTRE-MESURES · ACCÈS REFUSÉ')));
}

function VideoAlerte({ sequence, fin, avecSon, lectureChange, horloge }) {
  const element = useRef(null), lecteur = useRef(null), son = useRef(avecSon);
  const [statut, setStatut] = useState('');
  const maintenant = useHeureStable(horloge);
  son.current = avecSon;
  useEffect(() => {
    let vivant = true;
    const controle = globalThis.AlienVideoAlerte.creer({ element: element.current, source: videoAlerteUrl, maintenant,
      signaler: message => { if (vivant) setStatut(message); }, lectureChange: actif => { if (vivant) lectureChange(actif); } });
    lecteur.current = controle; controle.suivre(sequence, fin, son.current);
    return () => { vivant = false; lecteur.current = null; controle.detruire(); };
  }, [sequence.id, sequence.startedAt, fin, lectureChange]);
  useEffect(() => { lecteur.current?.suivre(sequence, fin, avecSon); }, [sequence.id, fin, avecSon]);
  return h('div', { className: 'muthur-film' },
    h('video', { ref: element, muted: !avecSon, playsInline: true, preload: 'metadata', 'aria-label': 'Séquence d’alerte du Nostromo' }),
    bouton('Reprendre la vidéo', { onClick: () => lecteur.current?.reprendre() }),
    statut && h('p', { role: 'status' }, statut));
}

function Cadre({ vue, titre, enfants, erreur, operateur, envoyer, horloge }) {
  const [sonActif, setSonActif] = useState(false), [film, setFilm] = useState({ id: null, actif: true });
  const filmEnCours = !!vue.autodestruction && (film.id !== vue.autodestruction.id || film.actif);
  const noterLecture = useCallback(actif => setFilm({ id: vue.autodestruction?.id, actif }), [vue.autodestruction?.id]);
  return h('section', { className: `gmos-muthur${vue.config.crt ? ' muthur-crt' : ''}${vue.config.glitches ? ' muthur-parasites' : ''}${vue.autodestruction ? ' muthur-autodestruction' : ''}`, 'aria-label': titre },
    h('header', { className: 'muthur-entete' }, h('div', null, h('small', null, vue.config.vessel), h('h2', null, titre)),
      h(Son, { dernierMessage: operateur?.messages?.at(-1)?.id, vue, envoyer, active: sonActif, setActive: setSonActif, filmEnCours, horloge }),
      !vue.autodestruction && h(CompteARebours, { fin: vue.countdown?.endAt, horloge })),
    vue.autodestruction && h('section', { className: 'muthur-urgence', 'aria-label': 'Alerte autodestruction' },
      h('p', { className: 'muthur-urgence-titre', role: 'status' }, 'AUTODESTRUCTION ENGAGÉE'),
      h(CompteARebours, { fin: vue.countdown?.endAt, alerte: true, horloge }),
      h(VideoAlerte, { key: vue.autodestruction.id, sequence: vue.autodestruction, fin: vue.countdown?.endAt, avecSon: sonActif && vue.diffusionAutorisee, lectureChange: noterLecture, horloge }),
      h('p', null, vue.autodestruction.message), h('p', { className: 'muthur-aide' }, 'Saisir CODE suivi du code d’annulation pour interrompre la séquence.'),
      Array.isArray(vue.protocoles) && bouton('Annuler l’autodestruction', { onClick: () => envoyer('compte-a-rebours', { minutes: null }) })),
    vue.portes !== 'inconnues' && h('p', { className: 'muthur-acces', role: 'status' }, vue.portes === 'ouvertes' ? 'Portes ouvertes' : 'Portes fermées'),
    erreur && h('p', { role: 'alert', className: 'muthur-erreur' }, erreur), enfants);
}

/** La vue reçue est déjà filtrée ; le composant ne décide jamais de l'identité. */
function TerminalJoueur({ vue, envoyerCommande, horloge }) {
  const { envoyer, occupe, erreur } = useCommandes(envoyerCommande);
  const saisieId = useId();
  const [texte, setTexte] = useState('');
  async function soumettre(evenement) {
    evenement.preventDefault();
    if (await envoyer('saisir', { texte })) setTexte('');
  }
  return h(Cadre, { vue, titre: 'MU/TH/UR 6000', erreur, operateur: vue.player, envoyer, horloge,
    enfants: h('div', { className: 'muthur-terminal' },
      h('p', { className: 'muthur-acces' }, `Opérateur : ${vue.player.name} · Accès ${vue.player.access === 'admin' ? 'administrateur' : 'équipage'}`),
      h(Journal, { operateur: vue.player, horloge }),
      h('div', { className: 'muthur-actions', 'aria-label': 'Commandes rapides' }, ['HELP', 'STATUS', 'LIST', 'HACK', 'CLEAR'].map(commande =>
        bouton(commande, { key: commande, disabled: occupe, onClick: () => envoyer('saisir', { texte: commande }) }))),
      h('form', { onSubmit: soumettre, className: 'muthur-saisie' },
        h('label', { htmlFor: saisieId }, 'Commande ou /M votre question'),
        h('div', null, h('input', { id: saisieId, value: texte, onChange: evenement => setTexte(evenement.target.value),
          type: /^(LOGIN|CODE|ORDERS)\s/i.test(texte) ? 'password' : 'text', autoComplete: 'off', autoCapitalize: 'off', spellCheck: false,
          maxLength: 2000, disabled: occupe, required: true }), h('button', { type: 'submit', disabled: occupe || !texte.trim() }, occupe ? 'Transmission…' : 'Transmettre'))),
      h('p', { className: 'muthur-aide' }, 'Codes : CODE votre_code · Dossier : READ navigation · Identification : LOGIN mot_de_passe')) });
}

export function VueJoueur(props) {
  return h(TerminalJoueur, { ...props, key: props.vue.player.id });
}

function Dossier({ dossier, documents, envoyer, occupe, enregistre }) {
  const [protection, setProtection] = useState(dossier?.access || 'crew');
  const [confirmation, confirmer] = useState(false);
  const nouveau = !dossier;
  const index = documents.findIndex(d => d.id === dossier?.id);
  function deplacer(delta) {
    enregistre(dossier.id);
    const ids = documents.map(d => d.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    void envoyer('classer-dossiers', { dossierIds: ids });
  }
  async function enregistrer(evenement) {
    evenement.preventDefault(); const donnees = new FormData(evenement.currentTarget);
    const dossierId = dossier?.id || donnees.get('identifiant').trim();
    if (await envoyer(nouveau ? 'creer-dossier' : 'modifier-dossier', {
      dossierId, titre: donnees.get('titre'), contenu: donnees.get('contenu'), acces: donnees.get('acces'),
      code: donnees.get('code') || '',
    })) enregistre(dossierId);
  }
  return h('form', { onSubmit: enregistrer, className: 'muthur-formulaire', 'aria-label': nouveau ? 'Créer un dossier' : 'Modifier le dossier' },
    champ('Identifiant du dossier', 'identifiant', { defaultValue: dossier?.id || '', maxLength: 64, required: true, readOnly: !nouveau,
      pattern: nouveau ? '[a-z](?:[a-z0-9]|-){0,63}' : undefined, placeholder: 'rapport-medical', disabled: occupe }),
    h('p', { className: 'muthur-aide' }, nouveau ? 'Pour la commande READ : lettres minuscules sans accent, chiffres et tirets ; commencer par une lettre.' : `Commande de lecture : READ ${dossier.id}`),
    champ('Titre', 'titre', { defaultValue: dossier?.title || '', maxLength: 80, required: nouveau, disabled: occupe }),
    h('label', null, h('span', null, 'Protection'), h('select', { name: 'acces', 'aria-label': 'Protection', value: { crew: 'equipage', code: 'code', admin: 'administrateur' }[protection],
      onChange: evenement => setProtection({ equipage: 'crew', code: 'code', administrateur: 'admin' }[evenement.target.value]), disabled: occupe },
      h('option', { value: 'equipage' }, 'Équipage'), h('option', { value: 'code' }, 'Code requis'), h('option', { value: 'administrateur' }, 'Administrateur'))),
    h(ChampCode, { libelle: 'Code du dossier', nom: 'code', defaultValue: dossier?.code || '', maxLength: 120, autoComplete: 'off', required: nouveau && protection === 'code', disabled: occupe || protection !== 'code' }),
    champ('Contenu', 'contenu', { defaultValue: dossier?.body || '', multiligne: true, rows: 8, maxLength: 10000, disabled: occupe }),
    h('button', { type: 'submit', disabled: occupe }, nouveau ? 'Créer le dossier' : 'Enregistrer le dossier'),
    !nouveau && h('div', null,
      h('div', { className: 'muthur-actions', 'aria-label': 'Classement du dossier' },
        bouton('Monter le dossier', { disabled: occupe || index <= 0, onClick: () => deplacer(-1) }),
        bouton('Descendre le dossier', { disabled: occupe || index >= documents.length - 1, onClick: () => deplacer(1) })),
      h('p', { className: 'muthur-aide' }, 'Cet ordre est celui de LIST. Les textes déjà lus restent dans les dialogues.'),
      h('label', null, h('input', { type: 'checkbox', checked: confirmation, disabled: occupe, onChange: e => confirmer(e.target.checked) }), 'Confirmer la suppression du dossier'),
      bouton('Supprimer le dossier', { disabled: occupe || !confirmation, onClick: async () => {
        if (await envoyer('supprimer-dossier', { dossierId: dossier.id })) enregistre(documents[index + 1]?.id || documents[index - 1]?.id || '');
      } })));
}

function Demandes({ operateur, envoyer, occupe }) {
  const [choisie, choisir] = useState(null);
  const demandes = operateur.requests, attentes = demandes.filter(d => d.status === 'pending');
  const demande = choisie === '' ? undefined : attentes.find(d => d.id === choisie) || attentes[0];
  async function repondre(e) {
    e.preventDefault(); const formulaire = e.currentTarget;
    const charge = { personnageId: operateur.id, texte: new FormData(formulaire).get('texte') };
    charge.demandeId = demande?.id ?? null;
    if (await envoyer('repondre', charge)) formulaire.reset();
  }
  return h('section', { 'aria-label': 'File des demandes' },
    h('h3', null, `Demandes en attente : ${attentes.length}`),
    h('label', null, 'Demande à traiter', h('select', { value: demande?.id || '', disabled: occupe, onChange: e => choisir(e.target.value) },
      h('option', { value: '' }, 'Message libre à cet opérateur'),
      attentes.map((d, i) => h('option', { key: d.id, value: d.id }, `${i + 1}. ${d.type === 'hack' ? 'Piratage' : d.content.slice(0, 70)}`)))),
    demande && h('p', { className: 'muthur-demande' }, demande.content),
    demande?.type === 'hack' ? h('div', { className: 'muthur-actions', 'aria-label': 'Arbitrage du piratage' },
      bouton('Autoriser l’intrusion', { disabled: occupe, onClick: () => envoyer('arbitrer-piratage', { personnageId: operateur.id, demandeId: demande.id, reussite: true }) }),
      bouton('Repousser l’intrusion', { disabled: occupe, onClick: () => envoyer('arbitrer-piratage', { personnageId: operateur.id, demandeId: demande.id, reussite: false }) }))
      : h('form', { key: demande?.id || 'libre', onSubmit: repondre, className: 'muthur-formulaire', 'aria-label': 'Répondre comme Maman' },
        champ('Réponse de Maman', 'texte', { multiligne: true, rows: 3, maxLength: 10000, required: true, disabled: occupe }),
        h('button', { type: 'submit', disabled: occupe }, 'Transmettre la réponse')),
    h('details', null, h('summary', null, 'Demandes traitées'),
      demandes.filter(d => d.status !== 'pending').map(d => h('div', { key: d.id, className: 'muthur-demande' },
        h('strong', null, { answered: 'Répondu', accepted: 'Autorisé', refused: 'Refusé', cancelled: 'Annulé' }[d.status]),
        h('p', null, d.content), h('p', null, d.response)))));
}

function SaisieMJ({ operateur, envoyer, occupe }) {
  const [texte, setTexte] = useState('');
  const saisieId = useId();
  async function soumettre(evenement) {
    evenement.preventDefault();
    if (await envoyer('saisir', { personnageId: operateur.id, texte })) setTexte('');
  }
  return h('form', { className: 'muthur-formulaire', onSubmit: soumettre },
    h('label', { htmlFor: saisieId }, 'Commande de test pour cet opérateur'),
    h('input', { id: saisieId, value: texte, onChange: evenement => setTexte(evenement.target.value),
      type: /^(LOGIN|CODE|ORDERS)\s/i.test(texte) ? 'password' : 'text', autoComplete: 'off', autoCapitalize: 'off', spellCheck: false,
      maxLength: 2000, disabled: occupe, required: true }),
    h('button', { type: 'submit', disabled: occupe || !texte.trim() }, 'Essayer la commande'));
}

function FormulaireProtocole({ protocole, envoyer, occupe, nouveau, enregistre }) {
  const [identifiant] = useState(() => protocole?.id || `protocole-${globalThis.crypto.randomUUID()}`);
  const [confirmation, setConfirmation] = useState(false);
  async function enregistrer(evenement) {
    evenement.preventDefault(); const valeurs = new FormData(evenement.currentTarget);
    const succes = await envoyer('enregistrer-protocole', { protocole: {
      id: identifiant, nom: valeurs.get('nom'), code: valeurs.get('code').trim(), message: valeurs.get('message'),
      effet: valeurs.get('effet'), minutes: Number(valeurs.get('minutes')), actif: valeurs.has('actif'), portee: valeurs.get('portee'),
    } });
    if (succes) enregistre(identifiant);
  }
  return h('div', null, h('form', { onSubmit: enregistrer, className: 'muthur-formulaire', 'aria-label': 'Modifier le protocole' },
    champ('Nom du protocole', 'nom', { defaultValue: protocole?.nom || '', maxLength: 80, required: true, disabled: occupe }),
    h(ChampCode, { libelle: 'Code du protocole', nom: 'code', defaultValue: protocole?.code || '', maxLength: 120, autoComplete: 'off', required: true, disabled: occupe }),
    champ('Message type', 'message', { multiligne: true, rows: 4, defaultValue: protocole?.message || '', maxLength: 4000, required: true, disabled: occupe }),
    h('label', null, h('span', null, 'Effet du protocole'), h('select', { name: 'effet', defaultValue: protocole?.effet || 'message', disabled: occupe },
      [['message', 'Message seulement'], ['ouvrir-portes', 'Ouvrir les portes'], ['fermer-portes', 'Fermer les portes'], ['autodestruction', 'Lancer l’autodestruction'], ['annuler-autodestruction', 'Annuler l’autodestruction']].map(([valeur, texte]) => h('option', { key: valeur, value: valeur }, texte)))),
    champ('Durée de l’autodestruction en minutes', 'minutes', { type: 'number', min: 0.1, max: 60, step: 0.1, defaultValue: protocole?.minutes || 10, required: true, disabled: occupe }),
    h('p', { className: 'muthur-aide' }, 'Avec le film complet, la durée effective est au moins de 12 min 56 s. Au-delà, la sirène et les annonces reprennent après le film.'),
    h('label', null, h('span', null, 'Destinataires du message'), h('select', { name: 'portee', defaultValue: protocole?.portee || 'equipage', disabled: occupe },
      h('option', { value: 'equipage' }, 'Tout l’équipage'), h('option', { value: 'operateur' }, 'Opérateur seulement'))),
    champ('Code actif', 'actif', { type: 'checkbox', defaultChecked: protocole?.actif || false, disabled: occupe }),
    h('button', { type: 'submit', disabled: occupe }, 'Enregistrer le protocole')),
    protocole && h('div', { className: 'muthur-formulaire' },
      h('label', null, h('input', { type: 'checkbox', checked: confirmation, onChange: evenement => setConfirmation(evenement.target.checked), disabled: occupe }), 'Confirmer la suppression du protocole'),
      bouton('Supprimer le protocole', { disabled: occupe || !confirmation, onClick: async () => { if (await envoyer('supprimer-protocole', { protocoleId: protocole.id })) nouveau(); } })));
}

function Protocoles({ vue, envoyer, occupe }) {
  const [selection, setSelection] = useState(vue.protocoles[0]?.id || 'nouveau');
  const protocole = vue.protocoles.find(pr => pr.id === selection);
  return h('section', null,
    h('p', null, 'Un code exact déclenche le message et l’effet préparés. Le joueur saisit CODE suivi du code ; les codes ne sont jamais listés aux joueurs.'),
    h('label', null, h('span', null, 'Protocole'), h('select', { value: protocole?.id || 'nouveau', onChange: evenement => setSelection(evenement.target.value), disabled: occupe },
      h('option', { value: 'nouveau' }, 'Nouveau protocole…'), vue.protocoles.map(pr => h('option', { value: pr.id, key: pr.id }, `${pr.nom}${pr.actif ? '' : ' · Inactif'}`)))),
    h(FormulaireProtocole, { key: protocole ? JSON.stringify(protocole) : 'nouveau', protocole, envoyer, occupe, nouveau: () => setSelection('nouveau'), enregistre: id => setSelection(id) }));
}

function Reglages({ vue, envoyer, occupe }) {
  const [confirmation, setConfirmation] = useState(false);
  async function enregistrer(evenement) {
    evenement.preventDefault(); const donnees = new FormData(evenement.currentTarget);
    await envoyer('configurer', { vaisseau: donnees.get('vaisseau'), statut: donnees.get('statut'), motDePasse: donnees.get('motDePasse'), crt: donnees.has('crt'), parasites: donnees.has('parasites') });
  }
  async function demarrer(evenement) {
    evenement.preventDefault(); const donnees = new FormData(evenement.currentTarget);
    await envoyer('compte-a-rebours', { minutes: Number(donnees.get('minutes')) });
  }
  return h('div', { className: 'muthur-reglages' },
    h('form', { key: JSON.stringify(vue.config), onSubmit: enregistrer, className: 'muthur-formulaire', 'aria-label': 'Configuration MU/TH/UR' },
      champ('Vaisseau', 'vaisseau', { defaultValue: vue.config.vessel, maxLength: 64, disabled: occupe }),
      champ('Réponse à STATUS', 'statut', { defaultValue: vue.config.status, multiligne: true, rows: 4, maxLength: 2000, disabled: occupe }),
      h(ChampCode, { libelle: 'Mot de passe administrateur', nom: 'motDePasse', defaultValue: vue.config.adminPassword, maxLength: 120, autoComplete: 'off', required: true, disabled: occupe }),
      champ('Effet CRT', 'crt', { type: 'checkbox', defaultChecked: vue.config.crt, disabled: occupe }),
      champ('Parasites visuels', 'parasites', { type: 'checkbox', defaultChecked: vue.config.glitches, disabled: occupe }),
      h('button', { type: 'submit', disabled: occupe }, 'Enregistrer les réglages')),
    h('form', { onSubmit: demarrer, className: 'muthur-formulaire', 'aria-label': 'Compte à rebours' },
      h('h3', null, 'Compte à rebours fictif'), champ('Durée en minutes', 'minutes', { type: 'number', defaultValue: 5, min: 0.1, max: 60, step: 0.1, required: true, disabled: occupe }),
      h('div', { className: 'muthur-actions' }, h('button', { type: 'submit', disabled: occupe }, 'Démarrer'),
        bouton('Arrêter le compte à rebours', { disabled: occupe, onClick: () => envoyer('compte-a-rebours', { minutes: null }) })),
      h('p', { className: 'muthur-aide' }, 'Affichage de mise en scène ; aucune conséquence automatique sur les personnages.')),
    h('div', { className: 'muthur-formulaire' }, h('h3', null, 'Réinitialiser le terminal'),
      h('p', null, 'Remet les documents, codes, dialogues et accès à leur état de départ. Les opérateurs sont conservés.'),
      h('label', null, h('input', { type: 'checkbox', checked: confirmation, disabled: occupe, onChange: evenement => setConfirmation(evenement.target.checked) }), 'Confirmer la réinitialisation'),
      bouton('Réinitialiser MU/TH/UR', { disabled: occupe || !confirmation, onClick: async () => { if (await envoyer('reinitialiser', {})) setConfirmation(false); } })));
}

export function PupitreMJ({ vue, envoyerCommande }) {
  const { envoyer, occupe, erreur } = useCommandes(envoyerCommande);
  const [onglet, setOnglet] = useState('terminal'), [choisi, setChoisi] = useState(''), [dossierId, setDossierId] = useState(null);
  const operateurs = Object.values(vue.players), operateur = vue.players[choisi] || operateurs[0];
  const dossier = dossierId === '' ? undefined : vue.documents.find(element => element.id === dossierId) || vue.documents[0];
  return h(Cadre, { vue, titre: 'MU/TH/UR · Poste meneur', erreur, operateur, envoyer,
    enfants: h('div', null,
      h('nav', { className: 'muthur-actions', 'aria-label': 'Panneaux MU/TH/UR' }, [['terminal', 'Terminal'], ['dossiers', 'Dossiers'], ['actes', 'Actes'], ['protocoles', 'Protocoles'], ['reglages', 'Réglages']].map(([id, libelle]) =>
        bouton(libelle, { key: id, 'aria-pressed': onglet === id, onClick: () => setOnglet(id) }))),
      onglet === 'terminal' && h('div', { className: 'muthur-terminal' },
        !operateur ? h('p', null, 'Les opérateurs apparaîtront lorsqu’ils utiliseront le terminal.') : h('div', null,
          h('label', null, h('span', null, 'Opérateur'), h('select', { value: operateur.id, onChange: evenement => setChoisi(evenement.target.value), disabled: occupe },
            operateurs.map(element => h('option', { value: element.id, key: element.id }, `${element.name}${element.request ? ' · Demande en attente' : ''}`)))),
          h(Journal, { key: `journal-${operateur.id}`, operateur }),
          h(Demandes, { key: operateur.id, operateur, envoyer, occupe }),
          bouton('Révoquer les accès narratifs', { disabled: occupe, onClick: () => envoyer('revoquer', { personnageId: operateur.id }) }),
          h(SaisieMJ, { key: `saisie-${operateur.id}`, operateur, envoyer, occupe }))),
      onglet === 'dossiers' && h('div', null, h('label', null, h('span', null, 'Dossier'), h('select', { 'aria-label': 'Dossier', value: dossier?.id || '', onChange: evenement => setDossierId(evenement.target.value), disabled: occupe },
        h('option', { value: '' }, 'Nouveau dossier…'),
        vue.documents.map(element => h('option', { value: element.id, key: element.id }, element.title || element.id)))),
      h(Dossier, { key: dossier ? JSON.stringify(dossier) : 'nouveau', dossier, documents: vue.documents, envoyer, occupe, enregistre: setDossierId })),
      onglet === 'protocoles' && h(Protocoles, { vue, envoyer, occupe }),
      onglet === 'actes' && h(ActesMJ, { vue, envoyer, occupe }),
      onglet === 'reglages' && h(Reglages, { vue, envoyer, occupe })) });
}
