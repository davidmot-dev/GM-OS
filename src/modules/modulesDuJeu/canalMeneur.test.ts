import { afterEach, describe, it, expect, vi } from 'vitest';
import { CanalDesModulesMJ } from './canalMeneur';

/** Le canal de la tablette du meneur — 07/11/2026, plan des modules sur la tablette, T2. */
const vue = { campagneId: 'a', contexte: 3, revision: 5, enSeance: true, personnages: [{ id: 'alice', nom: 'Alice' }],
    modules: [{ id: 'alien-muthur', libelle: 'MU/TH/UR 6000', revision: 5, acces: [], vue: {} }] };
afterEach(() => { vi.useRealTimers(); });
function preparer() {
    const envoyer = vi.fn(), afficher = vi.fn();
    const canal = new CanalDesModulesMJ(envoyer, afficher);
    canal.recevoir({ type: 'modules:mj:vue', payload: vue });
    return { canal, envoyer, afficher };
}
const derniereRequete = (envoyer: ReturnType<typeof vi.fn>) => envoyer.mock.lastCall![0] as { type: string; payload: Record<string, unknown> };

describe('canal du meneur sur sa tablette', () => {
    it('ne prend que ses messages, et affiche la vue reçue', () => {
        const { canal, afficher } = preparer();
        expect(afficher).toHaveBeenLastCalledWith(vue);
        expect(canal.recevoir({ type: 'modules:vue', payload: {} })).toBe(false);
        expect(canal.recevoir({ type: 'sync', payload: {} })).toBe(false);
        canal.fermer();
    });

    it('envoie chaque geste avec la campagne et le contexte de la vue, et rend l’accusé', async () => {
        const { canal, envoyer } = preparer();
        const promesse = canal.autoriser('alien-muthur', ['alice']);
        const { type, payload } = derniereRequete(envoyer);
        expect(type).toBe('modules:mj:autoriser');
        expect(payload).toMatchObject({ campagneId: 'a', contexte: 3, moduleId: 'alien-muthur', personnages: ['alice'] });
        canal.recevoir({ type: 'modules:mj:resultat', payload: { requeteId: payload.requeteId, ok: true } });
        await expect(promesse).resolves.toEqual({ ok: true });
        canal.fermer();
    });

    it('rend la raison d’un refus telle que le serveur la donne', async () => {
        const { canal, envoyer } = preparer();
        const promesse = canal.toutCouper();
        canal.recevoir({ type: 'modules:mj:resultat', payload: { requeteId: derniereRequete(envoyer).payload.requeteId, ok: false, erreur: 'La table a changé.' } });
        await expect(promesse).resolves.toEqual({ ok: false, erreur: 'La table a changé.' });
        canal.fermer();
    });

    it('sans accusé en dix secondes, échoue sans rejouer', async () => {
        vi.useFakeTimers();
        const { canal, envoyer } = preparer();
        const promesse = canal.commander('alien-muthur', { id: 'saisir', charge: { texte: 'HELP' } });
        await vi.advanceTimersByTimeAsync(10_000);
        await expect(promesse).resolves.toMatchObject({ ok: false, erreur: expect.stringContaining('pas rejouée') });
        expect(envoyer).toHaveBeenCalledTimes(1);
        canal.fermer();
    });

    it('refuse un module que la vue ne contient pas, sans rien envoyer', async () => {
        const { canal, envoyer } = preparer();
        await expect(canal.commander('alien-detecteur', { id: 'scanner', charge: {} })).resolves.toMatchObject({ ok: false });
        expect(envoyer).not.toHaveBeenCalled();
        canal.fermer();
    });

    it('ignore une révision plus ancienne ; un nouveau contexte annule les attentes', async () => {
        const { canal, afficher } = preparer();
        canal.recevoir({ type: 'modules:mj:vue', payload: { ...vue, revision: 4 } });
        expect(afficher).toHaveBeenCalledTimes(1);
        const promesse = canal.toutCouper();
        canal.recevoir({ type: 'modules:mj:vue', payload: { ...vue, contexte: 4, revision: 1 } });
        await expect(promesse).resolves.toEqual({ ok: false, erreur: 'Le contexte du module a changé.' });
        expect(afficher).toHaveBeenLastCalledWith(expect.objectContaining({ contexte: 4 }));
        canal.fermer();
    });

    it('« fermés » vide la vue ; une fois fermé, le canal ne fait plus rien', async () => {
        const { canal, afficher, envoyer } = preparer();
        canal.recevoir({ type: 'modules:mj:fermes' });
        expect(afficher).toHaveBeenLastCalledWith(null);
        canal.recevoir({ type: 'modules:mj:vue', payload: vue });
        canal.fermer();
        await expect(canal.toutCouper()).resolves.toMatchObject({ ok: false });
        expect(envoyer).not.toHaveBeenCalled();
    });
});
