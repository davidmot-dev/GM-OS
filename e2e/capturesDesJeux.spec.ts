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
}

const MISES_EN_SCENE: MiseEnScene[] = [
    {
        corpusId: 'noc', slug: 'noc', personnage: 'Ilya Vorn',
        sheetData: { combat: 2, action: 3, vie: 2, vecu: 2, espoir: 3, singularite: 1, trauma: 2 },
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
    },
    {
        corpusId: 'blade-runner', slug: 'blade-runner', personnage: 'Agent Kessler',
        sheetData: { vigueur: 'B', corpsACorps: 'C', sante: 8, sangFroid: 6 },
        composantes: ['vigueur', 'corpsACorps'],
    },
    {
        corpusId: 'cthulhu hack', slug: 'cthulhu-hack', personnage: 'Edith Marsh',
        sheetData: { force: 13, sagesse: 15, hp: 9, torche: 'd8', bagou: 'd6', mentalHealth: 'd10', richesse: 'd4' },
        composantes: ['sagesse'],
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
    },
];

interface Seuil { aPartirDe: number; label: string; etat?: string }
interface Pilote {
    gameDriver: {
        id: string; name: string; corpusId?: string; templateId: string; ressourcesDeTable?: unknown[]; ficheDeGroupe?: unknown;
        combat?: { casesDeSante?: { nombre: number; seuils?: Seuil[]; libelle?: string; champ?: string } };
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
    });
}
