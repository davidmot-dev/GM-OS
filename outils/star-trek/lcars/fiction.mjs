import { appliquerCommande, creerEtat, arreterEffets } from './moteur.mjs';
import { POSTES } from './postes.mjs';
export const mj = { role: 'mj', appareilId: 'atelier-mj' };
export const tlen = { role: 'joueur', personnageId: 'pj-tlen', appareilId: 'atelier-pj-tlen' };
export const mara = { role: 'joueur', personnageId: 'pj-mara', appareilId: 'atelier-pj-mara' };
export function creerFiction() {
  let e = creerEtat(); const agir = (id, charge) => { e = appliquerCommande(e, { id, charge }, mj); };
  for (const [personnageId, nom, postes] of [
    ['pj-tlen', 'T’Len', ['science', 'medecine']], ['pj-mara', 'Mara Chen', ['commandement']],
    ['pj-ilya', 'Ilya Voss', ['ingenierie', 'navigation']], ['pj-rin', 'Rin Sol', ['communications', 'tactique']],
    ['pj-essai', 'Officier de test', Object.keys(POSTES)],
  ]) agir('preparer-officier', { personnageId, nom, postes });
  const cibles = [
    ['mission', 'commandement', 'Station silencieuse', 'Identifier l’origine du silence et porter assistance.', 'en-cours', 'La priorité est de rétablir une liaison avant de décider de l’approche.'],
    ['c-03', 'science', 'C-03 · Écho non identifié', 'Une émission intermittente près de la station.', 'inconnu', 'Le signal provient d’une balise automatisée. Une capsule de sauvetage dérive à proximité.'],
    ['c-07', 'science', 'C-07 · Relais dissimulé', 'Un émetteur masqué dans le champ de débris.', 'inconnu', 'SECRET RELAIS : un ancien appel de détresse est réémis.'],
    ['reacteur', 'ingenierie', 'Confinement du réacteur', 'Fluctuations de puissance sur le circuit secondaire.', 'perturbe', 'Une dérivation isolera la fuite. Le circuit peut être stabilisé après intervention.'],
    ['boucliers', 'ingenierie', 'Réseau des boucliers', 'Les relais défensifs répondent normalement.', 'nominal', 'Le réseau est nominal ; aucune réparation nécessaire.'],
    ['canal-station', 'communications', 'Canal de la station', 'Un fragment de voix traverse les interférences.', 'brouille', '« Ici le laboratoire orbital. Nous avons besoin d’une équipe médicale. »'],
    ['canal-equipe', 'communications', 'Équipe extérieure', 'Canal interne prêt à recevoir des instructions.', 'ouvert', '« Équipe extérieure : message reçu. Nous attendons vos instructions. »'],
    ['route-station', 'navigation', 'Approche de la station', 'Un champ de débris traverse la route directe.', 'risque', 'Le corridor latéral permet une approche plus sûre. La manœuvre reste à valider.'],
    ['route-repli', 'navigation', 'Route de repli', 'Un vecteur de dégagement est disponible.', 'disponible', 'Vecteur de repli confirmé. Le départ reste soumis à l’ordre du commandant.'],
    ['contact-tactique', 'tactique', 'Signature à proximité', 'Une signature énergétique accompagne les débris.', 'inconnu', 'Il s’agit d’un drone de maintenance. Aucun armement identifié.'],
    ['perimetre', 'tactique', 'Périmètre de sécurité', 'Les accès au vaisseau sont surveillés.', 'identifie', 'Les accès sont sûrs. Une escorte peut accompagner l’équipe extérieure.'],
    ['patient-01', 'medecine', 'Patient de la capsule', 'Signes de fatigue et exposition inconnue.', 'urgence', 'DOSSIER MÉDICAL PRIVÉ : déshydratation et choc thermique. Une prise en charge adaptée devrait stabiliser le patient.'],
    ['bio-03', 'medecine', 'Échantillon du laboratoire', 'Un échantillon scellé attend une analyse.', 'stable', 'L’échantillon contient des spores inertes. Maintenir le confinement pour examen.'],
  ];
  for (const [cibleId, poste, libelle, description, etat, rapportPrepare] of cibles) agir('preparer-cible', { cibleId, poste, libelle, description, etat, rapportPrepare, visible: cibleId !== 'c-07' });
  agir('enregistrer-prereglage', { prereglageId: 'exploration', nom: 'Exploration de la station' });
  agir('changer-alerte', { niveau: 'jaune', texte: 'Interférences : préparer un diagnostic et établir la liaison.', secondes: null });
  agir('enregistrer-prereglage', { prereglageId: 'anomalie', nom: 'Anomalie et interférences' });
  agir('changer-alerte', { niveau: 'rouge', texte: 'Urgence médicale à bord. Coordonner les équipes.', secondes: null });
  agir('enregistrer-prereglage', { prereglageId: 'urgence', nom: 'Urgence à bord' });
  agir('charger-prereglage', { prereglageId: 'exploration' }); return arreterEffets(e);
}
