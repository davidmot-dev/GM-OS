import { test, expect, type Locator } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
import type { CurrentView } from '../src/types/campaign.types';

/**
 * **Les captures du manuel des jeux** — demandé par David le 2026-10-13 : *« un
 * manuel utilisateur avec les différentes options propres à certains drivers
 * (Cabale, Fiel… pour NOC), Impulsion, Menace dans Dune ou Star Trek »*.
 *
 * ⛔ **Les pilotes de David n'entrent jamais dans le dépôt.** Ils sont lus là où
 * il les exporte (`Export Dirvers/`, ou `GMOS_PILOTES_DES_JEUX`), chargés dans
 * une instance JETABLE avec des campagnes et des personnages **fictifs**, et
 * seules les images sortent. Sans pilote exporté, le scénario s'arrête : il n'y
 * a rien d'honnête à photographier.
 *
 * Régénérer, après un pilote nouveau ou amélioré (construction à jour d'abord) :
 *
 *   npm run build
 *   npx playwright test e2e/capturesDesJeux.spec.ts
 *
 * Les images vont dans `documentation/User Guides/captures/` (préfixe `jeu-`), en JPEG,
 * à côté de celles des autres guides : l'aide intégrée les résout depuis là.
 *
 * LCARS (16/10) : les captures du module dans le vrai Hub sont produites par
 * `e2e/modulesDuJeuStarTrek.spec.ts`, sur son pilote fictif et deux navigateurs.
 * Elles sortent dans `scratch/lcars-natif/jeu-star-trek-lcars-*.jpg`, puis sont
 * relues et copiées dans le manuel. Ce parcours ne lit aucun pilote personnel.
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PILOTES = path.resolve(process.env.GMOS_PILOTES_DES_JEUX ?? path.join(ICI, '..', 'Export Dirvers'));
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CAPTURES_JEUX
    ?? path.join(ICI, '..', 'documentation', 'User Guides', 'captures'));
const DEMO = path.join(ICI, 'donnees', 'campagne-de-demo.json');

/** Ce qu'on met en scène pour un jeu — un personnage fictif, ce qu'il retient au jet. */
interface MiseEnScene {
    /** Le dossier du corpus, qui identifie le jeu quel que soit l'identifiant du pilote. */
    corpusId: string;
    slug: string;
    personnage: string;
    sheetData: Record<string, unknown>;
    /** Le champ retenu pour chaque composante du jet, dans l'ordre du panneau. */
    composantes?: string[];
    /** Les valeurs des réserves de table, pour un bandeau qui raconte une partie. */
    reserves?: Record<string, number>;
    /** Dés achetés avant le lancer (Dune, Star Trek). */
    desAchetes?: number;
    /** La feuille du groupe, et ce qu'on y puise. */
    groupe?: Record<string, unknown>;
    puiser?: string[];
    /** Des cases de santé déjà cochées, pour une carte de combattant qui raconte un combat. */
    casesCochees?: number;
    /** Un coup porté avant la photo — un total de dommages, que la règle du jeu traduit (Torg). */
    coup?: number;
    /** La carte d'Action que le round retourne (Torg) — un Vilain entre en combat face au PJ. */
    paquetDAction?: Record<string, unknown>;
    /**
     * Les scènes propres à un jeu, jouées après les communes — les gestes des
     * Héros de NOC, la Fortune de Cthulhu Hack, le Brisé de Blade Runner
     * (2026-10-16). Chacune ne photographie que ce que le pilote déclare.
     */
    scenes?: (c: ContexteDeScene) => Promise<void>;
}

/** Ce qu'une scène propre à un jeu reçoit pour jouer. */
interface ContexteDeScene { pilote: Pilote; campagne: string; personnage: string; nom: string }

const MISES_EN_SCENE: MiseEnScene[] = [
    {
        corpusId: 'noc', slug: 'noc', personnage: 'Ilya Vorn',
        sheetData: { combat: 2, action: 3, vie: 2, vecu: 2, espoir: 1, singularite: 1, trauma: 2, extase: 1, ferveur: 2, folie: 1, fatigue: true, soupcon: 6 },
        scenes: c => scenesDeNoc(c),
        composantes: ['combat', 'action'],
        reserves: { Fiel: 3, Menace: 2 },
        groupe: {
            'identity.name': 'Cellule du Quai Gris', 'domains.action': 3, 'domains.life': 2,
            'tracks.espoir': 4, 'tracks.vecu': 2, 'assets.action.armory': 2, 'assets.erudition.library': 1,
        },
        puiser: ['Espoir', 'Singularité', 'Dés de la Cabale', 'Dés de la Cabale'],
        casesCochees: 6,
    },
    {
        corpusId: 'dune', slug: 'dune', personnage: 'Irulan Vaeth',
        sheetData: { combat: 6, discipline: 5, devotion: 5, justice: 4, determination: 2 },
        composantes: ['combat', 'devotion'],
        reserves: { impulsion: 1, menace: 4 },
        desAchetes: 2,
    },
    {
        corpusId: 'star-trek', slug: 'star-trek', personnage: 'Enseigne T’Vael',
        sheetData: { audace: 10, securite: 3, raison: 9, science: 4 },
        composantes: ['audace', 'securite'],
        reserves: { impulsion: 2, menace: 5 },
        desAchetes: 1,
    },
    {
        corpusId: 'alien', slug: 'alien', personnage: 'Dana Okoro',
        sheetData: { force: 4, combat_rapproche: 2, niveau_de_stress: 2, points_de_recit: 1 },
        composantes: ['force', 'combat_rapproche', 'niveau_de_stress'],
        scenes: c => scenesDAlien(c),
    },
    {
        corpusId: 'blade-runner', slug: 'blade-runner', personnage: 'Agent Kessler',
        sheetData: {
            vigueur: 'B', corpsACorps: 'C', sante: 8, santeMax: 8, sangFroid: 6, sangFroidMax: 6, empathie: 'B (D10)', nature: 'Humain',
            protectionNom: 'Gilet pare-balles dissimulé', protection: 'C (D8)', pointsHumanite: 3,
        },
        composantes: ['vigueur', 'corpsACorps'],
        scenes: c => scenesDeBladeRunner(c),
    },
    {
        // Nephilim Légende (2026-10-17) : le Vécu passé « Templier » 4 avec l'approche du Feu 5 → 90 %.
        corpusId: 'nephilim', slug: 'nephilim', personnage: 'Aurore Delisle',
        sheetData: {
            identity_name: 'Aurore Delisle', identity_metamorph: 'Ailes de braise', identity_metamorph_degree: 3,
            ka_fire: 5, ka_air: 3, ka_water: 4, ka_earth: 6, ka_moon: 2,
            simulacrum_name: 'Claire Moreau', simulacrum_ka: 3, simulacrum_experience: 'Infirmière', simulacrum_experience_degree: 5,
            pastlives_0_name: 'Templier', pastlives_0_degree: 4, pastlives_1_name: 'Alchimiste de Prague', pastlives_1_degree: 3,
            falls_khaiba: 2, falls_shadow: 1, falls_narcosis: 0, resources_sapience: 7, stasis_degree: 3,
        },
        composantes: ['pastlives_0_degree', 'ka_fire'],
        reserves: { seuilRK: 4, jaugeDeTraque: 3, intensiteDeTraque: 2 },
        casesCochees: 4,
    },
    {
        corpusId: 'cthulhu hack', slug: 'cthulhu-hack', personnage: 'Edith Marsh',
        sheetData: { force: 13, sagesse: 15, hp: 9, torche: 'd8', bagou: 'd6', mentalHealth: 'd10', richesse: 'd4', fortune: 0, materiel_1_nom: 'Lampe-torche', materiel_1: 'd8' },
        composantes: ['sagesse'],
        scenes: c => scenesDeCthulhuHack(c),
    },
    {
        corpusId: 'reves de dragons', slug: 'reves-de-dragons', personnage: 'Aldaran le Voyageur',
        sheetData: { force: 12, agilite: 13, discretion: 2, vie: 12 },
        composantes: ['agilite', 'discretion'],
    },
    {
        corpusId: 'torg', slug: 'torg', personnage: 'Mara Quill',
        sheetData: { dexterite: 9, esquive: 2, choc: 3, possibilites: 3, esprit: 9, realite: 2, resistance: 10 },
        composantes: ['dexterite', 'esquive'],
        casesCochees: 1,
        coup: 17,
        paquetDAction: {
            standard: { premier: 'H', heros: ['inspiration'], vilains: ['destabilises'] },
            dramatique: { premier: 'V', vilains: ['vivacite'], heros: ['fatigues'] },
            approuvees: ['provocation'],
        },
        scenes: c => scenesDeTorg(c),
    },
];

interface Seuil { aPartirDe: number; label: string; etat?: string }
interface Pilote {
    gameDriver: {
        id: string; name: string; corpusId?: string; templateId: string; ressourcesDeTable?: unknown[]; ficheDeGroupe?: unknown;
        combat?: { casesDeSante?: { nombre: number; seuils?: Seuil[]; libelle?: string; champ?: string }; initiative?: { mode?: string } };
    };
    sheetTemplate?: { id: string };
}

/**
 * La santé en cases d'un personnage fictif, déjà entamée — la forme que
 * `HealthInterpreter` écrit pour un jeu qui déclare ses cases (NOC).
 */
function santeEnCases(cases: NonNullable<NonNullable<Pilote['gameDriver']['combat']>['casesDeSante']>, cochees: number) {
    const seuils = [...(cases.seuils ?? [])].sort((a, b) => a.aPartirDe - b.aPartirDe);
    const atteint = seuils.filter(s => cochees >= s.aPartirDe).pop();
    return {
        type: 'boxes',
        data: {
            boxes: Array.from({ length: cases.nombre }, (_, i) => ({
                label: seuils.filter(s => i + 1 >= s.aPartirDe).pop()?.label ?? '', filled: i < cochees,
            })),
            seuils, libelle: cases.libelle, champ: cases.champ,
        },
        state: atteint?.etat ?? (cochees > 0 ? 'scratched' : 'healthy'),
        badges: [],
    };
}

function lireLesPilotes(): Pilote[] {
    if (!fs.existsSync(PILOTES)) return [];
    return fs.readdirSync(PILOTES)
        .filter(n => n.endsWith('.gmos-driver'))
        .map(n => JSON.parse(new AdmZip(path.join(PILOTES, n)).readAsText('state.json')) as Pilote);
}

const PILOTES_LUS = lireLesPilotes();
const JEUX = MISES_EN_SCENE
    .map(m => ({ mise: m, pilote: PILOTES_LUS.find(p => p.gameDriver.corpusId === m.corpusId) }))
    .filter((j): j is { mise: MiseEnScene; pilote: Pilote } => !!j.pilote);

const campagneDe = (slug: string) => `demo-jeu-${slug}`;
const personnageDe = (slug: string) => `demo-pj-${slug}`;
const JOUEUR = 'demo-joueur-des-jeux';

/** La semence : la campagne de démonstration, plus une campagne fictive par jeu. */
function ecrireLaSemence(): string {
    const semence = JSON.parse(fs.readFileSync(DEMO, 'utf8'));
    const s = semence.modules.sessionOS;
    for (const { mise, pilote } of JEUX) {
        s.campaigns.push({
            id: campagneDe(mise.slug), name: `Démo · ${pilote.gameDriver.name}`, system: pilote.gameDriver.id,
            description: 'Campagne fictive du manuel des jeux.', activeLocationIds: [],
            ...(mise.groupe ? { groupe: { sheetData: mise.groupe } } : {}),
        });
        s.customGameDrivers.push(pilote.gameDriver);
        if (pilote.sheetTemplate) s.customSheetTemplates.push(pilote.sheetTemplate);
    }
    s.players.push({
        id: JOUEUR, realName: 'Joueuse de démonstration', avatarUrl: '', isOnline: false,
        characters: JEUX.map(({ mise, pilote }) => {
            const cases = pilote.gameDriver.combat?.casesDeSante;
            const avecCases = cases && mise.casesCochees !== undefined;
            return {
                id: personnageDe(mise.slug), name: mise.personnage, portraitUrl: '',
                campaignId: campagneDe(mise.slug), templateId: pilote.gameDriver.templateId,
                systemId: pilote.gameDriver.id,
                sheetData: avecCases && cases.champ ? { ...mise.sheetData, [cases.champ]: mise.casesCochees } : mise.sheetData,
                ...(avecCases ? { healthSystem: santeEnCases(cases, mise.casesCochees!) } : {}),
            };
        }),
    });
    const chemin = path.join(os.tmpdir(), `gmos-semence-des-jeux-${process.pid}.json`);
    fs.writeFileSync(chemin, JSON.stringify(semence));
    return chemin;
}

type Fenetre = {
    useSessionOSStore: typeof useSessionOSStore;
    useRessourcesDeTableStore: typeof useRessourcesDeTableStore;
    useCombatStore: typeof useCombatStore;
    useDiceStore: typeof useDiceStore;
};

let gmos: GmOsLance;

test.describe.configure({ mode: 'serial' });
test.skip(JEUX.length === 0, `aucun pilote exporté dans « ${PILOTES} » — rien d'honnête à photographier`);

test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({
        semence: ecrireLaSemence(),
        /*
          L'instance jetable part d'un corpus VIDE : sans les correspondances, la
          Cabale s'afficherait « sans correspondance ». On y copie, pour chaque
          jeu photographié, sa table (`fiche/`) et sa peau (`theme/`) — jamais
          ses règles, que rien ici ne lit.
        */
        preparerLeProfil: profil => {
            for (const { mise } of JEUX) {
                for (const dossier of ['fiche', 'theme']) {
                    const source = path.join(ICI, '..', 'docs', 'systems', mise.corpusId, dossier);
                    if (fs.existsSync(source)) {
                        fs.cpSync(source, path.join(profil, 'corpus', 'systems', mise.corpusId, dossier), { recursive: true });
                    }
                }
            }
        },
    });
    await attendreLHydratation(gmos);
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 900); });
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

async function photographier(cible: Locator, nom: string): Promise<void> {
    await gmos.fenetre.waitForTimeout(500);
    await cible.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), type: 'jpeg', quality: 82, animations: 'disabled', caret: 'hide' });
}

async function vue(campagne: string, v: CurrentView, selection?: { joueur: string; personnage: string }): Promise<void> {
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await gmos.fenetre.evaluate(({ campagne, v, selection }) => {
        const s = (window as unknown as Fenetre).useSessionOSStore.getState();
        s.setActiveCampaign(campagne);
        if (selection) { s.setSelectedPlayer(selection.joueur); s.setSelectedCharacter(selection.personnage); }
        s.setCurrentView(v);
    }, { campagne, v, selection });
}

for (const { mise, pilote } of JEUX) {
    test(`${pilote.gameDriver.name}`, async () => {
        const f = gmos.fenetre;
        const campagne = campagneDe(mise.slug);

        if (mise.reserves) {
            await f.evaluate(({ campagne, reserves }) => {
                (window as unknown as Fenetre).useRessourcesDeTableStore.setState(s => ({
                    reserves: { ...s.reserves, [campagne]: reserves },
                }));
            }, { campagne, reserves: mise.reserves });
        }

        // Le bandeau des réserves, en tête du cockpit.
        await vue(campagne, 'cockpit');
        if ((pilote.gameDriver.ressourcesDeTable?.length ?? 0) > 0) {
            await photographier(f.locator('[data-bandeau-des-reserves]').first(), `jeu-${mise.slug}-reserves`);
        }

        // La carte de campagne et sa porte vers la fiche du groupe.
        if (pilote.gameDriver.ficheDeGroupe) {
            const porte = f.getByRole('button', { name: /Fiche du groupe/ });
            await expect(porte).toBeVisible();
            await photographier(f.locator('div.glass-bento', { has: porte }).first(), `jeu-${mise.slug}-carte-de-campagne`);
        }

        // La sélection des modules d'Alien, depuis le pilote réellement importé.
        if (mise.corpusId === 'alien') {
            await f.evaluate(campagne => {
                const s = (window as unknown as Fenetre).useSessionOSStore.getState();
                const systeme = s.campaigns.find(c => c.id === campagne)?.system;
                if (!systeme) throw new Error('Pilote Alien de capture absent.');
                s.setEditingDriverId(systeme);
                s.setCurrentView('driver-editor');
            }, campagne);
            await f.getByRole('button', { name: /Modules du jeu/ }).click();
            const modules = f.getByRole('region', { name: 'Modules du jeu', exact: true });
            await expect(modules).toBeVisible();
            await expect(modules.getByRole('checkbox')).toHaveCount(2);
            await photographier(modules, 'jeu-alien-modules');
            await vue(campagne, 'modules-du-jeu');
            await expect(f.locator('[data-hub-consultation="modules-du-jeu-mj"]')).toBeVisible();
            await f.locator('article').filter({ has: f.getByRole('heading', { name: 'MU/TH/UR 6000', exact: true }) }).getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            await expect(f.getByRole('heading', { name: 'MU/TH/UR · Poste meneur', exact: true })).toBeVisible();
            const fenetreDuPupitre = await gmos.application.browserWindow(f);
            await fenetreDuPupitre.evaluate(w => w.setContentSize(1440, 2200));
            await photographier(f.locator('.gmos-muthur'), 'jeu-alien-pupitre-module');
            await f.locator('article').filter({ has: f.getByRole('heading', { name: 'Détecteur de mouvement', exact: true }) }).getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            await expect(f.locator('.gmos-detecteur')).toBeVisible();
            await f.getByRole('button', { name: 'Démarrer le scan', exact: true }).click();
            await expect(f.getByRole('button', { name: 'Arrêter le scan', exact: true })).toBeVisible();
            await photographier(f.locator('.gmos-detecteur'), 'jeu-alien-detecteur-mj');
            await f.getByRole('button', { name: 'Tout couper', exact: true }).click();
            await fenetreDuPupitre.evaluate(w => w.setContentSize(1440, 900));
        }

        // Le panneau de jet de la fiche, composantes retenues.
        if (!mise.composantes) return;
        await vue(campagne, 'players', { joueur: JOUEUR, personnage: personnageDe(mise.slug) });
        const panneau = f.locator('[data-panneau-de-jet]').first();
        await expect(panneau).toBeVisible({ timeout: 15_000 });
        for (const [i, champ] of mise.composantes.entries()) {
            await panneau.locator('select').nth(i).selectOption(champ);
        }
        for (let i = 0; i < (mise.desAchetes ?? 0); i++) {
            await panneau.locator('div', { has: f.getByText('Dés', { exact: true }) }).last().locator('button').nth(1).click();
        }
        for (const apport of mise.puiser ?? []) {
            await panneau.getByRole('button', { name: `Un point de plus : ${apport}`, exact: true }).click();
        }
        // Un panneau plus haut que la fenêtre se photographierait coupé : on l'agrandit le temps des deux prises.
        const fenetre = await gmos.application.browserWindow(f);
        await fenetre.evaluate(w => w.setContentSize(1440, 1800));
        await photographier(panneau, `jeu-${mise.slug}-jet`);

        await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
        await photographier(panneau, `jeu-${mise.slug}-jet-lance`);
        await fenetre.evaluate(w => w.setContentSize(1440, 900));

        // La fiche du groupe — la Cabale, commune à toute la table.
        if (pilote.gameDriver.ficheDeGroupe) {
            await vue(campagne, 'group-sheet');
            // La table se lit d'abord : sans elle, le bouton de création reste grisé.
            const creer = f.getByRole('button', { name: /Créer une fiche pour/ });
            await expect(creer).toBeEnabled({ timeout: 15_000 });
            await creer.click();
            // Le moteur pèse sept mégaoctets : on attend que la liaison disparaisse.
            await expect(f.getByText(/À quelle fiche relier/)).toHaveCount(0, { timeout: 30_000 });
            await f.waitForTimeout(2_000);
            await photographier(f.locator('body'), `jeu-${mise.slug}-fiche-du-groupe`);
        }

        // La santé en cases, sur la carte de combattant — le PJ entre en combat.
        if (mise.casesCochees !== undefined && pilote.gameDriver.combat?.casesDeSante) {
            await f.evaluate(({ id, nom }) => {
                const combat = (window as unknown as Fenetre).useCombatStore.getState();
                combat.clearCombatants();
                combat.addCombatant({ name: nom, init: 0, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: id });
            }, { id: personnageDe(mise.slug), nom: mise.personnage });
            if (mise.coup !== undefined) {
                await f.evaluate(({ id, coup }) => {
                    (window as unknown as Fenetre).useSessionOSStore.getState().handleApplyImpact(id, 'pc', { value: coup, type: 'physique' });
                }, { id: personnageDe(mise.slug), coup: mise.coup });
            }
            await ouvrirLeModule(gmos, 'Combat-OS');
            const carte = f.locator('[data-combattant]').first();
            await expect(carte).toBeVisible({ timeout: 15_000 });
            await photographier(carte, `jeu-${mise.slug}-sante`);
        }

        // Le Paquet d'Action : une carte décrite, un Vilain en face, la première carte retournée.
        if (mise.paquetDAction && pilote.gameDriver.combat?.initiative?.mode === 'paquet') {
            const systeme = await f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().campaigns.find(c => c.id === id)?.system ?? '', campagne);
            await f.evaluate(({ systeme, carte }) => {
                const w = window as unknown as Fenetre;
                w.useSessionOSStore.setState(st => ({
                    decks: [...st.decks.filter(d => d.id !== 'capture-action'), {
                        id: 'capture-action', name: 'Paquet d’Action', systemId: systeme, folderPath: 'decks/torg/action',
                        cardCount: 66, format: 'poker', orientation: 'portrait', useDiscard: true, role: 'action',
                        cardMetadata: { 12: { name: 'Carte n° 12', action: carte as never } },
                    }],
                    deckStates: { ...st.deckStates, 'capture-action': { deckId: 'capture-action', remainingIndices: [12], discardedIndices: [], currentCardIndex: null } },
                }));
                w.useCombatStore.getState().addCombatant({ name: 'Gospog', init: 0, isPlayer: false, faction: 'enemy', statuses: [] });
            }, { systeme, carte: mise.paquetDAction });
            const paquet = f.locator('[data-paquet-d-action]').first();
            await expect(paquet).toBeVisible({ timeout: 15_000 });
            await paquet.getByRole('button', { name: 'Retourner la première carte d’Action' }).click();
            await expect(paquet.locator('[data-qui-commence]')).toBeVisible();
            // Les notifications du coup et de la pioche passent par-dessus : on les laisse s'éteindre (3 s).
            await f.waitForTimeout(3_500);
            await photographier(paquet, `jeu-${mise.slug}-paquet-d-action`);

            // Les Cartes du Destin : un Paquet du Destin, une main dont une carte en Réserve.
            const perso = personnageDe(mise.slug);
            await f.evaluate(({ systeme, perso }) => {
                const w = window as unknown as Fenetre;
                w.useSessionOSStore.setState(st => ({
                    decks: [...st.decks.filter(d => d.id !== 'capture-destin'), {
                        id: 'capture-destin', name: 'Paquet du Destin', systemId: systeme, folderPath: 'decks/torg/destin',
                        cardCount: 40, format: 'poker', orientation: 'portrait', useDiscard: true, role: 'destin',
                        cardMetadata: { 3: { name: 'Coup de grâce' }, 5: { name: 'Seconde chance' }, 8: { name: 'Héroïsme' } },
                    }],
                    deckStates: { ...st.deckStates, 'capture-destin': {
                        deckId: 'capture-destin', remainingIndices: [1, 2, 4, 6, 7, 9, 10], discardedIndices: [], currentCardIndex: null,
                        enMain: [
                            { index: 3, porteur: perso, face: 'revelee' },
                            { index: 5, porteur: perso, face: 'revelee', enReserve: true },
                            { index: 8, porteur: perso, face: 'revelee' },
                        ],
                    } },
                }));
            }, { systeme, perso });
            const carteDuHeros = f.locator('[data-combattant]').first();
            await expect(carteDuHeros.locator('[data-actions-approuvees]')).toBeVisible({ timeout: 15_000 });
            await photographier(carteDuHeros, `jeu-${mise.slug}-action-approuvee`);

            await vue(campagne, 'deck-player');
            await f.getByRole('button', { name: 'Paquet du Destin', exact: true }).click();
            await expect(f.locator('[data-gestes-du-destin]')).toBeVisible({ timeout: 15_000 });
            await f.waitForTimeout(3_500);
            await photographier(f.locator('body'), `jeu-${mise.slug}-destin`);
        }

        // Les scènes propres au jeu.
        await mise.scenes?.({ pilote, campagne, personnage: personnageDe(mise.slug), nom: mise.personnage });
    });
}

// ---- Les scènes propres à un jeu — 2026-10-16 ------------------------------

/** Le PJ seul en combat ; `coup` le fait tomber avant la photo. */
async function entrerEnCombat(c: ContexteDeScene, coup?: number): Promise<Locator> {
    const f = gmos.fenetre;
    await f.evaluate(({ id, nom, coup }) => {
        const w = window as unknown as Fenetre;
        const combat = w.useCombatStore.getState();
        combat.clearCombatants();
        combat.addCombatant({ name: nom, init: 0, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: id });
        if (coup !== undefined) w.useSessionOSStore.getState().handleApplyImpact(id, 'pc', { value: coup, type: 'physique' });
    }, { id: c.personnage, nom: c.nom, coup });
    await ouvrirLeModule(gmos, 'Combat-OS');
    const carte = gmos.fenetre.locator('[data-combattant]').first();
    await expect(carte).toBeVisible({ timeout: 15_000 });
    return carte;
}

/** Un jet posé dans l'historique du pupitre, puis le pupitre ouvert. */
async function jetAuPupitre(jet: Record<string, unknown>): Promise<void> {
    await gmos.fenetre.evaluate(jet => {
        (window as unknown as Fenetre).useDiceStore.getState().setLastRoll({ ...jet, timestamp: new Date() } as never);
    }, jet);
    await ouvrirLeModule(gmos, 'Dice-OS');
}

/** Le panneau « Dernier jet » du pupitre qui contient cet élément — sans l'historique dessous. */
function panneauDuDernierJet(dedans: Locator): Locator {
    // Le premier ancêtre qui porte le titre « Dernier jet » : le panneau, et lui seul.
    return dedans.locator("xpath=ancestor::*[contains(translate(normalize-space(.), 'DERNIJT', 'dernijt'), 'dernier jet')][1]");
}

/** Un champ de la fiche du PJ, écrit comme le ferait le meneur. */
async function ecrireLaFiche(c: ContexteDeScene, maj: Record<string, unknown>): Promise<void> {
    await gmos.fenetre.evaluate(({ id, maj }) => {
        const s = (window as unknown as Fenetre).useSessionOSStore.getState();
        const joueur = s.players.find(p => p.characters.some(ch => ch.id === id))!;
        for (const [champ, valeur] of Object.entries(maj)) s.updateCharacterSheetData(joueur.id, id, champ, valeur as never);
    }, { id: c.personnage, maj });
}

/** NOC : le moment de calme, les effets du Fiel, le jet d'un Rouage au pupitre. */
async function scenesDeNoc(c: ContexteDeScene): Promise<void> {
    if (!(c.pilote.gameDriver as { gestesDesHeros?: unknown }).gestesDesHeros) return;
    const f = gmos.fenetre;
    await vue(c.campagne, 'cockpit');
    await f.getByRole('button', { name: /Moment de calme/ }).click();
    const calme = f.locator('[data-gestes-des-heros="calme"]');
    await expect(calme).toBeVisible();
    await photographier(calme, 'jeu-noc-moment-de-calme');
    await calme.getByRole('button', { name: 'Annuler', exact: true }).click();

    await f.getByRole('button', { name: /Effets du Fiel/ }).click();
    const fiel = f.locator('[data-gestes-des-heros="debordement"]');
    await expect(fiel).toBeVisible();
    await fiel.getByRole('button', { name: 'Une fois de plus : Tension', exact: true }).click();
    await fiel.getByRole('button', { name: 'Une fois de plus : Fatigue', exact: true }).click();
    await photographier(fiel, 'jeu-noc-effets-du-fiel');
    await fiel.getByRole('button', { name: 'Annuler', exact: true }).click();

    await jetAuPupitre({
        id: 'capture-rouage', title: 'Agent de la PoliSec — Combat', total: 1, modifier: 0, successes: 1, fails: 0, tagSuccess: true,
        totalDisplay: '1 réussite', rolls: [{ val: 1, sides: 10 }, { val: 9, sides: 10 }, { val: 1, sides: 10 }],
    });
    const rouage = f.locator('[data-fiel-au-pupitre]');
    await expect(rouage).toBeVisible({ timeout: 15_000 });
    await photographier(panneauDuDernierJet(rouage), 'jeu-noc-rouage');
}

/** Cthulhu Hack : la Fortune sous une Sauvegarde ratée, la suite d'un déclin au pupitre, le Hors Jeu. */
async function scenesDeCthulhuHack(c: ContexteDeScene): Promise<void> {
    const pilote = c.pilote.gameDriver as { jet?: { fortune?: unknown }; combat?: { horsJeu?: unknown } };
    const f = gmos.fenetre;
    if (pilote.jet?.fortune) {
        // Une Sagesse de 1 : la Sauvegarde rate presque toujours, la Fortune paraît.
        await ecrireLaFiche(c, { sagesse: 1 });
        await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
        const panneau = f.locator('[data-panneau-de-jet]').first();
        await expect(panneau).toBeVisible({ timeout: 15_000 });
        await panneau.locator('select').first().selectOption('sagesse');
        for (let i = 0; i < 20 && await panneau.locator('[data-fortune]').count() === 0; i++) {
            await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
        }
        await expect(panneau.locator('[data-fortune]')).toBeVisible();
        const fenetre = await gmos.application.browserWindow(f);
        await fenetre.evaluate(w => w.setContentSize(1440, 1800));
        await photographier(panneau, 'jeu-cthulhu-hack-fortune');
        await fenetre.evaluate(w => w.setContentSize(1440, 900));
        await ecrireLaFiche(c, { sagesse: 15 });

        // La Santé mentale qui descend, lancée depuis la tablette : Folie, Choc, et la Fortune.
        await jetAuPupitre({
            id: 'capture-declin', title: `${c.nom} — Santé mentale d10`, total: 2, modifier: 0, tagSuccess: false,
            totalDisplay: '2 — d10 → d8', rolls: [{ val: 2, sides: 10 }], usure: { avant: 10, apres: 8 },
            deFiche: { joueurId: JOUEUR, characterId: c.personnage, genre: 'ressource', champ: 'mentalHealth' },
        });
        const suites = f.locator('[data-suites-du-jet]');
        await expect(suites).toBeVisible({ timeout: 15_000 });
        await photographier(panneauDuDernierJet(suites), 'jeu-cthulhu-hack-suites-du-declin');
    }
    if (pilote.combat?.horsJeu) {
        const carte = await entrerEnCombat(c, 30);
        await carte.getByRole('button', { name: 'Tirer les conséquences', exact: true }).click();
        await expect(carte.getByRole('button', { name: /S'il survit/ })).toBeVisible({ timeout: 15_000 });
        await photographier(carte, 'jeu-cthulhu-hack-hors-jeu');
    }
}

/**
 * Le panneau de jet du PJ, ses composantes retenues, relancé jusqu'à ce que `voulu`
 * paraisse — un 1 sur un dé de Stress, un D10 à une seule réussite. Le hasard du
 * jet est celui du jeu : on relance, on ne le truque pas.
 */
async function jeterJusqua(c: ContexteDeScene, composantes: string[], voulu: (panneau: Locator) => Locator, essais = 40): Promise<Locator> {
    const f = gmos.fenetre;
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    const panneau = f.locator('[data-panneau-de-jet]').first();
    await expect(panneau).toBeVisible({ timeout: 15_000 });
    for (const [i, champ] of composantes.entries()) await panneau.locator('select').nth(i).selectOption(champ);
    const cible = voulu(panneau);
    for (let i = 0; i < essais && await cible.count() === 0; i++) {
        await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
    }
    await expect(cible.first()).toBeVisible();
    return panneau;
}

/** Le panneau photographié en entier : on agrandit la fenêtre le temps de la prise. */
async function photographierLePanneau(panneau: Locator, nom: string): Promise<void> {
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate(w => w.setContentSize(1440, 1800));
    await photographier(panneau, nom);
    await fenetre.evaluate(w => w.setContentSize(1440, 900));
}

/** Alien : le test de Panique qu'un 1 de Stress déclenche, et un jet forcé. */
async function scenesDAlien(c: ContexteDeScene): Promise<void> {
    const jet = (c.pilote.gameDriver as { jet?: { forcer?: unknown; panique?: unknown } }).jet;
    const composantes = ['force', 'combat_rapproche', 'niveau_de_stress'];
    if (jet?.panique) {
        const panneau = await jeterJusqua(c, composantes, p => p.getByRole('button', { name: 'Test de Panique', exact: true }));
        await panneau.getByRole('button', { name: 'Test de Panique', exact: true }).click();
        await expect(panneau.locator('[data-test-de-panique]')).toBeVisible({ timeout: 15_000 });
        await gmos.fenetre.waitForTimeout(1_000);
        await photographierLePanneau(panneau, 'jeu-alien-panique');
    }
    if (jet?.forcer) {
        // Un jet sans Panique, qu'on force : les dés relancés se cerclent, le Stress monte.
        const panneau = await jeterJusqua(c, composantes, p => p.locator('button:enabled', { hasText: /^Forcer le jet/ }));
        await panneau.locator('button:enabled', { hasText: /^Forcer le jet/ }).click();
        await expect(panneau.getByText(/Jet forcé/).first()).toBeVisible();
        await photographierLePanneau(panneau, 'jeu-alien-force');
    }
}

/** Torg : les Lois du cosm courant, et une horde de sbires sur la carte d'un adversaire. */
async function scenesDeTorg(c: ContexteDeScene): Promise<void> {
    const pilote = c.pilote.gameDriver as { cosms?: { id: string }[]; combat?: { dommages?: { mecanique?: string } } };
    const f = gmos.fenetre;
    if (pilote.cosms?.length) {
        await f.evaluate(({ campagne, cosm }) => {
            const s = (window as unknown as Fenetre).useSessionOSStore;
            s.setState(st => ({ campaigns: st.campaigns.map(x => x.id === campagne ? { ...x, cosmsParDefaut: [cosm] } : x) }));
        }, { campagne: c.campagne, cosm: pilote.cosms[0].id });
    }
    const avecHorde = pilote.combat?.dommages?.mecanique === 'torg';
    if (avecHorde) {
        await f.evaluate(() => {
            const combat = (window as unknown as Fenetre).useCombatStore.getState();
            const fiche = { esprit: 7, resistance: 9 };
            const adversaire = combat.combatants.find(x => !x.isPlayer);
            // Une Esprit et une Résistance pour la horde : un sbire sans fiche les dirait à zéro.
            if (adversaire) combat.updateCombatant(adversaire.id, { sheetData: { ...(adversaire.sheetData ?? {}), ...fiche } });
            else combat.addCombatant({ name: 'Gospog', init: 0, isPlayer: false, faction: 'enemy', statuses: [], sheetData: fiche });
        });
    }
    await vue(c.campagne, 'cockpit');
    await ouvrirLeModule(gmos, 'Combat-OS');
    if (pilote.cosms?.length) {
        const lois = f.locator('[data-lois-du-cosm]').first();
        await expect(lois).toBeVisible({ timeout: 15_000 });
        await photographier(lois, 'jeu-torg-lois-du-cosm');
    }
    if (avecHorde) {
        const carte = f.locator('[data-combattant]').filter({ hasText: 'Gospog' }).first();
        await expect(carte).toBeVisible({ timeout: 15_000 });
        await carte.getByRole('button', { name: /En horde/ }).click();
        await carte.getByRole('button', { name: 'Former la horde', exact: true }).click();
        await expect(carte.locator('[data-horde]')).toBeVisible();
        await carte.getByRole('button', { name: 'Coup sur la horde', exact: true }).click();
        await carte.getByLabel('Capacité Horde').check();
        await photographier(carte, 'jeu-torg-horde');

        // La capacité « Sbires » : sur un vilain qui n'est pas lui-même un sbire.
        await f.evaluate(() => {
            (window as unknown as Fenetre).useCombatStore.getState().addCombatant({
                name: 'Mobius', init: 0, isPlayer: false, faction: 'enemy', statuses: [],
                sheetData: { esprit: 10, realite: 3 },
            } as never);
        });
        const vilain = f.locator('[data-combattant]').filter({ hasText: 'Mobius' }).first();
        await expect(vilain.locator('[data-sbires]')).toBeVisible({ timeout: 15_000 });
        await vilain.locator('[data-sbires]').getByRole('button').click();
        await photographier(vilain, 'jeu-torg-sbires');
    }

    // Les Atouts qui touchent aux cartes, sous les gestes du Paquet du Destin.
    // Le Paquet du Destin du jeu, s'il est chargé dans Deck-OS.
    await vue(c.campagne, 'deck-player');
    const destin = f.getByRole('button', { name: /Paquet du Destin/i }).first();
    if (!(await destin.isVisible().catch(() => false))) return;
    await destin.click();
    const atouts = f.locator('[data-atouts-du-destin]');
    await expect(atouts).toBeVisible({ timeout: 15_000 });
    await atouts.getByLabel('Combien de cartes piocher').selectOption('2');
    await atouts.getByRole('button', { name: /Piocher, en garder une/ }).click();
    await photographier(f.locator('[data-gestes-du-destin]'), 'jeu-torg-atouts');
}

/** Blade Runner : la protection, Brisé par les dégâts et par le stress, sur la carte. */
async function scenesDeBladeRunner(c: ContexteDeScene): Promise<void> {
    const pilote = c.pilote.gameDriver as { combat?: { horsJeu?: unknown; protection?: unknown }; jet?: { stressSubi?: unknown; forcer?: { relancerUneReussite?: boolean } } };
    // Relancer un D10 à une seule réussite, au forçage.
    if (pilote.jet?.forcer?.relancerUneReussite) {
        const panneau = await jeterJusqua(c, ['vigueur', 'corpsACorps'], p => p.locator('[data-relancer-aussi]'));
        await panneau.locator('[data-relancer-aussi] input[type="checkbox"]').first().check();
        await photographierLePanneau(panneau, 'jeu-blade-runner-relance');
    }
    // Le stress encaissé, avant toute chute.
    if (pilote.jet?.stressSubi) {
        await ecrireLaFiche(c, { sangFroid: 6 });
        const carte = await entrerEnCombat(c);
        await carte.getByLabel('Facteur de stress').selectOption('3');
        await carte.getByRole('button', { name: 'Encaisser', exact: true }).click();
        await gmos.fenetre.waitForTimeout(500);
        await photographier(carte, 'jeu-blade-runner-stress');
    }
    if (!pilote.combat?.horsJeu && !pilote.combat?.protection) return;
    await ecrireLaFiche(c, { sangFroid: 0 });
    const carte = await entrerEnCombat(c, 30);
    if (pilote.combat?.horsJeu) {
        await carte.getByLabel('Table').selectOption({ label: 'Perforant' });
        await carte.getByLabel('Dé de critique').selectOption({ label: 'D8' });
        await carte.getByRole('button', { name: 'Blessure critique', exact: true }).click();
        await expect(carte.getByRole('button', { name: 'Encore une blessure critique', exact: true })).toBeVisible({ timeout: 15_000 });
    }
    const stress = carte.getByRole('button', { name: "Lancer l'effet critique", exact: true });
    if (await stress.count()) {
        await stress.click();
        await expect(stress).toHaveCount(0, { timeout: 15_000 });
    }
    await photographier(carte, 'jeu-blade-runner-brise');
}
