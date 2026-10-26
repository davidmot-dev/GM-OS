import { test, expect, chromium, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
type FenetreRecette = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore };
const SORTIE = path.resolve('output/campagnes-tests/cthulhu-hack');
const C = 'recette-ch-campagne-port-lenoir';
const captures = path.join(SORTIE, 'captures');

test('les trois archives CH s’importent et les trois joueurs reçoivent leur fiche', async () => {
    test.setTimeout(240_000);
    fs.mkdirSync(captures, { recursive: true });
    const gmos = await lancerGmOs({ preparerLeProfil: profil => {
        fs.mkdirSync(path.join(profil, 'corpus', 'fiches'), { recursive: true });
        fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html', path.join(profil, 'corpus', 'fiches', 'Character_Sheet_Manager.html'));
        fs.cpSync('docs/systems/cthulhu hack/fiche', path.join(profil, 'corpus', 'systems', 'cthulhu hack', 'fiche'), { recursive: true });
    } });
    const f = gmos.fenetre;
    const fuites = new Set<string>();
    const releverSecrets = (valeur: unknown, chemin = '') => {
        if (typeof valeur === 'string' && valeur.includes('SECRET_MJ_CH_RECETTE')) fuites.add(chemin);
        else if (valeur && typeof valeur === 'object') for (const [cle, v] of Object.entries(valeur)) releverSecrets(v, chemin ? `${chemin}.${cle}` : cle);
    };
    const image = async (p: Page, nom: string) => p.screenshot({ path: path.join(captures, nom + '.jpg'), type: 'jpeg', quality: 80, animations: 'disabled', scale: 'css' });
    try {
        await attendreLHydratation(gmos);
        await ouvrirLeModule(gmos, 'Tableau de Bord');
        // Profils et anciens PJ fictifs : mêmes identifiants que l'export fourni par David.
        // Le vrai export RDD ne quitte pas le dépôt et n'est jamais injecté dans les essais.
        const preexistants = ['Thomas D.', 'Marie C.', 'Lucas R.'].map((realName, i) => ({
            id: `p-${i + 1}`, realName, avatarUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text x="8" y="28">${i + 1}</text></svg>`)}`, isOnline: false,
            characters: [{ id: `recette-sentinelle-pj-${i + 1}`, name: `Ancien PJ fictif ${i + 1}`, classRace: 'Sentinelle', campaignId: 'recette-sentinelle', templateId: 'generic',
                hp: 7, maxHp: 10, sheetData: { hp: 7, note: 'ANCIEN PJ À CONSERVER' }, playerNotes: 'NE PAS ÉCRASER' }],
        }));
        await f.evaluate(players => (window as unknown as FenetreRecette).useSessionOSStore.setState({
            campaigns: [{ id: 'recette-sentinelle', name: 'SENTINELLE — ne pas modifier', system: 'generic', activeLocationIds: [] }],
            players, entities: [], sessions: [], actes: [], scenes: [], atlasMaps: [], clues: [], rencontres: [], activeCampaignId: null, currentView: 'library',
        }), preexistants);
        const verifierLesExistants = async () => {
            const existants = await f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.map(p => ({
                id: p.id, realName: p.realName, avatarUrl: p.avatarUrl, characters: p.characters.filter(c => c.campaignId === 'recette-sentinelle'),
            })));
            expect(existants).toEqual(preexistants.map(p => ({ id: p.id, realName: p.realName, avatarUrl: p.avatarUrl, characters: p.characters })));
        };
        const importer = async (fichier: string, campagne: string, remplacer = false) => {
            await gmos.application.evaluate(({ dialog }, cible) => {
                dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] });
            }, path.join(SORTIE, fichier));
            await f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().setCurrentView('library'));
            await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
            await f.locator(remplacer ? '#nexus-conflict-replace' : '#nexus-import-tel-quel').click();
            await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().activeCampaignId), { timeout: 45_000 }).toBe(campagne);
            const fermer = f.locator('#nexus-bilan-fermer');
            if (await fermer.isVisible()) await fermer.click();
        };
        await importer('01-Port-Lenoir.gmos', C);
        await expect(f.getByText('RECETTE CH — La dernière émission de Port-Lenoir').first()).toBeVisible();
        await image(f, '01-campagne-importee');
        await importer('02-Hors-Jeu-et-limites.gmos', 'recette-ch-limites-campagne-port-lenoir');
        await importer('03-Chocs-et-Folies.gmos', 'recette-ch-effets-campagne-port-lenoir');
        const inventaire = await f.evaluate(() => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            return { campagnes: s.campaigns.map(c => c.id), joueurs: s.players.map(p => ({ id: p.id, nom: p.realName, personnages: p.characters.filter(c => c.campaignId !== 'recette-sentinelle').length })),
                pnj: s.entities.length, lieux: s.atlasMaps.length, scenes: s.scenes.length, indices: s.clues.length };
        });
        expect(inventaire.campagnes).toHaveLength(4); expect(inventaire.campagnes).toContain('recette-sentinelle');
        expect(inventaire.joueurs.map(p => p.id)).toEqual(['p-1', 'p-2', 'p-3']);
        expect(inventaire.joueurs.map(p => p.nom)).toEqual(['Thomas D.', 'Marie C.', 'Lucas R.']);
        expect(inventaire.joueurs.reduce((n, p) => n + p.personnages, 0)).toBe(30);
        await verifierLesExistants();
        expect(inventaire.pnj).toBe(36); expect(inventaire.lieux).toBe(24); expect(inventaire.scenes).toBe(54); expect(inventaire.indices).toBe(36);
        // Un geste destructif sur le labo, puis SON import, ne réinitialise pas l'enquête.
        await f.evaluate(campagne => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            const principal = s.players[0].characters.find(c => c.campaignId === campagne)!;
            s.updateCharacter(s.players[0].id, principal.id, { sheetData: { ...principal.sheetData, fortune: 1 } });
            const proprietaire = s.players.find(p => p.characters.some(c => c.name.startsWith('HJ02')))!;
            const cobaye = proprietaire.characters.find(c => c.name.startsWith('HJ02'))!;
            s.updateCharacter(proprietaire.id, cobaye.id, { playerNotes: 'ESSAI À EFFACER' });
        }, C);
        await importer('02-Hors-Jeu-et-limites.gmos', 'recette-ch-limites-campagne-port-lenoir', true);
        const remise = await f.evaluate(campagne => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            return { fortune: s.players[0].characters.find(c => c.campaignId === campagne)!.sheetData.fortune, cobaye: s.players.flatMap(p => p.characters).find(c => c.name.startsWith('HJ02'))!.playerNotes };
        }, C);
        expect(remise.fortune).toBe(1); expect(remise.cobaye).not.toBe('ESSAI À EFFACER');
        await verifierLesExistants();
        await f.evaluate(campagne => {
            const store = (window as unknown as FenetreRecette).useSessionOSStore;
            const s = store.getState(); s.setActiveCampaign(campagne);
            const seance = s.sessions.find(se => se.campaignId === campagne)!;
            store.setState({ sessions: s.sessions.map(se => se.id === seance.id ? { ...se, status: 'active' as const } : se) });
            s.setCurrentView('trame');
        }, C);
        await image(f, '02-trame');
        const navigateur = await chromium.launch({ channel: 'msedge', args: ['--mute-audio'] });
        try {
            const joueurs = [
                { nom: 'Adrien Delcourt', largeur: 360, slug: 'thomas' },
                { nom: 'Claire Morel', largeur: 768, slug: 'marie' },
                { nom: 'Émile Roussel', largeur: 1180, slug: 'lucas' },
            ];
            for (const j of joueurs) {
                const contexte = await navigateur.newContext({ viewport: { width: j.largeur, height: 1000 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'fr-FR' });
                await contexte.route('**/*', route => {
                    const u = new URL(route.request().url());
                    if (['blob:', 'data:'].includes(u.protocol)) return route.continue();
                    if (u.hostname !== '127.0.0.1') return route.abort();
                    if (u.port === String(PORT_FICHES_PAR_DEFAUT)) { u.port = String(gmos.ports.fiches); return route.continue({ url: u.href }); }
                    return [String(gmos.ports.fiches), String(gmos.ports.sync)].includes(u.port) ? route.continue() : route.abort();
                });
                await contexte.addInitScript(slug => localStorage.setItem('gmos-tablet-uuid', `recette-ch-${slug}`), j.slug);
                const tablette = await contexte.newPage();
                tablette.on('websocket', ws => ws.on('framereceived', trame => {
                    try { releverSecrets(JSON.parse(String(trame.payload))); } catch { /* trame non JSON */ }
                }));
                await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
                await tablette.getByRole('button', { name: new RegExp(j.nom) }).click();
                await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
                await tablette.getByTitle('Fiche Personnage', { exact: true }).click();
                await ongletDeLaFiche(tablette, 'Lancer un test');
                const panneau = tablette.locator('[data-jets-de-la-fiche]').first(); await expect(panneau).toBeVisible();
                const avant = await f.evaluate(() => (window as unknown as FenetreRecette).useDiceStore.getState().history.length);
                await panneau.getByRole('button', { name: /^Sagesse/ }).click();
                await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useDiceStore.getState().history.length)).toBeGreaterThan(avant);
                expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                await image(tablette, `03-tablette-${j.slug}-${j.largeur}`);
                await ongletDeLaFiche(tablette, 'Ma fiche');
                const modele = JSON.parse(fs.readFileSync('docs/systems/cthulhu hack/fiche/correspondance.json', 'utf8')).gabaritDeLaFiche;
                await expect(tablette.frameLocator('iframe:visible').locator('.sheet').first()).toHaveAttribute('data-template', modele, { timeout: 30_000 });
                await contexte.close();
            }
        } finally { await navigateur.close(); }
        await f.reload(); await attendreLHydratation(gmos);
        await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p => p.characters).length)).toBe(33);
        await verifierLesExistants();
        fs.writeFileSync(path.join(SORTIE, 'verification-electron.json'), JSON.stringify({ reussi: fuites.size === 0, importNatif: true, sentinelleConservee: true, joueurs: inventaire.joueurs,
            joueursExistantsConserves: true, anciensPJConserves: 3,
            archives: ['01-Port-Lenoir.gmos', '02-Hors-Jeu-et-limites.gmos', '03-Chocs-et-Folies.gmos'].map(fichier => ({ fichier, sha256: createHash('sha256').update(fs.readFileSync(path.join(SORTIE, fichier))).digest('hex') })),
            remplacementIsole: true, reload: true, tablettes: [360, 768, 1180], jetsRecusParMJ: 3, secretsNonDiffuses: fuites.size === 0, ficheHTML: true,
            anomalies: [...fuites].map(chemin => ({ cas: 'GM-05', chemin, attendu: 'secret absent des trames joueur', observe: 'marqueur secret présent' })) }, null, 2));
        expect.soft(fuites.size, 'GM-05 : champs secrets de séance reçus par les tablettes ; voir verification-electron.json').toBe(0);
    } finally { await gmos.fermer(); }
});
