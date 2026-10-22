import { test, expect, chromium, type Locator, type BrowserContext } from '@playwright/test';
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
 * Les pilotes sont lus là où David les exporte (`Export Dirvers/`, ou
 * `GMOS_PILOTES_DES_JEUX`), chargés dans
 * une instance JETABLE avec des campagnes et des personnages **fictifs**, et
 * seules les images sortent du profil de test. Certains exports sont versionnés
 * à sa demande explicite du 19/10/2026. Sans pilote exporté, le scénario s'arrête : il n'y
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
 * Alien A8 (22/10) : `e2e/modulesDuJeuAlien.spec.ts`, scénario A8, capture les deux
 * accessoires réels dans `scratch/modules-du-jeu-e2e/jeu-alien-a8-*.jpg`, puis relecture
 * et copie dans le manuel. Le pilote 1.8.0 conserve les mécaniques et champs A0–A7.
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
        sheetData: { force: 4, sante: 4, empathie: 2, combat_rapproche: 2, niveau_de_stress: 2, points_de_recit: 1,
            _gmos_progression_alien:{version:1,mode:'cinema',scenario:'demo',acte:1,seance:'demo-1',objectifs:{},remis:{},finsActe:[],bilans:[],fetiches:[],achats:[],essaisTalents:[]} },
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
            // Le 18/10 : l'Art de Magie, le Ka dominant (Terre 6 : la Stase plafonne à 6), un construct.
            occult_magic_first: 4, ka_dominant: 'Terre', occult_alchemy_black: 5, alchemy_constructs_retort_water: 3,
            alchemy_materia_water_max: 9, alchemy_materia_water: 4,
        },
        composantes: ['pastlives_0_degree', 'ka_fire'],
        reserves: { seuilRK: 4, jaugeDeTraque: 3, intensiteDeTraque: 2 },
        casesCochees: 4,
        scenes: c => scenesDeNephilim(c),
    },
    {
        corpusId: 'cthulhu hack', slug: 'cthulhu-hack', personnage: 'Edith Marsh',
        sheetData: { force: 13, sagesse: 15, hp: 9, torche: 'd8', bagou: 'd6', mentalHealth: 'd10', richesse: 'd4', fortune: 0, materiel_1_nom: 'Lampe-torche', materiel_1: 'd8' },
        composantes: ['sagesse'],
        scenes: c => scenesDeCthulhuHack(c),
    },
    {
        corpusId: 'symbaroum', slug: 'symbaroum', personnage: 'Éléna des Brumes',
        sheetData: {
            precision: 15, agilite: 13, vigilance: 11, volonte: 10, astuce: 10, discretion: 9, force: 7, persuasion: 5,
            endurance: 10, endurance_actuelle: 10, resistance_douleur: 4, defense: 12, seuil_corruption: 5,
            corruption_temporaire: 2, corruption_permanente: 1, argent: 5,
        },
        composantes: ['precision'],
    },
    {
        corpusId: 'reves de dragons', slug: 'reves-de-dragons', personnage: 'Aldaran le Voyageur',
        sheetData: { force: 12, agilite: 13, taille: 11, constitution: 13, discretion: 2, vie: 12 },
        composantes: ['agilite', 'discretion'],
        scenes: c => sceneArchetypeRdd(c),
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
    sheetTemplate?: { id: string; reglesDeFiche?: 'rdd-231' };
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
                ...(mise.corpusId === 'reves de dragons' ? { hp: 12, maxHp: 12 } : {}),
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
let stockageTabletteAlien: Awaited<ReturnType<BrowserContext['storageState']>> | undefined;

test.describe.configure({ mode: 'serial' });
test.skip(JEUX.length === 0, `aucun pilote exporté dans « ${PILOTES} » — rien d'honnête à photographier`);

test.beforeAll(async () => {
    test.setTimeout(60_000);
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
        if (mise.corpusId === 'alien') test.setTimeout(240_000);
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
        if (pilote.gameDriver.ressourcesDeTable?.some(r=>!r.horsDuBandeau)) {
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
        if (pilote.sheetTemplate?.reglesDeFiche === 'rdd-231') {
            const reprise = f.getByRole('region', { name: 'Reprise de la fiche Voyageur' });
            await expect(reprise).toBeVisible();
            // Personnage fictif sans valeurs contradictoires : la reprise reste un geste explicite.
            await reprise.getByRole('button', { name: 'Appliquer la reprise et les calculs' }).click();
            await expect(reprise).toHaveCount(0);
        }
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

/** Le pilote étendu du livret : ses niveaux d'Archétype sont des champs propres. */
async function sceneArchetypeRdd(c: ContexteDeScene): Promise<void> {
    const etendue = c.pilote.sheetTemplate as { sections?: { id: string }[] } | undefined;
    if (!etendue?.sections?.some(s => s.id === 'archetype_niveaux')) return;
    const f = gmos.fenetre;
    await ecrireLaFiche(c, { archetype_general_craft: 3, archetype_general_sing: 5,
        archetype_general_run: 7, archetype_general_cook: 2, archetype_general_dance: 4 });
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    const titre = f.getByRole('heading', { name: 'Archétype — niveaux', exact: true });
    await expect(titre).toBeVisible();
    await titre.evaluate(e => e.scrollIntoView({ block: 'start' }));
    await photographier(f.locator('body'), 'jeu-reves-de-dragons-archetype-formulaire');
}

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

/**
 * Nephilim (2026-10-18) : un sort de Magie avec la Stase puisée, la carte d'une
 * maladresse, une transmutation au Ka d'un construct, le Ka dominant et la
 * Stase plafonnée. Chaque prise suppose ce que le pilote déclare.
 */
async function scenesDeNephilim(c: ContexteDeScene): Promise<void> {
    const jet = (c.pilote.gameDriver as { jet?: { reservesDuPersonnage?: unknown[]; suitesDesCritiques?: unknown[] } }).jet;
    const f = gmos.fenetre;
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    const panneau = f.locator('[data-panneau-de-jet]').first();
    await expect(panneau).toBeVisible({ timeout: 15_000 });
    const [premier, second] = [panneau.locator('select').nth(0), panneau.locator('select').nth(1)];

    // Un sort de Basse Magie, deux degrés de Stase puisés — rien n'est lancé.
    if (jet?.reservesDuPersonnage?.length) {
        await premier.selectOption('occult_magic_first');
        await second.selectOption('ka_fire');
        const stase = panneau.getByRole('button', { name: /^Un point de plus : Stase/ });
        await stase.click();
        await stase.click();
        await photographierLePanneau(panneau, 'jeu-nephilim-sort-et-stase');
        // Relâchés : les relances de la maladresse ne doivent pas les dépenser.
        const moins = panneau.getByRole('button', { name: /^Un point de moins : Stase/ });
        await moins.click();
        await moins.click();
    }

    // La transmutation : l'Œuvre au noir et le Ka-Eau de la cornue, la formule au curseur. Avant tout lancer.
    if (await premier.locator('option[value="occult_alchemy_black"]').count() > 0
        && await second.locator('option[value="alchemy_constructs_retort_water"]').count() > 0) {
        await premier.selectOption('occult_alchemy_black');
        await second.selectOption('alchemy_constructs_retort_water');
        await photographierLePanneau(panneau, 'jeu-nephilim-transmutation');
    }

    // Une maladresse de Magie et sa carte. Un Art à 1 sans approche : 10 % ; on relance, on ne truque pas.
    if (jet?.suitesDesCritiques?.length) {
        await ecrireLaFiche(c, { occult_magic_first: 1 });
        const lance = await jeterJusqua(c, ['occult_magic_first', ''], p => p.locator('[data-suite-du-critique="maladresse"]'), 80);
        await photographierLePanneau(lance, 'jeu-nephilim-maladresse');
        await ecrireLaFiche(c, { occult_magic_first: 4 });
    }

    // Le Ka dominant et la Stase plafonnée, sur la fiche GM-OS.
    const section = (titre: string) => f.locator('h3', { hasText: new RegExp(`^${titre}$`) }).first().locator('xpath=..');
    if (await section('Ka dominant').count() > 0) {
        await photographier(section('Ka dominant'), 'jeu-nephilim-ka-dominant');
        await expect(section('Stase et Sapience').locator('[data-plafond]')).toBeVisible();
        await photographier(section('Stase et Sapience'), 'jeu-nephilim-stase-plafonnee');
    }
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
        // A1 : un résultat avec Panique ne s'abandonne pas pour relancer.
        const lancer = panneau.getByRole('button', { name: 'Lancer', exact: true });
        if (await lancer.isDisabled()) {
            const panique = panneau.getByRole('button', { name: 'Test de Panique', exact: true });
            if (await panique.count()) await panique.click();
        }
        await lancer.click();
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
    const jet = (c.pilote.gameDriver as { jet?: { alien?: { combat?: unknown }; forcer?: unknown; panique?: { suites?: unknown } } }).jet;
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
        const panique = panneau.getByRole('button', { name: 'Test de Panique', exact: true });
        if (await panique.isVisible()) await panique.click();
    }
    if (jet?.panique?.suites) {
        await scenesDePaniqueAlien(c);
        await sceneDePaniqueAlienTablette(c);
    }
    if (jet?.alien) await sceneDesJetsAlien(c);
    if (jet?.alien?.combat) await sceneDuCombatAlien(c);
    if (jet?.alien?.combat) await sceneDuSynthetiqueAlien(c);
    if ((jet?.alien?.combat as {survie?:unknown}|undefined)?.survie) await sceneDeSurvieAlien(c);
    if ((jet?.alien?.combat as {actions?:boolean}|undefined)?.actions) await sceneDesActionsXenoAlien(c);
    if ((jet?.alien?.combat as {progression?:unknown}|undefined)?.progression) await sceneDeProgressionAlien(c);
}

/** A6 : plusieurs cartes, une Santé, critique particulier et vraie aspersion sur le PJ. */
async function sceneDesActionsXenoAlien(c:ContexteDeScene):Promise<void>{
    const f=gmos.fenetre;
    await ecrireLaFiche(c,{androide:false,force:4,endurance:2,sante:4,niveau_de_stress:0,dehydrate:false,affame:false,gele:false,epuise:false,'field-1786783170092':0,
        _gmos_combat_alien:{version:1,temps:{round:0,tour:0,quart:0,jour:0},critiques:[],blessureTraitee:[],blessures:[],mort:false,armes:{}}});
    await entrerEnCombat(c);
    const ids=await f.evaluate(({campagne})=>{
        const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState(),p=w.useCombatStore.getState();
        s.addEntity({name:'Spécimen XX121',type:'monster',role:'hostile',status:'alive',avatar:'',hp:6,maxHp:6,ac:0,speed:0,initiative:0,description:'Recette jetable',roleplayingNotes:'',gmSecretInfo:'',linkedMapIds:[],campaignId:campagne,sheetData:{sante:6,force:6,'field-1786783170092':0}});
        const e=w.useSessionOSStore.getState().entities.find(e=>e.name==='Spécimen XX121')!;
        p.addCombatant({name:e.name,init:0,isPlayer:false,sourceEntityId:e.id,faction:'enemy',statuses:[]});
        return {creature:w.useCombatStore.getState().combatants.find(c=>c.sourceEntityId===e.id)!.id,entity:e.id,marine:w.useCombatStore.getState().combatants.find(c=>c.isPlayer)!.id};
    },{campagne:c.campagne});
    const creature=f.locator(`[data-combattant="${ids.creature}"]`),marine=f.locator(`[data-combattant="${ids.marine}"]`);
    await creature.getByRole('button',{name:'Déclarer cette créature xénomorphe',exact:true}).click();
    const x=creature.locator('[data-xenomorphe-alien]');await x.locator('summary').first().click();
    await x.getByLabel('Vitesse',{exact:true}).fill('2');await x.getByLabel('Espèce XX121 avec sang acide').check();await x.getByLabel('Éclaboussure d’acide de l’espèce').fill('8');
    await f.evaluate(()=>{(window as unknown as Fenetre).useCombatStore.getState().rollAutoInitiative({cards:10,sortOrder:'asc'});});
    const cartes=await f.evaluate(()=>{const s=(window as unknown as Fenetre).useCombatStore.getState();return s.combatants.flatMap(c=>c.alien?.cartes??[]);});
    expect(cartes).toHaveLength(3);expect(new Set(cartes).size).toBe(3);
    const actions=marine.locator('[data-actions-alien]');await actions.locator('summary').click();
    await actions.getByRole('button',{name:'Bloquer — rapide hors tour',exact:true}).click();await actions.getByRole('button',{name:'Payer une lente',exact:true}).click();
    await expect(actions.getByText(/1 lente, 1 rapide/)).toBeVisible();await photographier(actions,'jeu-alien-a6-actions');
    const hasard=async(n:number,action:()=>Promise<void>)=>{await f.evaluate(n=>{const w=window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;Math.random=()=>n;},n);try{await action();}finally{await f.evaluate(()=>{Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;});}};
    const sante=creature.locator('[data-sante-alien]');await sante.getByLabel('Dégâts entrants').fill('6');await sante.getByLabel('Dégâts d’une attaque (armure applicable)').uncheck();
    await sante.getByRole('button',{name:'Préparer ce coup',exact:true}).click();await sante.getByRole('button',{name:'Lancer la Protection',exact:true}).click();await sante.getByRole('button',{name:'Appliquer les dégâts restants',exact:true}).click();
    await hasard(0.2,async()=>{await x.getByRole('button',{name:'Résoudre le critique xénomorphe D6',exact:true}).click();await expect(x.getByText(/2 — Blessé/)).toBeVisible();});
    expect(await f.evaluate(id=>{const s=(window as unknown as Fenetre).useCombatStore.getState();return s.combatants.find(c=>c.id===id)!.alien?.cartes.length;},ids.creature)).toBe(1);
    await x.getByLabel('Dana Okoro au Contact',{exact:true}).check();await x.getByRole('button',{name:'Confirmer les victimes de cette aspersion',exact:true}).click();
    await hasard(0.4,()=>x.getByRole('button',{name:'Tirer une attaque spéciale D6',exact:true}).click());await expect(x.locator('[data-attaque-speciale-alien]')).toBeVisible();
    await photographier(x,'jeu-alien-a6-xenomorphe');
    const acide=marine.locator('[data-acide-alien]');await hasard(0.99,()=>acide.getByRole('button',{name:'Résoudre l’attaque d’acide 1 de ce Round',exact:true}).click());
    await expect(acide.getByRole('button',{name:'Résoudre l’attaque d’acide 1 de ce Round',exact:true})).toBeDisabled();
    await hasard(0.99,()=>acide.getByRole('button',{name:'Trépas acide — Endurance sans Stress',exact:true}).click());await photographier(acide,'jeu-alien-a6-acide');
    await f.waitForTimeout(750);await f.reload();await attendreLHydratation(gmos);await ouvrirLeModule(gmos,'Combat-OS');
    expect(await f.evaluate(id=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();return s.entities.find(e=>e.id===id)!.hp;},ids.entity)).toBe(1);
}

/** A7 : remise privée, plafonds, reçus de gains/achats et lecture du Hub à trois tailles. */
async function sceneDeProgressionAlien(c:ContexteDeScene):Promise<void>{
    const f=gmos.fenetre;
    await f.evaluate(()=>{(window as unknown as Fenetre).useCombatStore.getState().clearCombatants();});
    await ecrireLaFiche(c,{sante:4,niveau_de_stress:4,points_de_recit:2,objet_fetiche:'Photo de famille',comtech:1,'field-1786782929062':10,
        _gmos_progression_alien:{version:1,mode:'cinema',scenario:'Dernier départ',acte:1,seance:'Alien-recette-1',objectifs:{},remis:{},finsActe:[],bilans:[],fetiches:[],achats:[],essaisTalents:[]}});
    await vue(c.campagne,'players',{joueur:JOUEUR,personnage:c.personnage});let p=f.locator('[data-progression-alien]').first();await p.locator('summary').first().click();
    const secret='Sauver les prélèvements avant l’évacuation.';
    await p.getByLabel('Objectif secret de cet acte (MJ uniquement)',{exact:true}).fill(secret);await p.getByRole('button',{name:'Remettre au seul personnage',exact:true}).click();
    await p.getByLabel('Maman confirme risques ou sacrifices pour cet objectif').check();await p.getByRole('button',{name:'Valider la fin d’acte',exact:true}).click();await expect(p.getByRole('button',{name:'Valider la fin d’acte',exact:true})).toBeDisabled();
    await p.getByRole('button',{name:'Utiliser le fétiche — Stress −1',exact:true}).click();await expect(p.getByRole('button',{name:'Utiliser le fétiche — Stress −1',exact:true})).toBeDisabled();await photographier(p.locator('[data-objectifs-alien]'),'jeu-alien-a7-objectifs');
    const lire=()=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData!,c.personnage);
    expect((await lire()).points_de_recit).toBe(3);expect((await lire()).niveau_de_stress).toBe(3);
    await p.getByLabel('Mode de jeu',{exact:true}).selectOption('campagne');
    await p.getByLabel('Présence à la séance',{exact:true}).check();await p.getByLabel('Test de Panique effectué',{exact:true}).check();await p.getByRole('button',{name:'Attribuer les PX de la séance',exact:true}).click();expect((await lire())['field-1786782929062']).toBe(12);
    await photographier(p.locator('[data-px-alien]'),'jeu-alien-a7-px');
    await f.evaluate(id=>{const s=(window as unknown as Fenetre).useSessionOSStore;s.setState(etat=>({sessions:etat.sessions.map(x=>x.campaignId===id?{...x,status:'done' as const}:x)}));},c.campagne);
    await p.locator('[data-apprentissage-alien] summary').click();await p.getByLabel('Entre deux séances, hors séance active').check();await p.getByLabel('Compétence à améliorer').selectOption('comtech');
    await p.getByRole('button',{name:'Préparer un nouvel apprentissage',exact:true}).click();await p.getByRole('button',{name:'Valider cet apprentissage',exact:true}).click();expect((await lire()).comtech).toBe(2);expect((await lire())['field-1786782929062']).toBe(7);await expect(p.getByRole('button',{name:'Valider cet apprentissage',exact:true})).toBeDisabled();
    await photographier(p.locator('[data-apprentissage-alien]'),'jeu-alien-a7-apprentissage');
    await f.waitForTimeout(750);await f.reload();await attendreLHydratation(gmos);await vue(c.campagne,'players',{joueur:JOUEUR,personnage:c.personnage});p=f.locator('[data-progression-alien]').first();await p.locator('summary').first().click();await expect(p.getByRole('button',{name:'Attribuer les PX de la séance',exact:true})).toBeDisabled();
    await expect(p.getByLabel('Présence à la séance',{exact:true})).toBeChecked();await expect(p.getByLabel('Présence à la séance',{exact:true})).toBeDisabled();
    // Le Hub veille hors séance : l'achat est terminé entre les deux, puis la suivante s'ouvre.
    await f.evaluate(campagne=>{const s=(window as unknown as Fenetre).useSessionOSStore;
        s.setState(etat=>{const precedente=etat.sessions.find(x=>x.campaignId===campagne)!;const id='alien-a7-seance-suivante';return {
            sessions:[...etat.sessions,{...precedente,id,status:'active' as const}],
            campaigns:etat.campaigns.map(c=>c.id===campagne?{...c,activeSessionId:id}:c),
        };});
    },c.campagne);
    const nav=await chromium.launch({channel:'msedge',args:['--mute-audio']});
    try{
        const ctx=await nav.newContext({viewport:{width:360,height:1200},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',storageState:stockageTabletteAlien});
        await ctx.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
        const t=await ctx.newPage(),charges:string[]=[];t.on('websocket',ws=>ws.on('framereceived',evt=>charges.push(String(evt.payload))));
        await t.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);await expect(t.getByText('Connecté',{exact:true})).toBeVisible();await t.getByTitle('Fiche Personnage',{exact:true}).click();
        const progression=t.locator('[data-progression-alien]');await progression.locator('summary').first().click();await expect(progression.getByText(/PX 7 ; Récit 3\/3/)).toBeVisible();await expect(progression.getByRole('button')).toHaveCount(0);
        for(const largeur of [360,768,1180]){await t.setViewportSize({width:largeur,height:1200});expect(await t.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await photographier(progression,`jeu-alien-a7-tablette-${largeur}`);}
        const publics=charges.filter(x=>{try{return JSON.parse(x).type==='sync';}catch{return false;}});expect(publics.length).toBeGreaterThan(0);expect(publics.join('')).not.toContain(secret);
        // Le fil privé à la reconnexion contient bien la remise à ce seul PJ.
        expect(charges.some(x=>x.includes(secret))).toBe(true);
    }finally{await nav.close();}
}

/** A5 : réserves réelles, privations, radiations, charge et reprise dans le vrai Hub. */
async function sceneDeSurvieAlien(c:ContexteDeScene):Promise<void>{
    const f=gmos.fenetre;
    await ecrireLaFiche(c,{androide:false,force:2,endurance:2,sante:2,niveau_de_stress:3,air:8,eau:5,nourriture:1,energie:2,affame:false,dehydrate:false,epuise:false,gele:false,
        'field-1786782860390':0,rads_permanents:0,inventaire:'Lampe\nOutil','field-1786783108730':'',
        _gmos_combat_alien:{version:1,temps:{round:0,tour:0,quart:0,jour:0},critiques:[],blessureTraitee:[],blessures:[],mort:false,armes:{}},
        _gmos_survie_alien:{version:1,actif:false,collectif:false,taches:[],traites:[],sorties:{},joursSansSommeil:1,froid:'quart',zone:false,manqueAir:0,dangerAir:false,dangerRadiations:false,poids:{}}});
    const ouvrir=async()=>{await f.waitForTimeout(750);await f.reload();await attendreLHydratation(gmos);await vue(c.campagne,'players',{joueur:JOUEUR,personnage:c.personnage});const p=f.locator('[data-survie-alien]').first();await p.getByText('Survie Alien',{exact:true}).click();return p;};
    let survie=await ouvrir();
    const lire=()=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData!,c.personnage);
    const hasard=async(des:number[],action:()=>Promise<void>)=>{await f.evaluate(ds=>{const w=window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;Math.random=()=>ds.shift()??0.2;},des);try{await action();}finally{await f.evaluate(()=>{Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;});}};
    await survie.getByLabel('Suivre les consommables en pénurie').check();
    await survie.getByRole('button',{name:'Demander le test — Air',exact:true}).click();
    await hasard([0,0,0.2,0.2,0.99,0.2],()=>survie.getByRole('button',{name:'Résoudre : Air : utilisation confirmée par Maman',exact:true}).click());
    expect((await lire()).air).toBe(6);expect((await lire()).niveau_de_stress).toBe(3);
    const fenetre=await gmos.application.browserWindow(f);await fenetre.evaluate(w=>w.setContentSize(2160,1800));
    await photographier(survie.locator('[data-reserves-alien]'),'jeu-alien-a5-reserves');
    await survie.getByLabel('Déshydraté',{exact:true}).check();await survie.getByRole('button',{name:'Valider quart — survie',exact:true}).click();
    await survie.getByRole('button',{name:'Résoudre : Déshydratation : échéance par Quart',exact:true}).click();expect((await lire()).sante).toBe(1);expect((await lire()).niveau_de_stress).toBe(4);
    const sante=f.locator('[data-sante-alien]').first();await expect(sante.getByRole('button',{name:'Un Tour de repos écoulé : Santé +1',exact:true})).toBeDisabled();
    await photographier(survie.locator('[data-etats-survie]'),'jeu-alien-a5-privations');
    await survie.getByRole('button',{name:'Boisson prise : commencer le Quart de récupération',exact:true}).click();expect((await lire()).dehydrate).toBe(true);
    await survie.getByRole('button',{name:'Valider quart — survie',exact:true}).click();expect((await lire()).dehydrate).toBe(false);
    await sante.getByRole('button',{name:'Un Tour de repos écoulé : Santé +1',exact:true}).click();expect((await lire()).sante).toBe(2);
    await survie.getByLabel('Réserves communes à la campagne').check();await survie.getByLabel('Quantité confirmée — Eau',{exact:true}).fill('8');await survie.getByRole('button',{name:'Renseigner Eau',exact:true}).click();
    await survie.getByRole('button',{name:'Demander le test — Eau',exact:true}).click();await hasard([0,0.2,0.2,0.2,0.2,0.2],()=>survie.getByRole('button',{name:'Résoudre : Eau : utilisation confirmée par Maman',exact:true}).click());
    expect((await lire()).eau).toBe(5);await expect(survie.getByText('Eau : 7',{exact:true})).toBeVisible();
    await survie.locator('[data-encombrement-alien]').locator('summary').click();await survie.getByLabel('Lampe — masse',{exact:true}).fill('0.5');await survie.getByLabel('Outil — masse',{exact:true}).fill('2');
    await survie.getByLabel('Autres charges portées (armure, bouteilles, batteries ; zéro si aucune)',{exact:true}).fill('0.25');
    await survie.getByRole('button',{name:'Reporter la charge sur la fiche',exact:true}).click();expect((await lire())['field-1786783213114']).toBe(5.75);
    await photographier(survie.locator('[data-encombrement-alien]'),'jeu-alien-a5-encombrement');
    await survie.getByLabel('Réserves communes à la campagne').uncheck();
    await ecrireLaFiche(c,{'field-1786782860390':2});survie=await ouvrir();
    await survie.getByRole('button',{name:'Demander un Rad reçu',exact:true}).click();await hasard([0,0.2,0.2],()=>survie.getByRole('button',{name:'Résoudre : Un Rad reçu, confirmé par Maman',exact:true}).click());
    expect((await lire()).sante).toBe(1);expect(((await lire())._gmos_combat_alien as {critiques:unknown[]}).critiques).toHaveLength(0);
    await survie.getByRole('button',{name:'Valider quart — survie',exact:true}).click();await hasard([0],()=>survie.getByRole('button',{name:'Résoudre : Hors zone : élimination possible d’un Rad',exact:true}).click());
    expect((await lire()).rads_permanents).toBe(1);expect((await lire())['field-1786782860390']).toBe(3);
    await survie.getByRole('button',{name:'Valider quart — survie',exact:true}).click();await hasard([0.99],()=>survie.getByRole('button',{name:'Résoudre : Hors zone : élimination possible d’un Rad',exact:true}).click());
    expect((await lire())['field-1786782860390']).toBe(2);await photographier(survie.locator('[data-radiations-alien]'),'jeu-alien-a5-radiations');
    await survie.getByLabel('Zone irradiée').selectOption('round');await expect(f.locator('[data-sante-alien]').first().getByRole('button',{name:'Un Tour de repos écoulé : Santé +1',exact:true})).toBeDisabled();await survie.getByLabel('Zone irradiée').selectOption('non');
    await survie.getByRole('button',{name:'Valider tour — survie',exact:true}).click();survie=await ouvrir();
    await expect(survie.getByRole('button',{name:'Résoudre : Air : tour 1',exact:true})).toBeVisible();await photographier(survie.locator('[data-echeances-survie]'),'jeu-alien-a5-echeances');
    await hasard([0.2,0.2,0.2,0.2,0.2,0.2],()=>survie.getByRole('button',{name:'Résoudre : Air : tour 1',exact:true}).click());expect((await lire()).air).toBe(6);
    await survie.getByLabel('Déshydraté',{exact:true}).check();
    const nav=await chromium.launch({channel:'msedge',args:['--mute-audio']});
    try{
        const ctx=await nav.newContext({viewport:{width:360,height:1200},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',storageState:stockageTabletteAlien});
        await ctx.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
        const t=await ctx.newPage();await t.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);await expect(t.getByText('Connecté',{exact:true})).toBeVisible();await t.getByTitle('Fiche Personnage',{exact:true}).click();
        const suivi=t.locator('[data-survie-alien]');await suivi.getByText('Survie Alien',{exact:true}).click();await expect(suivi.getByLabel('Déshydraté',{exact:true})).toBeChecked();await expect(suivi.getByText(/Total : 2 Rads, dont 1 permanents/)).toBeVisible();await expect(suivi.getByRole('button')).toHaveCount(0);
        for(const largeur of [360,768,1180]){await t.setViewportSize({width:largeur,height:1200});expect(await t.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await photographier(suivi.locator('[data-etats-survie]'),`jeu-alien-a5-tablette-${largeur}`);}
    }finally{await nav.close();}
    await fenetre.evaluate(w=>w.setContentSize(1440,900));const carte=await entrerEnCombat(c);await expect(carte.getByText(/Récupération de Santé interdite : Déshydraté/).first()).toBeVisible();await expect(carte.locator('[data-survie-alien]')).toBeVisible();
}

/** A4 : ancien Stress ignoré, D6 aggravé, Arrêt puis deux interventions distinctes. */
async function sceneDuSynthetiqueAlien(c: ContexteDeScene): Promise<void> {
    const f = gmos.fenetre;
    await ecrireLaFiche(c, { androide: true, force: 4, agilite: 4, combat_rapproche: 2, sante: 4, niveau_de_stress: 5, panique_en_cours: 0,
        _gmos_combat_alien: { version: 1, temps: {round:0,tour:0,quart:0,jour:0}, critiques: [], blessureTraitee: [], blessures: [], mort: false, armes: {} } });
    await vue(c.campagne, 'players', {joueur:JOUEUR,personnage:c.personnage});
    let panneau = f.locator('[data-panneau-de-jet]').first(), sante = panneau.locator('[data-sante-alien]');
    for (const [i, champ] of ['force','combat_rapproche','niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
    const hasard = async (n: number, action: () => Promise<void>) => {
        await f.evaluate(n => {const w=window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;Math.random=()=>n;},n);
        try { await action(); } finally { await f.evaluate(()=>{Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;}); }
    };
    const lire = () => f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData!, c.personnage);
    await hasard(0,()=>panneau.getByRole('button',{name:'Lancer',exact:true}).click());
    expect((await lire()).niveau_de_stress).toBe(5);
    await expect(panneau.getByText(/0 de Stress/).first()).toBeVisible();
    await expect(panneau.getByRole('button',{name:'Test de Panique',exact:true})).toHaveCount(0);
    await expect(panneau.getByRole('button',{name:/Forcer le jet/})).toBeDisabled();
    await sante.getByLabel('Dégâts entrants').fill('4'); await sante.getByLabel('Dégâts d’une attaque (armure applicable)').uncheck();
    await sante.getByRole('button',{name:'Préparer ce coup'}).click();
    await sante.getByRole('button',{name:'Lancer la Protection'}).click(); await sante.getByRole('button',{name:'Appliquer les dégâts restants'}).click();
    await expect(panneau.getByRole('button',{name:'Lancer',exact:true})).toBeEnabled();
    await hasard(0.55, async()=>{await sante.getByRole('button',{name:'Tirer le prochain critique synthétique (D6)'}).click();await expect(sante.getByText('4 — Dislocation de la tête')).toBeVisible();});
    // Deuxième coup à zéro, même D6 : 4 devient 5, sans détruire le premier reçu.
    await sante.getByLabel('Dégâts entrants').fill('1'); await sante.getByRole('button',{name:'Préparer ce coup'}).click();
    await sante.getByRole('button',{name:'Lancer la Protection'}).click(); await sante.getByRole('button',{name:'Appliquer les dégâts restants'}).click();
    await hasard(0.55, async()=>{await sante.getByRole('button',{name:'Tirer le prochain critique synthétique (D6)'}).click();await expect(sante.getByText('5 — Grave rupture du châssis')).toBeVisible();});
    await photographier(sante.locator('[data-synthetique-alien]'),'jeu-alien-a4-avaries');
    // Un troisième coup provoque l'Arrêt du système.
    await sante.getByRole('button',{name:'Préparer ce coup'}).click();await sante.getByRole('button',{name:'Lancer la Protection'}).click();await sante.getByRole('button',{name:'Appliquer les dégâts restants'}).click();
    await hasard(0.99,async()=>{await sante.getByRole('button',{name:'Tirer le prochain critique synthétique (D6)'}).click();await expect(sante.getByText('6 — Arrêt du système')).toBeVisible();});
    await expect(panneau.getByRole('button',{name:'Lancer',exact:true})).toBeDisabled();
    await sante.getByLabel('Source d’énergie disponible').check();await sante.getByRole('button',{name:'Commencer la réactivation (un Tour)'}).click();
    await sante.getByLabel('Réussites de Comtech validées').fill('1');await sante.getByLabel('Trauma mental permanent choisi avec Maman').fill('Mémoire fragmentée — validée par Maman');
    await expect(sante.getByRole('button',{name:'Appliquer le résultat de Comtech'})).toBeDisabled();
    await sante.getByRole('button',{name:'Valider un tour',exact:true}).click();await sante.getByRole('button',{name:'Appliquer le résultat de Comtech'}).click();expect((await lire()).sante).toBe(0);
    await sante.getByRole('button',{name:'Commencer la réparation (un Quart)'}).click();
    await f.waitForTimeout(750);await f.reload();await attendreLHydratation(gmos);await vue(c.campagne,'players',{joueur:JOUEUR,personnage:c.personnage});
    panneau=f.locator('[data-panneau-de-jet]').first();sante=panneau.locator('[data-sante-alien]');
    await expect(sante.getByText(/Réparation en cours/)).toBeVisible();
    // Les réglages du prochain jet sont locaux au panneau et se choisissent à nouveau après fermeture.
    for (const [i, champ] of ['force','combat_rapproche','niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
    await photographier(sante.locator('[data-synthetique-alien]'),'jeu-alien-a4-reactivation');
    const nav=await chromium.launch({channel:'msedge',args:['--mute-audio']});
    try {
        const ctx=await nav.newContext({viewport:{width:360,height:1200},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',storageState:stockageTabletteAlien});
        await ctx.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
        const t=await ctx.newPage();await t.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);await expect(t.getByText('Connecté',{exact:true})).toBeVisible();await t.getByTitle('Fiche Personnage',{exact:true}).click();
        const suivi=t.locator('[data-synthetique-alien]'); await expect(suivi.getByText(/Réparation en cours/)).toBeVisible();
        await expect(suivi.getByText('6 — Arrêt du système')).toBeVisible();await expect(suivi.getByRole('button')).toHaveCount(0);
        for(const largeur of [360,768,1180]) {await t.setViewportSize({width:largeur,height:1200});expect(await t.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await photographier(suivi,`jeu-alien-a4-tablette-${largeur}`);}
        await sante.getByRole('button',{name:'Valider un quart',exact:true}).click();await sante.getByLabel('Réussites de Comtech validées').fill('1');await sante.getByRole('button',{name:'Appliquer le résultat de Comtech'}).click();
        expect((await lire()).sante).toBe(4);expect((await lire()).niveau_de_stress).toBe(5);
        await expect(suivi.getByText('6 — Arrêt du système')).toHaveCount(0);await expect(suivi.getByText(/Trauma mental permanent : Mémoire fragmentée/)).toBeVisible();
        await expect(panneau.getByRole('button',{name:'Lancer',exact:true})).toBeEnabled();
    } finally {await nav.close();}
    const carte=await entrerEnCombat(c);await expect(carte.locator('[data-sante-alien]').getByText(/Santé synthétique : 4/)).toBeVisible();
}

/** A3 : tir auto, vraie protection puis critique humain et soins séparés, sur profil jetable. */
async function sceneDuCombatAlien(c: ContexteDeScene): Promise<void> {
    const f = gmos.fenetre;
    await ecrireLaFiche(c,{force:4,agilite:4,endurance:2,combat_a_distance:2,sante:4,niveau_de_stress:0,panique_en_cours:0,talent:'Rechargement rapide',
        'field-1786783108730':'Fusil de démonstration',armes_bonus:'+1',armes_degats:'2',armes_portees:'Longue',armes_proprietes:'Munitions, mode auto, perce-armure',
        'field-1786783170092':'5',_gmos_combat_alien:{version:1,temps:{round:0,tour:0,quart:0,jour:0},critiques:[],blessureTraitee:[],blessures:[],mort:false,armes:{}}});
    await f.waitForTimeout(750); await f.reload(); await attendreLHydratation(gmos); await vue(c.campagne,'players',{joueur:JOUEUR,personnage:c.personnage});
    let panneau = f.locator('[data-panneau-de-jet]').first();
    for (const [i,champ] of ['agilite','combat_a_distance','niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
    await panneau.getByLabel('Arme de la fiche').selectOption('0');
    await panneau.getByLabel('Chargeurs complets réellement portés').fill('2');
    await panneau.getByRole('button',{name:'Confirmer l’état initial du chargeur'}).click();
    await panneau.getByLabel(/Visée préalable/).check(); await panneau.getByLabel(/Mode automatique/).check();
    await f.evaluate(() => { const w = window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;
        const d=[0.99,0.99,0.99,0.99,...Array(7).fill(0.2),0];Math.random=()=>d.shift()??0.2; });
    try { await panneau.getByRole('button',{name:'Lancer',exact:true}).click(); }
    finally { await f.evaluate(() => {Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;}); }
    const lire = () => f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData!,c.personnage);
    expect((await lire()).niveau_de_stress).toBe(1);
    expect(((await lire())._gmos_combat_alien as {armes:Record<string,{vide:boolean}>}).armes['0'].vide).toBe(false);
    await f.evaluate(() => { const w=window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;Math.random=()=>0; });
    try { await panneau.getByRole('button',{name:'Test de Panique',exact:true}).click(); }
    finally { await f.evaluate(() => {Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;}); }
    expect(((await lire())._gmos_combat_alien as {armes:Record<string,{vide:boolean}>}).armes['0'].vide).toBe(true);
    await panneau.getByLabel(/Cible secondaire à Courte portée/).fill('Adversaire B');
    await panneau.getByRole('button',{name:'Affecter un six à cette cible'}).click();
    await panneau.getByLabel('Cible des prochains éclats').selectOption('Adversaire B');
    await panneau.getByRole('button',{name:'Dégâts +1',exact:true}).click();
    await expect(panneau.getByText('Adversaire B : 3 dégâts préparés avant protection.')).toBeVisible();
    await photographier(panneau.locator('[data-suites-alien]'),'jeu-alien-a3-rafale');
    await panneau.getByRole('button',{name:'Recharger — action rapide'}).click();
    await expect(panneau.getByRole('button',{name:'Recharger — action rapide'})).toBeDisabled();
    await photographier(panneau.locator('[data-munitions-alien]'),'jeu-alien-a3-chargeurs');
    let sante = panneau.locator('[data-sante-alien]');
    await sante.getByLabel('Dégâts entrants').fill('5'); await sante.getByLabel('Protection d’un abri préalable').fill('2');
    await sante.getByLabel('Propriété contre la protection').selectOption('perce-armure');
    await sante.getByRole('button',{name:'Préparer ce coup'}).click();
    await f.evaluate(() => { const w=window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;const d=[0.99,0.2,0.2,0.2];Math.random=()=>d.shift()??0.2; });
    try { await sante.getByRole('button',{name:'Lancer la Protection'}).click(); }
    finally { await f.evaluate(() => {Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;}); }
    await sante.getByRole('button',{name:'Appliquer les dégâts restants'}).click();
    expect((await lire()).sante).toBe(0); expect((await lire()).niveau_de_stress).toBe(2);
    await expect(panneau.getByRole('button',{name:'Lancer',exact:true})).toBeDisabled();
    await photographier(sante.locator('[data-coup-alien]'),'jeu-alien-a3-protection');
    await f.waitForTimeout(750); await f.reload(); await attendreLHydratation(gmos); await vue(c.campagne,'players',{joueur:JOUEUR,personnage:c.personnage});
    panneau=f.locator('[data-panneau-de-jet]').first();sante=panneau.locator('[data-sante-alien]');
    await expect(sante.getByRole('button',{name:'Appliquer les dégâts restants'})).toBeDisabled();
    await f.evaluate(() => {const w=window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;Math.random=()=>0.55;});
    try { await sante.getByRole('button',{name:'Tirer ce critique humain (D66)'}).click(); await expect(sante.getByText('44 — Poumon perforé')).toBeVisible(); }
    finally { await f.evaluate(() => {Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;}); }
    await sante.getByLabel('Réussites de Soins médicaux validées').fill('2'); await sante.getByLabel(/Soignant \(/).fill('Lambert');
    await sante.getByRole('button',{name:'Relever par premiers soins'}).click(); expect((await lire()).sante).toBe(2);
    await sante.getByRole('button',{name:'Valider un jour',exact:true}).click();
    await f.evaluate(() => {const w=window as unknown as {hasardAlien?:()=>number};w.hasardAlien=Math.random;Math.random=()=>0.99;});
    try { await sante.getByRole('button',{name:'Tester le Trépas (sans Stress)'}).click(); }
    finally { await f.evaluate(() => {Math.random=(window as unknown as {hasardAlien:()=>number}).hasardAlien;}); }
    await expect(sante.getByRole('button',{name:'Tester le Trépas (sans Stress)'})).toHaveCount(0);
    await sante.getByLabel('Réussites de Soins médicaux validées').fill('0');
    await sante.getByRole('button',{name:/Stabiliser — malus 0/}).click();
    await expect(sante.getByRole('button',{name:/Stabiliser — malus 0/})).toBeDisabled();
    await sante.getByLabel(/Qualité du matériel/).fill('1'); await sante.getByLabel('Réussites de Soins médicaux validées').fill('1');
    await sante.getByRole('button',{name:/Stabiliser — malus 0/}).click();
    await sante.getByRole('button',{name:'Soins quotidiens réussis : durée ÷2'}).click();
    await expect(sante.getByRole('button',{name:'Soins quotidiens réussis : durée ÷2'})).toBeDisabled();
    await sante.getByRole('button',{name:'Un Tour de repos écoulé : Santé +1'}).click(); expect((await lire()).sante).toBe(3);
    await expect(sante.getByText(/Guérison restante : 1.5 jour/)).toBeVisible();
    await photographier(sante.locator('[data-blessure-alien]'),'jeu-alien-a3-soins');
    const carte = await entrerEnCombat(c);
    await expect(carte.locator('[data-sante-alien]').getByText('44 — Poumon perforé')).toBeVisible();
    await expect(carte.locator('[data-sante-alien]').getByText(/Santé : 3\./)).toBeVisible();
    await expect(carte.getByRole('button',{name:'Tirer ce critique humain (D66)'})).toHaveCount(0);
    expect(stockageTabletteAlien).toBeDefined();
    const nav=await chromium.launch({channel:'msedge',args:['--mute-audio']});
    try {
        const ctx=await nav.newContext({viewport:{width:360,height:1000},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',storageState:stockageTabletteAlien});
        await ctx.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
        // Reprendre l'identité ET son secret local de la scène A1, comme le même navigateur rouvert.
        const t=await ctx.newPage(); await t.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
        await expect(t.getByText('Connecté',{exact:true})).toBeVisible();
        await t.getByTitle('Fiche Personnage',{exact:true}).click(); const suivi=t.locator('[data-sante-alien]');
        await expect(suivi.getByText('44 — Poumon perforé')).toBeVisible(); await expect(suivi.getByRole('button')).toHaveCount(0);
        for(const largeur of [360,768,1180]) {await t.setViewportSize({width:largeur,height:1000});expect(await t.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await photographier(suivi,`jeu-alien-a3-tablette-${largeur}`);}
    } finally {await nav.close();}
}

/** A2 : équipement réel, opposition, dépenses persistantes et malus sur le Stress. */
async function sceneDesJetsAlien(c: ContexteDeScene): Promise<void> {
    const f = gmos.fenetre;
    await ecrireLaFiche(c, { force: 5, combat_rapproche: 5, niveau_de_stress: 3, panique_en_cours: 0,
        'field-1786783108730': 'Fusil de démonstration', armes_bonus: '+2', armes_degats: '2', armes_portees: 'Longue' });
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    let panneau = f.locator('[data-panneau-de-jet]').first();
    const fermerContagion = panneau.getByRole('button', { name: 'Aucun autre personnage concerné' });
    while (await fermerContagion.count()) await fermerContagion.first().click();
    for (const [i, champ] of ['force', 'combat_rapproche', 'niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
    await panneau.getByLabel('Arme de la fiche').selectOption('0');
    await panneau.getByLabel('Personnes qui aident').selectOption('3');
    await panneau.getByLabel('Rôle dans le test').selectOption('attaquant');
    await f.evaluate(() => { const w = window as unknown as { hasardAlien?: () => number }; w.hasardAlien = Math.random;
        const d = [0.99, 0.99, 0.99, 0.99]; Math.random = () => d.shift() ?? 0.2; });
    try { await panneau.getByRole('button', { name: 'Lancer', exact: true }).click(); }
    finally { await f.evaluate(() => { Math.random = (window as unknown as { hasardAlien: () => number }).hasardAlien; }); }
    await expect(panneau.getByText(/→ 15 dés de base, 3 de Stress/).first()).toBeVisible();
    await expect(panneau.getByRole('button', { name: 'Dégâts +1', exact: true })).toBeDisabled();
    await panneau.getByLabel('Réussites du défenseur').fill('1');
    await panneau.getByRole('button', { name: 'Résoudre l’opposition' }).click();
    await expect(panneau.getByText('Actions d’éclat disponibles : 2.')).toBeVisible();
    await panneau.getByRole('button', { name: 'Dégâts +1', exact: true }).click();
    await expect(panneau.getByText(/Dégâts préparés : 2 \+ 1 = 3/)).toBeVisible();
    await expect(panneau.getByRole('button', { name: /Forcer le jet/ })).toBeDisabled();
    await photographier(panneau.locator('[data-preparation-alien]'), 'jeu-alien-a2-preparation');
    await photographier(panneau.locator('[data-suites-alien]'), 'jeu-alien-a2-opposition');
    await f.waitForTimeout(750); await f.reload(); await attendreLHydratation(gmos);
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    panneau = f.locator('[data-panneau-de-jet]').first();
    await expect(panneau.getByText('Actions d’éclat disponibles : 1.')).toBeVisible();
    await panneau.getByRole('button', { name: 'Désarmer', exact: true }).click();
    await expect(panneau.getByText('Actions d’éclat disponibles : 0.')).toBeVisible();
    await expect(panneau.getByRole('button', { name: 'Dégâts +1', exact: true })).toBeDisabled();
    await photographier(panneau.locator('[data-suites-alien]'), 'jeu-alien-a2-reprise');
    await ecrireLaFiche(c, { force: 2, combat_rapproche: 0, niveau_de_stress: 3 });
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    panneau = f.locator('[data-panneau-de-jet]').first();
    for (const [i, champ] of ['force', 'combat_rapproche', 'niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
    await panneau.getByLabel('Modificateur de situation').fill('-4');
    await expect(panneau.getByText(/→ 0 dés de base, 1 de Stress/).first()).toBeVisible();
    await panneau.getByLabel('Modificateur de situation').fill('-5');
    await expect(panneau.getByRole('button', { name: 'Lancer', exact: true })).toBeDisabled();
    await expect(panneau.getByText(/Aucun dé ne reste/)).toBeVisible();
    await photographier(panneau.locator('[data-preparation-alien]'), 'jeu-alien-a2-malus');
}

/** Le vrai Hub et son transport : verdict, écriture de fiche et reprise à trois tailles. */
async function sceneDePaniqueAlienTablette(c: ContexteDeScene): Promise<void> {
    const f = gmos.fenetre;
    await f.evaluate(({ campagne, personnage }) => {
        const s = (window as unknown as Fenetre).useSessionOSStore;
        s.setState(etat => ({ sessions: [{ ...etat.sessions[0], id: 'alien-seance-a1', campaignId: campagne,
            status: 'active', sessionEntityIds: [personnage, 'alien-ami-a1'], publicSummary: '' }] }));
        const joueur = s.getState().players.find(p => p.characters.some(x => x.id === personnage))!;
        const pj = joueur.characters.find(x => x.id === personnage)!;
        s.getState().updateCharacter(joueur.id, personnage, { sheetData: { ...pj.sheetData, niveau_de_stress: 4,
            panique_en_cours: 0, _gmos_panique_alien: { version: 1, traites: [], demandes: [], historique: [], traumaEnAttente: false, traumatismes: [] } } });
    }, { campagne: c.campagne, personnage: c.personnage });
    const navigateur = await chromium.launch({ channel: 'msedge', args: ['--mute-audio'] });
    try {
        const contexte = await navigateur.newContext({ viewport: { width: 360, height: 1000 }, hasTouch: true,
            isMobile: true, locale: 'fr-FR', serviceWorkers: 'block', reducedMotion: 'reduce' });
        await contexte.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 'alien-a1-tablette'));
        await contexte.route('**/*', route => {
            const url = new URL(route.request().url());
            return url.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
        });
        const tablette = await contexte.newPage();
        await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
        await tablette.getByRole('button', { name: new RegExp(c.nom) }).click();
        await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
        await tablette.getByTitle('Fiche Personnage', { exact: true }).click();
        let panneau = tablette.locator('[data-panneau-de-jet]').first();
        for (const [i, champ] of ['force', 'combat_rapproche', 'niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
        await tablette.evaluate(() => {
            const w = window as unknown as { hasardAlien?: () => number }; w.hasardAlien = Math.random;
            const tirages = [0.99, 0.99, 0.2, 0.2, 0.2, 0.2, 0, 0.2, 0.2, 0.2];
            Math.random = () => tirages.shift() ?? 0.2;
        });
        await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
        await expect(panneau.getByText(/Résultat provisoire/)).toBeVisible();
        await tablette.evaluate(() => { Math.random = () => 0.99; });
        await panneau.getByRole('button', { name: 'Test de Panique', exact: true }).click();
        await tablette.evaluate(() => { Math.random = (window as unknown as { hasardAlien: () => number }).hasardAlien; });
        await expect(panneau.getByText('Figé (10)', { exact: true })).toBeVisible();
        await expect(panneau.getByText(/Action annulée :/)).toBeVisible();
        await expect(panneau.getByRole('button', { name: /Dépenser un Point de Récit/ })).toBeDisabled();
        await expect(panneau.getByText(/Contagion : choisir/)).toHaveCount(0);
        const lire = () => f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().players
            .flatMap(p => p.characters).find(x => x.id === id)!.sheetData!, c.personnage);
        await expect.poll(async () => (await lire()).niveau_de_stress).toBe(5);
        await expect.poll(async () => (await lire()).panique_en_cours).toBe(10);
        for (const largeur of [360, 768, 1180]) {
            await tablette.setViewportSize({ width: largeur, height: 1000 });
            await expect.poll(() => tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await panneau.screenshot({ path: path.join(SORTIE, `jeu-alien-panique-tablette-${largeur}.jpg`), type: 'jpeg', quality: 82 });
        }
        await tablette.reload();
        await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
        await tablette.getByTitle('Fiche Personnage', { exact: true }).click();
        panneau = tablette.locator('[data-panneau-de-jet]').first();
        await expect(panneau.getByText('Figé (10)', { exact: true })).toBeVisible();
        expect((await lire()).niveau_de_stress).toBe(5);
        if ((c.pilote.gameDriver as { jet?: { alien?: unknown } }).jet?.alien) {
            await ecrireLaFiche(c, { niveau_de_stress: 0, panique_en_cours: 0, 'field-1786783108730': 'Pistolet de test', armes_bonus: '+2', armes_degats: '2', armes_portees: 'Moyenne' });
            await tablette.reload(); await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
            await tablette.getByTitle('Fiche Personnage', { exact: true }).click();
            panneau = tablette.locator('[data-panneau-de-jet]').first();
            for (const [i, champ] of ['force', 'combat_rapproche', 'niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
            await tablette.setViewportSize({ width: 360, height: 1000 });
            await panneau.getByLabel('Arme de la fiche').selectOption('0');
            await tablette.evaluate(() => { const w = window as unknown as { hasardAlien?: () => number }; w.hasardAlien = Math.random;
                const d = [0.99, 0.99]; Math.random = () => d.shift() ?? 0.2; });
            try { await panneau.getByRole('button', { name: 'Lancer', exact: true }).click(); }
            finally { await tablette.evaluate(() => { Math.random = (window as unknown as { hasardAlien: () => number }).hasardAlien; }); }
            await panneau.getByRole('button', { name: 'Dégâts +1', exact: true }).click();
            await expect.poll(async () => ((await lire())._gmos_jet_alien as { eclats: unknown[] })?.eclats.length).toBe(1);
            for (const largeur of [360, 768, 1180]) {
                await tablette.setViewportSize({ width: largeur, height: 1000 });
                expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                const suites = panneau.locator('[data-suites-alien]');
                await suites.scrollIntoViewIfNeeded();
                await suites.screenshot({ path: path.join(SORTIE, `jeu-alien-a2-tablette-${largeur}.jpg`), type: 'jpeg', quality: 82 });
            }
            await tablette.reload(); await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
            await tablette.getByTitle('Fiche Personnage', { exact: true }).click();
            panneau = tablette.locator('[data-panneau-de-jet]').first();
            await expect(panneau.getByText('Actions d’éclat disponibles : 0.')).toBeVisible();
            await expect(panneau.getByRole('button', { name: 'Dégâts +1', exact: true })).toBeDisabled();
        }
        stockageTabletteAlien = await contexte.storageState();
    } finally { await navigateur.close(); }
}

/** A0/A1 : vrais composants, export de David, personnages et profil jetables. */
async function scenesDePaniqueAlien(c: ContexteDeScene): Promise<void> {
    const f = gmos.fenetre;
    await f.evaluate(({ personnage, campagne }) => {
        const s = (window as unknown as Fenetre).useSessionOSStore;
        const joueur = s.getState().players.find(p => p.characters.some(x => x.id === personnage))!;
        const pj = joueur.characters.find(x => x.id === personnage)!;
        s.getState().updateCharacter(joueur.id, personnage, { sheetData: { ...pj.sheetData,
            force: 4, sante: 4, empathie: 2, niveau_de_stress: 4, panique_en_cours: 0,
            _gmos_panique_alien: { version: 1, traites: [], demandes: [], historique: [], traumaEnAttente: false, traumatismes: [] },
        } });
        s.setState(etat => ({ players: etat.players.map(p => p.id === joueur.id ? { ...p, characters: [...p.characters, {
            id: 'alien-ami-a1', name: 'Lambert — amie de test', portraitUrl: '', campaignId: campagne,
            templateId: pj.templateId, sheetData: { niveau_de_stress: 2, force: 3, sante: 3 },
        }] } : p) }));
    }, { personnage: c.personnage, campagne: c.campagne });
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    let panneau = f.locator('[data-panneau-de-jet]').first();
    for (const [i, champ] of ['force', 'combat_rapproche', 'niveau_de_stress'].entries()) await panneau.locator('select').nth(i).selectOption(champ);
    await f.evaluate(() => {
        const w = window as unknown as { hasardAlien?: () => number };
        w.hasardAlien = Math.random;
        const tirages = [0.99, 0.99, 0.2, 0.2, 0.2, 0.2, 0, 0.2, 0.2, 0.2];
        Math.random = () => tirages.shift() ?? 0.2;
    });
    try {
        await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
        await expect(panneau.getByText(/Résultat provisoire/)).toBeVisible();
        await expect(panneau.getByRole('button', { name: /Dépenser un Point de Récit/ })).toBeDisabled();
        await photographierLePanneau(panneau, 'jeu-alien-provisoire');
        await f.evaluate(() => { Math.random = () => 0.99; });
        await panneau.getByRole('button', { name: 'Test de Panique', exact: true }).click();
        await expect(panneau.getByText(/Action annulée :/)).toBeVisible();
        await expect(panneau.getByText('Figé (10)', { exact: true })).toBeVisible();
        await panneau.getByRole('checkbox',{name:'Lambert — amie de test',exact:true}).check();
        await panneau.getByRole('button', { name: 'Appliquer la contagion de Figé' }).click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players
            .flatMap(p => p.characters).find(x => x.id === 'alien-ami-a1')?.sheetData?.niveau_de_stress)).toBe(3);
        await photographierLePanneau(panneau, 'jeu-alien-action-annulee');
    } finally {
        await f.evaluate(() => { const w = window as unknown as { hasardAlien?: () => number }; if (w.hasardAlien) Math.random = w.hasardAlien; });
    }
    await f.waitForTimeout(750); // Laisser se terminer la persistance asynchrone du profil jetable.
    await f.reload();
    await attendreLHydratation(gmos);
    await vue(c.campagne, 'players', { joueur: JOUEUR, personnage: c.personnage });
    panneau = f.locator('[data-panneau-de-jet]').first();
    await expect(panneau.getByText('Figé (10)', { exact: true })).toBeVisible();
    const lireStress = () => f.evaluate(({ id }) => (window as unknown as Fenetre).useSessionOSStore.getState().players
        .flatMap(p => p.characters).find(x => x.id === id)?.sheetData?.niveau_de_stress, { id: c.personnage });
    expect(await lireStress()).toBe(5);
    await expect(panneau.getByRole('button', { name: 'Appliquer la contagion de Figé' })).toHaveCount(0);
    await panneau.getByRole('button', { name: 'Round et action résolus' }).click();
    expect(await lireStress()).toBe(5);
    await panneau.getByRole('button', { name: 'Demander un test de Panique' }).click();
    // Stress 5 + un dé de 1 = 6 ; précédent terminé, donc pas de cumul.
    await f.evaluate(() => { const w = window as unknown as { hasardAlien?: () => number }; w.hasardAlien = Math.random; Math.random = () => 0; });
    try { await panneau.getByRole('button', { name: 'Résoudre cette Panique' }).click(); }
    finally { await f.evaluate(() => { const w = window as unknown as { hasardAlien?: () => number }; if (w.hasardAlien) Math.random = w.hasardAlien; }); }
    await expect(panneau.getByRole('button', { name: 'Résoudre cette Panique' })).toHaveCount(0);
    await photographierLePanneau(panneau, 'jeu-alien-suivi-panique');
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
