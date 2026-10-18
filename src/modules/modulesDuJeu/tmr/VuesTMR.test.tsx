// @vitest-environment jsdom
import { cleanup, fireEvent, render, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VuesTMR } from './VuesTMR';
import * as moteur from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import type { CommandeDeModule } from '../protocole';
import { EditeurDesModules } from '../EditeurDesModules';
import type { GameDriver } from '../../../types/drivers';
const personnages = [{ id: 'alice', nom: 'Alice' }];
function etat() {
    return moteur.appliquerCommande(moteur.creerEtat(), { id: 'positionner', charge: { personnageId: 'alice', cible: 'G4', etape: 0 } }, { role: 'mj' }, { personnages });
}
afterEach(cleanup);
describe('vues tactiles TMR', () => {
    it('permet de choisir TMR pour le corpus historique RdD sans renommer son dossier', () => {
        const changer = vi.fn();
        const vue = render(<EditeurDesModules pilote={{ id: 'custom-rdd', name: 'Rêve de Dragon', corpusId: 'reves de dragons' } as GameDriver} onChange={changer} />);
        fireEvent.click(vue.getByRole('checkbox', { name: /Terres Médianes du Rêve/ }));
        expect(changer).toHaveBeenCalledWith([{ id: 'rdd-tmr' }]);
    });
    it('présente les 189 cases accessibles, les crédits et les seuls contrôles du joueur', async () => {
        const envoyerCommande = vi.fn(async (_commande: CommandeDeModule) => ({ ok: true as const }));
        const vue = render(<VuesTMR vue={moteur.vuePour(etat(), { role: 'joueur', personnageId: 'alice' })} envoyerCommande={envoyerCommande} />);
        expect(vue.getByRole('button', { name: 'G4 · Sanctuaire BLANC' })).toBeTruthy();
        expect(vue.getByText('Crédits et licences')).toBeTruthy();
        expect(vue.queryByLabelText('Préparation secrète du MJ')).toBeNull();
        await act(async () => fireEvent.click(vue.getByRole('button', { name: 'Demander la montée' })));
        expect(envoyerCommande.mock.calls[0][0]).toMatchObject({ id: 'proposer', charge: { cible: 'G4', action: 'monter', etape: 1 } });
        expect(envoyerCommande.mock.calls[0][0].charge).not.toHaveProperty('personnageId');
    });
    it('exige une confirmation neuve pour chaque demande et affiche les échecs de transport', async () => {
        let e = moteur.appliquerCommande(etat(), { id: 'proposer', charge: { operationId: 'op', etape: 1, action: 'monter', cible: 'G4', rythme: 'normal' } }, { role: 'joueur', personnageId: 'alice' }, { personnages });
        const envoyerCommande = vi.fn(async () => ({ ok: false as const, erreur: 'Disque indisponible' }));
        const props = () => ({ vue: moteur.vuePour(e, { role: 'mj' }, { personnages }), envoyerCommande });
        const vue = render(<VuesTMR {...props()} />);
        const valider = () => vue.getByRole('button', { name: 'Valider le trajet' }) as HTMLButtonElement;
        expect(valider().disabled).toBe(true);
        fireEvent.click(vue.getByLabelText('Coûts, jets et conséquences résolus sur la fiche'));
        await act(async () => fireEvent.click(valider())); expect(vue.getByRole('alert').textContent).toBe('Disque indisponible');
        e = { ...e, voyageurs: e.voyageurs.map(v => ({ ...v, demande: { ...v.demande!, operationId: 'autre' } })) };
        vue.rerender(<VuesTMR {...props()} />); expect(valider().disabled).toBe(true);
    });
});
