import { describe, it, expect } from 'vitest';
import { evaluateAction, isPrivilegedRole, PLAYER_ALLOWED_ACTIONS } from './actionPolicy';

const CHAR = 'perso-alice';

describe('isPrivilegedRole', () => {
    it('reconnaît les rôles appairés', () => {
        expect(isPrivilegedRole('gm')).toBe(true);
        expect(isPrivilegedRole('remote')).toBe(true);
    });

    it('rejette les rôles non privilégiés et les valeurs absentes', () => {
        expect(isPrivilegedRole('player')).toBe(false);
        expect(isPrivilegedRole('hub')).toBe(false);
        expect(isPrivilegedRole(undefined)).toBe(false);
        expect(isPrivilegedRole('')).toBe(false);
    });
});

/**
 * **Les cartes tenues en main — signalé par David à l'écran le 2026-08-30 :**
 * *« je joue une carte et je reçois : réservé aux rôles appairés »*.
 *
 * Le refus était juste : cette liste refuse par défaut, et quatre actions
 * arrivées sans avoir été déclarées ici devaient être refusées. Le défaut
 * n'était pas le refus, c'était l'oubli de la déclaration.
 */
describe('evaluateAction — les cartes d’un joueur', () => {
    it('laisse un joueur jouer SA carte', () => {
        expect(evaluateAction('deck:jouer-carte', { deckId: 'd-1', index: 7, characterId: CHAR }, 'hub', CHAR).allowed)
            .toBe(true);
    });

    /** Le `characterId` vient du client ; c'est ici qu'on le confronte à la socket. */
    it('refuse de jouer la carte d’un autre', () => {
        const verdict = evaluateAction(
            'deck:jouer-carte', { deckId: 'd-1', index: 7, characterId: 'perso-bob' }, 'hub', CHAR);

        expect(verdict.allowed).toBe(false);
        expect(verdict.reason).toBe('ownership');
    });

    it('refuse de proposer la carte d’un autre', () => {
        const verdict = evaluateAction(
            'deck:demander-don', { deckId: 'd-1', index: 7, deQui: 'perso-bob', versQui: CHAR }, 'hub', CHAR);

        expect(verdict.allowed).toBe(false);
        expect(verdict.reason).toBe('ownership');
    });

    /**
     * Répondre à une proposition passe le contrôle d'identité ici — mais cette
     * couche **ne connaît pas les demandes** et ne peut pas dire à qui
     * celle-ci s'adressait. C'est `deckSlice` qui le vérifie ; voir
     * `donDeCarte.test.ts`.
     */
    it('authentifie celui qui répond, sans juger de la demande', () => {
        expect(evaluateAction('deck:accepter-don', { demandeId: 'x', characterId: CHAR }, 'hub', CHAR).allowed)
            .toBe(true);
        expect(evaluateAction('deck:accepter-don', { demandeId: 'x', characterId: 'perso-bob' }, 'hub', CHAR).allowed)
            .toBe(false);
    });

    it('les quatre actions sont declarées', () => {
        for (const type of ['deck:jouer-carte', 'deck:demander-don', 'deck:accepter-don', 'deck:refuser-don']) {
            expect(PLAYER_ALLOWED_ACTIONS.has(type), type).toBe(true);
        }
    });
});

describe('evaluateAction — rôles privilégiés', () => {
    it('laisse tout passer pour gm et remote', () => {
        for (const role of ['gm', 'remote'] as const) {
            expect(evaluateAction('whiteboard:clear', {}, role, undefined).allowed).toBe(true);
            expect(evaluateAction('combat:next-turn', {}, role, undefined).allowed).toBe(true);
            expect(evaluateAction('remote:pad:trigger', { id: 'x' }, role, undefined).allowed).toBe(true);
        }
    });

    it('autorise le MJ à agir sur le personnage d\'autrui', () => {
        const verdict = evaluateAction(
            'session:remove-inventory-item',
            { characterId: 'perso-bob', itemId: 'i1' },
            'remote',
            CHAR
        );
        expect(verdict.allowed).toBe(true);
    });
});

describe('evaluateAction — refus par rôle', () => {
    const forbidden = [
        'whiteboard:clear',
        'combat:next-turn',
        'combat:update-hp',
        'remote:pad:trigger',
        'storyboard:trigger',
        'remote:sound:stop-all',
        'dice:roll',
    ];

    it('refuse à un joueur toute action hors de sa liste', () => {
        for (const type of forbidden) {
            const verdict = evaluateAction(type, {}, 'hub', CHAR);
            expect(verdict.allowed).toBe(false);
            expect(verdict.reason).toBe('role');
        }
    });

    it('refuse aussi au rôle player', () => {
        expect(evaluateAction('whiteboard:clear', {}, 'player', CHAR).allowed).toBe(false);
    });

    it('refuse quand le rôle est absent', () => {
        expect(evaluateAction('combat:next-turn', {}, undefined, CHAR).allowed).toBe(false);
    });

    it('refuse un type inconnu', () => {
        expect(evaluateAction('quelque:chose', {}, 'hub', CHAR).allowed).toBe(false);
    });
});

describe('evaluateAction — actions permises aux joueurs', () => {
    it('autorise les quatre actions du Tablet Hub sur son propre personnage', () => {
        expect(evaluateAction('session:send-message', { fromId: CHAR, toId: 'GM' }, 'hub', CHAR).allowed).toBe(true);
        expect(evaluateAction('session:request-item-transfer', { fromCharId: CHAR, toCharId: 'perso-bob' }, 'hub', CHAR).allowed).toBe(true);
        expect(evaluateAction('session:remove-inventory-item', { characterId: CHAR, itemId: 'i1' }, 'hub', CHAR).allowed).toBe(true);
        expect(evaluateAction('session:submit-feedback', { sessionId: 's1', feedback: {} }, 'hub', CHAR).allowed).toBe(true);
    });

    it('autorise la demande de resynchronisation', () => {
        // Envoyée par le Tablet Hub à chaque connexion : la refuser laissait la
        // tablette sans moyen de réclamer un état frais.
        expect(evaluateAction('remote:request-sync', {}, 'hub', CHAR).allowed).toBe(true);
        expect(evaluateAction('remote:request-sync', undefined, 'hub', undefined).allowed).toBe(true);
    });

    it('autorise le geste sur une réserve commune', () => {
        /**
         * **Ajoutée le 2026-08-15, et c'est une règle du jeu, pas un confort.**
         * Chez Dune l'Impulsion appartient aux joueurs : elle se dépense par
         * décision collective, à la table, sans passer par le meneur. La leur
         * refuser reviendrait à faire arbitrer par le MJ une réserve dont le
         * livre dit qu'elle n'est pas la sienne.
         *
         * **Cette politique n'est pas le dernier mot.** Elle ignore les pilotes
         * et les réserves qu'ils déclarent ; c'est `tableActions` qui vérifie
         * que la réserve visée est bien manipulable par les joueurs, sinon un
         * client ferait monter la Menace du meneur — publique, mais intouchable.
         * Même partage que `stripProjectionTarget` : le rôle en amont, le champ
         * en aval.
         */
        expect(evaluateAction('table:ajuster', { ressourceId: 'impulsion', delta: -1 }, 'hub', CHAR).allowed).toBe(true);
    });

    it('couvre exactement la liste déclarée', () => {
        expect([...PLAYER_ALLOWED_ACTIONS].sort()).toEqual([
            // Les cartes qu'un joueur tient en main — ajoutées le 2026-08-30.
            'deck:accepter-don',
            'deck:demander-don',
            'deck:jouer-carte',
            'deck:refuser-don',
            'remote:request-sync',
            'session:remove-inventory-item',
            'session:request-item-transfer',
            'session:send-message',
            'session:submit-feedback',
            'session:update-character-narrative',
            'session:update-character-sheet-data',
            'table:ajuster',
        ]);
    });

    /**
     * **La fiche remplie sur la tablette du joueur.**
     *
     * *Trouvé le 2026-08-29 :* trois maillons manquaient entre la saisie et le
     * meneur, et celui-ci en était un. Le joueur voyait pourtant sa saisie chez
     * lui — *le chemin s'arrête avant le moteur, et rien ne se plaint.*
     */
    it('laisse un joueur remplir SA fiche, et seulement la sienne', () => {
        for (const type of ['session:update-character-sheet-data', 'session:update-character-narrative']) {
            expect(
                evaluateAction(type, { characterId: CHAR, updates: {} }, 'player', CHAR).allowed,
                `${type} sur son propre personnage`,
            ).toBe(true);

            const verdict = evaluateAction(type, { characterId: 'char-d-un-autre', updates: {} }, 'player', CHAR);
            expect(verdict.allowed, `${type} sur le personnage d'un autre`).toBe(false);
            expect(verdict.reason).toBe('ownership');
        }
    });
});

describe('evaluateAction — appartenance du personnage', () => {
    it('refuse de vider l\'inventaire d\'un autre', () => {
        const verdict = evaluateAction(
            'session:remove-inventory-item',
            { characterId: 'perso-bob', itemId: 'i1' },
            'hub',
            CHAR
        );
        expect(verdict.allowed).toBe(false);
        expect(verdict.reason).toBe('ownership');
    });

    it('refuse de donner un objet au nom d\'un autre', () => {
        const verdict = evaluateAction(
            'session:request-item-transfer',
            { fromCharId: 'perso-bob', toCharId: CHAR },
            'hub',
            CHAR
        );
        expect(verdict.allowed).toBe(false);
        expect(verdict.reason).toBe('ownership');
    });

    it('refuse de parler au nom d\'un autre', () => {
        const verdict = evaluateAction(
            'session:send-message',
            { fromId: 'perso-bob', toId: 'GM', content: 'je trahis le groupe' },
            'hub',
            CHAR
        );
        expect(verdict.allowed).toBe(false);
        expect(verdict.reason).toBe('ownership');
    });

    it('autorise à recevoir un objet d\'un autre', () => {
        // Seul l'émetteur est contrôlé : être destinataire est légitime.
        const verdict = evaluateAction(
            'session:request-item-transfer',
            { fromCharId: CHAR, toCharId: 'perso-bob' },
            'hub',
            CHAR
        );
        expect(verdict.allowed).toBe(true);
    });

    it('refuse un client sans personnage qui vise un personnage', () => {
        const verdict = evaluateAction(
            'session:remove-inventory-item',
            { characterId: 'perso-bob' },
            'hub',
            undefined
        );
        expect(verdict.allowed).toBe(false);
        expect(verdict.reason).toBe('ownership');
    });

    it('laisse passer quand le champ contrôlé est absent ou vide', () => {
        // Le payload peut évoluer : on ne casse pas une action faute de champ.
        expect(evaluateAction('session:remove-inventory-item', {}, 'hub', CHAR).allowed).toBe(true);
        expect(evaluateAction('session:remove-inventory-item', { characterId: '' }, 'hub', CHAR).allowed).toBe(true);
        expect(evaluateAction('session:remove-inventory-item', null, 'hub', CHAR).allowed).toBe(true);
    });

    it('laisse passer un champ non textuel', () => {
        expect(evaluateAction('session:remove-inventory-item', { characterId: 42 }, 'hub', CHAR).allowed).toBe(true);
    });

    it('traite GM comme un interlocuteur, pas comme un personnage usurpé', () => {
        expect(evaluateAction('session:send-message', { fromId: 'GM', toId: CHAR }, 'hub', CHAR).allowed).toBe(true);
    });

    it('ne contrôle pas l\'appartenance sur le retour de session', () => {
        // submit-feedback ne désigne pas de personnage.
        expect(evaluateAction('session:submit-feedback', { sessionId: 's1' }, 'hub', CHAR).allowed).toBe(true);
    });
});
