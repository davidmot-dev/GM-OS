import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { createStore, type StoreApi } from 'zustand';
import i18next from 'i18next';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';
import { createEntitySlice, type EntitySlice } from '../session/store/entitySlice';

/**
 * **Le plateau et la fiche sont deux copies d'une même donnée, et elles doivent
 * se répondre dans les deux sens.**
 *
 * Défaut trouvé le 2026-08-19 en relisant le journal d'une vraie séance.
 * `syncCombatantToSession` pousse le combattant *vers* la fiche ; rien ne
 * faisait le chemin inverse. Le panneau de santé de Session-OS écrivait donc la
 * fiche seul, et le plateau gardait des points de vie périmés — qu'il finissait
 * par réécrire par-dessus.
 *
 * Trois symptômes dans le même journal, une seule cause :
 *
 * 1. `Récupère **1** — 1/4` trois fois d'affilée, sur un personnage qui ne
 *    remontait jamais ;
 * 2. le récit de fin annonçant « AL SIMPSON : 8/10 » quand le fil disait 0/10 ;
 * 3. des coups comptés par le récit dont le fil n'avait aucune trace, parce que
 *    le pupitre du tracker n'en écrivait pas.
 *
 * *Une synchronisation à sens unique entre deux copies d'une même donnée n'est
 * pas une synchronisation : c'est un écrasement périodique.*
 */

beforeAll(async () => {
    await i18next.init({
        lng: 'fr',
        interpolation: { escapeValue: false },
        resources: {
            fr: {
                modules: {
                    session: {
                        events: {
                            impact_title: '💥 Impact sur {{name}}',
                            impact_damage: 'Encaisse **{{value}}**{{detail}}',
                            impact_healing: 'Récupère **{{value}}**{{detail}}',
                        },
                    },
                },
            },
        },
    });
});

const pointsDeVie = (current: number, max: number, state: string) =>
    ({ type: 'hp' as const, data: { current, max }, state: state as never, badges: [] });

describe('le plateau et la fiche se repondent dans les deux sens', () => {
    const store = () => useCombatStore.getState();
    const journal = () => useJournalStore.getState();

    /** Ce que le panneau de santé a écrit sur la fiche, tel que le sync le relit. */
    let pvEcritsSurLaFiche: number[];

    const poserLeMagasinDeSeance = () => {
        pvEcritsSurLaFiche = [];
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
            getState: () => ({
                players: [{ id: 'j1', characters: [{ id: 'pc1', name: 'test' }] }],
                entities: [],
                updateCharacterHP: (_p: string, _c: string, hp: number) => { pvEcritsSurLaFiche.push(hp); },
                updateEntityHP: () => {},
                updateEntity: () => {},
            }),
        };
    };

    beforeEach(() => {
        store().reset();
        useCombatStore.setState({ combatsGares: {}, dejaConsigne: false });
        journal().clearJournal();
        journal().addJournal('Séance de test');
        useJournalStore.setState({ isRecording: true });
        poserLeMagasinDeSeance();
    });

    afterEach(() => {
        delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
    });

    const unPersonnage = () => {
        store().addCombatant({
            name: 'test', init: 10, hp: 1, hpMax: 4, isPlayer: true,
            faction: 'ally' as const, statuses: [], sourcePlayerId: 'pc1',
            healthSystem: pointsDeVie(1, 4, 'critical'),
        } as never);
        return store().combatants[0].id;
    };

    /**
     * Le symptôme le plus coûteux : le soin disparaissait sans rien laisser.
     * Le meneur soigne, le fil affiche `1/4`, il resoigne, le fil affiche encore
     * `1/4` — parce que le plateau réécrivait sa valeur d'avant.
     */
    it('un soin ecrit sur la fiche n\'est plus ecrase par la synchronisation', () => {
        const id = unPersonnage();

        // Ce que fait le panneau de santé : il soigne la fiche, puis prévient le plateau.
        store().refleterLaFiche('pc1', { hp: 2, healthSystem: pointsDeVie(2, 4, 'wounded') });

        // Ce qui écrasait tout : n'importe quelle synchronisation ultérieure.
        store().syncCombatantToSession(id);

        expect(pvEcritsSurLaFiche, 'le sync doit repousser 2, pas le 1 d\'avant').toEqual([2]);
    });

    /* La fiche est atteignable par l'identifiant du combattant OU par le sien. */
    it('le retour accepte l\'identifiant de la fiche comme celui du combattant', () => {
        const id = unPersonnage();

        store().refleterLaFiche(id, { hp: 3 });
        expect(store().combatants[0].hp).toBe(3);

        store().refleterLaFiche('pc1', { hp: 4 });
        expect(store().combatants[0].hp).toBe(4);
    });

    /* Un coup porté hors du plateau ne doit rien casser. */
    it('un reflet sans combattant correspondant est sans effet', () => {
        unPersonnage();
        expect(() => store().refleterLaFiche('inconnu', { hp: 9 })).not.toThrow();
        expect(store().combatants[0].hp).toBe(1);
    });

    /**
     * Le récit de fin lit le plateau. Tant que le plateau ignorait le panneau de
     * santé, il racontait un combat que personne n'avait joué.
     */
    it('le recit de fin annonce l\'etat que la fiche a ecrit', () => {
        unPersonnage();

        store().refleterLaFiche('pc1', { hp: 0, healthSystem: pointsDeVie(0, 4, 'dead') });
        store().consignerLeCombat();

        const recit = journal().journals[0].events
            .find(e => e.title === 'Combat : Résumé de fin')!;
        expect(recit.content).toContain('0/4');
        expect(recit.content, 'le 1/4 d\'avant ne doit plus apparaitre').not.toContain('1/4');
    });
});

/**
 * **Le pupitre du tracker écrit sa trace, lui aussi.**
 *
 * Il ne l'écrivait pas : seul le panneau de santé consignait ses impacts. Dans
 * le journal du 19/08, AL SIMPSON passe de 9/10 à 2/10 sans une seule ligne
 * entre les deux, et les compteurs du récit voyaient des coups dont le fil
 * n'avait aucune trace.
 */
describe('le pupitre du tracker consigne ses impacts', () => {
    const store = () => useCombatStore.getState();
    const journal = () => useJournalStore.getState();

    const impacts = () => (journal().journals[0]?.events ?? [])
        .filter(e => e.title.startsWith('💥 Impact sur'));

    beforeEach(() => {
        store().reset();
        useCombatStore.setState({ combatsGares: {}, dejaConsigne: false });
        journal().clearJournal();
        journal().addJournal('Séance de test');
        useJournalStore.setState({ isRecording: true });
    });

    const uneGoule = () => {
        store().addCombatant({
            name: 'Goule', init: 10, hp: 10, hpMax: 10, isPlayer: false,
            faction: 'enemy' as const, statuses: [],
            healthSystem: pointsDeVie(10, 10, 'healthy'),
        } as never);
        return store().combatants[0].id;
    };

    it('un coup porte depuis le pupitre atterrit dans le fil', () => {
        const id = uneGoule();

        store().applyDamage(3, 'balistique', [id]);

        expect(impacts(), 'un impact, et un seul').toHaveLength(1);
        expect(impacts()[0].title).toBe('💥 Impact sur Goule');
        expect(impacts()[0].content).toContain('Encaisse **3**');
    });

    /* Le type de dégâts vient du pupitre : c'est la seule des deux portes à le connaître. */
    it('la trace porte le type de degats', () => {
        const id = uneGoule();
        store().applyDamage(3, 'balistique', [id]);
        expect(impacts()[0].content).toContain('(balistique)');
    });

    /* « Récupère 2 (balistique) » n'aurait aucun sens. */
    it('un soin ne porte pas de type de degats', () => {
        const id = uneGoule();
        store().applyDamage(-2, 'balistique', [id]);

        expect(impacts()[0].content).toContain('Récupère **2**');
        expect(impacts()[0].content).not.toContain('balistique');
    });

    /* La ligne dit l'état d'arrivée : elle se lit après que le coup a porté. */
    it('la trace dit l\'etat d\'arrivee, pas celui de depart', () => {
        const id = uneGoule();
        store().applyDamage(4, 'balistique', [id]);
        expect(impacts()[0].content).toContain('6/10');
    });

    /* § 9 du plan du 2026-08-08 : le rattachement est structurel, donc de
       premier ordre — et il vaut pour le fil, pas seulement pour le récit. */
    it('la trace est rattachee a la scene du combat', () => {
        store().rattacherLeCombat('scene-A');
        const id = uneGoule();

        store().applyDamage(3, 'balistique', [id]);

        expect(impacts()[0].sceneId).toBe('scene-A');
    });

    it('hors scene, la trace n\'invente aucun rattachement', () => {
        const id = uneGoule();
        store().applyDamage(3, 'balistique', [id]);
        expect(impacts()[0].sceneId).toBeUndefined();
    });
});

/**
 * **Le chemin réel, celui du panneau de santé de Session-OS.**
 *
 * Les tests ci-dessus appellent `refleterLaFiche` en direct : ils vérifient que
 * le retour fonctionne, pas que quelqu'un l'emprunte. C'est exactement le
 * travers qui a laissé passer le défaut des notes de séance le même jour — *un
 * test qui construit lui-même l'état que le code va lire ne teste pas le chemin
 * qui produit cet état.* Celui-ci part donc de `handleApplyImpact`.
 */
describe('le panneau de sante previent le plateau', () => {
    const combat = () => useCombatStore.getState();
    let seance: StoreApi<EntitySlice>;

    beforeEach(() => {
        combat().reset();
        useCombatStore.setState({ combatsGares: {}, dejaConsigne: false });
        useJournalStore.getState().clearJournal();

        seance = createStore<EntitySlice>()((...a) => createEntitySlice(...a));
        seance.setState({
            players: [{
                id: 'j1', name: 'David', realName: 'David', isOnline: true,
                characters: [{
                    id: 'pc1', name: 'test', hp: 1, maxHp: 4,
                    healthSystem: pointsDeVie(1, 4, 'critical'),
                }],
            }] as never,
        });
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = seance;

        combat().addCombatant({
            name: 'test', init: 10, hp: 1, hpMax: 4, isPlayer: true,
            faction: 'ally' as const, statuses: [], sourcePlayerId: 'pc1',
            healthSystem: pointsDeVie(1, 4, 'critical'),
        } as never);
    });

    afterEach(() => {
        delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
    });

    const pvDeLaFiche = () => seance.getState().players[0].characters[0].hp;

    it('un soin du panneau atteint le plateau', () => {
        seance.getState().handleApplyImpact('pc1', 'pc', { value: 1, isRecovery: true });

        expect(pvDeLaFiche(), 'la fiche est soignee').toBe(2);
        expect(combat().combatants[0].hp, 'et le plateau l\'a appris').toBe(2);
    });

    /**
     * Le symptôme exact du 19/08 : trois soins d'affilée, et le fil qui répète
     * `1/4`. Le plateau réécrivait sa valeur périmée entre chaque clic.
     */
    it('trois soins de suite font monter les points de vie, une fois par soin', () => {
        for (let i = 0; i < 3; i++) {
            seance.getState().handleApplyImpact('pc1', 'pc', { value: 1, isRecovery: true });
            // Ce qui écrasait tout : une synchronisation entre deux clics.
            combat().syncCombatantToSession(combat().combatants[0].id);
        }

        expect(pvDeLaFiche()).toBe(4);
        expect(combat().combatants[0].hp).toBe(4);
    });

    /**
     * Le fil doit être groupable en entier, pas à moitié. Sans ce rattachement,
     * les impacts d'une même scène se répartissaient selon la porte empruntée :
     * ceux du pupitre rattachés, ceux du panneau non.
     */
    it('un impact du panneau porte la scene du plateau', () => {
        useJournalStore.getState().addJournal('Séance de test');
        useJournalStore.setState({ isRecording: true });
        combat().rattacherLeCombat('scene-A');

        seance.getState().handleApplyImpact('pc1', 'pc', { value: 1 });

        const impact = useJournalStore.getState().journals[0].events
            .find(e => e.title?.startsWith('💥 Impact sur'))!;
        expect(impact.sceneId).toBe('scene-A');
    });

    /**
     * **Les résistances s'appliquent enfin sur ce chemin.**
     *
     * Décision de David du 2026-08-19 : une seule règle pour les deux portes.
     * Le panneau ne passait aucun type, et `processResistances` sort aussitôt
     * quand il n'y en a pas (`if (!impact.type …) return impact`) — donc
     * frapper depuis le panneau **ignorait purement et simplement** les
     * étiquettes `res_`/`vul_` de la fiche, là où le pupitre les appliquait.
     */
    it('un type de degats declenche les resistances de la fiche', () => {
        seance.setState({
            players: [{
                id: 'j1', name: 'David', realName: 'David', isOnline: true,
                characters: [{
                    id: 'pc2', name: 'blindé', hp: 10, maxHp: 10,
                    healthSystem: {
                        type: 'hp', data: { current: 10, max: 10, tags: ['res_physical'] },
                        state: 'healthy',
                    },
                }],
            }] as never,
        });

        seance.getState().handleApplyImpact('pc2', 'pc', { value: 4, type: 'physical' });

        const perso = seance.getState().players[0].characters[0];
        expect(perso.hp, '4 physiques réduits à 2 par res_physical').toBe(8);
    });

    /* Sans type, rien ne change : c'est le comportement d'avant, et il reste
       juste pour un coup dont le meneur ne précise pas la nature. */
    it('sans type, les resistances ne s\'appliquent pas', () => {
        seance.setState({
            players: [{
                id: 'j1', name: 'David', realName: 'David', isOnline: true,
                characters: [{
                    id: 'pc2', name: 'blindé', hp: 10, maxHp: 10,
                    healthSystem: {
                        type: 'hp', data: { current: 10, max: 10, tags: ['res_physical'] },
                        state: 'healthy',
                    },
                }],
            }] as never,
        });

        seance.getState().handleApplyImpact('pc2', 'pc', { value: 4 });

        expect(seance.getState().players[0].characters[0].hp).toBe(6);
    });
});
