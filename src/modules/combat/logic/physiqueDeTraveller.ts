import type { GameDriver } from '../../../types/drivers';
import type { DamageImpact } from '../../../types/entity.types';
import {
    encaisserTraveller, mdDeCaracteristique, soignerTraveller, type EtatPhysiqueDeTraveller, type PhysiqueDeTraveller,
} from '../../dice/systemes/traveller';
import { maximumDeLaJauge, valeurDuChamp } from './SanteDuCombattant';

/**
 * **Les dégâts de Traveller à la porte des dégâts** — 26/11/2026, à la demande de David (« finir
 * le pilote », report automatique choisi le 26/11 ; livre de règles français v2.2, pages imprimées).
 *
 * Un Voyageur n'a pas de points de vie : les dégâts frappent l'END, puis la FOR ou la DEX au choix
 * de la cible, puis la dernière ; FOR ou DEX à 0, il est inconscient ; les trois à 0, il est tué
 * (p. 74). Les MD des caractéristiques blessées sont recalculés (p. 74). Une arme incapacitante ne
 * touche que l'END, et neutralise la cible pour autant de rounds que l'excédent (p. 76). Un soin se
 * répartit équitablement entre les caractéristiques blessées (p. 79).
 *
 * La santé principale du pilote est le **total END + FOR + DEX** : elle perd exactement ce que les
 * trois perdent, et atteint zéro avec la mort. Elle se recalcule sur les trois à chaque coup : une
 * caractéristique corrigée à la main ne doit pas laisser la jauge mentir. Elle ne s'écrit pas ici —
 * la porte applique l'impact à la santé principale, et l'écrire deux fois la compterait deux fois.
 *
 * Une créature n'a pas ces trois champs, mais des PdV (p. 81) : la règle se retire, et le coup suit
 * la jauge.
 */
export type RegleDuPhysiqueDeTraveller = NonNullable<GameDriver['combat']['physiqueTraveller']>;

type StatsLues = readonly { fieldId: string; max?: string; isMainHP?: boolean }[] | undefined;

const NOMS: Record<keyof PhysiqueDeTraveller, string> = { endurance: 'END', force: 'FOR', dexterite: 'DEX' };
const ORDRE = ['endurance', 'force', 'dexterite'] as const;
const signe = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

/** « Dextérité », « DEX » ou « dexterite » sur la fiche : l'excédent va à la DEX ; tout le reste, à la FOR. */
export function excedentVers(valeur: unknown): 'force' | 'dexterite' {
    return /^\s*d[eé]x/i.test(String(valeur ?? '')) ? 'dexterite' : 'force';
}

const ETATS: Record<EtatPhysiqueDeTraveller, string> = {
    debout: '',
    inconscient: ' — inconscient : un test d’END par minute pour reprendre conscience, MD+1 cumulatif par échec (p. 80).',
    mort: ' — FOR, DEX et END à 0 : le Voyageur est tué (p. 74).',
};

export function physiqueDeTravellerSelonLeJeu(
    regle: RegleDuPhysiqueDeTraveller | undefined,
    fiche: Record<string, unknown> | undefined,
    impact: DamageImpact,
    stats: StatsLues,
): { impact: DamageImpact; fiche: Record<string, number>; texte: string } | null {
    if (!regle || regle.mecanique !== 'traveller') return null;
    const champs = { endurance: regle.endurance, force: regle.force, dexterite: regle.dexterite };
    const lus = ORDRE.map(c => valeurDuChamp(fiche, champs[c]));
    // Une créature n'a que ses PdV : sans les trois caractéristiques, le coup suit la jauge.
    if (lus.some(v => v === undefined)) return null;
    const avant: PhysiqueDeTraveller = {
        endurance: Math.max(0, Math.trunc(lus[0]!)), force: Math.max(0, Math.trunc(lus[1]!)), dexterite: Math.max(0, Math.trunc(lus[2]!)),
    };
    // Un niveau « sans blessure » resté en deçà de la valeur saisie ne la plafonne pas : la fiche fait foi.
    const maximum: PhysiqueDeTraveller = {
        endurance: Math.max(avant.endurance, maximumDeLaJauge(champs.endurance, stats, fiche) ?? 0),
        force: Math.max(avant.force, maximumDeLaJauge(champs.force, stats, fiche) ?? 0),
        dexterite: Math.max(avant.dexterite, maximumDeLaJauge(champs.dexterite, stats, fiche) ?? 0),
    };
    const total = (p: PhysiqueDeTraveller) => p.endurance + p.force + p.dexterite;
    const principale = stats?.find(s => s.isMainHP)?.fieldId;
    const santeAvant = principale !== undefined && valeurDuChamp(fiche, principale) !== undefined
        ? Math.max(0, Math.trunc(valeurDuChamp(fiche, principale)!)) : total(avant);

    let apres: PhysiqueDeTraveller;
    let texte: string;
    if (impact.isRecovery) {
        const soin = soignerTraveller(avant, maximum, impact.value);
        apres = soin;
        texte = `${soin.rendus} point${soin.rendus > 1 ? 's' : ''} rendu${soin.rendus > 1 ? 's' : ''}, répartis équitablement (p. 79)`;
    } else if (/incapacit/i.test(impact.type ?? '')) {
        const points = Math.min(avant.endurance, Math.max(0, Math.trunc(impact.value)));
        const rounds = Math.max(0, Math.trunc(impact.value) - avant.endurance);
        apres = { ...avant, endurance: avant.endurance - points };
        texte = `${impact.value} dégâts incapacitants, sur l’END seule (p. 76)`
            + (apres.endurance === 0 ? ` — neutralisé${rounds > 0 ? ` ${rounds} round${rounds > 1 ? 's' : ''}` : ''}, guéri après une heure de repos` : '');
    } else {
        const e = encaisserTraveller(avant, impact.value, excedentVers(regle.excedent ? fiche?.[regle.excedent] : undefined));
        apres = e;
        texte = `${impact.value} dégât${impact.value > 1 ? 's' : ''}`;
    }

    const changements = ORDRE.filter(c => apres[c] !== avant[c]).map(c => {
        const md = mdDeCaracteristique(apres[c]);
        return `${NOMS[c]} ${avant[c]} → ${apres[c]}${mdDeCaracteristique(avant[c]) !== md ? ` (MD ${signe(md)})` : ''}`;
    });
    const ecrire: Record<string, number> = {};
    for (const c of ORDRE) {
        ecrire[champs[c]] = apres[c];
        const champMd = regle.md?.[champs[c]];
        if (champMd) ecrire[champMd] = mdDeCaracteristique(apres[c]);
    }
    const santeApres = total(apres);
    const etat = encaisserTraveller(apres, 0, 'force').etat;
    return {
        impact: { ...impact, value: Math.abs(santeAvant - santeApres), isRecovery: santeApres > santeAvant },
        fiche: ecrire,
        texte: `${texte}${changements.length ? ` : ${changements.join(', ')}` : ' : rien à changer'}${impact.isRecovery ? '.' : ETATS[etat] || '.'}`,
    };
}

/**
 * **Ce que la fiche de Traveller recalcule à l'enregistrement** (26/11/2026). Les MD se lisent sur
 * le niveau de chaque caractéristique (table p. 9) : un joueur qui monte sa DEX de 8 à 9 gagne MD+1,
 * et l'initiative (2D + MD DEX − 8, p. 71) le lit sur la fiche. La santé principale est le total
 * END + FOR + DEX. Un niveau « sans blessure » inférieur à la valeur saisie remonte jusqu'à elle :
 * c'est un personnage qu'on crée ou qui progresse, pas un blessé (un blessé est en deçà).
 *
 * Rend seulement ce qui change. Les mêmes calculs que la porte des dégâts : un coup et une
 * saisie laissent la fiche dans le même état.
 */
export function alignerLaFicheDeTraveller(
    pilote: { jet?: { traveller?: { md?: Record<string, string> } }; combat?: { physiqueTraveller?: RegleDuPhysiqueDeTraveller; statsToTrack?: StatsLues } } | null | undefined,
    valeurs: Record<string, unknown>,
): Record<string, number> {
    const regle = pilote?.combat?.physiqueTraveller;
    const md = { ...(pilote?.jet?.traveller?.md ?? {}), ...(regle?.md ?? {}) };
    if (!regle && Object.keys(md).length === 0) return {};
    const maj: Record<string, number> = {};
    const lire = (champ: string) => valeurDuChamp(valeurs, champ);
    for (const [caracteristique, champMd] of Object.entries(md)) {
        const niveau = lire(caracteristique);
        if (niveau === undefined) continue;
        const attendu = mdDeCaracteristique(niveau);
        if (lire(champMd) !== attendu) maj[champMd] = attendu;
    }
    if (regle?.mecanique === 'traveller') {
        const niveaux = ORDRE.map(c => lire(regle[c]));
        if (regle.maximum) ORDRE.forEach((c, i) => {
            const max = lire(regle.maximum![c]);
            if (niveaux[i] !== undefined && (max === undefined || max < niveaux[i]!)) maj[regle.maximum![c]] = Math.trunc(niveaux[i]!);
        });
        const principale = pilote?.combat?.statsToTrack?.find(s => s.isMainHP)?.fieldId;
        if (principale && niveaux.every(v => v !== undefined)) {
            const total = niveaux.reduce((t, v) => t! + Math.max(0, Math.trunc(v!)), 0)!;
            if (lire(principale) !== total) maj[principale] = total;
        }
    }
    return maj;
}
