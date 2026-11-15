import { test, expect, chromium, type Browser } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useClockStore } from '../src/store/useClockStore';

/**
 * **L'écran de table, de bout en bout** — Fire HD 8, registre § 256, T12-T13.
 *
 * Décisions de David du 15/11/2026 : des widgets choisis à la volée (Q3), une sélection à lui (Q5).
 * Le meneur coche dans la section « Écran de table » du tableau de bord de l'Ulanzi (vraie interface) ;
 * la « Fire » est un client HTTP/WebSocket de 960 × 600 en rôle `hub`, sans pont Electron.
 *
 *   npm run build ; npx playwright test e2e/ecranDeTable.spec.ts
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_ALIEN ?? 'Export Dirvers/corriges/Alien-1.11.0.gmos-driver');
const PREUVES = path.resolve('output/e2e/ecran-de-table');
const CAMPAGNE = 'essai-ecran-alien', PERSO = 'essai-wilson';
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useClockStore: typeof useClockStore };

test('l’écran de table montre les widgets cochés pour lui, et rien de caché', async () => {
    test.setTimeout(300_000);
    test.skip(!fs.existsSync(PILOTE), `pilote Alien absent : ${PILOTE}`);
    fs.mkdirSync(PREUVES, { recursive: true });
    const brut = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-ecran-de-table-'));
    const source = JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json', 'utf8')), s = semence.modules.sessionOS;
    s.campaigns = [{ id: CAMPAGNE, name: 'Essai de l’écran', system: source.gameDriver.id, systemPath: 'systems/alien', activeLocationIds: [] }];
    s.activeCampaignId = CAMPAGNE; s.customGameDrivers = [source.gameDriver]; s.customSheetTemplates = [source.sheetTemplate];
    s.players = [{ id: 'essai-joueur', realName: 'Joueur fictif', isOnline: false, characters: [{ id: PERSO, name: 'Wilson', campaignId: CAMPAGNE,
        systemId: source.gameDriver.id, templateId: source.sheetTemplate.id, hp: 4, maxHp: 4, sheetData: {} }] }];
    s.entities = []; s.sessions = [{ ...s.sessions[0], id: 'essai-seance-ecran', campaignId: CAMPAGNE, status: 'active', number: 1, sessionEntityIds: [PERSO] }];
    const fichier = path.join(brut, 'semence.json'); fs.writeFileSync(fichier, JSON.stringify(semence));

    const g = await lancerGmOs({ semence: fichier });
    const f = g.fenetre; f.setDefaultTimeout(15_000);
    let navigateur: Browser | undefined;
    try {
        await attendreLHydratation(g);
        await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(c => { const etat = (window as unknown as Fenetre).useSessionOSStore.getState(); etat.setActiveCampaign(c); etat.setCurrentView('cockpit'); }, CAMPAGNE);

        // Une jauge vue par les joueurs, une cachée ; un combat projeté avec un rôdeur caché.
        await f.evaluate(() => {
            const w = window as unknown as Fenetre;
            w.useClockStore.setState({ isClockProjected: true, tensions: [
                { id: 'air', name: 'Air restant', totalSegments: 10, filledSegments: 6 },
                { id: 'secret', name: 'Plan de la Compagnie', totalSegments: 4, filledSegments: 1, vueParLesJoueurs: false },
            ] } as never);
            w.useCombatStore.setState({ isCombatProjected: true, round: 3, currentTurnIdx: 0, combatants: [
                { id: 'a', name: 'Wilson', isPlayer: true, statuses: [] },
                { id: 'b', name: 'Rôdeur secret', isPlayer: false, statuses: [{ name: 'Caché' }] },
                { id: 'c', name: 'Nel Varga', isPlayer: true, statuses: [] },
            ] } as never);
        });

        // La « Fire » en écran de table.
        navigateur = await chromium.launch({ channel: 'msedge' });
        const contexte = await navigateur.newContext({ viewport: { width: 960, height: 600 }, serviceWorkers: 'block', locale: 'fr-FR' });
        const ecran = await contexte.newPage(); ecran.setDefaultTimeout(15_000);
        await ecran.goto(`http://127.0.0.1:${g.ports.sync}/?window=ecran-de-table&sync=${g.ports.sync}`);
        await expect(ecran.getByText('Aucun widget choisi pour l’écran de table.')).toBeVisible();
        expect(await ecran.evaluate(() => !!window.appBridge)).toBe(false);

        // Le meneur coche, dans la section de l'écran (pas celle de l'Ulanzi).
        const section = f.getByRole('group', { name: 'Écran de table' });
        await section.getByRole('checkbox', { name: 'Ordre du tour', exact: true }).check();
        await section.getByRole('checkbox', { name: 'Horloges de tension', exact: true }).check();
        await expect(ecran.getByText('Wilson', { exact: true })).toBeVisible();
        await expect(ecran.getByText('Tour 3')).toBeVisible();
        await expect(ecran.getByRole('region', { name: 'Air restant' })).toContainText('6/10');
        await expect(ecran.locator('body')).not.toContainText('Plan de la Compagnie');
        await expect(ecran.locator('body')).not.toContainText('Rôdeur secret');
        await ecran.screenshot({ path: path.join(PREUVES, '1-ordre-et-jauge.png') });

        // La jauge bouge au poste : l'écran suit sans geste (C10).
        await f.evaluate(() => {
            const w = window as unknown as Fenetre;
            w.useClockStore.setState({ tensions: w.useClockStore.getState().tensions.map(t => t.id === 'air' ? { ...t, filledSegments: 4 } : t) });
        });
        await expect(ecran.getByRole('region', { name: 'Air restant' })).toContainText('4/10');

        // Décoché : le widget quitte l'écran (C9).
        await section.getByRole('checkbox', { name: 'Ordre du tour', exact: true }).uncheck();
        await expect(ecran.getByText('Wilson', { exact: true })).toHaveCount(0);
        await ecran.screenshot({ path: path.join(PREUVES, '2-jauge-seule.png') });

        // Les quatre formes ensemble, jauge critique (9/10) et minuteur sous la minute : la capture de la maquette.
        await f.evaluate(() => {
            const w = window as unknown as Fenetre;
            w.useClockStore.setState({ timerDuration: 600, timerRemaining: 48, mode: 'realtime',
                tensions: w.useClockStore.getState().tensions.map(t => t.id === 'air' ? { ...t, filledSegments: 9 } : t) } as never);
        });
        for (const nom of ['Ordre du tour', 'Minuteur', 'Heure du monde']) await section.getByRole('checkbox', { name: nom, exact: true }).check();
        await expect(ecran.getByRole('region', { name: 'Minuteur' })).toContainText('00:48');
        await expect(ecran.getByRole('region', { name: 'Air restant' })).toContainText('9/10');
        await ecran.waitForTimeout(900); // laisser finir l'éclair des valeurs qui viennent de changer
        await ecran.screenshot({ path: path.join(PREUVES, '3-quatre-tuiles.png') });
    } finally {
        await navigateur?.close();
        await g.fermer();
    }
});
