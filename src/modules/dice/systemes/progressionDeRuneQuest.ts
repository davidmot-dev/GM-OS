import type { NiveauDeRuneQuest } from './runequest';

/**
 * **L'inspiration et l'expérience de RuneQuest** — RQ-A6, 03/11/2026, à la demande de
 * David (« on va faire RQ-A5 et RQ-A6 »). Ses choix du même jour : l'inspiration tient
 * **toute la situation** (et non le seul jet suivant, comme l'augmentation), ses suites
 * se **proposent** à la meneuse ; l'expérience se coche nommément, puis la fin de saison
 * se lance avec un **« Confirmer »** par gain.
 *
 * Pages imprimées du livre de base (PDF − 1), relues en image :
 *
 * - **inspiration par une Rune** (p. 228-229) : réussite critique +50 %, spéciale +30 %,
 *   réussite +20 % à l'aptitude choisie, et la Rune gagne un test d'expérience ; **échec** :
 *   −20 % à tous les tests suivants faisant appel à cette Rune, jusqu'à une journée entière
 *   de méditation ; **échec critique** : −1D10 % à la Rune (l'opposée monte d'autant) et le
 *   tourment, dont la durée se lit sur 1D10. Une Rune qui a inspiré ne sert plus de la session ;
 * - **inspiration par une Passion** (p. 236) : mêmes bonus et test d'expérience ; **échec** :
 *   −10 % à **tous** les tests tant que dure la situation ; **échec critique** : −1D10 % à
 *   la Passion et le désespoir. Une Passion tombée à 0 est rayée de la feuille ;
 * - les deux (p. 229, 236) : une seule tentative par situation, même par une autre Rune ou
 *   Passion ; le bonus ne se cumule pas avec une augmentation par une compétence (p. 144) ;
 * - **test d'expérience** (p. 415) : à la fin de la saison, 1D100 + le modificateur de
 *   catégorie (aucun pour une Rune ou une Passion) ; supérieur au score, ou 100 et plus,
 *   il réussit : +1D6 %, ou +3 % annoncé avant le lancer. Une Rune opposée baisse d'autant,
 *   et aucune Rune d'une paire ne tombe à 0 : 99 % au plus. Puis les coches s'effacent ;
 * - la Réputation ne progresse pas par l'expérience (p. 237).
 *
 * L'état vit dans la fiche sous une clé propre à GM-OS, comme la progression d'Alien.
 */

export const CLE_ETAT_RUNEQUEST = '_gmos_runequest';

/** Ce que le pilote nomme pour la progression (`jet.runequest.progression`, pilote 2.3.0). */
export interface RegleDeLaProgression {
    /** Les champs des Runes, qui inspirent et progressent sans modificateur. */
    runes: string[];
    /** Les paires de Runes opposées, qui totalisent 100 (p. 45-49). */
    opposees: [string, string][];
    /** Les champs des Passions (Honneur compris). */
    passions: string[];
    /** Le modificateur de catégorie de chaque section de compétences (`competences_agilite` → `mod_agilite`). */
    categories: Record<string, string>;
}

export interface InspirationEnCours {
    source: string;
    sourceLibelle: string;
    genre: 'rune' | 'passion';
    niveau: NiveauDeRuneQuest;
    aptitude: string;
    aptitudeLibelle: string;
    bonus: number;
}

export interface EtatDeRuneQuest {
    version: 1;
    /** Une tentative a eu lieu dans la situation en cours : il n'y en aura pas d'autre. */
    situationTentee?: boolean;
    inspiration?: InspirationEnCours;
    /** L'échec par une Passion : −10 % à tous les tests de la situation. */
    malusDeSituation?: { source: string; sourceLibelle: string; valeur: number };
    /** L'échec par une Rune : −20 % aux tests de cette Rune, jusqu'à une journée de méditation. */
    malusDesRunes: Record<string, { sourceLibelle: string; valeur: number }>;
    /** Les Runes qui ont inspiré cette session. */
    runesInspirees: string[];
    /** Les tests d'expérience cochés, par champ. */
    coches: string[];
}

const ETAT_VIDE: EtatDeRuneQuest = { version: 1, malusDesRunes: {}, runesInspirees: [], coches: [] };

export function lireLEtat(valeurs: Record<string, unknown>): EtatDeRuneQuest {
    const e = valeurs[CLE_ETAT_RUNEQUEST] as Partial<EtatDeRuneQuest> | undefined;
    if (!e || e.version !== 1) return { ...ETAT_VIDE };
    return { ...ETAT_VIDE, ...e, malusDesRunes: { ...e.malusDesRunes }, runesInspirees: [...(e.runesInspirees ?? [])], coches: [...(e.coches ?? [])] };
}

export const ecrireLEtat = (etat: EtatDeRuneQuest): Record<string, unknown> => ({ [CLE_ETAT_RUNEQUEST]: etat });

const nombre = (v: unknown) => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

/** Le bonus d'une inspiration réussie (p. 229, 236). */
export const BONUS_D_INSPIRATION: Partial<Record<NiveauDeRuneQuest, number>> = { 'reussite-critique': 50, 'reussite-speciale': 30, reussite: 20 };

export const genreDeLaSource = (regle: RegleDeLaProgression, champ: string): 'rune' | 'passion' | undefined =>
    regle.runes.includes(champ) ? 'rune' : regle.passions.includes(champ) ? 'passion' : undefined;

export const runeOpposee = (regle: RegleDeLaProgression, champ: string): string | undefined => {
    const paire = regle.opposees.find(p => p.includes(champ));
    return paire ? paire.find(c => c !== champ) : undefined;
};

/** Pourquoi on ne peut pas chercher l'inspiration maintenant ; rien si on le peut. */
export function inspirationImpossible(etat: EtatDeRuneQuest, source: string, genre: 'rune' | 'passion'): string | undefined {
    if (etat.situationTentee) return 'Une seule tentative d’inspiration par situation, même par une autre Rune ou Passion (p. 229, 236). « Fin de la situation » la rouvre.';
    if (genre === 'rune' && etat.runesInspirees.includes(source)) return 'Cette Rune a déjà inspiré cette session : on ne peut plus faire appel à elle avant la suivante (p. 229).';
    return undefined;
}

export interface IssueDeLInspiration {
    etat: EtatDeRuneQuest;
    ligne: string;
    /** Un échec critique : la perte de 1D10 % et le trouble restent à lancer, par la meneuse. */
    echecCritique?: boolean;
}

/**
 * L'issue d'un test d'inspiration. Une réussite pose le bonus et coche l'expérience de la
 * source ; un échec pose le malus du livre ; un échec critique compte comme une tentative,
 * et ses suites — perte et trouble — se proposent à part (`perteDInspiration`).
 */
export function inspirer(
    etat: EtatDeRuneQuest, source: { champ: string; libelle: string; genre: 'rune' | 'passion' },
    niveau: NiveauDeRuneQuest, aptitude: { champ: string; libelle: string },
): IssueDeLInspiration {
    const suivant: EtatDeRuneQuest = { ...etat, situationTentee: true, malusDesRunes: { ...etat.malusDesRunes }, runesInspirees: [...etat.runesInspirees], coches: [...etat.coches] };
    const page = source.genre === 'rune' ? 'p. 229' : 'p. 236';
    const bonus = BONUS_D_INSPIRATION[niveau];
    if (bonus) {
        suivant.inspiration = { source: source.champ, sourceLibelle: source.libelle, genre: source.genre, niveau, aptitude: aptitude.champ, aptitudeLibelle: aptitude.libelle, bonus };
        if (source.genre === 'rune' && !suivant.runesInspirees.includes(source.champ)) suivant.runesInspirees.push(source.champ);
        if (!suivant.coches.includes(source.champ)) suivant.coches.push(source.champ);
        return { etat: suivant, ligne: `Inspiration (${source.libelle}) : +${bonus} % à ${aptitude.libelle} jusqu’à la fin de la situation ; test d’expérience coché (${page}).` };
    }
    if (niveau === 'echec') {
        if (source.genre === 'passion') {
            suivant.malusDeSituation = { source: source.champ, sourceLibelle: source.libelle, valeur: -10 };
            return { etat: suivant, ligne: `Inspiration ratée (${source.libelle}) : découragé, −10 % à tous les tests tant que dure la situation (p. 236).` };
        }
        suivant.malusDesRunes[source.champ] = { sourceLibelle: source.libelle, valeur: -20 };
        return { etat: suivant, ligne: `Inspiration ratée (${source.libelle}) : −20 % à tous les tests faisant appel à cette Rune, jusqu’à une journée entière de méditation (p. 229).` };
    }
    return {
        etat: suivant, echecCritique: true,
        ligne: `Inspiration : échec critique (${source.libelle}) — perte de 1D10 % et ${source.genre === 'rune' ? 'tourment' : 'désespoir'} à lancer (${page}).`,
    };
}

/** La durée du tourment ou du désespoir, sur 1D10 (p. 229, 236). */
export function dureeDuTrouble(d10: number): string {
    if (d10 <= 3) return '1D10 rounds';
    if (d10 <= 7) return '4D10+10 rounds';
    if (d10 <= 9) return 'jusqu’à l’aube, au crépuscule ou une période semblable';
    return '1D3 jours de temps de jeu';
}

/**
 * La perte d'un échec critique : −1D10 % à la source, sans descendre sous 0 ; une Rune
 * opposée monte d'autant (p. 229). Une Passion à 0 se raye (p. 236).
 */
export function perteDInspiration(
    regle: RegleDeLaProgression, valeurs: Record<string, unknown>, source: { champ: string; libelle: string; genre: 'rune' | 'passion' }, d10: number, d10Trouble: number,
): { maj: Record<string, unknown>; avant: Record<string, unknown>; ligne: string } {
    const score = nombre(valeurs[source.champ]);
    const apres = Math.max(0, score - d10);
    const perte = score - apres;
    const maj: Record<string, unknown> = { [source.champ]: apres };
    const avant: Record<string, unknown> = { [source.champ]: valeurs[source.champ] };
    let suite = '';
    const opposee = source.genre === 'rune' ? runeOpposee(regle, source.champ) : undefined;
    if (opposee && perte > 0) {
        const o = nombre(valeurs[opposee]);
        maj[opposee] = Math.min(100, o + perte);
        avant[opposee] = valeurs[opposee];
        suite = ` ; la Rune opposée passe à ${maj[opposee]} %`;
    }
    if (source.genre === 'passion' && apres === 0) suite = ' ; tombée à 0, la Passion se raye de la feuille et ne revient pas (p. 236)';
    const trouble = source.genre === 'rune' ? 'Tourment' : 'Désespoir';
    const effet = source.genre === 'rune' ? 'ni la Rune ni sa magie runique' : 'rien d’autre que fuir ou se cacher';
    return { maj, avant, ligne: `${source.libelle} : −${perte} % (1D10 = ${d10}) → ${apres} %${suite}. ${trouble} (1D10 = ${d10Trouble}) : ${dureeDuTrouble(d10Trouble)}, ${effet}.` };
}

/** « Fin de la situation » : l'inspiration et le découragement d'une Passion prennent fin. */
export function finDeLaSituation(etat: EtatDeRuneQuest): EtatDeRuneQuest {
    const { inspiration: _i, malusDeSituation: _m, situationTentee: _s, ...reste } = etat;
    return { ...reste, malusDesRunes: { ...etat.malusDesRunes }, runesInspirees: [...etat.runesInspirees], coches: [...etat.coches] };
}

/** Une journée entière de méditation lève le malus d'une Rune (p. 229). */
export function journeeDeMeditation(etat: EtatDeRuneQuest, rune: string): EtatDeRuneQuest {
    const malusDesRunes = { ...etat.malusDesRunes };
    delete malusDesRunes[rune];
    return { ...etat, malusDesRunes };
}

/** Une nouvelle session : les Runes peuvent de nouveau inspirer (p. 229). */
export const nouvelleSession = (etat: EtatDeRuneQuest): EtatDeRuneQuest => ({ ...etat, runesInspirees: [] });

/** Ce que l'état ajoute ou retire au jet d'une aptitude. */
export interface AjustementDuJet { valeur: number; libelle: string; inspiration?: boolean }

export function ajustementsDuJet(etat: EtatDeRuneQuest, champ: string): AjustementDuJet[] {
    const liste: AjustementDuJet[] = [];
    if (etat.inspiration && etat.inspiration.aptitude === champ) {
        liste.push({ valeur: etat.inspiration.bonus, libelle: `inspiration (${etat.inspiration.sourceLibelle})`, inspiration: true });
    }
    if (etat.malusDeSituation) liste.push({ valeur: etat.malusDeSituation.valeur, libelle: `découragé (${etat.malusDeSituation.sourceLibelle})` });
    const rune = etat.malusDesRunes[champ];
    if (rune) liste.push({ valeur: rune.valeur, libelle: `inspiration ratée (${rune.sourceLibelle})` });
    return liste;
}

// ---- L'expérience -------------------------------------------------------------

export const cocher = (etat: EtatDeRuneQuest, champ: string): EtatDeRuneQuest =>
    etat.coches.includes(champ) ? etat : { ...etat, coches: [...etat.coches, champ] };
export const decocher = (etat: EtatDeRuneQuest, champ: string): EtatDeRuneQuest => ({ ...etat, coches: etat.coches.filter(c => c !== champ) });
export const effacerLesCoches = (etat: EtatDeRuneQuest): EtatDeRuneQuest => ({ ...etat, coches: [] });

/** Le modificateur de catégorie d'un champ ; aucun pour une Rune ou une Passion (p. 415). */
export function modificateurDExperience(
    regle: RegleDeLaProgression, valeurs: Record<string, unknown>, champ: string, sectionDuChamp: string | undefined,
): { valeur: number; champ?: string } {
    if (genreDeLaSource(regle, champ)) return { valeur: 0 };
    const mod = sectionDuChamp ? regle.categories[sectionDuChamp] : undefined;
    return mod ? { valeur: nombre(valeurs[mod]), champ: mod } : { valeur: 0 };
}

export interface TestDExperience {
    champ: string;
    d100: number;
    modificateur: number;
    total: number;
    score: number;
    reussi: boolean;
    /** Le gain retenu : le D6 lancé ou 3, annoncé avant (p. 415). */
    gain: number;
}

/** Le test : 1D100 + modificateur supérieur au score, ou 100 et plus, réussit (p. 415). */
export function testDExperience(champ: string, score: number, modificateur: number, d100: number, choix: '1d6' | '3', d6: number): TestDExperience {
    const total = d100 + modificateur;
    const ok = total > score || total >= 100;
    return { champ, d100, modificateur, total, score, reussi: ok, gain: ok ? (choix === '3' ? 3 : d6) : 0 };
}

/**
 * Ce qu'écrit un gain confirmé. Une Rune d'une paire plafonne à 99 % et son opposée
 * baisse d'autant, sans passer sous 1 % (p. 415).
 */
export function appliquerLExperience(regle: RegleDeLaProgression, valeurs: Record<string, unknown>, test: TestDExperience): { maj: Record<string, unknown>; ligne: string } {
    const score = nombre(valeurs[test.champ]);
    const opposee = runeOpposee(regle, test.champ);
    const apres = opposee ? Math.min(99, score + test.gain) : score + test.gain;
    const gagne = apres - score;
    const maj: Record<string, unknown> = { [test.champ]: apres };
    let suite = '';
    if (opposee) {
        const o = Math.max(1, nombre(valeurs[opposee]) - gagne);
        maj[opposee] = o;
        suite = ` (opposée : ${o} %)`;
    }
    return { maj, ligne: `+${gagne} % → ${apres} %${suite}` };
}
