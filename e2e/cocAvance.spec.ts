import { test, expect } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { NexusDriverState } from '../src/modules/system/archive/nexus.types';
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; hasardCoc?: typeof Math.random };
const sortie = path.resolve('output/coc-a1-a3');
test('COC-A1/A2/A3 : critique, RD, CON, persistance, rôles Pulp et bande', async () => {
    test.setTimeout(240_000);
    const fichier = path.join(sortie, 'pilote/COC-2.1.0-d20.gmos-driver');
    const source = JSON.parse(new AdmZip(fichier).readAsText('state.json')) as NexusDriverState;
    const g = await lancerGmOs(), f = g.fenetre;
    fs.mkdirSync(sortie, { recursive: true });
    try {
        await f.setViewportSize({ width: 1440, height: 1200 }); await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState({ campaigns: [], players: [], entities: [], sessions: [], scenes: [], actes: [], activeCampaignId: null, customGameDrivers: [], customSheetTemplates: [], currentView: 'library' }));
        await g.application.evaluate(({ dialog }, fichier) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [fichier] }); }, fichier);
        await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().customGameDrivers[0]?.version)).toBe('2.1.0');
        const fermer = f.locator('#nexus-bilan-fermer'); if (await fermer.isVisible()) await fermer.click();
        await f.evaluate(source => {
            const w = window as unknown as Fenetre, s = w.useSessionOSStore.getState();
            const defaults = Object.fromEntries(source.sheetTemplate!.sections.flatMap(sec => sec.fields).map(c => [c.id, c.defaultValue ?? '']));
            w.useSessionOSStore.setState({ campaigns: [{ id: 'coc-recette', name: 'Les Ombres du Queens', system: source.gameDriver.id, activeLocationIds: [] }], activeCampaignId: 'coc-recette',
                players: [{ id: 'coc-j', realName: 'Test fictif', characters: [{ id: 'amelia', name: 'Amelia Steele', campaignId: 'coc-recette', systemId: source.gameDriver.id, templateId: source.sheetTemplate!.id, hp: 0, maxHp: 0,
                    sheetData: { ...defaults, nom: 'Amelia Steele', constitution: 2, force: 3, defense: 14, protection_rd: 2, echelle_de_sante: 0,
                        arme1: 'Revolver', arme1_attaque: 2, arme1_dm: '1d8', arme1_bc: 8, arme1_type: 'distance' } }] }],
                entities: [{ id: 'voyou', name: 'Les trois voyous', type: 'npc', campaignId: 'coc-recette', systemId: source.gameDriver.id, templateId: source.sheetTemplate!.id, hp: 0, maxHp: 0, sheetData: { ...defaults, defense: 10, echelle_de_sante: 0 } }], currentView: 'players' } as never);
            s.setSelectedPlayer('coc-j'); s.setSelectedCharacter('amelia');
            w.useCombatStore.getState().clearCombatants();
            w.useCombatStore.getState().addCombatant({ name: 'Amelia Steele', init: 12, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: 'amelia' });
        }, source);
        const perso = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
        const pnj = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().entities[0]);
        const hasard = async (v: number, action: () => Promise<unknown>) => {
            await f.evaluate(v => { const w = window as unknown as Fenetre; w.hasardCoc = Math.random; Math.random = () => v; }, v);
            try { await action(); } finally { await f.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardCoc) Math.random = w.hasardCoc; }); }
        };
        await ongletDeLaFiche(f, 'Lancer un test');
        let panneau = f.locator('[data-panneau-de-jet]').first();
        await panneau.locator('select').first().selectOption('arme1_attaque');
        await hasard(.999, () => panneau.getByRole('button', { name: 'Lancer', exact: true }).click());
        const dm = panneau.locator('[data-dommages-coc]'); await expect(dm).toBeVisible();
        await dm.getByLabel('Cible des DM').selectOption('pc:amelia');
        await hasard(.8, () => dm.getByRole('button', { name: 'Lancer les DM', exact: true }).click());
        await expect(dm).toContainText('15 DM'); await expect(dm).toContainText('RD 2 → 13 subis');
        await dm.screenshot({ path: path.join(sortie, 'jeu-coc-dommages.jpg'), type: 'jpeg', quality: 85 });
        await dm.getByRole('button', { name: 'Appliquer les DM à la cible' }).click();
        await expect.poll(async () => (await perso()).sheetData?.echelle_de_sante).toBe(13);
        await expect(dm.getByRole('button', { name: 'Coup appliqué' })).toBeDisabled();
        const carte = f.locator('[data-carte-du-jeu="suivi-coc"]'); if (await carte.getAttribute('open') === null) await carte.locator('summary').first().click();
        let sante = carte.locator('[data-sante-coc]'); await expect(sante).toContainText('DEF effective 11');
        const con = sante.locator('[data-consequence-coc="affaibli"]');
        await con.getByLabel('Résultat de CON').selectOption('false');
        await sante.screenshot({ path: path.join(sortie, 'jeu-coc-consequences.jpg'), type: 'jpeg', quality: 85 });
        await con.getByRole('button', { name: 'Confirmer la conséquence' }).click();
        await expect(sante.getByRole('button', { name: 'Consommer la prochaine action perdue' })).toBeVisible();
        await f.waitForTimeout(800); await f.reload(); await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setCurrentView('players'); s.setSelectedPlayer('coc-j'); s.setSelectedCharacter('amelia'); });
        await ongletDeLaFiche(f, 'Lancer un test');
        const carteReprise = f.locator('[data-carte-du-jeu="suivi-coc"]'); if (await carteReprise.getAttribute('open') === null) await carteReprise.locator('summary').first().click();
        sante = f.locator('[data-sante-coc]');
        expect((await perso()).sheetData?.echelle_de_sante).toBe(13);
        await sante.getByRole('button', { name: 'Consommer la prochaine action perdue' }).click();
        await expect(sante.locator('[data-consequence-coc]')).toHaveCount(0);
        await ouvrirLeModule(g, 'Combat-OS');
        const coc = f.locator('[data-panneau-combat-coc]'); await coc.locator('summary').first().click();
        await coc.getByLabel('Personnage COC').selectOption('npc:voyou');
        await coc.getByLabel('Santé Pulp du PNJ').check();
        await coc.getByRole('button', { name: 'Confirmer le profil PNJ' }).click();
        await expect(coc.locator('[data-sante-coc]')).toContainText('0/4');
        await coc.getByText('Lancer un test pour Les trois voyous', { exact: true }).click();
        panneau = coc.locator('[data-panneau-de-jet]');
        await panneau.locator('select').first().selectOption('force');
        await hasard(.999, () => panneau.getByRole('button', { name: 'Lancer', exact: true }).click());
        await expect(panneau.locator('[data-composition-coc]')).toContainText('Aucune réussite critique');
        await expect(panneau.locator('[data-suites-coc]')).not.toContainText('Réussite critique');
        await coc.getByLabel('Rôle du PNJ').selectOption('premier');
        await coc.getByRole('button', { name: 'Confirmer le profil PNJ' }).click();
        await expect(coc.locator('[data-sante-coc]')).toContainText('0/24');
        await coc.getByText('Lancer un test pour Les trois voyous', { exact: true }).click();
        await coc.locator('[data-profil-coc]').screenshot({ path: path.join(sortie, 'jeu-coc-profils.jpg'), type: 'jpeg', quality: 85 });
        await coc.getByLabel('Rôle du PNJ').selectOption('figurant'); await coc.getByLabel('Santé Pulp du PNJ').uncheck();
        await coc.getByLabel('Bande de sbires').check();
        await coc.getByRole('button', { name: 'Confirmer le profil PNJ' }).click();
        await expect(coc.locator('[data-bande-coc]')).toContainText('+5');
        await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setCurrentView('players'); s.setSelectedPlayer('coc-j'); s.setSelectedCharacter('amelia'); });
        await ongletDeLaFiche(f, 'Lancer un test'); panneau = f.locator('[data-panneau-de-jet]').first();
        await panneau.locator('select').first().selectOption('arme1_attaque');
        await hasard(.999, () => panneau.getByRole('button', { name: 'Lancer', exact: true }).click());
        const bande = panneau.locator('[data-dommages-coc]'); await bande.getByLabel('Cible des DM').selectOption('npc:voyou');
        await expect(bande.getByRole('button', { name: 'Lancer les DM' })).toHaveCount(0);
        await bande.screenshot({ path: path.join(sortie, 'jeu-coc-bande.jpg'), type: 'jpeg', quality: 85 });
        await bande.getByRole('button', { name: 'Confirmer la touche : retirer un membre' }).click();
        await expect.poll(async () => (await pnj()).sheetData?.echelle_de_sante).toBe(1);
        const avantVariante = (await perso()).sheetData;
        for (const [archive, des] of [['COC-2.1.0-option-3d6.gmos-driver', '3d6'], ['COC-2.1.0-d20.gmos-driver', 'd20']] as const) {
            await ouvrirLeModule(g, 'Tableau de Bord');
            await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('library'));
            await g.application.evaluate(({ dialog }, cible) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] }); }, path.join(sortie, 'pilote', archive));
            await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
            await f.locator('#nexus-conflict-replace').click();
            await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().getActiveDriver()?.jet?.coc?.des)).toBe(des);
            const bilan = f.locator('#nexus-bilan-fermer'); if (await bilan.isVisible()) await bilan.click();
            expect((await perso()).sheetData).toEqual(avantVariante);
            expect((await pnj()).sheetData?.echelle_de_sante).toBe(1);
            await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setCurrentView('players'); s.setSelectedPlayer('coc-j'); s.setSelectedCharacter('amelia'); });
            await ongletDeLaFiche(f, 'Lancer un test'); panneau = f.locator('[data-panneau-de-jet]').first();
            await panneau.locator('select').first().selectOption('volonte');
            await expect(panneau.locator('[data-composition-coc]')).toContainText(des === '3d6' ? '3d6' : '1d20');
            await hasard(.5, () => panneau.getByRole('button', { name: 'Lancer', exact: true }).click());
            await expect(panneau.locator('[data-suites-coc]')).toBeVisible();
            if (des === '3d6') await panneau.screenshot({ path: path.join(sortie, 'jeu-coc-3d6.jpg'), type: 'jpeg', quality: 85 });
        }
        fs.writeFileSync(path.join(sortie, 'verification-electron.json'), JSON.stringify({ pilote: '2.1.0', importReel: true, critique15Rd2Subis13: true, defenseBase14Effective11: true,
            con10ActionPerdue: true, persistanceSansRejeu: true, figurant20SansCritique: true, pulp4et24: true, bande3UneToucheUnMembre: true, remplacement3d6EtRetourD20: true, profilJetable: true }, null, 2));
    } finally { await g.fermer(); }
});
