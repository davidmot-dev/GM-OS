import { HealthInterpreter } from '../session/logic/HealthInterpreter';
import type { HealthSystem } from '../../types/entity.types';
import type { ChangementDuHeros } from './gestesDesHeros';
import { avecOrigine } from '../session/logic/origineDesModifications';

/**
 * **Écrire les changements d'un geste sur les fiches** — NOC, 2026-10-16.
 *
 * ⛔ **Un seul écrivain pour la santé.** Chez NOC, le champ « Blessures » de la
 * fiche n'est qu'un reflet : les dix cases de la santé le réécrivent à chaque
 * coup (`updateCharacterHealth`, `casesDeSante.champ`). Baisser le champ seul,
 * c'était le voir remonter au coup suivant. Quand un geste touche ce champ, on
 * passe donc par les cases, qui le reportent elles-mêmes sur la fiche.
 */
interface FicheEcrivable {
    id: string;
    sheetData?: Record<string, unknown>;
    healthSystem?: HealthSystem;
}
export interface EcrivainDesHeros {
    players: readonly { id: string; characters: readonly FicheEcrivable[] }[];
    updateCharacter: (playerId: string, characterId: string, updates: { sheetData: Record<string, unknown> }) => void;
    updateCharacterHealth: (playerId: string, characterId: string, health: HealthSystem) => void;
}

/** Le champ de la fiche que portent les cases de santé du personnage, s'il y en a un. */
function champDesCases(sante: HealthSystem | undefined): string | undefined {
    return sante?.type === 'boxes' && typeof sante.data.champ === 'string' && sante.data.champ ? sante.data.champ : undefined;
}

/** Le journal dit « (geste de table) » pour ce que ces gestes écrivent (H1, 2026-10-22). */
export function ecrireLesHeros(changements: ChangementDuHeros[], ecrivain: EcrivainDesHeros): number {
    return avecOrigine('geste de table', () => ecrireLesHerosSansOrigine(changements, ecrivain));
}

function ecrireLesHerosSansOrigine(changements: ChangementDuHeros[], ecrivain: EcrivainDesHeros): number {
    let ecrites = 0;
    for (const c of changements) {
        if (Object.keys(c.maj).length === 0) continue;
        const fiche = ecrivain.players.find(p => p.id === c.joueurId)?.characters.find(x => x.id === c.herosId);
        if (!fiche) continue;
        ecrivain.updateCharacter(c.joueurId, c.herosId, { sheetData: { ...fiche.sheetData, ...c.maj } });

        const sante = fiche.healthSystem;
        const champ = champDesCases(sante);
        if (sante && champ && champ in c.maj) {
            const cochees = (Array.isArray(sante.data.boxes) ? sante.data.boxes as { filled?: boolean }[] : []).filter(b => b.filled).length;
            const ecart = Number(c.maj[champ]) - cochees;
            if (Number.isFinite(ecart) && ecart !== 0) {
                ecrivain.updateCharacterHealth(c.joueurId, c.herosId,
                    HealthInterpreter.handleBoxes(sante, { value: Math.abs(ecart), isRecovery: ecart < 0 }));
            }
        }
        ecrites++;
    }
    return ecrites;
}
