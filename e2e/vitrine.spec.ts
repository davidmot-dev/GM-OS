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

function derniereSauvegarde(): string | null {
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

test.describe('la vitrine', () => {
    test.skip(process.env.GMOS_VITRINE !== '1', 'Sur demande seulement : GMOS_VITRINE=1');

    let gmos: GmOsLance;

    test.afterAll(async () => { await gmos?.fermer(); });

    test('le noyau pour Stitch — onze captures', async () => {
        test.setTimeout(480_000);

        const semence = derniereSauvegarde();
        expect(semence, `aucune sauvegarde dans ${DOSSIER_DES_SAUVEGARDES}`).not.toBeNull();
        expect(fs.existsSync(MIROIR_DES_MEDIAS), `miroir absent : ${MIROIR_DES_MEDIAS}`).toBe(true);
        console.log(`[Vitrine] semence : ${semence}`);

        gmos = await lancerGmOs({
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
        const capturer = async (fichier: string) => {
            await gmos.fenetre.waitForTimeout(2_500);
            await attendreLaFinDeLAccueil(gmos);
            await gmos.fenetre.screenshot({ path: path.join(SORTIE, fichier) });
            console.log(`[Vitrine] ${fichier}`);
        };
        const dans = <T>(fn: () => T | Promise<T>) => gmos.fenetre.evaluate(fn);

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
        await capturer('6-lumiere.png');

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
        await gmos.fenetre.getByRole('button', { name: /^Lancer$/i }).first().click();
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
