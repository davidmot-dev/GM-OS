import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';

/** David, 05/11/2026 : filmer les mécanismes particuliers de Nephilim avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipNephilim.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_NEPHILIM ?? 'output/campagnes-tests/nephilim/Nephilim-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'nephilim');
const CAMPAGNE = 'clip-nephilim', JOUEUR = 'clip-joueur-nephilim', PERSO = 'clip-aster';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore; hasardClipNephilim?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette or et indigo. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #e8c780;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #e8c780;border-radius:8px;box-shadow:0 0 18px #e8c78066;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #e8c780;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#e8c780;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#31244e,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#e8c780}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
      #clip-titre p:last-child{color:#c7b9e7;font-size:20px}
      .fixed.bottom-6.right-6.pointer-events-none{visibility:hidden!important}
      [data-bandeau-des-reserves]{flex-wrap:wrap!important;gap:12px!important}
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
    pause = (ms: number) => this.page.waitForTimeout(process.env.GMOS_CLIP_RAPIDE ? Math.min(ms, 30) : ms);
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
        await cible.evaluate(e => {
            // Réserver la place des sous-titres dans le seul profil filmé.
            for (let p = e.parentElement; p; p = p.parentElement) {
                if (p.scrollHeight > p.clientHeight && /auto|scroll/.test(getComputedStyle(p).overflowY)) p.style.paddingBottom = '190px';
            }
            e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
            for (let p = e.parentElement; p; p = p.parentElement) p.scrollLeft = 0;
        }); await this.pause(120);
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
            const w = window as unknown as Fenetre; w.hasardClipNephilim ??= Math.random;
            const origine = w.hasardClipNephilim; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipNephilim) Math.random = w.hasardClipNephilim; }); }
}


test('les mécanismes particuliers de Nephilim, en clip', async () => {
    test.setTimeout(720_000);
    expect(fs.existsSync(PILOTE)).toBe(true);
    fs.mkdirSync(PREUVES, { recursive: true });
    const racineTemp = path.resolve(os.tmpdir()), brut = fs.mkdtempSync(path.join(racineTemp, 'gmos-clip-nephilim-'));
    if (!path.resolve(brut).startsWith(racineTemp + path.sep)) throw new Error('Profil de clip inattendu.');
    const source = JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json', 'utf8'));
    const s = semence.modules.sessionOS;
    s.campaigns = [{ id: CAMPAGNE, name: 'Les reflets du Pentacle', system: source.gameDriver.id, activeLocationIds: [] }];
    s.activeCampaignId = CAMPAGNE; s.customGameDrivers = [source.gameDriver]; s.customSheetTemplates = [source.sheetTemplate];
    const valeurs = Object.fromEntries(source.sheetTemplate.sections.flatMap((sec: { fields: { id: string; defaultValue?: unknown }[] }) => sec.fields).map((c: { id: string; defaultValue?: unknown }) => [c.id, c.defaultValue ?? '']));
    s.players = [{ id: JOUEUR, realName: 'Joueur fictif', isOnline: false, characters: [{ id: PERSO, name: 'Aster — personnage de démonstration',
        campaignId: CAMPAGNE, systemId: source.gameDriver.id, templateId: source.sheetTemplate.id, hp: 0, maxHp: 0,
        sheetData: { ...valeurs, identity_name: 'Aster', identity_metamorph: 'Ailes de braise', identity_metamorph_degree: 3,
            ka_fire: 5, ka_air: 3, ka_water: 4, ka_earth: 6, ka_moon: 2, ka_dominant: 'Feu', ka_dominant_degre: 5,
            simulacrum_name: 'Camille Vernet', simulacrum_ka: 3, simulacrum_experience: 'Restauratrice', simulacrum_experience_degree: 4,
            pastlives_0_name: 'Templier', pastlives_0_degree: 4, pastlives_1_name: 'Alchimiste de Prague', pastlives_1_degree: 3,
            metamorphoses_0_name: 'Ailes de braise', metamorphoses_0_permanent: false,
            falls_khaiba: 2, falls_shadow: 1, falls_narcosis: 0, resources_sapience: 12, resources_sapience_chute: 0, stasis_degree: 4,
            occult_magic_first: 4, occult_kabbalah_hod: 5, kabbalah_ordinances_degree: 1,
            magic_spells_0_name: 'DÉMO — Trace de braise', magic_spells_0_circle: 1, magic_spells_0_element: 'Feu', magic_spells_0_degree: 2,
            kabbalah_invocations_0_name: 'DÉMO — Le Messager de nacre', kabbalah_invocations_0_degree: 2, kabbalah_invocations_0_element: 'Eau', kabbalah_invocations_0_sephirah: 'Hod',
            occult_alchemy_black: 5, alchemy_constructs_retort_assembly: 'Œuvre au noir', alchemy_constructs_retort_water: 3,
            alchemy_formulas_0_name: 'DÉMO — Brume révélatrice', alchemy_formulas_0_degree: 2, alchemy_formulas_0_element: 'Eau',
            alchemy_materia_water_max: 9, alchemy_materia_water: 6 } }] }];
    const semenceFichier = path.join(brut, 'semence.json'); fs.writeFileSync(semenceFichier, JSON.stringify(semence));
    const g = await lancerGmOs({ semence: semenceFichier, video: { dossier: brut, largeur: LARGEUR, hauteur: HAUTEUR },
        preparerLeProfil: profil => {
            for (const dossier of ['theme', 'fiche']) {
                const entree = path.resolve('docs/systems/nephilim', dossier);
                if (fs.existsSync(entree)) fs.cpSync(entree, path.join(profil, 'corpus/systems/nephilim', dossier), { recursive: true });
            }
        } });
    const f = g.fenetre, r = new Realisation(f), chapitres: { titre: string; secondesDepuisTitre: number }[] = [];
    f.setDefaultTimeout(15_000);
    let ouverture = 0, fin = 0, reussi = false;
    const personnage = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players.find(p => p.id === 'clip-joueur-nephilim')!.characters[0]);
    const reserves = () => f.evaluate(() => (window as unknown as Fenetre).useRessourcesDeTableStore.getState().reserves['clip-nephilim']);
    const chapitre = async (titre: string) => { chapitres.push({ titre, secondesDepuisTitre: +(Date.now() - ouverture) / 1000 }); await r.chapitre(titre); };
    const photo = (nom: string) => f.screenshot({ path: path.join(PREUVES, nom + '.jpg'), type: 'jpeg', quality: 85 });
    try {
        await attendreLHydratation(g);
        const fenetre = await g.application.browserWindow(f);
        await fenetre.evaluate((w, t) => { w.unmaximize(); w.setContentSize(t.l, t.h); w.webContents.setAudioMuted(true); }, { l: LARGEUR, h: HAUTEUR });
        await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setActiveCampaign('clip-nephilim'); s.setSelectedPlayer('clip-joueur-nephilim'); s.setSelectedCharacter('clip-aster'); s.setCurrentView('players'); });
        await ongletDeLaFiche(f, 'Lancer un test'); await f.evaluate(installerLaScene);
        const panneau = f.locator('[data-panneau-de-jet]').first();
        const principal = panneau.locator('select').nth(0), approche = panneau.locator('select').nth(1);
        const lancer = panneau.getByRole('button', { name: 'Lancer', exact: true });
        const jeter = async (faces: number[]) => {
            await r.des(faces); await r.cliquer(lancer); await r.rendreLeHasard();
            await r.montrer(panneau.getByRole('region', { name: 'Résultat', exact: true }), 1200);
        };
        await r.carte(''); ouverture = Date.now();
        await r.titre('Nephilim · Légende', ['Les mécanismes particuliers dans GM-OS',
            'Vécus · Arts occultes · Traque · Santé · Chutes · Stase',
            'Personnage et effets fictifs — vrais gestes, dés préparés, légendes sans voix.']);

        await chapitre('1 · Vécus, approches et Effet Mnémos');
        await r.legende('Dans la fiche : « Lancer un test ». Un Vécu rencontre une approche.', 'Templier 4 + Ka-Feu 5 : (4 + 5) × 10 = 90 %.', 2400);
        await r.choisir(principal, 'pastlives_0_degree'); await r.choisir(approche, 'ka_fire');
        await expect(panneau).toContainText('90 %'); await r.montrer(panneau.locator('[data-seuil-rk]'), 3000);
        await r.cliquer(panneau.getByRole('button', { name: /^Un point de plus : Effet Mnémos \(1 PS/ }));
        await r.legende('Un souvenir d’incarnation : 1 Point de Sapience pour +2 degrés.', 'À raconter à la table. La cible passe à 110 % ; le point sera payé au lancer.', 2800);
        await jeter([.85, .25]);
        await expect.poll(async () => (await personnage()).sheetData.resources_sapience).toBe(11);
        await r.legende('82 : réussite, marge 9 grâce au degré au-delà de dix.', 'Un double réussi est critique ; un double raté est une maladresse. 00 échoue toujours.', 3100);
        await photo('01-mnemos');

        await chapitre('2 · Métamorphe et limites du Seuil RK');
        await r.taper(panneau.getByLabel('Degrés de métamorphe exprimés'), '2');
        await r.legende('Exprimer le métamorphe renforce l’approche du Ka dominant.', 'Deux degrés exprimés : +2. Les degrés visibles ne donnent pas ce bonus.', 3000);
        await r.montrer(panneau.locator('[data-preparation-nephilim]'), 3500); await photo('02-metamorphe');
        await r.taper(panneau.getByLabel('Degrés de métamorphe exprimés'), '0');

        await chapitre('3 · Magie : Stase, critique et Sacrifice');
        await r.choisir(principal, 'occult_magic_first'); await r.choisir(approche, 'ka_fire');
        await r.choisir(panneau.locator('select:has(option[value="magic_spells_0_degree"])'), 'magic_spells_0_degree');
        await r.legende('Un sort retire son degré : Basse Magie 4 + Feu 5 − sort 2 = 70 %.', '« Trace de braise » est un effet fictif pour la démonstration.', 2900);
        const stasePlus = panneau.getByRole('button', { name: /^Un point de plus : Stase/ });
        await r.cliquer(stasePlus); await r.cliquer(stasePlus);
        await r.legende('Puiser deux degrés de Stase porte la cible à 90 %.', 'La Stase sera débitée même si le sort échoue.', 2500);
        await jeter([.85, .85]);
        await expect.poll(async () => (await personnage()).sheetData.stasis_degree).toBe(2);
        await r.legende('88 sous 90 : critique d’Art occulte.', 'Son point de Sapience peut être noté ou servir aussitôt à soigner un degré de Chute.', 2800);
        await r.cliquer(panneau.getByRole('button', { name: 'Khaïba −1', exact: true }));
        await expect.poll(async () => (await personnage()).sheetData.falls_khaiba).toBe(1);
        await expect.poll(async () => (await personnage()).sheetData.resources_sapience).toBe(11);
        await photo('03-magie-critique');
        await r.cocher(panneau.getByLabel(/Sacrifice : 5 PS/));
        await r.legende('Sacrifice : cinq Points de Sapience pour réussir le rituel d’office.', 'Ce choix appartient au joueur ; le degré du sort ne doit pas dépasser l’Art.', 2800);
        await jeter([.95, .95]);
        await expect(panneau).toContainText('réussi d’office');
        await expect.poll(async () => (await personnage()).sheetData.resources_sapience).toBe(6);
        await photo('04-sacrifice'); await r.cocher(panneau.getByLabel(/Sacrifice : 5 PS/), false);
        await r.choisir(panneau.locator('select:has(option[value="magic_spells_0_degree"])'), '');

        await chapitre('4 · Kabbale : invoquer, puis nouer le pacte');
        await r.choisir(principal, 'occult_kabbalah_hod'); await r.choisir(approche, 'ka_water');
        await expect(panneau).toContainText('90 %');
        await r.legende('Hod 5 + Ka-Eau 4 : l’invocation et le pacte sont deux étapes.', 'Le Messager de nacre, degré 2, est une créature fictive de démonstration.', 3000);
        await jeter([.35, .45]);
        const pacte = panneau.locator('[data-pacte-de-kabbale]');
        await r.montrer(pacte, 3000);
        await r.legende('Le pacte oppose le kabbaliste à la créature.', 'Les ordonnances s’ajoutent au kabbaliste ; la table des actions opposées décide.', 2800);
        await r.des([.415, .725]); await r.cliquer(pacte.getByRole('button', { name: 'Nouer le pacte', exact: true })); await r.rendreLeHasard();
        await expect(pacte.locator('[data-issue-du-pacte]')).toContainText('Pacte noué');
        await r.montrer(pacte.locator('[data-issue-du-pacte]'), 3500); await photo('05-pacte');

        await chapitre('5 · Alchimie : construct, formule et Materiae Primae');
        await r.choisir(principal, 'occult_alchemy_black'); await r.choisir(approche, 'alchemy_constructs_retort_water');
        await r.choisir(panneau.locator('select:has(option[value="alchemy_formulas_0_degree"])'), 'alchemy_formulas_0_degree');
        await expect(panneau).toContainText('60 %');
        await r.legende('Œuvre au noir 5 + Ka-Eau de la cornue 3 − formule 2 : 60 %.', 'L’assemblage du construct doit autoriser l’Œuvre. Brume révélatrice est une formule fictive.', 3200);
        await jeter([.45, .55]);
        await expect.poll(async () => (await personnage()).sheetData.alchemy_materia_water).toBe(4);
        await r.legende('45 : réussite. Deux Materiae Primae Eau sont consommées : 6 → 4.', 'Elles sont aussi consommées sur échec ou maladresse, mais conservées sur critique.', 3400);
        await photo('06-alchimie');

        await chapitre('6 · Lieu magique, Conjonction et Traque');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('cockpit'));
        await r.cliquer(f.getByRole('button', { name: 'Ajouter un point de Lieu magique', exact: true }));
        await r.cliquer(f.getByRole('button', { name: 'Ajouter un point de Conjonction', exact: true }));
        await r.cliquer(f.getByRole('button', { name: 'Retirer un point de Seuil RK', exact: true }));
        await r.legende('Le lieu et le ciel modifient les Ka au jet.', 'Plexus de Feu : +1 au Feu, −1 à ses opposés. Conjonction de Feu : encore +1.', 3100);
        await r.montrer(f.locator('[data-bandeau-des-reserves]').first(), 4000); await photo('07-lieu');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('players'));
        await ongletDeLaFiche(f, 'Lancer un test'); await r.choisir(principal, 'pastlives_0_degree'); await r.choisir(approche, 'ka_fire');
        await expect(panneau).toContainText('110 %'); await r.montrer(panneau.locator('[data-preparation-nephilim]'), 3000);
        await jeter([.65, .25]);
        await r.legende('Le Seuil RK mesure la discrétion occulte du lieu.', 'Un jeton pour la scène, pas automatiquement un jeton par jet. Ici le seuil est dépassé.', 3000);
        await r.cliquer(panneau.getByRole('button', { name: 'Ajouter un jeton à la Traque', exact: true }));
        await expect(panneau.getByRole('button', { name: 'Jeton ajouté', exact: true })).toBeDisabled();
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('cockpit'));
        const traquePlus = f.getByRole('button', { name: 'Ajouter un point de Jauge de Traque', exact: true });
        await r.cliquer(traquePlus); await r.cliquer(traquePlus); await r.cliquer(traquePlus);
        await expect.poll(async () => (await reserves()).intensiteDeTraque).toBe(2);
        await expect.poll(async () => (await reserves()).jaugeDeTraque).toBe(0);
        await r.legende('Quatre jetons atteignent le Seuil RK 4 : la jauge se vide, l’Intensité monte.', 'GM-OS applique la montée aussitôt, choix de David ; l’errata la place à l’aube suivante.', 3700);
        await r.montrer(f.locator('[data-bandeau-des-reserves]').first(), 3200); await photo('08-traque');
        await r.cliquer(f.getByRole('button', { name: 'Retirer un point de Lieu magique', exact: true }));
        await r.cliquer(f.getByRole('button', { name: 'Retirer un point de Conjonction', exact: true }));
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('players'));
        await ongletDeLaFiche(f, 'Lancer un test');

        await chapitre('7 · Santé : cases et Conséquences'); await r.carte('sante-nephilim');
        const physique = f.locator('[data-piste="physique"]');
        await r.taper(physique.getByLabel('Dommages physique reçus'), '5'); await r.cliquer(physique.getByRole('button', { name: 'Proposer', exact: true }));
        await r.legende('Les dommages ne sont pas une simple soustraction de points de vie.', 'Pour cinq degrés : choisir une absorption permise, ici Mineure 2 + case de 3.', 3300);
        await r.montrer(physique.locator('[data-options-d-encaissement]'), 3200);
        await r.cliquer(physique.getByRole('button', { name: 'Conséquence mineure, et la case de 3', exact: true }));
        await expect.poll(async () => (await personnage()).sheetData.consequences_physical_minor_active).toBe(true);
        await r.montrer(physique, 3500); await photo('09-sante');
        await r.carte(''); await r.choisir(principal, 'pastlives_0_degree'); await r.choisir(approche, 'ka_fire');
        await expect(panneau).toContainText('70 %');
        await r.legende('Mineure : −2 au Vécu d’une action physique, puis l’approche s’ajoute.', '(Templier 4 − 2 + Feu 5) × 10 = 70 %. Le malus ne se retire pas du Ka.', 3300);
        await r.montrer(panneau.locator('[data-preparation-nephilim]'), 3000);
        await r.carte('sante-nephilim'); await r.cliquer(physique.getByRole('button', { name: 'Cinq minutes de repos', exact: true }));
        await expect.poll(async () => (await personnage()).sheetData.health_physical_case_3).toBe(false);
        await expect.poll(async () => (await personnage()).sheetData.consequences_physical_minor_active).toBe(true);
        await r.legende('Cinq minutes de repos libèrent les cases, pas les Conséquences.', 'Avec Ka-Terre 6 : cinq jours pour la Mineure physique. La piste magique est distincte.', 3200);

        await chapitre('8 · Chutes, recharge de Stase et expérience'); await r.carte('chutes-nephilim');
        const chutes = f.locator('[data-chutes-nephilim]');
        await r.cliquer(chutes.locator('[data-chute="khaiba"]').getByRole('button', { name: 'Mettre en jeu (+1 PS)', exact: true }));
        await expect.poll(async () => (await personnage()).sheetData.resources_sapience_chute).toBe(1);
        await r.legende('Mettre en jeu une Chute donne des PS de Chute, une fois par séance.', 'Réservés à l’Effet Mnémos ; le meneur pourra mettre cette Chute en scène.', 3400);
        await r.montrer(chutes, 3500); await photo('10-chutes');
        await r.carte('stase-nephilim');
        const stase = f.locator('[data-stase-nephilim]');
        await r.cliquer(stase.getByRole('button', { name: 'Un jour en Plexus ou Nexus : +1', exact: true }));
        await expect.poll(async () => (await personnage()).sheetData.stasis_degree).toBe(3);
        await r.legende('Un jour en Plexus ou Nexus : un degré de Stase, plafonné au Ka dominant.', 'Ici Feu 5. Quitter la Stase la remplit ; le test de Stase sert aux situations prévues par le livre.', 3300);
        await r.montrer(stase, 3200); await photo('11-stase');
        await r.carte('experience-nephilim');
        const experience = f.locator('[data-experience-nephilim]');
        await r.choisir(experience.getByLabel('Élément à élever'), 'pastlives_0_degree');
        await r.legende('En fin de séance, le coût du degré suivant est annoncé avant la dépense.', 'Templier 4 → 5 : cinq PS. Choisir une progression justifiée par le scénario.', 3100);
        await r.cliquer(experience.getByRole('button', { name: 'Dépenser 5 PS : 4 → 5', exact: true }));
        await expect.poll(async () => (await personnage()).sheetData.pastlives_0_degree).toBe(5);
        await expect.poll(async () => (await personnage()).sheetData.resources_sapience).toBe(1);
        await r.montrer(experience, 3000); await photo('12-experience');
        await r.titre('Prêt à poursuivre l’incarnation', ['Fiche › Lancer un test : préparer, lancer, puis confirmer les suites.',
            'Santé, Chutes, Stase et expérience : les cartes repliables sous le jet.',
            'Le récit, les effets des Arts et les décisions du meneur restent à la table.'], 6500);
        reussi = true; fin = Date.now();
    } catch (erreur) {
        await f.screenshot({ path: path.join(PREUVES, 'diagnostic-echec.jpg'), type: 'jpeg' });
        throw erreur;
    } finally {
        const video = f.video(); await g.fermer();
        const fichierVideo = await video?.path();
        if (reussi && fichierVideo) {
            const exportVideo = JSON.parse(execFileSync(process.execPath,
                ['outils/clips/exporter_clip.mjs', fichierVideo, SORTIE, 'nephilim-mecanismes', String((fin - ouverture) / 1000)], { encoding: 'utf8' }));
            fs.writeFileSync(path.join(PREUVES, 'verification.json'), JSON.stringify({ version: source.gameDriver.version, profilJetable: true,
                donneesPersonnelles: false, desPrepares: true, effetsFictifs: true, narrationSonore: false, modeRapide: !!process.env.GMOS_CLIP_RAPIDE,
                dureeDepuisTitre: (fin - ouverture) / 1000, chapitres, exportVideo,
                assertions: ['Mnémos 12 → 11 PS', 'Stase 4 → 2', 'critique 88/90 et Khaïba 2 → 1 sans gain de PS', 'Sacrifice 11 → 6 PS malgré 99',
                    'pacte noué après opposition', 'Materiae Primae Eau 6 → 4', 'Plexus et Conjonction : 110 %', 'Traque au seuil : 0 et Intensité 2',
                    'Mineure et case de 3, cible physique 70 %', 'repos conserve la Conséquence', 'PS de Chute séparés', 'Stase +1 par jour', 'expérience Templier 4 → 5, PS 6 → 1'] }, null, 2));
        }
        if (path.resolve(brut).startsWith(racineTemp + path.sep)) fs.rmSync(brut, { recursive: true, force: true });
        else console.error('Nettoyage temporaire refusé : chemin hors du dossier temporaire.');
    }
});
