import { DiceEngine } from '../../dice/DiceEngine';
import type { Combatant, StatusEffect } from '../types';
import { pointsDeVieApres } from './SanteDuCombattant';

/**
 * Mappe les conflits entre effets d'état.
 * L'ajout d'une clé supprimera automatiquement ses valeurs associées.
 */
export const STATUS_CONFLICT_MAP: Record<string, string[]> = {
    'En feu': ['Mouillé', 'Sous l\'eau', 'Gelé'],
    'Mouillé': ['En feu'],
    'Sous l\'eau': ['En feu'],
    'Gelé': ['En feu'],
    'Inconscient': ['Debout', 'En garde'],
    'Debout': ['À terre'],
    'À terre': ['Debout'],
    'Invisible': ['En feu', 'En garde'],
    'Béni': ['Maudit'],
    'Maudit': ['Béni'],
    'Effrayé': ['Concentration', 'Béni'],
    'Confus': ['Concentration'],
    'Épuisé': ['En garde', 'Concentration'],
    'Agrippé': ['Debout'],
    'Soin': ['Empoisonné', 'Saignement'],
    'Choqué': ['Concentration']
};

/**
 * Règles automatiques pour l'application d'effets selon le type de dégâts.
 */
export const COMBAT_AUTO_STATUS_RULES: Record<string, Omit<StatusEffect, 'id'>> = {
    'feu': { name: 'En feu', duration: 3, icon: '🔥' },
    'froid': { name: 'Gelé', duration: 2, icon: '❄️' },
    'acide': { name: 'Corrodé', duration: 2, icon: '🧪' },
    'foudre': { name: 'Choqué', duration: 1, icon: '⚡' },
    'poison': { name: 'Empoisonné', duration: 5, icon: '🤢' },
    'psychique': { name: 'Confus', duration: 1, icon: '🌀' },
};

/**
 * Génère un identifiant court et robuste pour les effets.
 */
export const generateEffectId = () => Math.random().toString(36).substring(2, 11);

/**
 * Calcule l'impact des dégâts sur un combattant.
 * @returns { finalAmount: number, addedStatus?: Omit<StatusEffect, 'id'>, newHp: number }
 */
export function calculateDamageImpact(params: {
    amount: number;
    type: string;
    target: Combatant;
}) {
    const { amount, type, target } = params;
    const isHeal = amount < 0;
    const typeLower = type.toLowerCase();
    
    let finalAmount = amount;
    
    // 1. Résistances / Vulnérabilités (seulement pour les dégâts)
    if (!isHeal) {
        if (target.immunities?.includes(type)) {
            finalAmount = 0;
        } else if (target.resistances?.includes(type)) {
            finalAmount = Math.floor(amount / 2);
        } else if (target.vulnerabilities?.includes(type)) {
            finalAmount = amount * 2;
        }
    }

    // 2. Calcul du nouveau HP — `undefined` quand le système n'a pas de jauge,
    //    parce qu'inventer un nombre reviendrait à lui donner des PV.
    const newHp = pointsDeVieApres(target, -finalAmount) ?? undefined;

    // 3. Détermination du status automatique
    let statusToAdd: Omit<StatusEffect, 'id'> | null = null;
    
    if (isHeal) {
        statusToAdd = { name: 'Soin', duration: 1, icon: '💖' };
    } else {
        // Cherche une correspondance dans les règles auto
        for (const [key, status] of Object.entries(COMBAT_AUTO_STATUS_RULES)) {
            if (typeLower.includes(key)) {
                statusToAdd = status;
                break;
            }
        }
    }

    return {
        finalAmount,
        newHp,
        statusToAdd
    };
}

/**
 * Filtre les status d'un combattant lors de l'ajout d'un nouvel effet pour gérer les conflits.
 */
export function filterConflictingStatuses(currentStatuses: StatusEffect[], newStatusName: string): StatusEffect[] {
    const conflicts = STATUS_CONFLICT_MAP[newStatusName] || [];
    return currentStatuses.filter(s => !conflicts.includes(s.name));
}

/**
 * Résout une formule complexe d'initiative.
 */
export function resolveInitiativeFormula(params: {
    formula: string;
    combatant: Combatant;
    resolver?: (name: string, combatant: Combatant) => number;
    diceMax?: number;
}): number {
    const { formula, combatant, resolver, diceMax = 20 } = params;
    
    let evaluatedFormula = formula;
    
    if (resolver) {
        // Regex pour capturer [Variable] ou Mots isolés
        const varRegex = /\[([^\]]+)\]|\b([a-zA-ZÀ-ÿ_]+)\b/gi;
        const matches = Array.from(formula.matchAll(varRegex));
        
        // Trier par longueur décroissante pour éviter les collisions (ex: "Strength" avant "Str")
        matches.sort((a, b) => b[0].length - a[0].length);
        
        matches.forEach(match => {
            const fullMatch = match[0];
            const innerVar = match[1] || match[2];
            
            // Ignorer le 'd' des dés (ex: 2d6)
            if (innerVar.toLowerCase() === 'd' && /^\d*d\d+$/i.test(fullMatch)) return;
            
            const val = resolver(innerVar, combatant);
            if (val !== undefined && !Number.isNaN(val)) {
                evaluatedFormula = evaluatedFormula.replace(fullMatch, val.toString());
            }
        });
    }

    // Nettoyage final pour ne garder que ce que DiceEngine comprend
    evaluatedFormula = evaluatedFormula.replace(/[a-zA-ZÀ-ÿ_]+/g, (match) => 
        match.toLowerCase() === 'd' ? 'd' : '0'
    );
    evaluatedFormula = evaluatedFormula.replace(/[^0-9dD+\-*/\s]/g, '');

    try {
        const res = DiceEngine.rollFormula(evaluatedFormula);
        return Number.isNaN(res.total) ? 0 : res.total;
    } catch {
        return Math.floor(Math.random() * diceMax) + 1;
    }
}

/**
 * Décrémente la durée des effets au début du tour.
 */
export function processStatusDurations(statuses: StatusEffect[]): StatusEffect[] {
    return statuses.reduce((acc, s) => {
        if (s.duration === 0) {
            acc.push(s); // Effet permanent
        } else if (s.duration > 1) {
            acc.push({ ...s, duration: s.duration - 1 });
        }
        return acc;
    }, [] as StatusEffect[]);
}
