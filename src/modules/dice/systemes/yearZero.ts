import type { DieResult, RollResult } from '../DiceEngine';
import { degreDepuisLeBooleen } from '../degresDeReussite';
import { facesDuNiveau } from '../desEchelonnes';

/**
 * **Forcer le jet, et le test de Panique** — la famille Year Zero, 2026-10-14.
 *
 * David : *« la partie gestion du stress et du forçage des jets »*, pour Alien et
 * Blade Runner. Les deux jeux forcent, et pas de la même façon :
 *
 * - **Alien** (`docs/systems/alien/rules/forcer-le-test.md`) : une fois par test ;
 *   le Niveau de Stress monte d'un point **avant** la relance, et le nouveau dé
 *   de Stress entre dans la relance ; on garde les six, on relance tout le reste.
 *   Un 1 sur un dé de Stress au premier lancer **interdit** de forcer et
 *   déclenche la Panique (1D6 + Niveau de Stress). Les androïdes ne forcent pas.
 * - **Blade Runner** (`docs/systems/blade-runner/rules/mecanique-forcer-un-jet.md`) :
 *   l'humain force une fois, le réplicant deux ; les dés sur 1 ne se relancent
 *   pas ; après le forçage, **chaque 1, jet initial compris**, coûte un point de
 *   Santé (Vigueur, Agilité) ou de Sang-froid (Intelligence, Empathie) — toujours
 *   de Sang-froid pour un réplicant.
 *
 * ⚠️ Les deux fiches du corpus sont marquées `relu: false`. Celle de Blade Runner
 * dit à la fois « relance tous ses dés, sauf les crânes » et « les autres dés de
 * son choix » : on suit la convention Year Zero — les réussites et les 1 restent,
 * le reste se relance —, à confirmer contre le livre.
 *
 * Le pilote **décrit** la règle (`DescripteurDeJet.forcer`) ; ce fichier
 * l'applique. Fonctions pures : le dé est passé en paramètre, rien n'est écrit.
 */

/**
 * Une condition lue sur la fiche ou sur le jet — « le personnage est un
 * réplicant », « l'attribut retenu est l'Empathie ».
 *
 * Les deux moitiés se cumulent quand elles sont données toutes deux ; une
 * condition vide n'est jamais remplie.
 */
export interface ConditionDeFiche {
    /** Un champ de la fiche… `nature`. */
    champ?: string;
    /** …dont la valeur contient l'un de ces mots, sans casse ni accents. `['réplicant']`. */
    contient?: string[];
    /** …ou qui est une case cochée (`true`) ou décochée (`false`) — l'androïde d'Alien. */
    coche?: boolean;
    /** Une composante du jet… `attribut`. */
    composante?: string;
    /** …retenue sur l'un de ces champs. `['intelligence', 'empathie']`. */
    parmi?: string[];
}

/** La règle du forçage, telle que le pilote la déclare. */
export interface RegleDuForcage {
    /** Combien de fois un même jet se force. 1 si absent. */
    fois?: number;
    /** Ce qui change ce nombre — le réplicant force deux fois. La première qui s'applique l'emporte. */
    foisSi?: { si: ConditionDeFiche; fois: number }[];
    /**
     * Les dés qui restent sur la table : les réussites seulement (Alien), ou les
     * réussites **et les 1** (Blade Runner, « face un interdite de relance »).
     */
    garde: 'reussites' | 'reussites-et-uns';
    /** Un 1 sur un dé de la seconde réserve interdit de forcer — la Panique d'Alien. */
    bloqueParLaSeconde?: boolean;
    /** Ceux qui ne forcent jamais — les androïdes d'Alien. La raison se dit sous le bouton. */
    interdit?: { si: ConditionDeFiche; raison: string }[];
    /**
     * La seconde réserve monte d'autant **avant** la relance : son champ sur la
     * fiche (le Niveau de Stress) et autant de dés de plus dans la relance. Alien : 1.
     */
    monteeDeLaSeconde?: number;
    /**
     * Chaque 1 du jet forcé, **jet initial compris**, coûte un point sur ce
     * champ — Blade Runner. `si` choisit un autre champ : le Sang-froid pour un
     * jet mental ou un réplicant.
     */
    prixDesUns?: {
        champ: string;
        label?: string;
        si?: { si: ConditionDeFiche; champ: string; label?: string }[];
    };
    /**
     * **Relancer un dé qui n'a fait qu'une réussite** — Blade Runner, 2026-10-16
     * (« Forcer un jet », p. 55) : *« vous pouvez relancer des D10 ou des D12 qui
     * montrent un seul œil dans l'espoir d'obtenir davantage d'yeux, mais il s'agit
     * d'une manœuvre risquée. Vous devez appliquer le nouveau résultat. »* Le
     * joueur désigne ces dés avant de forcer.
     */
    relancerUneReussite?: boolean;
}

/**
 * Ce dé peut-il être relancé malgré sa réussite ? Un D10 ou un D12 qui n'en
 * montre qu'une (6 à 9) : relancé, il peut viser deux réussites — ou les perdre.
 */
export function relancableMalgreSaReussite(d: DieResult): boolean {
    return !d.isDropped && (d.sides ?? 0) >= 10 && reussitesDuDe(valeurDuDe(d)) === 1;
}

/**
 * Les deux variantes de la famille, qui ne marquent pas leurs dés de la même
 * façon : la réserve de d6 (Alien) ne compte les 1 que sur la seconde poule ;
 * les dés échelonnés (Blade Runner) les relèvent sur tous les dés.
 */
export type FamilleYearZero = 'reserve' | 'echelonnee';

/** Une case cochée, quelle que soit la forme sous laquelle la fiche l'a gardée. */
const estCochee = (valeur: unknown): boolean =>
    valeur === true || valeur === 1 || ['true', '1', 'on', 'oui'].includes(String(valeur).toLowerCase());

const sansAccents = (texte: unknown): string =>
    String(texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** La condition est-elle remplie, par cette fiche et ces choix ? */
export function conditionRemplie(
    si: ConditionDeFiche,
    valeurs: Record<string, unknown>,
    choix: Record<string, string>,
): boolean {
    if (!si.champ && !si.composante) return false;
    if (si.champ && si.coche !== undefined) {
        if (estCochee(valeurs[si.champ]) !== si.coche) return false;
    } else if (si.champ) {
        const lu = sansAccents(valeurs[si.champ]);
        if (!lu || !(si.contient ?? []).some(mot => lu.includes(sansAccents(mot)))) return false;
    }
    if (si.composante) {
        const retenu = sansAccents(choix[si.composante]);
        if (!retenu || !(si.parmi ?? []).some(champ => sansAccents(champ) === retenu)) return false;
    }
    return true;
}

/** Les réussites d'un dé Year Zero : six ou plus en vaut une, dix ou plus deux. */
export function reussitesDuDe(valeur: number): number {
    return valeur >= 10 ? 2 : valeur >= 6 ? 1 : 0;
}

const valeurDuDe = (d: DieResult) => (typeof d.val === 'number' ? d.val : 0);

/** Ce dé reste-t-il sur la table quand on force ? */
function resteSurLaTable(d: DieResult, garde: RegleDuForcage['garde']): boolean {
    const v = valeurDuDe(d);
    return reussitesDuDe(v) > 0 || (garde === 'reussites-et-uns' && v === 1);
}

/** Combien de fois ce personnage peut forcer ce jet. */
export function forcagesPermis(
    regle: RegleDuForcage,
    valeurs: Record<string, unknown>,
    choix: Record<string, string>,
): number {
    const exception = (regle.foisSi ?? []).find(f => conditionRemplie(f.si, valeurs, choix));
    return Math.max(0, exception?.fois ?? regle.fois ?? 1);
}

/**
 * Pourquoi ce jet ne peut pas être forcé — ou `null` s'il le peut.
 *
 * **Une raison, jamais un bouton gris muet** : le joueur doit savoir que c'est la
 * Panique qui l'en empêche, pas une panne.
 */
export function pourquoiNePasForcer(
    regle: RegleDuForcage,
    contexte: {
        resultat: RollResult;
        valeurs: Record<string, unknown>;
        choix: Record<string, string>;
        /** Combien de fois ce jet a déjà été forcé. */
        dejaForce: number;
        /** Le nom du 1 de la seconde réserve — « Panique ». */
        libelleDuUn?: string;
    },
): string | null {
    const { resultat, valeurs, choix, dejaForce } = contexte;
    const interdit = (regle.interdit ?? []).find(i => conditionRemplie(i.si, valeurs, choix));
    if (interdit) return interdit.raison;

    const permis = forcagesPermis(regle, valeurs, choix);
    if (dejaForce >= permis) {
        return permis === 0 ? 'Ce personnage ne force pas ses jets.'
            : permis === 1 ? 'Ce jet a déjà été forcé.'
            : `Ce jet a déjà été forcé ${permis} fois.`;
    }
    if (regle.bloqueParLaSeconde && resultat.rolls.some(d => d.source === 'gear' && valeurDuDe(d) === 1)) {
        const nom = contexte.libelleDuUn ?? 'Fléau';
        return `${nom} : un 1 sur la seconde réserve interdit de forcer ce jet.`;
    }
    if (!resultat.rolls.some(d => !d.isDropped && !resteSurLaTable(d, regle.garde))) {
        return 'Aucun dé à relancer.';
    }
    return null;
}

/**
 * **Force le jet** : les dés gardés restent, les autres se relancent, et la
 * seconde réserve reçoit ses nouveaux dés.
 *
 * Chaque dé relancé ou ajouté porte `relance: true`, pour que l'écran montre ce
 * qui a bougé. Le compte des réussites et des 1 se refait sur le jet entier.
 */
export function forcerLeJet(
    resultat: RollResult,
    regle: RegleDuForcage,
    options: {
        famille: FamilleYearZero;
        /** Les dés que la seconde réserve gagne avant la relance (le Stress monté). */
        desEnPlus?: number;
        /** Le nom du 1 qui compte, pour le journal — « Panique », « Écueil ». */
        libelleDuUn?: string;
        /**
         * Les dés à relancer **malgré leur réussite** (leur rang dans le jet), quand
         * la règle le permet : un D10 ou un D12 à une seule réussite (Blade Runner).
         */
        aussi?: readonly number[];
        de: (faces: number) => number;
    },
): RollResult {
    const { famille, de } = options;
    const marquer = (d: DieResult, v: number): DieResult => ({
        ...d,
        val: v,
        isCritMax: famille === 'echelonnee' ? v >= 10 : v === 6,
        isCritMin: v === 1 && (famille === 'echelonnee' || d.source === 'gear'),
        relance: true,
    });

    // Un dé désigné se relance malgré sa réussite, si la règle le permet et qu'il n'en a qu'une.
    const malgreSaReussite = (d: DieResult, i: number) =>
        !!regle.relancerUneReussite && !!options.aussi?.includes(i) && relancableMalgreSaReussite(d);
    const rolls: DieResult[] = resultat.rolls.map((d, i) =>
        d.isDropped || (resteSurLaTable(d, regle.garde) && !malgreSaReussite(d, i))
            ? { ...d, relance: false }
            : marquer(d, de(d.sides ?? 6)));
    for (let i = 0; i < (options.desEnPlus ?? 0); i++) {
        rolls.push(marquer({ val: 0, sides: 6, source: 'gear' }, de(6)));
    }

    // Recompté sur les valeurs, jamais sur les marques héritées du premier lancer.
    const comptes = rolls.filter(d => !d.isDropped);
    const successes = comptes.reduce((n, d) => n + reussitesDuDe(valeurDuDe(d)), 0);
    const fails = comptes.filter(d => valeurDuDe(d) === 1 && (famille === 'echelonnee' || d.source === 'gear')).length;
    const nom = options.libelleDuUn ?? (famille === 'echelonnee' ? 'Écueil' : 'Fléau');
    const tagSuccess = successes > 0;

    return {
        total: successes,
        rolls,
        modifier: 0,
        successes,
        fails,
        tagSuccess,
        degre: degreDepuisLeBooleen(tagSuccess),
        totalDisplay: `${successes} Succès${fails > 0 ? ` / ${fails} ${nom}${fails > 1 ? 's' : ''}` : ''} — jet forcé`,
    };
}

/**
 * **Ce que coûte le forçage**, Blade Runner : un point par 1 du jet, sur le
 * champ que la règle désigne.
 *
 * `dejaPayes` : les 1 déjà payés à un forçage précédent. Le réplicant force deux
 * fois ; ses 1 restent sur la table d'un forçage à l'autre, et un même crâne ne
 * se paie pas deux fois.
 */
export function prixDuForcage(
    regle: RegleDuForcage,
    contexte: {
        resultat: RollResult;
        valeurs: Record<string, unknown>;
        choix: Record<string, string>;
        dejaPayes: number;
    },
): { champ: string; label: string; points: number; uns: number } | null {
    const prix = regle.prixDesUns;
    if (!prix) return null;
    const exception = (prix.si ?? []).find(r => conditionRemplie(r.si, contexte.valeurs, contexte.choix));
    const champ = exception?.champ ?? prix.champ;
    const label = exception?.label ?? (exception ? exception.champ : prix.label ?? prix.champ);
    const uns = contexte.resultat.rolls.filter(d => !d.isDropped && valeurDuDe(d) === 1).length;
    return { champ, label, points: Math.max(0, uns - contexte.dejaPayes), uns };
}

/**
 * **Brisé par les dégâts, Brisé par le stress** (Blade Runner, livre « BRISÉ PAR
 * LES DÉGÂTS », « BRISÉ PAR LE STRESS », « PERTE DE SANG-FROID PERMANENTE ») : à
 * zéro de Santé, le personnage s'effondre ; à zéro de Sang-froid, il lance son dé
 * d'Empathie sur la table des effets de stress critiques (humain ou réplicant), et
 * un 1 retire un point de Sang-froid maximal, à vie.
 */
export interface EtatBrise {
    /** Le champ qui, à zéro, brise le personnage. */
    champ: string;
    label: string;
    /** Ce que l'état fait, dit au meneur. */
    rappel: string;
    /** Le champ du dé de l'effet critique — un dé échelonné de la fiche. */
    de?: string;
    /** La table de l'effet ; `si` en choisit une autre (le réplicant). */
    table?: { univers: string; table: string; si?: { si: ConditionDeFiche; table: string }[] };
    /** Sur un 1 au dé, ce champ (le maximum) perd un point à vie. */
    perteDuMaximum?: string;
    /** Le champ texte de la fiche où s'écrit l'effet tiré — les effets de stress critiques. */
    noterDans?: string;
}

/**
 * **Le dé de l'effet critique d'un Brisé**, et ce qu'il coûte : le dé échelonné
 * lu sur la fiche (l'Empathie), et sur un 1 le maximum qui perd un point à vie.
 * Partagé par le panneau de jet (après un forçage) et la carte de combat (le
 * Sang-froid tombé à zéro sous le stress).
 */
export function lancerLEffetDuBrise(
    brise: Pick<EtatBrise, 'de' | 'perteDuMaximum'>,
    valeurs: Record<string, unknown>,
    lireLeMaximum: (champ: string) => number,
    de: (faces: number) => number,
): { faces: number; tire: number; perte?: { champ: string; reste: number } } {
    const faces = (brise.de ? facesDuNiveau(valeurs[brise.de]) : null) ?? 6;
    const tire = de(faces);
    const perte = tire === 1 && brise.perteDuMaximum
        ? { champ: brise.perteDuMaximum, reste: Math.max(0, lireLeMaximum(brise.perteDuMaximum) - 1) }
        : undefined;
    return { faces, tire, perte };
}

/** Une ligne ajoutée à un champ texte de la fiche, sans effacer ce qui y est déjà. */
export function noterSurLaFiche(existant: unknown, ligne: string): string {
    const avant = typeof existant === 'string' ? existant.trim() : '';
    return avant ? `${avant}\n${ligne}` : ligne;
}

/** La table de l'effet critique, selon la fiche. */
export function tableDuBrise(
    brise: EtatBrise,
    valeurs: Record<string, unknown>,
    choix: Record<string, string>,
): { univers: string; table: string } | undefined {
    if (!brise.table) return undefined;
    const autre = (brise.table.si ?? []).find(s => conditionRemplie(s.si, valeurs, choix));
    return { univers: brise.table.univers, table: autre?.table ?? brise.table.table };
}

/** Le test de Panique : un dé, plus le Niveau de Stress. */
export function testDePanique(niveau: number, faces: number, de: (faces: number) => number) {
    const tire = de(faces);
    return { de: tire, niveau, total: tire + niveau };
}

/**
 * **Le cumul des Paniques** : *« si un personnage déjà paniqué subit un nouveau
 * test de Panique, le nouvel effet remplace le précédent s'il est plus élevé.
 * S'il est plus bas, on applique l'effet situé exactement un cran au-dessus de la
 * panique précédente »* (`la-mecanique-de-stress-et-de-panique.md`).
 *
 * `precedent` : la panique en cours, lue sur la fiche (0 : aucune). `seuil` : le
 * premier total qui est une panique (7 chez Alien — de 1 à 6, on tient le coup).
 */
export function cumulDePanique(total: number, precedent: number, seuil: number): { effectif: number; cumule: boolean } {
    if (precedent < seuil || total > precedent) return { effectif: total, cumule: false };
    return { effectif: precedent + 1, cumule: true };
}

/**
 * L'entrée d'une table qui couvre ce total.
 *
 * **Au-delà de la dernière ligne, c'est la dernière** : la table de Panique
 * s'arrête à « 15+ » (écrite 15–20), et un Niveau de Stress de 16 donne au moins
 * 17. En deçà de la première, la première.
 */
export function entreeDeLaTable<E extends { min: number; max: number }>(
    entrees: readonly E[],
    total: number,
): E | undefined {
    const exacte = entrees.find(e => total >= e.min && total <= e.max);
    if (exacte || entrees.length === 0) return exacte;
    const triees = [...entrees].sort((a, b) => a.min - b.min);
    return total > triees[triees.length - 1].max ? triees[triees.length - 1] : triees[0];
}

/**
 * **Le stress subi** (Blade Runner, « STRESS ET SANG-FROID ») : le jet réflexe
 * des dés de la fiche (l'Empathie et la Psychologie), chaque réussite retirant un
 * point du facteur ; ce qui reste se retire du champ, jamais sous zéro. Un champ
 * dont la fiche ne dit pas le niveau ne lance pas de dé — on ne l'invente pas.
 */
export function subirLeStress(
    facteur: number,
    regle: { champ: string; jet: readonly string[] },
    valeurs: Record<string, unknown>,
    de: (faces: number) => number,
): { des: { champ: string; faces: number; val: number }[]; reussites: number; perte: number; avant: number; apres: number } {
    const des = regle.jet.flatMap(champ => {
        const faces = facesDuNiveau(valeurs[champ]);
        return faces ? [{ champ, faces, val: de(faces) }] : [];
    });
    const reussites = des.reduce((n, d) => n + reussitesDuDe(d.val), 0);
    const perte = Math.max(0, Math.floor(facteur) - reussites);
    const brut = Number(valeurs[regle.champ]);
    const avant = Number.isFinite(brut) ? brut : 0;
    return { des, reussites, perte, avant, apres: Math.max(0, avant - perte) };
}
