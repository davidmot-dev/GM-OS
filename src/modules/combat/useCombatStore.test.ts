
import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { HealthInterpreter } from '../session/logic/HealthInterpreter';

describe('Smart Dispel Logic', () => {
    beforeEach(() => {
        useCombatStore.getState().reset();
    });

    it('should remove conflicting statuses when adding a new one', () => {
        const store = useCombatStore.getState();
        
        // Add a combatant
        store.addCombatant({
            name: 'Test Xeno',
            init: 10,
            hp: 10,
            hpMax: 10,
            isPlayer: false,
            faction: 'enemy',
            statuses: []
        });
        
        const combatantId = useCombatStore.getState().combatants[0].id;
        
        // Add "En feu"
        store.addStatus(combatantId, { name: 'En feu', duration: 3, icon: '🔥' });
        expect(useCombatStore.getState().combatants[0].statuses.some(s => s.name === 'En feu')).toBe(true);
        
        // Add "Mouillé" (should remove "En feu")
        store.addStatus(combatantId, { name: 'Mouillé', duration: 3, icon: '💧' });
        
        const updatedStatusNames = useCombatStore.getState().combatants[0].statuses.map(s => s.name);
        expect(updatedStatusNames).toContain('Mouillé');
        expect(updatedStatusNames).not.toContain('En feu');
    });

    it('should handle multiple conflicts', () => {
        const store = useCombatStore.getState();
        store.addCombatant({ name: 'Test', init: 10, hp: 5, hpMax: 5, isPlayer: false, faction: 'enemy', statuses: [] });
        const id = useCombatStore.getState().combatants[0].id;
        
        store.addStatus(id, { name: 'Mouillé', duration: 0, icon: '💧' });
        store.addStatus(id, { name: 'Debout', duration: 0, icon: '⬆️' });
        
        // Add "En feu" (removes Mouillé)
        store.addStatus(id, { name: 'En feu', duration: 0, icon: '🔥' });
        // Add "Inconscient" (removes Debout)
        store.addStatus(id, { name: 'Inconscient', duration: 0, icon: '💤' });
        
        const names = useCombatStore.getState().combatants[0].statuses.map(s => s.name);
        expect(names).toContain('En feu');
        expect(names).toContain('Inconscient');
        expect(names).not.toContain('Mouillé');
        expect(names).not.toContain('Debout');
    });
});

describe('applyDamage — le système de santé suit les dégâts', () => {
    beforeEach(() => {
        useCombatStore.getState().reset();
    });

    /**
     * **Le défaut que ces tests attrapent.** `HealthInterpreter` sait remplir
     * une horloge, cocher une case, descendre un palier — cinq modèles purs et
     * testés. Rien ne l'appelait depuis le combat : `applyDamage` n'écrivait que
     * `hp`. Un combattant à horloges encaissait donc des coups sans que son
     * horloge ne bouge, et l'écran de la table montrait 0/6 après la bataille.
     *
     * Le modèle existait ; il n'était pas branché. C'est la même forme que les
     * autres chaînes mortes du projet — construites, jamais reliées.
     */
    const ajouterAvec = (type: Parameters<typeof HealthInterpreter.createDefault>[0]) => {
        useCombatStore.getState().addCombatant({
            name: 'Cible',
            init: 0,
            hp: 10,
            hpMax: 10,
            isPlayer: false,
            faction: 'enemy',
            statuses: [],
            healthSystem: HealthInterpreter.createDefault(type),
        });
        return useCombatStore.getState().combatants[0].id;
    };

    it('remplit l\'horloge au lieu de la laisser à zéro', () => {
        const id = ajouterAvec('clocks');
        useCombatStore.getState().applyDamage(2, 'physique', [id]);

        const sante = useCombatStore.getState().combatants[0].healthSystem!;
        expect(sante.data.filled).toBe(2);
        expect(sante.state).toBe('scratched');
    });

    it('un soin vide l\'horloge', () => {
        const id = ajouterAvec('clocks');
        useCombatStore.getState().applyDamage(3, 'physique', [id]);
        useCombatStore.getState().applyDamage(-2, 'physique', [id]);

        expect(useCombatStore.getState().combatants[0].healthSystem!.data.filled).toBe(1);
    });

    it('coche les cases de stress', () => {
        const id = ajouterAvec('boxes');
        useCombatStore.getState().applyDamage(2, 'psychique', [id]);

        const boxes = useCombatStore.getState().combatants[0].healthSystem!.data.boxes as { filled: boolean }[];
        expect(boxes.filter(b => b.filled)).toHaveLength(2);
    });

    it('les résistances ne s\'appliquent qu\'une fois', () => {
        /**
         * `calculateDamageImpact` divise déjà par deux d'après les listes du
         * combattant, et `HealthInterpreter.processResistances` le referait
         * d'après les étiquettes de la fiche de santé. Ne pas transmettre le
         * type de dégâts est ce qui empêche la double division — quatre points
         * résistés doivent remplir deux segments, pas un.
         */
        useCombatStore.getState().addCombatant({
            name: 'Résistant',
            init: 0,
            hp: 10,
            hpMax: 10,
            isPlayer: false,
            faction: 'enemy',
            statuses: [],
            resistances: ['feu'],
            healthSystem: {
                ...HealthInterpreter.createDefault('clocks'),
                data: { filled: 0, segments: 6, tags: ['res_feu'] },
            },
        });
        const id = useCombatStore.getState().combatants[0].id;
        useCombatStore.getState().applyDamage(4, 'feu', [id]);

        expect(useCombatStore.getState().combatants[0].healthSystem!.data.filled).toBe(2);
    });

    it('un combattant sans système de santé reste intact', () => {
        // Tous les pilotes antérieurs sont dans ce cas : ne rien inventer.
        const id = ajouterAvec('hp');
        useCombatStore.getState().updateCombatant(id, { healthSystem: undefined });
        useCombatStore.getState().applyDamage(3, 'physique', [id]);

        expect(useCombatStore.getState().combatants[0].healthSystem).toBeUndefined();
        expect(useCombatStore.getState().combatants[0].hp).toBe(7);
    });
});
