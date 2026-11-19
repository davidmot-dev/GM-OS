import { test, expect, type Locator } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useDiceStore } from '../src/stores/useDiceStore';

/**
 * **Combat-OS : le jet des adversaires et les dégâts** — chantier du 19/11/2026, registre § 263,
 * [spécification](../documentation/Planning/2026-11-19-combat-jets-des-adversaires-et-degats.md).
 *
 * Photographie, pour Blade Runner, Dune, Alien et Cthulhu Hack, la carte d'un adversaire qui vise
 * le PJ, puis « Calculer » ouvert depuis cette carte, et « Calculer » après un jet à réserve. Les
 * mêmes scènes servent à l'« avant » (T0) et à l'« après » (T19) : seul le dossier de sortie change.
 * Elles **relèvent** ce qu'elles voient dans `constats.json` au lieu d'échouer sur l'état d'avant.
 *
 * Instance jetable, campagne de démonstration, personnages fictifs : jamais les données de David.
 *
 *   npm run build
 *   GMOS_PILOTES_COMBAT=<dossier des 4 pilotes> GMOS_SORTIE_COMBAT=<dossier hors du dépôt> \
 *     npx playwright test e2e/combatDesAdversaires.spec.ts --reporter=list
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PILOTES = path.resolve(process.env.GMOS_PILOTES_COMBAT ?? path.join(ICI, '..', 'Export Dirvers'));
const SORTIE = path.resolve(process.env.GMOS_SORTIE_COMBAT ?? path.join(os.tmpdir(), 'gmos-combat-des-adversaires'));
const DEMO = path.join(ICI, 'donnees', 'campagne-de-demo.json');

interface Scene {
    corpusId: string;
    slug: string;
    pj: string;
    sheetData: Record<string, unknown>;
    /** Une créature du bestiaire du pilote, posée par l'onglet « Livre ». */
    creature?: string;
    /** Sinon, un adversaire posé à la main, comme le ferait le meneur. */
    adversaire?: { name: string; hp: number; sheetData: Record<string, unknown> };
}

const SCENES: Scene[] = [
    { corpusId: 'blade-runner', slug: 'blade-runner', pj: 'Rachel', creature: 'agent-du-lapd-en-uniforme',
        sheetData: { vigueur: 'C', agilite: 'B', intelligence: 'B', empathie: 'C', sante: 4, santeMax: 4, armesAFeu: 'C', protection: 'C' } },
    { corpusId: 'alien', slug: 'alien', pj: 'Vasquez', creature: 'rodeur',
        sheetData: { force: 4, agilite: 4, sante: 4, combat_a_distance: 3, niveau_de_stress: 1 } },
    { corpusId: 'dune', slug: 'dune', pj: 'Duncan', // PNJ mineur (livre p. 327) : une compétence à 6, deux à 5, et une seule valeur de principe (T18).
        adversaire: { name: 'Soldat Harkonnen', hp: 2, sheetData: { combat: 6, discipline: 5, mob: 5, domination: 6 } },
        sheetData: { combat: 6, discipline: 5, devotion: 5, justice: 4, determination: 2 } },
    // Le Garde du livre (p. 55) depuis le pilote 1.2.0 (§ 263, T15) ; le « Cultiste » d'avant n'était pas un profil du livre.
    { corpusId: 'cthulhu hack', slug: 'cthulhu-hack', pj: 'Harvey', creature: 'garde',
        sheetData: { force: 12, dexterite: 11, constitution: 10, hp: 9, materiel_1: 'D6', materiel_1_nom: 'Manteau de cuir', materiel_1_pa: 1 } },
];

interface Pilote { gameDriver: { id: string; name: string; corpusId?: string; templateId: string }; sheetTemplate?: { id: string } }

function lireLesPilotes(): Pilote[] {
    if (!fs.existsSync(PILOTES)) return [];
    return fs.readdirSync(PILOTES).filter(n => n.endsWith('.gmos-driver'))
        .map(n => JSON.parse(new AdmZip(path.join(PILOTES, n)).readAsText('state.json')) as Pilote);
}
const LUS = lireLesPilotes();
const JEUX = SCENES.map(s => ({ s, pilote: LUS.find(p => p.gameDriver.corpusId === s.corpusId) }))
    .filter((j): j is { s: Scene; pilote: Pilote } => !!j.pilote);

const campagneDe = (slug: string) => `demo-combat-${slug}`;
const pjDe = (slug: string) => `demo-pj-combat-${slug}`;
const JOUEUR = 'demo-joueur-combat';

function ecrireLaSemence(): string {
    const semence = JSON.parse(fs.readFileSync(DEMO, 'utf8'));
    const s = semence.modules.sessionOS;
    for (const { s: scene, pilote } of JEUX) {
        s.campaigns.push({ id: campagneDe(scene.slug), name: `Combat · ${pilote.gameDriver.name}`, system: pilote.gameDriver.id,
            description: 'Campagne fictive : le jet des adversaires.', activeLocationIds: [] });
        s.customGameDrivers.push(pilote.gameDriver);
        if (pilote.sheetTemplate) s.customSheetTemplates.push(pilote.sheetTemplate);
    }
    s.players.push({ id: JOUEUR, realName: 'Joueuse de démonstration', avatarUrl: '', isOnline: false,
        characters: JEUX.map(({ s: scene, pilote }) => ({ id: pjDe(scene.slug), name: scene.pj, portraitUrl: '',
            campaignId: campagneDe(scene.slug), templateId: pilote.gameDriver.templateId, systemId: pilote.gameDriver.id, sheetData: scene.sheetData })) });
    const chemin = path.join(os.tmpdir(), `gmos-semence-combat-${process.pid}.json`);
    fs.writeFileSync(chemin, JSON.stringify(semence));
    return chemin;
}

type Fenetre = { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useDiceStore: typeof useDiceStore };

let gmos: GmOsLance;
const constats: Record<string, Record<string, unknown>> = {};

test.describe.configure({ mode: 'serial' });
test.skip(JEUX.length === 0, `aucun des quatre pilotes dans « ${PILOTES} »`);

test.beforeAll(async () => {
    test.setTimeout(60_000);
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: ecrireLaSemence() });
    await attendreLHydratation(gmos);
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 900); });
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
});

test.afterAll(async () => {
    // Après les quatre scènes, la fermeture d'Electron a dépassé les 30 s par défaut (T19, 19/11).
    test.setTimeout(90_000);
    fs.writeFileSync(path.join(SORTIE, 'constats.json'), JSON.stringify(constats, null, 2));
    await gmos?.fermer();
});

async function photographier(cible: Locator, nom: string): Promise<void> {
    await gmos.fenetre.waitForTimeout(400);
    await cible.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), type: 'jpeg', quality: 82, animations: 'disabled', caret: 'hide', scale: 'css' });
}

/** Ce que le calculateur montre : les cibles cochées (leur nom) et le montant proposé. */
async function lireLeCalculateur(): Promise<{ cochees: string[]; montant: string }> {
    const f = gmos.fenetre;
    const titre = f.getByText(/^Cibles \(\d+\)$/);
    await expect(titre).toBeVisible({ timeout: 10_000 });
    const montant = await f.locator('input[type="number"].text-5xl').inputValue();
    // Les lignes sont des cases à cocher depuis le 19/11 (T1) ; avant, seule leur couleur le disait.
    const cochees = await f.locator('[role="checkbox"][aria-checked="true"]').count()
        ? await f.locator('[role="checkbox"][aria-checked="true"]').evaluateAll(l => l.map(e => e.getAttribute('aria-label') ?? ''))
        : await f.locator('div.cursor-pointer.bg-primary\\/10 span.text-sm').allTextContents();
    return { cochees, montant };
}

async function fermerLaSurcouche(): Promise<void> {
    await gmos.fenetre.keyboard.press('Escape');
    await gmos.fenetre.waitForTimeout(300);
}

for (const { s, pilote } of JEUX) {
    test(`${pilote.gameDriver.name}`, async () => {
        test.setTimeout(120_000);
        const f = gmos.fenetre;
        const constat: Record<string, unknown> = { pilote: `${pilote.gameDriver.name} ${(pilote.gameDriver as { version?: string }).version ?? ''}`.trim() };
        constats[s.slug] = constat;

        await ouvrirLeModule(gmos, 'Tableau de Bord');
        await f.evaluate(({ campagne }) => (window as unknown as Fenetre).useSessionOSStore.getState().setActiveCampaign(campagne), { campagne: campagneDe(s.slug) });
        await f.evaluate(({ id, nom }) => {
            const combat = (window as unknown as Fenetre).useCombatStore.getState();
            combat.clearCombatants();
            combat.addCombatant({ name: nom, init: 10, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: id });
        }, { id: pjDe(s.slug), nom: s.pj });
        await ouvrirLeModule(gmos, 'Combat-OS');

        if (s.creature) {
            await f.getByRole('button', { name: /Fabriquer des adversaires/i }).first().click();
            const atelier = f.locator('[data-atelier-des-adversaires]');
            await atelier.getByRole('button', { name: /^Livre/ }).click();
            const creature = atelier.locator(`[data-creature-du-livre="${s.creature}"]`);
            await creature.scrollIntoViewIfNeeded();
            await creature.getByRole('button', { name: /^Au combat/ }).click();
            if (await atelier.isVisible()) await fermerLaSurcouche();
        } else {
            await f.evaluate(a => (window as unknown as Fenetre).useCombatStore.getState().addCombatant({
                name: a.name, init: 8, isPlayer: false, faction: 'enemy', statuses: [], hp: a.hp, hpMax: a.hp, sheetData: a.sheetData,
            }), s.adversaire!);
        }

        // L'adversaire vise le PJ : c'est la scène du chantier.
        const adversaire = await f.evaluate(() => {
            const combat = (window as unknown as Fenetre).useCombatStore.getState();
            const a = combat.combatants.find(c => !c.isPlayer)!, pj = combat.combatants.find(c => c.isPlayer)!;
            combat.setTarget(a.id, pj.id);
            return { id: a.id, name: a.name, sheetData: a.sheetData ?? {}, notes: a.roleplayingNotes ?? '' };
        });
        constat.adversaire = adversaire;
        const carte = f.locator(`[data-combattant="${adversaire.id}"]`);
        await expect(carte).toBeVisible({ timeout: 15_000 });
        constat.boutonsDeLaCarte = (await carte.getByRole('button').allTextContents()).map(t => t.trim()).filter(Boolean);
        await photographier(carte, `${s.slug}-carte-adversaire`);

        // « Calculer » depuis la carte de l'adversaire qui vise le PJ.
        // Un jet classique d’abord (1d10 = 7) : le cas où « Dernier jet » a raison.
        await f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().setLastRoll({
            id: `jet-classique-${Date.now()}`, timestamp: new Date(), title: "Jet classique", formula: "1d10", rolls: [7], total: 7, totalDisplay: "7",
        } as never));
        // Dune n'a pas de points de vie : « Calculer » y est masqué (§ 263, David, 19/11/2026).
        if (s.corpusId === 'dune') {
            await expect(carte.getByRole('button', { name: 'CALCULER', exact: true })).toHaveCount(0);
            constat.calculerDepuisLaCarte = 'masqué pour Dune';
        } else {
            await carte.getByRole('button', { name: 'CALCULER', exact: true }).click();
            constat.calculerDepuisLaCarte = await lireLeCalculateur();
            await photographier(f.locator('[role="dialog"]').last().locator(':scope > div').first(), `${s.slug}-calculer`);
            await fermerLaSurcouche();
        }

        // « Calculer » juste après un jet à réserve à deux succès (Alien, Blade Runner).
        if (['alien', 'blade-runner'].includes(s.corpusId)) {
            await f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().setLastRoll({
                id: `jet-a-reserve-${Date.now()}`, timestamp: new Date(), title: 'Adversaire — Armes à feu', formula: 'réserve',
                rolls: [6, 6, 3, 1], total: 2, successes: 2, totalDisplay: '2 Succès', compte: 'reussites',
            } as never));
            await carte.getByRole('button', { name: 'CALCULER', exact: true }).click();
            constat.calculerApresUnJetAReserve = await lireLeCalculateur();
            await photographier(f.locator('[role="dialog"]').last().locator(':scope > div').first(), `${s.slug}-calculer-apres-reserve`);
            await fermerLaSurcouche();
        }

        // « Attaquer » (§ 263, T5 et T9) : quand le bouton paraît, la fenêtre s'ouvre sur le jet.
        const attaquer = carte.locator('[data-attaquer]');
        constat.attaquer = await attaquer.count() > 0;
        if (constat.attaquer) {
            await attaquer.click();
            await expect(f.locator('[data-ouvert-sur-le-jet]')).toBeVisible({ timeout: 10_000 });
            constat.cibleDeLAttaque = await f.locator('[data-cible-de-l-attaque]').textContent();
            // Alien (§ 263, T10) : une créature tire son attaque au D6.
            const tirer = f.getByRole('button', { name: /Tirer l’attaque/ });
            if (await tirer.count() > 0) {
                await tirer.click();
                await expect(f.locator('[data-attaque-tiree], [data-avis-de-l-attaque]').first()).toBeVisible({ timeout: 10_000 });
                constat.attaqueTiree = await f.locator('[data-attaque-tiree], [data-avis-de-l-attaque]').first().textContent();
                // T11 : « N dés de base » lus dans l'attaque — la réserve se lance, « Appliquer » paraît.
                const reserve = f.locator('[data-jet-de-l-attaque] button').first();
                if (await reserve.count() > 0) {
                    await reserve.click();
                    await expect(f.locator('[data-resultat-de-l-attaque]')).toBeVisible({ timeout: 10_000 });
                    constat.jetDeLAttaque = await f.locator('[data-resultat-de-l-attaque]').textContent();
                    constat.calculDuCoup = await f.locator('[data-calcul-du-coup]').textContent().catch(() => null);
                }
            }
            // Cthulhu Hack (§ 263, T16) : « Riposte » — dégâts fixes moins l'Armure du PJ, appliqués à sa fiche.
            if (await f.locator('[data-riposte]').count() > 0) {
                constat.riposteCalcul = await f.locator('[data-calcul-de-la-riposte]').textContent();
                const appliquer = f.locator('[data-riposte]').getByRole('button', { name: /^Appliquer/ });
                if (await appliquer.count() > 0) {
                    await appliquer.click();
                    await expect(f.locator('[data-riposte-appliquee]')).toBeVisible({ timeout: 10_000 });
                    constat.riposteAppliquee = await f.locator('[data-riposte-appliquee]').textContent();
                    constat.pvDuPjApres = await f.evaluate(() => {
                        const s = (window as unknown as Fenetre).useSessionOSStore.getState();
                        const pj = (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.isPlayer)!;
                        return s.players.flatMap(p => p.characters).find(c => c.id === pj.sourcePlayerId)?.sheetData?.hp;
                    });
                }
                // T19 : la riposte, et pas le bas de la fiche, dans la capture.
                await f.locator('[data-riposte]').scrollIntoViewIfNeeded();
            }
            // Dune (§ 263, T18) : Combat + principe proposé ; un test réussi ouvre l'attaque Dune sur la cible.
            if (s.corpusId === 'dune') {
                const d = f.locator('[role="dialog"]').last();
                constat.attaqueProposee = await d.locator('[data-attaque-par-defaut]').textContent().catch(() => null);
                constat.pnjEnnemiCoche = await d.getByLabel(/PNJ ennemi/).isChecked();
                // Deux d20 sous 12 : une chance sur six d'échouer. Un échec se clôt et se relance.
                for (let essai = 0; essai < 4; essai++) {
                    await d.getByText('Lancer', { exact: true }).click();
                    await expect(d.locator('[data-suites-dune]')).toBeVisible({ timeout: 10_000 });
                    if (await d.locator('[data-attaque-dune]').count() > 0) break;
                    await d.getByRole('button', { name: 'Terminer le test et conserver le reliquat' }).click();
                }
                const cible = d.getByLabel('Cible de l’attaque Dune');
                constat.cibleDeLAttaqueDune = await cible.count() > 0
                    ? await cible.locator('option:checked').textContent() : 'test raté quatre fois';
                constat.appliquerALaCibleDune = await d.locator('[data-appliquer-a-la-cible]').count();
                if (await cible.count() > 0) await d.locator('[data-attaque-dune]').scrollIntoViewIfNeeded();
            }
            await photographier(f.locator('[role="dialog"]').last().locator(':scope > div').first(), `${s.slug}-attaquer`);
            await fermerLaSurcouche();
        }

        // Cthulhu Hack (§ 263, T17) : un coup de 6 d'un investigateur sur le Garde (1 PA) lui retire 5 PV.
        if (s.corpusId === 'cthulhu hack') {
            constat.armureDuGarde = await f.evaluate(id => {
                const combat = (window as unknown as Fenetre).useCombatStore.getState();
                const avant = combat.combatants.find(c => c.id === id)!.hp;
                combat.applyDamage(6, '', [id]);
                const apres = (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.id === id)!.hp;
                return { avant, apres };
            }, adversaire.id);
        }
        constat.santeDeLaCarte = (await carte.locator('[title^="Points de Vie"], [title^="PV"]').first().getAttribute('title').catch(() => null));

        // La fenêtre « Fiche » de l'adversaire : y a-t-il un jet ?
        await carte.getByRole('button', { name: 'Fiche', exact: true }).click();
        await expect(f.getByText('Fiche du combattant').first()).toBeVisible({ timeout: 10_000 });
        constat.jetDansLaFiche = await f.locator('[data-jet-du-combattant]').count() > 0;
        await photographier(f.locator('[role="dialog"]').last().locator(':scope > div').first(), `${s.slug}-fiche-adversaire`);
        await fermerLaSurcouche();

        /*
          Alien (§ 263, T12) : un humain armé — un garde fabriqué, ses armes sur sa fiche (champs du
          pilote 1.11.0) — attaque le PJ : jet prérempli, arme choisie, coup préparé sur la cible.
        */
        if (s.corpusId === 'alien') {
            const garde = await f.evaluate(() => {
                const combat = (window as unknown as Fenetre).useCombatStore.getState();
                combat.addCombatant({ name: 'Garde Weyland-Yutani', init: 7, isPlayer: false, faction: 'enemy', statuses: [], sheetData: {
                    force: 3, agilite: 3, esprit: 2, empathie: 2, combat_a_distance: 2, combat_rapproche: 1, sante: 3, niveau_de_stress: 0,
                    'field-1786783108730': 'Pistolet M4A3', armes_bonus: '+2', armes_degats: '2', armes_portees: 'Moyenne', armes_proprietes: '',
                } });
                const apres = (window as unknown as Fenetre).useCombatStore.getState();
                const g = apres.combatants.find(c => c.name === 'Garde Weyland-Yutani')!, pj = apres.combatants.find(c => c.isPlayer)!;
                apres.setTarget(g.id, pj.id);
                return g.id;
            });
            const carteDuGarde = f.locator(`[data-combattant="${garde}"]`);
            await expect(carteDuGarde).toBeVisible({ timeout: 15_000 });
            constat.humainAttaquer = await carteDuGarde.locator('[data-attaquer]').count() > 0;
            if (constat.humainAttaquer) {
                await carteDuGarde.locator('[data-attaquer]').click();
                await expect(f.locator('[data-ouvert-sur-le-jet]')).toBeVisible({ timeout: 10_000 });
                constat.humainAttaqueProposee = await f.locator('[data-attaque-par-defaut]').textContent().catch(() => null);
                await f.getByRole('button', { name: 'Lancer', exact: true }).click();
                await expect(f.locator('[data-appliquer-a-la-cible]')).toBeVisible({ timeout: 10_000 });
                constat.humainCalcul = await f.locator('[data-calcul-du-coup]').textContent();
                // Dans le bloc « Appliquer » : la carte de la cible porte aussi un « Préparer ce coup » (SanteAlien).
                const preparer = f.locator('[data-appliquer-a-la-cible]').getByRole('button', { name: /Préparer ce coup/ });
                if (await preparer.count() > 0 && await preparer.isEnabled()) {
                    await preparer.click();
                    await expect(f.locator('[data-coup-prepare], [data-refus-du-coup]').first()).toBeVisible({ timeout: 10_000 });
                    constat.humainCoup = await f.locator('[data-coup-prepare], [data-refus-du-coup]').first().textContent();
                    await f.locator('[data-coup-prepare], [data-refus-du-coup]').first().scrollIntoViewIfNeeded();
                }
                await photographier(f.locator('[role="dialog"]').last().locator(':scope > div').first(), `${s.slug}-humain-attaquer`);
                await fermerLaSurcouche();
            }
        }
    });
}
