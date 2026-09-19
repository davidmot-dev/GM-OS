import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Sound-OS — seize pads, et ce qu'on peut en dire sans entendre.**
 *
 * ⚠️ **Un bruitage qui sort n'est pas testable ici** : le profil d'essai n'a
 * aucun média, et ce qui atteint vraiment les enceintes relève de la catégorie
 * P6. Ce qui se garde, c'est **le pupitre** — que les seize pads existent,
 * qu'ils annoncent leur vide, et que les commandes globales répondent.
 *
 * ⭐ *Seize pads vides qui le disent valent mieux que seize cases muettes* :
 * un pupitre sans étiquette se lit comme un pupitre cassé.
 */

async function son(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const s = (window as never as {
            useSoundStore: { getState: () => Record<string, unknown> };
        }).useSoundStore.getState();
        return {
            atmospheres: (s.atmospheres as { id: string; name: string }[]) ?? [],
            active: s.activeAtmosphereId as string | null,
            master: s.masterVolume as number,
            keyLearn: s.isKeyLearnActive as boolean,
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Effets Sonores');
    await gmos.fenetre.getByRole('button', { name: /^KEY LEARN$/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le pupitre', () => {
    /*
      ⛔ Seize, pas quinze ni dix-sept. Le compte est une promesse du guide et
      de la disposition du clavier : un pad de moins déplace tous les
      raccourcis appris.
    */
    test('porte seize pads', async () => {
        const vides = gmos.fenetre.getByText('EMPTY PAD', { exact: false });

        expect(await vides.count(), 'le compte des pads a changé').toBe(16);
    });

    test('et une atmosphère pour les tenir', async () => {
        const etat = await son(gmos);

        expect(etat.atmospheres.length, 'aucune atmosphère').toBeGreaterThan(0);
        expect(etat.active, 'aucune atmosphère active').not.toBeNull();
    });

    test('annonce qu’aucun canal ne joue', async () => {
        await expect(gmos.fenetre.locator('body')).toContainText(/0 ACTIVE CHANNELS/i);
    });
});

test.describe('les commandes globales', () => {
    /*
      ⭐ L'apprentissage de touche est un mode : il doit s'allumer **et
      s'éteindre**. Un mode qui ne se quitte pas capture toutes les frappes
      suivantes — et en séance, c'est le clavier entier qui cesse de répondre.
    */
    test('l’apprentissage de touche s’allume et s’éteint', async () => {
        const bouton = gmos.fenetre.getByRole('button', { name: /^KEY LEARN$/ }).first();

        await bouton.click();
        await expect.poll(async () => (await son(gmos)).keyLearn, { timeout: 10_000 }).toBe(true);

        await bouton.click();
        await expect.poll(async () => (await son(gmos)).keyLearn, { timeout: 10_000 }).toBe(false);
    });

    test('le volume général est dans sa plage', async () => {
        const { master } = await son(gmos);

        expect(master).toBeGreaterThanOrEqual(0);
        expect(master).toBeLessThanOrEqual(1);
    });
});

/**
 * ⛔ **Le menu d'une atmosphère était coupé ET derrière les pads.**
 *
 * Signalé par David le 2026-09-19, capture à l'appui : *« quand j'essaie de
 * mettre à jour un label, le cadre est caché derrière les pads »*. Trois causes
 * empilées, et aucune ne se corrigeait par un `z-index` :
 *
 * - la barre d'onglets est `overflow-x-auto`, donc **l'axe vertical découpe
 *   aussi** — en CSS, dès qu'un axe n'est pas `visible`, l'autre passe à `auto` ;
 * - `SoundDashboard` est `overflow-hidden` : un second ciseau ;
 * - il porte `backdrop-blur-sm`, donc un **contexte d'empilement** où le `z-50`
 *   du menu était enfermé, pendant que les pads se peignaient plus loin.
 *
 * ⭐ *Un élément ne peut pas sortir de l'ordre de peinture de son parent* — la
 * leçon du Media Hub, le 16/09. Le menu vit désormais dans un **portail**.
 *
 * ⚠️ **Ce test vaut par le CLIC, pas par la visibilité.** `toBeVisible()` ne
 * regarde ni le découpage ni le recouvrement ; `click()` si : Playwright refuse
 * un élément qu'un autre intercepte. *C'est le geste qui prouve, pas la
 * présence dans le document.*
 */
test.describe('⭐ le menu d’une atmosphère', () => {
    test('est peint AU-DESSUS des pads, et entièrement visible', async () => {
        /* ⚠️ Insensible à la casse : l'onglet est mis en capitales par la CSS. */
        const onglet = gmos.fenetre.getByRole('button', { name: /^exploration$/i }).first();
        await onglet.click({ button: 'right' });

        /* ⚠️ Le libellé est celui d'AVANT le correctif, et c'est voulu : un
           test qui ne trouverait pas le même bouton dans les deux versions
           prouverait un changement d'étiquette au lieu de prouver que le menu
           est visible. *Un garde-fou qui échoue pour la mauvaise raison ne
           garde rien.* */
        const renommer = gmos.fenetre.getByRole('button', { name: /^Rename$/ });
        await expect(renommer).toBeVisible();

        /*
          ⛔ **`toBeVisible()` ne suffit pas, et `click()` non plus.**
          Mesuré le 2026-09-19 : les deux **passaient sur le code fautif**. Le
          premier ne regarde ni le découpage ni le recouvrement ; le second
          fait **défiler** l'élément dans son parent jusqu'à le rendre
          atteignable — ce que le meneur, lui, ne peut pas faire.

          ⭐ *La question juste n'est pas « puis-je l'atteindre ? » mais
          « qu'est-ce qui est peint à cet endroit ? »* — et `elementFromPoint`
          y répond depuis le point de vue de l'œil.
        */
        const verdict = await gmos.fenetre.evaluate(() => {
            const bouton = [...document.querySelectorAll('button')]
                .find(b => b.textContent?.trim() === 'Rename');
            if (!bouton) return { trouve: false, recouvert: true, dessus: 'aucun bouton' };

            const r = bouton.getBoundingClientRect();
            const dessus = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return {
                trouve: true,
                recouvert: !dessus || !bouton.contains(dessus) && dessus !== bouton,
                dessus: dessus?.className?.toString().slice(0, 80) ?? 'rien',
            };
        });

        expect(verdict.trouve).toBe(true);
        expect(
            verdict.recouvert,
            `le menu est recouvert — ce qui est peint à sa place : ${verdict.dessus}`,
        ).toBe(false);

        await gmos.fenetre.keyboard.press('Escape');
    });
});

/**
 * ⛔ **L'interrupteur de campagne partait hors de l'écran.**
 *
 * Posé le 2026-09-19 *à l'intérieur* de la barre d'onglets, qui est en
 * `overflow-x-auto` avec `no-scrollbar` et un dégradé sur le bord droit : dès
 * qu'il y a assez d'atmosphères, tout ce qui suit les onglets sort du cadre
 * **sans la moindre barre de défilement pour dire qu'il reste quelque chose**.
 *
 * ⚠️ David le voyait encore à trois atmosphères — le défaut était **latent**.
 * C'est exactement pourquoi ce test en crée **quatre** : *un défaut latent ne
 * se garde pas au seuil où on l'a trouvé, mais au-delà.*
 *
 * ⭐ *Une fonctionnalité qu'on ne voit pas est une fonctionnalité absente* — la
 * leçon du Media Hub, reproduite le soir même où le portail la refermait.
 */
test.describe('⭐ l’interrupteur de campagne', () => {
    test('reste visible quand les onglets débordent', async () => {
        const ajouter = gmos.fenetre.getByTitle('Nouvelle Atmosphère');
        for (let i = 0; i < 4; i++) await ajouter.click();

        const bouton = gmos.fenetre.getByRole('button', { name: /^Cette campagne$/ }).first();
        await expect(bouton, 'l’interrupteur n’est pas rendu').toBeVisible();

        /*
          `toBeVisible()` ne suffit pas : un élément pouss  é hors d'un conteneur
          qui défile reste « visible » au sens du document. La question est
          s'il est dans la **fenêtre**.
        */
        await expect(
            bouton,
            'l’interrupteur est sorti de l’écran : il faut défiler pour l’atteindre, et rien ne le dit',
        ).toBeInViewport();
    });
});
