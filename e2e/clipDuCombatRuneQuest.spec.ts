import { test, expect, type Locator } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';

/**
 * **Le clip du combat de RuneQuest** — demandé par David le 2026-11-03 : *« un petit clip
 * vidéo avec Playwright pour me montrer exactement comment fonctionnent les combats avec le
 * driver de RuneQuest »*.
 *
 * Une instance JETABLE (`lancerGmOs`), le pilote 2.2.0 de `Export Dirvers/corriges/` (ou
 * `GMOS_PILOTE_RUNEQUEST`), Vasana du livre (p. 52-57) contre un broo, Yanioth en renfort.
 * Les dés sont imposés pour que le clip montre à coup sûr une spéciale parée puis un critique.
 * Un curseur et des légendes sont posés par-dessus l'application, le temps du film.
 *
 *   npm run build
 *   npx playwright test e2e/clipDuCombatRuneQuest.spec.ts --reporter=list
 *
 * Le film sort dans `output/clips/` (ou `GMOS_SORTIE_CLIP`) : `.webm`, et `.mp4` si ffmpeg répond.
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PILOTE = path.resolve(process.env.GMOS_PILOTE_RUNEQUEST
    ?? path.join(ICI, '..', 'Export Dirvers', 'corriges', 'RQ_driver_gmos_finir.gmos-driver'));
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? path.join(ICI, '..', 'output', 'clips'));
const DEMO = path.join(ICI, 'donnees', 'campagne-de-demo.json');
const LARGEUR = 1440, HAUTEUR = 900;

const CAMPAGNE = 'clip-runequest', JOUEUR = 'clip-joueuse', VASANA = 'clip-vasana';

const FICHE_DE_VASANA = {
    nom: 'Vasana', patrie: 'Sartar', occupation: 'Guerrière', culte: 'Orlanth Aventureux', clan_tribu: 'Clan Ernaldori',
    for: 16, con: 12, tai: 10, dex: 11, int: 15, pou: 15, cha: 19,
    pv_max: 12, pm_max: 15, pr_max: 3, bonus_degats: '+1D4', ra_dex: 3, ra_tai: 2,
    arme1_nom: 'Épée large', arme1: 65, arme1_degats: '1D8+1', arme1_ra: 7,
    tir1_nom: 'Arc composite', tir1: 45, tir1_degats: '1D8+1', tir1_ra: 3,
    bouclier_nom: 'Bouclier moyen', bouclier: 55, esquive: 22,
    pv_jambe_droite: 4, pv_jambe_gauche: 4, pv_abdomen: 4, pv_poitrine: 5, pv_bras_droit: 3, pv_bras_gauche: 3, pv_tete: 4,
    pa_jambe_droite: 2, pa_jambe_gauche: 2, pa_abdomen: 3, pa_poitrine: 3, pa_bras_droit: 2, pa_bras_gauche: 2, pa_tete: 2,
    points_de_vie: 12, points_de_magie: 15, points_de_rune: 3,
};

/** Le broo : DEX 9, une hache, un bouclier, deux points d'armure partout. */
const FICHE_DU_BROO = {
    nom: 'Broo', for: 14, con: 12, tai: 13, dex: 9, pou: 10, ra_dex: 3, ra_tai: 1,
    arme1_nom: 'Hache de bataille', arme1: 50, arme1_degats: '1D8+2', arme1_ra: 9,
    bouclier_nom: 'Bouclier moyen', bouclier: 40,
    pv_jambe_droite: 4, pv_jambe_gauche: 4, pv_abdomen: 4, pv_poitrine: 5, pv_bras_droit: 3, pv_bras_gauche: 3, pv_tete: 4,
    pa_jambe_droite: 2, pa_jambe_gauche: 2, pa_abdomen: 2, pa_poitrine: 2, pa_bras_droit: 2, pa_bras_gauche: 2, pa_tete: 2,
    points_de_vie: 12,
};

/** Yanioth, l'initiée d'Ernalda : DEX 13, de la magie spirituelle. */
const FICHE_DE_YANIOTH = { nom: 'Yanioth', dex: 13, tai: 11, ra_dex: 2, ra_tai: 2, pou: 17, points_de_vie: 12 };

type Fenetre = { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore };

let gmos: GmOsLance;

test.skip(!fs.existsSync(PILOTE), `pilote RuneQuest absent : « ${PILOTE} »`);

function ecrireLaSemence(): string {
    const { gameDriver, sheetTemplate } = JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync(DEMO, 'utf8'));
    const s = semence.modules.sessionOS;
    s.campaigns.push({ id: CAMPAGNE, name: 'La passe du Dragon', system: gameDriver.id, description: 'Campagne fictive du clip.', activeLocationIds: [] });
    s.customGameDrivers.push(gameDriver);
    if (sheetTemplate) s.customSheetTemplates.push(sheetTemplate);
    s.players.push({
        id: JOUEUR, realName: 'Joueuse', avatarUrl: '', isOnline: false,
        characters: [{ id: VASANA, name: 'Vasana', portraitUrl: '', campaignId: CAMPAGNE, templateId: gameDriver.templateId,
            systemId: gameDriver.id, hp: 12, maxHp: 12, sheetData: FICHE_DE_VASANA }],
    });
    const chemin = path.join(os.tmpdir(), `gmos-semence-clip-rq-${process.pid}.json`);
    fs.writeFileSync(chemin, JSON.stringify(semence));
    return chemin;
}

// ---- Ce qui se pose par-dessus l'application, le temps du film --------------------

function installerLaScene(): void {
    if (document.getElementById('clip-legende')) return;
    const st = document.createElement('style');
    st.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:3px solid #f5c542;animation:clip-onde .45s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #f5c542;border-radius:10px;box-shadow:0 0 22px rgba(245,197,66,.7);opacity:0;transition:opacity .25s}
      #clip-legende{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);width:max-content;max-width:1180px;z-index:2147483645;pointer-events:none;
        background:rgba(12,10,8,.9);color:#fff;font:600 23px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:14px;
        border:1px solid rgba(245,197,66,.7);box-shadow:0 10px 34px rgba(0,0,0,.55);opacity:0;transition:opacity .35s}
      #clip-legende small{display:block;font-weight:400;font-size:17px;color:#f3d98e;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#f5c542;color:#1a1408;
        font:800 15px 'Segoe UI',system-ui,sans-serif;padding:6px 16px;border-radius:999px;letter-spacing:.06em;text-transform:uppercase;opacity:0;transition:opacity .35s}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
        background:radial-gradient(circle at 50% 40%,#3a2a10 0%,#0d0a06 70%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .6s}
      #clip-titre h1{font-size:54px;font-weight:800;margin:0;color:#f5c542;letter-spacing:.02em}
      #clip-titre p{font-size:24px;margin:0;color:#eadbb8;max-width:1000px;line-height:1.4}
    `;
    document.head.appendChild(st);
    const curseur = document.createElement('div');
    curseur.id = 'clip-curseur';
    curseur.innerHTML = '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 16 L21 16 Z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>';
    document.body.appendChild(curseur);
    document.addEventListener('mousemove', e => { curseur.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 2}px)`; }, true);
    document.addEventListener('mousedown', () => { curseur.classList.remove('clic'); void curseur.offsetWidth; curseur.classList.add('clic'); }, true);
    for (const id of ['clip-anneau', 'clip-legende', 'clip-chapitre', 'clip-titre']) {
        const d = document.createElement('div');
        d.id = id;
        document.body.appendChild(d);
    }
}

const pause = (ms: number) => gmos.fenetre.waitForTimeout(ms);

async function legende(texte: string, detail = '', duree = 0): Promise<void> {
    await gmos.fenetre.evaluate(({ texte, detail }) => {
        const l = document.getElementById('clip-legende')!;
        l.innerHTML = '';
        l.append(texte);
        if (detail) { const s = document.createElement('small'); s.textContent = detail; l.appendChild(s); }
        l.style.opacity = texte ? '1' : '0';
    }, { texte, detail });
    if (duree) await pause(duree);
}

async function chapitre(texte: string): Promise<void> {
    await gmos.fenetre.evaluate(texte => {
        const c = document.getElementById('clip-chapitre')!;
        c.textContent = texte;
        c.style.opacity = texte ? '1' : '0';
    }, texte);
}

async function titre(grand: string, lignes: string[], duree: number): Promise<void> {
    await gmos.fenetre.evaluate(({ grand, lignes }) => {
        const t = document.getElementById('clip-titre')!;
        t.innerHTML = '';
        const h = document.createElement('h1');
        h.textContent = grand;
        t.appendChild(h);
        for (const l of lignes) { const p = document.createElement('p'); p.textContent = l; t.appendChild(p); }
        t.style.opacity = '1';
    }, { grand, lignes });
    await pause(duree);
    await gmos.fenetre.evaluate(() => { document.getElementById('clip-titre')!.style.opacity = '0'; });
    await pause(700);
}

/** Le curseur glisse jusqu'à l'élément, qui s'entoure d'or. */
async function viser(cible: Locator, attente = 450): Promise<void> {
    // Au centre : la légende occupe le bas de l'écran.
    await cible.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await pause(150);
    const boite = await cible.boundingBox();
    if (!boite) return;
    await gmos.fenetre.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2, { steps: 28 });
    await gmos.fenetre.evaluate(b => {
        const a = document.getElementById('clip-anneau')!;
        Object.assign(a.style, { left: `${b.x - 5}px`, top: `${b.y - 5}px`, width: `${b.width + 10}px`, height: `${b.height + 10}px`, opacity: '1' });
    }, boite);
    await pause(attente);
}

async function eteindre(): Promise<void> {
    await gmos.fenetre.evaluate(() => { document.getElementById('clip-anneau')!.style.opacity = '0'; });
}

/** Montre une zone sans rien y faire. */
async function montrer(cible: Locator, duree: number): Promise<void> {
    await viser(cible, duree);
    await eteindre();
}

async function cliquer(cible: Locator, apres = 900): Promise<void> {
    await viser(cible);
    await cible.click();
    await eteindre();
    await pause(apres);
}

async function choisir(cible: Locator, valeur: string, apres = 900): Promise<void> {
    await viser(cible);
    await cible.selectOption(valeur);
    await eteindre();
    await pause(apres);
}

async function taper(cible: Locator, texte: string, apres = 800): Promise<void> {
    await viser(cible, 300);
    await cible.click();
    await cible.fill('');
    await cible.pressSequentially(texte, { delay: 140 });
    await eteindre();
    await pause(apres);
}

/** Les dés du clip : la file passe d'abord, le hasard reprend ensuite. */
async function imposerLesDes(file: number[]): Promise<void> {
    await gmos.fenetre.evaluate(file => {
        const w = window as unknown as { __hasardDuClip?: () => number };
        w.__hasardDuClip ??= Math.random;
        const origine = w.__hasardDuClip;
        Math.random = () => file.length ? file.shift()! : origine();
    }, file);
}

// ---- Le film -----------------------------------------------------------------------

test('le combat de RuneQuest, en clip', async () => {
    test.setTimeout(420_000);
    fs.mkdirSync(SORTIE, { recursive: true });
    const brut = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-clip-rq-'));
    gmos = await lancerGmOs({
        semence: ecrireLaSemence(),
        video: { dossier: brut, largeur: LARGEUR, hauteur: HAUTEUR },
        preparerLeProfil: profil => {
            for (const dossier of ['fiche', 'theme']) {
                const source = path.join(ICI, '..', 'docs', 'systems', 'runequest', dossier);
                if (fs.existsSync(source)) fs.cpSync(source, path.join(profil, 'corpus', 'systems', 'runequest', dossier), { recursive: true });
            }
        },
    });
    // La vidéo commence avec la fenêtre, un peu avant ce point : le découpage garde une marge.
    const debut = Date.now();
    let ouverture = 0;
    try {
        await attendreLHydratation(gmos);
        const fenetre = await gmos.application.browserWindow(gmos.fenetre);
        await fenetre.evaluate((w, t) => { w.unmaximize(); w.setContentSize(t.l, t.h); w.center(); }, { l: LARGEUR, h: HAUTEUR });
        await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
        const f = gmos.fenetre;
        await expect(f.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
        await f.evaluate(campagne => (window as unknown as Fenetre).useSessionOSStore.getState().setActiveCampaign(campagne), CAMPAGNE);
        await f.evaluate(installerLaScene);

        // Les combattants : Vasana (PJ), Yanioth en renfort, le broo.
        await f.evaluate(({ vasana, broo, yanioth }) => {
            const combat = (window as unknown as Fenetre).useCombatStore.getState();
            combat.clearCombatants();
            combat.addCombatant({ name: 'Vasana', init: 0, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: vasana });
            combat.addCombatant({ name: 'Yanioth', init: 0, isPlayer: false, faction: 'player', statuses: [], hp: 12, hpMax: 12, sheetData: yanioth } as never);
            combat.addCombatant({ name: 'Broo', init: 0, isPlayer: false, faction: 'enemy', statuses: [], hp: 12, hpMax: 12, sheetData: broo } as never);
        }, { vasana: VASANA, broo: FICHE_DU_BROO, yanioth: FICHE_DE_YANIOTH });
        await ouvrirLeModule(gmos, 'Combat-OS');
        const rangs = f.locator('section[aria-label="Rangs d’action de RuneQuest"]');
        await expect(rangs).toBeVisible({ timeout: 15_000 });
        await pause(1_500);

        ouverture = Date.now();
        await titre('RuneQuest · le combat', [
            'Pilote 2.2.0 dans GM-OS',
            'Vasana (épée large 65 %) affronte un broo ; Yanioth lance un sort.',
            '1. Les rangs d’action  ·  2. L’attaque et ses dégâts  ·  3. Le coup porté  ·  4. Le critique',
        ], 6_000);

        // ---- 1. Les rangs d'action ------------------------------------------------
        await chapitre('1 · Les rangs d’action');
        await legende('Dans Combat-OS, le pilote remplace le tirage d’initiative par les rangs d’action.',
            'Le meneur déclare ce que fait chacun ; GM-OS calcule le RA (1 = le plus rapide, 12 = le plus lent).', 4_500);
        const declVasana = rangs.getByLabel('Déclaration de Vasana');
        await montrer(declVasana, 600);
        await legende('Vasana frappe à l’épée large : le RA de l’arme noté sur la fiche est déjà un total.',
            'DEX + TAI + allonge = 7 (p. 85, 193). Elle se déplace de 3 m avant de frapper : +1.', 1_200);
        await taper(rangs.getByLabel('Déplacement de Vasana', { exact: true }), '1');
        await montrer(declVasana.locator('[data-rang-runequest]'), 2_400);

        const declYanioth = rangs.getByLabel('Déclaration de Yanioth');
        await legende('Yanioth lance un sort de magie spirituelle à 2 PM.',
            'RA de DEX (2) + 1 par PM au-delà du premier = 3 (p. 194).', 1_200);
        await choisir(rangs.getByLabel('Action de Yanioth', { exact: true }), 'magie-spirituelle');
        await taper(rangs.getByLabel('Sort de Yanioth', { exact: true }), 'Démoralisation', 300);
        await taper(rangs.getByLabel('PM de Yanioth', { exact: true }), '2');
        await montrer(declYanioth.locator('[data-rang-runequest]'), 2_400);

        const declBroo = rangs.getByLabel('Déclaration de Broo');
        await legende('Le broo doit d’abord dégainer sa hache : une préparation coûte 5 RA.',
            'Hache RA 9 + 5 = 14 : au-delà de 12, son coup ne part pas dans ce round.', 1_200);
        await taper(rangs.getByLabel('Préparations de Broo', { exact: true }), '1');
        await montrer(declBroo.locator('[data-rang-runequest]'), 2_600);

        await legende('« Ordonner le round » range les actions du RA 1 au RA 12.',
            'À RA égal, la DEX la plus haute passe d’abord ; à DEX égale, les actions sont simultanées.', 1_000);
        await cliquer(rangs.getByRole('button', { name: 'Ordonner le round' }), 1_200);
        const ordre = rangs.getByLabel('Ordre du round');
        await montrer(ordre, 3_500);
        await legende('Au-delà de 12, c’est au meneur de trancher : reporter l’action ou y renoncer.',
            'Reportée, elle partira au RA 2 du round suivant (14 − 12). La décision est gardée.', 1_500);
        await cliquer(declBroo.getByRole('button', { name: /^Reporter/ }), 2_200);

        // ---- 2. L'attaque de Vasana -----------------------------------------------
        await chapitre('2 · L’attaque et ses dégâts');
        await legende('Vasana agit au RA 8. Son attaque se lance depuis sa fiche, onglet « Lancer un test ».', '', 2_500);
        await ouvrirLeModule(gmos, 'Tableau de Bord');
        await f.evaluate(({ campagne, joueur, perso }) => {
            const s = (window as unknown as Fenetre).useSessionOSStore.getState();
            s.setActiveCampaign(campagne);
            s.setSelectedPlayer(joueur);
            s.setSelectedCharacter(perso);
            s.setCurrentView('players');
        }, { campagne: CAMPAGNE, joueur: JOUEUR, perso: VASANA });
        await ongletDeLaFiche(f, 'Lancer un test');
        const panneau = f.locator('[data-panneau-de-jet]').first();
        await expect(panneau).toBeVisible({ timeout: 15_000 });
        await pause(800);
        await legende('On choisit l’arme de la fiche : Épée large, 65 %.', '', 600);
        await choisir(panneau.locator('select').nth(0), 'arme1', 1_500);

        // d100 : 0 puis 9 → 09, une spéciale ; dégâts : d8 6, d8 6, d4 3 ; localisation : d20 16, bras gauche.
        await imposerLesDes([0.001, 0.901, 0.626, 0.626, 0.501, 0.751]);
        await legende('Lancer !', '', 400);
        await cliquer(panneau.getByRole('button', { name: 'Lancer', exact: true }), 1_500);
        const degats = panneau.locator('[data-degats-runequest]');
        await expect(degats).toBeVisible();
        await legende('09 : une réussite spéciale (65 % ÷ 5 = 13).',
            'GM-OS ouvre le bloc « Dégâts » : l’arme, son type de dégâts spéciaux, le bonus aux dégâts.', 3_500);
        await legende('Épée large en spéciale : empalement, dés et constante doublés, le bonus une fois.',
            '1D8+1 devient 2D8+2, plus le bonus de Vasana : 1D4 (p. 203-204).', 0);
        await montrer(degats.locator('[data-formule-runequest]'), 3_800);

        await legende('Le broo pare avec son bouclier : on note sa défense et la durabilité du bouclier.',
            'La case des tables du livre (attaque contre parade, p. 199) s’affiche en clair.', 1_000);
        await choisir(degats.getByLabel('Défense', { exact: true }), 'parade');
        await choisir(degats.getByLabel('Niveau de la défense', { exact: true }), 'reussite');
        await taper(degats.getByLabel('Durabilité de l’arme qui pare', { exact: true }), '12');
        await montrer(degats.locator('[data-issue-runequest]'), 3_500);

        await legende('On lance les dégâts : le bouclier bloque jusqu’à sa durabilité, le reste passe.', '', 600);
        await cliquer(degats.getByRole('button', { name: 'Lancer les dégâts', exact: true }), 1_000);
        await expect(degats.locator('[data-degats-lances]')).toContainText('5 passent');
        await montrer(degats.locator('[data-degats-lances]'), 4_000);

        // ---- 3. Le coup porté -------------------------------------------------------
        await chapitre('3 · Le coup porté');
        await legende('Reste à savoir où le coup touche : 1D20 sur la table des localisations (p. 146).', '', 800);
        await cliquer(panneau.getByRole('button', { name: 'Localiser le coup (1D20)', exact: true }), 1_200);
        await montrer(panneau.locator('[data-localisation-runequest]'), 2_500);
        const coup = panneau.locator('[data-porter-le-coup]').last();
        await legende('On désigne la cible. Les 5 dégâts sont déjà préremplis ; la zone se change au besoin.',
            'L’armure de la zone se retire à l’application (« armure retirée »).', 800);
        await choisir(coup.getByLabel('Cible du coup', { exact: true }), await f.evaluate(() =>
            (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.name === 'Broo')!.id), 1_200);
        await montrer(coup, 3_500);
        await cliquer(coup.getByRole('button', { name: 'Porter le coup', exact: true }), 2_000);
        await legende('Bras gauche du broo : 5 − 2 d’armure = 3, ses 3 PV y passent. Le bras est hors d’usage.', '', 3_000);

        await ouvrirLeModule(gmos, 'Combat-OS');
        await pause(800);
        const carteDuBroo = f.locator('[data-combattant]').filter({ hasText: 'Broo' }).first();
        await expect(carteDuBroo).toBeVisible({ timeout: 15_000 });
        await legende('Dans Combat-OS, la carte du broo porte la blessure, zone par zone.', '', 600);
        await montrer(carteDuBroo, 4_500);

        // ---- 4. Round suivant, et le critique ---------------------------------------
        await chapitre('4 · Le round suivant, et le critique');
        await legende('Round suivant : l’action reportée du broo arrive en tête, au RA 2.', '', 800);
        await cliquer(rangs.getByRole('button', { name: 'Round suivant' }), 1_000);
        await cliquer(rangs.getByRole('button', { name: 'Ordonner le round' }), 1_000);
        await montrer(rangs.getByLabel('Ordre du round'), 3_500);

        await legende('Vasana frappe de nouveau…', '', 1_500);
        await ouvrirLeModule(gmos, 'Tableau de Bord');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('players'));
        await ongletDeLaFiche(f, 'Lancer un test');
        await expect(panneau).toBeVisible({ timeout: 15_000 });
        await choisir(panneau.locator('select').nth(0), 'arme1', 1_000);
        // d100 : 0 puis 1 → 01, un critique ; bonus : d4 4 ; localisation : d20 10, abdomen.
        await imposerLesDes([0.001, 0.101, 0.751, 0.46]);
        await cliquer(panneau.getByRole('button', { name: 'Lancer', exact: true }), 1_500);
        await legende('01 : une réussite critique (65 % ÷ 20 = 3).',
            'Dégâts spéciaux au maximum (18), plus le bonus lancé ; l’armure est ignorée (p. 200).', 1_000);
        await choisir(degats.getByLabel('Défense', { exact: true }), 'aucune', 600);
        await montrer(degats.locator('[data-issue-runequest]'), 3_000);
        await cliquer(degats.getByRole('button', { name: 'Lancer les dégâts', exact: true }), 1_000);
        await montrer(degats.locator('[data-degats-lances]'), 3_500);
        await cliquer(panneau.getByRole('button', { name: 'Localiser le coup (1D20)', exact: true }), 1_000);
        await choisir(coup.getByLabel('Cible du coup', { exact: true }), await f.evaluate(() =>
            (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.name === 'Broo')!.id), 800);
        await legende('L’étiquette dit « armure ignorée » : rien ne se retire.', '', 0);
        await montrer(coup, 3_500);
        await cliquer(coup.getByRole('button', { name: 'Porter le coup', exact: true }), 2_000);

        await ouvrirLeModule(gmos, 'Combat-OS');
        await pause(800);
        await legende('Le broo encaisse le coup à l’abdomen : ses points de vie s’effondrent.', '', 600);
        await montrer(carteDuBroo, 4_500);

        await chapitre('');
        await legende('');
        await titre('À la table', [
            'Combat-OS : déclarer, « Ordonner le round », reporter au-delà de 12.',
            'Fiche › Lancer un test : l’arme, la défense, « Lancer les dégâts », « Localiser », « Porter le coup ».',
            'Les pertes de durabilité et les échecs critiques sont annoncés, pas écrits : c’est le meneur qui tranche.',
        ], 7_000);
    } finally {
        const video = gmos.fenetre.video();
        await gmos.fermer();
        const source = await video?.path();
        if (source && fs.existsSync(source)) {
            const webm = path.join(SORTIE, 'runequest-combat.webm');
            fs.copyFileSync(source, webm);
            // L'ouverture de l'application ne montre rien : le film commence au titre.
            const debutDuFilm = ouverture ? Math.max(0, (ouverture - debut) / 1000 - 0.2) : 0;
            try {
                execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', debutDuFilm.toFixed(2), '-i', webm,
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    path.join(SORTIE, 'runequest-combat.mp4')]);
            } catch (erreur) {
                console.warn('[clip] ffmpeg indisponible ou en échec : seul le .webm est écrit.', erreur);
            }
        }
        fs.rmSync(brut, { recursive: true, force: true });
    }
});
