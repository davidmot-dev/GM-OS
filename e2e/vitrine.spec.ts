import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';

/**
 * **La vitrine — tes vrais écrans, capturés sans toucher à ton profil.**
 *
 * Essai de faisabilité du 2026-09-25, pour la refonte de l'interface : peut-on
 * donner à Stitch des captures **représentatives** sans une séance de captures
 * à la main ?
 *
 * L'instance est jetable, comme toutes celles des essais. Elle est semée par
 * **la dernière sauvegarde automatique** (tes campagnes) et reçoit **une copie
 * du miroir des médias** (tes images), qu'elle remet dans sa propre base par le
 * vrai bouton « Restaurer depuis la sauvegarde ». Rien n'est lu en écriture
 * hors du profil jetable.
 *
 * ⚠️ **Ne tourne que sur demande** (`GMOS_VITRINE=1`) : elle dépend de la
 * machine du meneur — ses sauvegardes, son miroir — et n'a rien à faire dans
 * une exécution ordinaire des essais.
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'e2e-resultats', 'vitrine');

const DOSSIER_DES_SAUVEGARDES =
    process.env.GMOS_VITRINE_SAUVEGARDES || 'C:\\Projet_David\\Security_Backup_GMOS';
const MIROIR_DES_MEDIAS = process.env.GMOS_VITRINE_MIROIR
    || path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'gm-os-v5', 'backups', 'medias');

/** La taille logique d'une dalle du Zenbook Duo — ce que voit le meneur. */
const LARGEUR = 1440;
const HAUTEUR = 900;

function derniereSauvegarde(): string | null {
    if (!fs.existsSync(DOSSIER_DES_SAUVEGARDES)) return null;
    const fichiers = fs.readdirSync(DOSSIER_DES_SAUVEGARDES)
        .filter(n => /^gmos-auto-.*\.json$/.test(n))
        .sort();
    return fichiers.length ? path.join(DOSSIER_DES_SAUVEGARDES, fichiers[fichiers.length - 1]) : null;
}

test.describe('la vitrine', () => {
    test.skip(process.env.GMOS_VITRINE !== '1', 'Sur demande seulement : GMOS_VITRINE=1');

    let gmos: GmOsLance;

    test.afterAll(async () => { await gmos?.fermer(); });

    test('les trois écrans des maquettes', async () => {
        test.setTimeout(300_000);

        const semence = derniereSauvegarde();
        expect(semence, `aucune sauvegarde dans ${DOSSIER_DES_SAUVEGARDES}`).not.toBeNull();
        expect(fs.existsSync(MIROIR_DES_MEDIAS), `miroir absent : ${MIROIR_DES_MEDIAS}`).toBe(true);
        console.log(`[Vitrine] semence : ${semence}`);

        gmos = await lancerGmOs({
            semence: semence!,
            /* Copié, jamais lié : l'instance ne doit pas pouvoir écrire dans le vrai miroir. */
            preparerLeProfil: profil => {
                fs.cpSync(MIROIR_DES_MEDIAS, path.join(profil, 'backups', 'medias'), { recursive: true });
            },
        });
        await attendreLHydratation(gmos);

        const fenetre = await gmos.application.browserWindow(gmos.fenetre);
        await fenetre.evaluate((w, [l, h]) => { w.unmaximize(); w.setContentSize(l, h); }, [LARGEUR, HAUTEUR]);

        /*
          ⛔ **L'hydratation n'est pas la semence.** La base relue porte d'abord
          `INITIAL_DATA` (deux campagnes d'usine) ; la semence arrive après.
          Lire tout de suite a fait écrire au premier essai « The Eternal
          Quest » dans le journal — alors que les captures montraient bien
          Blade Runner. *Un journal qui lit trop tôt ment avec l'autorité d'une
          mesure.*
        */
        await gmos.fenetre.waitForFunction(() => {
            const s = (window as never as { useSessionOSStore: { getState: () => { campaigns: unknown[] } } })
                .useSessionOSStore.getState();
            return s.campaigns.length > 2;
        }, undefined, { timeout: 30_000 });

        const campagnes = await gmos.fenetre.evaluate(() => {
            const s = (window as never as { useSessionOSStore: { getState: () => { campaigns: { name: string }[]; activeCampaignId: string | null } } })
                .useSessionOSStore.getState();
            return { noms: s.campaigns.map(c => c.name), active: s.activeCampaignId };
        });
        console.log(`[Vitrine] campagnes : ${campagnes.noms.join(' · ')} — active : ${campagnes.active}`);

        /* Les images : par le vrai bouton, comme le ferait le meneur. */
        await ouvrirLeModule(gmos, 'Image-OS');
        const restaurer = gmos.fenetre.getByRole('button', { name: /Restaurer depuis la sauvegarde/ });
        await expect(restaurer).toBeVisible({ timeout: 20_000 });
        await restaurer.click();
        const avis = gmos.fenetre.getByText(/média\(s\) restauré\(s\)/);
        await expect(avis).toBeVisible({ timeout: 180_000 });
        /* La notification recouvrait le bas de la première capture. */
        await expect(avis).toBeHidden({ timeout: 20_000 }).catch(() => undefined);

        /*
          **Mettre en scène : un combat en cours.** La sauvegarde n'en porte pas
          — un écran au repos ne dit rien à Stitch. Les données hostiles du
          plan : onze combattants, un nom long, `148/155`, une jauge à zéro.
        */
        await gmos.fenetre.evaluate(() => {
            const combat = (window as never as {
                useCombatStore: { getState: () => { addCombatant: (c: Record<string, unknown>) => void } };
            }).useCombatStore.getState();
            const figurants: [string, number, number | undefined, number | undefined, boolean, string][] = [
                ['Rick Deckard', 18, 12, 14, true, 'player'],
                ['Rachael Tyrell', 16, 9, 10, true, 'player'],
                ['Gaff', 15, 11, 11, true, 'player'],
                ['Roy Batty — Nexus-6 de combat', 21, 148, 155, false, 'enemy'],
                ['Pris Stratton', 19, 0, 12, false, 'enemy'],
                ['Leon Kowalski', 14, 7, 16, false, 'enemy'],
                ['Zhora Salome', 13, 10, 10, false, 'enemy'],
                ['Agent de la LAPD', 11, 8, 8, false, 'ally'],
                ['Garde de la Tyrell Corp.', 10, 6, 9, false, 'enemy'],
                ['Marchand de nouilles', 7, 4, 4, false, 'neutral'],
                ['Drone de surveillance', 5, 3, 6, false, 'enemy'],
            ];
            for (const [name, init, hp, hpMax, isPlayer, faction] of figurants) {
                combat.addCombatant({ name, init, hp, hpMax, isPlayer, faction, statuses: [] });
            }
        });

        fs.mkdirSync(SORTIE, { recursive: true });
        for (const [module, fichier] of [
            ['Combat-OS', '1-combat.png'],
            ['Dice-OS', '2-des.png'],
            ['Image-OS', '3-image.png'],
        ] as const) {
            await ouvrirLeModule(gmos, module);
            /* Le module est chargé à la demande, et ses images se décodent après. */
            await gmos.fenetre.waitForTimeout(2_500);
            /* Un jet qui vient de tomber, par le vrai bouton. */
            if (module === 'Dice-OS') {
                await gmos.fenetre.getByRole('button', { name: /^Lancer$/i }).first().click();
                await gmos.fenetre.waitForTimeout(2_500);
            }
            await gmos.fenetre.screenshot({ path: path.join(SORTIE, fichier) });
            console.log(`[Vitrine] ${fichier}`);
        }
    });
});
