import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';

let gmos: GmOsLance;
const fiche = () => gmos.fenetre.getByText('Souris joueurs fictive', { exact: true })
    .locator('..').locator('..').locator('..');

test.beforeAll(async () => {
    gmos = await lancerGmOs();
    await attendreLHydratation(gmos);

    // Remplacer les quatre handlers AVANT d'ouvrir les réglages. Même
    // l'inventaire ne lit aucun périphérique réel : aucune élévation ni coupure.
    await gmos.application.evaluate(({ ipcMain }) => {
        for (const canal of ['souris:inventaire', 'souris:couper', 'souris:confirmer', 'souris:rendre']) {
            ipcMain.removeHandler(canal);
        }
        const souris = [
            { id: 'HID\\VID_0001&PID_0001\\MJ', nom: 'Souris MJ fictive', active: true },
            { id: 'HID\\VID_0002&PID_0002\\JOUEURS', nom: 'Souris joueurs fictive', active: true },
        ];
        const retours = new Map<string, ReturnType<typeof setTimeout>>();
        ipcMain.handle('souris:inventaire', () => souris.map(s => ({ ...s })));
        ipcMain.handle('souris:couper', (_event, id: string) => {
            const cible = souris.find(s => s.id === id);
            if (!cible) return { ok: false, message: 'Souris fictive absente.' };
            cible.active = false;
            retours.set(id, setTimeout(() => { cible.active = true; retours.delete(id); }, 3000));
            return { ok: true, retourDans: 3000 };
        });
        ipcMain.handle('souris:confirmer', (_event, id: string) => {
            clearTimeout(retours.get(id));
            retours.delete(id);
            return { ok: true };
        });
        ipcMain.handle('souris:rendre', (_event, id: string) => {
            clearTimeout(retours.get(id));
            retours.delete(id);
            const cible = souris.find(s => s.id === id);
            if (cible) cible.active = true;
            return { ok: true };
        });
    });
});
test.afterAll(async () => { await gmos?.fermer(); });

test('le QR annonce les deux ports du vrai pont et se ferme par Échap', async () => {
    const panneau = gmos.fenetre.locator('div.fixed.inset-0').filter({
        has: gmos.fenetre.getByRole('heading', { name: 'Réseau Local' }),
    });
    const info = await gmos.fenetre.evaluate(() => window.appBridge!.remote!.getConnectionInfo());
    const adresse = `http://${info.ip}:${info.port}/?window=tablet&sync=${info.mediaPort}`;
    await gmos.fenetre.getByTitle('Ouvrir le code de connexion PWA').click();
    await expect(panneau.locator('code')).toHaveText(adresse);
    await expect(panneau.locator('svg[width="200"]')).toHaveCount(1);
    expect(new URL(adresse).searchParams.get('sync')).toBe(String(gmos.ports.sync));
    await gmos.fenetre.keyboard.press('Escape');
    await expect(panneau).toHaveCount(0);
    await gmos.fenetre.getByTitle('Ouvrir le code de connexion PWA').click();
    await expect(panneau.locator('code')).toHaveText(adresse);
    await gmos.fenetre.keyboard.press('Escape');
    await expect(panneau).toHaveCount(0);
});

test('les réglages relisent la souris après le retour automatique du processus principal', async () => {
    await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
    await expect(fiche().getByRole('button', { name: 'Couper' })).toBeVisible();
    await fiche().getByRole('button', { name: 'Couper' }).click();
    await expect(fiche()).toContainText(/revient dans [123] s/);
    await expect(fiche().getByRole('button', { name: 'Rendre' })).toBeVisible();
    await expect(fiche().getByRole('button', { name: 'Couper' })).toBeVisible({ timeout: 10000 });
    await expect(fiche().getByRole('button', { name: 'Oui, garde-la coupée' })).toHaveCount(0);
});

test('la confirmation retire le décompte et le retour manuel actualise la liste', async () => {
    await fiche().getByRole('button', { name: 'Couper' }).click();
    await fiche().getByRole('button', { name: 'Oui, garde-la coupée' }).click();
    await expect(fiche().getByRole('button', { name: 'Oui, garde-la coupée' })).toHaveCount(0);
    await expect(fiche().getByRole('button', { name: 'Rendre' })).toBeVisible();
    await fiche().getByRole('button', { name: 'Rendre' }).click();
    await expect(fiche().getByRole('button', { name: 'Couper' })).toBeVisible();
    await gmos.fenetre.keyboard.press('Escape');
    await expect(gmos.fenetre.getByText('Souris joueurs fictive', { exact: true })).toHaveCount(0);
});
