import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';
import { extraireJetons } from '../src/theme/jetonsDeTheme';

/**
 * **La vitrine — tes vrais écrans, capturés sans toucher à ton profil.**
 *
 * Essai de faisabilité du 2026-09-25, pour la refonte de l'interface : peut-on
 * donner à Stitch des captures **représentatives** sans une séance de captures
 * à la main ?
 *
 * L'instance est jetable, comme toutes celles des essais. Elle est semée par
 * **la dernière sauvegarde automatique** (tes campagnes) et reçoit **une copie
 * du miroir des médias** (tes images), qu'elle remet dans sa propre base par le
 * vrai bouton « Restaurer depuis la sauvegarde ». Rien n'est lu en écriture
 * hors du profil jetable.
 *
 * ⚠️ **Ne tourne que sur demande** (`GMOS_VITRINE=1`) : elle dépend de la
 * machine du meneur — ses sauvegardes, son miroir — et n'a rien à faire dans
 * une exécution ordinaire des essais.
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'e2e-resultats', 'vitrine');

const DOSSIER_DES_SAUVEGARDES =
    process.env.GMOS_VITRINE_SAUVEGARDES || 'C:\\Projet_David\\Security_Backup_GMOS';
const MIROIR_DES_MEDIAS = process.env.GMOS_VITRINE_MIROIR
    || path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'gm-os-v5', 'backups', 'medias');

/** La taille logique d'une dalle du Zenbook Duo — ce que voit le meneur. */
const LARGEUR = 1440;
const HAUTEUR = 900;

/**
 * La semence : la dernière sauvegarde du dossier, ou **un fichier désigné**
 * par `GMOS_VITRINE_SEMENCE`. Ajouté le 2026-09-27 : les sauvegardes récentes
 * n'avaient plus de journal (supprimés par David), celle du 22/09 en a un de
 * 111 événements — c'est elle qui montre le Journal dans son état.
 */
function derniereSauvegarde(): string | null {
    const designee = process.env.GMOS_VITRINE_SEMENCE;
    if (designee) return fs.existsSync(designee) ? designee : null;
    if (!fs.existsSync(DOSSIER_DES_SAUVEGARDES)) return null;
    const fichiers = fs.readdirSync(DOSSIER_DES_SAUVEGARDES)
        .filter(n => /^gmos-auto-.*\.json$/.test(n))
        .sort();
    return fichiers.length ? path.join(DOSSIER_DES_SAUVEGARDES, fichiers[fichiers.length - 1]) : null;
}

/** La semence, à la taille du Zenbook, les campagnes arrivées. */
async function preparerLaVitrine(gmos: GmOsLance): Promise<void> {
    await attendreLHydratation(gmos);

    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate((w, [l, h]) => { w.unmaximize(); w.setContentSize(l, h); }, [LARGEUR, HAUTEUR]);
    /*
      ⛔ **Muette.** La vitrine fait jouer les deux platines de Music-OS pour de
      vrai : sans ça, la musique sortirait dans les enceintes du meneur.
    */
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));

    /*
      ⛔ **L'hydratation n'est pas la semence.** La base relue porte d'abord
      `INITIAL_DATA` (deux campagnes d'usine) ; la semence arrive après.
      Lire tout de suite a fait écrire au premier essai « The Eternal
      Quest » dans le journal — alors que les captures montraient bien
      Blade Runner. *Un journal qui lit trop tôt ment avec l'autorité d'une
      mesure.*
    */
    await gmos.fenetre.waitForFunction(() => {
        const s = (window as never as { useSessionOSStore: { getState: () => { campaigns: unknown[] } } })
            .useSessionOSStore.getState();
        return s.campaigns.length > 2;
    }, undefined, { timeout: 30_000 });

    const campagnes = await gmos.fenetre.evaluate(() => {
        const s = (window as never as { useSessionOSStore: { getState: () => { campaigns: { name: string }[]; activeCampaignId: string | null } } })
            .useSessionOSStore.getState();
        return { noms: s.campaigns.map(c => c.name), active: s.activeCampaignId };
    });
    console.log(`[Vitrine] campagnes : ${campagnes.noms.join(' · ')} — active : ${campagnes.active}`);

    /*
      **L'écran d'accueil reste cinq secondes** (`SplashScreenSelector`), tiré au
      hasard parmi quatre. La vitrine d'un thème, qui ne restaure pas les
      médias, allait plus vite que lui : sa première capture a montré
      « EMERGENCY RECOVERY PROTOCOL » au lieu du Cockpit.
    */
    await attendreLaFinDeLAccueil(gmos);
}

async function attendreLaFinDeLAccueil(gmos: GmOsLance): Promise<void> {
    /* Par son attribut, pas par ses classes : la palette porte les mêmes (`fixed inset-0 z-[9999]`). */
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
}

/**
 * **Mettre en scène : un combat en cours.** La sauvegarde n'en porte pas — un
 * écran au repos ne dit rien. Les données hostiles du plan : onze combattants,
 * un nom long, `148/155`, une jauge à zéro.
 */
async function mettreEnSceneUnCombat(gmos: GmOsLance): Promise<void> {
    await gmos.fenetre.evaluate(() => {
        const combat = (window as never as {
            useCombatStore: { getState: () => { addCombatant: (c: Record<string, unknown>) => void } };
        }).useCombatStore.getState();
        const figurants: [string, number, number | undefined, number | undefined, boolean, string][] = [
            ['Rick Deckard', 18, 12, 14, true, 'player'],
            ['Rachael Tyrell', 16, 9, 10, true, 'player'],
            ['Gaff', 15, 11, 11, true, 'player'],
            ['Roy Batty — Nexus-6 de combat', 21, 148, 155, false, 'enemy'],
            ['Pris Stratton', 19, 0, 12, false, 'enemy'],
            ['Leon Kowalski', 14, 7, 16, false, 'enemy'],
            ['Zhora Salome', 13, 10, 10, false, 'enemy'],
            ['Agent de la LAPD', 11, 8, 8, false, 'ally'],
            ['Garde de la Tyrell Corp.', 10, 6, 9, false, 'enemy'],
            ['Marchand de nouilles', 7, 4, 4, false, 'neutral'],
            ['Drone de surveillance', 5, 3, 6, false, 'enemy'],
        ];
        for (const [name, init, hp, hpMax, isPlayer, faction] of figurants) {
            combat.addCombatant({ name, init, hp, hpMax, isPlayer, faction, statuses: [] });
        }
    });
}

/** Capturer l'écran entier, et ce qui défile, page par page. */
function outilsDeCapture(gmos: GmOsLance, sortie: string) {
    const capturer = async (fichier: string) => {
        await gmos.fenetre.waitForTimeout(2_500);
        await attendreLaFinDeLAccueil(gmos);
        await gmos.fenetre.screenshot({ path: path.join(sortie, fichier) });
        console.log(`[Vitrine] ${fichier}`);
    };

    /*
      ⛔ **Ce qui défile ne se voit pas sur une capture.** Le panneau de réglages
      de la carte compte treize sections, et Stitch a réorganisé la carte
      **sans voir la moitié de ses commandes** (2026-09-26). On repère le
      conteneur qui défile autour d'un texte, et on le capture page par page.
    */
    const capturerEnDefilant = async (prefixe: string, repere: string, maxPages = 6) => {
        const pages = await gmos.fenetre.evaluate((source) => {
            document.querySelectorAll('[data-vitrine-defilement]').forEach(e => e.removeAttribute('data-vitrine-defilement'));
            const motif = new RegExp(source, 'i');
            const titre = [...document.querySelectorAll('*')]
                .find(e => e.children.length === 0 && motif.test(e.textContent ?? ''));
            let boite: HTMLElement | null = (titre as HTMLElement | undefined)?.parentElement ?? null;
            while (boite && !(boite.scrollHeight > boite.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(boite).overflowY))) {
                boite = boite.parentElement;
            }
            if (!boite) return 0;
            boite.setAttribute('data-vitrine-defilement', '');
            boite.scrollTop = 0;
            return Math.ceil(boite.scrollHeight / (boite.clientHeight * 0.85));
        }, repere);
        for (let i = 0; i < Math.min(pages, maxPages); i++) {
            if (i > 0) {
                await gmos.fenetre.evaluate(() => {
                    const b = document.querySelector<HTMLElement>('[data-vitrine-defilement]');
                    if (b) b.scrollTop += b.clientHeight * 0.85;
                });
            }
            await capturer(`${prefixe}-${i + 1}.png`);
        }
        return pages;
    };

    return { capturer, capturerEnDefilant };
}

/**
 * **L'instance de la vitrine, campagnes ET images du meneur.** Commune aux
 * deux tours pour Stitch : la semence porte les campagnes, le miroir copié les
 * images, remises dans la base par le vrai bouton.
 */
async function lancerLaVitrineAvecSesMedias(): Promise<GmOsLance> {
    const semence = derniereSauvegarde();
    expect(semence, `aucune sauvegarde dans ${DOSSIER_DES_SAUVEGARDES}`).not.toBeNull();
    expect(fs.existsSync(MIROIR_DES_MEDIAS), `miroir absent : ${MIROIR_DES_MEDIAS}`).toBe(true);
    console.log(`[Vitrine] semence : ${semence}`);

    const gmos = await lancerGmOs({
        semence: semence!,
        /* Copié, jamais lié : l'instance ne doit pas pouvoir écrire dans le vrai miroir. */
        preparerLeProfil: profil => {
            fs.cpSync(MIROIR_DES_MEDIAS, path.join(profil, 'backups', 'medias'), { recursive: true });
        },
    });
    await preparerLaVitrine(gmos);

    /* Les images : par le vrai bouton, comme le ferait le meneur. */
    await ouvrirLeModule(gmos, 'Image-OS');
    const restaurer = gmos.fenetre.getByRole('button', { name: /Restaurer depuis la sauvegarde/ });
    await expect(restaurer).toBeVisible({ timeout: 20_000 });
    await restaurer.click();
    const avis = gmos.fenetre.getByText(/média\(s\) restauré\(s\)/);
    await expect(avis).toBeVisible({ timeout: 180_000 });
    /* La notification recouvrait le bas de la première capture. */
    await expect(avis).toBeHidden({ timeout: 20_000 }).catch(() => undefined);
    return gmos;
}

test.describe('la vitrine', () => {
    test.skip(process.env.GMOS_VITRINE !== '1', 'Sur demande seulement : GMOS_VITRINE=1');

    let gmos: GmOsLance;

    test.afterAll(async () => { await gmos?.fermer(); });

    test('le noyau pour Stitch — onze captures', async () => {
        test.setTimeout(480_000);

        gmos = await lancerLaVitrineAvecSesMedias();

        await mettreEnSceneUnCombat(gmos);

        fs.mkdirSync(SORTIE, { recursive: true });
        for (const [module, fichier] of [
            ['Combat-OS', '1-combat.png'],
            ['Dice-OS', '2-des.png'],
            ['Image-OS', '3-image.png'],
        ] as const) {
            await ouvrirLeModule(gmos, module);
            /* Le module est chargé à la demande, et ses images se décodent après. */
            await gmos.fenetre.waitForTimeout(2_500);
            /* Un jet qui vient de tomber, par le vrai bouton. */
            if (module === 'Dice-OS') {
                await gmos.fenetre.getByRole('button', { name: /^Lancer$/i }).first().click();
                await gmos.fenetre.waitForTimeout(2_500);
            }
            await gmos.fenetre.screenshot({ path: path.join(SORTIE, fichier) });
            console.log(`[Vitrine] ${fichier}`);
        }

        /*
          ── **Le reste du noyau pour Stitch** (§ 0 du plan de la refonte), chaque
          écran dans l'état que l'inventaire décrit
          (`documentation/Planning/2026-09-25-inventaire-des-ecrans.md`). ──
        */
        const { capturer, capturerEnDefilant } = outilsDeCapture(gmos, SORTIE);
        const dans = <T>(fn: () => T | Promise<T>) => gmos.fenetre.evaluate(fn);

        /* 1.25 · Les modes de Dice-OS — « la fenêtre avec les modes doit être mieux agencée ». */
        await ouvrirLeModule(gmos, 'Dice-OS');
        const listeDesModes = gmos.fenetre.locator('select:has(option[value="yze"])').first();
        for (const mode of ['pool', 'yze', 'formula', 'threshold']) {
            await listeDesModes.selectOption(mode).catch(() => undefined);
            await capturer(`2-des-mode-${mode}.png`);
        }
        await listeDesModes.selectOption('standard').catch(() => undefined);

        /* 3.1 · Musique : les deux platines qui jouent, fondu croisé à mi-course. */
        await ouvrirLeModule(gmos, 'Musique');
        const platines = await dans(async () => {
            type Pad = { label: string; url: string };
            const musique = (window as never as { useMusicStore: { getState: () => {
                playlists: { id: string; name: string; pads: (Pad | null)[] }[];
                setActivePlaylistId: (id: string) => void;
                loadToDeck: (d: 'A' | 'B', p: Pad) => Promise<void>;
                playDeck: (d: 'A' | 'B') => Promise<void>;
                setCrossfader: (v: number) => void;
            } } }).useMusicStore.getState();
            const liste = musique.playlists.find(p => p.pads.filter(x => x?.url).length >= 2);
            if (!liste) return 'aucune playlist de deux morceaux';
            const [a, b] = liste.pads.filter((x): x is Pad => !!x?.url);
            musique.setActivePlaylistId(liste.id);
            await musique.loadToDeck('A', a);
            await musique.loadToDeck('B', b);
            await musique.playDeck('A').catch(() => undefined);
            await musique.playDeck('B').catch(() => undefined);
            musique.setCrossfader(0.5);
            return `${liste.name} : ${a.label} / ${b.label}`;
        });
        console.log(`[Vitrine] platines — ${platines}`);
        await capturer('4-musique.png');

        /* 2.4 · Cartographie : une carte de la campagne, brouillard partiellement levé, des jetons. */
        await ouvrirLeModule(gmos, 'Cartographie');
        const carte = await dans(async () => {
            const session = (window as never as { useSessionOSStore: { getState: () => {
                activeCampaignId: string | null;
                atlasMaps: { name: string; fileUrl: string; isVideo?: boolean; campaignId?: string }[];
            } } }).useSessionOSStore.getState();
            const choisie = session.atlasMaps.find(m => m.campaignId === session.activeCampaignId && !m.isVideo && m.fileUrl);
            if (!choisie) return null;
            const magasin = (window as never as { useMapStore: { getState: () => {
                setMap: (u: string, v?: boolean, n?: string) => Promise<void>;
            } } }).useMapStore;
            await magasin.getState().setMap(choisie.fileUrl, false, choisie.name);
            return choisie.name;
        });
        console.log(`[Vitrine] carte — ${carte ?? 'aucune carte dans la campagne active'}`);
        if (carte) {
            /* Le brouillard se pose sur les dimensions de la carte : on attend qu'elle soit décodée. */
            await gmos.fenetre.waitForFunction(() => {
                const m = (window as never as { useMapStore: { getState: () => { mapWidth: number } } }).useMapStore.getState();
                return m.mapWidth > 0;
            }, undefined, { timeout: 20_000 }).catch(() => undefined);
            await dans(() => {
                const magasin = (window as never as { useMapStore: { getState: () => {
                    mapWidth: number; mapHeight: number;
                    setFogDataUrl: (u: string) => void;
                    clearTokens: () => void;
                    addToken: (t: Record<string, unknown>) => void;
                } } }).useMapStore.getState();
                const { mapWidth: l, mapHeight: h } = magasin;
                if (!l || !h) return;
                /* Noir = brouillard, transparent = levé (`FogEngine`) : deux clairières reliées. */
                const toile = document.createElement('canvas');
                toile.width = l; toile.height = h;
                const c = toile.getContext('2d')!;
                c.fillStyle = 'black';
                c.fillRect(0, 0, l, h);
                c.globalCompositeOperation = 'destination-out';
                for (const [x, y, r] of [[0.3, 0.55, 0.22], [0.55, 0.45, 0.16]] as const) {
                    c.beginPath();
                    c.arc(l * x, h * y, Math.min(l, h) * r, 0, Math.PI * 2);
                    c.fill();
                }
                magasin.setFogDataUrl(toile.toDataURL('image/png'));
                magasin.clearTokens();
                for (const [name, x, y] of [
                    ['Rick Deckard', 0.26, 0.5], ['Rachael Tyrell', 0.32, 0.6], ['Gaff', 0.36, 0.48],
                    ['Roy Batty', 0.58, 0.44],
                ] as const) {
                    /* Taille 1 = une case : un point à peine visible sur une carte entière. */
                    magasin.addToken({ name, avatar: '', x: l * x, y: h * y, size: 3, isVisible: true });
                }
            });
        }
        await capturer('5-carte.png');
        /* Treize sections de réglages : brouillard, formes, magie, danger, météo, heure, grille, combat… */
        await capturerEnDefilant('5-carte-reglages', 'Gestion des Couches');

        /* 2.7 · Light-OS : les tuiles de la campagne, une scène active (aucune lampe : `GMOS_SANS_APPAREILS`). */
        await ouvrirLeModule(gmos, 'Light-OS');
        const scene = await dans(() => {
            const lumiere = (window as never as { useLightStore: { getState: () => {
                scenes: Record<string, { id: string; name: string; campagneId?: string | null }>;
                setActiveScene: (id: string | null) => void;
            } } }).useLightStore.getState();
            const campagne = (window as never as { useSessionOSStore: { getState: () => { activeCampaignId: string | null } } })
                .useSessionOSStore.getState().activeCampaignId;
            const toutes = Object.values(lumiere.scenes);
            const choisie = toutes.find(s => s.campagneId === campagne && s.name) ?? toutes.find(s => s.name);
            if (choisie) lumiere.setActiveScene(choisie.id);
            return choisie?.name ?? null;
        });
        console.log(`[Vitrine] scène de lumière — ${scene ?? 'aucune'}`);
        /*
          ⚠️ **Sans pont Hue, aucune lampe à l'écran** — or la note de David porte
          justement sur « la disposition des lampes en dessous ». Le mode simulé
          de Light-OS en fournit ; `GMOS_SANS_APPAREILS` garantit qu'aucune vraie
          lampe ne bouge.
        */
        await dans(() => {
            (window as never as { useLightStore: { getState: () => { setConnection: (s: string) => void } } })
                .useLightStore.getState().setConnection('mock');
        });
        await capturer('6-lumiere.png');
        await capturerEnDefilant('6-lumiere-tuiles', 'Cette campagne');
        await capturerEnDefilant('6-lumiere-panneau', 'Actions rapides');

        /* 1.3 et 1.4 · La trame de la campagne active : l'arbre, puis le graphe. */
        await ouvrirLeModule(gmos, 'Tableau de Bord');
        await dans(() => {
            (window as never as { useSessionOSStore: { getState: () => { setCurrentView: (v: string) => void } } })
                .useSessionOSStore.getState().setCurrentView('trame');
        });
        /* Les actes s'ouvrent repliés : on déplie le plus fourni, pour que ses scènes et leurs statuts se voient. */
        const acte = await dans(() => {
            const s = (window as never as { useSessionOSStore: { getState: () => {
                activeCampaignId: string | null;
                actes: { id: string; campaignId: string; titre: string }[];
                scenes: { acteId: string }[];
            } } }).useSessionOSStore.getState();
            const actes = s.actes.filter(a => a.campaignId === s.activeCampaignId);
            const compte = (id: string) => s.scenes.filter(sc => sc.acteId === id).length;
            return actes.sort((a, b) => compte(b.id) - compte(a.id))[0]?.titre ?? null;
        });
        if (acte) await gmos.fenetre.getByText(acte, { exact: true }).first().click();
        await capturer('7-trame-arbre.png');
        await gmos.fenetre.getByRole('button', { name: /^Graphe$/ }).first().click();
        /* Le graphe s'ouvre en disposition libre ; « Ranger » le met en chaîne ou en étoile. */
        await gmos.fenetre.getByRole('button', { name: /Ranger/ }).first().click().catch(() => undefined);
        /*
          Ranger remplace les positions épinglées, donc il demande confirmation.
          Dans l'instance jetable, le confirmer ne touche à rien du vrai profil.
        */
        const confirmer = gmos.fenetre.getByRole('button', { name: /^Confirmer$/ });
        if (await confirmer.isVisible().catch(() => false)) await confirmer.click();
        await capturer('8-trame-graphe.png');

        /* 1.26 · Horloge : un minuteur lancé, trois jauges dont une dans son dernier quart. */
        await ouvrirLeModule(gmos, 'Horloge & Temps');
        await dans(() => {
            const horloge = (window as never as { useClockStore: { getState: () => {
                tensions: { id: string; name: string }[];
                setTimer: (s: number) => void; startTimer: () => void; setTimerLabel: (l: string) => void;
                addTensionClock: (n: string, t: number) => void;
                updateTensionSegments: (id: string, d: number) => void;
            } } }).useClockStore;
            const h = horloge.getState();
            h.setTimer(25 * 60);
            h.setTimerLabel('Avant l\'arrivée de la LAPD');
            h.startTimer();
            for (const [nom, total, remplis] of [
                ['Alerte de la Tyrell Corp.', 8, 7], ['Traque de Roy Batty', 6, 3], ['Réserve de Sang-froid', 4, 1],
            ] as const) {
                horloge.getState().addTensionClock(nom, total);
                const jauge = horloge.getState().tensions.find(t => t.name === nom);
                if (jauge) horloge.getState().updateTensionSegments(jauge.id, remplis);
            }
        });
        await capturer('9-horloge.png');

        /* 1.22 · Combat en régime table — « mettre plus d'emphase sur cette fonctionnalité ». */
        await ouvrirLeModule(gmos, 'Combat-OS');
        await gmos.fenetre.getByTitle(/Passer à la table/).first().click();
        await capturer('10-combat-table.png');
        await gmos.fenetre.getByTitle(/Repasser en atelier/).first().click();

        /* Combat en thème clair : le bouton palette fait tourner les quatre thèmes de base. */
        for (let i = 0; i < 4; i++) {
            const actuel = await dans(() => document.documentElement.getAttribute('data-theme'));
            if (actuel === 'claire') break;
            await gmos.fenetre.locator('button[title*="cyberpunk"], button[title*="medieval"], button[title*="modern"]').first().click();
            await gmos.fenetre.waitForTimeout(400);
        }
        await capturer('11-combat-clair.png');
    });
});

/**
 * **Le deuxième tour pour Stitch — décidé par David le 2026-09-27.**
 *
 * Le premier tour n'a montré à Stitch que le noyau (neuf écrans) ; David veut
 * une application cohérente partout : *« ce n'est pas parce que je n'ai pas eu
 * de vraie plainte qu'il ne faut pas en profiter pour revoir le design »*.
 * Ici, le reste des sections 0 à 6 de l'inventaire, rangé par lot — un lot,
 * un prompt (`documentation/Planning/2026-09-27-prompts-stitch-tour-2.md`).
 *
 *   $env:GMOS_VITRINE='2'; npx playwright test e2e/vitrine.spec.ts
 *
 * ⭐ **Une capture manquée ne coûte pas les autres.** Chaque écran s'ouvre
 * dans son propre essai ; un échec est noté, la surcouche refermée, et la
 * liste des manques fait rougir le test **à la fin**, avec toutes les
 * captures déjà sur le disque.
 */
test.describe('la vitrine, deuxième tour', () => {
    test.skip(process.env.GMOS_VITRINE !== '2', 'Sur demande seulement : GMOS_VITRINE=2');

    let gmos: GmOsLance;

    test.afterAll(async () => { await gmos?.fermer(); });

    test('le reste de l\'inventaire, par lot', async () => {
        test.setTimeout(900_000);

        gmos = await lancerLaVitrineAvecSesMedias();
        await mettreEnSceneUnCombat(gmos);

        const sortie = path.join(SORTIE, 'tour-2');
        fs.mkdirSync(sortie, { recursive: true });
        const { capturer, capturerEnDefilant } = outilsDeCapture(gmos, sortie);
        const f = gmos.fenetre;

        const manques: string[] = [];
        const essayer = async (nom: string, geste: () => Promise<void>) => {
            try {
                await geste();
            } catch (e) {
                manques.push(nom);
                console.log(`[Vitrine] ⚠️ ${nom} — ${String(e).split('\n')[0]}`);
                await f.keyboard.press('Escape').catch(() => undefined);
            }
        };
        const bouton = (nom: RegExp) => f.getByRole('button', { name: nom }).first();
        /* Une surcouche se referme par Échap : le registre unique des surcouches. */
        const refermer = async () => { await f.keyboard.press('Escape'); await f.waitForTimeout(500); };
        /*
          ⛔ **À la table, une vue de préparation renvoie au cockpit**
          (`affiniteDesVues.ts`). La semence du 22/09 arrive séance ouverte, donc
          à la table : sept captures du lot G montraient le cockpit. On force
          l'atelier, comme le bouton du bandeau.
        */
        const enAtelier = async () => {
            const repasser = f.getByTitle(/^Repasser en atelier/).first();
            if (await repasser.isVisible().catch(() => false)) {
                await repasser.click();
                await f.waitForTimeout(500);
            }
        };
        const vue = async (v: string) => {
            await ouvrirLeModule(gmos, 'Tableau de Bord');
            await enAtelier();
            await f.evaluate((v) => {
                (window as never as { useSessionOSStore: { getState: () => { setCurrentView: (v: string) => void } } })
                    .useSessionOSStore.getState().setCurrentView(v);
            }, v);
        };

        /*
          ⛔ **Une séance ouverte chasse les écrans de préparation** vers le
          cockpit (`useLayoutManager`, moment « partie »), quel que soit le
          régime forcé. La semence du 22/09 arrive séance ouverte : on la met de
          côté ici, et l'étape E0 la rouvre pour les lots qui en ont besoin.
        */
        await f.evaluate(() => {
            /* Le moment vaut « partie » dès qu'UNE séance, de n'importe quelle campagne, est `active` (`momentDeJeu`). */
            const s = (window as never as { useSessionOSStore: { getState: () => {
                sessions: { id: string; status: string }[];
                updateSession: (id: string, m: Record<string, unknown>) => void;
            } } }).useSessionOSStore.getState();
            for (const seance of s.sessions.filter(x => x.status === 'active')) s.updateSession(seance.id, { status: 'planned' });
        });
        /* L'inventaire décrit chaque écran en atelier, sauf ceux « régime table ». */
        await enAtelier();

        /* ── Lot A · Image-OS (2.1 à 2.3, et 6.8) ── */
        await essayer('A · Image-OS', async () => {
            await ouvrirLeModule(gmos, 'Image-OS');
            const mise = await f.evaluate(() => {
                type Media = { id: string; path: string; folderId?: string | null; isFavorite?: boolean };
                const img = (window as never as { useImageStore: { getState: () => {
                    mediaList: Media[]; projectionTarget: string;
                    setActiveFolderId: (id: string | null) => void;
                    setProjection: (cible: string, chemin: string | null) => void;
                    toggleMediaFavorite: (id: string) => void;
                    creerDiaporama: (nom: string) => string;
                    ajouterAuDiaporama: (d: string, m: string) => void;
                    setCurrentView: (v: string) => void;
                } } }).useImageStore.getState();
                const images = img.mediaList.filter(m => !/\.(mp4|webm|mov|mkv)$/i.test(m.path));
                /* Un dossier ouvert : le plus fourni. */
                const compte = new Map<string, number>();
                for (const m of images) if (m.folderId) compte.set(m.folderId, (compte.get(m.folderId) ?? 0) + 1);
                const dossier = [...compte.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
                const duDossier = images.filter(m => !dossier || m.folderId === dossier);
                img.setActiveFolderId(dossier);
                /*
                  Une image projetée : l'état seul, aucune fenêtre ne s'ouvre.
                  ⚠️ Les projections rangent l'IDENTIFIANT du média (`ImagePad`),
                  pas son chemin : avec le chemin, aucune tuile ne s'allumait.
                */
                if (duDossier[0]) img.setProjection(img.projectionTarget, duDossier[0].id);
                for (const m of images.slice(0, 6)) if (!m.isFavorite) img.toggleMediaFavorite(m.id);
                const diaporama = img.creerDiaporama('Planque de Deckard');
                for (const m of duDossier.slice(0, 8)) img.ajouterAuDiaporama(diaporama, m.id);
                img.setCurrentView('library');
                return `${images.length} images, ${duDossier.length} dans le dossier ouvert`;
            });
            console.log(`[Vitrine] Image-OS — ${mise}`);
            /*
              ⛔ **Les tuiles nées pendant la restauration restent vides.**
              `useMediaUrl` cherche l'image dans la base à la création de la
              tuile et ne réessaie pas tant que le chemin ne change pas : les
              tuiles, montées avant l'écriture des images, gardaient `url("")`
              (mesuré le 2026-09-27). On quitte le module et on y revient.
            */
            const tuilesPleines = () => f.evaluate(() => [...document.querySelectorAll<HTMLElement>('[style*="background-image"]')]
                .filter(e => /url\(['"]?[^'")]/.test(e.style.backgroundImage)).length);
            /* La restauration peut écrire ses images après le premier aller-retour : on recommence. */
            for (let essai = 0; essai < 5; essai++) {
                await ouvrirLeModule(gmos, 'Dice-OS');
                await ouvrirLeModule(gmos, 'Image-OS');
                await f.waitForTimeout(3_000);
                if (await tuilesPleines() >= 4) break;
            }
            /*
              ⚠️ **Les vignettes arrivent après la restauration.** La première
              capture, prise aussitôt, montrait des tuiles sans image — alors que
              les diaporamas, capturés ensuite, avaient les leurs.
            */
            await f.waitForFunction(() => [...document.querySelectorAll<HTMLElement>('[style*="background-image"]')]
                .filter(e => /url\(['"]?[^'")]/.test(e.style.backgroundImage)).length >= 4, undefined, { timeout: 30_000 })
                .catch(async () => {
                    /* Ce que portent vraiment les tuiles : on mesure au lieu de deviner. */
                    const tuiles = await f.evaluate(() => [...document.querySelectorAll<HTMLElement>('.aspect-video')]
                        .slice(0, 4)
                        .map(t => [...t.querySelectorAll<HTMLElement>('div')].map(d => d.style.backgroundImage).find(b => b !== undefined && b !== '') ?? '(aucun fond)')
                        .map(b => b.slice(0, 80)));
                    console.log(`[Vitrine] ⚠️ vignettes de la bibliothèque toujours vides — ${JSON.stringify(tuiles)}`);
                });
            await f.waitForTimeout(3_000);
            await capturer('A1-image-bibliotheque.png');
            for (const [v, fichier] of [
                ['diaporamas', 'A2-image-diaporamas.png'],
                ['favorites', 'A3-image-favoris.png'],
                ['recent', 'A4-image-recents.png'],
            ] as const) {
                await f.evaluate((v) => {
                    (window as never as { useImageStore: { getState: () => { setCurrentView: (v: string) => void } } })
                        .useImageStore.getState().setCurrentView(v);
                }, v);
                await capturer(fichier);
            }
        });
        await essayer('A5 · choix de l\'écran de projection', async () => {
            await ouvrirLeModule(gmos, 'Cartographie');
            await bouton(/Projeter la Carte/i).click({ timeout: 8_000 });
            await capturer('A5-choix-de-l-ecran.png');
            await refermer();
        });

        /* ── Lot B · Le son (3.3 à 3.5) — la fenêtre est muette ── */
        await essayer('B1 · Effets sonores', async () => {
            await ouvrirLeModule(gmos, 'Effets Sonores');
            await f.evaluate(async () => {
                const son = (window as never as { useSoundStore: { getState: () => {
                    atmospheres: { id: string; pads: Record<string, { id: string; filePath: string | null }> }[];
                    activeAtmosphereId: string | null;
                    triggerPad: (id: string) => Promise<void>;
                } } }).useSoundStore.getState();
                const atmosphere = son.atmospheres.find(a => a.id === son.activeAtmosphereId) ?? son.atmospheres[0];
                const pad = atmosphere && Object.values(atmosphere.pads).find(p => p.filePath);
                if (pad) await son.triggerPad(pad.id).catch(() => undefined);
            });
            await capturer('B1-effets-sonores.png');
        });
        await essayer('B2 · Ambiances', async () => {
            await ouvrirLeModule(gmos, 'Ambiances');
            await f.evaluate(async () => {
                const ambiance = (window as never as { useAmbientStore: { getState: () => {
                    tracks: { url: string; isPlaying: boolean }[];
                    toggleTrack: (i: number) => Promise<void>;
                    setTrackVolume: (i: number, v: number) => void;
                } } }).useAmbientStore.getState();
                const pleines = ambiance.tracks.map((t, i) => ({ t, i })).filter(x => x.t.url).slice(0, 3);
                const niveaux = [0.85, 0.5, 0.25];
                for (const [n, { t, i }] of pleines.entries()) {
                    if (!t.isPlaying) await ambiance.toggleTrack(i).catch(() => undefined);
                    ambiance.setTrackVolume(i, niveaux[n]);
                }
            });
            await capturer('B2-ambiances.png');
        });
        await essayer('B3 · Voice-OS', async () => {
            await ouvrirLeModule(gmos, 'Voice-OS');
            await capturer('B3-voice-os.png');
        });

        /* ── Lot C · Les PNJ (1.5, 1.6, 6.5, 4.4, 4.5) ── */
        await essayer('C1 · Galerie de PNJ', async () => {
            await vue('npc-gallery');
            await capturer('C1-pnj-galerie.png');
        });
        await essayer('C2 · Fiche de PNJ', async () => {
            const nom = await f.evaluate(() => {
                const s = (window as never as { useSessionOSStore: { getState: () => {
                    activeCampaignId: string | null;
                    entities: { id: string; name: string; type: string; campaignId: string; avatar?: string }[];
                    setSelectedEntity: (id: string | null) => void;
                } } }).useSessionOSStore.getState();
                const pnj = s.entities.filter(e => e.type === 'npc' && e.campaignId === s.activeCampaignId);
                const choisi = pnj.find(e => e.avatar) ?? pnj[0];
                if (choisi) s.setSelectedEntity(choisi.id);
                return choisi?.name ?? null;
            });
            if (!nom) throw new Error('aucun PNJ dans la campagne active');
            await capturer('C2-pnj-fiche.png');
        });
        await essayer('C3 · Graphe social', async () => {
            await vue('social-graph');
            await capturer('C3-graphe-social.png');
        });
        await essayer('C4 · Générateur PNJ', async () => {
            await ouvrirLeModule(gmos, 'Générateur PNJ');
            /* La semence peut arriver déjà à la table (séance ouverte) : on part du régime qu'on trouve. */
            const aLaTable = await f.getByTitle(/^Repasser en atelier/).count() > 0;
            const [ici, labas] = aLaTable
                ? ['C5-generateur-pnj-table.png', 'C4-generateur-pnj.png']
                : ['C4-generateur-pnj.png', 'C5-generateur-pnj-table.png'];
            const bascule = () => f.getByTitle(/^(Passer à la table|Repasser en atelier)/).first().click({ timeout: 8_000 });
            await capturer(ici);
            await bascule();
            await capturer(labas);
            await bascule();
        });

        /* ── Lot D · Les outils de séance (1.31 à 1.33, 1.23, 6.6, 6.7) ── */
        await essayer('D1 · Tables aléatoires', async () => {
            await ouvrirLeModule(gmos, 'Tables Aléatoires');
            await capturer('D1-tables.png');
            await f.getByTitle('Créer ou corriger une table').first().click({ timeout: 8_000 });
            await capturer('D2-tables-atelier.png');
            await refermer();
        });
        await essayer('D3 · Loot-OS', async () => {
            await vue('cockpit');
            await bouton(/^Loot-OS$/).click({ timeout: 8_000 });
            await capturer('D3-loot-generer.png');
            for (const [onglet, fichier] of [[/Pool Actif/i, 'D4-loot-reserve.png'], [/^Historique$/i, 'D5-loot-historique.png']] as const) {
                await bouton(onglet).click({ timeout: 5_000 });
                await capturer(fichier);
            }
            await refermer();
        });
        await essayer('D6 · Calcul des dégâts', async () => {
            await ouvrirLeModule(gmos, 'Combat-OS');
            await bouton(/Calculateur de Dégâts/i).click({ timeout: 8_000 });
            await capturer('D6-calcul-des-degats.png');
            await refermer();
        });
        await essayer('D7 · Fiche d\'un combattant', async () => {
            await ouvrirLeModule(gmos, 'Combat-OS');
            await f.getByTitle('Revoir la fiche de ce combattant').first().click({ timeout: 8_000 });
            await capturer('D7-fiche-combattant.png');
            await refermer();
        });
        await essayer('D8 · Atelier des adversaires', async () => {
            await ouvrirLeModule(gmos, 'Combat-OS');
            await bouton(/Fabriquer des adversaires/i).click({ timeout: 8_000 });
            await capturer('D8-atelier-des-adversaires.png');
            await refermer();
        });

        /* ── Lot G · La préparation (1.7, 1.8, 1.13 à 1.18, 1.27, 4.1 à 4.3, 4.6, 2.6) ── */
        for (const [v, fichier] of [
            ['library', 'G1-bibliotheque-des-campagnes.png'],
            ['players', 'G2-joueurs.png'],
            ['campaign-form', 'G4-campagne-formulaire.png'],
            ['rulebook', 'G5-grimoire.png'],
            ['rule-workshop', 'G6-atelier-des-regles.png'],
            ['templates', 'G7-modeles-de-fiche.png'],
            ['world-atlas', 'G8-atlas.png'],
            ['timeline-wiki', 'G9-chroniques.png'],
            /* Deux vues du lot E, mais de préparation : une séance ouverte les renverrait au cockpit. */
            ['session-prep', 'E4-preparation.png'],
            ['deck-library', 'E6-deck-bibliotheque.png'],
        ] as const) {
            await essayer(`${fichier} · vue ${v}`, async () => {
                await vue(v);
                await capturer(fichier);
            });
        }
        for (const [module, fichier] of [
            ['Forge', 'G10-forge.png'],
            ['Favoris', 'G11-favoris.png'],
            ['Tableau Blanc', 'G12-tableau-blanc.png'],
        ] as const) {
            await essayer(`${fichier} · ${module}`, async () => {
                await ouvrirLeModule(gmos, module);
                await capturer(fichier);
            });
        }
        await essayer('G13 · Atelier des calendriers', async () => {
            await ouvrirLeModule(gmos, 'Horloge & Temps');
            /* Le bouton ne vit que dans le mode « fantasy » (calendrier inventé). */
            await f.evaluate(() => {
                (window as never as { useClockStore: { getState: () => { setMode: (m: string) => void } } })
                    .useClockStore.getState().setMode('fantasy');
            });
            await f.getByTitle(/Atelier des calendriers/).first().click({ timeout: 8_000 });
            await capturer('G13-atelier-des-calendriers.png');
            await refermer();
        });

        /* ── Lot H · Médiathèque, Nexus, Paramètres, navigateur, aide (6.1 à 6.3, 4.7, 4.8, 5.1) ── */
        await essayer('H1 · Médiathèque', async () => {
            /* Le « Media Hub » du code s'appelle « Médiathèque » à l'écran ; la barre latérale vient d'abord. */
            await ouvrirLeModule(gmos, 'Médiathèque');
            await capturer('H1-mediatheque.png');
            await refermer();
        });
        await essayer('H2 · Paramètres', async () => {
            await f.getByTitle('Paramètres de l\'OS').first().click({ timeout: 8_000 });
            for (const [i, onglet] of ['Système', 'Tactique', 'IA', 'Télécommande', 'Thème du jeu'].entries()) {
                await bouton(new RegExp(`^${onglet}$`)).click({ timeout: 5_000 });
                await capturer(`H2-parametres-${i + 1}.png`);
            }
            await capturerEnDefilant('H3-atelier-du-theme', '^Couleurs$', 4);
            await refermer();
        });
        for (const [module, fichier] of [
            ['Nexus Wiki', 'H4-nexus.png'],
            ['Navigateur Web', 'H5-navigateur.png'],
        ] as const) {
            await essayer(`${fichier} · ${module}`, async () => {
                await ouvrirLeModule(gmos, module);
                await capturer(fichier);
            });
        }
        await essayer('H6 · Aide', async () => {
            await f.keyboard.press('Control+KeyH');
            await capturer('H6-aide.png');
            await refermer();
        });

        /*
          ⚠️ **L'ordre compte** : une séance ouverte renvoie la vue des détails
          de la campagne au cockpit. Ce qui en a besoin passe AVANT la séance.
        */
        await essayer('F5 · Fin de séance', async () => {
            await vue('campaign-details');
            await capturer('G3-campagne-details.png');
            /* Le bouton n'apparaît qu'au survol de la séance : on le force. */
            await f.getByTitle('Éditer', { exact: true }).first().click({ force: true, timeout: 8_000 });
            await capturer('F5-fin-de-seance.png');
            await refermer();
        });

        /* ── Lot E · Le poste du meneur (1.1, 1.2, 1.9 à 1.11, 1.19, 1.28 à 1.30) ── */
        /*
          ⚠️ **La sauvegarde n'a pas de séance en cours** : le premier essai a
          capturé un cockpit « Aucune session active » et un journal « Historique
          vide ». On prend le journal le plus fourni, on ouvre sa campagne, et on
          remet sa dernière séance en cours — dans l'instance jetable seulement.
        */
        await essayer('E0 · une séance en cours', async () => {
            const seance = await f.evaluate(() => {
                const journal = (window as never as { useJournalStore: { getState: () => {
                    journals: { id: string; title: string; campaignId?: string; events: unknown[] }[];
                    setActiveJournal: (id: string | null) => void;
                } } }).useJournalStore.getState();
                const s = (window as never as { useSessionOSStore: { getState: () => {
                    activeCampaignId: string | null;
                    campaigns: { id: string; name: string }[];
                    sessions: { id: string; campaignId: string; number: number }[];
                    setActiveCampaign: (id: string | null) => void;
                    updateCampaign: (id: string, m: Record<string, unknown>) => void;
                    updateSession: (id: string, m: Record<string, unknown>) => void;
                    setSelectedSession: (id: string | null) => void;
                } } }).useSessionOSStore.getState();
                const parTaille = [...journal.journals].sort((a, b) => b.events.length - a.events.length);
                const choisi = parTaille.find(j => j.campaignId === s.activeCampaignId && j.events.length >= 10)
                    ?? parTaille.find(j => j.campaignId) ?? parTaille[0];
                const campagne = choisi?.campaignId ?? s.activeCampaignId;
                if (!campagne) return null;
                if (campagne !== s.activeCampaignId) s.setActiveCampaign(campagne);
                const derniere = s.sessions.filter(x => x.campaignId === campagne).sort((a, b) => b.number - a.number)[0];
                if (derniere) {
                    s.updateSession(derniere.id, { status: 'active' });
                    s.updateCampaign(campagne, { activeSessionId: derniere.id });
                    /* Le focus MJ édite la séance SÉLECTIONNÉE ; sans elle : « Session introuvable ». */
                    s.setSelectedSession(derniere.id);
                }
                if (choisi) journal.setActiveJournal(choisi.id);
                return `${s.campaigns.find(c => c.id === campagne)?.name} — séance #${derniere?.number ?? '?'} — journal « ${choisi?.title ?? 'aucun'} » (${choisi?.events.length ?? 0} événements, ${journal.journals.length} journaux)`;
            });
            console.log(`[Vitrine] séance — ${seance}`);
            if (!seance) throw new Error('aucune campagne à mettre en séance');
            await f.waitForTimeout(2_000);
        });
        for (const [v, fichier] of [
            ['cockpit', 'E1-cockpit.png'],
            ['storyboard', 'E2-storyboard.png'],
            ['session-focus', 'E3-mj-focus.png'],
            ['deck-player', 'E5-deck-lecteur.png'],
        ] as const) {
            await essayer(`${fichier} · vue ${v}`, async () => {
                await vue(v);
                await capturer(fichier);
            });
        }
        await essayer('E7 · Oracle', async () => {
            await vue('cockpit');
            await f.getByTitle('Consulter l\'Oracle IA').first().click({ timeout: 8_000 });
            await capturer('E7-oracle.png');
            await refermer();
        });
        await essayer('E8 · Journal de jeu', async () => {
            await ouvrirLeModule(gmos, 'Journal de Jeu');
            await capturer('E8-journal.png');
            await capturerEnDefilant('E8-journal-suite', 'Compte rendu|État des lieux|Revue', 5);
        });

        /* ── Lot F · Le châssis et les surcouches communes (0.3, 6.9 à 6.12) ── */
        await essayer('F1 · Palette', async () => {
            await vue('cockpit');
            await f.keyboard.press('Control+KeyK');
            await f.keyboard.type('Roy');
            await capturer('F1-palette.png');
            await refermer();
        });
        await essayer('F2 · Confirmation', async () => {
            /* « Ranger » le graphe demande confirmation : une vraie boîte, qu'on annule. */
            await vue('trame');
            await bouton(/^Graphe$/).click({ timeout: 8_000 });
            await bouton(/Ranger/).click({ timeout: 5_000 });
            await expect(bouton(/^Confirmer$/)).toBeVisible({ timeout: 5_000 });
            await capturer('F2-confirmation.png');
            await refermer();
        });
        await essayer('F3 · Saisie', async () => {
            await ouvrirLeModule(gmos, 'Ambiances');
            await f.getByRole('button', { name: /Nouvel Univers/i }).or(f.getByTitle(/Nouvel Univers/i)).first().click({ timeout: 8_000 });
            await capturer('F3-saisie.png');
            await refermer();
        });
        await essayer('F4 · Instantanés', async () => {
            /* Le bouton « Snapshot » du bandeau ouvre les instantanés de la séance (`SessionSnapshotModal`). */
            await vue('cockpit');
            await bouton(/^Snapshot$/i).click({ timeout: 8_000 });
            await capturer('F4-instantanes.png');
            await refermer();
        });
        expect(manques, `écrans non capturés : ${manques.join(' · ')}`).toEqual([]);
    });
});

/**
 * **La vitrine d'un thème de jeu** — l'étape ④ du pipeline des thèmes
 * (`documentation/Architecture/Pipeline-des-themes.md`).
 *
 *   $env:GMOS_VITRINE_JEU='dune'; npx playwright test e2e/vitrine.spec.ts
 *
 * Le corpus de l'instance jetable est un dossier **vide**, par isolation : on
 * y copie le dossier `theme/` du jeu — et lui seul — avant le lancement. Puis
 * la campagne active reçoit ce jeu par son « Chemin des Règles », qui est
 * souverain dans `resoudreCorpus` : aucun jeu n'a besoin d'une campagne à lui
 * dans la sauvegarde pour être montré.
 *
 * ⚠️ Elle montre **l'interface d'aujourd'hui** : seuls les jetons LU s'y voient.
 * Un jeton V2 absent de l'écran n'est pas un défaut (§ 5 du pipeline).
 */
test.describe('la vitrine d\'un thème de jeu', () => {
    const jeu = process.env.GMOS_VITRINE_JEU ?? '';
    test.skip(!jeu, 'Sur demande seulement : GMOS_VITRINE_JEU=<jeu>');

    let gmos: GmOsLance;

    test.afterAll(async () => { await gmos?.fermer(); });

    test(`les écrans de référence sous le thème « ${jeu} »`, async () => {
        test.setTimeout(180_000);

        const theme = path.join(ICI, '..', 'docs', 'systems', jeu, 'theme');
        const feuille = path.join(theme, 'theme.css');
        expect(fs.existsSync(feuille), `aucun thème : ${feuille}`).toBe(true);
        const fond = extraireJetons(fs.readFileSync(feuille, 'utf-8')).jetons.bg;

        const semence = derniereSauvegarde();
        expect(semence, `aucune sauvegarde dans ${DOSSIER_DES_SAUVEGARDES}`).not.toBeNull();

        gmos = await lancerGmOs({
            semence: semence!,
            preparerLeProfil: profil => {
                fs.cpSync(theme, path.join(profil, 'corpus', 'systems', jeu, 'theme'), { recursive: true });
            },
        });
        await preparerLaVitrine(gmos);

        /*
          La campagne active joue désormais ce jeu. On la referme puis la
          rouvre : `useThemeDuJeu` ne relit le disque **qu'au changement de
          campagne** — c'est aussi pourquoi un `theme.css` modifié pendant que
          GM-OS tourne ne s'applique qu'en rouvrant la campagne.
        */
        await gmos.fenetre.evaluate(async (dossier) => {
            const magasin = (window as never as {
                useSessionOSStore: { getState: () => {
                    activeCampaignId: string | null; campaigns: { id: string }[];
                    updateCampaign: (id: string, m: Record<string, unknown>) => void;
                    setActiveCampaign: (id: string | null) => void;
                } };
            }).useSessionOSStore;
            const etat = magasin.getState();
            const id = etat.activeCampaignId ?? etat.campaigns[0].id;
            etat.updateCampaign(id, { systemPath: `systems/${dossier}` });
            etat.setActiveCampaign(null);
            await new Promise(r => setTimeout(r, 300));
            magasin.getState().setActiveCampaign(id);
        }, jeu);

        /* Le thème est appliqué quand le fond de l'interface est celui du jeu. */
        if (fond) {
            await gmos.fenetre.waitForFunction(
                (attendu) => document.documentElement.style.getPropertyValue('--app-bg').trim().toLowerCase() === attendu.toLowerCase(),
                fond, { timeout: 20_000 },
            );
        }

        await mettreEnSceneUnCombat(gmos);

        const sortie = path.join(SORTIE, jeu);
        fs.mkdirSync(sortie, { recursive: true });
        const capturer = async (fichier: string) => {
            await gmos.fenetre.waitForTimeout(2_000);
            /* Revenu après le basculement de campagne, plus tard qu'on ne le devine : on le vérifie à chaque capture. */
            await attendreLaFinDeLAccueil(gmos);
            await gmos.fenetre.screenshot({ path: path.join(sortie, fichier) });
            console.log(`[Vitrine] ${jeu}/${fichier}`);
        };

        /*
          Le poste du meneur, par le bouton de la barre latérale. ⚠️ Pas par
          `Ctrl+²` : la frappe simulée n'y arrivait qu'une fois sur deux (la
          capture montrait alors Musique-OS, où s'ouvre la sauvegarde), alors
          que le raccourci marche à la main — éprouvé par David le 2026-09-25.
        */
        await attendreLaFinDeLAccueil(gmos);
        await ouvrirLeModule(gmos, 'Tableau de Bord');
        await expect(gmos.fenetre.getByText(/Master Cockpit/i).first()).toBeVisible({ timeout: 10_000 });
        await capturer('1-cockpit.png');

        /* Un élément actif, un danger, une jauge à zéro. */
        await ouvrirLeModule(gmos, 'Combat-OS');
        await capturer('2-combat.png');

        /* Des chiffres, et un jet qui vient de tomber. */
        await ouvrirLeModule(gmos, 'Dice-OS');
        /*
          ⚠️ **« Lancer » n'existe qu'en réserve de dés** (Year Zero, échelonnés).
          Un système à dés ordinaires lance par le clic sur une face. La vitrine
          supposait Blade Runner actif ; le 2026-09-30, la sauvegarde avait Le
          Secret de Milo (Cthulhu Hack) : trente secondes d'attente, puis échec.
        */
        const lancer = gmos.fenetre.getByRole('button', { name: /^Lancer$/i });
        if (await lancer.count()) await lancer.first().click();
        // Le nom accessible d'une face est « d20 d20 » : le texte de l'image, puis le libellé.
        else await gmos.fenetre.getByRole('button', { name: /^d20(\s|$)/i }).first().click();
        await capturer('3-des.png');

        /* Du texte courant, des touches, des cartes : l'aide, par son raccourci. */
        await gmos.fenetre.keyboard.press('Control+KeyH');
        await capturer('4-aide.png');

        /* Une surcouche par-dessus un écran : la palette. */
        await gmos.fenetre.keyboard.press('Control+KeyK');
        await capturer('5-palette.png');
        await gmos.fenetre.keyboard.press('Escape');
    });
});
