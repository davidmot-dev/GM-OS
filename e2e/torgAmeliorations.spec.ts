import { test, expect, chromium, type Browser, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche, presenterLaTablette, retenirLaTablette } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useJournalStore } from '../src/modules/journal/useJournalStore';
import type { NexusDriverState } from '../src/modules/system/archive/nexus.types';

/** Exercices fictifs : vrai import, vrais gestes, Hub HTTP/WebSocket ; aucun profil personnel. */
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useJournalStore: typeof useJournalStore; hasardTorg?: typeof Math.random };
const sortie = path.resolve('output/torg-ameliorations');
const fichier = path.resolve('Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver');

test('TORG : Atouts, échange tactile, Sbires, Lois et persistance du pilote', async () => {
    test.setTimeout(240_000);
    fs.mkdirSync(sortie, { recursive: true });
    const source = JSON.parse(new AdmZip(fichier).readAsText('state.json')) as NexusDriverState;
    const g = await lancerGmOs(), f = g.fenetre;
    let navigateur: Browser | undefined;
    let hub: Page | undefined;
    const personnage = (id = 'mara') => f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters.find(c => c.id === id)!, id);
    const ouvrirFiche = async () => {
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setSelectedPlayer('joueur'); s.setSelectedCharacter('mara'); s.setCurrentView('players'); });
        await ongletDeLaFiche(f, 'Lancer un test');
    };
    const image = async (page: Page, nom: string, cible?: Locator) => {
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('div.fixed.bottom-6.right-6 > div')).toHaveCount(0);
        await (cible ?? page).screenshot({ path: path.join(sortie, `${nom}.jpg`), type: 'jpeg', quality: 85, animations: 'disabled' });
    };
    try {
        await f.setViewportSize({ width: 1440, height: 1100 });
        await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState({ campaigns: [], players: [], entities: [], scenes: [], actes: [], sessions: [], activeCampaignId: null, customGameDrivers: [], customSheetTemplates: [], currentView: 'library' }));
        await g.application.evaluate(({ dialog }, cible) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] }); }, fichier);
        await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
        await expect(f.locator('#nexus-bilan-fermer')).toBeVisible(); await f.locator('#nexus-bilan-fermer').click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().customGameDrivers[0]?.torg?.atouts?.ingenieux)).toBe('torg_atouts_ingenieux');
        await f.evaluate(source => {
            const w = window as unknown as Fenetre, s = w.useSessionOSStore;
            const defaults = Object.fromEntries(source.sheetTemplate!.sections.flatMap(x => x.fields).map(x => [x.id, x.defaultValue]));
            const health = { type: 'boxes', state: 'wounded', data: { champ: 'blessures', libelle: 'Blessures', boxes: Array.from({ length: 4 }, (_, i) => ({ label: '', filled: i < 2 })), seuils: source.gameDriver.combat.casesDeSante!.seuils } };
            s.setState({ campaigns: [{ id: 'torg-exercice', name: 'Les Ombres du Nil — exercices fictifs', system: source.gameDriver.id, activeLocationIds: [], cosmsParDefaut: ['prime-terre'] }], activeCampaignId: 'torg-exercice', activeCampaignName: 'Les Ombres du Nil — exercices fictifs',
                sessions: [{ id: 'seance-torg', campaignId: 'torg-exercice', name: 'Recette Torg', status: 'active', date: '2026-11-07', number: 1, sessionEntityIds: ['mara', 'teo'] }],
                players: [{ id: 'joueur', realName: 'Recette fictive', avatarUrl: '', isOnline: false, characters: ['mara', 'teo'].map(id => ({ id, name: id === 'mara' ? 'Mara Quill' : 'Teo Vale', portraitUrl: '', campaignId: 'torg-exercice', systemId: source.gameDriver.id, templateId: source.sheetTemplate!.id, healthSystem: health,
                    sheetData: { ...defaults, raison: 10, sciences_humaines: 3, dexterite: 9, realite: 3, esprit: 9, resistance: 10, blessures: 2, choc: 3, possibilites: 3,
                        torg_atouts_ingenieux: id === 'mara', torg_atouts_populaire: id === 'mara', torg_atouts_occultiste: id === 'mara' } })) }],
                decks: [{ id: 'destin', name: 'Destin — exercice', role: 'destin', systemId: source.gameDriver.id, folderPath: 'assets/decks/torg-exercice', cardCount: 20, format: 'poker', orientation: 'portrait', useDiscard: true,
                    cardMetadata: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, { name: i === 19 ? 'Relation' : `Exercice ${i + 1}` }])) }],
                deckStates: { destin: { deckId: 'destin', currentCardIndex: null, remainingIndices: [...Array.from({ length: 12 }, (_, i) => i + 1), 16, 17, 18, 19, 20], discardedIndices: [],
                    enMain: [{ index: 13, porteur: 'mara', face: 'revelee' }, { index: 14, porteur: 'teo', face: 'revelee' }, { index: 15, porteur: 'mara', face: 'revelee' }] } }, demandesDeCarte: [],
            } as never);
            w.useCombatStore.setState({ combatants: [] });
            w.useJournalStore.getState().addJournal('Recette Torg fictive'); w.useJournalStore.setState({ isRecording: true });
            // Des d20 à 16, mais des identifiants de notifications distincts.
            w.hasardTorg = Math.random; let tirage = 0; Math.random = () => .75 + (++tirage % 10_000) / 1_000_000;
        }, source);
        // Les images de recette sont des illustrations factices, jamais les paquets personnels.
        const illustration = '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="350"><rect width="250" height="350" fill="#24394b"/><text x="125" y="175" text-anchor="middle" fill="white" font-size="18">EXERCICE TORG</text></svg>';
        await f.route('**/assets/decks/torg-exercice/**', r => r.fulfill({ contentType: 'image/svg+xml', body: illustration }));
        await ouvrirFiche();
        const atouts = f.locator('[data-carte-du-jeu="atouts-torg"]');
        await atouts.getByLabel('Atout de Torg').selectOption('ingenieux');
        await atouts.getByLabel('Bénéficiaire des cartes').selectOption('teo');
        await atouts.getByRole('button', { name: /Ingénieux · 1 Possibilité/ }).click();
        await expect.poll(async () => (await personnage()).sheetData?.possibilites).toBe(2);
        // Deux Blessures : Raison 10 - 2 + bonus 3 = 11, succès Simple, une carte à choisir.
        await atouts.getByRole('button', { name: /Garder « Exercice 2 »/ }).click();
        await expect(atouts.getByRole('button', { name: /Ingénieux · 1 Possibilité/ })).toBeDisabled();
        await image(f, 'jeu-torg-atouts-fiche', atouts);
        await atouts.getByLabel('Atout de Torg').selectOption('populaire');
        await atouts.getByRole('button', { name: /Chercher une carte Relation/ }).click();
        await atouts.getByRole('button', { name: 'Prendre « Relation »' }).click();
        await expect(atouts.getByRole('button', { name: /Chercher une carte Relation/ })).toBeDisabled();
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.reglerLesRoundsTorg('destin', true); s.poserEnReserve('destin', 13); s.poserEnReserve('destin', 14); });
        console.info('TORG : Atouts vérifiés, ouverture du vrai Hub tactile.');
        navigateur = await chromium.launch({ channel: 'msedge', args: ['--mute-audio'] });
        const contexte = await navigateur.newContext({ viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, locale: 'fr-FR', serviceWorkers: 'block' });
        await presenterLaTablette(contexte, 'torg-recette-hub');
        await contexte.route('**/*', route => {
            const url = new URL(route.request().url());
            return ['data:', 'blob:', 'about:'].includes(url.protocol) || url.hostname === '127.0.0.1' ? route.continue() : route.abort();
        });
        await contexte.route('**/assets/decks/torg-exercice/**', r => r.fulfill({ contentType: 'image/svg+xml', body: illustration }));
        hub = await contexte.newPage();
        hub.setDefaultTimeout(15_000); hub.setDefaultNavigationTimeout(30_000);
        await hub.goto(`http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}`);
        console.info('TORG : Hub chargé, connexion de Teo.');
        await hub.getByRole('button', { name: /Teo Vale/ }).click();
        await expect(hub.getByText('Connecté', { exact: true })).toBeVisible(); await retenirLaTablette(hub, 'torg-recette-hub');
        expect(await hub.evaluate(() => !!window.appBridge)).toBe(false);
        await hub.getByRole('navigation').getByTitle('Cartes', { exact: true }).tap();
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().demanderLeDonDeCarte('destin', 13, 'mara', 'teo'));
        const retour = hub.locator('[data-contrepartie-torg]'); await expect(retour).toBeVisible();
        await expect(retour.getByRole('button', { name: 'Accepter l’échange' })).toBeDisabled();
        await retour.getByLabel('Carte donnée en retour').selectOption('14');
        await image(hub, 'jeu-torg-echange-tablette');
        await retour.getByRole('button', { name: 'Accepter l’échange' }).tap();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().deckStates.destin.enMain?.find(c => c.index === 13)?.porteur)).toBe('teo');
        expect(await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().deckStates.destin.enMain?.find(c => c.index === 14)?.porteur)).toBe('mara');
        await f.evaluate(() => {
            const w = window as unknown as Fenetre, s = w.useSessionOSStore.getState();
            s.updateCampaign('torg-exercice', { cosmsParDefaut: ['tharkold'] }); s.setCurrentView('cockpit');
            const health = (n: number, remplies = 0) => ({ type: 'boxes', state: 'healthy', data: { champ: 'blessures', libelle: 'Blessures', boxes: Array.from({ length: n }, (_, i) => ({ label: '', filled: i < remplies })) } });
            w.useCombatStore.setState({ combatants: [
                { id: 'mara-cb', name: 'Mara Quill', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'mara', statuses: [], healthSystem: health(4, 2) },
                { id: 'mobius', name: 'Vilain de recette', init: 0, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { esprit: 10, realite: 3, resistance: 12, choc: 0, torg_capacites_sbires: true }, healthSystem: health(4) },
                { id: 'laquais', name: 'Laquais confirmé proche', init: 0, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { esprit: 7, resistance: 8, choc: 0 }, healthSystem: health(1) },
            ] } as never);
        });
        await ouvrirLeModule(g, 'Combat-OS');
        const sbires = f.locator('[data-sbires="mobius"]');
        await sbires.getByLabel('Total de dommages').fill('17');
        await sbires.getByLabel('Sbire qui reçoit le coup').selectOption('laquais');
        await expect(sbires.getByRole('button', { name: /Sbires · Réalité/ })).toBeDisabled();
        await sbires.getByLabel(/Le meneur confirme/).check(); await sbires.getByRole('button', { name: /Sbires · Réalité/ }).click();
        await sbires.getByRole('button', { name: 'Confirmer le coup' }).click();
        await expect(sbires.getByRole('button', { name: 'Coup appliqué' })).toBeDisabled();
        await image(f, 'jeu-torg-sbires-transfert', f.locator('[data-combattant="mobius"]'));
        expect(await f.evaluate(() => ((window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.id === 'mobius')!.healthSystem!.data.boxes as { filled: boolean }[]).some(b => b.filled))).toBe(false);
        const souffrance = f.locator('[data-combattant="laquais"] [data-suites-torg]');
        await souffrance.getByLabel('Auteur de la Blessure').selectOption('mara-cb');
        await image(f, 'jeu-torg-souffrance', f.locator('[data-combattant="laquais"]'));
        await souffrance.getByRole('button', { name: 'Souffrance : récupérer 1 Choc' }).click();
        await expect.poll(async () => (await personnage()).sheetData?.choc).toBe(2);
        // Même table depuis le bouton ordinaire d'un adversaire autonome : 17 contre 12 = 1 Blessure, 2 Choc.
        const vilain = f.locator('[data-combattant="mobius"]');
        await vilain.getByTitle('Intensité', { exact: true }).fill('17');
        await vilain.getByRole('button', { name: 'Dégâts', exact: true }).click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.id === 'mobius')?.sheetData)).toMatchObject({ blessures: 1, choc: 2 });
        await f.evaluate(() => {
            const w = window as unknown as Fenetre, s = w.useSessionOSStore.getState(), p = s.players[0].characters.find(c => c.id === 'mara')!;
            s.updateCampaign('torg-exercice', { cosmsParDefaut: ['pan-pacifica'] });
            s.updateCharacter('joueur', 'mara', { sheetData: { ...p.sheetData, choc: 8 } });
        });
        const mara = f.locator('[data-combattant="mara-cb"]');
        await mara.getByTitle('Intensité', { exact: true }).fill('11');
        await mara.getByRole('button', { name: 'Dégâts', exact: true }).click();
        const tenacite = f.locator('[data-combattant="mara-cb"] [data-suites-torg]');
        await expect(tenacite.getByRole('button', { name: /Ténacité :/ })).toBeVisible();
        await image(f, 'jeu-torg-tenacite', f.locator('[data-combattant="mara-cb"]'));
        await tenacite.getByRole('button', { name: /Ténacité :/ }).click();
        await expect.poll(async () => (await personnage()).sheetData?.choc).toBe(0);
        expect((await personnage()).sheetData?.blessures).toBe(3);
        expect((await personnage()).sheetData?.torg_etats_ko).toBe(false);
        const avant = (await personnage()).sheetData;
        await f.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardTorg) Math.random = w.hasardTorg; });
        await f.reload(); await attendreLHydratation(g);
        expect((await personnage()).sheetData).toEqual(avant);
        expect(await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().deckStates.destin.torgUsagesScene)).toContain('mara:ingenieux');
        expect(await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().deckStates.destin.torgUsagesActe)).toContain('mara:populaire');
        await ouvrirLeModule(g, 'Tableau de Bord');
        // La recette finit la séance fictive avant d'importer : Bibliothèque est une vue de préparation.
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState(s => ({ sessions: s.sessions.map(seance => ({ ...seance, status: 'completed' })), currentView: 'library' })));
        await g.application.evaluate(({ dialog }, cible) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] }); }, fichier);
        await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
        await f.locator('#nexus-conflict-replace').click();
        await expect(f.locator('#nexus-bilan-fermer')).toBeVisible(); await f.locator('#nexus-bilan-fermer').click();
        expect((await personnage()).sheetData).toEqual(avant);
        fs.writeFileSync(path.join(sortie, 'verification-electron.json'), JSON.stringify({ version: '2.0.0', importReel: true, ingenieuxCoutEtFrequence: true, populaireRelationEtActe: true,
            echangeHubTactile: true, transfertSbiresUnique: true, degatsOrdinairesAutonome: true, souffranceCible: true, tenaciteCoutEtKO: true, persistance: true, reimportRemplacer: true, donneesPersonnelles: false }, null, 2));
    } finally { await navigateur?.close(); await g.fermer(); }
});
