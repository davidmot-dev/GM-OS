import { reussitesDuDe } from './yearZero';
import { composerLaPoignee, facesDuNiveau, type DeEchelonne, type ModificateurDeDes } from '../desEchelonnes';

/**
 * **Blade Runner — ce que la santé fait entre deux coups**, 2026-10-24.
 *
 * David : *« on va finir Blade Runner »*, livre de base français sous la main
 * (`BRN-01_LivreDeRegles.pdf`, pages imprimées). Le pilote savait faire tomber un
 * personnage et tirer la blessure critique ; le livre continue après :
 *
 * - **Mort** (p. 72) : une blessure critique *mortelle* impose une **sauvegarde
 *   contre la mort** — un jet d'Endurance — à la fin de sa limite de temps (un
 *   Round ou un Quart), puis à chaque nouvelle limite. Ratée : la mort. Brisé, on
 *   lance sans pouvoir forcer. Certaines blessures tuent sur le coup.
 * - **Stabilisation** (p. 72) : un jet d'Assistance médicale, aussi long que la
 *   limite ; réussi, la limite passe d'un Round à un Quart ; réussi sur un Quart,
 *   plus de sauvegarde. Raté, on retente après la sauvegarde. Hôpital ou trousse
 *   de chirurgien : avantage ; se stabiliser soi-même (pas Brisé) : désavantage.
 * - **Guérison** (p. 72) : chaque blessure a sa durée ; il faut un Quart de soins
 *   et un jet d'Assistance médicale. Réussi, l'effet disparaît **à la fin de la
 *   durée** ; raté, la blessure devient **permanente** (un implant y remédie).
 *   Une durée « permanente » est incurable.
 * - **Premiers secours** (p. 71) : sur un personnage Brisé par les dégâts, un jet
 *   d'Assistance médicale rend autant de Santé que de réussites. **Main
 *   secourable** (p. 76) : sur un Brisé par le stress, un jet de Manipulation rend
 *   autant de Sang-froid. Sans aide, un point au bout d'un Quart.
 * - **Critiques aggravés** (p. 71) : chaque réussite au-delà de la touche
 *   critique fait lancer un dé de critique de plus, et l'on garde celui qu'on veut.
 *
 * Fonctions pures : le dé est passé en paramètre, rien n'est écrit ici. Le suivi
 * vit sur la fiche, sous `CLE_BLADE_RUNNER`, comme celui de Cthulhu Hack.
 */

export const CLE_BLADE_RUNNER = '_gmos_blade_runner';

/** Ce que le pilote déclare : les champs de la fiche que le suivi lit et écrit. */
export interface RegleBladeRunner {
    /** Les deux dés de la sauvegarde contre la mort : `['vigueur', 'endurance']`. */
    endurance: [string, string];
    /** Les deux dés de l'Assistance médicale : `['intelligence', 'assistanceMedicale']`. */
    assistanceMedicale: [string, string];
    /** Les deux dés de la main secourable : `['empathie', 'manipulation']`. */
    manipulation: [string, string];
    sante: string;
    santeMax: string;
    sangFroid: string;
    sangFroidMax: string;
    /** Le champ texte où la fiche montre ses blessures critiques, tenu à jour. */
    blessures?: string;
    /** Le champ du souvenir clé, et celui de l'objet fétiche : leur geste ne s'offre que s'ils sont remplis. */
    souvenirCle?: string;
    objetFetiche?: string;
}

export type LimiteDeTemps = 'round' | 'quart';
export type DureeDeGuerison = 'semaine' | 'mois' | 'permanent';
/**
 * - `menace` : mortelle, pas encore stabilisée — sauvegardes contre la mort ;
 * - `a-soigner` : hors de danger (ou jamais mortelle), en attente de ses soins ;
 * - `en-guerison` : soignée, l'effet dure jusqu'à l'échéance ;
 * - `guerie`, `permanente`, `fatale`.
 */
export type EtatDeBlessure = 'menace' | 'a-soigner' | 'en-guerison' | 'guerie' | 'permanente' | 'fatale';

export interface BlessureBR {
    id: string;
    titre: string;
    /** La table (Percutant, Perforant) et le dé tiré, quand on les connaît. */
    table?: string;
    de?: number;
    /** L'effet de jeu, tel que la table le dit. */
    effet: string;
    mortelle: boolean;
    limite?: LimiteDeTemps;
    guerison?: DureeDeGuerison;
    etat: EtatDeBlessure;
    /** Les sauvegardes contre la mort déjà réussies. */
    survies?: number;
    /** L'horodatage Clock-OS où l'effet prend fin, une fois les soins réussis. */
    echeance?: number;
}

export interface SuiviBR {
    blessures: BlessureBR[];
    /** La séance où le souvenir clé a servi — une fois par séance (p. 56). */
    souvenirCle?: string;
    /** La séance où l'objet fétiche a servi — une fois par séance (p. 76). */
    objetFetiche?: string;
}

export function lireLeSuivi(fiche: Record<string, unknown>): SuiviBR {
    const brut = fiche[CLE_BLADE_RUNNER] as Partial<SuiviBR> | undefined;
    return { ...brut, blessures: Array.isArray(brut?.blessures) ? brut.blessures : [] };
}

const sansAccents = (texte: string) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * **Une entrée des tables de blessures critiques, lue** (p. 73). Les tables de
 * Table-OS écrivent : *« Mortel : Oui (Limite : Quart). Durée de guérison : Une
 * semaine. Désavantage aux jets de… »*, ou *« Mortel : Oui. Mort instantanée. »*
 */
export function lireLaBlessure(
    entree: { title: string; effect?: string },
    id: string,
    origine: { table?: string; de?: number } = {},
): BlessureBR {
    const texte = entree.effect ?? '';
    const bas = sansAccents(texte);
    const mortelle = /mortel\s*:\s*oui/.test(bas);
    const instantanee = /mort instantanee/.test(bas);
    const limite = /limite\s*:\s*round/.test(bas) ? 'round' : /limite\s*:\s*quart/.test(bas) ? 'quart' : undefined;
    const duree = /guerison\s*:\s*permanent/.test(bas) ? 'permanent'
        : /guerison\s*:\s*un mois/.test(bas) ? 'mois'
        : /guerison\s*:\s*une semaine/.test(bas) ? 'semaine' : undefined;
    // L'effet de jeu : ce qui suit les deux mentions, telles quelles.
    const effet = texte
        .replace(/Mortel\s*:\s*(Oui|Non)(\s*\(Limite\s*:\s*\w+\))?\.\s*/i, '')
        .replace(/Durée de guérison\s*:\s*[^.]+\.\s*/i, '')
        .trim();
    return {
        id, titre: entree.title, ...origine, effet,
        mortelle, ...(limite ? { limite } : {}), ...(duree ? { guerison: duree } : {}),
        etat: instantanee ? 'fatale' : mortelle && limite ? 'menace' : 'a-soigner',
    };
}

/** La ligne que le champ texte de la fiche garde pour une blessure. */
export function ligneDeLaBlessure(b: BlessureBR): string {
    const etat: Record<EtatDeBlessure, string> = {
        'menace': `mortelle, sauvegarde chaque ${b.limite === 'round' ? 'Round' : 'Quart'}`,
        'a-soigner': b.guerison === 'permanent' ? 'incurable, implant nécessaire' : 'à soigner',
        'en-guerison': 'soignée, en guérison',
        'guerie': 'guérie',
        'permanente': 'permanente',
        'fatale': 'mortelle — décès',
    };
    return `${b.titre}${b.table ? ` (${b.table})` : ''} — ${etat[b.etat]}${b.effet && b.etat !== 'guerie' && b.etat !== 'fatale' ? ` : ${b.effet}` : ''}`;
}

/**
 * Ce que la fiche reçoit quand le suivi change : le suivi, et le champ texte
 * des blessures **réécrit d'après lui**, pour que la fiche HTML et l'œil du
 * meneur lisent la même chose. Les blessures guéries en sortent.
 *
 * ⚠️ **Les lignes tapées à la main restent.** Le champ existait avant le suivi :
 * une fiche y porte peut-être « Œil lacéré » écrit en séance. Seules les lignes
 * que le suivi avait lui-même écrites (`fiche` : l'état d'avant) sont remplacées.
 */
export function ecrireLeSuivi(
    regle: Pick<RegleBladeRunner, 'blessures'>,
    suivi: SuiviBR,
    fiche: Record<string, unknown> = {},
): Record<string, unknown> {
    const maj: Record<string, unknown> = { [CLE_BLADE_RUNNER]: suivi };
    if (regle.blessures) {
        const ecrites = new Set(lireLeSuivi(fiche).blessures.map(ligneDeLaBlessure));
        const libres = String(fiche[regle.blessures] ?? '').split('\n').map(l => l.trim()).filter(l => l && !ecrites.has(l));
        const suivies = suivi.blessures.filter(b => b.etat !== 'guerie').map(ligneDeLaBlessure);
        maj[regle.blessures] = [...libres, ...suivies].join('\n');
    }
    return maj;
}

const remplacer = (suivi: SuiviBR, b: BlessureBR): SuiviBR =>
    ({ ...suivi, blessures: suivi.blessures.map(x => (x.id === b.id ? b : x)) });

export function ajouterLaBlessure(suivi: SuiviBR, b: BlessureBR): SuiviBR {
    return { ...suivi, blessures: [...suivi.blessures, b] };
}

/** **La sauvegarde contre la mort** : réussie, on tient jusqu'à la prochaine limite ; ratée, on meurt. */
export function sauvegarder(suivi: SuiviBR, id: string, reussie: boolean): SuiviBR {
    const b = suivi.blessures.find(x => x.id === id);
    if (!b || b.etat !== 'menace') return suivi;
    return remplacer(suivi, reussie ? { ...b, survies: (b.survies ?? 0) + 1 } : { ...b, etat: 'fatale' });
}

/** **La stabilisation** : un Round devient un Quart ; un Quart stabilisé met hors de danger. */
export function stabiliser(suivi: SuiviBR, id: string, reussie: boolean): SuiviBR {
    const b = suivi.blessures.find(x => x.id === id);
    if (!b || b.etat !== 'menace' || !reussie) return suivi;
    return remplacer(suivi, b.limite === 'round' ? { ...b, limite: 'quart' } : { ...b, etat: 'a-soigner' });
}

const JOUR = 24 * 60 * 60 * 1000;
/** Une semaine, un mois : la durée de guérison en millisecondes d'horloge. */
export const DUREES: Record<Exclude<DureeDeGuerison, 'permanent'>, number> = { semaine: 7 * JOUR, mois: 30 * JOUR };

/**
 * **Les soins** : réussis, l'effet dure jusqu'à l'échéance ; ratés, la blessure
 * devient permanente. `maintenant` : l'horloge de jeu, quand on la connaît —
 * sans elle, l'échéance se lève à la main.
 */
export function soigner(suivi: SuiviBR, id: string, reussie: boolean, maintenant?: number): SuiviBR {
    const b = suivi.blessures.find(x => x.id === id);
    if (!b || b.etat !== 'a-soigner') return suivi;
    if (b.guerison === 'permanent' || !reussie) return remplacer(suivi, { ...b, etat: 'permanente' });
    const duree = b.guerison ? DUREES[b.guerison] : undefined;
    return remplacer(suivi, {
        ...b, etat: 'en-guerison',
        ...(maintenant !== undefined && duree ? { echeance: maintenant + duree } : {}),
    });
}

/** L'effet a pris fin : la blessure est guérie. */
export function guerir(suivi: SuiviBR, id: string): SuiviBR {
    const b = suivi.blessures.find(x => x.id === id);
    return b && b.etat === 'en-guerison' ? remplacer(suivi, { ...b, etat: 'guerie' }) : suivi;
}

/** L'échéance est-elle passée, à cette heure de jeu ? */
export const estEchue = (b: BlessureBR, maintenant: number | undefined) =>
    b.etat === 'en-guerison' && b.echeance !== undefined && maintenant !== undefined && maintenant >= b.echeance;

/** Une blessure qu'on ne suit plus : la fiche la perd. */
export function oublier(suivi: SuiviBR, id: string): SuiviBR {
    return { ...suivi, blessures: suivi.blessures.filter(b => b.id !== id) };
}

/** Le personnage est-il menacé de mort, et combien de blessures le menacent ? */
export const blessuresMortelles = (suivi: SuiviBR) => suivi.blessures.filter(b => b.etat === 'menace');

/**
 * **Un jet de Blade Runner, hors du panneau de jet** — la sauvegarde, les soins,
 * le secours : deux dés échelonnés lus sur une fiche, ou deux lettres (un PNJ),
 * l'avantage et le désavantage du livre, six et plus une réussite, dix deux.
 */
export interface JetBR {
    des: { faces: number; val: number; label: string }[];
    reussites: number;
    uns: number;
}

/** La poignée de deux champs d'une fiche — ou de deux lettres. */
export function poigneeBR(
    sources: { label: string; niveau: unknown }[],
    modificateur: ModificateurDeDes = 'aucun',
): DeEchelonne[] {
    const des = sources.flatMap(s => {
        const faces = facesDuNiveau(s.niveau);
        return faces ? [{ label: s.label, champ: s.label, niveau: String(s.niveau), faces }] : [];
    });
    return composerLaPoignee(des, modificateur, { plafondDesD12: 0 }).des;
}

export function lancerBR(poignee: DeEchelonne[], de: (faces: number) => number): JetBR {
    const des = poignee.map(d => ({ faces: d.faces, val: de(d.faces), label: d.label }));
    return { des, reussites: des.reduce((n, d) => n + reussitesDuDe(d.val), 0), uns: des.filter(d => d.val === 1).length };
}

/**
 * **Forcer un de ces jets** (p. 55) : les réussites et les 1 restent, le reste se
 * relance ; chaque 1, jet initial compris, coûte un point.
 */
export function forcerBR(jet: JetBR, de: (faces: number) => number): JetBR {
    const des = jet.des.map(d => (reussitesDuDe(d.val) > 0 || d.val === 1 ? d : { ...d, val: de(d.faces) }));
    return { des, reussites: des.reduce((n, d) => n + reussitesDuDe(d.val), 0), uns: des.filter(d => d.val === 1).length };
}

/** **Premiers secours** et **main secourable** : sur un Brisé seulement, autant de points que de réussites, sans dépasser le maximum. */
export function secourir(courant: number, maximum: number, reussites: number): number | null {
    if (courant > 0 || reussites <= 0) return null;
    return Math.min(maximum > 0 ? maximum : reussites, reussites);
}

/** **Critiques aggravés** : autant de dés de critique que de réussites au-delà des deux de la touche critique, plus un. */
export function desDeCritique(reussites: number): number {
    return Math.max(1, reussites - 1);
}

/** Le souvenir clé, l'objet fétiche : ont-ils déjà servi pendant cette séance ? */
export const dejaUtilise = (suivi: SuiviBR, quoi: 'souvenirCle' | 'objetFetiche', seance: string | undefined) =>
    !!seance && suivi[quoi] === seance;
