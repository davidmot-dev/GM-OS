import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Le Storyboard — la pellicule, et le geste qui l'alimente.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI SE GARDE ICI, ET CE QUI S'ÉCOUTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un moment de storyboard décide **d'où sort le son**, **sur quel écran** va
 * l'image, et affiche un **titre**. Les trois arrivent au même instant, ce qui
 * en fait le module le plus utile de la soirée — et le plus difficile à
 * vérifier : *qu'un son sorte de la bonne enceinte ne se vérifie qu'à
 * l'oreille.*
 *
 * ⭐ Reste la **pellicule** : qu'elle parte vide en le disant, qu'une séquence
 * s'ajoute, et qu'elle survive. C'est la moitié qui casse sans bruit — et la
 * soirée du 2026-08-31 a montré qu'elle casse : trois « petits bugs » y ont été
 * trouvés, dont un message envoyé à une fenêtre qui ne savait pas encore
 * écouter. *Un message émis trop tôt est perdu, pas en retard.*
 */

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await gmos.fenetre.getByRole('button', { name: /^Master Storyboard$/ }).first().click();
    await gmos.fenetre.getByRole('button', { name: /Ajouter une Séquence/i }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('la pellicule', () => {
    /*
      ⭐ Un état vide qui explique quoi faire vaut une page de documentation.
      Ici il nomme même le geste suivant — *« ajoutez une première séquence »*.
    */
    test('part vide, et dit comment commencer', async () => {
        const zone = gmos.fenetre.locator('body');

        await expect(zone).toContainText(/PELLICULE EST VIDE/i);
        await expect(zone, 'l’état vide doit nommer le geste suivant')
            .toContainText(/ajoutez une première séquence/i);
    });

    /*
      ⚠️ **« Ajouter une Séquence » n'ajoute rien : il OUVRE L'ÉDITEUR.**
      Ma première version cliquait puis constatait que la pellicule restait
      vide, et accusait le module. `startNew` remet les champs à zéro et
      présente le formulaire — la création n'a lieu qu'à l'enregistrement.
      *Un bouton qui dit « ajouter » et qui ouvre un formulaire n'est pas un
      défaut ; le supposer en est un.*
    */
    test('« Ajouter une Séquence » ouvre l’éditeur', async () => {
        await gmos.fenetre.getByRole('button', { name: /Ajouter une Séquence/i }).first().click();

        await expect(
            gmos.fenetre.getByPlaceholder(/Combat Final/i).first(),
            'l’éditeur ne s’est pas ouvert',
        ).toBeVisible({ timeout: 15_000 });
    });

    test('et l’enregistrer met la séquence sur la pellicule', async () => {
        await gmos.fenetre.getByPlaceholder(/Combat Final/i).first().fill('Le silence du relais');
        await gmos.fenetre.getByRole('button', { name: /Sauvegarder la Séquence/i }).first().click();

        const zone = gmos.fenetre.locator('body');
        await expect(zone, 'la pellicule est restée vide')
            .not.toContainText(/PELLICULE EST VIDE/i, { timeout: 15_000 });
        await expect(zone).toContainText('Le silence du relais');
    });

    /*
      ⚠️ Et elle survit à un aller-retour. Le storyboard est le seul module dont
      le travail se prépare **avant** la séance : le perdre en changeant d'écran
      coûterait une soirée de préparation.
    */
    test('et elle survit à un passage par un autre module', async () => {
        await ouvrirLeModule(gmos, 'Dice-OS');
        await gmos.fenetre.locator('button').filter({ hasText: /^d20$/ }).first()
            .waitFor({ timeout: 15_000 });

        await ouvrirLeModule(gmos, 'Tableau de Bord');

        /*
          ⚠️ **Le cockpit rouvre là où on l'a laissé.** Le bouton « Master
          Storyboard » n'est donc plus offert si l'on y est déjà — cliquer sans
          regarder fait expirer l'attente sur un bouton qui n'a aucune raison
          d'exister. On ne clique que s'il est là.
        */
        const onglet = gmos.fenetre.getByRole('button', { name: /^Master Storyboard$/ }).first();
        if (await onglet.count() > 0) await onglet.click();

        await expect(gmos.fenetre.locator('body'))
            .not.toContainText(/PELLICULE EST VIDE/i, { timeout: 15_000 });
    });
});

test.describe('les sources du vrai magasin dans l’éditeur', () => {
    test('capture musique, lumière, carte vidéo et identité de l’image puis les enregistre', async () => {
        // États artificiels uniquement dans le profil jetable. Aucun son joué,
        // aucune lampe commandée : on exerce ici le geste de capture du meneur.
        await gmos.fenetre.evaluate(() => {
            const musique = window.useMusicStore;
            const pad = (id: string, label: string) => ({ id, label, url: '', type: 'local' as const, loopA: null, loopB: null });
            musique.setState({ playlists: [{ id: 'liste-essai', name: 'Liste test', pads: [pad('pad-a', 'Musique A'), pad('pad-b', 'Musique B')] }],
                deckA: { ...musique.getState().deckA, activePadId: 'pad-a', isPlaying: true },
                deckB: { ...musique.getState().deckB, activePadId: 'pad-b', isPlaying: false } });
            const lumiere = window.useLightStore;
            lumiere.setState({ activeSceneId: 'scene-essai', scenes: { ...lumiere.getState().scenes,
                'scene-essai': { id: 'scene-essai', name: 'Lumière test', icon: 'Sun', color: 'var(--accent)', lightStates: { essai: { on: true, bri: 1 } } } } });
            const session = window.useSessionOSStore;
            const campagne = session.getState().activeCampaignId;
            if (!campagne) throw new Error('Campagne d’essai absente');
            session.setState({ atlasMaps: [{ id: 'carte-essai', name: 'Carte test sans extension', fileUrl: 'gmos://media/carte-essai',
                isVideo: true, type: 'battlemap', narrativeDescription: '', gmNotes: '', linkedEntities: [], campaignId: campagne }] });
            window.useMapStore.setState({ mapUrl: 'gmos://media/carte-essai', isVideo: true });
            window.useImageStore.setState({ mediaList: [{ id: 'pad-image', name: 'Image test', path: 'm-fichier-image', isFavorite: false }],
                projectionTarget: 'hub', projections: { hub: 'm-fichier-image' } });
        });
        await gmos.fenetre.getByRole('button', { name: /Ajouter une Séquence/i }).click();
        const capturer = async (titre: string) => {
            const select = gmos.fenetre.getByRole('combobox', { name: titre, exact: true });
            await select.locator('xpath=..').getByRole('button').filter({ hasText: /Capturer active/i }).click();
            return select;
        };
        await expect(await capturer('Musique')).toHaveValue('pad-a');
        // Le lecteur change APRES l’ouverture : le clic doit lire l’état actuel.
        await gmos.fenetre.evaluate(() => {
            const m = window.useMusicStore;
            m.setState({ deckA: { ...m.getState().deckA, isPlaying: false }, deckB: { ...m.getState().deckB, isPlaying: true } });
        });
        await expect(await capturer('Musique')).toHaveValue('pad-b');
        await expect(await capturer('Lumières')).toHaveValue('scene-essai');
        await expect(await capturer('Carte Atlas')).toHaveValue('gmos://media/carte-essai');
        await expect(await capturer('Image (Image-OS)')).toHaveValue('pad-image');
        await gmos.fenetre.getByPlaceholder(/Combat Final/i).fill('Capture des quatre sources');
        await gmos.fenetre.getByRole('button', { name: /Sauvegarder la Séquence/i }).click();
        const moment = await gmos.fenetre.evaluate(() => window.useStoryboardStore.getState().moments.find(m => m.name === 'Capture des quatre sources'));
        expect(moment).toMatchObject({ musicPadId: 'pad-b', lightSceneId: 'scene-essai', mapUrl: 'gmos://media/carte-essai',
            isMapVideo: true, imageMediaId: 'pad-image' });
    });

    test('les bruitages de deux atmosphères gardent leur identité et leur nom dans le détail', async () => {
        await gmos.fenetre.evaluate(() => {
            const sons = window.useSoundStore;
            const premier = Object.values(sons.getState().atmospheres[0].pads)[0];
            const pad = (title: string) => ({ ...premier, id: 'PAD_01', title, filePath: 'son-essai.wav' });
            sons.setState({ activeAtmosphereId: 'atmosphere-a', atmospheres: [
                { id: 'atmosphere-a', name: 'Atmosphère A', pads: { PAD_01: pad('Bruit A') } },
                { id: 'atmosphere-b', name: 'Atmosphère B', pads: { PAD_01: pad('Bruit B') } },
            ] });
        });
        await gmos.fenetre.getByRole('button', { name: /Ajouter une Séquence/i }).click();
        const sons = gmos.fenetre.getByRole('combobox', { name: 'Effet Sonore (Sound-OS)', exact: true });
        await expect(sons.locator('option')).toContainText(['Aucun(e)', 'Bruit A', 'Bruit B']);
        await sons.selectOption('atmosphere-b::PAD_01');
        await gmos.fenetre.getByPlaceholder(/Combat Final/i).fill('Deux atmosphères');
        await gmos.fenetre.getByRole('button', { name: /Sauvegarder la Séquence/i }).click();
        const moment = await gmos.fenetre.evaluate(() => {
            const s = window.useStoryboardStore;
            const moment = s.getState().moments.find(m => m.name === 'Deux atmosphères');
            if (!moment) throw new Error('Moment non enregistré');
            // Afficher le détail sans déclencher une vraie lecture sonore.
            s.setState({ activeMomentId: moment.id }); return moment;
        });
        expect(moment).toMatchObject({ soundAtmosphereId: 'atmosphere-b', soundPadId: 'PAD_01' });
        await expect(gmos.fenetre.getByText('Bruit B', { exact: true })).toBeVisible();
    });
});
