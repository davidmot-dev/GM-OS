/*
  **Les dommages d'une attaque de Nephilim Légende** — registre § 267, T11 (23/11/2026), d'après le livre 0,
  *Quintessence* (pages imprimées ; PDF = imprimée + 1), le corpus n'étant pas relu.

  - Une arme de mêlée ou de jet inflige son degré de la table des armes, plus le bonus de dommages de
    l'attaquant (Ka-Feu : +1 à partir de 5, +2 à partir de 10, p. 103) ; ce bonus vaut aussi sans arme. Une
    arme à projectile inflige le degré de son type, de sa munition et de sa cadence (p. 132).
  - On retranche la protection des armures ; une arme de 2 degrés ou plus réduite à 0 ou moins inflige tout
    de même 1 degré (p. 136). Une réussite critique double les dommages (p. 132, 136) : le livre le dit du
    total après la protection (p. 134, 136) — le corpus, non relu, le disait avant ; le livre fait foi.
  - Les bonus de Rafale (+5) et de Rafale contrôlée (+2) ne s'ajoutent qu'après la protection, si le total
    reste positif ; chaque degré de marge au-delà de 10 peut ajouter un degré (p. 133). À bout portant, une
    arme à feu fait +6 (p. 131).
  - La Défense de la cible (p. 129) : réflexe −1 ; parer, bloquer ou défense élaborée réussis −2 ; esquiver
    réussi, aucun dommage ; un désarmement ou une contre-attaque ratés, +2.

  Ce fichier ne lance rien et n'écrit rien : il rend les degrés reçus et le calcul dit. La cible choisit
  ensuite comment les absorber (`optionsDEncaissement`, p. 136).
*/

export type FamilleDArme = 'mains-nues' | 'melee' | 'jet' | 'tir' | 'feu';

/** La table des armes courantes (p. 132). */
export const ARMES_DE_NEPHILIM: readonly { libelle: string; degre: number; famille: FamilleDArme }[] = [
    { libelle: 'Coups de pied / poing / tête', degre: 1, famille: 'mains-nues' },
    { libelle: 'Griffes (animal sauvage)', degre: 2, famille: 'mains-nues' },
    { libelle: 'Dague', degre: 1, famille: 'melee' },
    { libelle: 'Épée / machette / hache', degre: 2, famille: 'melee' },
    { libelle: 'Marteau de guerre', degre: 3, famille: 'melee' },
    { libelle: 'Hache de lancer', degre: 2, famille: 'jet' },
    { libelle: 'Javelot', degre: 2, famille: 'jet' },
    { libelle: 'Fronde', degre: 1, famille: 'jet' },
    { libelle: 'Arc de chasse', degre: 2, famille: 'tir' },
    { libelle: 'Arbalète', degre: 3, famille: 'tir' },
    { libelle: 'Arme de poing', degre: 2, famille: 'feu' },
    { libelle: 'Arme d’épaule / de hanche', degre: 4, famille: 'feu' },
];

/** Les munitions des armes à feu (p. 132). */
export const MUNITIONS_DE_NEPHILIM: readonly { libelle: string; bonus: number }[] = [
    { libelle: 'Ordinaires', bonus: 0 },
    { libelle: 'Balles blindées d’arme de poing', bonus: 2 },
    { libelle: 'Balles creuses / perforantes / explosives', bonus: 4 },
    { libelle: 'Cartouches de chasse, courte portée', bonus: 3 },
    { libelle: 'Cartouches de chasse, au-delà', bonus: 1 },
    { libelle: 'Balles blindées de fusil d’assaut', bonus: 4 },
];

/** Les cadences de tir (p. 132), ajoutées après la protection (p. 133). */
export const CADENCES_DE_NEPHILIM: readonly { libelle: string; bonus: number }[] = [
    { libelle: 'Coup par coup', bonus: 0 },
    { libelle: 'Rafale contrôlée', bonus: 2 },
    { libelle: 'Rafale', bonus: 5 },
];

/** La Défense de la cible et ce qu'elle change aux dommages reçus (p. 129). */
export type DefenseDeNephilim = 'aucune' | 'reflexe' | 'reduit-de-deux' | 'esquive' | 'ratee-plus-deux';
export const DEFENSES_DE_NEPHILIM: readonly { cle: DefenseDeNephilim; libelle: string }[] = [
    { cle: 'aucune', libelle: 'Aucune, ou ratée' },
    { cle: 'reflexe', libelle: 'Défense réflexe réussie (−1)' },
    { cle: 'reduit-de-deux', libelle: 'Parer, bloquer ou défense élaborée réussis (−2)' },
    { cle: 'esquive', libelle: 'Esquive réussie (aucun dommage)' },
    { cle: 'ratee-plus-deux', libelle: 'Désarmer ou contre-attaquer ratés (+2)' },
];

/** Le bonus de dommages du Ka-Feu (p. 103). */
export function bonusDeKaFeu(kaFeu: number): number {
    return kaFeu >= 10 ? 2 : kaFeu >= 5 ? 1 : 0;
}

export interface CoupDeNephilim {
    degre: number;
    famille: FamilleDArme;
    /** Le bonus de dommages de l'attaquant, compté pour une arme de mêlée, de jet ou sans arme. */
    bonusDeKaFeu?: number;
    munition?: number;
    cadence?: number;
    boutPortant?: boolean;
    /** Les degrés de marge au-delà de 10 que l'attaquant met aux dommages (p. 133). */
    marge?: number;
    critique?: boolean;
    protection?: number;
    defense?: DefenseDeNephilim;
}

const entier = (n: number | undefined) => (Number.isFinite(n) ? Math.max(0, Math.trunc(n!)) : 0);

/** Les degrés de dommages reçus, et le calcul dit dans l'ordre du livre. */
export function dommagesDeNephilim(c: CoupDeNephilim): { degres: number; calcul: string } {
    if (c.defense === 'esquive') return { degres: 0, calcul: 'esquive réussie : aucun dommage (p. 129)' };
    const parties: string[] = [`arme ${entier(c.degre)}`];
    let brut = entier(c.degre);
    const ajouter = (n: number, nom: string) => { if (n) { brut += n; parties.push(`${nom} ${n}`); } };
    const aDistance = c.famille === 'tir' || c.famille === 'feu';
    if (!aDistance) ajouter(entier(c.bonusDeKaFeu), 'Ka-Feu');
    if (c.famille === 'feu') ajouter(entier(c.munition), 'munition');
    if (c.famille === 'feu' && c.boutPortant) ajouter(6, 'bout portant');
    ajouter(entier(c.marge), 'marge');
    let calcul = parties.join(' + ');
    const protection = entier(c.protection);
    let nets = brut - protection;
    if (protection) calcul += ` − protection ${protection}`;
    if (nets <= 0 && entier(c.degre) >= 2) { nets = 1; calcul += ' : 1 degré malgré l’armure'; }
    nets = Math.max(0, nets);
    // Le livre double après la protection (p. 134 et 136 : « le total ainsi obtenu […] critique, doublés »).
    if (c.critique && nets > 0) { nets *= 2; calcul = `(${calcul}) × 2, critique`; }
    const cadence = c.famille === 'feu' ? entier(c.cadence) : 0;
    if (cadence && nets > 0) { nets += cadence; calcul += ` + cadence ${cadence}`; }
    const defense = c.defense === 'reflexe' ? -1 : c.defense === 'reduit-de-deux' ? -2 : c.defense === 'ratee-plus-deux' ? 2 : 0;
    if (defense) { nets = Math.max(0, nets + defense); calcul += ` ${defense > 0 ? '+' : '−'} défense ${Math.abs(defense)}`; }
    return { degres: nets, calcul: `${calcul} = ${nets} degré${nets > 1 ? 's' : ''}` };
}

/**
 * **L'attaque proposée à un adversaire de Nephilim** : un PNJ humain a souvent un seul degré de Menace, qui
 * remplace n'importe quel Vécu pour toutes ses actions de combat (p. 117). La fiche du pilote n'a pas de
 * champ Menace : un Vécu nommé « Menace » en tient lieu. Sinon, rien n'est proposé — le meneur choisit le
 * Vécu approprié (p. 126).
 */
export function attaqueDeNephilim(valeurs: Record<string, unknown>, composante = 'vecu'): Record<string, string> | null {
    const menace = (nom: unknown) => /\bmenace\b/i.test(String(nom ?? ''));
    if (menace(valeurs.simulacrum_experience)) return { [composante]: 'simulacrum_experience_degree' };
    for (let i = 0; i < 14; i++) if (menace(valeurs[`pastlives_${i}_name`])) return { [composante]: `pastlives_${i}_degree` };
    return null;
}
