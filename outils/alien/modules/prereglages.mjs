/**
 * Préréglages des modules Alien — 23/10/2026, à la demande de David (« je veux pouvoir faire des
 * pré-réglages et aussi avoir un bouton de reset pour tout remettre à zéro »).
 *
 * Un préréglage garde une préparation complète sous un nom : `{ id, nom, ...contenu }`, le contenu
 * propre à chaque module. Les préréglages restent au poste du MJ et survivent à la remise à zéro.
 */
const exiger = (condition, message = 'Préréglage invalide ou nom déjà utilisé.') => { if (!condition) throw new Error(message); };
const objet = v => v !== null && typeof v === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const identifiant = v => typeof v === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(v);
export const LIMITE_DES_PREREGLAGES = 32;
export const COMMANDES_DE_PREREGLAGE = ['enregistrer-prereglage', 'rappeler-prereglage', 'supprimer-prereglage'];

/** `validerContenu` reçoit l'entrée sans `id` ni `nom`. */
export function validerPrereglages(liste, validerContenu) {
  exiger(Array.isArray(liste) && liste.length <= LIMITE_DES_PREREGLAGES, `Limite de ${LIMITE_DES_PREREGLAGES} préréglages.`);
  const ids = new Set(), noms = new Set();
  for (const p of liste) {
    exiger(objet(p) && identifiant(p.id) && !ids.has(p.id) && typeof p.nom === 'string' && p.nom.trim().length > 0
      && p.nom === p.nom.trim() && p.nom.length <= 80 && !noms.has(p.nom.toLocaleLowerCase('fr')));
    const { id: _id, nom: _nom, ...contenu } = p;
    validerContenu(contenu);
    ids.add(p.id); noms.add(p.nom.toLocaleLowerCase('fr'));
  }
}

/** Vérifie la charge d'une commande de préréglage ou de remise à zéro, sans rien changer. */
export function lireCharge(commande) {
  const c = commande.charge, cles = commande.id === 'enregistrer-prereglage' ? ['prereglageId', 'nom'] : commande.id === 'reinitialiser' ? [] : ['prereglageId'];
  exiger(objet(c) && Object.keys(c).length === cles.length && cles.every(k => Object.hasOwn(c, k)), 'Commande de préréglage invalide.');
  if (cles.length) exiger(identifiant(c.prereglageId), 'Commande de préréglage invalide.');
  if (commande.id === 'enregistrer-prereglage') exiger(typeof c.nom === 'string');
  return c;
}

/** Crée ou remplace l'entrée de cet identifiant ; rend une nouvelle liste validée. */
export function enregistrerPrereglage(liste, charge, contenu, validerContenu) {
  const suivante = structuredClone(liste), entree = { id: charge.prereglageId, nom: charge.nom.trim(), ...structuredClone(contenu) };
  const index = suivante.findIndex(p => p.id === charge.prereglageId);
  if (index < 0) suivante.push(entree); else suivante[index] = entree;
  validerPrereglages(suivante, validerContenu);
  return suivante;
}

export function prereglageDe(liste, id) {
  const p = liste.find(x => x.id === id);
  exiger(p, 'Préréglage inconnu.');
  return structuredClone(p);
}

export function sansPrereglage(liste, id) {
  prereglageDe(liste, id);
  return liste.filter(p => p.id !== id);
}

/** Ce que le pupitre affiche : le nom, pas la préparation entière. */
export const sommaireDesPrereglages = liste => liste.map(({ id, nom }) => ({ id, nom }));
