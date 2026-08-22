import { describe, it, expect, beforeEach } from 'vitest';
import { consignerLeJet, natureDuJet } from './consignerLeJet';
import { useJournalStore } from './useJournalStore';
import { TYPES_D_EVENEMENT, natureParDefaut } from './types';

/**
 * Ce que ces tests protègent : **un jet laisse une trace, et un jet
 * remarquable en laisse une autre**.
 *
 * Les dés étaient l'un des trois modules muets relevés à la revue des 36
 * émetteurs — avec les ambiances et les lumières —, alors que la musique, geste
 * identique, émettait déjà. Leur registre garde cinquante lancers pour l'écran
 * et rien pour l'histoire : *il ne survit pas à la séance et n'entre dans aucun
 * résumé.*
 */

/** Une séance ouverte et en cours d'enregistrement — sinon `addEvent` refuse. */
function ouvrirUneSeance() {
    useJournalStore.getState().startJournal({ nom: 'Campagne de test' }, 'Séance de test');
}

describe('la nature d’un jet', () => {
    /**
     * **Une séance compte des centaines de jets.** Les envoyer tous à la
     * chronique noierait le résumé sous « 14 vs 11 » — exactement le bruit que
     * l'axe `trace`/`chronique` existe pour écarter.
     */
    it('est une trace dans le cas courant', () => {
        expect(natureDuJet('reussite-normale')).toBe('trace');
        expect(natureDuJet('echec-normal')).toBe('trace');
        expect(natureDuJet('reussite-significative')).toBe('trace');
        expect(natureDuJet('echec-particulier')).toBe('trace');
        expect(natureDuJet(undefined)).toBe('trace');
    });

    /**
     * **Les deux extrêmes racontent ce qu'aucune autre ligne ne dira.** C'est le
     * premier usage concret des six degrés : sans eux, une réussite particulière
     * et une réussite de justesse laissaient la même trace, et l'Oracle ne
     * pouvait pas savoir qu'un jet avait été spectaculaire.
     */
    it('devient chronique aux deux extrêmes de l’échelle', () => {
        expect(natureDuJet('reussite-particuliere')).toBe('chronique');
        expect(natureDuJet('echec-total')).toBe('chronique');
    });

    /**
     * **Un jeu qui ne gradue pas ne remplit pas la chronique.** Alien rend
     * `reussite-normale` ou `echec-normal` et rien d'autre : ses jets restent
     * tous des traces, quoi que Rêves de Dragons sache compter.
     */
    it('laisse un jeu sans degrés hors de la chronique', () => {
        for (const degre of ['reussite-normale', 'echec-normal'] as const) {
            expect(natureDuJet(degre)).toBe('trace');
        }
    });
});

describe('le type DICE', () => {
    it('existe à l’exécution, et pas seulement à la compilation', () => {
        // La liste fait foi, et le type en découle : un `as any` a déjà fait
        // partir des événements avec un type inventé, silencieusement.
        expect(TYPES_D_EVENEMENT).toContain('DICE');
    });

    it('retombe sur la trace, comme il se doit', () => {
        expect(natureParDefaut('DICE')).toBe('trace');
    });
});

describe('ce qui s’écrit au journal', () => {
    beforeEach(() => {
        useJournalStore.setState({ journals: [], activeJournalId: null, isRecording: false });
    });

    it('n’écrit rien hors enregistrement, et ne s’en plaint pas', () => {
        // *Rien à vérifier avant d'appeler* : le goulot refuse déjà. Un émetteur
        // qui referait ce contrôle en ferait un second, qui divergerait.
        expect(() => consignerLeJet({
            titre: 'Discrétion', totalDisplay: '42 vs 78', degre: 'reussite-normale',
        })).not.toThrow();
    });

    it('porte le verdict, la cible et le degré quand la séance enregistre', () => {
        ouvrirUneSeance();
        expect(useJournalStore.getState().isRecording, 'la séance enregistre').toBe(true);

        consignerLeJet({
            titre: 'Discrétion',
            totalDisplay: '4 vs 78',
            degre: 'reussite-particuliere',
            seuil: 78,
        });

        const journal = useJournalStore.getState().journals.find(
            j => j.id === useJournalStore.getState().activeJournalId,
        );
        const dernier = journal?.events[0];

        expect(dernier?.type).toBe('DICE');
        expect(dernier?.title).toBe('Jet : Discrétion');
        expect(dernier?.content).toContain('cible 78');
        expect(dernier?.nature, 'une particulière est un fait de fiction').toBe('chronique');
    });
});
