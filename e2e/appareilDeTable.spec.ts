import { test, expect, chromium, type Browser } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';
import type { EtatDetecteur } from '../outils/alien/modules/detecteur/moteur.mjs';

/**
 * **L'appareil de table, de bout en bout** — Fire HD 8, registre § 256, T11.
 *
 * Décisions de David du 15/11/2026 : la Fire au centre est l'appareil commun du groupe (Q2) ; le M314
 * d'abord (Q7) ; la table l'oriente si le meneur la désigne (Q8). Profil jetable, campagne et
 * personnage fictifs, pilote Alien 1.11.0. La « Fire » est un vrai client HTTP/WebSocket de
 * 960 × 600 px CSS (la Fire HD 8 en paysage), sans pont Electron.
 *
 *   npm run build ; npx playwright test e2e/appareilDeTable.spec.ts
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_ALIEN ?? 'Export Dirvers/corriges/Alien-1.11.0.gmos-driver');
const PREUVES = path.resolve('output/e2e/appareil-de-table');
const CAMPAGNE = 'essai-table-alien', PERSO = 'essai-nel';
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore };

test('le M314 ouvert à « La table » s’affiche sur l’appareil de table, qui l’oriente une fois désigné', async () => {
    test.setTimeout(300_000);
    test.skip(!fs.existsSync(PILOTE), `pilote Alien absent : ${PILOTE}`);
    fs.mkdirSync(PREUVES, { recursive: true });
    const brut = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-appareil-de-table-'));
    const source = JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json', 'utf8')), s = semence.modules.sessionOS;
    s.campaigns = [{ id: CAMPAGNE, name: 'Essai de la table', system: source.gameDriver.id, systemPath: 'systems/alien', activeLocationIds: [] }];
    s.activeCampaignId = CAMPAGNE; s.customGameDrivers = [source.gameDriver]; s.customSheetTemplates = [source.sheetTemplate];
    s.players = [{ id: 'essai-joueur', realName: 'Joueur fictif', isOnline: false, characters: [{ id: PERSO, name: 'Nel Varga', campaignId: CAMPAGNE,
        systemId: source.gameDriver.id, templateId: source.sheetTemplate.id, hp: 4, maxHp: 4, sheetData: {} }] }];
    s.entities = []; s.sessions = [{ ...s.sessions[0], id: 'essai-seance-table', campaignId: CAMPAGNE, status: 'active', number: 1, sessionEntityIds: [PERSO] }];
    const fichier = path.join(brut, 'semence.json'); fs.writeFileSync(fichier, JSON.stringify(semence));

    const g = await lancerGmOs({ semence: fichier });
    const f = g.fenetre; f.setDefaultTimeout(15_000);
    let navigateur: Browser | undefined;
    const vueModules = (): Promise<VueDesModulesMJ> => f.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
    const agir = async (id: string, charge: unknown) => {
        const vue = await vueModules();
        expect(await f.evaluate(({ vue, id, charge }) => window.appBridge!.modulesDuJeu!.commander({ campagneId: vue.campagneId!, contexte: vue.contexte,
            requeteId: `essai-${Math.random()}`, moduleId: 'alien-detecteur', commande: { id, charge } }), { vue, id, charge })).toEqual({ ok: true });
    };
    const etatDuRadar = async () => (await vueModules()).sauvegarde!.campagnes[CAMPAGNE]['alien-detecteur'].donnees as EtatDetecteur;
    try {
        await attendreLHydratation(g);
        await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(c => { const etat = (window as unknown as Fenetre).useSessionOSStore.getState(); etat.setActiveCampaign(c); etat.setCurrentView('cockpit'); }, CAMPAGNE);
        await f.getByRole('button', { name: 'Modules du jeu', exact: true }).click();

        // Le M314 en mode discret, avec son porteur sur le plan : prêt à être orienté.
        await agir('zone-discrete', { id: 'sas', nom: 'Sas', x: 0, y: 0, liens: [] });
        await agir('pion-discret', { id: 'nel', nom: 'Nel Varga', zoneId: 'sas', humain: true, limite: 2, mobile: false, detectable: true });
        await agir('regler-discret', { terrain: 'interieur', energie: 5, porteurId: 'nel' });
        await agir('mode-discret', { actif: true });

        // La Fire : un vrai client de 960 × 600, rôle `table`.
        navigateur = await chromium.launch({ channel: 'msedge', args: ['--mute-audio'] });
        const contexte = await navigateur.newContext({ viewport: { width: 960, height: 600 }, hasTouch: true, serviceWorkers: 'block', locale: 'fr-FR' });
        const fire = await contexte.newPage(); fire.setDefaultTimeout(15_000);
        await fire.goto(`http://127.0.0.1:${g.ports.sync}/?window=appareil-de-table&sync=${g.ports.sync}`);
        await expect(fire.getByText('Aucun module ouvert à la table.')).toBeVisible();
        expect(await fire.evaluate(() => !!window.appBridge)).toBe(false);

        // Le meneur coche « La table » sur le détecteur ; la Fire l'affiche.
        const carte = f.locator('article').filter({ has: f.getByRole('heading', { name: 'Détecteur de mouvement', exact: true }) });
        // Le panneau ne coche qu'à l'accusé du serveur : on clique, puis on attend l'état.
        const caseTable = carte.getByRole('checkbox', { name: 'La table', exact: true });
        await caseTable.click(); await expect(caseTable).toBeChecked();
        await expect(fire.getByText('Détecteur de mouvement', { exact: true })).toBeVisible();
        await expect(fire.getByText(/Ouvert par le meneur/)).toBeVisible();
        await expect(fire.getByText(/ÉCHOS/)).toBeVisible(); // la vue du module est chargée à la demande
        await fire.screenshot({ path: path.join(PREUVES, '1-m314-ouvert-a-la-table.png') });

        // Pas encore désignée : la table ne peut pas tourner le détecteur.
        await expect(fire.getByRole('button', { name: 'Tourner de 15° vers la droite', exact: true })).toHaveCount(0);

        // Désignée « joueur qui oriente » : elle oriente, et le meneur le voit.
        await agir('attribuer-porteur', { personnageId: 'table:commune' });
        const capAvant = (await etatDuRadar()).discret.cap;
        await fire.getByRole('button', { name: 'Tourner de 15° vers la droite', exact: true }).click();
        await expect.poll(async () => (await etatDuRadar()).discret.cap).toBe((capAvant + 15) % 360);
        await fire.screenshot({ path: path.join(PREUVES, '2-m314-oriente-par-la-table.png') });

        // Le meneur décoche : le module quitte la Fire.
        await caseTable.click(); await expect(caseTable).not.toBeChecked();
        await expect(fire.getByText('Aucun module ouvert à la table.')).toBeVisible();
    } finally {
        await navigateur?.close();
        await g.fermer();
    }
});
