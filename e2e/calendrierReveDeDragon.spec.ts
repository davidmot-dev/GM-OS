import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN } from './lancerGmOs';

/**
 * **Le calendrier de Rêve de Dragon dans Clock-OS** — 24/10/2026, demandé par
 * David. Le fichier de `databases/calendars/` se choisit dans le pupitre ; la
 * date porte sa phase de lune, l'heure son nom.
 */
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sortie = path.join(racine, 'scratch/rdd-finir/captures');
type Horloge = { getState: () => Record<string, (...a: unknown[]) => unknown> & { mode: string } };

test('le calendrier de Rêve de Dragon : mois lunaires, heures draconiques nommées', async () => {
    test.setTimeout(120000);
    fs.mkdirSync(sortie, { recursive: true });
    const gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    try {
        await attendreLHydratation(gmos);
        const f = gmos.fenetre;
        await ouvrirLeModule(gmos, 'Horloge & Temps');
        await f.evaluate(async () => {
            const c = (window as never as { useClockStore: Horloge }).useClockStore.getState();
            c.setMode('fantasy'); c.setTheme('oldstyle');
            await c.fetchCalendars();
            await c.selectCalendar('reve-de-dragon');
            c.setFantasyDate({ year: 1, monthIndex: 0, day: 14, hour: 2, minute: 45, second: 0 });
        });
        const date = await f.evaluate(() => (window as never as { useClockStore: Horloge }).useClockStore.getState().getFantasyDate());
        expect(date).toMatchObject({ year: 1, monthIndex: 0, day: 14, hour: 2, minute: 45, fete: { nom: 'Pleine lune' } });
        const corps = f.locator('main').last();
        await expect(corps).toContainText(/14 Vaisseau 1 — Pleine lune · Le Faucon/i, { timeout: 15000 });
        await expect(f.getByLabel('Heure', { exact: true })).toHaveValue('2');
        await corps.screenshot({ path: path.join(sortie, 'jeu-reves-de-dragons-calendrier.jpg'), type: 'jpeg', quality: 85 });
    } finally { await gmos.fermer(); }
});
