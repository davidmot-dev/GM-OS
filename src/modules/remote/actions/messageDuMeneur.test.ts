import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Le meneur qui parle depuis sa tablette est vraiment entendu.**
 *
 * Demandé par David le 2026-09-05. Le piège qu'il fallait éviter :
 * `session:send-message` existe et **n'aurait rien fait de bon** — son handler
 * se contente d'ajouter le message à la liste du meneur, *sans le rediffuser*.
 * Un message parti de la tablette serait apparu dans le fil du cockpit **sans
 * jamais atteindre le joueur** : on croit avoir parlé.
 *
 * `sendDirectMessage` est le seul chemin qui inscrit ET diffuse.
 */

const sendDirectMessage = vi.fn();
const addSessionMessage = vi.fn();

vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: { getState: () => ({ sendDirectMessage, addSessionMessage }) },
}));

const { sessionActions } = await import('./sessionActions');
const CONTEXTE = { activeCampaignId: 'c-1', sync: vi.fn() };

beforeEach(() => vi.clearAllMocks());

describe('remote:session:gm-message', () => {
    it('passe par le chemin qui DIFFUSE, pas par celui qui inscrit seulement', () => {
        sessionActions['remote:session:gm-message']!(
            { toId: 'pc-1', toName: 'Alia', content: 'Le maire ment.' }, CONTEXTE);

        expect(sendDirectMessage).toHaveBeenCalledWith('pc-1', 'Alia', 'Le maire ment.');
        expect(addSessionMessage).not.toHaveBeenCalled();
    });

    it('coupe les espaces autour du texte', () => {
        sessionActions['remote:session:gm-message']!(
            { toId: 'pc-1', toName: 'Alia', content: '  Approche.  ' }, CONTEXTE);

        expect(sendDirectMessage).toHaveBeenCalledWith('pc-1', 'Alia', 'Approche.');
    });

    it('refuse un message vide — un blanc envoyé est un message qu’on croit avoir écrit', () => {
        sessionActions['remote:session:gm-message']!({ toId: 'pc-1', toName: 'Alia', content: '   ' }, CONTEXTE);
        expect(sendDirectMessage).not.toHaveBeenCalled();
    });

    it('refuse un message sans destinataire', () => {
        sessionActions['remote:session:gm-message']!({ content: 'Perdu ?' }, CONTEXTE);
        expect(sendDirectMessage).not.toHaveBeenCalled();
    });

    it('retombe sur l’identifiant quand le nom manque', () => {
        sessionActions['remote:session:gm-message']!({ toId: 'pc-9', content: 'Bonjour' }, CONTEXTE);
        expect(sendDirectMessage).toHaveBeenCalledWith('pc-9', 'pc-9', 'Bonjour');
    });

    it('ne lève pas sur un payload absent', () => {
        expect(() => sessionActions['remote:session:gm-message']!(null, CONTEXTE)).not.toThrow();
    });
});

describe('ce que les deux autres chemins font toujours', () => {
    it('session:send-message inscrit sans diffuser — c’est bien pour ça qu’il ne convenait pas', () => {
        sessionActions['session:send-message']!({ id: 'm1', content: 'coucou' }, CONTEXTE);

        expect(addSessionMessage).toHaveBeenCalledTimes(1);
        expect(sendDirectMessage).not.toHaveBeenCalled();
    });
});
