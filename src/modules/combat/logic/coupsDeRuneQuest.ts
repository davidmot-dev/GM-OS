import type { GameDriver } from '../../../types/drivers';
import type { DamageImpact } from '../../../types/entity.types';
import { LOCALISATIONS, type Localisation } from '../../dice/systemes/runequest';
import { valeurDuChamp } from './SanteDuCombattant';

/**
 * **Les coups localisés de RuneQuest** — demandé par David le 2026-10-30 (« tu ne
 * joues pas la localisation des dégâts dans Combat-OS pour Runequest ? »), d'après le
 * livre de base Deadcrows, p. 146-148, relu en image.
 *
 * - Les dégâts, moins l'armure de la zone, se retirent **de la localisation et du
 *   total** (p. 146).
 * - **Un membre ne subit jamais, en un seul coup, plus du double de ses points de
 *   vie** : l'excédent est perdu, total compris (« un bras à 2 points touché pour
 *   5 points ne subira que 4 points de dégâts », p. 148).
 * - Dégâts de la zone **≥ ses points de vie** : la zone est hors d'usage, avec son
 *   effet propre (p. 147-148) ; **au double** : un membre touché par un seul coup
 *   neutralise, la tête, la poitrine ou l'abdomen font perdre connaissance et 1 PV
 *   par round ; **au triple en un seul coup** : le membre est tranché, la tête, la
 *   poitrine ou l'abdomen tuent (p. 148).
 * - Total à 1 ou 2 : inconscient ; à 0 ou moins : mort à la fin du round sans soin
 *   (p. 146-147).
 *
 * Le calcul ne connaît que la zone : la porte des dégâts (`handleApplyImpact`) retire
 * ce qu'il rend au total, comme pour Torg.
 */

export type RegleDesCoupsLocalises = NonNullable<GameDriver['combat']['coupsLocalises']>;

const MEMBRES: readonly Localisation[] = ['jambe-droite', 'jambe-gauche', 'bras-droit', 'bras-gauche'];

export interface ZoneDuCombattant {
    cle: Localisation;
    label: string;
    pv: number;
    armure: number;
    /** Les dégâts déjà reçus par la zone, tous coups confondus. */
    degats: number;
    membre: boolean;
    /** Le champ de la fiche qui garde ces dégâts. */
    champDesDegats: string;
}

/** Les zones que le pilote déclare, dans l'ordre de la table du livre. */
export function zonesDuCombattant(regle: RegleDesCoupsLocalises, valeurs: Record<string, unknown> | undefined): ZoneDuCombattant[] {
    return LOCALISATIONS.flatMap(l => {
        const champs = regle.zones[l.cle];
        if (!champs) return [];
        return [{
            cle: l.cle, label: l.label, membre: MEMBRES.includes(l.cle), champDesDegats: champs.degats,
            pv: Math.max(0, valeurDuChamp(valeurs, champs.pv) ?? 0),
            armure: Math.max(0, champs.armure ? valeurDuChamp(valeurs, champs.armure) ?? 0 : 0),
            degats: Math.max(0, valeurDuChamp(valeurs, champs.degats) ?? 0),
        }];
    });
}

export type Atteinte = 'arretee' | 'touchee' | 'hors-d-usage' | 'double' | 'triple';

export interface CoupLocalise {
    zone: ZoneDuCombattant;
    bruts: number;
    /** Après l'armure. */
    net: number;
    /** Ce que la zone et le total subissent : le net, plafonné au double pour un membre. */
    retenus: number;
    plafonne: boolean;
    degatsApres: number;
    atteinte: Atteinte;
    effet: string;
}

const EFFETS_HORS_D_USAGE: Record<Localisation, string> = {
    'jambe-droite': "jambe inutilisable : il s'effondre et ne fait rien d'autre ce round, puis combat au sol (attaques divisées par deux, +40 % pour qui l'attaque) (p. 147)",
    'jambe-gauche': "jambe inutilisable : il s'effondre et ne fait rien d'autre ce round, puis combat au sol (attaques divisées par deux, +40 % pour qui l'attaque) (p. 147)",
    abdomen: "les deux jambes inutilisables, il tombe et combat au sol ; sans soin dans les dix minutes, il meurt d'hémorragie (p. 147-148)",
    poitrine: "il tombe, crache du sang, ne peut ni agir ni se soigner ; sans Premiers soins dans les dix minutes, il meurt d'hémorragie (p. 148)",
    'bras-droit': "bras inutilisable : il lâche ce qu'il tenait, reste debout et se bat avec un autre membre (p. 148)",
    'bras-gauche': "bras inutilisable : il lâche ce qu'il tenait, reste debout et se bat avec un autre membre (p. 148)",
    tete: 'inconscient ; sans Premiers soins dans les cinq minutes, il meurt (p. 148)',
};

function effetDe(zone: ZoneDuCombattant, atteinte: Atteinte): string {
    switch (atteinte) {
        case 'arretee': return "l'armure arrête tout";
        case 'touchee': return '';
        case 'hors-d-usage': return EFFETS_HORS_D_USAGE[zone.cle];
        case 'double': return zone.membre
            ? "au double en un seul coup : neutralisé et en état de choc jusqu'aux soins, il peut se soigner lui-même ; l'excédent est perdu (p. 148)"
            : 'au double : inconscient, il perd 1 PV par round jusqu’aux Premiers soins ou à un soin magique (p. 148)';
        case 'triple': return zone.membre
            ? 'au triple en un seul coup : membre tranché ou définitivement hors d’usage, hors combat (p. 148)'
            : 'au triple en un seul coup : mort sur le coup (p. 148)';
    }
}

/** Un coup porté à la zone : `bruts` est le jet de dégâts, armure non retirée. */
export function porterLeCoup(zone: ZoneDuCombattant, bruts: number): CoupLocalise {
    const entiers = Math.max(0, Math.trunc(bruts));
    const net = Math.max(0, entiers - zone.armure);
    const retenus = zone.membre && zone.pv > 0 ? Math.min(net, 2 * zone.pv) : net;
    const degatsApres = zone.degats + retenus;
    /*
      Le triple et, pour un membre, le double se lisent **sur un seul coup** et avant
      le plafond — le bras à 2 points touché pour 8 est tranché (p. 148) ; le double
      de la tête, de la poitrine ou de l'abdomen se lit sur la zone, coups cumulés.
    */
    const atteinte: Atteinte = net === 0 ? 'arretee'
        : zone.pv <= 0 ? 'touchee'
        : net >= 3 * zone.pv ? 'triple'
        : (zone.membre ? net : degatsApres) >= 2 * zone.pv ? 'double'
        : degatsApres >= zone.pv ? 'hors-d-usage'
        : 'touchee';
    return { zone, bruts: entiers, net, retenus, plafonne: retenus < net, degatsApres, atteinte, effet: effetDe(zone, atteinte) };
}

/** Un soin porté à la zone : il ne rend pas plus que ce qu'elle a perdu. */
export function soignerLaZone(zone: ZoneDuCombattant, points: number): { rendus: number; degatsApres: number } {
    const rendus = Math.min(zone.degats, Math.max(0, Math.trunc(points)));
    return { rendus, degatsApres: zone.degats - rendus };
}

/** Ce que dit le total (p. 146-147) ; rien au-dessus de 2. */
export function etatDuTotal(total: number): string | undefined {
    if (total <= 0) return 'Mort à la fin du round, sauf soin qui le ramène au-dessus de 0 (p. 146-147)';
    if (total <= 2) return 'Inconscient : 1 ou 2 points de vie (p. 146)';
    return undefined;
}

const restants = (zone: ZoneDuCombattant, degats: number) => `${zone.pv - degats}/${zone.pv} PV`;

export function direLeCoup(coup: CoupLocalise): string {
    const { zone } = coup;
    const calcul = zone.armure > 0 ? `${coup.bruts} − ${zone.armure} d'armure = ${coup.net}` : `${coup.net}`;
    const plafond = coup.plafonne ? `, ${coup.retenus} retenus (un membre ne prend pas plus du double)` : '';
    return `${zone.label} : ${calcul} dégâts${plafond} ; ${zone.label.toLowerCase()} à ${restants(zone, coup.degatsApres)}${coup.effet ? ` — ${coup.effet}` : ''}.`;
}

/**
 * **La règle, à la porte des dégâts.** Un impact qui nomme une zone déclarée se
 * convertit : le total ne perd que ce que la zone retient, et la fiche reçoit les
 * dégâts de la zone. Sans zone — un poison, une chute —, l'impact passe tel quel.
 */
export function coupLocaliseSelonLeJeu(
    regle: RegleDesCoupsLocalises | undefined,
    fiche: Record<string, unknown> | undefined,
    impact: DamageImpact,
): { impact: DamageImpact; fiche: Record<string, number>; texte: string } | null {
    if (!regle || !impact.location) return null;
    const zone = zonesDuCombattant(regle, fiche).find(z => z.cle === impact.location);
    if (!zone) return null;
    // La zone se dit dans le texte : le jeton (`bras-gauche`) n'a pas sa place au journal.
    const { location: _zone, ...sansZone } = impact;
    if (impact.isRecovery) {
        const soin = soignerLaZone(zone, impact.value);
        return {
            impact: { ...sansZone, value: soin.rendus },
            fiche: { [zone.champDesDegats]: soin.degatsApres },
            texte: `${zone.label} : ${soin.rendus} point${soin.rendus > 1 ? 's' : ''} rendu${soin.rendus > 1 ? 's' : ''} à la zone et au total ; ${zone.label.toLowerCase()} à ${restants(zone, soin.degatsApres)}.`,
        };
    }
    const coup = porterLeCoup(zone, impact.value);
    return {
        impact: { ...sansZone, value: coup.retenus },
        fiche: { [zone.champDesDegats]: coup.degatsApres },
        texte: direLeCoup(coup),
    };
}
