import type { Combatant } from '../types';

/**
 * Une seule réponse à « comment va ce combattant ».
 *
 * **Pourquoi ce module existe.** `hp` et `hpMax` sont devenus facultatifs,
 * parce que tous les jeux ne comptent pas la santé en points — chez Dune, « il
 * n'existe aucune jauge numérique de santé sur la feuille de personnage ».
 * Huit endroits lisaient `combatant.hp` directement, chacun avec sa propre idée
 * de ce qu'un zéro voulait dire.
 *
 * **La règle qui les réunit : l'absence n'est pas un zéro.** Un combattant sans
 * jauge n'est pas à l'agonie, il relève d'un jeu qui ne compte pas comme ça.
 * Confondre les deux donnait exactement le défaut redouté — un mourant affiché
 * pour tout le monde, en gris, sans que rien ne soit faux au sens du type.
 *
 * L'autorité est `healthSystem` quand il est là : c'est lui que
 * `HealthInterpreter` fait vivre. `hp` ne sert qu'aux systèmes qui en ont.
 */

/**
 * Comment va ce personnage, **en toutes lettres**, pour l'IA et le journal.
 *
 * **Ce que ça corrige, relevé le 2026-08-14.** Trois écrits envoyaient
 * `HP ${c.hp}/${c.maxHp}` à l'IA et au compte rendu de séance sans jamais
 * consulter le modèle de santé du pilote — `useOracleContext`, `AIService` et
 * `useJournalStore`. Sur Alien, qui n'a pas de points de vie, l'Oracle recevait
 * littéralement **« HP undefined/undefined »** pour chaque personnage, et
 * raisonnait dessus. Le Sage, dont la persona du corpus dit qu'il est
 * « l'assistant technique froid et précis de Maman », ne pouvait que les
 * ignorer ou les inventer.
 *
 * **Rendre `null` plutôt qu'un zéro est le coeur du contrat.** L'appelant qui
 * n'a rien à dire n'écrit rien, au lieu d'écrire une valeur fausse : *l'absence
 * n'est pas un zéro*, et un « 0/0 » dans une invite est une affirmation, pas un
 * silence.
 *
 * L'ordre d'autorité est celui du reste du module — `healthSystem` d'abord,
 * c'est lui que `HealthInterpreter` fait vivre ; la jauge de points ensuite.
 *
 * *Ce que cette fonction ne fait pas encore* : lire les jauges déclarées dans
 * `combat.statsToTrack` du pilote — le Stress d'Alien, sa Santé lue sur la
 * fiche. Elle décrit ce que le combattant porte, pas ce que sa fiche contient.
 */
const ETATS: Record<string, string> = {
    healthy: 'indemne',
    scratched: 'égratigné',
    wounded: 'blessé',
    critical: 'état critique',
    dead: 'hors de combat',
};

/** La forme minimale qu'on sait décrire — `Combatant`, `Entity` ou `PlayerCharacter`. */
export interface PorteurDeSante {
    hp?: number;
    /** `Combatant` dit `hpMax`, `Entity` et `PlayerCharacter` disent `maxHp`. */
    hpMax?: number;
    maxHp?: number;
    healthSystem?: { type: string; data: Record<string, unknown>; state: string };
}

export function decrireLaSante(c: PorteurDeSante): string | null {
    const sys = c.healthSystem;
    if (sys) {
        const etat = ETATS[sys.state] ?? sys.state;
        const d = sys.data ?? {};
        switch (sys.type) {
            case 'hp':
                return typeof d.current === 'number' && typeof d.max === 'number'
                    ? `${d.current}/${d.max} (${etat})`
                    : etat;
            case 'clocks':
                return typeof d.filled === 'number' && typeof d.segments === 'number'
                    ? `horloge de défaite ${d.filled}/${d.segments} (${etat})`
                    : etat;
            case 'wounds': {
                const niveaux = Array.isArray(d.levels) ? (d.levels as string[]) : [];
                const i = typeof d.currentIndex === 'number' ? d.currentIndex : -1;
                return i >= 0 && niveaux[i] ? `blessure « ${niveaux[i]} » (${etat})` : etat;
            }
            case 'boxes': {
                const cases = Array.isArray(d.boxes) ? (d.boxes as { filled?: boolean }[]) : [];
                return cases.length > 0
                    ? `${cases.filter(b => b.filled).length}/${cases.length} cases cochées (${etat})`
                    : etat;
            }
            default:
                return etat;
        }
    }

    const max = c.hpMax ?? c.maxHp;
    if (typeof c.hp === 'number' && typeof max === 'number' && max > 0) return `${c.hp}/${max} PV`;

    // Ni système ni jauge : ce jeu ne compte pas la santé comme ça. On se tait.
    return null;
}

/** Ce combattant a-t-il une jauge de points de vie ? */
export function aUneJaugeDeVie(c: Combatant): boolean {
    return typeof c.hp === 'number' && typeof c.hpMax === 'number' && c.hpMax > 0;
}

/**
 * Part de vie restante, de 0 à 1.
 *
 * **`null` quand il n'y a pas de jauge**, et c'est tout l'intérêt : un appelant
 * qui doit dessiner une barre découvre qu'il n'a rien à dessiner, au lieu d'en
 * dessiner une vide.
 */
export function fractionDeVie(c: Combatant): number | null {
    if (!aUneJaugeDeVie(c)) return null;
    return Math.max(0, Math.min(1, c.hp! / c.hpMax!));
}

/**
 * Le combattant est-il hors de combat ?
 *
 * Ordre d'autorité : l'état calculé par `HealthInterpreter` d'abord, puis la
 * jauge de points de vie. **Sans l'un ni l'autre, la réponse est non** — on ne
 * déclare pas mort un combattant faute d'information.
 */
export function estHorsDeCombat(c: Combatant): boolean {
    if (c.healthSystem) return c.healthSystem.state === 'dead';
    if (aUneJaugeDeVie(c)) return c.hp! <= 0;
    return false;
}

/**
 * Les points de vie après un ajustement, bornés entre zéro et le maximum.
 *
 * `null` sans jauge : il n'y a rien à ajuster, et forcer un nombre reviendrait
 * à créer des PV que le système n'a pas.
 */
export function pointsDeVieApres(c: Combatant, delta: number): number | null {
    if (!aUneJaugeDeVie(c)) return null;
    return Math.min(c.hpMax!, Math.max(0, c.hp! + delta));
}
