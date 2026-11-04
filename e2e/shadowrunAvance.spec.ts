import { test, expect } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { NexusDriverState } from '../src/modules/system/archive/nexus.types';
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; randomAvantSR?: typeof Math.random };
const sortie = path.resolve('output/shadowrun-sr-a1-a3');
const fichier = path.join(sortie, 'pilote/Shadowrun-Anarchy-2.1.0.gmos-driver');

test('SR-A1/A2/A3 : import, drain, Anarchy 100, Matrice et persistance', async () => {
    test.setTimeout(240_000);
    const source = JSON.parse(new AdmZip(fichier).readAsText('state.json')) as NexusDriverState;
    const g = await lancerGmOs(), f = g.fenetre;
    try {
        await f.setViewportSize({ width: 1440, height: 1200 });
        await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState({ campaigns: [], players: [], entities: [], sessions: [], scenes: [], actes: [], activeCampaignId: null,
            customGameDrivers: [], customSheetTemplates: [], currentView: 'library' }));
        await g.application.evaluate(({ dialog }, fichier) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [fichier] }); }, fichier);
        await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().customGameDrivers[0]?.version)).toBe('2.1.0');
        const fermer = f.locator('#nexus-bilan-fermer'); if (await fermer.isVisible()) await fermer.click();
        await f.evaluate(source => {
            const magasin = (window as unknown as Fenetre).useSessionOSStore, s = magasin.getState();
            const defaults = Object.fromEntries(source.sheetTemplate!.sections.flatMap(sec => sec.fields).map(c => [c.id, c.defaultValue ?? '']));
            magasin.setState({ campaigns: [{ id: 'sr-recette', name: 'Archives du miroir', system: source.gameDriver.id, activeLocationIds: [] }],
                activeCampaignId: 'sr-recette', players: [{ id: 'sr-joueur', realName: 'Joueur fictif', characters: [{ id: 'sr-pj', name: 'Prisme', systemId: source.gameDriver.id,
                    templateId: source.sheetTemplate!.id, campaignId: 'sr-recette', hp: 0, maxHp: 0,
                    sheetData: { ...defaults, competence_1_nom: 'Sorcellerie', competence_1: 7, competence_1_rr: 0,
                        competence_1_reference: 'agilite', competence_1_attribut: 2, competence_1_reserve: 9, agilite: 4, force: 4,
                        anarchy: 99, essence: 6, piratage_des_de_risque: 2 },
                }] }] } as never);
            s.setSelectedPlayer('sr-joueur'); s.setSelectedCharacter('sr-pj'); s.setCurrentView('players');
        }, source);
        await ongletDeLaFiche(f, 'Lancer un test');
        const personnage = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
        const panneau = f.locator('[data-panneau-de-jet]').first();
        await panneau.locator('select').nth(0).selectOption('competence_1'); await panneau.locator('select').nth(1).selectOption('agilite');
        await panneau.getByLabel('Test de magie', { exact: true }).check();
        await panneau.getByLabel(/Action soumise au drain/).check();
        await panneau.getByLabel('Dés de risque', { exact: true }).fill('2');
        const lancer = async (valeur: number) => {
            await f.evaluate(v => { const w = window as unknown as Fenetre; w.randomAvantSR = Math.random; Math.random = () => v; }, valeur);
            try { await panneau.getByRole('button', { name: 'Lancer', exact: true }).click(); }
            finally { await f.evaluate(() => { const w = window as unknown as Fenetre; if (w.randomAvantSR) Math.random = w.randomAvantSR; }); }
        };
        await lancer(0);
        await expect.poll(async () => (await personnage()).sheetData?.anarchy).toBe(100);
        await panneau.getByRole('button', { name: 'Confirmer les conséquences drain / Matrice' }).click();
        await expect.poll(async () => (await personnage()).sheetData?.blessures_legeres).toBe(1);
        const sante = f.locator('[data-suivi-shadowrun]');
        await expect(sante.getByRole('button', { name: 'Soigner cette case' })).toBeDisabled();
        await f.locator('[data-carte-du-jeu="suivi-shadowrun"]').screenshot({ path: path.join(sortie, 'jeu-shadowrun-drain.jpg'), type: 'jpeg', quality: 85 });
        await sante.getByRole('button', { name: 'Fin de la prochaine narration' }).click();
        const derives = sante.locator('[data-derives-shadowrun]'); await derives.locator('summary').click();
        await derives.locator('div').filter({ hasText: 'Compétence 1 — réserve de dés :' }).getByRole('button', { name: 'Appliquer', exact: true }).click();
        await expect.poll(async () => (await personnage()).sheetData?.competence_1_reserve).toBe(11);
        expect((await personnage()).sheetData?.blessures_legeres).toBe(1);
        await panneau.getByLabel('Test de magie', { exact: true }).uncheck();
        const matrice = panneau.locator('[data-matrice-shadowrun]');
        await matrice.getByLabel('Cyberdeck disponible').check(); await matrice.getByLabel('IND disponible').check();
        await matrice.getByLabel('Nouvelle cible matricielle').fill('Archives du miroir');
        await matrice.getByRole('button', { name: 'Ajouter la cible' }).click();
        await matrice.getByLabel('Firewall effectif').fill('4');
        await matrice.getByLabel('Tentative de piratage').check();
        await matrice.getByLabel('Accès visé').selectOption('2');
        await expect(matrice).toContainText('Seuil 6 = Firewall 4 + accès 2');
        await matrice.getByLabel('Préparation de backdoor').selectOption('2');
        await expect(matrice).toContainText('Seuil 4 = Firewall 4 + accès 2 − backdoor 2');
        await lancer(0);
        await panneau.getByRole('button', { name: 'Confirmer les conséquences drain / Matrice' }).click();
        await expect.poll(async () => (await personnage()).sheetData?.piratage_hausse_du_seuil).toBe(1);
        await lancer(0.99);
        await panneau.getByRole('button', { name: 'Confirmer les conséquences drain / Matrice' }).click();
        await expect(matrice.getByLabel('Accès actuel')).toHaveValue('2');
        await matrice.getByLabel('Mode de connexion').selectOption('hot-ind');
        await expect(matrice.getByLabel('Accès actuel')).toHaveValue('0');
        await expect(matrice).toContainText('mental létal — Volonté');
        await matrice.screenshot({ path: path.join(sortie, 'jeu-shadowrun-matrice.jpg'), type: 'jpeg', quality: 85 });
        const avant = (await personnage()).sheetData;
        await f.reload(); await attendreLHydratation(g);
        expect((await personnage()).sheetData).toEqual(avant);
        fs.writeFileSync(path.join(sortie, 'verification-electron.json'), JSON.stringify({ importPilote: '2.1.0', drainProtege: true, anarchy100: true,
            derivesSansEffacerBlessure: true, seuilAdministrateur: 6, backdoorUneHeure: 4, surveillance: true,
            accesEtRedemarrageHotSim: true, biofeedback: 'mental létal', persistance: true, donneesPersonnelles: false }, null, 2));
    } finally { await g.fermer(); }
});
