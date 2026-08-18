import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';
import { natureParDefaut } from '../journal/types';

/**
 * **Le récit du combat est le seul événement de combat que le résumé reçoive.**
 *
 * `generateAISummary` ne garde que les événements de nature `chronique`, et le
 * combat n'en produit qu'un : ce résumé de fin. Tout le reste — initiative,
 * impacts — est de la trace, écartée à dessein.
 *
 * D'où le défaut signalé par David le 2026-08-18, *« les données de combat ne
 * sont pas prises en compte dans le résumé »* : ce récit unique n'était écrit
 * que par `clearCombatants`, derrière le bouton rouge « Reset Combat ». Le
 * bouton « Fin de combat » n'écrivait rien au journal.
 */
describe('le récit du combat au journal', () => {
    const store = () => useCombatStore.getState();
    const journal = () => useJournalStore.getState();

    const unCombattant = (name: string, mort = false) => ({
        name, init: 10, hp: 10, hpMax: 10, isPlayer: false, faction: 'enemy' as const,
        statuses: mort ? [{ id: 'x', name: 'Mort', duration: 99, icon: '💀' }] : [],
    });

    const recits = () => (journal().journals[0]?.events ?? [])
        .filter(e => e.title.startsWith('Combat :') && e.title !== 'Combat : Initiative');

    beforeEach(() => {
        useCombatStore.getState().reset();
        useCombatStore.setState({ combatsGares: {}, dejaConsigne: false });
        journal().clearJournal();
        journal().addJournal('Séance de test');
        useJournalStore.setState({ isRecording: true });
    });

    it('consigner ecrit un recit de nature chronique', () => {
        store().addCombatant(unCombattant('Goule'));
        store().addCombatant(unCombattant('Pirate', true));
        useCombatStore.setState({ round: 3 });

        store().consignerLeCombat();

        expect(recits()).toHaveLength(1);
        const recit = recits()[0];
        expect(recit.nature ?? natureParDefaut(recit.type)).toBe('chronique');
        expect(recit.content).toContain('**Pirate**');
        expect(recit.content).toContain('**Goule**');
        expect(recit.content).toContain('3 rounds');
    });

    /* Le défaut central : terminer puis vider donnait zéro récit par un chemin
       et un seul par l'autre. Il en faut exactement un, quel que soit l'ordre. */
    it('terminer PUIS vider n\'ecrit qu\'un seul recit', () => {
        store().addCombatant(unCombattant('Goule'));

        store().consignerLeCombat();
        store().clearCombatants();

        expect(recits()).toHaveLength(1);
    });

    it('vider sans avoir termine ecrit quand meme le recit', () => {
        store().addCombatant(unCombattant('Goule'));

        store().clearCombatants();

        expect(recits()).toHaveLength(1);
    });

    /**
     * **Le récit tient compte des coups sans les lister** — demande de David du
     * 2026-08-18. Les impacts partent au journal un par un, en `trace`, et
     * n'atteignent jamais le modèle ; leur agrégat, lui, doit être dans le récit,
     * sans quoi il ne dit rien de plus que « un combat eut lieu ».
     */
    it('le recit agrege les coups recus, par les DEUX chemins de degats', () => {
        store().addCombatant(unCombattant('Goule'));
        const goule = store().combatants[0].id;

        // Chemin 1 : le pupitre du tracker.
        store().applyDamage(3, 'physical', [goule]);
        // Chemin 2 : le panneau de santé de Session-OS, qui vise la fiche.
        store().noterUnCoup(goule, { value: 5 });

        store().consignerLeCombat();

        const contenu = recits()[0].content;
        expect(contenu, 'le total des deux chemins').toContain('8 encaissés en 2 coups');
        expect(contenu).toContain('**Dégâts échangés :** 8 au total');
        expect(contenu).toContain('le coup le plus dur étant **5** sur Goule');
    });

    it('un combattant jamais touche le dit, sans compteur a zero', () => {
        store().addCombatant(unCombattant('Rusty'));

        store().consignerLeCombat();

        expect(recits()[0].content).toContain('pas touché');
        expect(recits()[0].content).not.toContain('0 encaissés');
    });

    /* Les coups pris dans le hangar n'appartiennent pas au combat de la cave. */
    it('les compteurs se garent avec leur plateau', () => {
        store().rattacherLeCombat('scene-A');
        store().addCombatant(unCombattant('Goule'));
        store().noterUnCoup(store().combatants[0].id, { value: 9 });

        store().basculerVersLaScene('scene-B');
        store().addCombatant(unCombattant('Pirate'));
        store().consignerLeCombat();

        const recitDeB = recits()[0].content;
        expect(recitDeB).toContain('**Pirate**');
        expect(recitDeB, 'la scène B n\'a encaissé aucun coup').not.toContain('9');

        store().basculerVersLaScene('scene-A');
        store().consignerLeCombat();

        expect(recits().find(r => r.content.includes('9 encaissés en 1 coup'))).toBeDefined();
    });

    it('un plateau vide n\'a rien a raconter', () => {
        store().consignerLeCombat();
        expect(recits()).toHaveLength(0);
    });

    it('le plateau vide remet le prochain combat en etat d\'etre raconte', () => {
        store().addCombatant(unCombattant('Goule'));
        store().clearCombatants();

        store().addCombatant(unCombattant('Xéno'));
        store().consignerLeCombat();

        expect(recits()).toHaveLength(2);
    });

    /*
      Le drapeau voyage avec le plateau garé. Un drapeau global serait faux dans
      les deux sens : levé, le combat de la scène suivante ne s'écrirait jamais ;
      retombé, revenir sur un combat déjà raconté le raconterait deux fois.
    */
    describe('avec des combats garés par scène', () => {
        it('le combat de la scene suivante se raconte aussi', () => {
            store().rattacherLeCombat('scene-A');
            store().addCombatant(unCombattant('Goule'));
            store().consignerLeCombat();

            store().basculerVersLaScene('scene-B');
            store().addCombatant(unCombattant('Pirate'));
            store().consignerLeCombat();

            expect(recits()).toHaveLength(2);
        });

        it('revenir sur un combat deja raconte ne le raconte pas deux fois', () => {
            store().rattacherLeCombat('scene-A');
            store().addCombatant(unCombattant('Goule'));
            store().consignerLeCombat();

            store().basculerVersLaScene('scene-B');
            store().basculerVersLaScene('scene-A');
            store().consignerLeCombat();

            expect(recits()).toHaveLength(1);
        });
    });
});
