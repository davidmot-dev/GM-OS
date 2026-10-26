import { test, expect, chromium, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';
import type { EtatMuthur } from '../outils/alien/modules/muthur/moteur.mjs';
import type { EtatDetecteur } from '../outils/alien/modules/detecteur/moteur.mjs';
import type { EtatCombatSpatial } from '../outils/alien/modules/combat-spatial/moteur.mjs';
type FenetreRecette = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore };
const SORTIE = path.resolve('output/campagnes-tests/alien');
const C = 'recette-alien-campagne-orphee';
const captures = path.join(SORTIE, 'captures');

test('les trois archives ALIEN s’importent et les trois joueurs reçoivent leur fiche', async () => {
    test.setTimeout(240_000);
    fs.mkdirSync(captures, { recursive: true });
    const gmos = await lancerGmOs({ preparerLeProfil: profil => {
        fs.mkdirSync(path.join(profil, 'corpus', 'fiches'), { recursive: true });
        fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html', path.join(profil, 'corpus', 'fiches', 'Character_Sheet_Manager.html'));
        fs.cpSync('docs/systems/alien/fiche', path.join(profil, 'corpus', 'systems', 'alien', 'fiche'), { recursive: true });
    } });
    const f = gmos.fenetre;
    f.setDefaultTimeout(15_000);
    const fuites = new Set<string>();
    const releverSecrets = (valeur: unknown, chemin = '') => {
        if (typeof valeur === 'string' && valeur.includes('SECRET_MJ_ALIEN_RECETTE')) fuites.add(chemin);
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
        await importer('01-La-derniere-releve.gmos', C);
        await expect(f.getByText('RECETTE ALIEN — La dernière relève d’Orphée').first()).toBeVisible();
        await image(f, '01-campagne-importee');
        await importer('02-Corps-Panique-et-Survie.gmos', 'recette-alien-corps-campagne-orphee');
        await importer('03-M314-Terminal-et-Vaisseaux.gmos', 'recette-alien-modules-campagne-orphee');
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
        // Un geste destructif sur le labo, puis SON import, ne réinitialise pas l'enquête.
        await f.evaluate(campagne => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            const principal = s.players[0].characters.find(c => c.campaignId === campagne)!;
            s.updateCharacter(s.players[0].id, principal.id, { sheetData: { ...principal.sheetData, points_de_recit: 0 } });
            const proprietaire = s.players.find(p => p.characters.some(c => c.name.startsWith('B02')))!;
            const cobaye = proprietaire.characters.find(c => c.name.startsWith('B02'))!;
            s.updateCharacter(proprietaire.id, cobaye.id, { playerNotes: 'ESSAI À EFFACER' });
        }, C);
        await importer('02-Corps-Panique-et-Survie.gmos', 'recette-alien-corps-campagne-orphee', true);
        const remise = await f.evaluate(campagne => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            return { points_de_recit: s.players[0].characters.find(c => c.campaignId === campagne)!.sheetData.points_de_recit, cobaye: s.players.flatMap(p => p.characters).find(c => c.name.startsWith('B02'))!.playerNotes };
        }, C);
        expect(remise.points_de_recit).toBe(0); expect(remise.cobaye).not.toBe('ESSAI À EFFACER');
        await verifierLesExistants();
        await f.evaluate(campagne => {
            const store = (window as unknown as FenetreRecette).useSessionOSStore;
            const s = store.getState(); s.setActiveCampaign(campagne);
            s.setCurrentView('trame');
        }, C);
        await image(f, '02-trame');
        await expect.poll(async () => (await vueModules()).campagneId).toBe(C);
        const initiale = await vueModules(); expect(initiale.modules).toHaveLength(3);
        expect(initiale.modules.every(m => m.acces.length === 0)).toBe(true);
        expect(Object.keys(initiale.sauvegarde!.campagnes).filter(id => id.startsWith('recette-alien-'))).toHaveLength(3);
        const terminal = await lireModule<EtatMuthur>('alien-muthur');
        expect(terminal.config.vessel).toBe('ISKRA / RELAIS ORPHÉE'); expect(terminal.actes).toHaveLength(3);
        expect((await lireModule<EtatDetecteur>('alien-detecteur')).discret.energie).toBe(5);
        expect((await lireModule<EtatCombatSpatial>('alien-combat-spatial')).vaisseaux).toHaveLength(2);
        // Deux remplacements de laboratoire ne changent ni la fiche ni les modules de l'enquête.
        await commander('alien-muthur', 'configurer', { statut: 'TRACE DE RECETTE À CONSERVER' });
        await importer('03-M314-Terminal-et-Vaisseaux.gmos', 'recette-alien-modules-campagne-orphee', true);
        await f.evaluate(campagne => {
            const store = (window as unknown as FenetreRecette).useSessionOSStore, s = store.getState();
            s.setActiveCampaign(campagne); const seance = s.sessions.find(se => se.campaignId === campagne)!;
            store.setState({ sessions: s.sessions.map(se => se.id === seance.id ? { ...se, status: 'active' as const } : se) }); s.setCurrentView('modules-du-jeu');
        }, C);
        await expect.poll(async () => (await vueModules()).campagneId).toBe(C);
        expect((await lireModule<EtatMuthur>('alien-muthur')).config.status).toBe('TRACE DE RECETTE À CONSERVER');
        const pcs = await f.evaluate(campagne => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p => p.characters).filter(c => c.campaignId === campagne).map(c => c.id), C);
        for (const moduleId of ['alien-muthur', 'alien-detecteur', 'alien-combat-spatial']) {
            const vue = await vueModules();
            expect(await f.evaluate(({ vue, moduleId, pcs }) => window.appBridge!.modulesDuJeu!.autoriser({ campagneId: vue.campagneId!, contexte: vue.contexte, moduleId, personnages: pcs }), { vue, moduleId, pcs })).toEqual({ ok: true });
        }
        await commander('alien-muthur', 'remettre-objectif-acte', { scenario: terminal.actes[0].scenario, acte: 1, personnageId: pcs[0] });
        await commander('alien-detecteur', 'deplacer-discret', { pionId: 'recette-alien-pion-creature', zoneId: 'recette-alien-zone-gaine', tour: 1 });
        await commander('alien-detecteur', 'scanner-discret', { tour: 1 });
        expect((await lireModule<EtatDetecteur>('alien-detecteur')).discret.dernierScan!.echos.map(e => [e.zone, e.nombre])).toEqual([['Gaine de maintenance', 1]]);
        const vaisseaux = (await lireModule<EtatCombatSpatial>('alien-combat-spatial')).vaisseaux;
        await commander('alien-combat-spatial', 'demarrer-combat', { vaisseaux: vaisseaux.map(v => v.id), distance: 8, velociteJoueurs: 2, velociteAdverse: 2 });
        const carte = (nom: string) => f.locator('article').filter({ has: f.getByRole('heading', { name: nom, exact: true }) });
        await carte('MU/TH/UR 6000').getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
        await image(f, '03-muthur-mj');
        await carte('Détecteur de mouvement').getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
        await image(f, '04-detecteur-mj');
        let modulesPrives = true;
        const navigateur = await chromium.launch({ channel: 'msedge', args: ['--mute-audio'] });
        try {
            const joueurs = [
                { nom: 'Eli Voss', largeur: 360, slug: 'thomas' },
                { nom: 'Mara Chen', largeur: 768, slug: 'marie' },
                { nom: 'Samir Hale', largeur: 1180, slug: 'lucas' },
            ];
            for (const [i, j] of joueurs.entries()) {
                const contexte = await navigateur.newContext({ viewport: { width: j.largeur, height: 1000 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'fr-FR' });
                await contexte.route('**/*', route => {
                    const u = new URL(route.request().url());
                    if (['blob:', 'data:'].includes(u.protocol)) return route.continue();
                    if (u.hostname !== '127.0.0.1') return route.abort();
                    if (u.port === String(PORT_FICHES_PAR_DEFAUT)) { u.port = String(gmos.ports.fiches); return route.continue({ url: u.href }); }
                    return [String(gmos.ports.fiches), String(gmos.ports.sync)].includes(u.port) ? route.continue() : route.abort();
                });
                await contexte.addInitScript(slug => localStorage.setItem('gmos-tablet-uuid', `recette-alien-${slug}`), j.slug);
                const tablette = await contexte.newPage();
                tablette.setDefaultTimeout(15_000);
                tablette.on('websocket', ws => ws.on('framereceived', trame => {
                    try {
                        const texte = String(trame.payload); releverSecrets(JSON.parse(texte));
                        if (texte.includes('SECRET_MODULE_ALIEN')) modulesPrives = false;
                        for (const o of terminal.actes[0].objectifs) if (o.personnageId !== pcs[i] && texte.includes(o.texte)) modulesPrives = false;
                    } catch { /* trame non JSON */ }
                }));
                await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
                await tablette.getByRole('button', { name: new RegExp(j.nom) }).click();
                await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
                await tablette.getByTitle('Fiche Personnage', { exact: true }).click();
                await ongletDeLaFiche(tablette, 'Lancer un test');
                const panneau = tablette.locator('[data-panneau-de-jet]').first(); await expect(panneau).toBeVisible();
                await panneau.locator('select').nth(0).selectOption('esprit');
                await panneau.locator('select').nth(1).selectOption('comtech');
                await panneau.locator('select').nth(2).selectOption('niveau_de_stress');
                const avant = await f.evaluate(() => (window as unknown as FenetreRecette).useDiceStore.getState().history.length);
                await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
                await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useDiceStore.getState().history.length)).toBeGreaterThan(avant);
                expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                await image(tablette, `03-tablette-${j.slug}-${j.largeur}`);
                await ongletDeLaFiche(tablette, 'Ma fiche');
                const modele = JSON.parse(fs.readFileSync('docs/systems/alien/fiche/correspondance.json', 'utf8')).gabaritDeLaFiche;
                await expect(tablette.frameLocator('iframe:visible').locator('.sheet').first()).toHaveAttribute('data-template', modele, { timeout: 30_000 });
                await tablette.getByTitle('Fermer la fiche', { exact: true }).click();
                const instrument = async (nom: string, selecteur: string) => {
                    await tablette.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
                    const retour = tablette.getByRole('button', { name: 'Retour aux modules', exact: true }); if (await retour.count()) await retour.click();
                    await tablette.getByRole('button', { name: `Ouvrir ${nom}`, exact: true }).click();
                    const el = tablette.locator(selecteur); await expect(el).toBeVisible(); return el;
                };
                const maman = await instrument('MU/TH/UR 6000', '.gmos-muthur');
                await maman.getByLabel('Commande ou /M votre question', { exact: true }).fill('READ mission');
                await maman.getByRole('button', { name: 'Transmettre', exact: true }).click();
                await expect(maman.getByText(/RECETTE ORPHÉE : assister les survivants/).first()).toBeVisible();
                if (i === 0) await expect(maman.getByText(terminal.actes[0].objectifs[0].texte, { exact: false }).first()).toBeVisible();
                await image(tablette, `05-terminal-${j.slug}-${j.largeur}`);
                const radar = await instrument('Détecteur de mouvement', '.gmos-detecteur');
                await expect(radar.getByText(/Gaine de maintenance/).first()).toBeVisible();
                expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                await image(tablette, `06-detecteur-${j.slug}-${j.largeur}`);
                const spatial = await instrument('Combat spatial', '.gmos-spatial');
                await expect(spatial.getByRole('list', { name: 'Contacts' })).toContainText('Contact non identifié');
                if (i === 0) {
                    await spatial.getByLabel('Action de Iskra', { exact: true }).selectOption('verrouiller');
                    await spatial.getByRole('form', { name: 'Ordre de Iskra', exact: true }).getByRole('button', { name: 'Donner l’ordre', exact: true }).click();
                    await expect.poll(async () => (await lireModule<EtatCombatSpatial>('alien-combat-spatial')).combat!.ordres[vaisseaux[0].id]?.action).toBe('verrouiller');
                }
                expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                await image(tablette, `07-spatial-${j.slug}-${j.largeur}`);
                await contexte.close();
            }
        } finally { await navigateur.close(); }
        // Fermer le contexte de séance : les préparations persistent, les accès doivent tomber.
        await f.evaluate(campagne => (window as unknown as FenetreRecette).useSessionOSStore.setState(s => ({ sessions: s.sessions.map(se => se.campaignId === campagne ? { ...se, status: 'planned' as const } : se) })), C);
        await expect.poll(async () => (await vueModules()).modules.every(m => m.acces.length === 0)).toBe(true);
        await f.reload(); await attendreLHydratation(gmos);
        await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p => p.characters).length)).toBe(18);
        await verifierLesExistants();
        await expect.poll(async () => (await vueModules()).modules.every(m => m.acces.length === 0)).toBe(true);
        expect((await lireModule<EtatMuthur>('alien-muthur')).players[pcs[0]].messages.some(m => m.content.includes(terminal.actes[0].objectifs[0].texte))).toBe(true);
        expect(modulesPrives, 'Les données privées des modules doivent rester privées').toBe(true);
        fs.writeFileSync(path.join(SORTIE, 'verification-electron.json'), JSON.stringify({ reussi: fuites.size === 0, importNatif: true, sentinelleConservee: true, joueurs: inventaire.joueurs,
            joueursExistantsConserves: true, anciensPJConserves: 3,
            modulesImportes: 9, modulesPrives, parcoursModulesTablettes: 9, scanM314: true, objectifPriveRemis: true, ordreSpatialRecu: true,
            archives: ['01-La-derniere-releve.gmos', '02-Corps-Panique-et-Survie.gmos', '03-M314-Terminal-et-Vaisseaux.gmos'].map(fichier => ({ fichier, sha256: createHash('sha256').update(fs.readFileSync(path.join(SORTIE, fichier))).digest('hex') })),
            remplacementIsole: true, reload: true, tablettes: [360, 768, 1180], jetsRecusParMJ: 3, secretsNonDiffuses: fuites.size === 0, ficheHTML: true,
            anomalies: [...fuites].map(chemin => ({ cas: 'GM-05', chemin, attendu: 'secret absent des trames joueur', observe: 'marqueur secret présent' })) }, null, 2));
        expect.soft(fuites.size, 'GM-05 : champs secrets de séance reçus par les tablettes ; voir verification-electron.json').toBe(0);
    } finally { await gmos.fermer(); }
});
