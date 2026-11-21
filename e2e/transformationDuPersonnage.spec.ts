import { test, expect, type Locator } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { CurrentView } from '../src/types/campaign.types';

/**
 * **Transformer un PNJ en personnage joueur, et l'inverse** — chantier du 21/11/2026, registre
 * § 268, [spécification](../documentation/Planning/2026-11-21-pnj-en-pj-et-retour.md), T10.
 *
 * Les deux gestes, à l'écran : le Superviseur Hale (PNJ) devient le personnage de Mathis, puis
 * Idris Koa (PJ de Mathis) devient un PNJ hostile. Campagne de démonstration, personnages fictifs,
 * instance jetable : jamais les données de David.
 *
 *   npm run build
 *   GMOS_SORTIE_TRANSFORMATION=<dossier hors du dépôt> npx playwright test e2e/transformationDuPersonnage.spec.ts --reporter=list
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(ICI, 'donnees', 'campagne-de-demo.json');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_TRANSFORMATION ?? path.join(os.tmpdir(), 'gmos-transformation-du-personnage'));

type Fenetre = { useSessionOSStore: typeof useSessionOSStore };
let gmos: GmOsLance;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
    test.setTimeout(60_000);
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: DEMO });
    await attendreLHydratation(gmos);
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 900); });
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
});

test.afterAll(async () => {
    test.setTimeout(90_000);
    await gmos?.fermer();
});

async function photographier(cible: Locator, nom: string): Promise<void> {
    await gmos.fenetre.waitForTimeout(400);
    await cible.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), type: 'jpeg', quality: 82, animations: 'disabled', caret: 'hide', scale: 'css' });
}

/** Ouvre une vue du tableau de bord, le PNJ ou le joueur voulu sélectionné. */
async function vue(nom: CurrentView, choix: { entite?: string; joueur?: string } = {}): Promise<void> {
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await gmos.fenetre.evaluate(({ v, c }) => {
        const s = (window as unknown as Fenetre).useSessionOSStore.getState();
        s.setCurrentView(v);
        if (c.entite) s.setSelectedEntity(c.entite);
        if (c.joueur) s.setSelectedPlayer(c.joueur);
    }, { v: nom, c: choix });
}

const lire = () => gmos.fenetre.evaluate(() => {
    const s = (window as unknown as Fenetre).useSessionOSStore.getState();
    return {
        pnj: s.entities.map(e => ({ id: e.id, role: e.role })),
        pj: s.players.map(p => ({ id: p.id, persos: p.characters.map(c => c.id) })),
    };
});

test('un PNJ devient le personnage d’un joueur', async () => {
    const f = gmos.fenetre;
    await vue('npc-gallery', { entite: 'temoin-pnj-1' });
    const bouton = f.getByRole('button', { name: /Faire un personnage joueur/ });
    await expect(bouton).toBeVisible({ timeout: 15_000 });
    await bouton.click();
    const confirmation = f.getByRole('group', { name: /Faire de Superviseur Hale un personnage joueur/ });
    await expect(confirmation).toBeVisible();
    await confirmation.locator('select').selectOption({ label: 'Mathis' });
    await photographier(confirmation, 'pnj-vers-pj-confirmation');
    await confirmation.getByRole('button', { name: 'Transformer' }).click();

    const etat = await lire();
    expect(etat.pnj.some(e => e.id === 'temoin-pnj-1')).toBe(false);
    expect(etat.pj.find(p => p.id === 'temoin-joueur-2')?.persos).toContain('temoin-pnj-1');

    await vue('players', { joueur: 'temoin-joueur-2' });
    const carte = f.locator('.rounded-xl', { hasText: 'Superviseur Hale' }).filter({ has: f.getByRole('button', { name: /Faire un PNJ/ }) }).last();
    await expect(carte).toBeVisible({ timeout: 15_000 });
    await photographier(carte, 'pnj-vers-pj-dans-le-roster');
});

test('un PJ devient un PNJ de sa campagne', async () => {
    const f = gmos.fenetre;
    await vue('players', { joueur: 'temoin-joueur-2' });
    const carte = f.locator('.rounded-xl', { hasText: 'Idris Koa' }).filter({ has: f.getByRole('button', { name: /Faire un PNJ/ }) }).last();
    await expect(carte).toBeVisible({ timeout: 15_000 });
    await carte.getByRole('button', { name: /Faire un PNJ/ }).click();
    const confirmation = f.getByRole('group', { name: /Faire de Idris Koa un PNJ/ });
    await expect(confirmation).toBeVisible();
    await confirmation.locator('select').selectOption('hostile');
    await photographier(confirmation, 'pj-vers-pnj-confirmation');
    await confirmation.getByRole('button', { name: 'Transformer' }).click();

    const etat = await lire();
    expect(etat.pj.find(p => p.id === 'temoin-joueur-2')?.persos).not.toContain('temoin-pj-2');
    expect(etat.pnj.find(e => e.id === 'temoin-pj-2')?.role).toBe('hostile');

    await vue('npc-gallery', { entite: 'temoin-pj-2' });
    await expect(f.getByRole('button', { name: /Faire un personnage joueur/ })).toBeVisible({ timeout: 15_000 });
    await photographier(f.locator('main').first(), 'pj-vers-pnj-fiche');
});
