/**
 * **Les rangs d'action de RuneQuest, selon l'action** — RQ-A4, 03/11/2026, à la demande
 * de David (« on va faire RQ-A3 et RQ-A4 »). Livre de base Deadcrows, pages imprimées
 * (PDF − 1), tables p. 193 relues en image.
 *
 * Le pilote triait RA DEX + RA TAI pour tout le monde ; un tir ou un sort prenait le
 * total d'une mêlée. Le livre (p. 192-195, 386) :
 * - **mêlée** : le RA de l'arme noté sur la fiche, qui comprend déjà DEX, TAI et
 *   allonge — Vasana, DEX 11 et TAI 10, épée large au RA 7 (p. 85) ;
 * - **tir** : la DEX seule (p. 194) — son arc au RA 3 ;
 * - **magie spirituelle** : RA de DEX + 1 par point de magie au-delà du premier
 *   (Démoralisation, 2 PM : RA 4, p. 195) ; +5 pour passer d'une arme au sort (p. 194) ;
 * - **magie runique** : RA 1, +1 par point de renforcement au-delà du premier (p. 194) ;
 * - **sorcellerie** : un round complet, puis le RA de DEX du round suivant, +2 par point
 *   de magie supplémentaire (p. 386) ;
 * - **délais** : +5 par arme ou sort à préparer, +1 par tranche de 3 m, surprise +3 à
 *   moins de 3 m ou +1 de 4 à 9 m (p. 193) ; un RA sous 1 vaut 1 (p. 192) ;
 * - **ordre** : le RA le plus bas d'abord ; à égalité, la DEX la plus haute ; à DEX
 *   égale, simultané — pas de dé (p. 192) ;
 * - **limite de 12** : rien ne s'exécute dans le round au-delà (p. 194). Un sort se
 *   poursuit et agit au round suivant, réduit de 12 — 37 RA : trois rounds complets,
 *   effet au RA 1 du quatrième. Une autre action ne se reporte que si la meneuse le
 *   décide : la décision lui appartient, ce module la calcule.
 */

export type Intention = 'melee' | 'distance' | 'magie-spirituelle' | 'magie-runique' | 'sorcellerie' | 'autre';

export const LIBELLES_DES_INTENTIONS: Record<Intention, string> = {
    melee: 'Mêlée', distance: 'Tir', 'magie-spirituelle': 'Magie spirituelle',
    'magie-runique': 'Magie runique', sorcellerie: 'Sorcellerie', autre: 'Autre',
};

export type Surprise = 'aucune' | 'proche' | 'loin';

export const SURPRISES: Record<Surprise, { label: string; ra: number }> = {
    aucune: { label: 'Surprise : aucune', ra: 0 },
    proche: { label: 'Surpris à moins de 3 m (+3)', ra: 3 },
    loin: { label: 'Surpris de 4 à 9 m (+1)', ra: 1 },
};

export interface DeclarationDeRA {
    intention: Intention;
    /** Le nom de l'arme ou du sort, pour l'ordre du round. */
    arme: string;
    /** Le RA de l'arme, lu sur la fiche ou saisi. */
    raArme?: number;
    /** Points de magie du sort : dépensés (spirituelle), investis (runique), supplémentaires (sorcellerie). */
    pm: number;
    /** Armes ou sorts à préparer, 5 RA chacun. */
    preparations: number;
    /** Unités de déplacement de 3 m. */
    deplacement: number;
    surprise: Surprise;
    /** Passer d'une arme à un sort de magie spirituelle ou de sorcellerie (+5, p. 194). */
    armeVersSort: boolean;
    /** Ce que la meneuse ajoute ou retire d'elle-même. */
    ajustement: number;
}

export const DECLARATION_PAR_DEFAUT: DeclarationDeRA = {
    intention: 'melee', arme: '', pm: 1, preparations: 0, deplacement: 0, surprise: 'aucune', armeVersSort: false, ajustement: 0,
};

/** Ce que la fiche du combattant dit, quand elle le dit. */
export interface FicheDuRang { raDex?: number; raTai?: number; dex?: number }

export interface RangDAction {
    ra: number;
    /** « 7 arme + 1 déplacement ». */
    detail: string;
    /** Au-delà de 12 : rien ne s'exécute dans ce round (p. 194). */
    auDelaDe12: boolean;
    /** Un sort se poursuit d'office ; une autre action attend la décision de la meneuse. */
    seReporteDOffice: boolean;
    remarques: string[];
}

const plus = (n: number, quoi: string) => (n ? [`${n} ${quoi}`] : []);

export function rangDAction(d: DeclarationDeRA, fiche: FicheDuRang): RangDAction {
    const remarques: string[] = [];
    const raDex = fiche.raDex ?? 0;
    if (fiche.raDex === undefined && d.intention !== 'magie-runique' && d.raArme === undefined) remarques.push('RA de DEX absent de la fiche : compté 0.');
    const pmAuDela = Math.max(0, Math.trunc(d.pm) - 1);
    let parts: string[];
    switch (d.intention) {
        case 'melee':
        case 'distance':
            if (d.raArme !== undefined) parts = [`${d.raArme} arme`];
            else if (d.intention === 'melee') {
                parts = [`${raDex} DEX`, `${fiche.raTai ?? 0} TAI`];
                remarques.push('RA de l’arme absent : DEX + TAI, sans l’allonge (p. 193).');
            } else parts = [`${raDex} DEX`];
            break;
        case 'magie-spirituelle':
            parts = [`${raDex} DEX`, ...plus(pmAuDela, 'PM'), ...(d.armeVersSort ? ['5 arme → sort'] : [])];
            break;
        case 'magie-runique':
            parts = ['1 rune', ...plus(pmAuDela, 'PM')];
            break;
        case 'sorcellerie':
            // Le round complet du lancement compte 12 : l'effet tombe au round suivant (p. 386).
            parts = ['12 lancement', `${raDex} DEX`, ...plus(2 * Math.max(0, Math.trunc(d.pm)), 'intensité'), ...(d.armeVersSort ? ['5 arme → sort'] : [])];
            break;
        default:
            parts = [`${raDex} DEX`];
    }
    parts.push(...plus(5 * Math.max(0, Math.trunc(d.preparations)), 'préparation'),
        ...plus(Math.max(0, Math.trunc(d.deplacement)), 'déplacement'),
        ...plus(SURPRISES[d.surprise].ra, 'surprise'),
        ...(d.ajustement ? [`${d.ajustement} ajustement`] : []));
    const brut = parts.reduce((s, p) => s + Number(p.split(' ')[0]), 0);
    const ra = Math.max(1, brut);
    const sort = d.intention === 'magie-spirituelle' || d.intention === 'magie-runique' || d.intention === 'sorcellerie';
    return {
        ra,
        detail: parts.map((p, i) => (i === 0 || p.startsWith('-') ? p.replace(/^-/, '− ') : `+ ${p}`)).join(' '),
        auDelaDe12: ra > 12,
        seReporteDOffice: sort,
        remarques: brut < 1 ? [...remarques, 'Un RA sous 1 vaut 1 (p. 192).'] : remarques,
    };
}

/** Où tombe une action au-delà de 12 : le round suivant, réduit de 12, autant de fois qu'il faut (p. 194). */
export function report(ra: number): { rounds: number; ra: number } {
    let rounds = 0, reste = ra;
    while (reste > 12) { reste -= 12; rounds++; }
    return { rounds, ra: Math.max(1, reste) };
}

export interface RangACompter { id: string; nom: string; ra: number; dex?: number }
export interface RangOrdonne extends RangACompter { simultane: boolean }

/**
 * L'ordre du round : le RA le plus bas d'abord, puis la DEX la plus haute ; à DEX
 * égale, les deux agissent ensemble (p. 192). Ceux au-delà de 12 sont rendus à part.
 */
export function ordonnerLesRangs(rangs: RangACompter[]): { ordre: RangOrdonne[]; horsDuRound: RangACompter[] } {
    const dans = rangs.filter(r => r.ra <= 12)
        .sort((a, b) => a.ra - b.ra || (b.dex ?? 0) - (a.dex ?? 0));
    const ensemble = (a?: RangACompter, b?: RangACompter) => !!a && !!b && a.ra === b.ra && (a.dex ?? 0) === (b.dex ?? 0);
    return {
        ordre: dans.map((r, i) => ({ ...r, simultane: ensemble(r, dans[i - 1]) || ensemble(r, dans[i + 1]) })),
        horsDuRound: rangs.filter(r => r.ra > 12),
    };
}
