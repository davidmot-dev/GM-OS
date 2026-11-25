import { test, expect, chromium, type Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation } from './lancerGmOs';

/**
 * **L'accueil des rôles et le code du meneur, de bout en bout** — Fire HD 8, registre § 256, T14
 * (24/11/2026, David : « Fais t14 »). La « Fire » est un client HTTP/WebSocket de 960 × 600, sans pont
 * Electron ; le code se règle au poste par son vrai pont. Ce qui est prouvé :
 *   - appairée par le QR, la Fire prend un rôle public : elle oublie le secret d'appairage ;
 *   - taper l'adresse de la télécommande ne suffit plus : elle reste « Non appairée » (C12) ;
 *   - un code faux est refusé et compté ; le bon code rend l'Aide au MJ, appairée ;
 *   - rechargée sur l'accueil, la Fire rouvre son dernier rôle (C11).
 *
 *   npm run build ; npx playwright test e2e/accueilDeLaTablette.spec.ts
 */
const PREUVES = path.resolve(process.env.GMOS_SORTIE_ACCUEIL ?? 'output/e2e/accueil-de-la-tablette');

test('la tablette de la table : rôles, oubli du secret, code du meneur et dernier rôle', async () => {
    test.setTimeout(300_000);
    fs.mkdirSync(PREUVES, { recursive: true });
    const g = await lancerGmOs();
    let navigateur: Browser | undefined;
    try {
        await attendreLHydratation(g);
        const secret = await g.fenetre.evaluate(async () => {
            await window.appBridge!.pairing!.reglerLeCode!('4821');
            return window.appBridge!.pairing!.getSecret();
        });

        navigateur = await chromium.launch({ channel: 'msedge' });
        const contexte = await navigateur.newContext({ viewport: { width: 960, height: 600 }, serviceWorkers: 'block', locale: 'fr-FR' });
        const fire = await contexte.newPage(); fire.setDefaultTimeout(15_000);
        const base = `http://127.0.0.1:${g.ports.sync}/`;
        const jeton = () => fire.evaluate(() => window.localStorage.getItem('gmos-pairing-token'));

        // Appairée comme par le QR du poste.
        await fire.goto(`${base}?window=remote#token=${encodeURIComponent(secret)}`);
        await expect(fire.getByRole('navigation', { name: 'Navigation du meneur' }).first()).toBeVisible();
        await expect.poll(jeton).toBe(secret);
        await expect(fire.getByText('Non appairée')).toHaveCount(0);

        // L'accueil : trois rôles, l'Aide au MJ sans code tant que le secret est là.
        await fire.goto(`${base}?window=accueil-tablette&choisir=1`);
        await expect(fire.getByRole('heading', { name: 'Que fait cette tablette ?' })).toBeVisible();
        await expect(fire.getByText('Connectée au poste du meneur')).toBeVisible();
        await expect(fire.getByText('Code du meneur demandé')).toHaveCount(0);
        await fire.screenshot({ path: path.join(PREUVES, '1-accueil-appairee.png') });

        // Un rôle public : le secret est oublié.
        await fire.locator('[data-role="ecran"]').click();
        await expect(fire).toHaveURL(/window=ecran-de-table/);
        await expect(fire.getByText('Changer de rôle')).toBeVisible();
        expect(await jeton()).toBeNull();
        await fire.screenshot({ path: path.join(PREUVES, '2-ecran-de-table.png') });

        // Taper l'adresse de la télécommande ne rend pas le rôle du meneur.
        await fire.goto(`${base}?window=remote`);
        await expect(fire.getByRole('navigation', { name: 'Navigation du meneur' }).first()).toBeVisible();
        await expect(fire.getByText('Non appairée')).toBeVisible();

        // Retour par « Changer de rôle » : l'Aide au MJ demande le code.
        await fire.goto(`${base}?window=ecran-de-table`);
        await fire.getByText('Changer de rôle').click();
        await expect(fire.getByText('Code du meneur demandé')).toBeVisible();
        await expect(fire.getByText('Rôle actuel')).toBeVisible();
        await fire.screenshot({ path: path.join(PREUVES, '3-accueil-code-demande.png') });
        await fire.locator('[data-role="aide"]').click();
        await expect(fire.getByRole('heading', { name: 'Code du meneur' })).toBeVisible();

        const taper = async (code: string) => { for (const c of code) await fire.getByRole('button', { name: c, exact: true }).click(); };
        await taper('1111');
        await fire.getByRole('button', { name: 'Valider' }).click();
        await expect(fire.getByRole('alert')).toContainText('Code incorrect. Encore 2 essais.');
        await fire.screenshot({ path: path.join(PREUVES, '4-code-faux.png') });
        expect(await jeton()).toBeNull();

        await taper('4821');
        await fire.getByRole('button', { name: 'Valider' }).click();
        await expect(fire).toHaveURL(/window=remote/);
        await expect(fire.getByRole('navigation', { name: 'Navigation du meneur' }).first()).toBeVisible();
        await expect(fire.getByText('Changer de rôle')).toBeVisible();
        await expect(fire.getByText('Non appairée')).toHaveCount(0);
        expect(await jeton()).toBe(secret);
        await fire.screenshot({ path: path.join(PREUVES, '5-aide-au-mj.png') });

        // Au démarrage, l'accueil rouvre le dernier rôle.
        await fire.goto(`${base}?window=accueil-tablette`);
        await expect(fire).toHaveURL(/window=remote/);
    } finally {
        await navigateur?.close();
        await g.fermer();
    }
});
