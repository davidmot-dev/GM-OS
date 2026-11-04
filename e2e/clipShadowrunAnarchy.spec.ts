import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';

/** David, 04/11/2026 : filmer les nouveautés Shadowrun, sur le modèle du clip RuneQuest.
 * Vrais gestes et confirmations dans une instance jetable ; dés préparés pour les exemples.
 * npm run build puis npx playwright test e2e/clipShadowrunAnarchy.spec.ts --reporter=list
 * Aucun changement de l’application, aucun profil personnel, aucune installation.
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_SHADOWRUN ?? 'Export Dirvers/corriges/Shadowrun-Anarchy-2.2.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'shadowrun-anarchy');
const CAMPAGNE = 'clip-shadowrun', JOUEUR = 'clip-joueur-sr', PERSO = 'clip-prisme';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore; hasardClipSR?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette cyan/magenta. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #20def2;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #20def2;border-radius:8px;box-shadow:0 0 18px #20def266;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #20def2;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#a4e8ef;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#20def2;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#092a3e,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#20def2}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
      #clip-titre p:last-child{color:#ef9bd9;font-size:20px}
      .fixed.bottom-6.right-6.pointer-events-none{visibility:hidden!important}
    `;
    document.head.appendChild(style);
    for (const id of ['clip-curseur', 'clip-anneau', 'clip-legende', 'clip-chapitre', 'clip-titre']) {
        const div = document.createElement('div'); div.id = id; document.body.appendChild(div);
    }
    const curseur = document.getElementById('clip-curseur')!;
    curseur.innerHTML = '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M2 2V24L8 18L12 28L16 26L12 16H21Z" fill="white" stroke="#061020" stroke-width="2"/></svg>';
    document.addEventListener('mousemove', e => { curseur.style.transform = `translate(${e.clientX - 2}px,${e.clientY - 2}px)`; }, true);
    document.addEventListener('mousedown', () => { curseur.classList.remove('clic'); void curseur.offsetWidth; curseur.classList.add('clic'); }, true);
}

class Realisation {
    constructor(readonly page: Page) {}
    pause = (ms: number) => this.page.waitForTimeout(ms);
    async legende(texte: string, detail = '', duree = 1200) {
        await this.page.evaluate(({ texte, detail }) => {
            const l = document.getElementById('clip-legende')!; l.replaceChildren(texte);
            if (detail) { const petit = document.createElement('small'); petit.textContent = detail; l.appendChild(petit); }
            l.style.opacity = texte ? '1' : '0';
        }, { texte, detail });
        await this.pause(duree);
    }
    async chapitre(texte: string) {
        await this.page.evaluate(texte => { const e = document.getElementById('clip-chapitre')!; e.textContent = texte; e.style.opacity = texte ? '1' : '0'; }, texte);
    }
    async titre(titre: string, lignes: string[], duree = 5500) {
        await this.legende('', '', 0); await this.chapitre('');
        await this.page.evaluate(({ titre, lignes }) => {
            const e = document.getElementById('clip-titre')!; e.replaceChildren();
            const h = document.createElement('h1'); h.textContent = titre; e.appendChild(h);
            lignes.forEach(l => { const p = document.createElement('p'); p.textContent = l; e.appendChild(p); }); e.style.opacity = '1';
        }, { titre, lignes });
        await this.pause(duree);
        await this.page.evaluate(() => { document.getElementById('clip-titre')!.style.opacity = '0'; }); await this.pause(450);
    }
    async viser(cible: Locator, attente = 250) {
        await cible.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await this.pause(120);
        const b = await cible.boundingBox(); if (!b) throw new Error('La cible du clip est masquée.');
        await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
        await this.page.evaluate(b => { Object.assign(document.getElementById('clip-anneau')!.style,
            { left: `${b.x - 4}px`, top: `${b.y - 4}px`, width: `${b.width + 8}px`, height: `${b.height + 8}px`, opacity: '1' }); }, b);
        await this.pause(attente);
    }
    async eteindre() { await this.page.evaluate(() => { document.getElementById('clip-anneau')!.style.opacity = '0'; }); }
    async montrer(cible: Locator, ms = 2500) { await this.viser(cible, ms); await this.eteindre(); }
    async cliquer(cible: Locator, ms = 700) { await this.viser(cible); await cible.click(); await this.eteindre(); await this.pause(ms); }
    async choisir(cible: Locator, valeur: string | { label: string }, ms = 700) { await this.viser(cible); await cible.selectOption(valeur); await this.eteindre(); await this.pause(ms); }
    async taper(cible: Locator, texte: string, ms = 700) {
        await this.viser(cible);
        // Un nombre contrôlé peut rétablir son minimum dès l’effacement : saisir la
        // valeur entière évite de concaténer le nouveau chiffre à ce minimum.
        if (await cible.getAttribute('type') === 'number') await cible.fill(texte);
        else { await cible.fill(''); await cible.pressSequentially(texte, { delay: 55 }); }
        await this.eteindre(); await this.pause(ms);
    }
    async cocher(cible: Locator, actif = true) { await this.viser(cible); await cible.setChecked(actif); await this.eteindre(); await this.pause(600); }
    async carte(id: string) {
        const cartes = this.page.locator('[data-carte-du-jeu]');
        for (const carte of await cartes.all()) {
            const ouvrir = (await carte.getAttribute('data-carte-du-jeu')) === id;
            if ((await carte.getAttribute('open') !== null) !== ouvrir) await carte.locator('summary').first().click();
        }
    }
    async des(file: number[]) {
        await this.page.evaluate(file => {
            const w = window as unknown as Fenetre; w.hasardClipSR ??= Math.random;
            const origine = w.hasardClipSR; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipSR) Math.random = w.hasardClipSR; }); }
}

test('les six nouveautés de Shadowrun Anarchy, en clip', async () => {
    test.setTimeout(720_000);
    expect(fs.existsSync(PILOTE), 'Le pilote 2.2.0 doit être disponible.').toBe(true);
    fs.mkdirSync(PREUVES, { recursive: true });
    const racineTemp = path.resolve(os.tmpdir()), brut = fs.mkdtempSync(path.join(racineTemp, 'gmos-clip-sr-'));
    if (!path.resolve(brut).startsWith(racineTemp + path.sep)) throw new Error('Profil de clip inattendu.');
    const source = JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json', 'utf8'));
    const s = semence.modules.sessionOS;
    s.campaigns = [{ id: CAMPAGNE, name: 'Le badge de verre', system: source.gameDriver.id, activeLocationIds: [] }];
    s.activeCampaignId = CAMPAGNE; s.customGameDrivers = [source.gameDriver]; s.customSheetTemplates = [source.sheetTemplate];
    const valeurs = Object.fromEntries(source.sheetTemplate.sections.flatMap((sec: { fields: { id: string; defaultValue?: unknown }[] }) => sec.fields).map((c: { id: string; defaultValue?: unknown }) => [c.id, c.defaultValue ?? '']));
    s.players = [{ id: JOUEUR, realName: 'Joueur fictif', isOnline: false, characters: [{ id: PERSO, name: 'Prisme',
        campaignId: CAMPAGNE, systemId: source.gameDriver.id, templateId: source.sheetTemplate.id, hp: 0, maxHp: 0,
        sheetData: { ...valeurs, competence_1_nom: 'Sorcellerie', competence_1: 7, competence_1_rr: 0, competence_1_reference: 'volonte', competence_1_attribut: 2, competence_1_reserve: 9,
            competence_2_nom: 'Hacking', competence_2: 7, competence_2_rr: 0, competence_3_nom: 'Pilotage', competence_3: 7, competence_3_rr: 0,
            agilite: 4, logique: 4, volonte: 4, force: 4, anarchy: 99, essence: 6, piratage_des_de_risque: 2 } }] }];
    const semenceFichier = path.join(brut, 'semence.json'); fs.writeFileSync(semenceFichier, JSON.stringify(semence));
    const g = await lancerGmOs({ semence: semenceFichier, video: { dossier: brut, largeur: LARGEUR, hauteur: HAUTEUR },
        preparerLeProfil: profil => {
            for (const dossier of ['theme', 'fiche']) {
                const entree = path.resolve('docs/systems/shadowrun-anarchy', dossier);
                if (fs.existsSync(entree)) fs.cpSync(entree, path.join(profil, 'corpus/systems/shadowrun-anarchy', dossier), { recursive: true });
            }
        } });
    const f = g.fenetre, r = new Realisation(f), chapitres: { titre: string; secondesDepuisTitre: number }[] = [];
    let ouverture = 0, fin = 0, reussi = false;
    const personnage = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players.find(p => p.id === 'clip-joueur-sr')!.characters[0]);
    const reserves = () => f.evaluate(() => (window as unknown as Fenetre).useRessourcesDeTableStore.getState().reserves['clip-shadowrun']);
    const chapitre = async (titre: string) => { chapitres.push({ titre, secondesDepuisTitre: +(Date.now() - ouverture) / 1000 }); await r.chapitre(titre); };
    const photo = (nom: string) => f.screenshot({ path: path.join(PREUVES, `${nom}.jpg`), type: 'jpeg', quality: 85 });
    try {
        await attendreLHydratation(g);
        const fenetre = await g.application.browserWindow(f);
        await fenetre.evaluate((w, t) => { w.unmaximize(); w.setContentSize(t.l, t.h); w.webContents.setAudioMuted(true); }, { l: LARGEUR, h: HAUTEUR });
        await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setActiveCampaign('clip-shadowrun'); s.setSelectedPlayer('clip-joueur-sr'); s.setSelectedCharacter('clip-prisme'); s.setCurrentView('players'); });
        await ongletDeLaFiche(f, 'Lancer un test'); await f.evaluate(installerLaScene);
        const panneau = f.locator('[data-panneau-de-jet]').first(), suivi = f.locator('[data-suivi-shadowrun]');
        const matrice = panneau.locator('[data-matrice-shadowrun]'), plan = f.locator('[data-planification-shadowrun]'), rigging = f.locator('[data-rigging-shadowrun]');
        await r.carte(''); await panneau.scrollIntoViewIfNeeded(); ouverture = Date.now();
        await r.titre('Shadowrun · Anarchy 2.0', ['Les six nouveautés du pilote 2.2.0 dans GM-OS',
            'Drain · Cohérence · Matrice · Planification · Opposition · Rigging', 'Profil fictif, vrais gestes — dés préparés pour les exemples.']);
        await chapitre('1 · Blessures, drain et soins');
        await r.legende('Tout commence dans la fiche : « Lancer un test ».', 'Prisme lance un sort. Sorcellerie 7 + Volonté 4 : onze dés.', 2200);
        await r.choisir(panneau.locator('select').nth(0), 'competence_1'); await r.choisir(panneau.locator('select').nth(1), 'volonte');
        await r.cocher(panneau.getByLabel('Test de magie', { exact: true })); await r.cocher(panneau.getByLabel(/Action soumise au drain/));
        await r.taper(panneau.getByLabel('Dés de risque', { exact: true }), '2');
        await r.des([.8, .8, .8, .8, .2, .2, .2, .2, .2, 0, 0]);
        await r.cliquer(panneau.getByRole('button', { name: 'Lancer', exact: true })); await r.rendreLeHasard();
        await expect.poll(async () => (await personnage()).sheetData.anarchy).toBe(100);
        await r.legende('Deux 1 de risque, RR 0 : complication critique.', 'Le point d’Anarchy gagné porte la réserve de 99 à 100 : aucun plafond.', 1700);
        await r.montrer(panneau.locator('[data-suites-shadowrun]'), 3200);
        await r.legende('Le drain est proposé, puis confirmé après l’éventuelle relance.', 'Ici : une blessure légère. Sa nature reste connue après l’application.', 1800);
        await r.cliquer(panneau.getByRole('button', { name: 'Confirmer les conséquences drain / Matrice' }));
        await r.carte('suivi-shadowrun');
        await expect(suivi.getByRole('button', { name: 'Soigner cette case' })).toBeDisabled();
        await r.legende('Une blessure de drain refuse les premiers soins et la magie.', 'Le repos seul peut la soigner. Fin de narration expire le malus, sans effacer la case.', 1800);
        await r.montrer(suivi, 4000); await photo('01-drain');
        await r.cliquer(suivi.getByRole('button', { name: 'Fin de la prochaine narration' }));

        await chapitre('2 · Réserves et seuils cohérents');
        await r.legende('Les dérivés comparent la fiche au calcul, sans écraser ton choix.', 'La réserve enregistrée vaut 9 ; compétence 7 + attribut lié 4 donnent 11.', 1800);
        const derives = suivi.locator('[data-derives-shadowrun]'); await r.cliquer(derives.locator('summary'));
        const ligne = derives.locator('div').filter({ hasText: 'Compétence 1 — réserve de dés :' });
        await r.montrer(ligne, 3500); await r.cliquer(ligne.getByRole('button', { name: 'Appliquer', exact: true }));
        await expect.poll(async () => (await personnage()).sheetData.competence_1_reserve).toBe(11);
        expect((await personnage()).sheetData.blessures_legeres).toBe(1);
        await r.legende('« Appliquer » corrige le dérivé ; la blessure est conservée.', '« Garder ma valeur » consigne une dérogation. Les protections doivent être chiffrées explicitement.', 2000);
        await r.montrer(ligne, 2500); await photo('02-coherence');
        await r.cliquer(derives.locator('summary')); await r.carte('');
        await r.cocher(panneau.getByLabel('Test de magie', { exact: true }), false);

        await chapitre('3 · Piratage et surveillance de DIEU');
        await r.legende('La Matrice prépare la cible, son accès et la connexion.', 'Déclarer le cyberdeck et l’IND ; les accès et la surveillance sont conservés.', 1900);
        await r.choisir(panneau.locator('select').nth(0), 'competence_2'); await r.choisir(panneau.locator('select').nth(1), 'logique');
        await r.cocher(matrice.getByLabel('Cyberdeck disponible')); await r.cocher(matrice.getByLabel('IND disponible'));
        await r.taper(matrice.getByLabel('Nouvelle cible matricielle'), 'Archives du miroir'); await r.cliquer(matrice.getByRole('button', { name: 'Ajouter la cible' }));
        await r.taper(matrice.getByLabel('Firewall effectif'), '4'); await r.cocher(matrice.getByLabel('Tentative de piratage'));
        await r.choisir(matrice.getByLabel('Accès visé'), '2');
        await expect(matrice).toContainText('Seuil 6 = Firewall 4 + accès 2');
        await r.legende('Aucun accès → Administrateur : Firewall 4 + 2 = seuil 6.', 'Une heure de backdoor le réduit de 2 : seuil 4 avant surveillance.', 1500);
        await r.choisir(matrice.getByLabel('Préparation de backdoor'), '2'); await r.montrer(matrice, 3000);
        await r.des(Array(11).fill(0)); await r.cliquer(panneau.getByRole('button', { name: 'Lancer', exact: true })); await r.rendreLeHasard();
        await r.cliquer(panneau.getByRole('button', { name: 'Confirmer les conséquences drain / Matrice' }));
        await expect.poll(async () => (await personnage()).sheetData.piratage_hausse_du_seuil).toBe(1);
        await r.legende('La complication critique augmente le seuil de surveillance de 1.', 'Un redémarrage seul perd les accès ; il faut aussi une heure hors ligne pour effacer les malus.', 2000);
        await r.montrer(matrice, 3200); await photo('03-matrice');
        await r.cliquer(matrice.getByRole('button', { name: 'Confirmer redémarrage et 1 h hors ligne' }));
        await r.choisir(matrice.getByLabel('Mode de connexion'), 'hot-ind');
        await r.legende('Hot-sim avec IND cybernétique : avantage en cybercombat.', 'Le biofeedback devient mental létal. L’avantage ne s’applique pas à tout piratage.', 1800);
        await r.montrer(matrice, 3000); await r.cocher(matrice.getByLabel('Tentative de piratage'), false);

        await chapitre('4 · Planification, flashback et menace'); await r.carte('planification-shadowrun');
        await r.legende('Les succès préparatoires alimentent la réserve commune.', 'Quatre succès donnent quatre points ; en temps limité, il en faut deux par point.', 1800);
        await r.taper(plan.getByLabel('Succès de préparation'), '4'); await r.cliquer(plan.getByRole('button', { name: 'Confirmer le crédit', exact: true }));
        await r.choisir(plan.getByLabel('Mode de narration'), 'totale');
        await r.legende('Le meneur valide le flashback et choisit sa source de financement.', 'Le badge avait été copié : coût 2, payé sur la planification.', 1800);
        await r.taper(plan.getByLabel('Description du flashback'), 'Le badge a été copié hier.');
        await r.cliquer(plan.getByRole('button', { name: 'Confirmer le flashback', exact: true }));
        await expect(plan.getByRole('button', { name: 'Confirmer le flashback', exact: true })).toBeDisabled();
        await expect.poll(async () => (await reserves()).reserveDePlanification).toBe(2);
        await r.legende('Planification : 4 − 2 = 2. Le bouton payé ne débite plus une seconde fois.', 'En narration partagée totale : +1 Menace par utilisation, même pour un coût de 2.', 1800);
        await r.montrer(plan, 3000);
        await r.cliquer(plan.getByRole('button', { name: 'Tour de table +1 menace', exact: true }));
        await r.cliquer(plan.getByRole('button', { name: 'Tour de table +1 menace', exact: true }));
        await expect(plan).toContainText('Menace 3 > Planification 2');
        await r.legende('Menace 3 dépasse Planification 2 : un désastre collectif est proposé.', 'Le meneur le met en scène, puis confirme la remise de Menace à zéro.', 1800);
        await r.montrer(plan.getByRole('button', { name: 'Confirmer le désastre — menace à 0' }), 2200); await photo('04-planification');
        await r.cliquer(plan.getByRole('button', { name: 'Confirmer le désastre — menace à 0' })); await r.carte('');

        await chapitre('5 · Oppositions et rôles adverses');
        await r.choisir(panneau.locator('select').nth(0), 'competence_3'); await r.choisir(panneau.locator('select').nth(1), 'agilite');
        await r.taper(panneau.getByLabel('Dés de risque', { exact: true }), '0');
        await r.choisir(panneau.getByLabel('Épreuve Shadowrun'), 'oppose'); await r.taper(panneau.getByLabel('Succès adverses Shadowrun'), '4');
        await r.legende('Une opposition générale à égalité ne désigne aucun vainqueur.', 'Les deux camps font quatre succès ; le seuil du lancer reste affiché dans le résultat.', 1300);
        await r.des([.99, .99, .99, .99, .2, .2, .2, .2, .2, .2, .2]);
        await r.cliquer(panneau.getByRole('button', { name: 'Lancer', exact: true })); await r.rendreLeHasard();
        await expect(panneau).toContainText('Égalité — aucun vainqueur'); await expect(panneau).toContainText('4 réussites / difficulté 4');
        await r.montrer(panneau.locator('[data-suites-shadowrun]'), 3000); await photo('05-opposition');
        await r.legende('Si un vainqueur est indispensable, l’initiateur départage l’égalité.', 'En tir, l’attaquant touche à égalité ; en mêlée, distinguer défense seule et attaque simultanée.', 2200);
        await r.choisir(panneau.getByLabel('Rôle de l’adversaire'), 'second'); await r.choisir(panneau.getByLabel('RR adverse'), '1');
        await expect(panneau).toContainText('Valeur moyenne 5 — sans Anarchy');
        await r.legende('Second rôle : 9 dés, RR 1 → valeur moyenne 5, sans Anarchy adverse.', 'Son avantage devient un désavantage du PJ, et inversement. Cinq profils à la volée sont aussi proposés.', 1800);
        await r.montrer(panneau.locator('[data-opposition-shadowrun]'), 3300); await r.choisir(panneau.getByLabel('Épreuve Shadowrun'), 'simple');

        await chapitre('6 · Rigging et biofeedback'); await r.carte('rigging-shadowrun');
        await r.legende('Le véhicule a son propre moniteur, séparé du rigger.', 'Moustique : Structure 4, Blindage 2 → seuils 6 / 10 / 14, tableau des blessures choisi.', 1800);
        await r.taper(rigging.getByLabel('Nom du véhicule'), 'Moustique'); await r.cliquer(rigging.getByRole('button', { name: 'Ajouter le véhicule' }));
        await expect(rigging).toContainText('Seuils 6/10/14');
        await r.cocher(rigging.getByLabel('IND cybernétique', { exact: true })); await r.cocher(rigging.getByLabel('CCV', { exact: true }));
        await r.choisir(rigging.getByLabel('Connexion rigging'), 'hot'); await r.cliquer(rigging.getByRole('button', { name: 'Prendre le contrôle' }));
        await r.legende('Plongée : IND cybernétique + CCV ; un seul appareil à la fois.', 'Hot-sim donne l’avantage aux tests de Pilotage, défense comprise.', 2000);
        await r.montrer(rigging.getByLabel('Mode de contrôle'), 2000);
        await r.choisir(panneau.getByLabel('Véhicule du jet'), { label: 'Moustique' });
        await expect(panneau.locator('[data-composition-shadowrun]')).toContainText('Pilotage en plongée hot-sim');
        await r.montrer(panneau.locator('[data-composition-shadowrun]'), 3000);
        await r.legende('La VD finale doit dépasser le seuil ; VD 7 coche une légère.', 'Deux légères remplissent les deux cases. La troisième s’aggrave en grave.', 2000);
        for (let i = 0; i < 3; i++) { await r.taper(rigging.getByLabel('VD du véhicule'), '7', 350); await r.cliquer(rigging.getByRole('button', { name: 'Confirmer l’impact' }), 900); }
        await expect(rigging).toContainText('2 légers / 1 graves / 0 incapacitants');
        await expect.poll(async () => (await personnage()).sheetData.blessures_legeres).toBe(2);
        await r.legende('La case grave réellement cochée provoque une légère mentale au rigger.', 'En plongée hot-sim : létale ; en cold-sim : étourdissante. Pas de seconde application d’armure.', 1900);
        await r.montrer(rigging, 3500); await photo('06-rigging');
        await r.carte('suivi-shadowrun');
        await r.montrer(suivi.getByText(/Blessure legere — biofeedback mental letal/), 3500); await photo('07-biofeedback');
        await r.legende('Les origines restent distinctes : drain et biofeedback.', 'Les actions du capitaine, les collisions et la réparation réussie restent confirmées à la table.', 2800);
        await r.titre('Prêt pour le prochain run', ['Fiche › Lancer un test : préparer, lancer, puis confirmer les conséquences.',
            'Les décisions de récit restent au meneur ; les valeurs et suivis sont conservés.', 'Shadowrun Anarchy · pilote 2.2.0 · SR-A1 à SR-A6 validés'], 6500);
        reussi = true; fin = Date.now();
    } finally {
        const video = f.video(); await g.fermer();
        const fichierVideo = await video?.path();
        if (reussi && fichierVideo) {
            const exportVideo = JSON.parse(execFileSync(process.execPath,
                ['outils/clips/exporter_clip.mjs', fichierVideo, SORTIE, 'shadowrun-anarchy-nouveautes', String((fin - ouverture) / 1000)], { encoding: 'utf8' }));
            fs.writeFileSync(path.join(PREUVES, 'verification.json'), JSON.stringify({ version: source.gameDriver.version, profilJetable: true,
                donneesPersonnelles: false, desPrepares: true, narrationSonore: false, dureeDepuisTitre: (fin - ouverture) / 1000,
                chapitres, exportVideo, assertions: ['drain et soins refusés', 'Anarchy 99 → 100', 'dérivé 9 → 11 sans perdre la blessure', 'surveillance +1', 'flashback 4 − 2 = 2 et débit unique', 'désastre collectif', 'égalité 4/4', 'moyenne second rôle 5', 'seuils véhicule 6/10/14', 'troisième légère et biofeedback létal'] }, null, 2));
        }
        if (path.resolve(brut).startsWith(racineTemp + path.sep)) fs.rmSync(brut, { recursive: true, force: true });
        else console.error('Nettoyage temporaire refusé : chemin hors du dossier temporaire.');
    }
});
