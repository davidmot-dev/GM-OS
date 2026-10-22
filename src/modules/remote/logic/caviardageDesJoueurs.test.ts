import { describe, it, expect } from 'vitest';
import { caviarderPourLesJoueurs, MASQUE } from './caviardageDesJoueurs';
import { CLE_PROGRESSION_ALIEN } from '../../dice/systemes/progressionAlien';

/**
 * **Ce que la table des joueurs ne reçoit jamais** — S1, S2, S5 de l'audit du
 * 2026-10-22. Chaque secret porte un marqueur ; on cherche le marqueur dans la
 * charge sérialisée, telle qu'elle partirait sur le réseau. *Un secret caviardé
 * à l'affichage est déjà déposé sur l'appareil.*
 */
const SECRETS = [
    'SECRET-NOTE-PRIVEE', 'SECRET-MESSAGE', 'SECRET-AVIS', 'SECRET-ACTE', 'SECRET-SCENE',
    'SECRET-INDICE-CACHE', 'SECRET-WIKI', 'SECRET-LIEU', 'SECRET-CAMPAGNE', 'SECRET-PERSONNAGE',
    'SECRET-ENTITE', 'SECRET-JEU-ENTITE', 'SECRET-COMBATTANT', 'SECRET-OBJECTIF-ALIEN',
];

const CHARGE = {
    notes: { public: 'Notes publiques', private: 'SECRET-NOTE-PRIVEE' },
    messages: [{ id: 'm1', texte: 'SECRET-MESSAGE' }],
    lectureDuMeneur: {
        actes: [{ id: 'a1', titre: 'Acte I', notesDuMeneur: 'SECRET-ACTE' }],
        scenes: [{ id: 's1', titre: 'Scène 1', notesDuMeneur: 'SECRET-SCENE' }],
        wikiEntries: [{ id: 'w1', contenu: 'SECRET-WIKI' }],
        clues: [{ id: 'c1', content: 'SECRET-INDICE-CACHE', isRevealed: false }],
    },
    session: {
        sessions: [{ id: 'se1', title: 'Séance 1', feedbacks: [{ texte: 'SECRET-AVIS' }] }],
        campaigns: [{ id: 'camp', name: 'La campagne', notes: 'Notes de campagne', gmNotes: 'SECRET-CAMPAGNE' }],
        atlasMaps: [{ id: 'lieu', name: 'Le port', narrativeDescription: 'Un port gris', gmNotes: 'SECRET-LIEU' }],
        players: [{ id: 'j', characters: [{ id: 'pj', name: 'Ilya', playerNotes: 'Mes notes', gmNotes: 'SECRET-PERSONNAGE',
            sheetData: { [CLE_PROGRESSION_ALIEN]: { objectifs: { a1: 'SECRET-OBJECTIF-ALIEN' }, remis: {}, meritesActes: {} } } }] }],
        entities: [{ id: 'e', name: 'Le Préfet', description: 'Un homme pâle', gmSecretInfo: 'SECRET-ENTITE', roleplayingNotes: 'SECRET-JEU-ENTITE' }],
    },
    combat: { combatants: [{ id: 'k', name: 'Garde', gmSecretInfo: 'SECRET-COMBATTANT', roleplayingNotes: '' }], round: 2 },
};

describe('ce que la table des joueurs ne reçoit jamais', () => {
    const serialise = JSON.stringify(caviarderPourLesJoueurs(CHARGE));

    it.each(SECRETS)('« %s » ne part pas', secret => {
        expect(serialise).not.toContain(secret);
    });

    it('la trame du meneur et son fil ne partent pas du tout', () => {
        const c = caviarderPourLesJoueurs(CHARGE) as Record<string, unknown>;
        expect(c).not.toHaveProperty('lectureDuMeneur');
        expect(c).not.toHaveProperty('messages');
    });

    it('ce qui est public reste, et les champs gardent leur place', () => {
        const c = caviarderPourLesJoueurs(CHARGE);
        expect(c.notes).toEqual({ public: 'Notes publiques', private: MASQUE });
        expect(c.session.campaigns[0]).toEqual({ id: 'camp', name: 'La campagne', notes: 'Notes de campagne', gmNotes: '' });
        expect(c.session.atlasMaps[0].narrativeDescription).toBe('Un port gris');
        expect(c.session.players[0].characters[0].playerNotes).toBe('Mes notes');
        expect(c.session.entities[0]).toMatchObject({ description: 'Un homme pâle', gmSecretInfo: MASQUE, roleplayingNotes: MASQUE });
        expect(c.session.sessions[0]).toEqual({ id: 'se1', title: 'Séance 1' });
        expect(c.combat.round).toBe(2);
    });

    it('ne touche pas la charge reçue : le meneur garde la sienne', () => {
        const copie = JSON.parse(JSON.stringify(CHARGE));
        caviarderPourLesJoueurs(CHARGE);
        expect(CHARGE).toEqual(copie);
    });

    it('laisse passer les ordres sans secret, tels quels', () => {
        expect(caviarderPourLesJoueurs({ type: 'FULL_RESET' })).toEqual({ type: 'FULL_RESET' });
        expect(caviarderPourLesJoueurs(null)).toBeNull();
        expect(caviarderPourLesJoueurs('texte')).toBe('texte');
    });
});
