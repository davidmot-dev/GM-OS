import { describe, expect, it, beforeEach } from 'vitest';
import { composerLEcranDeTable, horlogesPourLEcran, ordreDuTourPourLaTable, CATALOGUE_DE_L_ECRAN, etatDuWidgetDeLEcran } from './ecranDeTable';
import { useUlanziStore } from './useUlanziStore';

/**
 * **L'écran de table** (Fire HD 8, registre § 256, T12). Décisions de David du 15/11/2026 : des
 * widgets choisis à la volée (Q3), une sélection à lui (Q5). Public par construction : ce que les
 * joueurs n'ont pas le droit de voir n'arrive jamais dans ce qui part vers la Fire.
 */
const JEU = 'alien';
const sel = (...ids: string[]) => ({ [JEU]: ids.map(widgetId => ({ widgetId, secondes: 25 })) });
const MONDE = { horloges: [], minuteur: null, temps: null, reserves: [], ordre: null, maintenant: 0 };

describe('ordre du tour', () => {
    const combattants = [
        { name: 'Wilson', isPlayer: true, statuses: [] },
        { name: 'Rôdeur caché', isPlayer: false, statuses: [{ name: 'Caché' }] },
        { name: 'Nel Varga', isPlayer: true, statuses: [] },
        { name: 'Davis', isPlayer: true, statuses: [] },
    ];
    it('rien tant que le combat n’est pas projeté', () => {
        expect(ordreDuTourPourLaTable({ isCombatProjected: false, combatants: combattants, currentTurnIdx: 0 })).toBeNull();
        expect(ordreDuTourPourLaTable({ isCombatProjected: true, combatants: [] })).toBeNull();
    });
    it('qui joue et les deux suivants, sans les combattants cachés', () => {
        expect(ordreDuTourPourLaTable({ isCombatProjected: true, combatants: combattants, currentTurnIdx: 0, round: 3 }))
            .toEqual({ round: 3, actif: 'Wilson', suivants: ['Nel Varga', 'Davis'] });
    });
    it('un combattant caché qui agit reste anonyme', () => {
        const ordre = ordreDuTourPourLaTable({ isCombatProjected: true, combatants: combattants, currentTurnIdx: 1, round: 1 });
        expect(ordre?.actif).toBe('?');
        expect(JSON.stringify(ordre)).not.toContain('Rôdeur');
    });
});

describe('jauges de tension', () => {
    const horloge = { isClockProjected: true, tensions: [
        { id: 'air', name: 'Air restant', totalSegments: 10, filledSegments: 6, surLAfficheur: false },
        { id: 'secret', name: 'Plan de la Compagnie', totalSegments: 4, filledSegments: 1, vueParLesJoueurs: false },
    ] };
    it('toutes celles que les joueurs peuvent voir, même hors de l’Ulanzi ; jamais une jauge cachée', () => {
        const horloges = horlogesPourLEcran(horloge);
        expect(horloges.map(h => h.nom)).toEqual(['Air restant']);
        expect(horlogesPourLEcran({ ...horloge, isClockProjected: false })).toEqual([]);
    });
});

describe('composer l’écran', () => {
    it('rien de coché : l’écran le sait, et ne montre rien', () => {
        expect(composerLEcranDeTable(JEU, {}, MONDE)).toEqual({ tuiles: [], choisi: false });
    });
    it('ne montre que les widgets cochés, dans l’ordre du choix', () => {
        const monde = { ...MONDE,
            horloges: [{ id: 'air', nom: 'Air restant', remplis: 6, total: 10 }],
            minuteur: { restant: 272, duree: 600 },
            ordre: { round: 3, actif: 'Wilson', suivants: ['Nel Varga'] } };
        const ecran = composerLEcranDeTable(JEU, sel('ordre', 'horloges'), monde);
        expect(ecran.choisi).toBe(true);
        expect(ecran.tuiles.map(t => t.id)).toEqual(['ordre', 'horloge:air']);
        expect(ecran.tuiles[1]).toMatchObject({ forme: 'jauge', valeur: 6, max: 10 });
    });
    it('un widget coché sans rien à montrer (combat non projeté) ne laisse pas de tuile vide', () => {
        expect(composerLEcranDeTable(JEU, sel('ordre', 'minuteur'), MONDE)).toEqual({ tuiles: [], choisi: true });
    });
    it('les widgets de Blade Runner ne sont pas encore au catalogue de l’écran', () => {
        expect(CATALOGUE_DE_L_ECRAN.map(w => w.id)).toEqual(['ordre', 'horloges', 'minuteur', 'heure', 'reserves']);
    });
});

describe('la sélection de l’écran', () => {
    beforeEach(() => useUlanziStore.setState({ selection: {}, selectionEcran: {} }));
    it('est séparée de celle de l’Ulanzi', () => {
        useUlanziStore.getState().basculerLeWidgetDeLEcran(JEU, 'ordre');
        useUlanziStore.getState().basculerLeWidgetDeLEcran(JEU, 'horloges');
        expect(useUlanziStore.getState().selectionEcran[JEU]?.map(e => e.widgetId)).toEqual(['ordre', 'horloges']);
        expect(useUlanziStore.getState().selection).toEqual({});
        useUlanziStore.getState().basculerLeWidgetDeLEcran(JEU, 'ordre');
        expect(useUlanziStore.getState().selectionEcran[JEU]?.map(e => e.widgetId)).toEqual(['horloges']);
    });
});

describe('pourquoi un widget coché ne montre rien', () => {
    const combat = { isCombatProjected: false, combatants: [] };
    const jauges = [
        { id: 'air', name: 'Air restant', totalSegments: 10, filledSegments: 6 },
        { id: 'neuve', name: 'Jauge neuve', totalSegments: 4, filledSegments: 0, vueParLesJoueurs: false },
    ];
    it('horloge non projetée, puis jauges secrètes comptées', () => {
        expect(etatDuWidgetDeLEcran('horloges', { isClockProjected: false, tensions: jauges, combat, reserves: 0 })).toEqual({ texte: 'horloge non projetée', vide: true });
        expect(etatDuWidgetDeLEcran('horloges', { isClockProjected: true, tensions: [jauges[1]], combat, reserves: 0 }))
            .toEqual({ texte: 'aucune jauge visible (1 secrète)', vide: true });
        expect(etatDuWidgetDeLEcran('horloges', { isClockProjected: true, tensions: jauges, combat, reserves: 0 }))
            .toEqual({ texte: '1 affichée · 1 secrète', vide: false });
    });
    it('combat non projeté, aucun minuteur, aucune réserve', () => {
        expect(etatDuWidgetDeLEcran('ordre', { combat, reserves: 0 }).texte).toBe('combat non projeté');
        expect(etatDuWidgetDeLEcran('minuteur', { isClockProjected: true, timerDuration: 0, combat, reserves: 0 }).texte).toBe('aucun minuteur');
        expect(etatDuWidgetDeLEcran('reserves', { combat, reserves: 2 })).toEqual({ texte: '2 affichées', vide: false });
    });
});
