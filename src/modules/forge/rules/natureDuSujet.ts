/**
 * **De quoi parle un sujet : d'équipement, de créatures, ou d'autre chose** — étape F2 du plan
 * `documentation/Planning/2026-11-06-forge-tableaux-equipement-bestiaire.md` (06/11/2026).
 *
 * Deux lecteurs s'en servent : la Forge, qui donne à ces sujets un gabarit de tableaux, et
 * « Remplir depuis le corpus », qui nomme une fiche qui en parle sans tableau lisible. Une seule
 * règle pour les deux : un sujet forgé en tableaux est un sujet que l'écran attend en tableaux.
 *
 * **Par mots entiers** : « Charmes » ne contient pas d'arme, ni « Alarme ».
 */
export type NatureDuSujet = 'equipement' | 'creatures';

const plier = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();

const EQUIPEMENT = /\b(equipements?|armes?|armures?|protections?|materiels?|objets?|vehicules?|biens)\b/;
const CREATURES = /\b(bestiaires?|creatures?|adversaires?|monstres?|pnj|antagonistes?)\b/;
/*
  Les noms d'espèces qui titrent un bestiaire de supplément sans dire « créatures » — 09/11/2026,
  David : « lorsque j'essaie de forger le bestiaire du supplément alien ». « Protomorphes »,
  « Abominations de la Frontière », « Variantes de Xénomorphes XX121 » (Building Better Worlds)
  partaient en fiche de règle, sans tableau de profil. Mais « Les règles d'affrontement des
  Xénomorphes » est une règle : un titre qui parle de règle ou d'affrontement n'est pas un bestiaire.
*/
const ESPECES = /\b(xenomorphes?|protomorphes?|neomorphes?|abominations?|especes?)\b/;
const REGLE = /\b(regles?|affrontements?|asymetrie)\b/;

const parleDEspeces = (t: string) => CREATURES.test(t) || (ESPECES.test(t) && !REGLE.test(t));

/** La nature d'un texte (un sujet, un nom de fichier) ; les créatures l'emportent sur l'équipement. */
export function natureDuSujet(texte: string): NatureDuSujet | null {
    const t = plier(texte);
    if (parleDEspeces(t)) return 'creatures';
    if (EQUIPEMENT.test(t)) return 'equipement';
    return null;
}

/** Ce dont parle une fiche : son nom de fichier et son `sujet:`, lus ensemble. */
const sujetDeLaFiche = (chemin: string, contenu: string) =>
    `${chemin.split('/').pop() ?? ''} ${/^sujet:\s*(.*)$/m.exec(contenu)?.[1] ?? ''}`;

/** Une fiche qui parle d'équipement (armes, armures, matériel, véhicules, biens). */
export const parleDEquipement = (chemin: string, contenu: string) =>
    EQUIPEMENT.test(plier(sujetDeLaFiche(chemin, contenu)));

/** Une fiche qui parle de créatures (bestiaire, adversaires, monstres, PNJ). */
export const parleDeCreatures = (chemin: string, contenu: string) =>
    parleDEspeces(plier(sujetDeLaFiche(chemin, contenu)));
