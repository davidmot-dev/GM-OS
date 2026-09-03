import { DiceEngine } from '../../dice/DiceEngine';
import {
    facesDuNiveau, poigneeDepuisLesLettres, type ModificateurDeDes,
} from '../../dice/desEchelonnes';
import { useDiceStore } from '../../../stores/useDiceStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { ActionRegistry } from './types';

interface DiceRollPayload {
    sides?: number;
    die?: number;
    count?: number;
    modifier?: number;
    mode?: string;
    target?: number;
    title?: string;
    formula?: string;
    gearCount?: number;
    useSystem?: boolean;
    /**
     * Le sens de la comparaison, quand l'écran qui lance en a un à dire.
     *
     * Le pupitre du meneur porte un sélecteur `≥ / ≤` ; la tablette n'en a pas,
     * et laisse donc le pilote trancher. Explicite ici pour que le jour où elle
     * en gagne un, la valeur ait déjà son chemin — plutôt qu'un second champ
     * ajouté à côté du premier.
     */
    rule?: 'over' | 'under';
    /**
     * **Les niveaux d'un jet à dés échelonnés, tels que la tablette les envoie.**
     *
     * *Demandé par David le 2026-09-03, après le même défaut au pupitre.* Ce
     * sont des **lettres**, pas des faces : l'échelle appartient au jeu, elle
     * est transcrite une seule fois (`desEchelonnes.ts`) et c'est ici, chez le
     * meneur, qu'on l'applique. *Un écran qui enverrait « 12 » imposerait sa
     * lecture de la règle, et deux écrans finiraient par ne plus la lire
     * pareil.*
     */
    niveauxEchelonnes?: { label: string; lettre: string }[];
    /** Le dé d'équipement, compté à part : ses 1 usent le matériel. */
    equipementEchelonne?: string;
    modificateurEchelonne?: ModificateurDeDes;
}

/**
 * La poignée d'un jet échelonné, ou `null` si la charge n'en décrit pas.
 *
 * L'avantage, le désavantage et le plafond du livre sont appliqués **ici**, par
 * la même fonction que le pupitre et que le panneau de fiche : trois écrans, une
 * seule composition.
 */
function poigneeDeLaCharge(p: DiceRollPayload) {
    if (!p.niveauxEchelonnes?.length) return null;
    const poignee = poigneeDepuisLesLettres(p.niveauxEchelonnes, p.modificateurEchelonne ?? 'aucun');
    if (poignee.des.length === 0) return null;

    const equipement = facesDuNiveau(p.equipementEchelonne ?? '');
    return {
        taillesDeBase: poignee.des.map(d => d.faces),
        taillesSecondaires: equipement !== null ? [equipement] : [],
        libelle: poignee.des.map(d => `D${d.faces}`).join(' + ')
            + (equipement !== null ? ` + D${equipement}` : ''),
    };
}

/**
 * Résout un jet en mode manuel — le MODE est choisi à la main, pas le jeu.
 *
 * **Le sens du comptage n'y arrivait pas, et c'est le même défaut que le pupitre
 * du 2026-08-16.** Cinq modes le prennent — `threshold`, `pool`, `pool_explode`
 * et les deux avantages — et aucun ne le recevait : tous retombaient sur
 * `over`. Sur un jeu qui jette SOUS une Sauvegarde, la tablette d'un joueur
 * rendait donc l'inverse du bon résultat, et **un Avantage y gardait le plus
 * haut** — le pire dé possible.
 *
 * Choisir un mode à la main ne change pas le jeu auquel on joue : le sens vient
 * du pilote quand la charge ne le précise pas. *Un jet qui change selon l'écran
 * d'où on le lance n'est pas le même jet.*
 */
export function rollManually(
    mode: string, sides: number, count: number, modifier: number, target: number,
    p: DiceRollPayload, sens: 'over' | 'under',
) {
    switch (mode) {
        case 'standard': return DiceEngine.rollStandard(sides, count, modifier);
        case 'exploding': return DiceEngine.rollStandard(sides, count, modifier, true);
        case 'threshold': return DiceEngine.rollThreshold(sides, count, modifier, target, sens);
        case 'pool': return DiceEngine.rollPool(sides, count, modifier, target, false, { sens });
        case 'pool_explode': return DiceEngine.rollPool(sides, count, modifier, target, true, { sens });
        case 'advantage': return DiceEngine.rollAdvantage(sides, modifier, true, target, sens);
        case 'disadvantage': return DiceEngine.rollAdvantage(sides, modifier, false, target, sens);
        case 'yze': return DiceEngine.rollYZE(count, p.target || p.gearCount || 0);
        /*
          **Le mode échelonné manquait à cette liste**, et un mode absent d'un
          `switch` ne se plaint pas : il tombait dans le `default` et lançait des
          dés ordinaires. *Le même oubli que la liste des modes du pupitre, qui
          en a coûté deux le 2026-08-30 — une liste de noms recopiée à la main
          dérive le jour où un nom s'ajoute.*

          Sans lettres dans la charge, on retombe sur des dés à six faces, le
          plus petit de l'échelle : **jamais un dé inventé plus gros.**
        */
        case 'yze-echelonne': {
            const poignee = poigneeDeLaCharge(p);
            return DiceEngine.rollYZEEchelonne(
                poignee?.taillesDeBase ?? Array.from({ length: Math.max(1, count) }, () => 6),
                poignee?.taillesSecondaires ?? [],
            );
        }
        case 'fate': return DiceEngine.rollFate(count, modifier);
        case 'rolemaster': return DiceEngine.rollRolemaster(modifier);
        case 'formula': return DiceEngine.rollFormula(p.formula || p.title || '1d20');
        default: return DiceEngine.rollStandard(sides, count, modifier);
    }
}

const roll = (payload: any) => {
    const p = (payload || {}) as DiceRollPayload;
    const sides = p.sides || p.die || 20;
    const count = p.count || 1;
    const modifier = p.modifier || 0;
    const mode = p.mode || 'standard';
    const target = p.target || 10;

    console.log(`[Actions] Global Dice Roll: ${count}d${sides} (${mode})`);

    const activeDriver = useSessionOSStore.getState().getActiveDriver();
    let result;
    let finalTitle = p.title || `${count}d${sides}`;

    // Le pilote de système prime s'il est explicitement demandé.
    if (p.useSystem && activeDriver) {
        /*
          **Les dés échelonnés, reconnus aux mêmes trois signes qu'au pupitre.**

          *Défaut trouvé par David le 2026-09-03 :* la tablette ne lisait que
          `dice.engine`, et un pilote Blade Runner qui déclare `jet.desEchelonnes`
          sans corriger son moteur y lançait une réserve de d6 — des réussites
          plausibles, jamais plus de six, et le dé à douze faces nulle part.

          On force alors le moteur, comme le pupitre et le panneau de fiche : le
          reste du pilote — le sens du comptage, le seuil — continue de valoir.
        */
        const poignee = poigneeDeLaCharge(p);
        const echelonne = !!poignee
            || activeDriver.dice?.engine === 'yze-echelonne'
            || !!activeDriver.jet?.desEchelonnes;

        // `jet.sens` voyage avec `dice` : la tablette doit résoudre exactement
        // comme le pupitre du meneur, sens du comptage compris.
        result = DiceEngine.rollFromConfig(
            {
                ...activeDriver.dice,
                ...(activeDriver.jet?.sens ? { sens: activeDriver.jet.sens } : {}),
                ...(echelonne ? { engine: 'yze-echelonne' as const } : {}),
            },
            {
                modifier,
                baseCount: count,
                gearCount: p.gearCount || 0,
                targetOverwrite: target,
                ...(poignee ? {
                    taillesDeBase: poignee.taillesDeBase,
                    taillesSecondaires: poignee.taillesSecondaires,
                } : {}),
            },
        );
        /* Ce que le meneur relit : la poignée, et pas seulement le nom du jeu. */
        finalTitle = p.title
            || (poignee
                ? `Système (${activeDriver.name}) — ${poignee.libelle}`
                : `Système (${activeDriver.name})`);
    } else {
        /*
          La charge d'abord — un écran qui sait ce qu'il veut a raison —, le
          pilote ensuite, et `over` seulement quand personne ne dit rien : c'est
          la réserve à la Vampire ou Year Zero, et c'était déjà le comportement.
          Un pilote muet ne doit pas changer de sens du jour au lendemain.
        */
        const sens: 'over' | 'under' = p.rule
            ?? (activeDriver?.jet?.sens === 'sous-ou-egal' ? 'under' : 'over');
        result = rollManually(mode, sides, count, modifier, target, p, sens);
    }

    const record = {
        ...result,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        title: finalTitle,
    };

    const diceStore = useDiceStore.getState();
    diceStore.setLastRoll(record);

    if (diceStore.isDiceProjected) {
        diceStore.triggerDiceProjection();
    }
};

const clear = () => {
    console.log('[Actions] Global Clear Dice action');
    useDiceStore.getState().clearHistory();
};

export const diceActions: ActionRegistry = {
    'dice:roll': roll,
    'remote:dice:roll': roll,
    'dice:clear': clear,
    'remote:dice:clear': clear,
    'remote:dice:clear-dice': clear,
};
