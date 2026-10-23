/**
 * **Finir Symbaroum** — 23/10/2026, à la demande de David (« je voudrais qu'on
 * finisse Symbaroum », le livre de base sous la main). Lots S2 (dérivées et
 * agonie), S4 (Stigmates et coûts), S5 (attaque, défense, dégâts), S6
 * (départage de l'initiative), S7 (création et progression), S8 (règles
 * optionnelles) et S9 (monnaie et voyages) de l'audit de Codex du 20/10
 * (`documentation/Planning/2026-10-20-symbaroum-propositions.md`). Les pages
 * citées sont les pages **imprimées** du Livre de Base.
 *
 * Tout ici est pur : la fiche entre, des nombres et des phrases sortent. Le
 * panneau de jet et ses cartes écrivent, jamais ce module.
 */

/** Ce que GM-OS tient sur la fiche pour Symbaroum, à côté des champs du jeu. */
export const CLE_SYMBAROUM = '_gmos_symbaroum';

/**
 * **Les règles optionnelles du chapitre 19** (p. 183–184). Aucune ne s'active
 * seule : la table les choisit, la campagne les retient (`Campaign.reglesOptionnelles`).
 */
export type OptionDeSymbaroum =
    | 'mortSubite' | 'degatsCritiques' | 'attaquesParfaites' | 'limiterLesCritiques'
    | 'relanceExperience' | 'relanceCorruption';

export const OPTIONS_DE_SYMBAROUM: { id: OptionDeSymbaroum; label: string; texte: string }[] = [
    { id: 'mortSubite', label: 'Mort subite', texte: 'Tomber à 0 sous un coup qui atteint la Résistance à la douleur tue sur le coup (p. 183).' },
    { id: 'degatsCritiques', label: 'Modificateurs de dégâts critiques', texte: 'Des dégâts qui dépassent la Résistance à la douleur : deux dés, le pire, jusqu’à un point d’Endurance regagné (p. 183).' },
    { id: 'attaquesParfaites', label: 'Attaques parfaites et échecs critiques en Défense', texte: 'Sur un 1 ou un 20 à l’attaque ou en Défense (p. 184).' },
    { id: 'limiterLesCritiques', label: 'Limiter les critiques', texte: 'Le 1 ou le 20 se confirme par un second jet (p. 184).' },
    { id: 'relanceExperience', label: 'Refaire un jet contre de l’Expérience', texte: '1 point d’Expérience, perdu ; un seul nouveau jet par Action (p. 184).' },
    { id: 'relanceCorruption', label: 'Refaire un jet contre de la Corruption', texte: '1 point de Corruption permanente ; un seul nouveau jet par test (p. 184).' },
];

/**
 * **Ce que le pilote nomme pour Symbaroum** (`jet.symbaroum`). Les identifiants
 * des champs de la fiche ; chaque partie absente ne propose simplement rien.
 */
export interface RegleDeSymbaroum {
    /** Les huit Attributs primaires, pour la création (p. 77–79). */
    attributs?: string[];
    force?: string;
    volonte?: string;
    agilite?: string;
    /** L'Endurance courante et son maximum : `endurance_actuelle` et `endurance`. */
    endurance?: { courante: string; maximum: string };
    douleur?: string;
    /** La Défense, valeur secondaire jetée en réaction (p. 163–164). */
    defense?: string;
    seuilDeCorruption?: string;
    corruption?: { temporaire: string; permanente: string };
    armes?: { nom: string; degats: string; qualites?: string }[];
    armures?: { nom: string; protection: string; qualites?: string }[];
    /** L'Expérience gagnée en tout, et celle qui reste à dépenser (p. 166). */
    experience?: { total: string; disponible: string };
    talents?: { nom: string; niveau: string }[];
    /** Les thalers (un nombre) et la bourse écrite sur la fiche HTML (p. 190). */
    argent?: { champ: string; ecrit?: string };
    /** Les règles optionnelles que la table peut retenir. Absent : toutes. */
    options?: OptionDeSymbaroum[];
}

/** Ce que GM-OS retient sur la fiche (`CLE_SYMBAROUM`). */
export interface SuiviDeSymbaroum {
    version: 1;
    /** Les jours écoulés, pour les Stigmates temporaires (un jour, p. 179). */
    jour: number;
    /** Le personnage est mourant : ses Tests de mort (p. 164). */
    agonie?: { tests: number; echecs: number };
    mort?: boolean;
    /** Les Stigmates portés : temporaires jusqu'au jour indiqué, permanents tant que la Corruption permanente tient. */
    stigmates: { id: string; texte: string; permanent: boolean; jusquAu?: number }[];
    /** Option des dégâts critiques : grièvement touché jusqu'à un point regagné (p. 183). */
    grievementTouche?: boolean;
    /** Ce qui a déjà été reçu : un même geste ne s'écrit pas deux fois. */
    recus: string[];
}

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
type Valeurs = Record<string, unknown>;

export function lireSymbaroum(v: Valeurs): SuiviDeSymbaroum {
    const s = v[CLE_SYMBAROUM] as SuiviDeSymbaroum | undefined;
    return s?.version === 1 && Array.isArray(s.stigmates) && Array.isArray(s.recus)
        ? s : { version: 1, jour: 0, stigmates: [], recus: [] };
}
const copie = (v: Valeurs): SuiviDeSymbaroum => structuredClone(lireSymbaroum(v));

// ——— S2 · Les valeurs dérivées (p. 103, 164, 179) ———

export interface Derivees {
    /** Endurance maximale de base : la Force, jamais moins de 10 (p. 164). */
    enduranceMax: number;
    /** La moitié de la Force arrondie au-dessus, même sous 10 (p. 164). */
    douleur: number;
    /** La moitié de la Volonté arrondie au-dessus (Tableau 25, p. 179). */
    seuilDeCorruption: number;
    /** L'Agilité : l'armure et le bouclier la modifient ensuite (p. 163). */
    defenseDeBase: number;
}

export function valeursDerivees(regle: RegleDeSymbaroum, v: Valeurs): Derivees {
    const force = regle.force ? n(v[regle.force]) : 0;
    const volonte = regle.volonte ? n(v[regle.volonte]) : 0;
    return {
        enduranceMax: Math.max(10, force),
        douleur: Math.ceil(force / 2),
        seuilDeCorruption: Math.ceil(volonte / 2),
        defenseDeBase: regle.agilite ? n(v[regle.agilite]) : 0,
    };
}

/**
 * Les valeurs de la fiche qui s'écartent du calcul du livre. **Un écart n'est
 * pas une erreur** : un Talent (Robuste, Résistant) ou un Trait les déplace. On
 * les montre, le meneur adopte ou garde.
 */
export function ecartsDesDerivees(regle: RegleDeSymbaroum, v: Valeurs) {
    const d = valeursDerivees(regle, v);
    const lignes: { champ: string; label: string; fiche: number; calcul: number }[] = [];
    const voir = (champ: string | undefined, label: string, calcul: number) => {
        if (champ && n(v[champ]) !== calcul) lignes.push({ champ, label, fiche: n(v[champ]), calcul });
    };
    voir(regle.endurance?.maximum, 'Endurance maximale', d.enduranceMax);
    voir(regle.douleur, 'Résistance à la douleur', d.douleur);
    voir(regle.seuilDeCorruption, 'Seuil de Corruption', d.seuilDeCorruption);
    return lignes;
}

// ——— S5 · Les dés de dégâts et de protection (p. 164, 167, 178) ———

/** Une formule de dégâts lue : « 1D8+1D4+1 ». */
export interface FormuleDeDes { des: { nombre: number; faces: number }[]; constante: number; texte: string }

/**
 * Lit le début d'une case de la fiche — « 1D8 (Précise) », « 1d6+1d4 », « 4 ».
 * Ce qui suit la formule (qualités, remarques) est ignoré ; rien de lisible : `null`.
 */
export function lireLaFormule(texte: unknown): FormuleDeDes | null {
    const brut = String(texte ?? '').trim();
    const tete = /^[\s\d+dD−-]+/.exec(brut)?.[0].replace(/−/g, '-').replace(/\s+/g, '') ?? '';
    const propre = tete.replace(/[+-]+$/, '');
    if (!propre) return null;
    const des: FormuleDeDes['des'] = [];
    let constante = 0;
    for (const terme of propre.match(/[+-]?[^+-]+/g) ?? []) {
        const signe = terme.startsWith('-') ? -1 : 1;
        const corps = terme.replace(/^[+-]/, '');
        const m = /^(\d*)d(\d+)$/i.exec(corps);
        if (m) {
            if (signe < 0) return null;
            des.push({ nombre: Math.max(1, Number(m[1] || 1)), faces: Number(m[2]) });
        } else if (/^\d+$/.test(corps)) constante += signe * Number(corps);
        else return null;
    }
    if (!des.length && constante === 0) return null;
    return { des, constante, texte: propre.toUpperCase() };
}

/** Additionne deux formules : l'Avantage ajoute 1D4, l'Attaque parfaite 1D6. */
export function ajouterALaFormule(f: FormuleDeDes | null, ajout: string | undefined): FormuleDeDes | null {
    const a = ajout ? lireLaFormule(ajout) : null;
    if (!a) return f;
    if (!f) return a;
    return { des: [...f.des, ...a.des], constante: f.constante + a.constante, texte: `${f.texte}+${a.texte}` };
}

/** Lance la formule : le total, et le détail lisible des dés. */
export function lancerLaFormule(f: FormuleDeDes, de: (faces: number) => number) {
    const tirages = f.des.flatMap(d => Array.from({ length: d.nombre }, () => ({ faces: d.faces, val: de(d.faces) })));
    const total = Math.max(0, tirages.reduce((s, t) => s + t.val, 0) + f.constante);
    const detail = [...tirages.map(t => `${t.val} (D${t.faces})`), ...(f.constante ? [String(f.constante)] : [])].join(' + ');
    return { total, detail, tirages };
}

/**
 * **La valeur fixe d'un PNJ** : *« la valeur numérique fixe d'un dé est toujours
 * égale à la moitié de son résultat le plus haut »* (p. 178) — 1D8 vaut 4, pas
 * la moyenne 4,5. Le bloc de la créature, quand il donne un nombre, fait foi.
 */
export function valeurFixe(f: FormuleDeDes | null): number {
    if (!f) return 0;
    return Math.max(0, f.des.reduce((s, d) => s + d.nombre * Math.floor(d.faces / 2), 0) + f.constante);
}

/** Les dégâts qui passent l'armure : jamais négatifs (p. 167, « Dégâts effectifs »). */
export const degatsNets = (degats: number, protection: number) => Math.max(0, degats - protection);

/**
 * **La Résistance à la douleur** (p. 164) : un seul coup, armure soustraite,
 * égal ou supérieur. Plusieurs petits coups ne s'additionnent pas, et un coup
 * arrêté par l'armure ne fait pas mal.
 */
export const douleurAtteinte = (nets: number, resistance: number) => nets > 0 && resistance > 0 && nets >= resistance;

/**
 * **Les dégâts critiques optionnels** (p. 183) disent *« qui dépassent »* la
 * Résistance à la douleur — strictement. Ne pas fusionner avec la douleur ni
 * avec la Mort subite, qui disent « égal ou supérieur ».
 */
export const grievementTouche = (nets: number, resistance: number) => resistance > 0 && nets > resistance;

export type GenreDeDegats = 'physique' | 'acide' | 'poison' | 'alternatif';

export const GENRES_DE_DEGATS: { id: GenreDeDegats; label: string; texte: string }[] = [
    { id: 'physique', label: 'Physique', texte: 'L’armure se soustrait.' },
    { id: 'acide', label: 'Acide', texte: 'Chaque tour, l’armure se soustrait ; une Action de combat et un test d’Astuce l’enlèvent (p. 182).' },
    { id: 'poison', label: 'Poison qui agit', texte: 'Chaque tour, sans armure, jusqu’à la fin de son effet ou un antidote et un test d’Astuce (p. 182).' },
    { id: 'alternatif', label: 'Sur un Attribut', texte: 'Dégâts alternatifs : ils touchent l’Attribut nommé, pas l’Endurance.' },
];

/** L'armure compte-t-elle contre ce genre de dégâts ? Le poison qui agit déjà, non (p. 182). */
export const armureCompte = (genre: GenreDeDegats) => genre === 'physique' || genre === 'acide';

export type EtatDuPersonnage = 'debout' | 'mourant' | 'mort';

/**
 * **Encaisser, du côté du joueur** (p. 164, 183) : un PJ à zéro est mourant, pas
 * mort ; avec la Mort subite, un coup qui atteint la douleur le tue sur le coup.
 */
export function encaisser(endurance: number, nets: number, options: { mortSubite?: boolean; douleur?: number } = {}) {
    const apres = Math.max(0, endurance - nets);
    const douleur = douleurAtteinte(nets, options.douleur ?? 0);
    const etat: EtatDuPersonnage = apres > 0 ? 'debout' : options.mortSubite && douleur ? 'mort' : 'mourant';
    return { apres, douleur, etat };
}

// ——— S2 · L'agonie (p. 164) ———

/**
 * **Le Test de mort** (1D20, à chaque tour, à l'Initiative du mourant) : 1, il se
 * réveille avec 1D4 d'Endurance et agit au tour suivant ; 2–10, un pied dans la
 * tombe — **les tests continuent** ; 11–19, plus près de la mort, le troisième
 * tue ; 20, il meurt. Les soins (plantes, Medicus, pouvoir) arrêtent les tests.
 */
export function testDeMort(v: Valeurs, de: number, id: string, d4?: number) {
    const s = copie(v);
    if (s.recus.includes(id) || s.mort) return { valeurs: {}, texte: '', issue: 'deja' as const };
    const agonie = s.agonie ?? { tests: 0, echecs: 0 };
    agonie.tests += 1;
    s.recus.push(id);
    let issue: 'reveil' | 'tombe' | 'proche' | 'mort';
    let texte: string;
    let endurance: number | undefined;
    if (de === 1) {
        issue = 'reveil';
        endurance = Math.max(1, d4 ?? 1);
        texte = `1 : il se réveille avec ${endurance} d’Endurance et pourra agir au tour suivant.`;
        delete s.agonie;
    } else if (de === 20) {
        issue = 'mort';
        texte = '20 : il meurt — le temps de quelques ultimes mots, si le joueur le souhaite.';
        s.mort = true; delete s.agonie;
    } else if (de >= 11) {
        agonie.echecs += 1;
        if (agonie.echecs >= 3) {
            issue = 'mort'; texte = `${de} : troisième résultat de 11 à 19, il meurt.`;
            s.mort = true; delete s.agonie;
        } else {
            issue = 'proche'; texte = `${de} : encore un peu plus près de la mort (${agonie.echecs} sur 3).`;
            s.agonie = agonie;
        }
    } else {
        issue = 'tombe'; texte = `${de} : un pied dans la tombe ; le Test de mort continue au prochain tour.`;
        s.agonie = agonie;
    }
    return { valeurs: { [CLE_SYMBAROUM]: s }, texte, issue, endurance };
}

/** Le personnage tombe à zéro : son agonie commence (ou continue, sans remettre le compte à zéro). */
export function commencerLAgonie(v: Valeurs): Valeurs {
    const s = copie(v);
    if (s.mort || s.agonie) return {};
    s.agonie = { tests: 0, echecs: 0 };
    return { [CLE_SYMBAROUM]: s };
}

/** Des soins, ou un réveil : l'agonie s'arrête et, avec un point regagné, l'effet des dégâts critiques aussi. */
export function soigner(v: Valeurs, gagne: number): Valeurs {
    const s = copie(v);
    if (s.mort) return {};
    delete s.agonie;
    if (gagne > 0) delete s.grievementTouche;
    return { [CLE_SYMBAROUM]: s };
}

export function marquerGrievementTouche(v: Valeurs, oui: boolean): Valeurs {
    const s = copie(v);
    if (oui) s.grievementTouche = true; else delete s.grievementTouche;
    return { [CLE_SYMBAROUM]: s };
}

/** Rendre la vie à un personnage noté mort par erreur : le meneur seul. */
export function annulerLaMort(v: Valeurs): Valeurs {
    const s = copie(v);
    delete s.mort; delete s.agonie;
    return { [CLE_SYMBAROUM]: s };
}

/**
 * Les soins du livre (p. 165) : ce qu'ils rendent, et s'ils relèvent un mourant.
 * Le Medicus soigne selon son rang, un dé de plus avec un remède à base de
 * plantes, après un test d'Astuce réussi, une fois par patient et par jour (p. 123–124).
 */
export const SOINS: { id: string; label: string; gain: string; avecRemede?: string; premiersSoins: boolean }[] = [
    { id: 'jour', label: 'Un jour de repos', gain: '1', premiersSoins: false },
    { id: 'elixir', label: 'Élixir ou remède à base de plantes', gain: '1', premiersSoins: true },
    { id: 'medicus-novice', label: 'Medicus Novice', gain: '1d4', avecRemede: '1d6', premiersSoins: true },
    { id: 'medicus-adepte', label: 'Medicus Adepte', gain: '1d6', avecRemede: '1d8', premiersSoins: true },
    { id: 'medicus-maitre', label: 'Medicus Maître', gain: '1d8', avecRemede: '1d10', premiersSoins: true },
];

// ——— S4 · La Corruption, les Stigmates et l'Ombre (p. 179–180) ———

/** Les exemples de Stigmates du Tableau 24 (p. 179) — le joueur peut en inventer. */
export const STIGMATES = [
    'Une blessure purulente qui ne se referme pas',
    'Une peau décolorée, grêlée et couverte de rougeurs importantes',
    'Des abcès dans la bouche et sur la gorge qui se percent à des moments inappropriés',
    'Des crocs ou des ongles en forme de griffes ou de serres',
    'Une tache sur la peau qui pourrait ressembler à une rune sombre ou un symbole maléfique',
    'Des yeux qui brillent dans le noir',
    'Des yeux qui deviennent noirs sous l’effet de la colère, de la faim ou du désir',
    'Une légère odeur de pourriture suit la personne',
    'Une haleine qui sent le soufre',
    'Des veines qui gonflent et noircissent sous de fortes émotions',
    'Des traces sombres dans le sang',
    'Froid comme un cadavre ou brûlant de fièvre, sans maladie',
    'Parle une langue inconnue aux accents maléfiques dans son sommeil',
    'Marche en dormant, attiré par les artéfacts corrompus et les endroits maléfiques',
    'Dégradation de la vue, se fie à ses autres sens',
    'Goût pour les cadavres : une chose en décomposition par jour',
    'Goût pour la viande crue : de la viande fraîche tous les jours',
    'Soif de sang chaud, tous les jours',
];

export interface EtatDeLaCorruption {
    temporaire: number; permanente: number; total: number;
    seuil: number; volonte: number;
    /** Stigmate temporaire : le total atteint le seuil (p. 180). */
    marque: boolean;
    /** Stigmate permanent : la permanente seule atteint le seuil (p. 180). */
    marquePermanente: boolean;
    /** Le total atteint la Volonté (Tableau 25, p. 180). */
    abomination: boolean;
    /** L'Ombre de base vaut Volonté − Corruption ; la Corruption domine dès qu'elle l'égale (p. 180). */
    ombreDeBase: number;
    corruptionDomine: boolean;
}

export function etatDeLaCorruption(regle: RegleDeSymbaroum, v: Valeurs): EtatDeLaCorruption {
    const temporaire = regle.corruption ? n(v[regle.corruption.temporaire]) : 0;
    const permanente = regle.corruption ? n(v[regle.corruption.permanente]) : 0;
    const total = temporaire + permanente;
    const volonte = regle.volonte ? n(v[regle.volonte]) : 0;
    const seuil = valeursDerivees(regle, v).seuilDeCorruption;
    const ombreDeBase = volonte - total;
    return {
        temporaire, permanente, total, seuil, volonte,
        marque: seuil > 0 && total >= seuil,
        marquePermanente: seuil > 0 && permanente >= seuil,
        abomination: volonte > 0 && total >= volonte,
        ombreDeBase,
        corruptionDomine: total > 0 && total >= ombreDeBase,
    };
}

/**
 * **Ce qui corrompt** (p. 180), en gestes. Les traditions ont leurs exceptions :
 * le meneur ne clique que ce qui s'applique — rien n'est facturé à toute magie.
 */
export const SOURCES_DE_CORRUPTION: { id: string; label: string; temporaire?: string; permanente?: number }[] = [
    { id: 'pouvoir', label: 'Pouvoir ou rituel mystique', temporaire: '1d4' },
    { id: 'artefact', label: 'Artéfact corrompu', temporaire: '1d4' },
    { id: 'apprendre', label: 'Apprendre un pouvoir ou un rituel', permanente: 1 },
    { id: 'lier', label: 'Se lier à un artéfact', permanente: 1 },
];

export function noterUnStigmate(v: Valeurs, texte: string, permanent: boolean): Valeurs {
    const s = copie(v);
    const propre = texte.trim();
    if (!propre) return {};
    s.stigmates.push({ id: `${s.jour}-${s.stigmates.length}-${propre.slice(0, 12)}`, texte: propre, permanent, ...(permanent ? {} : { jusquAu: s.jour + 1 }) });
    return { [CLE_SYMBAROUM]: s };
}

export function retirerUnStigmate(v: Valeurs, id: string): Valeurs {
    const s = copie(v);
    s.stigmates = s.stigmates.filter(x => x.id !== id);
    return { [CLE_SYMBAROUM]: s };
}

/**
 * **Un jour passe** : les Stigmates temporaires guérissent après une journée
 * (p. 179). Les permanents restent tant que la Corruption permanente tient le seuil.
 */
export function unJourPasse(v: Valeurs): Valeurs {
    const s = copie(v);
    s.jour += 1;
    s.stigmates = s.stigmates.filter(x => x.permanent || (x.jusquAu ?? 0) > s.jour);
    return { [CLE_SYMBAROUM]: s };
}

// ——— S8 · Les critiques optionnels (p. 184) ———

export type NatureDuTest = 'test' | 'attaque' | 'defense';

/**
 * **Attaques parfaites et échecs critiques en Défense** — une règle optionnelle.
 * Rien sans elle, rien sur un simple test ; avec « Limiter », un second jet
 * confirme (le 1 doit réussir encore, le 20 échouer encore).
 */
export function critiqueDuJet(
    de: number, nature: NatureDuTest, options: Partial<Record<OptionDeSymbaroum, boolean>>,
    confirmation?: { de: number; seuil: number },
): { texte: string; degats?: string; aConfirmer?: boolean } | null {
    if (!options.attaquesParfaites || nature === 'test' || (de !== 1 && de !== 20)) return null;
    if (options.limiterLesCritiques) {
        if (!confirmation) return { texte: de === 1 ? 'Un 1 : à confirmer par un second jet qui réussit (p. 184).' : 'Un 20 : à confirmer par un second jet qui échoue (p. 184).', aConfirmer: true };
        const confirme = de === 1 ? confirmation.de <= confirmation.seuil : confirmation.de > confirmation.seuil;
        if (!confirme) return { texte: `Second jet ${confirmation.de} / ${confirmation.seuil} : le critique ne se confirme pas.` };
    }
    if (nature === 'attaque') {
        return de === 1
            ? { texte: 'Attaque parfaite : +1D6 aux dégâts.', degats: '1d6' }
            : { texte: 'Échec critique à l’attaque : l’ennemi obtient une Attaque gratuite.' };
    }
    return de === 1
        ? { texte: 'Défense parfaite : le personnage obtient une Attaque gratuite contre son attaquant.' }
        : { texte: 'Échec critique en Défense : l’ennemi inflige +3 dégâts.', degats: '3' };
}

/**
 * **Le d20 de Symbaroum n'a pas de critique de base.** Le moteur commun le
 * reconnaît comme une Sauvegarde et écrivait « réussite critique » sur chaque 1,
 * même pour crocheter une serrure (S8 de l'audit). On efface la mention et les
 * couleurs ; l'effet optionnel se dit à part, dans son contexte.
 */
export function sansCritiqueDeBase<R extends { totalDisplay?: string; rolls: { isCritMax?: boolean; isCritMin?: boolean }[] }>(res: R): R {
    return {
        ...res,
        totalDisplay: res.totalDisplay?.replace(/ — (réussite|échec) critique$/, ''),
        rolls: res.rolls.map(d => ({ ...d, isCritMax: false, isCritMin: false })),
    };
}

// ——— S7 · Création et progression (p. 77–79, 116, 166) ———

/**
 * **La création** : chaque Attribut de 5 à 15, un seul 15, la somme à 80. Ce ne
 * sont pas des plafonds de campagne — Attribut exceptionnel ajoute jusqu'à +3
 * (p. 116) : on contrôle, on n'écrit rien.
 */
export function controleDeCreation(regle: RegleDeSymbaroum, v: Valeurs) {
    const valeurs = (regle.attributs ?? []).map(id => ({ id, valeur: n(v[id]) }));
    const somme = valeurs.reduce((s, a) => s + a.valeur, 0);
    const hors = valeurs.filter(a => a.valeur < 5 || a.valeur > 15).map(a => a.id);
    const quinze = valeurs.filter(a => a.valeur === 15).length;
    const constats: string[] = [];
    if (somme !== 80) constats.push(`Somme des Attributs : ${somme} (80 à la création).`);
    if (hors.length) constats.push(`Hors de 5 à 15 : ${hors.join(', ')}.`);
    if (quinze > 1) constats.push(`${quinze} Attributs à 15 : un seul permis.`);
    return { somme, constats, conforme: constats.length === 0 };
}

export const RANGS = ['Novice', 'Adepte', 'Maître'] as const;
export type Rang = typeof RANGS[number];

/**
 * **Le prix du rang suivant** (p. 166) : 10 pour un nouveau Novice, 20 de plus
 * pour Adepte, 30 de plus pour Maître. Les rangs se gravissent un à un.
 */
export function rangSuivant(actuel: unknown): { rang: Rang; cout: number } | null {
    const i = RANGS.indexOf(String(actuel ?? '').trim() as Rang);
    if (i === RANGS.length - 1) return null;
    return { rang: RANGS[i + 1], cout: [10, 20, 30][i + 1] };
}

// ——— S9 · La monnaie (p. 190) ———

/** 1 thaler = 10 shillings = 100 ortegs. Le champ de la fiche compte des thalers, centièmes compris. */
export function decomposer(thalers: number) {
    const ortegs = Math.round(Math.max(0, thalers) * 100);
    return { thalers: Math.floor(ortegs / 100), shillings: Math.floor((ortegs % 100) / 10), ortegs: ortegs % 10, totalEnOrtegs: ortegs };
}

export function ecrireLaBourse(thalers: number): string {
    const d = decomposer(thalers);
    const parts = [
        d.thalers ? `${d.thalers} thaler${d.thalers > 1 ? 's' : ''}` : '',
        d.shillings ? `${d.shillings} shilling${d.shillings > 1 ? 's' : ''}` : '',
        d.ortegs ? `${d.ortegs} orteg${d.ortegs > 1 ? 's' : ''}` : '',
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '0 thaler';
}

/** Ajoute (ou retire, en négatif) une somme ; jamais sous zéro : on ne paie pas ce qu'on n'a pas. */
export function mouvementDeBourse(thalers: number, montant: { thalers?: number; shillings?: number; ortegs?: number }) {
    const delta = (montant.thalers ?? 0) * 100 + (montant.shillings ?? 0) * 10 + (montant.ortegs ?? 0);
    const avant = decomposer(thalers).totalEnOrtegs;
    const apres = avant + delta;
    return apres < 0 ? null : apres / 100;
}

// ——— S9 · Les voyages (Tableau 26, p. 190) ———

export type Terrain = 'ambria' | 'davokarClair' | 'davokarSombre';
export type Allure = 'normale' | 'forcee' | 'ereintante';
export const TERRAINS: Record<Terrain, string> = { ambria: 'Prairie d’Ambria', davokarClair: 'Davokar clair', davokarSombre: 'Davokar sombre' };
export const ALLURES: Record<Allure, string> = { normale: 'Normale', forcee: 'Forcée', ereintante: 'Éreintante' };

/** Les kilomètres par jour, transcrits du Tableau 26. */
const KILOMETRES: Record<'marche' | 'cheval', Record<Allure, Record<Terrain, number>>> = {
    marche: {
        normale: { ambria: 20, davokarClair: 20, davokarSombre: 10 },
        forcee: { ambria: 40, davokarClair: 30, davokarSombre: 15 },
        ereintante: { ambria: 60, davokarClair: 40, davokarSombre: 20 },
    },
    cheval: {
        normale: { ambria: 40, davokarClair: 30, davokarSombre: 10 },
        forcee: { ambria: 60, davokarClair: 45, davokarSombre: 15 },
        ereintante: { ambria: 70, davokarClair: 50, davokarSombre: 20 },
    },
};

export const kilometresParJour = (moyen: 'marche' | 'cheval', allure: Allure, terrain: Terrain) => KILOMETRES[moyen][allure][terrain];

/** Combien de jours pour une distance, au rythme choisi. */
export const joursPourLaDistance = (km: number, moyen: 'marche' | 'cheval', allure: Allure, terrain: Terrain) =>
    Math.max(1, Math.ceil(Math.max(0, km) / kilometresParJour(moyen, allure, terrain)));

/**
 * **Un jour de voyage pour un personnage** : à allure normale, la guérison
 * naturelle (1 point) ; forcée, aucune ; éreintante, −1 Endurance et un test de
 * Force — raté, 1D6 de plus ; un 20, l'accident mortel (Tableau 26).
 */
export function jourDeVoyage(allure: Allure, force: number, des: { d20: number; d6: number }) {
    if (allure === 'normale') return { perte: 0, guerison: 1, texte: 'Guérison naturelle : +1 Endurance.' };
    if (allure === 'forcee') return { perte: 0, guerison: 0, texte: 'Allure forcée : pas de guérison naturelle.' };
    if (des.d20 === 20) return { perte: 1, guerison: 0, accident: true, texte: 'Allure éreintante, 20 au test de Force : blessé mortellement dans un accident.' };
    const reussi = des.d20 <= force;
    return reussi
        ? { perte: 1, guerison: 0, texte: `Allure éreintante : −1 Endurance ; Force ${des.d20} / ${force}, réussi.` }
        : { perte: 1 + des.d6, guerison: 0, texte: `Allure éreintante : −1 Endurance ; Force ${des.d20} / ${force}, raté : −${des.d6} de plus.` };
}

// ——— S6 · Le tour de combat (p. 161–167) ———

/** Le rappel du Tableau 22, dit au meneur et au joueur : la règle qu'on ne calcule pas. */
export const RAPPELS_DU_TOUR = [
    'Une Action de combat et une Action de mouvement ; le combat peut devenir un second mouvement, jamais l’inverse (p. 162).',
    'Réactions et Actions gratuites sans limite : se défendre autant de fois qu’on est attaqué (p. 162–164).',
    'Arme Longue : une Attaque gratuite au premier tour contre qui n’en a pas (p. 161).',
    'Se désengager : une Action de mouvement, et chaque ennemi au contact obtient une Attaque gratuite (p. 165).',
    'Se relever : test d’Agilité, un mouvement si réussi, tout le tour sinon (p. 165).',
    'Élixir sur soi : un mouvement ; sur autrui : une Action de combat (p. 165).',
    'Encerclé, à terre (mêlée seulement), surpris, en contrebas : l’Avantage, +2 et +1D4 aux dégâts (p. 166).',
    'Aveuglé seul : deux dés, le pire ; l’ennemi seul : deux dés, le meilleur ; les deux : rien (p. 165).',
];
