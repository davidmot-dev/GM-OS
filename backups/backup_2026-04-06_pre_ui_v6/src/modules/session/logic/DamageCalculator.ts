import type { DamageImpact } from '../useSessionOSStore';

/**
 * DamageCalculator
 * Translates dice results and system rules into a universal DamageImpact.
 * This is the bridge between the Rule-Engine/Dice and the Health System.
 */
export const DamageCalculator = {
    /**
     * Translates a raw value (dice sum, degree of success) into a specific impact.
     * @param rollResult The numeric result of the action.
     * @param systemType The game system identifier (Forge).
     * @param options Additional context like localized target or damage type.
     */
    translateRoll: (
        rollResult: number, 
        systemType: string = 'generic', 
        options: { location?: string; type?: string; isRecovery?: boolean } = {}
    ): DamageImpact => {
        const type = systemType.toUpperCase();

        // 1. BitD (Blades in the Dark) - Stress & Clocks
        if (type === 'BITD' || type === 'BLADES') {
            // In BitD, a single action usually fills 1, 2, or 3 segments
            // This is often more binary than d20 systems.
            return { value: rollResult || 1, ...options };
        }

        // 2. PbtA (Powered by the Apocalypse) - Harm
        if (type === 'PBTA' || type === 'DUNGEONWORLD') {
            // Standard PbtA mapping if rollResult is used as degree
            // 7-9 = 1 harm, <7 = 2 harm, 10+ = 0 harm
            if (rollResult >= 10) return { value: 0, ...options };
            if (rollResult >= 7) return { value: 1, ...options };
            return { value: 2, ...options };
        }

        // 3. Narrative Systems (Fate, etc.)
        if (type === 'FATE' || type === 'FORGED') {
            // Shifts/Successes are directly converted
            return { value: rollResult, ...options };
        }

        // 4. Standard D20 / HP systems: 1-to-1 mapping
        return { value: rollResult, ...options };
    },

    /**
     * Specialized logic for multi-stage systems like BitD Harm vs Stress.
     */
    processMultiStage: (value: number, profile: 'stress' | 'harm' | 'vitals'): number => {
        switch(profile) {
            case 'stress': return Math.min(value, 3); // Capped impact
            case 'harm': return value; // Direct impact
            default: return value;
        }
    },

    /**
     * Creates a recovery impact.
     */
    createRecovery: (value: number, options: { location?: string; type?: string } = {}): DamageImpact => {
        return { value, ...options, isRecovery: true };
    }
};
