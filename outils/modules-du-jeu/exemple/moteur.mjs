/** Exemple pur : l'hôte fournit l'identité vérifiée, les droits et la persistance. */
const objet = valeur => valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);
const personne = id => typeof id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id);
const copie = valeur => JSON.parse(JSON.stringify(valeur));

export function creerEtat() {
  return { texte: '', lectures: {} };
}

export function validerEtat(etat) {
  if (!objet(etat) || Object.keys(etat).sort().join(',') !== 'lectures,texte'
    || typeof etat.texte !== 'string' || etat.texte.length > 2000 || !objet(etat.lectures)
    || Object.entries(etat.lectures).some(([id, lu]) => !personne(id) || lu !== true)) {
    throw new Error('État du module invalide.');
  }
}

export function migrerEtat(donnees, versionDonnees) {
  if (versionDonnees !== 1) throw new Error('Version de données non prise en charge.');
  validerEtat(donnees);
  return copie(donnees);
}

export function appliquerCommande(etat, commande, contexte) {
  validerEtat(etat);
  if (!objet(commande) || Object.keys(commande).sort().join(',') !== 'charge,id' || !objet(commande.charge)) throw new Error('Commande invalide.');
  if (commande.id === 'publier' && contexte?.role === 'mj') {
    const { charge } = commande;
    if (Object.keys(charge).join(',') !== 'texte' || typeof charge.texte !== 'string'
      || !charge.texte.trim() || charge.texte.length > 2000) throw new Error('Texte invalide.');
    return { texte: charge.texte, lectures: {} };
  }
  if (commande.id === 'accuser-lecture' && contexte?.role === 'joueur' && personne(contexte.personnageId)) {
    if (Object.keys(commande.charge).length || !etat.texte) throw new Error('Accusé de lecture invalide.');
    return { ...copie(etat), lectures: { ...etat.lectures, [contexte.personnageId]: true } };
  }
  throw new Error('Commande inconnue ou interdite.');
}

export function vuePour(etat, lecteur) {
  validerEtat(etat);
  if (lecteur?.role === 'mj') return copie(etat);
  if (lecteur?.role === 'joueur' && personne(lecteur.personnageId)) {
    return { texte: etat.texte, lu: Object.hasOwn(etat.lectures, lecteur.personnageId) };
  }
  throw new Error('Lecteur invalide.');
}

/** L'exemple n'a aucun effet actif ; un module sonore neutraliserait aussi ses données transitoires. */
export function arreterEffets(etat) {
  validerEtat(etat);
  return copie(etat);
}
