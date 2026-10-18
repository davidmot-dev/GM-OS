import { describe, expect, it } from 'vitest';
import { executerEcritureTMR } from './raccordDesTMR';
import { proposerCoutTMR } from '../../session/logic/ressourcesDesTMR';
import { recusDesTMR } from '../../session/logic/recusDesTMR';
import * as tmr from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
const personnages = [{ id: 'pj', nom: 'Fictif' }];
function installation() {
    let fiche = { templateId: 'rdd', sheetData: { reve_pts: 12, fatigue: 0, endurance: 24, endurance_max: 24, vie: 12, vie_max: 12, __rddReprise231: 1, __rddFatigue231: 1 } as Record<string, unknown> };
    let disque = structuredClone(fiche), etat = tmr.creerEtat(), panne = '';
    const cmd = (id: string, charge: unknown) => { etat = tmr.appliquerCommande(etat, { id, charge: { personnageId: 'pj', ...charge as object } }, { role: 'mj' }, { personnages }); };
    cmd('positionner', { cible: 'G4', etape: 0 });
    cmd('proposer', { operationId: 'demande', action: 'monter', cible: 'G4', rythme: 'normal', etape: 1 });
    cmd('engager-trajet', { operationId: 'demande', transactionId: 'transaction', empreinte: proposerCoutTMR(fiche, etat.voyageurs[0].demande!).empreinte, compteRendu: '' });
    const executer = (annuler = false) => executerEcritureTMR(etat.voyageurs[0].ecriture!, 'c', 'pj', {
        lire: () => fiche,
        ecrire: donnees => { if (panne === 'avant') throw new Error('Panne avant écriture'); fiche = { ...fiche, sheetData: donnees }; },
        confirmer: async recu => {
            if (panne === 'disque') throw new Error('Disque indisponible');
            disque = structuredClone(fiche);
            expect(recusDesTMR(disque.sheetData).find(r => r.id === 'transaction')).toEqual(recu);
        },
        terminer: async recu => {
            if (panne === 'acquittement') throw new Error('Accusé perdu');
            etat = tmr.terminerEcriture(etat, 'pj', 'transaction', !!recu, recu?.sortieForcee ?? false, recu?.detail ?? '');
        },
    }, annuler);
    return { executer, fiche: () => fiche, disque: () => disque, etat: () => etat, panne: (p: string) => { panne = p; },
        redemarrer: () => { fiche = structuredClone(disque); etat = tmr.migrerEtat(etat, 2); } };
}
describe('protocole du raccord : panne entre les deux stockages', () => {
    it('déplace seulement après relecture du reçu, et reste pur avant la validation', async () => {
        const t = installation(); expect(t.etat().voyageurs[0].present).toBe(false); expect(t.fiche().sheetData.reve_pts).toBe(12);
        await t.executer(); expect(t.etat().voyageurs[0]).toMatchObject({ present: true, ecriture: null });
        expect(t.disque().sheetData).toMatchObject({ reve_pts: 11, fatigue: 1 });
    });
    it('reprend une panne avant écriture sans perdre ni doubler le coût', async () => {
        const t = installation(); t.panne('avant'); await expect(t.executer()).rejects.toThrow();
        expect(t.fiche().sheetData.reve_pts).toBe(12); t.panne(''); await t.executer(); expect(t.fiche().sheetData.reve_pts).toBe(11);
    });
    it('après échec disque, persiste le même reçu en mémoire sans nouveau débit', async () => {
        const t = installation(); t.panne('disque'); await expect(t.executer()).rejects.toThrow();
        expect(t.fiche().sheetData.reve_pts).toBe(11); expect(t.disque().sheetData.reve_pts).toBe(12); expect(t.etat().voyageurs[0].ecriture).toBeTruthy();
        t.panne(''); await t.executer(); expect(t.disque().sheetData).toMatchObject({ reve_pts: 11, fatigue: 1 }); expect(recusDesTMR(t.disque().sheetData)).toHaveLength(1);
    });
    it('après reçu durable mais accusé perdu, un démarrage termine sans repayer ni reprendre le voyage', async () => {
        const t = installation(); t.panne('acquittement'); await expect(t.executer()).rejects.toThrow();
        expect(t.disque().sheetData.reve_pts).toBe(11); t.redemarrer(); t.panne(''); await t.executer();
        expect(t.fiche().sheetData).toMatchObject({ reve_pts: 11, fatigue: 1 }); expect(t.etat().voyageurs[0]).toMatchObject({ present: false, position: 'G4', ecriture: null });
        expect(t.etat().voyageurs[0].journal[0].texte).toContain('Débit confirmé');
    });
    it('après démarrage sans reçu, annule l’intention interrompue sans payer', async () => {
        const t = installation(); t.redemarrer(); await t.executer(); expect(t.fiche().sheetData.reve_pts).toBe(12);
        expect(t.etat().voyageurs[0].journal[0].texte).toContain('Annulé avant débit');
    });
    it('une annulation conditionnelle finit une opération déjà payée et ne la rembourse pas', async () => {
        const t = installation(); t.panne('acquittement'); await expect(t.executer()).rejects.toThrow(); t.panne(''); await t.executer(true);
        expect(t.disque().sheetData.reve_pts).toBe(11); expect(t.etat().voyageurs[0].journal[0].texte).toContain('Débit confirmé');
    });
});
