import { test, expect, chromium, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';
import type { EtatTMR } from '../outils/reve-de-dragon/tmr/moteur.mjs';
type FenetreRecette = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore };
const SORTIE = path.resolve('output/campagnes-tests/reve-de-dragon');
const C = 'recette-rdd-campagne-moulin';
const captures = path.join(SORTIE, 'captures');

test('les archives RdD et trois demi-rêves raccordés', async () => {
    test.setTimeout(240_000);
    fs.mkdirSync(captures, { recursive: true });
    const gmos = await lancerGmOs({ preparerLeProfil: profil => {
        fs.mkdirSync(path.join(profil, 'corpus', 'fiches'), { recursive: true });
        fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html', path.join(profil, 'corpus', 'fiches', 'Character_Sheet_Manager.html'));
        fs.cpSync('docs/systems/reves de dragons/fiche', path.join(profil, 'corpus', 'systems', 'reves de dragons', 'fiche'), { recursive: true });
    } });
    const f = gmos.fenetre;
    f.setDefaultTimeout(15_000);
    const fuites = new Set<string>();
    const releverSecrets = (valeur: unknown, chemin = '') => {
        if (typeof valeur === 'string' && valeur.includes('SECRET_MJ_RDD_RECETTE')) fuites.add(chemin);
        else if (valeur && typeof valeur === 'object') for (const [cle, v] of Object.entries(valeur)) releverSecrets(v, chemin ? `${chemin}.${cle}` : cle);
    };
    const image = async (p: Page, nom: string) => p.screenshot({ path: path.join(captures, nom + '.jpg'), type: 'jpeg', quality: 80, animations: 'disabled', scale: 'css' });
    const vueModules = async (): Promise<VueDesModulesMJ> => f.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
    const lireModule = async <T,>(moduleId: string): Promise<T> => (await vueModules()).sauvegarde!.campagnes[C][moduleId].donnees as T;
    const commander = async (moduleId: string, id: string, charge: unknown) => {
        const vue = await vueModules();
        expect(await f.evaluate(({ vue, moduleId, id, charge }) => window.appBridge!.modulesDuJeu!.commander({ campagneId: vue.campagneId!, contexte: vue.contexte,
            requeteId: crypto.randomUUID(), moduleId, commande: { id, charge } }), { vue, moduleId, id, charge })).toEqual({ ok: true });
    };
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
        await importer('01-Le-Moulin-des-heures-oubliees.gmos', C);
        await expect(f.getByText('RECETTE RÊVE DE DRAGON — Le Moulin des heures oubliées').first()).toBeVisible();
        await image(f, '01-campagne-importee');
        await importer('02-Corps-Repos-et-Progression.gmos', 'recette-rdd-corps-campagne-moulin');
        await importer('03-Haut-Reve-et-TMR.gmos', 'recette-rdd-tmr-campagne-moulin');
        const inventaire = await f.evaluate(() => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            return { campagnes: s.campaigns.map(c => c.id), joueurs: s.players.map(p => ({ id: p.id, nom: p.realName, personnages: p.characters.filter(c => c.campaignId !== 'recette-sentinelle').length })),
                pnj: s.entities.length, lieux: s.atlasMaps.length, scenes: s.scenes.length, indices: s.clues.length };
        });
        expect(inventaire.campagnes).toHaveLength(4); expect(inventaire.campagnes).toContain('recette-sentinelle');
        expect(inventaire.joueurs.map(p => p.id)).toEqual(['p-1', 'p-2', 'p-3']);
        expect(inventaire.joueurs.map(p => p.nom)).toEqual(['Thomas D.', 'Marie C.', 'Lucas R.']);
        expect(inventaire.joueurs.reduce((n, p) => n + p.personnages, 0)).toBe(15);
        await verifierLesExistants();
        expect(inventaire.pnj).toBe(36); expect(inventaire.lieux).toBe(24); expect(inventaire.scenes).toBe(48); expect(inventaire.indices).toBe(36);
        await f.evaluate(campagne => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            const c = s.players[0].characters.find(c => c.campaignId === campagne)!;
            s.updateCharacter(s.players[0].id, c.id, { playerNotes: 'TRACE ENQUÊTE À CONSERVER' });
            const p = s.players.find(p => p.characters.some(c => c.name.startsWith('B02')))!;
            s.updateCharacter(p.id, p.characters.find(c => c.name.startsWith('B02'))!.id, { playerNotes: 'LABO À EFFACER' });
        }, C);
        await importer('02-Corps-Repos-et-Progression.gmos', 'recette-rdd-corps-campagne-moulin', true);
        await f.evaluate(campagne => {
            const store = (window as unknown as FenetreRecette).useSessionOSStore, s = store.getState();
            s.setActiveCampaign(campagne); s.setCurrentView('modules-du-jeu');
            store.setState({ sessions: s.sessions.map(se => se.campaignId === campagne && se.number === 1 ? { ...se, status: 'active' as const } : se) });
        }, C);
        await expect.poll(async () => (await vueModules()).campagneId).toBe(C);
        expect(Object.keys((await vueModules()).sauvegarde!.campagnes).filter(id => id.startsWith('recette-rdd-'))).toHaveLength(3);
        const lire = () => lireModule<EtatTMR>('rdd-tmr');
        const pcs = await f.evaluate(campagne => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.map(p => p.characters.find(c => c.campaignId === campagne)!), C);
        expect((await lire()).voyageurs.map(v => v.position)).toEqual(['G4', 'J4', 'D13']);
        const vue = await vueModules();
        expect(await f.evaluate(({ vue, ids }) => window.appBridge!.modulesDuJeu!.autoriser({ campagneId: vue.campagneId!, contexte: vue.contexte, moduleId: 'rdd-tmr', personnages: ids }), { vue, ids: pcs.map(c => c.id) })).toEqual({ ok: true });
        await f.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
        await image(f, '02-pupitre-tmr');
        let modulesPrives = true;
        const navigateur = await chromium.launch({ channel: 'msedge', args: ['--mute-audio'] });
        let jets = 0, montees = 0;
        const lireFiche = (id: string) => f.evaluate(id => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p => p.characters).find(c => c.id === id)!, id);
        try {
            for (const [i, largeur] of [360, 768, 1180].entries()) {
                const pc = pcs[i], contexte = await navigateur.newContext({ viewport: { width: largeur, height: 1000 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'fr-FR' });
                await contexte.route('**/*', route => {
                    const u = new URL(route.request().url()); if (['blob:', 'data:'].includes(u.protocol)) return route.continue();
                    if (u.hostname !== '127.0.0.1') return route.abort();
                    if (u.port === String(PORT_FICHES_PAR_DEFAUT)) { u.port = String(gmos.ports.fiches); return route.continue({ url: u.href }); }
                    return [String(gmos.ports.fiches), String(gmos.ports.sync)].includes(u.port) ? route.continue() : route.abort();
                });
                await contexte.addInitScript(i => localStorage.setItem('gmos-tablet-uuid', `recette-rdd-${i}`), i);
                const tablette = await contexte.newPage(); tablette.setDefaultTimeout(15_000);
                tablette.on('websocket', ws => ws.on('framereceived', trame => {
                    try { const texte = String(trame.payload), message = JSON.parse(texte); releverSecrets(message);
                        if (texte.includes('SECRET_MODULE_RDD')) modulesPrives = false;
                        const verifier = (x: unknown) => { if (!x || typeof x !== 'object') return;
                            const v = x as Record<string, unknown>;
                            if (v.role === 'joueur' && v.voyageur && (v.voyageur as { id: string }).id !== pc.id) modulesPrives = false;
                            if (i !== 0 && JSON.stringify(v).includes('RENCONTRE_PRIVEE_LISERON')) modulesPrives = false;
                            for (const y of Object.values(v)) verifier(y);
                        }; verifier(message);
                    } catch { /* trame non JSON */ }
                }));
                await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
                await tablette.getByRole('button', { name: new RegExp(pc.name) }).click();
                await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
                await tablette.getByTitle('Fiche Personnage', { exact: true }).click(); await ongletDeLaFiche(tablette, 'Lancer un test');
                const panneau = tablette.locator('[data-panneau-de-jet]').first();
                await panneau.locator('select').nth(0).selectOption('vue'); await panneau.locator('select').nth(1).selectOption('vigilance');
                const avant = await f.evaluate(() => (window as unknown as FenetreRecette).useDiceStore.getState().history.length);
                await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
                await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useDiceStore.getState().history.length)).toBeGreaterThan(avant); jets++;
                await ongletDeLaFiche(tablette, 'Ma fiche');
                const modele = JSON.parse(fs.readFileSync('docs/systems/reves de dragons/fiche/correspondance.json', 'utf8')).gabaritDeLaFiche;
                await expect(tablette.frameLocator('iframe:visible').locator('.sheet').first()).toHaveAttribute('data-template', modele, { timeout: 30_000 });
                await tablette.getByTitle('Fermer la fiche', { exact: true }).click();
                await tablette.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
                await tablette.getByRole('button', { name: 'Ouvrir Terres Médianes du Rêve', exact: true }).click();
                const pj = tablette.getByRole('region', { name: 'Terres Médianes du Rêve', exact: true });
                const carte = pj.getByRole('img', { name: 'Carte officielle en couleur des Terres Médianes du Rêve', exact: true });
                await expect(carte).toBeVisible(); expect(await carte.evaluate(el => [(el as HTMLImageElement).naturalWidth, (el as HTMLImageElement).naturalHeight])).toEqual([900, 1000]);
                const payer = async () => {
                    const raccord = f.getByRole('region', { name: `Raccord de fiche de ${pc.name}`, exact: true });
                    await raccord.getByRole('button', { name: 'Prévisualiser le coût sur la fiche', exact: true }).click();
                    await raccord.getByLabel('Conditions de concentration, round et barème de base vérifiés', { exact: true }).check();
                    await raccord.getByRole('button', { name: 'Débiter la fiche et valider le trajet', exact: true }).click();
                    await expect(raccord).toHaveCount(0);
                };
                await pj.getByRole('button', { name: 'Demander la montée', exact: true }).click(); await payer();
                expect((await lireFiche(pc.id)).sheetData).toMatchObject({ reve_pts: 11, fatigue: 1 }); montees++;
                if (i === 0) {
                    await commander('rdd-tmr', 'publier-rencontre', { personnageId: pc.id, texte: 'RENCONTRE_PRIVEE_LISERON — Messager des rêves, force 4 ; laissé passer.' });
                    await expect(pj).toContainText('RENCONTRE_PRIVEE_LISERON');
                    await image(tablette, '03-rencontre-thomas-360');
                    const v = (await lire()).voyageurs.find(v => v.id === pc.id)!;
                    await commander('rdd-tmr', 'terminer-rencontre', { personnageId: pc.id, etape: v.etape });
                    await pj.getByLabel('Case sélectionnée', { exact: true }).selectOption('H4');
                    await pj.getByRole('button', { name: 'Demander le déplacement', exact: true }).click(); await payer();
                    expect((await lireFiche(pc.id)).sheetData).toMatchObject({ reve_pts: 11, fatigue: 2 });
                    await expect(pj.locator('.tmr-position')).toContainText('H4');
                }
                expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                await image(tablette, `04-tmr-joueur-${i + 1}-${largeur}`); await contexte.close();
            }
        } finally { await navigateur.close(); }
        expect(jets).toBe(3); expect(montees).toBe(3); expect(modulesPrives).toBe(true);
        await f.evaluate(campagne => (window as unknown as FenetreRecette).useSessionOSStore.setState(s => ({ sessions: s.sessions.map(se => se.campaignId === campagne ? { ...se, status: 'planned' as const } : se) })), C);
        await expect.poll(async () => (await vueModules()).modules.every(m => m.acces.length === 0)).toBe(true);
        await f.reload(); await attendreLHydratation(gmos);
        await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p => p.characters).length)).toBe(18);
        await verifierLesExistants();
        expect((await lireFiche(pcs[0].id)).playerNotes).toBe('TRACE ENQUÊTE À CONSERVER');
        expect((await lireFiche(pcs[0].id)).sheetData).toMatchObject({ reve_pts: 11, fatigue: 2 });
        expect((await lireFiche(pcs[0].id)).sheetData.__rddRecusTMR231).toHaveLength(2);
        expect((await lire()).voyageurs.find(v => v.id === pcs[0].id)).toMatchObject({ position: 'H4', present: false, demande: null });
        fs.writeFileSync(path.join(SORTIE, 'verification-electron.json'), JSON.stringify({ reussi: fuites.size === 0, importNatif: true, remplacementIsole: true, reload: true,
            joueursExistantsConserves: true, anciensPJConserves: 3, joueurs: inventaire.joueurs, ficheHTML: true, jetsRecusParMJ: jets, tablettes: [360, 768, 1180],
            modulesImportes: 3, modulesPrives, monteesPayees: montees, deplacementPaye: true, rencontrePrivee: true, carteOfficielle: true, recusPersistes: 2,
            archives: ['01-Le-Moulin-des-heures-oubliees.gmos', '02-Corps-Repos-et-Progression.gmos', '03-Haut-Reve-et-TMR.gmos'].map(fichier => ({ fichier, sha256: createHash('sha256').update(fs.readFileSync(path.join(SORTIE, fichier))).digest('hex') })),
            secretsNonDiffuses: fuites.size === 0, anomalies: [...fuites].map(chemin => ({ cas: 'GM-05', chemin, attendu: 'secret absent des trames joueur', observe: 'marqueur secret présent' })) }, null, 2));
        expect.soft(fuites.size, 'GM-05 : secrets de séance reçus ; voir verification-electron.json').toBe(0);
    } finally { await gmos.fermer(); }
});
