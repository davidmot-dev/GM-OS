/**
 * Les données du combat spatial d'ALIEN, le jeu de rôle — livre de base français,
 * p. 175-201, et l'errata 2021 (avarie mineure 55). Relevées le 23/10/2026.
 */

/** Les catégories de portée (p. 189) : la distance en zones les donne. */
export const PORTEES = ['contact', 'courte', 'moyenne', 'longue', 'extreme'];
export const LIBELLES_DES_PORTEES = { contact: 'Contact', courte: 'Courte', moyenne: 'Moyenne', longue: 'Longue', extreme: 'Extrême' };
/** Verrouillage et tir (p. 192, 197) : Extrême −2, Longue −1, Moyenne 0, Courte +1, Contact +2. */
export const MODIFICATEUR_DE_PORTEE = { contact: 2, courte: 1, moyenne: 0, longue: -1, extreme: -2 };
export function porteeDeLaDistance(distance) {
  if (distance <= 0) return 'contact';
  if (distance === 1) return 'courte';
  if (distance === 2) return 'moyenne';
  if (distance <= 4) return 'longue';
  if (distance <= 8) return 'extreme';
  return null;
}

/** L'armement (table p. 177). La bombe nucléaire ne vise que la surface : absente du combat. */
export const ARMES = [
  { id: 'canon-particules-400', nom: 'Canon à particules 400 MeV', sorte: 'offensive', bonus: 2, degats: 4, portee: 'longue', particules: true },
  { id: 'canon-particules-800', nom: 'Canon à particules 800 MeV', sorte: 'offensive', bonus: 2, degats: 5, portee: 'extreme', particules: true },
  { id: 'mines-orbitales', nom: 'Mines orbitales', sorte: 'offensive', bonus: 2, degats: 2, portee: 'contact', munitions: 60 },
  { id: 'asat-courte', nom: 'Missiles ASAT courte portée', sorte: 'offensive', bonus: 1, degats: 3, portee: 'longue', munitions: 8 },
  { id: 'asat-longue', nom: 'Missiles ASAT longue portée', sorte: 'offensive', bonus: 1, degats: 4, portee: 'extreme', munitions: 8 },
  { id: 'canon-electrique-leger', nom: 'Tourelle de canon électrique léger', sorte: 'offensive', bonus: 0, degats: 3, portee: 'courte', perceArmure: true },
  { id: 'canon-electrique-moyen', nom: 'Tourelle de canon électrique moyen', sorte: 'offensive', bonus: 0, degats: 4, portee: 'courte', perceArmure: true },
  { id: 'canon-electrique-lourd', nom: 'Tourelle de canon électrique lourd', sorte: 'offensive', bonus: 0, degats: 5, portee: 'courte', perceArmure: true },
  { id: 'drones-senseurs', nom: 'Drones-senseurs', sorte: 'contremesure', bonus: 1, degats: 0, portee: 'courte' },
  { id: 'laser-sar', nom: 'Laser SAR', sorte: 'contremesure', bonus: 2, degats: 0, portee: 'courte' },
  { id: 'leurres-radar', nom: 'Leurres-radar', sorte: 'contremesure', bonus: 0, degats: 0, portee: 'courte' },
];

/** Les vaisseaux décrits par le livre (p. 175-189), armement compris. */
export const MODELES = [
  { id: 'starcub', nom: 'Navette Starcub (classe C)', signature: -1, propulseurs: 2, coque: 2, protection: 4, armes: [] },
  { id: 'corvus', nom: 'CM-90S Corvus (classe G, récupération)', signature: 0, propulseurs: 1, coque: 6, protection: 5, armes: [], ombilic: true },
  { id: 'bison-cargo', nom: 'CM-88G Bison, cargo stellaire (classe M)', signature: 1, propulseurs: 0, coque: 9, protection: 6, armes: [] },
  { id: 'bison-remorqueur', nom: 'Bison, véhicule de remorquage (classe M)', signature: 1, propulseurs: 0, coque: 9, protection: 6, armes: [] },
  { id: 'bison-transport', nom: 'Bison, transport commercial (classe M)', signature: 1, propulseurs: 1, coque: 9, protection: 6, armes: [] },
  { id: 'conestoga', nom: 'Frégate de classe Conestoga', signature: 0, propulseurs: 1, coque: 12, protection: 10, ombilic: true,
    armes: ['laser-sar', 'canon-particules-800', 'canon-electrique-lourd', 'drones-senseurs', 'leurres-radar', 'mines-orbitales', 'asat-longue'] },
];

/** Les quatre postes du combat (p. 188), dans l'ordre des phases, et le capitaine. */
export const POSTES = ['capitaine', 'senseurs', 'pilote', 'artilleur', 'ingenieur'];
export const LIBELLES_DES_POSTES = { capitaine: 'Capitaine', senseurs: 'Opérateur-senseurs', pilote: 'Pilote', artilleur: 'Artilleur', ingenieur: 'Ingénieur' };
export const POSTE_DE_LA_PHASE = { 1: 'senseurs', 2: 'pilote', 3: 'artilleur', 4: 'ingenieur' };
export const LIBELLES_DES_PHASES = { 1: 'Phase de senseurs', 2: 'Phase de pilote', 3: 'Phase d’artilleur', 4: 'Phase d’ingénieur' };
/** Les talents qui jouent ici (p. 74-77) : Commandant, Artilleur et Mécano de vaisseau. */
export const TALENTS_DES_POSTES = { capitaine: 'Commandant de vaisseau : deux cartes d’initiative, garder la meilleure', artilleur: 'Artilleur de vaisseau : +2 au tir', ingenieur: 'Mécano de vaisseau : +2 aux réparations' };

/** Les actions de chaque phase (table p. 191). */
export const ACTIONS = {
  1: [
    { id: 'verrouiller', nom: 'Verrouillage de la cible', competence: 'COMTECH', cible: true },
    { id: 'faire-le-mort', nom: 'Faire le mort (réaction)', competence: 'COMTECH' },
    { id: 'rallumer-senseurs', nom: 'Rallumer les senseurs', competence: null },
  ],
  2: [
    { id: 'accelerer', nom: 'Accélération', competence: 'PILOTAGE' },
    { id: 'decelerer', nom: 'Décélération', competence: 'PILOTAGE' },
    { id: 'evasion', nom: 'Manœuvre d’évasion', competence: 'PILOTAGE', cible: true },
    { id: 'eperonner', nom: 'Éperonnage', competence: 'PILOTAGE', cible: true },
    { id: 'amarrer', nom: 'Amarrage', competence: 'PILOTAGE', cible: true },
  ],
  3: [
    { id: 'tirer', nom: 'Tir offensif', competence: 'COMBAT À DISTANCE', cible: true, arme: 'offensive' },
    { id: 'contremesures', nom: 'Lancement de contremesures (réaction)', competence: 'COMBAT À DISTANCE', arme: 'contremesure' },
  ],
  4: [
    { id: 'reparer', nom: 'Réparations d’urgence', competence: 'MACHINES LOURDES ou COMTECH', avarie: true },
    { id: 'rallumer-moteurs', nom: 'Rallumer les moteurs (deux actions)', competence: null },
    { id: 'ouvrir-sas', nom: 'Ouverture du sas', competence: 'MACHINES LOURDES', cible: true },
    { id: 'surcharger', nom: 'Surcharger le réacteur', competence: 'MACHINES LOURDES' },
    { id: 'arreter-surcharge', nom: 'Interrompre la surcharge', competence: 'MACHINES LOURDES' },
  ],
};

const ML = 'MACHINES LOURDES', CT = 'COMTECH';
/**
 * Avaries mineures, D66 (p. 198-199). `effet` : ce que le moteur applique
 * lui-même ; le reste est dit au meneur. La ligne 55 manque au livre : l'errata
 * 2021 la donne (« unité de réfrigération endommagée »).
 */
export const AVARIES_MINEURES = [
  { de: [11], nom: 'Panne de l’I.A.', texte: 'Il faut réussir un test de COMTECH pour accéder à l’I.A. du vaisseau.', reparation: [CT] },
  { de: [12], nom: 'Purificateurs d’air coupés', texte: '−2 aux tests d’ENDURANCE pendant un Quart, puis plus d’air du tout dans le vaisseau.', reparation: [ML] },
  { de: [13], nom: 'Panne du sas', texte: 'Plus d’accès au sas principal.', reparation: [ML] },
  { de: [14, 15], nom: 'Panne d’armement', texte: '−2 à toutes les attaques d’une arme du vaisseau désignée au hasard.', reparation: [ML], effet: 'arme-2' },
  { de: [16], nom: 'Panne de gravité artificielle', texte: 'Courir demande un test de MOBILITÉ.', reparation: [ML, CT] },
  { de: [21], nom: 'Autodoc coupé', texte: 'Les appareils médicaux sont hors d’usage.', reparation: [ML] },
  { de: [22, 23], nom: 'Cargaison endommagée', texte: 'Un objet de la soute, pris au hasard, est détruit.', reparation: [ML] },
  { de: [24], nom: 'Panne de cafetière', texte: 'La cafetière de la cambuse est hors d’usage.', reparation: [ML] },
  { de: [25], nom: 'Panne de comms', texte: 'Toutes les communications avec l’extérieur sont coupées.', reparation: [CT] },
  { de: [26, 31], nom: 'Décompression d’un compartiment', texte: 'Un compartiment désigné au hasard subit une décompression soudaine (p. 107).', reparation: [ML] },
  { de: [32, 33], nom: 'Membre d’équipage blessé', texte: 'Un membre d’équipage pris au hasard est blessé : 6 dés de base, chaque 6 inflige 1 point de dégâts.', reparation: [], effet: 'blesse' },
  { de: [34], nom: 'Cryocaissons coupés', texte: 'Les caissons de cryogénie sont hors d’usage.', reparation: [ML, CT] },
  { de: [35], nom: 'Panne de moteur à déplacement', texte: 'Cadence supraluminique doublée.', reparation: [ML, CT] },
  { de: [36], nom: 'Sas de connexion endommagé', texte: 'Le vaisseau ne peut plus se connecter à un autre appareil.', reparation: [ML], effet: 'sans-amarrage' },
  { de: [41], nom: 'Panne de capsule de sauvetage', texte: 'Les VEU sont hors d’usage.', reparation: [ML] },
  { de: [42], nom: 'Dégâts du hangar', texte: 'Un véhicule du hangar, désigné au hasard, est Hors service.', reparation: [ML] },
  { de: [43, 44], nom: 'Panne d’instruments', texte: '−1 aux tests de PILOTAGE, COMBAT À DISTANCE et COMTECH.', reparation: [CT], effet: 'instruments-1' },
  { de: [45], nom: 'Intercoms désactivés', texte: 'Toutes les communications internes sont coupées.', reparation: [CT] },
  { de: [46], nom: 'Échelle endommagée', texte: 'Changer de niveau dans le vaisseau demande un test de MOBILITÉ.', reparation: [ML] },
  { de: [51], nom: 'Appareils de soutien vital coupés', texte: 'Sans combinaison pressurisée, chacun est Gelé : un test d’ENDURANCE à chaque Quart.', reparation: [ML] },
  { de: [52], nom: 'Système de navigation coupé', texte: 'COMTECH −2 pour calculer tout trajet supraluminique.', reparation: [CT] },
  { de: [53, 54], nom: 'Fuite du réacteur', texte: 'Légère irradiation (1 Rad par Quart) des zones de contrôle du réacteur.', reparation: [ML] },
  { de: [55], nom: 'Unité de réfrigération endommagée', texte: 'L’unité de réfrigération est endommagée (errata 2021 ; le livre n’en dit pas plus).', reparation: [ML] },
  { de: [56, 61], nom: 'Panne des senseurs', texte: '−2 aux tests de COMTECH qui emploient les senseurs du vaisseau.', reparation: [CT], effet: 'senseurs-2' },
  { de: [62, 64], nom: 'Propulseurs endommagés', texte: 'Propulseurs −2.', reparation: [ML], effet: 'propulseurs-2' },
  { de: [65], nom: 'Transpondeur coupé', texte: 'Le transpondeur cesse de fonctionner.', reparation: [CT], effet: 'transpondeur' },
  { de: [66], nom: 'Panne de l’évacuation des déchets', texte: 'Ça va bientôt sentir très mauvais, ici.', reparation: [ML] },
];

/** Avaries majeures, 2D6 (p. 199). */
export const AVARIES_MAJEURES = [
  { de: [2], nom: 'I.A. coupée', texte: 'L’I.A. du vaisseau est coupée.', reparation: [CT, CT, CT] },
  { de: [3], nom: 'Capsules de sauvetage gravement endommagées', texte: 'Les VEU sont tous hors d’usage.', reparation: [ML, CT] },
  { de: [4], nom: 'Panne de senseurs', texte: 'Les senseurs sont hors d’usage : impossible de verrouiller une cible.', reparation: [CT, CT], effet: 'sans-senseurs' },
  { de: [5], nom: 'Moteur à déplacement HS', texte: 'Impossible de passer en vitesse supraluminique.', reparation: [ML, CT, CT] },
  { de: [6], nom: 'Armement endommagé', texte: 'Une arme du vaisseau, désignée au hasard, est hors d’usage.', reparation: [ML, CT], effet: 'arme-hs' },
  { de: [7], nom: 'Panne de moteur', texte: 'Le vaisseau est immobilisé : aucune action de pilote.', reparation: [ML, ML, CT], effet: 'sans-pilote' },
  { de: [8], nom: 'Membre d’équipage gravement blessé', texte: 'Un membre d’équipage désigné au hasard est Brisé et subit une blessure critique aléatoire.', reparation: [] },
  { de: [9], nom: 'Passerelle exposée au vide', texte: 'Plus de contrôle du vaisseau ; tout le personnel de la passerelle subit une décompression explosive.', reparation: [ML, ML, CT], effet: 'sans-pilote' },
  { de: [10], nom: 'Brèche du réacteur', texte: 'Plus aucune propulsion. Irradiation intense (1 Rad par Tour) près du réacteur, légère ailleurs.', reparation: [ML, ML, CT], effet: 'sans-pilote' },
  { de: [11], nom: 'Réaction en chaîne', texte: 'Deux nouveaux jets sur la table.', reparation: [], effet: 'chaine' },
  { de: [12], nom: 'Explosion du réacteur', texte: 'Destruction totale du vaisseau et de l’équipage.', reparation: [], effet: 'explosion' },
];

/** La Panique en combat spatial (p. 201) : D6 + Niveau de Stress. `stress` : ce qui change pour le paniqué. */
export const PANIQUE_SPATIALE = [
  { min: 1, max: 6, nom: 'Je tiens le coup', texte: 'Vous parvenez à maîtriser vos nerfs. Tout juste.', stress: 0 },
  { min: 7, max: 7, nom: 'Tressaillement nerveux', texte: 'Votre Niveau de Stress et celui des PJ amicaux à portée Courte augmentent de 1.', stress: 1 },
  { min: 8, max: 8, nom: 'Tremblement', texte: '−2 à tous vos tests de compétence jusqu’à la fin de la panique.', stress: 0 },
  { min: 9, max: 9, nom: 'Ordres ignorés', texte: 'Au Tour suivant, aucun ordre exécuté, aucune aide acceptée, aucune discussion. Stress +1.', stress: 1 },
  { min: 10, max: 10, nom: 'Logorrhée hystérique à la comm', texte: 'Plus aucune communication possible. Votre Stress −1, celui des PJ amicaux qui vous entendent +1.', stress: -1 },
  { min: 11, max: 12, nom: 'Paralysie', texte: 'Paralysé 1 Tour, vous perdez votre prochaine action. Stress +1, et celui des PJ amicaux du compartiment.', stress: 1, perdAction: true },
  { min: 13, max: 13, nom: 'Sauve qui peut !', texte: 'Vous quittez votre poste pour une zone plus sûre. Stress −1 ; les PJ amicaux témoins font un test de Panique.', stress: -1 },
  { min: 14, max: 14, nom: 'Abandon du vaisseau', texte: 'Vous fuyez vers la capsule de sauvetage la plus proche (ou le sas, en combinaison). Les PJ amicaux témoins font un test de Panique.', stress: 0 },
  { min: 15, max: 99, nom: 'Trop c’est trop !', texte: 'Vous surchargez votre poste : avarie majeure selon le poste, et vous perdez votre prochaine action.', stress: 0, perdAction: true, avarieDuPoste: true },
];
/** « Trop c'est trop ! » : l'avarie majeure du poste (p. 201). Le livre ne nomme pas celle du capitaine. */
export const AVARIE_DU_POSTE = { senseurs: 4, pilote: 7, artilleur: 6, ingenieur: 10 };
/** L'avarie d'un jet : D66 ou 2D6 lu dans sa table. */
export const avarieDeLaTable = (table, valeur) => table.find(a => valeur >= a.de[0] && valeur <= (a.de[1] ?? a.de[0]));
