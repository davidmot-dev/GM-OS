// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { PupitreCombatSpatial, VueEquipage } from './VuesCombatSpatial';
import * as spatial from '../../../../outils/alien/modules/combat-spatial/moteur.mjs';
import type { CommandeCombatSpatial, EtatCombatSpatial } from '../../../../outils/alien/modules/combat-spatial/moteur.mjs';

/** **Le combat spatial d'Alien à l'écran** — pupitre de Maman et tablette de l'équipage (23/10/2026). */
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const mj = { role: 'mj' as const }, alice = { role: 'joueur' as const, personnageId: 'alice' };
const personnages = [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }];

/** Un hôte en mémoire : la vue se redessine après chaque commande, comme au poste de Maman. */
function hote(depart: EtatCombatSpatial, lecteur: typeof mj | typeof alice, Vue: typeof PupitreCombatSpatial) {
    let etat = depart;
    const commandes: string[] = [];
    const props = () => ({
        vue: spatial.vuePour(etat, lecteur, { personnages }),
        envoyerCommande: async (c: { id: string; charge: unknown }) => {
            try { etat = spatial.appliquerCommande(etat, c as CommandeCombatSpatial, lecteur); commandes.push(c.id); rendu.rerender(<Vue {...props()} />); return { ok: true as const }; }
            catch (e) { return { ok: false as const, erreur: (e as Error).message }; }
        },
    });
    const rendu = render(<Vue {...props()} />);
    return { rendu, etat: () => etat, commandes, definir: (e: EtatCombatSpatial) => { etat = e; rendu.rerender(<Vue {...props()} />); } };
}
const cliquer = async (el: HTMLElement) => { await act(async () => { fireEvent.click(el); }); };
const soumettre = async (el: HTMLElement) => { await act(async () => { fireEvent.submit(el); }); };

describe('le pupitre de Maman', () => {
    it('prépare une frégate du livre avec son armement, confie un poste à Alice, engage le combat', async () => {
        const h = hote(spatial.creerEtat(), mj, PupitreCombatSpatial);
        const { getByLabelText, getByRole } = h.rendu;
        fireEvent.change(getByLabelText('Modèle du livre'), { target: { value: 'conestoga' } });
        const form = getByRole('form', { name: 'Préparer un vaisseau' });
        fireEvent.change(within(form).getByLabelText('Nom'), { target: { value: 'USS Patna' } });
        fireEvent.change(within(form).getByLabelText('Camp'), { target: { value: 'adverse' } });
        expect((within(form).getByLabelText('Coque') as HTMLInputElement).value).toBe('12');
        expect((within(form).getByLabelText('Missiles ASAT longue portée') as HTMLInputElement).checked).toBe(true);
        await soumettre(form);
        expect(h.etat().vaisseaux[0]).toMatchObject({ nom: 'USS Patna', camp: 'adverse', coque: 12, protection: 10 });
        expect(h.etat().vaisseaux[0].armes).toHaveLength(7);

        fireEvent.change(getByLabelText('Modèle du livre'), { target: { value: 'corvus' } });
        const form2 = getByRole('form', { name: 'Préparer un vaisseau' });
        fireEvent.change(within(form2).getByLabelText('Nom'), { target: { value: 'Montero' } });
        await soumettre(form2);
        const montero = h.etat().vaisseaux.find(v => v.nom === 'Montero')!;
        const poste = getByRole('form', { name: 'Opérateur-senseurs de Montero' });
        fireEvent.change(within(poste).getByLabelText('Qui tient le poste Opérateur-senseurs de Montero'), { target: { value: 'alice' } });
        fireEvent.change(within(poste).getByLabelText('Dés de base'), { target: { value: '5' } });
        await soumettre(poste);
        expect(h.etat().vaisseaux.find(v => v.id === montero.id)!.postes.senseurs).toMatchObject({ personnageId: 'alice', nom: 'Alice', base: 5 });

        for (const v of h.etat().vaisseaux) await cliquer(getByLabelText(new RegExp(`^${v.nom}`)));
        await cliquer(getByRole('button', { name: 'Démarrer le combat' }));
        expect(h.etat().combat).toMatchObject({ tour: 1, phase: 1, etape: 'ordres', distance: 8 });
        expect(getByRole('button', { name: 'Révéler les ordres' })).toBeTruthy();
        // Un ordre venu d'ailleurs (la tablette) : le formulaire du meneur s'y recale, au lieu de l'écraser.
        const patna = h.etat().vaisseaux.find(v => v.nom === 'USS Patna')!;
        h.definir(spatial.appliquerCommande(h.etat(), { id: 'ordonner', charge: { vaisseauId: patna.id, action: 'faire-le-mort', coupe: 'aucun' } }, mj));
        expect((getByLabelText('Action de USS Patna') as HTMLSelectElement).value).toBe('faire-le-mort');
    });
});

describe('la tablette de l’équipage', () => {
    function engage() {
        let e = spatial.creerEtat();
        const ag = (id: string, charge: unknown) => { e = spatial.appliquerCommande(e, { id, charge } as CommandeCombatSpatial, mj); };
        ag('vaisseau', { nom: 'Montero', modele: 'libre', camp: 'joueurs', signature: 1, propulseurs: 1, coque: 9, protection: 6, armes: [], transpondeur: true, ombilic: false });
        ag('vaisseau', { nom: 'USS Patna', modele: 'conestoga', camp: 'adverse', signature: 0, propulseurs: 1, coque: 12, protection: 10, armes: ['asat-longue'], transpondeur: false, ombilic: true });
        const [nous, eux] = e.vaisseaux.map(v => v.id);
        ag('poste', { vaisseauId: nous, poste: 'senseurs', personnageId: 'alice', nom: 'Alice', base: 4, stress: 1, talent: false, synthetique: false });
        ag('demarrer-combat', { vaisseaux: [nous, eux], distance: 8, velociteJoueurs: 2, velociteAdverse: 2 });
        e = { ...e, combat: { ...e.combat!, initiative: { [nous]: 1, [eux]: 2 } } };
        return { e, nous, eux };
    }

    it('Alice règle ses dés, ordonne le verrouillage, résout et force son jet ; l’adversaire reste un contact', async () => {
        const { e, nous } = engage();
        const h = hote(e, alice, VueEquipage as typeof PupitreCombatSpatial);
        const { getByRole, getByLabelText, queryByText } = h.rendu;
        expect(queryByText(/USS Patna/)).toBeNull();
        expect(getByRole('list', { name: 'Contacts' }).textContent).toContain('Contact non identifié');
        const des = getByRole('form', { name: 'Mes dés : Opérateur-senseurs' });
        fireEvent.change(within(des).getByLabelText('Niveau de Stress'), { target: { value: '2' } });
        await soumettre(des);
        expect(h.etat().vaisseaux.find(v => v.id === nous)!.postes.senseurs.stress).toBe(2);

        fireEvent.change(getByLabelText('Action de Montero'), { target: { value: 'verrouiller' } });
        await soumettre(getByRole('form', { name: 'Ordre de Montero' }));
        expect(h.etat().combat!.ordres[nous]).toMatchObject({ action: 'verrouiller' });
        h.definir(spatial.appliquerCommande(h.etat(), { id: 'reveler', charge: {} }, mj));
        vi.spyOn(Math, 'random').mockReturnValue(0.5); // que des 4 : ni succès, ni panique
        await cliquer(getByRole('button', { name: 'Résoudre notre action' }));
        expect(h.etat().combat!.enAttente?.peutForcer).toBe(true);
        await cliquer(getByRole('button', { name: 'Forcer le jet (Stress +1)' }));
        expect(h.etat().vaisseaux.find(v => v.id === nous)!.postes.senseurs.stress).toBe(3);
        expect(h.etat().combat!.enAttente).toBeNull();
        expect(getByRole('region', { name: 'Journal du combat' }).textContent).toMatch(/Alice force le jet : Stress 3/);
    });
});
