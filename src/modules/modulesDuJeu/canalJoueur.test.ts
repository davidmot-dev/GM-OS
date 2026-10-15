import { afterEach, describe, it, expect, vi } from 'vitest';
import { CanalDesModulesJoueur } from './canalJoueur';
const vue = { campagneId: 'a', personnageId: 'alice', contexte: 1, revision: 2, modules: [{ id: 'alien-muthur', libelle: 'MÈRE', revision: 1, vue: {} }] };
afterEach(() => vi.useRealTimers());
function preparer() {
    const envoyer = vi.fn(), afficher = vi.fn();
    const identite = { personnageId: 'alice' as string | null, campagneId: 'a' };
    const canal = new CanalDesModulesJoueur(envoyer, () => identite, afficher);
    canal.recevoir({ type: 'modules:vue', payload: vue });
    return { canal, envoyer, afficher, identite };
}
describe('canal joueur éphémère', () => {
    it('refuse les vues d’un autre personnage, d’une ancienne campagne ou révision', () => {
        const { canal, afficher } = preparer(); afficher.mockClear();
        for (const changement of [{ personnageId: 'bob' }, { campagneId: 'autre' }, { contexte: 0 }, { revision: 1 }]) canal.recevoir({ type: 'modules:vue', payload: { ...vue, ...changement } });
        expect(afficher).not.toHaveBeenCalled(); canal.fermer();
    });
    it('attend un accusé correspondant et ne fait confiance à aucun autre résultat', async () => {
        const { canal, envoyer } = preparer();
        const resultat = canal.commander('alien-muthur', { id: 'saisir', charge: { texte: 'HELP' } });
        const requete = envoyer.mock.calls[0][0];
        canal.recevoir({ type: 'modules:resultat', payload: { requeteId: 'inconnue', ok: true } });
        canal.recevoir({ type: 'modules:resultat', payload: { requeteId: requete.payload.requeteId, ok: true } });
        expect(await resultat).toEqual({ ok: true }); canal.fermer();
    });
    it('annule les attentes et efface la vue au retrait et à la déconnexion', async () => {
        const { canal, afficher } = preparer();
        const resultat = canal.commander('alien-muthur', { id: 'saisir', charge: { texte: 'HELP' } });
        canal.recevoir({ type: 'modules:vue', payload: { ...vue, contexte: 2, revision: 3, modules: [] } });
        expect((await resultat).ok).toBe(false);
        expect((await canal.commander('alien-muthur', { id: 'saisir', charge: {} })).ok).toBe(false);
        canal.fermer(); expect(afficher).toHaveBeenLastCalledWith(null);
        canal.recevoir({ type: 'modules:vue', payload: vue }); expect(afficher).toHaveBeenLastCalledWith(null);
    });
    it('ne rejoue pas une commande après un délai ou un changement de PJ', async () => {
        vi.useFakeTimers();
        const { canal, envoyer, identite } = preparer();
        const resultat = canal.commander('alien-muthur', { id: 'saisir', charge: { texte: 'HELP' } });
        await vi.advanceTimersByTimeAsync(10000);
        expect((await resultat).ok).toBe(false); expect(envoyer).toHaveBeenCalledTimes(1);
        identite.personnageId = 'bob';
        expect((await canal.commander('alien-muthur', { id: 'saisir', charge: {} })).ok).toBe(false);
        canal.fermer();
    });
});
