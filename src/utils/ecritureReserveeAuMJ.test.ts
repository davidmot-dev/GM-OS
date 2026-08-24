import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Le jumeau de la perte de campagnes du 2026-08-07, sur les stores persistés
 * dans `localStorage`.
 *
 * Le point de vigilance était posé depuis le 07/08 au § 6 du plan Cortex :
 * *« `useCombatStore` est persisté sous `gmos-combat-storage` et écrit par
 * toutes les fenêtres — même configuration que le bug de persistance corrigé le
 * 2026-08-07 sur un autre store. »* Il n'avait jamais été ni traité ni infirmé.
 */

const role = vi.hoisted(() => ({ current: 'gm' as string }));

vi.mock('./windowRole', () => ({
    getWindowRole: () => role.current,
    isMainWindow: () => role.current === 'gm',
}));

const { ecritureReserveeAuMJ } = await import('./ecritureReserveeAuMJ');

/** Un `localStorage` de test, réduit à ce que la garde utilise. */
function magasin() {
    const contenu = new Map<string, string>();
    return {
        contenu,
        storage: {
            getItem: (n: string) => contenu.get(n) ?? null,
            setItem: (n: string, v: string) => { contenu.set(n, v); },
            removeItem: (n: string) => { contenu.delete(n); },
        } as unknown as Storage,
    };
}

beforeEach(() => {
    role.current = 'gm';
});

describe('ecritureReserveeAuMJ', () => {
    it('la fenêtre MJ écrit', () => {
        const { contenu, storage } = magasin();
        ecritureReserveeAuMJ(storage).setItem('gmos-combat-storage', 'plateau');
        expect(contenu.get('gmos-combat-storage')).toBe('plateau');
    });

    it.each(['hub', 'projector', 'tablet', 'remote'])(
        'la fenêtre « %s » n’écrit pas',
        (secondaire) => {
            const { contenu, storage } = magasin();
            role.current = secondaire;

            ecritureReserveeAuMJ(storage).setItem('gmos-combat-storage', 'du hub');

            expect(contenu.has('gmos-combat-storage')).toBe(false);
        },
    );

    it('une fenêtre secondaire n’efface pas non plus', () => {
        const { contenu, storage } = magasin();
        contenu.set('gmos-combat-storage', 'du MJ');
        role.current = 'hub';

        ecritureReserveeAuMJ(storage).removeItem('gmos-combat-storage');

        expect(contenu.get('gmos-combat-storage')).toBe('du MJ');
    });

    it('la lecture reste ouverte à toutes les fenêtres — sinon elles ne pourraient plus s’hydrater', () => {
        const { contenu, storage } = magasin();
        contenu.set('gmos-combat-storage', 'du MJ');

        for (const r of ['gm', 'hub', 'projector', 'tablet', 'remote']) {
            role.current = r;
            expect(ecritureReserveeAuMJ(storage).getItem('gmos-combat-storage')).toBe('du MJ');
        }
    });

    /**
     * **La dégradation, à l'identique du chemin réel.**
     *
     * Le hub reçoit quatre champs (`combatants`, `currentTurnIdx`, `round`,
     * `isCombatProjected`) et persiste les neuf de `partialize`. Sans la garde,
     * les cinq qu'il n'a jamais reçus repartent tels qu'il les avait à son
     * propre démarrage — donc vides.
     */
    it('sans la garde, le hub emporte le combat garé du MJ ; avec elle, non', () => {
        const duMJ = JSON.stringify({
            state: {
                combatants: [{ id: 'c1', name: 'Xénomorphe', statuses: [{ name: 'invisible' }] }],
                round: 4,
                sceneId: 'sc-12',
                combatsGares: { 'sc-07': { combatants: [{ id: 'c9', name: 'Sentinelle' }] } },
                faitsDArmes: { c1: 3 },
            },
            version: 0,
        });

        // Ce que le hub écrirait : la liste filtrée de ses quatre champs reçus,
        // et le vide pour les cinq autres, qu'il n'a jamais eus.
        const duHub = JSON.stringify({
            state: {
                combatants: [],
                round: 4,
                sceneId: null,
                combatsGares: {},
                faitsDArmes: {},
            },
            version: 0,
        });

        const sansGarde = magasin();
        sansGarde.contenu.set('gmos-combat-storage', duMJ);
        role.current = 'hub';
        sansGarde.storage.setItem('gmos-combat-storage', duHub);
        expect(JSON.parse(sansGarde.contenu.get('gmos-combat-storage')!).state.combatsGares)
            .toEqual({});

        const avecGarde = magasin();
        avecGarde.contenu.set('gmos-combat-storage', duMJ);
        role.current = 'hub';
        ecritureReserveeAuMJ(avecGarde.storage).setItem('gmos-combat-storage', duHub);

        const relu = JSON.parse(avecGarde.contenu.get('gmos-combat-storage')!).state;
        expect(relu.combatsGares['sc-07'].combatants).toHaveLength(1);
        expect(relu.sceneId).toBe('sc-12');
        expect(relu.combatants[0].name).toBe('Xénomorphe');
    });
});
