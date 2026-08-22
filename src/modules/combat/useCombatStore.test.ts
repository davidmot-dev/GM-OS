
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

/**
 * Ce que ces tests protègent : **un combat appartient à une scène, et les
 * combats se garent au lieu de se superposer**.
 *
 * Demandes de David du 2026-08-17. La première parce qu'un combat non rattaché
 * n'entre dans aucun résumé de séance — le journal saura qu'il a eu lieu, jamais
 * où. La seconde parce qu'*un meneur ne joue pas deux combats à la fois, il
 * alterne* : plutôt que rendre le combat multiple (48 fichiers le lisent, tous
 * supposant une instance unique), on gare le plateau sous sa scène.
 */
describe('le combat et sa scène', () => {
    beforeEach(() => {
        useCombatStore.getState().reset();
        useCombatStore.setState({ combatsGares: {} });
    });

    const unCombattant = (name: string) => ({
        name, init: 10, hp: 10, hpMax: 10, isPlayer: false, faction: 'enemy' as const, statuses: [],
    });

    it('garer une scène et revenir rend le plateau, le tour et le round', () => {
        const store = () => useCombatStore.getState();

        store().rattacherLeCombat('scene-A');
        store().addCombatant(unCombattant('Goule'));
        useCombatStore.setState({ round: 4, currentTurnIdx: 1 });

        store().basculerVersLaScene('scene-B');
        expect(store().sceneId).toBe('scene-B');
        expect(store().combatants, 'la scène B n\'a jamais eu de combat').toHaveLength(0);
        expect(store().round).toBe(1);

        store().addCombatant(unCombattant('Pirate'));
        store().basculerVersLaScene('scene-A');

        expect(store().sceneId).toBe('scene-A');
        expect(store().combatants.map(c => c.name)).toEqual(['Goule']);
        expect(store().round, 'le round revient avec son plateau').toBe(4);
        expect(store().currentTurnIdx).toBe(1);

        // Et la scène B n'a rien perdu en attendant son tour.
        expect(store().combatsGares['scene-B'].combatants.map(c => c.name)).toEqual(['Pirate']);
    });

    it('basculer vers la scène courante ne fait rien', () => {
        const store = () => useCombatStore.getState();
        store().rattacherLeCombat('scene-A');
        store().addCombatant(unCombattant('Goule'));

        store().basculerVersLaScene('scene-A');

        expect(store().combatants).toHaveLength(1);
    });

    it('terminer le combat le retire du garage et le détache', () => {
        // Sans ce nettoyage, revenir sur la scène ressusciterait les morts d'un
        // combat déjà résumé au journal.
        const store = () => useCombatStore.getState();
        store().rattacherLeCombat('scene-A');
        store().addCombatant(unCombattant('Goule'));
        store().basculerVersLaScene('scene-B');
        store().basculerVersLaScene('scene-A');

        store().clearCombatants();

        expect(store().sceneId).toBeNull();
        expect(store().combatsGares['scene-A']).toBeUndefined();
        expect(store().combatants).toHaveLength(0);
    });

    it('réinitialiser détache le combat de sa scène', () => {
        // Garder le rattachement ferait entrer le combat SUIVANT dans le résumé
        // de la scène précédente.
        useCombatStore.getState().rattacherLeCombat('scene-A');
        useCombatStore.getState().reset();
        expect(useCombatStore.getState().sceneId).toBeNull();
    });
});

describe('un combattant ajouté est toujours complet', () => {
    /**
     * **Le défaut tombé en séance le 2026-08-17.** `rattacherLeCombat`
     * construisait ses PJ avec un `as unknown as Omit<Combatant, 'id'>` — le
     * cast a fait taire le compilateur sur un objet qui disait `initiative` au
     * lieu d'`init` et **oubliait `statuses`**. `CombatCard` lit
     * `combatant.statuses.length` : « Cannot read properties of undefined ».
     *
     * On vérifie l'invariant au goulot plutôt que de rendre le lecteur
     * tolérant : un combattant sans liste d'états est malformé, et l'accepter en
     * silence masquerait la prochaine occurrence.
     */
    beforeEach(() => useCombatStore.getState().reset());

    it('complète les états manquants au lieu de laisser passer un trou', () => {
        // Le cast reproduit exactement le geste fautif : c'est ce qu'on protège.
        const malforme = { name: 'Sans états', init: 0, isPlayer: false } as unknown as Parameters<
            ReturnType<typeof useCombatStore.getState>['addCombatant']
        >[0];
        useCombatStore.getState().addCombatant(malforme);
        const ajoute = useCombatStore.getState().combatants[0];
        expect(Array.isArray(ajoute.statuses), 'CombatCard lit statuses.length').toBe(true);
        /*
          **Ce test exigeait « enemy », et il gravait le défaut.** Un combattant
          dont personne n'a dit le camp arrivait en CIBLE dans le rapport du
          Cortex — et faussait l'estimation de déroute. `neutral` ne prétend
          rien : le Cortex le nomme sans le ranger d'aucun côté.
        */
        expect(ajoute.faction, 'sans camp déclaré, on ne suppose pas l’hostilité').toBe('neutral');
    });

    it('les PJ d\'une scène rattachée entrent bien formés', () => {
        useCombatStore.getState().rattacherLeCombat('scene-sans-store');
        // Sans magasin de séance, personne n'entre — mais rien ne casse non
        // plus : un combat ne s'interrompt pas parce que la trame est absente.
        expect(useCombatStore.getState().combatants).toEqual([]);
        expect(useCombatStore.getState().sceneId).toBe('scene-sans-store');
    });
});

describe('la réparation à la lecture du stockage', () => {
    /**
     * **Le défaut a survécu à son correctif.** Poser l'invariant dans
     * `addCombatant` protégeait les combattants suivants ; celui qui était déjà
     * en stockage revenait intact à chaque démarrage, et `CombatCard` plantait
     * avant qu'on puisse seulement vider le combat.
     *
     * *Une garantie posée en écriture ne dit rien des données écrites avant
     * elle.* Le `merge` du persist est le seul endroit qui atteigne l'existant.
     */
    it('complète les états manquants du plateau ET des combats garés', () => {
        const persist = (useCombatStore as unknown as {
            persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }).persist;
        const merge = persist.getOptions().merge!;

        const repare = merge(
            {
                combatants: [{ id: 'c1', name: 'Ancien', init: 0, isPlayer: false, faction: 'enemy' }],
                combatsGares: {
                    'scene-A': {
                        round: 2, currentTurnIdx: 0,
                        combatants: [{ id: 'c2', name: 'Garé', init: 0, isPlayer: false, faction: 'enemy' }],
                    },
                },
            },
            useCombatStore.getState(),
        ) as { combatants: { statuses: unknown[] }[]; combatsGares: Record<string, { combatants: { statuses: unknown[] }[] }> };

        expect(repare.combatants[0].statuses, 'le plateau courant').toEqual([]);
        expect(repare.combatsGares['scene-A'].combatants[0].statuses, 'et les combats garés').toEqual([]);
    });

    it('un stockage vide ne fabrique rien', () => {
        const merge = (useCombatStore as unknown as {
            persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }).persist.getOptions().merge!;

        const repare = merge(undefined, useCombatStore.getState()) as {
            combatants: unknown[]; combatsGares: Record<string, unknown>;
        };
        expect(repare.combatants).toEqual([]);
        expect(repare.combatsGares).toEqual({});
    });
});
