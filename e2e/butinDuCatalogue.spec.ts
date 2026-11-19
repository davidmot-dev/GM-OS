import { test, expect, type Locator } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/**
 * **Loot-OS et le catalogue du pilote** — registre § 264, T8 (19/11/2026),
 * [spécification](../documentation/Planning/2026-11-19-butin-depuis-le-catalogue.md).
 *
 * David : « je voudrais faire le lien entre les équipements qui sont définis dans un
 * drivers et loot-os afin de pouvoir constituer des tables de loot plus facilement ».
 * Le parcours entier, sur le vrai pilote Alien 1.11.0 : dans la Forge, « Nouvelle
 * table depuis le catalogue » ; dans Loot-OS, la table tirée, puis « Depuis le
 * catalogue ». Photographie chaque temps et relève ce qu'il voit dans `constats.json`.
 *
 * Instance jetable, campagne de démonstration : jamais les données de David.
 *
 *   npm run build
 *   GMOS_PILOTE_BUTIN=<.gmos-driver> GMOS_SORTIE_BUTIN=<dossier hors du dépôt> \
 *     npx playwright test e2e/butinDuCatalogue.spec.ts --reporter=list
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PILOTE = path.resolve(process.env.GMOS_PILOTE_BUTIN ?? path.join(ICI, '..', 'Export Dirvers', 'corriges', 'Alien-1.11.0.gmos-driver'));
const SORTIE = path.resolve(process.env.GMOS_SORTIE_BUTIN ?? path.join(os.tmpdir(), 'gmos-butin-du-catalogue'));
const DEMO = path.join(ICI, 'donnees', 'campagne-de-demo.json');
const CAMPAGNE = 'demo-butin-catalogue';

type Fenetre = { useSessionOSStore: typeof useSessionOSStore };
interface Pilote { gameDriver: { id: string; name: string; templateId: string }; sheetTemplate?: { id: string } }

const pilote: Pilote | null = fs.existsSync(PILOTE) ? JSON.parse(new AdmZip(PILOTE).readAsText('state.json')) : null;

function ecrireLaSemence(p: Pilote): string {
    const semence = JSON.parse(fs.readFileSync(DEMO, 'utf8'));
    const s = semence.modules.sessionOS;
    s.campaigns.push({ id: CAMPAGNE, name: `Butin · ${p.gameDriver.name}`, system: p.gameDriver.id,
        description: 'Campagne fictive : le butin depuis le catalogue.', activeLocationIds: [] });
    s.customGameDrivers.push(p.gameDriver);
    if (p.sheetTemplate) s.customSheetTemplates.push(p.sheetTemplate);
    const chemin = path.join(os.tmpdir(), `gmos-semence-butin-${process.pid}.json`);
    fs.writeFileSync(chemin, JSON.stringify(semence));
    return chemin;
}

let gmos: GmOsLance;
const constats: Record<string, unknown> = {};

test.describe.configure({ mode: 'serial' });
test.skip(!pilote, `pilote absent : « ${PILOTE} »`);

test.beforeAll(async () => {
    test.setTimeout(60_000);
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: ecrireLaSemence(pilote!) });
    await attendreLHydratation(gmos);
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 900); });
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
});

test.afterAll(async () => {
    test.setTimeout(90_000);
    fs.writeFileSync(path.join(SORTIE, 'constats.json'), JSON.stringify(constats, null, 2));
    await gmos?.fermer();
});

async function photographier(cible: Locator, nom: string): Promise<void> {
    await gmos.fenetre.waitForTimeout(400);
    await cible.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), type: 'jpeg', quality: 82, animations: 'disabled', caret: 'hide', scale: 'css' });
}

const etat = () => gmos.fenetre.evaluate(id => {
    const s = (window as unknown as Fenetre).useSessionOSStore.getState();
    const d = s.customGameDrivers.find(x => x.id === id);
    return {
        tables: (d?.lootTables ?? []).map(t => ({ nom: t.name, lignes: t.entries.map(e => `${e.type}:${e.metadata?.catalogueId ?? e.name}`) })),
        pool: (s.lootPool ?? []).map(o => ({ nom: o.name, valeur: o.value, catalogueId: o.properties?.catalogueId ?? null })),
    };
}, pilote!.gameDriver.id);

test('Forge : « Nouvelle table depuis le catalogue »', async () => {
    test.setTimeout(120_000);
    const f = gmos.fenetre;
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await f.evaluate(({ campagne, id }) => {
        const s = (window as unknown as Fenetre).useSessionOSStore.getState();
        s.setActiveCampaign(campagne);
        s.setEditingDriverId(id);
        s.setCurrentView('driver-editor');
    }, { campagne: CAMPAGNE, id: pilote!.gameDriver.id });
    await f.getByRole('button', { name: /table\(s\) de butin|Trésors/ }).first().click();
    await f.getByRole('button', { name: /Nouvelle table depuis le catalogue/ }).click();

    const fenetre = f.getByRole('dialog', { name: 'Choisir dans le catalogue' });
    await expect(fenetre).toBeVisible();
    constats.familles = await fenetre.getByRole('tablist', { name: "Familles d'objets" }).getByRole('tab').allTextContents();
    await fenetre.getByRole('checkbox', { name: 'Toute la catégorie' }).check();
    constats.compte = await fenetre.locator('[aria-live="polite"]').textContent();
    // Le titre et les familles dans l'image : la liste remonte en haut avant la prise.
    await fenetre.getByRole('tablist', { name: "Familles d'objets" }).scrollIntoViewIfNeeded();
    await photographier(fenetre.locator('[data-cadre-de-surcouche]').first(), 'butin-fenetre-du-catalogue');
    await fenetre.getByRole('button', { name: /Créer la table/ }).click();
    await expect(fenetre).toHaveCount(0);

    const apres = await etat();
    constats.tableCreee = apres.tables.at(-1);
    expect(apres.tables.at(-1)?.lignes.every(l => l.startsWith('catalogue:'))).toBe(true);
    // Une table de 13 lignes ne tient pas en 900 px : on agrandit la fenêtre pour la prise.
    const fenetreElectron = await gmos.application.browserWindow(f);
    await fenetreElectron.evaluate(w => w.setContentSize(1440, 2400));
    const ligne = f.locator('[data-ligne-du-catalogue]').first();
    await ligne.scrollIntoViewIfNeeded();
    await photographier(f.locator('div.p-8', { has: ligne }).first(), 'butin-table-du-catalogue');
    await fenetreElectron.evaluate(w => w.setContentSize(1440, 900));
});

test('Loot-OS : tirer la table, puis « Depuis le catalogue »', async () => {
    test.setTimeout(120_000);
    const f = gmos.fenetre;
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await f.evaluate(campagne => (window as unknown as Fenetre).useSessionOSStore.getState().setActiveCampaign(campagne), CAMPAGNE);
    await f.getByRole('button', { name: /^Loot-OS$/ }).first().click();
    await f.getByRole('tab', { name: /[0-9][.] Génération/ }).first().waitFor({ timeout: 20_000 });

    const nom = (constats.tableCreee as { nom: string }).nom;
    await f.getByRole('button', { name: new RegExp(nom) }).first().click();
    await expect.poll(async () => (await etat()).pool.length, { timeout: 10_000 }).toBeGreaterThan(0);
    constats.poolApresTirage = (await etat()).pool;

    await f.getByRole('button', { name: /Depuis le catalogue/ }).click();
    const fenetre = f.getByRole('dialog', { name: 'Choisir dans le catalogue' });
    await fenetre.getByRole('option').first().click();
    await fenetre.getByRole('button', { name: /Verser au butin/ }).click();
    await expect(fenetre).toHaveCount(0);
    constats.poolApresVersement = (await etat()).pool;
    expect((constats.poolApresVersement as unknown[]).length).toBeGreaterThan((constats.poolApresTirage as unknown[]).length);
    expect((constats.poolApresVersement as { catalogueId: string | null }[]).every(o => !!o.catalogueId)).toBe(true);
    await photographier(f.locator('main').first(), 'butin-loot-os');
});
