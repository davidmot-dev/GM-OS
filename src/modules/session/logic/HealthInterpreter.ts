import type { HealthSystem, DamageImpact } from '../useSessionOSStore';

/**
 * Le palier de blessure courant, tel qu'on l'affiche.
 *
 * **Pourquoi cette fonction existe.** Les écrans de la tablette lisaient un
 * `data.currentLevel` que rien n'écrit : le modèle « blessures » est une liste
 * de paliers et un index, pas un libellé. Chacun rendait donc une chaîne vide,
 * sans erreur. Lire le modèle à un seul endroit est ce qui empêche la prochaine
 * divergence.
 *
 * `currentIndex` vaut -1 quand le personnage est indemne — d'où la chaîne vide,
 * qui est la bonne réponse et non un échec.
 */
/**
 * Le palier de blessure courant.
 *
 * **Ne demande que `data`**, parce qu'il ne lit que `data` : exiger un
 * `HealthSystem` complet interdisait de l'appeler avec le porteur plus permissif
 * de `SanteDuCombattant`, et poussait à écrire un `as` qui aurait masqué la
 * prochaine incompatibilité réelle.
 */
export function woundLabel(health: { data: Record<string, unknown> }): string {
    const levels = listeOuVide<string>(health.data.levels);
    const index = nombreOuRepli(health.data.currentIndex, -1);
    return levels[index] ?? '';
}

/**
 * **Les trois lectures de `data`, au même endroit que le reste du modele.**
 *
 * `HealthSystem.data` est un `Record<string, unknown>` : c'est le pilote du jeu
 * qui decide de ce qu'il y met, et rien ne garantit qu'un champ attendu soit la.
 * Chaque ecran s'etait donc ecrit sa propre parade, et deux d'entre elles
 * etaient fausses — `HealthManager` lisait `Number(data.current) ?? repli`, ou
 * le repli ne peut JAMAIS se declencher : `Number()` rend `NaN`, jamais `null`.
 * La barre de vie affichait donc `NaN` la ou elle devait retomber sur le PJ.
 *
 * *Une garde qu'on reecrit a chaque appel est une garde qu'on reecrit mal une
 * fois sur deux.* C'est la raison d'etre de `woundLabel` juste au-dessus, et
 * c'est exactement la meme ici.
 */

/**
 * Un nombre utilisable, ou le repli.
 *
 * ⚠️ `Number()` seul ne suffit pas, et pas seulement a cause du `NaN` :
 * `Number(null)` vaut **0**, et `Number('')` aussi. Un champ absent rendrait
 * donc une jauge a zero — un personnage annonce mort — la ou le repli disait 10.
 * D'ou le tri par type avant toute conversion.
 */
export function nombreOuRepli(valeur: unknown, repli: number): number {
    if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : repli;
    if (typeof valeur === 'string' && valeur.trim() !== '') {
        const nombre = Number(valeur);
        if (Number.isFinite(nombre)) return nombre;
    }
    return repli;
}

/** La liste, ou une liste vide — jamais `undefined`, que `.map()` ferait exploser. */
export function listeOuVide<T>(valeur: unknown): T[] {
    return Array.isArray(valeur) ? (valeur as T[]) : [];
}

/**
 * L'objet, ou un objet vide.
 *
 * `typeof null === 'object'` : le test sur `null` n'est pas superflu, et un
 * tableau non plus n'est pas la table de zones qu'attend la silhouette.
 */
export function objetOuVide<T>(valeur: unknown): Record<string, T> {
    return valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
        ? (valeur as Record<string, T>)
        : {};
}

/**
 * HealthInterpreter
 * HealthInterpreter
 * Pure logic for calculating health state transitions.
 * Decoupled from React and Store for maximum testability.
 */
export const HealthInterpreter = {
    /**
     * Creates a default health system structure for a given type.
     */
    createDefault: (type: HealthSystem['type']): HealthSystem => {
        switch (type) {
            case 'hp':
                return { type: 'hp', data: { current: 10, max: 10 }, state: 'healthy', badges: [] };
            case 'clocks':
                return { type: 'clocks', data: { filled: 0, segments: 6 }, state: 'healthy', badges: [] };
            case 'anatomy':
                return { 
                    type: 'anatomy', 
                    data: { 
                        parts: { 
                            head: { status: 'healthy' }, 
                            torso: { status: 'healthy' }, 
                            leftArm: { status: 'healthy' }, 
                            rightArm: { status: 'healthy' },
                            leftLeg: { status: 'healthy' },
                            rightLeg: { status: 'healthy' }
                        } 
                    }, 
                    state: 'healthy', 
                    badges: [] 
                };
            case 'wounds':
                return { 
                    type: 'wounds', 
                    data: { 
                        levels: ['Sonne', 'Blesse', 'Grave', 'Critique'], 
                        currentIndex: -1 
                    }, 
                    state: 'healthy', 
                    badges: [] 
                };
            case 'boxes':
                return { 
                    type: 'boxes', 
                    data: { 
                        boxes: [
                            { label: 'Leger', filled: false },
                            { label: 'Leger', filled: false },
                            { label: 'Grave', filled: false },
                            { label: 'Grave', filled: false },
                            { label: 'Critique', filled: false }
                        ]
                    }, 
                    state: 'healthy', 
                    badges: [] 
                };
            default:
                return { type: 'hp', data: { current: 10, max: 10 }, state: 'healthy', badges: [] };
        }
    },

    /**
     * Calculates the next state of a health system based on an impact.
     */
    calculateNextState: (current: HealthSystem, impact: DamageImpact): HealthSystem => {
        const processedImpact = HealthInterpreter.processResistances(current, impact);
        const next: HealthSystem = JSON.parse(JSON.stringify(current)); // Deep clone

        switch (current.type) {
            case 'hp':
                return HealthInterpreter.handleHP(next, processedImpact);
            case 'clocks':
                return HealthInterpreter.handleClocks(next, processedImpact);
            case 'anatomy':
                return HealthInterpreter.handleAnatomy(next, processedImpact);
            case 'wounds':
                return HealthInterpreter.handleWounds(next, processedImpact);
            case 'boxes':
                return HealthInterpreter.handleBoxes(next, processedImpact);
            default:
                return next;
        }
    },

    /**
     * Processes resistances and vulnerabilities based on tags in the health system data.
     */
    processResistances: (health: HealthSystem, impact: DamageImpact): DamageImpact => {
        if (!impact.type || impact.isRecovery) return impact;

        const tags = listeOuVide<string>(health.data.tags);
        let multiplier = 1;

        // Check for specific tags: res_FIRE, vul_COLD, etc.
        if (tags.includes(`res_${impact.type.toLowerCase()}`)) multiplier *= 0.5;
        if (tags.includes(`vul_${impact.type.toLowerCase()}`)) multiplier *= 2.0;
        if (tags.includes(`imm_${impact.type.toLowerCase()}`)) multiplier = 0;

        return {
            ...impact,
            value: Math.floor(impact.value * multiplier)
        };
    },

    handleHP: (health: HealthSystem, impact: DamageImpact): HealthSystem => {
        const currentHp = nombreOuRepli(health.data.current, 0);
        const maxHp = nombreOuRepli(health.data.max, 10);
        
        let nextHp = impact.isRecovery ? currentHp + impact.value : currentHp - impact.value;
        nextHp = Math.max(0, Math.min(maxHp, nextHp));

        let state: HealthSystem['state'] = 'healthy';
        const pct = (nextHp / maxHp) * 100;

        if (nextHp === 0) state = 'dead';
        else if (pct <= 25) state = 'critical';
        else if (pct <= 50) state = 'wounded';
        else if (pct <= 85) state = 'scratched';
        else state = 'healthy';

        return {
            ...health,
            data: { ...health.data, current: nextHp },
            state
        };
    },

    handleClocks: (health: HealthSystem, impact: DamageImpact): HealthSystem => {
        const filled = nombreOuRepli(health.data.filled, 0);
        const segments = nombreOuRepli(health.data.segments, 6);

        let nextFilled = impact.isRecovery ? filled - impact.value : filled + impact.value;
        nextFilled = Math.max(0, Math.min(segments, nextFilled));

        let state: HealthSystem['state'] = 'healthy';
        if (nextFilled === segments) state = 'dead';
        else if (nextFilled >= segments * 0.75) state = 'critical';
        else if (nextFilled >= segments * 0.5) state = 'wounded';
        else if (nextFilled > 0) state = 'scratched';

        return {
            ...health,
            data: { ...health.data, filled: nextFilled },
            state
        };
    },

    handleAnatomy: (health: HealthSystem, impact: DamageImpact): HealthSystem => {
        const location = impact.location || 'torso';
        
        // Deep clone the parts map
        const parts = { ...objetOuVide<{ status: string }>(health.data.parts) };
        const part = { ...(parts[location] || { status: 'healthy' }) };
        
        const currentStatus = part.status || 'healthy';
        
        const statusMap = ['healthy', 'injured', 'crippled'];
        const currentIndex = statusMap.indexOf(currentStatus);
        
        // Always fallback to 0 if status is unknown
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        
        let nextIndex;
        if (!impact.isRecovery) {
            // Forward: Healthy (0) -> Injured (1) -> Crippled (2) -> Healthy (0)
            nextIndex = (safeIndex + 1) % statusMap.length;
        } else {
            // Backward: Healthy (0) -> Crippled (2) -> Injured (1) -> Healthy (0)
            nextIndex = (safeIndex - 1 + statusMap.length) % statusMap.length;
        }
        
        part.status = statusMap[nextIndex];
        
        // Update the parts map with the modified part
        parts[location] = part;

        // Fatal areas check
        const isFatal = (location === 'head' || location === 'torso') && parts[location].status === 'crippled';

        let state: HealthSystem['state'] = 'healthy';
        const allParts = Object.values(parts) as { status: string }[];
        if (isFatal) state = 'dead';
        else if (allParts.some(p => p.status === 'crippled')) state = 'critical';
        else if (allParts.some(p => p.status === 'injured')) state = 'wounded';
        else state = 'healthy';

        return {
            ...health,
            data: { ...health.data, parts },
            state
        };
    },
    
    handleWounds: (health: HealthSystem, impact: DamageImpact): HealthSystem => {
        const levels = listeOuVide<string>(health.data.levels);
        const currentIndex = nombreOuRepli(health.data.currentIndex, -1);
        
        let nextIndex = impact.isRecovery ? currentIndex - impact.value : currentIndex + impact.value;
        nextIndex = Math.max(-1, Math.min(levels.length - 1, nextIndex));
        
        let state: HealthSystem['state'] = 'healthy';
        if (nextIndex === levels.length - 1) state = 'dead';
        else if (nextIndex >= (levels.length / 2)) state = 'critical';
        else if (nextIndex >= 0) state = 'wounded';
        
        return {
            ...health,
            data: { ...health.data, currentIndex: nextIndex },
            state
        };
    },

    handleBoxes: (health: HealthSystem, impact: DamageImpact): HealthSystem => {
        const boxes = listeOuVide<{ label: string; filled: boolean }>(health.data.boxes);
        const filledCount = boxes.filter(b => b.filled).length;
        
        let nextCount = impact.isRecovery ? filledCount - impact.value : filledCount + impact.value;
        nextCount = Math.max(0, Math.min(boxes.length, nextCount));
        
        const nextBoxes = boxes.map((box, i) => ({
            ...box,
            filled: i < nextCount
        }));
        
        let state: HealthSystem['state'] = 'healthy';
        if (nextCount === boxes.length) state = 'dead';
        else if (nextCount >= boxes.length * 0.75) state = 'critical';
        else if (nextCount > 0) state = 'wounded';
        
        return {
            ...health,
            data: { ...health.data, boxes: nextBoxes },
            state
        };
    }
};
