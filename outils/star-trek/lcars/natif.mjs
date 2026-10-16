/** Adaptateur natif : contexte de campagne établi par l'hôte, jamais par le joueur. */
import * as moteur from './moteur.mjs';
const copier = v => JSON.parse(JSON.stringify(v));
export function creerEtat() {
  const e = moteur.creerEtat(); e.vaisseau = { nom: 'Vaisseau à configurer', immatriculation: 'À définir' }; e.situation = ''; return e;
}
export function preparerLecteur(donnees, id, nom) {
  moteur.validerEtat(donnees);
  const officier = donnees.officiers.find(p => p.id === id);
  if (officier?.nom === nom) return donnees;
  return moteur.appliquerCommande(donnees, { id: 'preparer-officier', charge: { personnageId: id, nom, postes: officier?.postes || [] } }, { role: 'mj' });
}
export function preparerContexte(donnees, personnages) {
  moteur.validerEtat(donnees); let e = donnees;
  for (const p of donnees.officiers) {
    const courant = personnages.find(c => c.id === p.id);
    if (courant && courant.nom !== p.nom || !courant && p.postes.length) e = moteur.appliquerCommande(e,
      { id: 'preparer-officier', charge: { personnageId: p.id, nom: courant?.nom || p.nom, postes: courant ? p.postes : [] } }, { role: 'mj' });
  }
  return e;
}
export const migrerEtat = (donnees, version) => moteur.arreterEffets(moteur.migrerEtat(donnees, version));
export const arreterEffets = moteur.arreterEffets;
export function appliquerCommande(donnees, commande, lecteur, contexte) {
  if (commande.id === 'choisir-diffusion') throw new Error('Le diffuseur se choisit au pupitre commun du MJ.');
  if (commande.id === 'preparer-officier') {
    const personnage = contexte.personnages.find(p => p.id === commande.charge?.personnageId);
    if (!personnage) throw new Error('Personnage absent de cette campagne.');
    // Valider la charge entière avant de remplacer le nom par celui du contexte fiable.
    moteur.appliquerCommande(donnees, commande, lecteur);
    commande = { ...commande, charge: { ...commande.charge, nom: personnage.nom } };
  }
  return moteur.appliquerCommande(donnees, commande, lecteur);
}
export const fermerAccesApresCommande = commande => commande.id === 'importer-preparation';
export function choisirDiffusion(donnees, appareilId) {
  return moteur.appliquerCommande(donnees, { id: 'choisir-diffusion', charge: { actif: true } }, { role: 'mj', appareilId });
}
export function diffusionActuelle(donnees) { moteur.validerEtat(donnees); return donnees.diffusionSonore; }
export function vuePour(donnees, lecteur, contexte) {
  const vue = moteur.vuePour(donnees, lecteur);
  vue.integration = { origine: 'gmos', medias: true, son: true };
  if (lecteur.role === 'mj') vue.personnages = copier(contexte.personnages);
  return vue;
}
