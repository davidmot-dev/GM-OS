import { test, expect, chromium, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useJournalStore } from '../src/modules/journal/useJournalStore';
import type { NexusDriverState } from '../src/modules/system/archive/nexus.types';
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useJournalStore: typeof useJournalStore; hasardCoc?: typeof Math.random };
const sortie = path.resolve('output/coc-a4-a6');
test('COC-A4/A5/A6 : Héros, choc persistant, Voie du formulaire au Hub et journal', async () => {
    test.setTimeout(300_000);
    const g = await lancerGmOs(), f = g.fenetre;
    const source = JSON.parse(new AdmZip('output/coc-a1-a3/pilote/COC-2.1.0-d20.gmos-driver').readAsText('state.json')) as NexusDriverState;
    fs.mkdirSync(sortie, { recursive: true });
    let navigateur: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    const perso = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
    const hasard = async (page: Page, v: number, action: () => Promise<unknown>) => {
        await page.evaluate(v => { const w = window as unknown as Fenetre; w.hasardCoc = Math.random; Math.random = () => v; }, v);
        try { await action(); } finally { await page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardCoc) Math.random = w.hasardCoc; }); }
    };
    async function importer(fichier: string, version: string, remplacer = false) {
        await g.application.evaluate(({ dialog }, chemin) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [chemin] }); }, path.resolve(fichier));
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('library'));
        await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
        if (remplacer) await f.locator('#nexus-conflict-replace').click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().customGameDrivers[0]?.version)).toBe(version);
        const fermer = f.locator('#nexus-bilan-fermer'); if (await fermer.isVisible()) await fermer.click();
    }
    async function ouvrirPj() {
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setCurrentView('players'); s.setSelectedPlayer('coc-j'); s.setSelectedCharacter('amelia'); });
        await ongletDeLaFiche(f, 'Lancer un test');
        return f.locator('[data-panneau-de-jet]').first();
    }
    try {
        await f.setViewportSize({ width: 1600, height: 1500 }); await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState({ campaigns: [], players: [], entities: [], sessions: [], scenes: [], actes: [], activeCampaignId: null, customGameDrivers: [], customSheetTemplates: [], currentView: 'library' }));
        await importer('output/coc-a1-a3/pilote/COC-2.1.0-d20.gmos-driver', '2.1.0');
        await f.evaluate(source => {
            const w = window as unknown as Fenetre, s = w.useSessionOSStore.getState();
            const defaults = Object.fromEntries(source.sheetTemplate!.sections.flatMap(sec => sec.fields).map(c => [c.id, c.defaultValue ?? '']));
            w.useSessionOSStore.setState({ campaigns: [{ id: 'coc-recette', name: 'L’Écho du Queens', system: source.gameDriver.id, activeLocationIds: [] }], activeCampaignId: 'coc-recette',
                sessions: [{ id: 'coc-seance', campaignId: 'coc-recette', number: 1, title: 'Recette des avantages', status: 'draft', sessionEntityIds: ['amelia'] }], selectedSessionId: 'coc-seance',
                players: [{ id: 'coc-j', realName: 'Joueur fictif', isOnline: false, characters: [{ id: 'amelia', name: 'Amelia Steele', campaignId: 'coc-recette', systemId: source.gameDriver.id, templateId: source.sheetTemplate!.id, hp: 0, maxHp: 0,
                    sheetData: { ...defaults, nom: 'Amelia Steele', agilite: 2, volonte: 2, intelligence: 0, perception: 2, constitution: 2, force: 1, defense: 14, initiative: 12, protection_rd: 2, echelle_de_sante: 0,
                        modele_evolution: 'Héros', echelle_evolution: 13, arme1: 'Revolver', arme1_attaque: 2, arme1_dm: '1d8', arme1_bc: 8, arme1_type: 'distance' } }] }],
                entities: [{ id: 'gangster', name: 'Gangster fictif', type: 'npc', campaignId: 'coc-recette', systemId: source.gameDriver.id, templateId: source.sheetTemplate!.id, hp: 0, maxHp: 0, sheetData: { ...defaults, protection_rd: 2, echelle_de_sante: 0 } }] } as never);
            s.setSelectedPlayer('coc-j'); s.setSelectedCharacter('amelia');
            w.useCombatStore.getState().clearCombatants();
            for (const c of [{ name: 'Amelia Steele', init: 12, isPlayer: true, faction: 'player' as const, sourcePlayerId: 'amelia' }, { name: 'Gangster fictif', init: 10, isPlayer: false, faction: 'enemy' as const, sourceEntityId: 'gangster' }]) w.useCombatStore.getState().addCombatant({ ...c, statuses: [] });
            w.useJournalStore.getState().addJournal('Recette COC fictive'); w.useJournalStore.setState({ isRecording: true });
        }, source);
        const avant = (await perso()).sheetData;
        await importer(path.join(sortie, 'pilote/COC-2.2.0-d20.gmos-driver'), '2.2.0', true);
        expect((await perso()).sheetData).toEqual(avant);
        let panneau = await ouvrirPj(); await panneau.locator('select').first().selectOption('volonte');
        await hasard(f, .5, () => panneau.getByRole('button', { name: 'Lancer', exact: true }).click());
        const resultatAvant = (await panneau.getByRole('region', { name: 'Résultat', exact: true }).textContent())!.split('Échelle du héros')[0];
        const hero = panneau.locator('[data-heroisme-coc]'); await hero.locator('summary').first().click();
        await hero.getByRole('button', { name: 'Confirmer l’avantage héroïque' }).click();
        await expect.poll(async () => (await perso()).sheetData?.echelle_evolution).toBe(12);
        await expect(f.locator('[data-sante-coc]')).toContainText('DEF effective 19');
        expect((await perso()).sheetData?.defense).toBe(14);
        expect((await panneau.getByRole('region', { name: 'Résultat', exact: true }).textContent())!.split('Échelle du héros')[0]).toBe(resultatAvant);
        await hero.screenshot({ path: path.join(sortie, 'jeu-coc-heroisme.jpg'), type: 'jpeg', quality: 85 });
        await hero.getByRole('button', { name: 'Attaque terminée : consommer la DEF' }).click();
        await hero.getByLabel('Destination du bonus héroïque').selectOption('initiative'); await hero.getByRole('button', { name: 'Confirmer l’avantage héroïque' }).click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.sourcePlayerId === 'amelia')?.init)).toBe(17);
        await hero.getByLabel('Destination du bonus héroïque').selectOption('dm-infliges'); await hero.getByRole('button', { name: 'Confirmer l’avantage héroïque' }).click();
        await hero.locator('summary').first().click();
        await panneau.locator('select').first().selectOption('arme1_attaque');
        await hasard(f, .999, () => panneau.getByRole('button', { name: 'Lancer', exact: true }).click());
        const dm = panneau.locator('[data-dommages-coc]'); await dm.getByLabel('Cible des DM').selectOption('npc:gangster');
        await hasard(f, .8, () => dm.getByRole('button', { name: 'Lancer les DM' }).click());
        await expect(dm).toContainText('20 DM'); await expect(dm).toContainText('18 subis');
        await dm.getByRole('button', { name: 'Appliquer les DM à la cible' }).click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().entities[0].sheetData?.echelle_de_sante)).toBe(18);
        await hero.locator('summary').first().click(); await hero.getByLabel('Destination du bonus héroïque').selectOption('dm-subis'); await hero.getByRole('button', { name: 'Confirmer l’avantage héroïque' }).click();
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().handleApplyImpact('amelia', 'pc', { value: 15, coc: { id: 'recette-reduction' } }));
        await expect.poll(async () => (await perso()).sheetData?.echelle_de_sante).toBe(8);
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(), c = s.players[0].characters[0]; s.handleApplyImpact('amelia', 'pc', { value: 8, isRecovery: true }); s.updateCharacter('coc-j', 'amelia', { sheetData: { ...s.players[0].characters[0].sheetData, ...c.sheetData, echelle_de_sante: 0, modele_evolution: 'Héros', echelle_evolution: 20 } }); });
        await hero.getByLabel('Destination du bonus héroïque').selectOption('legende'); await hero.getByRole('button', { name: 'Confirmer l’avantage héroïque' }).click();
        await expect.poll(async () => (await perso()).sheetData?.echelle_evolution).toBe(19);
        await hero.getByRole('button', { name: 'Consommer l’action de mouvement' }).click();
        await expect(hero).toContainText('mouvement 0, attaque 1');
        await ouvrirLeModule(g, 'Combat-OS');
        await f.getByRole('button', { name: /Tour suivant/i }).first().click(); await f.getByRole('button', { name: /Tour suivant/i }).first().click();
        expect((await perso()).sheetData?.__cocAvantages).toMatchObject({ actifs: [{ destination: 'initiative' }] });
        await ouvrirLeModule(g, 'Tableau de Bord'); panneau = await ouvrirPj();
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.updateCharacter('coc-j', 'amelia', { sheetData: { ...s.players[0].characters[0].sheetData, modele_evolution: 'Blues', echelle_evolution: 7 } }); });
        const psych = panneau.locator('[data-psychisme-coc]'); await psych.locator('summary').first().click();
        await psych.getByLabel('Événement choquant').fill('L’apparition dans la verrière'); await psych.getByLabel('Rang de l’événement').selectOption('2');
        await hasard(f, .1, () => psych.getByRole('button', { name: 'Lancer VOL pour l’événement' }).click());
        await expect(psych.locator('[data-jet-choc-coc]')).toContainText('Échec critique');
        await psych.getByLabel('Nature du choc').selectOption('Enragé'); await psych.getByRole('button', { name: 'Confirmer les conséquences psychiques' }).click();
        expect((await perso()).sheetData?.echelle_evolution).toBe(7); expect((await perso()).sheetData?.modele_evolution).toBe('Blues');
        await psych.getByLabel('Séquelle psychique').selectOption('Fascination'); await psych.getByRole('button', { name: 'Confirmer la séquelle' }).click();
        await psych.screenshot({ path: path.join(sortie, 'jeu-coc-psychisme.jpg'), type: 'jpeg', quality: 85 });
        await f.waitForTimeout(800); await f.reload(); await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord'); panneau = await ouvrirPj();
        const psychRepris = panneau.locator('[data-psychisme-coc]'); await psychRepris.locator('summary').first().click();
        await expect(psychRepris).toContainText('2 rounds restants'); await expect(psychRepris).toContainText('Fascination');
        await psychRepris.getByRole('button', { name: 'Hors combat : un round de choc écoulé' }).click(); await psychRepris.getByRole('button', { name: 'Hors combat : un round de choc écoulé' }).click();
        await expect(psychRepris.locator('[data-choc-actif-coc]')).toHaveCount(0);
        await ongletDeLaFiche(f, 'Formulaire');
        await f.getByLabel('Voie 1 — nom', { exact: true }).fill('Voie de la furtivité');
        await f.getByTitle('Voie 1 — référence des capacités proposées', { exact: true }).getByRole('button').click();
        await f.getByRole('button', { name: 'furtivite', exact: true }).click();
        await f.getByRole('checkbox', { name: 'Voie 1, rang 1 — acquis', exact: true }).click();
        await f.getByRole('button', { name: 'Sauvegarder', exact: true }).first().click();
        await expect.poll(async () => (await perso()).sheetData?.voie1_reference).toBe('furtivite');
        await ongletDeLaFiche(f, 'Lancer un test'); panneau = f.locator('[data-panneau-de-jet]').first(); await panneau.locator('select').first().selectOption('agilite');
        const voies = panneau.locator('[data-voies-coc]'); await voies.locator('summary').first().click();
        await voies.getByLabel('Furtif', { exact: true }).check(); await expect(panneau.locator('[data-composition-coc]')).toContainText('+ 5 (Furtif (p. 36))');
        await voies.screenshot({ path: path.join(sortie, 'jeu-coc-voies.jpg'), type: 'jpeg', quality: 85 });
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore; s.setState(st => ({ sessions: st.sessions.map(se => ({ ...se, status: 'active' as const })) })); });
        navigateur = await chromium.launch({ channel: 'msedge', args: ['--mute-audio'] });
        const contexte = await navigateur.newContext({ viewport: { width: 768, height: 1180 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'fr-FR' });
        await contexte.route('**/*', route => { const u = new URL(route.request().url()); if (['blob:', 'data:'].includes(u.protocol)) return route.continue(); if (u.hostname !== '127.0.0.1') return route.abort(); if (u.port === String(PORT_FICHES_PAR_DEFAUT)) { u.port = String(g.ports.fiches); return route.continue({ url: u.href }); } return [String(g.ports.fiches), String(g.ports.sync)].includes(u.port) ? route.continue() : route.abort(); });
        await contexte.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 'recette-coc-a456'));
        const hub = await contexte.newPage(); hub.setDefaultTimeout(15_000);
        await hub.goto(`http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}`);
        await hub.getByRole('button', { name: /Amelia Steele/ }).click(); await expect(hub.getByText('Connecté', { exact: true })).toBeVisible();
        await hub.getByTitle('Fiche Personnage', { exact: true }).click(); await ongletDeLaFiche(hub, 'Lancer un test');
        const ph = hub.locator('[data-panneau-de-jet]').first(); await ph.locator('select').first().selectOption('agilite');
        const vh = ph.locator('[data-voies-coc]'); await vh.locator('summary').first().click(); await vh.getByLabel('Furtif', { exact: true }).check();
        await expect(ph.locator('[data-composition-coc]')).toContainText('+ 5 (Furtif (p. 36))');
        await hasard(hub, .5, () => ph.getByRole('button', { name: 'Lancer', exact: true }).click());
        await expect(vh.getByLabel('Furtif', { exact: true })).not.toBeChecked();
        await expect.poll(() => f.evaluate(() => JSON.stringify((window as unknown as Fenetre).useJournalStore.getState().journals))).toContain('Furtif');
        await vh.screenshot({ path: path.join(sortie, 'jeu-coc-voies-hub.jpg'), type: 'jpeg', quality: 85 });
        fs.writeFileSync(path.join(sortie, 'verification-electron.json'), JSON.stringify({ pilote: '2.2.0', remplacement21vers22SansPerte: true, defHeroiqueSansChangerJet: true, initiativePlateau17: true,
            dmInfliges15Plus5MoinsRd2Egale18: true, dmSubis15Moins5MoinsRd2Egale8: true, legendeEtActionsExpirees: true,
            chocRang2CritiqueEtFascinationPersistants: true, blues7Conserve: true, voieFormulaireHubJournal: true, profilJetable: true }, null, 2));
    } finally { await navigateur?.close(); await g.fermer(); }
});
