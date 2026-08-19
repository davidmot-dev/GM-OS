import { describe, it, expect, afterEach } from 'vitest';
import { contexteDuJournal, contexteEstVide } from './contexteDeCampagne';

/**
 * **Le modèle doit savoir à quel jeu il joue.**
 *
 * `summarizeSession` ne recevait que le fil et la note finale : rien sur le jeu,
 * rien sur la campagne. Le résumé de la séance du 2026-08-19, jouée sur Alien à
 * Hadley Hope, s'intitulait « Chroniques des Terres Oubliées » et était écrit en
 * heroic-fantasy.
 *
 * *Un modèle à qui l'on ne donne pas le cadre n'en fait pas l'économie : il en
 * invente un.* Même leçon que « HP undefined/undefined » envoyé à l'Oracle.
 */

const poserLesCampagnes = (campaigns: unknown[]) => {
    (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
        getState: () => ({ campaigns }),
    };
};

afterEach(() => {
    delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
});

describe('contexteDuJournal', () => {
    it('rend le jeu, la campagne et son pitch', () => {
        poserLesCampagnes([
            { id: 'c-1', name: 'Hadley Hope', system: 'alien', synopsis: 'Une colonie coupée du monde.' },
        ]);

        expect(contexteDuJournal({ campaignId: 'c-1' })).toEqual({
            campagne: 'Hadley Hope',
            systeme: 'alien',
            synopsis: 'Une colonie coupée du monde.',
        });
    });

    /* `synopsis` est le pitch de la Forge, `description` la ligne du meneur.
       L'un des deux suffit à poser le ton. */
    it('se replie sur la description faute de synopsis', () => {
        poserLesCampagnes([{ id: 'c-1', name: 'Hadley Hope', description: 'Survie spatiale.' }]);

        expect(contexteDuJournal({ campaignId: 'c-1' }).synopsis).toBe('Survie spatiale.');
    });

    /**
     * **Les personnages viennent de l'état de fin, pas de la table
     * d'aujourd'hui.** Un journal se relit des mois plus tard : nommer les
     * personnages actuels dans le compte rendu d'une vieille séance ferait
     * apparaître des gens qui n'y étaient pas.
     */
    it('nomme les personnages presents ce soir-la', () => {
        poserLesCampagnes([{ id: 'c-1', name: 'Hadley Hope', system: 'alien' }]);

        const contexte = contexteDuJournal({
            campaignId: 'c-1',
            etatDeFin: { presentPCs: [{ name: 'JC Alien' }, { name: 'test' }] },
        });

        expect(contexte.personnages).toEqual(['JC Alien', 'test']);
    });

    it('ignore un journal sans campagne, sans echouer', () => {
        poserLesCampagnes([{ id: 'c-1', name: 'Hadley Hope', system: 'alien' }]);

        expect(contexteDuJournal({})).toEqual({});
    });

    /* Une campagne supprimée entre-temps ne doit pas empêcher un résumé. */
    it('ignore une campagne disparue', () => {
        poserLesCampagnes([{ id: 'c-2', name: 'Milo' }]);

        expect(contexteDuJournal({ campaignId: 'c-1' })).toEqual({});
    });

    it('survit a l\'absence totale de magasin de seance', () => {
        expect(() => contexteDuJournal({ campaignId: 'c-1' })).not.toThrow();
        expect(contexteDuJournal({ campaignId: 'c-1' })).toEqual({});
    });

    /* Un champ vide n'est pas un champ : il ne doit pas produire « - Jeu :  ». */
    it('ecarte les champs vides plutot que d\'ecrire une ligne creuse', () => {
        poserLesCampagnes([{ id: 'c-1', name: '  ', system: '', synopsis: '   ' }]);

        expect(contexteDuJournal({ campaignId: 'c-1' })).toEqual({});
    });
});

describe('contexteEstVide', () => {
    it('vrai quand il n\'y a rien a dire', () => {
        expect(contexteEstVide({})).toBe(true);
        expect(contexteEstVide({ personnages: [] })).toBe(true);
    });

    it('faux des qu\'un seul element est connu', () => {
        expect(contexteEstVide({ systeme: 'alien' })).toBe(false);
        expect(contexteEstVide({ personnages: ['Ripley'] })).toBe(false);
    });
});
