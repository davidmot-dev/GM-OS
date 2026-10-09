import { test, expect } from '@playwright/test';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useMapStore } from '../src/modules/map/useMapStore';
import type { useStoryboardStore } from '../src/modules/storyboard/useStoryboardStore';
import type { useClockStore } from '../src/store/useClockStore';
import type { useFavoriteStore } from '../src/modules/favorite/useFavoriteStore';
import type { useWhiteboardStore, WhiteboardTool } from '../src/modules/whiteboard/useWhiteboardStore';
import type { useMusicStore } from '../src/modules/music/useMusicStore';
import type { useSoundStore } from '../src/modules/sound/useSoundStore';
import type { useAmbientStore } from '../src/modules/ambient/useAmbientStore';
import type { useJournalStore } from '../src/modules/journal/useJournalStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { CurrentView } from '../src/types/campaign.types';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, LES_PANNEAUX, type GmOsLance } from './lancerGmOs';

/**
 * **Les captures du manuel** — demandées par David le 2026-10-03 : *« au niveau
 * des User Guides, rajoute des captures d'écran pour expliquer et exemplifier »*.
 *
 * ⛔ **Jamais les données du meneur** : ses campagnes ne se lisent pas, et elles
 * finiraient dans git. Les écrans sont ceux d'une campagne de démonstration
 * fictive — la campagne d'essai, « Le Silence de Varn », enrichie ici.
 *
 * Régénérer, après un changement d'interface (construction à jour d'abord) :
 *
 *   npm run build
 *   npx playwright test e2e/capturesDuManuel.spec.ts
 *
 * Les images vont dans `documentation/User Guides/captures/`, en JPEG : une
 * centaine de captures en PNG pèserait plusieurs dizaines de mégaoctets.
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
/** Une sortie dédiée permet de relire les nouvelles captures dans e2e-resultats/. */
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CAPTURES_MANUEL
    ?? path.join(ICI, '..', 'documentation', 'User Guides', 'captures'));
/** La campagne de démonstration — la campagne d'essai enrichie, à part pour ne pas déranger les essais. */
const DEMO = path.join(ICI, 'donnees', 'campagne-de-demo.json');
/** Des images du dépôt, pour que la médiathèque et Image-OS ne soient pas vides. */
const IMAGES_DE_DEMO = [
    path.join(ICI, 'donnees', 'plan-station-varn.png'),
    path.join(ICI, 'donnees', 'demo-relais.png'),
    path.join(ICI, 'donnees', 'demo-alerte.png'),
    path.join(ICI, '..', 'docs', 'systems', 'blade-runner', 'Blade Runner Band.jpg'),
];

let gmos: GmOsLance;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({
        semence: DEMO,
        // Un coffre Obsidian de démo, copié dans le profil jetable : Nexus Wiki n'a jamais vu celui du meneur.
        preparerLeProfil: profil => fs.cpSync(path.join(ICI, 'donnees', 'coffre-de-demo'), path.join(profil, 'coffre'), { recursive: true }),
    });
    await attendreLHydratation(gmos);
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 900); });
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
    await mettreEnScene();
    /* Les sorties audio sont celles de la machine qui capture : leurs noms n'ont rien à faire dans un manuel. */
    await gmos.fenetre.addStyleTag({ content: '[data-depend-du-materiel] { filter: blur(6px); }' });
});

/** Les magasins exposés dans le renderer ; ces imports de types sont effacés avant evaluate. */
type FenetreDeCapture = {
    useSessionOSStore: typeof useSessionOSStore;
    useMapStore: typeof useMapStore;
    useStoryboardStore: typeof useStoryboardStore;
    useClockStore: typeof useClockStore;
    useFavoriteStore: typeof useFavoriteStore;
    useWhiteboardStore: typeof useWhiteboardStore;
    useMusicStore: typeof useMusicStore;
    useSoundStore: typeof useSoundStore;
    useAmbientStore: typeof useAmbientStore;
    useJournalStore: typeof useJournalStore;
    useCombatStore: typeof useCombatStore;
};

/**
 * **La partie en cours** — ce qu'un meneur aurait sous les yeux un soir de jeu,
 * fait par les gestes de l'interface quand c'est court, par les magasins sinon.
 */
async function mettreEnScene(): Promise<void> {
    const f = gmos.fenetre;

    // La Cartographie : un plan de la station, dessiné pour la démo.
    const plan = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees', 'plan-station-varn.png')).toString('base64');
    await f.evaluate(url => (window as unknown as FenetreDeCapture).useMapStore.getState().setMap(url, false, 'Station Varn — pont C'), plan);

    // Trois moments de storyboard, pour que le tableau de montage ait des lignes.
    await f.evaluate(url => {
        const sb = (window as unknown as FenetreDeCapture).useStoryboardStore.getState();
        const campaignId = (window as unknown as FenetreDeCapture).useSessionOSStore.getState().activeCampaignId;
        if (!campaignId) throw new Error('La campagne de démonstration doit être active.');
        sb.addMoment({ campaignId, name: 'Amarrage', description: "Le sas s'ouvre sur un couloir éclairé et vide.", color: 'cyan', icon: 'Anchor', mapUrl: url, titre: 'STATION VARN', musicVolume: 0.7 });
        sb.addMoment({ campaignId, name: 'La voix dans le relais', description: "Le relais émet avec la voix de l'équipage.", color: 'violet', icon: 'Radio', ambientVolume: 0.6, soundVolume: 0.8, titre: 'Il parle avec vos voix' });
        sb.addMoment({ campaignId, name: "Confrontation avec l'Écho", description: 'Le noyau, et ce qui écoute.', color: 'crimson', icon: 'Zap', mapUrl: url, mapBrouillard: 'revelee', titre: "L'ÉCHO", musicVolume: 0 });
    }, plan);

    // 3 · Les jauges de tension.
    await f.evaluate(() => {
        const horloge = (window as unknown as FenetreDeCapture).useClockStore.getState();
        horloge.addTensionClock('Alerte de la station', 8, 'anneau', 'remplissage');
        horloge.addTensionClock('Oxygène du pont C', 6, 'barre', 'epuisement');
        horloge.addTensionClock("L'Écho se rapproche", 4, 'points', 'remplissage');
        const jauges = (window as unknown as FenetreDeCapture).useClockStore.getState().tensions ?? [];
        jauges.forEach((j, i) => horloge.updateTensionSegments(j.id, [5, -2, 3][i] ?? 1));
    });

    // 4 · Les favoris du meneur.
    await f.evaluate(() => {
        // Les exemples livrés (en anglais) laissent la place à ceux de la campagne.
        (window as unknown as FenetreDeCapture).useFavoriteStore.setState({ favorites: [] });
        const favoris = (window as unknown as FenetreDeCapture).useFavoriteStore.getState();
        favoris.addFavorite({ type: 'npc', name: 'Superviseur Hale', subtitle: 'Il a réécrit le registre', attributes: { Rôle: 'Superviseur', Attitude: 'Fuyant' }, lore: "Responsable de la station depuis six ans.", secretNotes: 'Il a signé toutes les entrées des trois derniers jours.', isStarred: true });
        favoris.addFavorite({ type: 'place', name: 'Le relais', subtitle: "Le cœur de la station", lore: "Une salle ronde, des antennes en faisceau, un bourdonnement qui ne s'arrête jamais." });
        favoris.addFavorite({ type: 'item', name: 'Module de coupure', subtitle: 'La pièce qui manque', attributes: { Poids: '4 kg', Où: 'Soute de Teo' } });
        favoris.addFavorite({ type: 'lore', name: 'Protocole de quarantaine', subtitle: 'Règle de bord', lore: 'Scelle les ponts inférieurs au moindre signal non identifié.' });
    });

    // 5 · Un plan de pont au tableau blanc.
    await f.evaluate(() => {
        const tableau = (window as unknown as FenetreDeCapture).useWhiteboardStore.getState();
        const trait = (id: string, tool: WhiteboardTool, color: string, points: [number, number][]) =>
            tableau.addPath({ id, tool, color, width: 4, points: points.map(([x, y]) => ({ x, y })) });
        trait('demo-salle', 'rect', '#22d3ee', [[0.15, 0.2], [0.55, 0.7]]);
        trait('demo-couloir', 'brush', '#22d3ee', [[0.55, 0.45], [0.7, 0.45], [0.85, 0.3]]);
        trait('demo-relais', 'circle', '#f59e0b', [[0.85, 0.3], [0.9, 0.36]]);
        trait('demo-pion', 'pion', '#f43f5e', [[0.3, 0.5]]);
        trait('demo-cible', 'cible', '#f59e0b', [[0.86, 0.31]]);
    });

    // 5 bis · Les pupitres audio : des titres, des couleurs et des volumes, sans un seul son —
    // le manuel montre un pupitre préparé, et l'instance de capture est muette.
    await f.evaluate(() => {
        const w = window as unknown as FenetreDeCapture;
        const musique = w.useMusicStore;
        const morceaux: [string, string][] = [['Station Varn — thème', 'cyan'], ['Couloirs vides', 'aucune'], ['Le relais émet', 'violet'], ['Descente au noyau', 'ambre'], ["Confrontation avec l'Écho", 'rouge']];
        musique.setState({
            playlists: musique.getState().playlists.map((p, n) => n > 0 ? p : {
                ...p, name: 'Station Varn',
                pads: p.pads.map((pad, i) => morceaux[i]
                    ? { ...pad, label: morceaux[i][0], url: 'demo/musique-' + i + '.ogg', type: 'local', couleur: morceaux[i][1] }
                    : pad),
            }),
        });

        const son = w.useSoundStore;
        const bruitages: [string, string, string][] = [
            ['Sas qui s’ouvre', 'porte', '#22d3ee'], ['Alarme de pont', 'sirene', '#ef4444'], ['Grésillement radio', 'radio', '#a855f7'],
            ['Pas dans la coursive', 'pas', '#94a3b8'], ['Voix de l’Écho', 'voix', '#a855f7'], ['Coupure de courant', 'eclair', '#f59e0b'],
            ['Ascenseur bloqué', 'machine', '#94a3b8'], ['Coup de feu', 'viseur', '#ef4444'],
        ];
        son.setState({
            atmospheres: son.getState().atmospheres.map((a, n) => n > 0 ? a : {
                ...a, name: 'Station Varn',
                pads: Object.fromEntries(Object.entries(a.pads).map(([id, pad], i) => [id, bruitages[i]
                    ? { ...pad, title: bruitages[i][0], filePath: 'demo/bruitage-' + i + '.ogg', icone: bruitages[i][1], color: bruitages[i][2] }
                    : pad])),
            }),
        });

        const ambiance = w.useAmbientStore;
        const pistes: [string, number, string][] = [
            ['Air', 0.6, '#94a3b8'], ['Relais', 0.45, '#a855f7'], ['Coque', 0.3, '#f59e0b'], ['Gouttes', 0.2, '#06b6d4'],
            ['Voix', 0.15, '#f43f5e'], ['Moteurs', 0.4, '#3b82f6'], ['Parasites', 0.1, '#a855f7'], ['Noyau', 0, '#64748b'],
        ];
        ambiance.setState({
            tracks: ambiance.getState().tracks.map((t, i) => pistes[i]
                ? { ...t, label: pistes[i][0], volume: pistes[i][1], color: pistes[i][2], url: 'demo/ambiance-' + i + '.ogg' }
                : t),
        });
        // Enregistré puis rechargé : le sélecteur nomme alors un thème de la campagne, pas un gabarit vide.
        ambiance.getState().saveTheme('Cyberpunk', 'Station Varn');
        return ambiance.getState().loadTheme('Cyberpunk', 'Station Varn');
    });

    // 6 · Des images dans la médiathèque.
    await ouvrirLeModule(gmos, 'Médiathèque');
    await f.locator('input[type="file"][multiple]').first().setInputFiles(IMAGES_DE_DEMO.filter(i => fs.existsSync(i)));
    await f.waitForTimeout(1500);
    await f.keyboard.press('Escape');

    // 7 · Image-OS : ses pads se choisissent dans la médiathèque, un par un.
    await ouvrirLeModule(gmos, 'Image-OS');
    await f.getByRole('button', { name: /Ajouter un média/i }).first().click();
    const utiliser = f.getByRole('button', { name: /^Utiliser$/ });
    await utiliser.first().waitFor({ timeout: 10_000 });
    const n = await utiliser.count();
    for (let i = 0; i < n; i++) {
        await utiliser.nth(i).click({ timeout: 5_000 }).catch(() => undefined);
        await f.waitForTimeout(250);
    }
    await f.keyboard.press('Escape');
}

/**
 * **La séance commence** — par le vrai geste du cockpit, qui ouvre le journal
 * et range les PJ de la scène au combat. Avant elle, les vues de préparation ;
 * après elle, la partie : une séance en cours renvoie toute vue de préparation
 * au cockpit, c'est voulu.
 */
async function lancerLaSeance(): Promise<void> {
    const f = gmos.fenetre;
    // La séance 2, lancée depuis le cockpit — le vrai geste, qui ouvre le journal.
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await f.evaluate(() => (window as unknown as FenetreDeCapture).useSessionOSStore.getState().setCurrentView('cockpit'));
    await f.getByRole('button', { name: /Lancer Session/i }).first().click();
    await f.getByRole('dialog').getByRole('button', { name: /Séance 2|Session #2/ }).first().click();
    // Le lancement range les PJ de la scène au combat : on le laisse finir avant de poser le nôtre.
    await f.waitForTimeout(1500);

    // Quelques lignes de récit au journal — les modules en écrivent d'eux-mêmes ; le meneur, des notes.
    await f.evaluate(() => {
        const journal = (window as unknown as FenetreDeCapture).useJournalStore.getState();
        journal.addEvent({ type: 'LOCATION', title: 'Le relais', content: 'Le groupe force la porte du relais. Le bourdonnement couvre les voix.' });
        journal.addEvent({ type: 'NPC', title: 'Superviseur Hale', content: "Hale jure que le dernier départ date d'hier. Le café dit le contraire." });
        journal.addEvent({ type: 'NOTE', title: 'Promesse', content: "Idris a promis à Teo de l'aider à repartir avant la quarantaine." });
    });

    // Le combat : l'équipage face à l'Écho.
    await f.evaluate(() => {
        const combat = (window as unknown as FenetreDeCapture).useCombatStore.getState();
        combat.clearCombatants();
        // Les PJ de la séance arrivent par le combat lui-même : on repart d'une liste propre.
        const unites: Parameters<typeof combat.addCombatant>[0][] = [
            { name: 'Nel Varga', init: 17, hp: 9, hpMax: 12, isPlayer: true, faction: 'player', statuses: [] },
            { name: "L'Écho", init: 15, hp: 18, hpMax: 24, isPlayer: false, faction: 'enemy', statuses: [] },
            { name: 'Idris Koa', init: 12, hp: 11, hpMax: 11, isPlayer: true, faction: 'player', statuses: [] },
            { name: 'Sora Adebayo', init: 8, hp: 4, hpMax: 10, isPlayer: true, faction: 'player', statuses: [] },
        ];
        for (const u of unites) combat.addCombatant(u);
        const echo = (window as unknown as FenetreDeCapture).useCombatStore.getState().combatants.find(c => c.name === "L'Écho");
        if (echo) combat.addStatus(echo.id, { name: 'Brouillé', duration: 2, icon: '' });
    });

    // Un PJ de la scène arrive encore après coup, à l'initiative 0 : on ne garde qu'un exemplaire de chacun.
    await f.waitForTimeout(800);
    await f.evaluate(() => {
        const combat = (window as unknown as FenetreDeCapture).useCombatStore.getState();
        const vus = new Set<string>();
        for (const c of [...combat.combatants].sort((a, b) => b.init - a.init)) {
            if (vus.has(c.name)) combat.removeCombatant(c.id); else vus.add(c.name);
        }
        (window as unknown as FenetreDeCapture).useCombatStore.getState().sortInitiative();
    });

}

test.afterAll(async () => { await gmos?.fermer(); });

/** Une capture de toute la fenêtre — ou d'un cadre — sous son nom de fichier. */
async function capturer(nom: string, cadre?: { x: number; y: number; width: number; height: number }): Promise<void> {
    await gmos.fenetre.waitForTimeout(700);
    /* Sound-OS liste ses sorties sans l'attribut `data-depend-du-materiel` : on les reconnaît à leur titre. */
    await gmos.fenetre.evaluate(() => document.querySelectorAll('h2').forEach(h => {
        if (/^Sortie audio$/i.test((h.textContent ?? '').trim())) (h.parentElement as HTMLElement).style.filter = 'blur(6px)';
    }));
    await gmos.fenetre.screenshot({
        path: path.join(SORTIE, `${nom}.jpg`), type: 'jpeg', quality: 82, scale: 'css',
        animations: 'disabled', caret: 'hide', ...(cadre ? { clip: cadre } : {}),
    });
}

const DIACRITIQUES = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
const nomDeFichier = (panneau: string) => panneau
    .normalize('NFD').replace(DIACRITIQUES, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Ouvre une vue de Session-OS, comme le menu du cockpit. */
async function vue(nom: CurrentView): Promise<void> {
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    await gmos.fenetre.evaluate(v => (window as unknown as FenetreDeCapture).useSessionOSStore.getState().setCurrentView(v), nom);
}

/** Referme toute surcouche ouverte. */
async function fermer(): Promise<void> {
    for (let i = 0; i < 3; i++) { await gmos.fenetre.keyboard.press('Escape'); await gmos.fenetre.waitForTimeout(150); }
}

/** Les vues de préparation — séance fermée. */
const PREPARATION: [string, () => Promise<void>][] = [
    ['session-cockpit-hors-seance', () => vue('cockpit')],
    ['session-bibliotheque', () => vue('library')],
    ['session-joueurs', () => vue('players')],
    ['session-preparation', () => vue('session-prep')],
    ['session-deck', () => vue('deck-library')],
    ['session-modeles-de-fiches', () => vue('templates')],
    ['session-trame', () => vue('trame')],
    ['session-trame-graphe', async () => {
        await vue('trame');
        await gmos.fenetre.getByRole('button', { name: /^Graphe$/ }).first().click();
        await gmos.fenetre.waitForTimeout(1200);
        await gmos.fenetre.getByRole('button', { name: /^Ranger$/ }).first().click();
        await gmos.fenetre.waitForTimeout(1500);
    }],
    ['session-trame-scene', async () => {
        await vue('trame');
        await gmos.fenetre.getByRole('button', { name: /^Arbre$/ }).first().click().catch(() => undefined);
        await gmos.fenetre.getByText("Ce que Hale n'a pas dit").first().click();
        await gmos.fenetre.getByText('Entretien avec Hale').first().click();
    }],
    ['session-storyboard', () => vue('storyboard')],
    ['session-storyboard-regler', async () => { await vue('storyboard'); await gmos.fenetre.getByTitle(/Régler/).first().click(); }],
    ['session-galerie-pnj', () => vue('npc-gallery')],
    ['session-social-nexus', () => vue('social-graph')],
    ['session-atlas', () => vue('world-atlas')],
    ['session-chroniques', () => vue('timeline-wiki')],
    ['campagne-details', async () => { await vue('library'); await gmos.fenetre.getByRole('button', { name: /Gérer la campagne/i }).first().click(); }],
    ['campagne-indices', async () => {
        await vue('library');
        await gmos.fenetre.getByRole('button', { name: /Gérer la campagne/i }).first().click();
        await gmos.fenetre.getByRole('button', { name: /Modifier la campagne/i }).first().click();
        await gmos.fenetre.getByRole('button', { name: /Indices$/ }).first().click();
    }],
    ['campagne-formulaire', async () => {
        await vue('library');
        await gmos.fenetre.getByRole('button', { name: /Gérer la campagne/i }).first().click();
        await gmos.fenetre.getByRole('button', { name: /Modifier la campagne/i }).first().click();
    }],
];

/** Les écrans de la partie — séance ouverte. */
const ECRANS: [string, () => Promise<void>][] = [
    // La démo n'a pas de jeu : le livre le dit (2026-10-03)…
    ['session-regles-sans-jeu', async () => { await vue('cockpit'); await gmos.fenetre.getByRole('button', { name: /^Règles$/ }).first().click(); }],
    // … et l'atelier se montre en consultant le pilote livré.
    ['session-regles', async () => {
        await vue('cockpit');
        await gmos.fenetre.getByRole('button', { name: /^Règles$/ }).first().click();
        await gmos.fenetre.getByRole('button', { name: /Dune/ }).first().click();
    }],
    ['cortex-tactique', async () => {
        await ouvrirLeModule(gmos, 'Combat-OS');
        await gmos.fenetre.getByTitle('Cortex Tactique').first().click();
    }],
    ['parametres-tactique', async () => {
        // Le bandeau du Cortex ne se ferme pas à Échap, et il passe devant les Paramètres.
        const fermerLeCortex = gmos.fenetre.getByRole('button', { name: /Fermer Cortex/i });
        if (await fermerLeCortex.isVisible()) await fermerLeCortex.click();
        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
        await gmos.fenetre.getByRole('button', { name: /Tactique/ }).first().click();
    }],
    ['oracle-personas', async () => {
        await vue('cockpit');
        await gmos.fenetre.getByRole('button', { name: /^Oracle$/ }).first().click();
        await gmos.fenetre.getByRole('button', { name: /Persona/i }).first().click();
    }],
    ['session-loot-os', async () => { await vue('cockpit'); await gmos.fenetre.getByRole('button', { name: /^Loot-OS$/ }).first().click(); }],
    ['forge-campagne', async () => { await ouvrirLeModule(gmos, 'Forge'); await gmos.fenetre.getByRole('button', { name: /Campagne/ }).first().click(); }],
    ['combat-calcul-des-degats', async () => { await ouvrirLeModule(gmos, 'Combat-OS'); await gmos.fenetre.getByRole('button', { name: /Calculateur de dégâts/i }).first().click(); }],
    ['dice-un-jet', async () => {
        await ouvrirLeModule(gmos, 'Dice-OS');
        await gmos.fenetre.getByRole('button', { name: /^Lancer$/i }).first().click();
        await gmos.fenetre.waitForTimeout(1500);
        await gmos.fenetre.getByText('Attaque Épée Longue').first().click();
        await gmos.fenetre.waitForTimeout(2500);
    }],
    ['tables-un-tirage', async () => {
        await ouvrirLeModule(gmos, 'Tables Aléatoires');
        // Le « Mode » de Dice-OS reste un instant à l'écran pendant le changement de module.
        await expect(gmos.fenetre.locator('select[title="Mode"]')).toHaveCount(0, { timeout: 10_000 });
        const listes = gmos.fenetre.locator('select');
        const univers = (await listes.first().locator('option').allTextContents()).find(o => /Blade Runner/.test(o))
            ?? (await listes.first().locator('option').allTextContents()).find(o => !/Choisir/i.test(o))!;
        await listes.first().selectOption({ label: univers });
        await expect.poll(async () => listes.nth(1).locator('option').count(), { timeout: 15_000 }).toBeGreaterThan(1);
        const table = (await listes.nth(1).locator('option').allTextContents()).find(o => !/Choisir/i.test(o))!;
        await listes.nth(1).selectOption({ label: table });
        const lancer = gmos.fenetre.getByRole('button', { name: /^Lancer \d*d\d+/i }).first();
        await lancer.click();
        await gmos.fenetre.waitForTimeout(800);
        await lancer.click();
    }],
    ['parametres-theme-du-jeu', async () => {
        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
        await gmos.fenetre.getByRole('button', { name: /Thème du jeu/ }).first().click();
    }],
    ['parametres-telecommande', async () => {
        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
        await gmos.fenetre.getByRole('button', { name: /Télécommande/ }).first().click();
    }],
    ['mediatheque', async () => { await ouvrirLeModule(gmos, 'Médiathèque'); }],
    ['image-en-direct', async () => {
        await ouvrirLeModule(gmos, 'Image-OS');
        await gmos.fenetre.getByText('demo-alerte.png').first().click();
        await gmos.fenetre.waitForTimeout(1500);
    }],
    ['pnj-tirage', async () => {
        await ouvrirLeModule(gmos, 'Générateur PNJ');
        // Sans Ollama, l'enrichissement échouerait : on l'éteint pour le tirage de démonstration.
        const ia = gmos.fenetre.getByRole('button', { name: /Enrichissement actif/i }).first();
        if (await ia.count()) await ia.click();
        await gmos.fenetre.getByRole('button', { name: /Tirage instantané|Générer PNJ/i }).first().click();
        await gmos.fenetre.waitForTimeout(2500);
    }],
    ['session-fiche-pnj', async () => {
        await vue('npc-gallery');
        await gmos.fenetre.getByRole('button', { name: /^Fiche$/ }).first().click();
    }],
    ['parametres', async () => { await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click(); }],
    ['parametres-ia', async () => {
        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
        await gmos.fenetre.getByRole('button', { name: /^IA$/ }).first().click();
    }],
    ['recherche-universelle', async () => { await ouvrirLeModule(gmos, 'Tableau de Bord'); await gmos.fenetre.keyboard.press('Control+k'); await gmos.fenetre.getByPlaceholder(/Rechercher une entité/).fill('Hale'); }],
    ['aide-manuel', async () => { await gmos.fenetre.getByRole('button', { name: /^Aide/ }).first().click(); }],
]

test.describe('la préparation', () => {
    for (const [nom, faire] of PREPARATION) {
        test(nom, async () => {
            await fermer();
            await faire();
            await capturer(nom);
        });
    }
});

test('la séance commence', async () => {
    await fermer();
    await lancerLaSeance();
});

test.describe('les modules', () => {
    // Dice-OS, les tables et le générateur ont leur capture « en action » plus bas : la vue vide n'apprend rien.
    const DEJA_MONTRES = ['Dice-OS', 'Tables Aléatoires', 'Générateur PNJ'];
    for (const panneau of LES_PANNEAUX.filter(p => !DEJA_MONTRES.includes(p))) {
        test(panneau, async () => {
            await ouvrirLeModule(gmos, panneau);
            if (panneau === 'Nexus Wiki') await gmos.fenetre.getByText('Station Varn', { exact: true }).first().click();
            await capturer(`module-${nomDeFichier(panneau)}`);
            if (panneau === 'Cortex IA') await ouvrirLeModule(gmos, panneau);
        });
    }
});

test.describe('les écrans des guides', () => {
    for (const [nom, faire] of ECRANS) {
        test(nom, async () => {
            await fermer();
            await faire();
            await capturer(nom);
            await fermer();
        });
    }

    test('le dernier jet de dés', async () => {
        await fermer();
        await ouvrirLeModule(gmos, 'Dice-OS');
        // 09/10 : capturer le panneau entier ; un rectangle fixe coupait le détail du dé.
        // Le scénario prépare son propre jet pour pouvoir régénérer cette seule image.
        await gmos.fenetre.getByText('Attaque Épée Longue', { exact: true }).click();
        const dernierJet = gmos.fenetre.locator('[data-panneau="2"]').filter({
            has: gmos.fenetre.getByRole('heading', { name: 'Dernier jet', exact: true }),
        });
        await expect(dernierJet).toHaveCount(1);
        await expect(dernierJet).toContainText('1d20+7');
        await fermer();
        await expect(dernierJet.getByRole('button', { name: 'Projeter', exact: true })).toBeVisible();
        await dernierJet.screenshot({
            path: path.join(SORTIE, 'dice-dernier-jet.jpg'), type: 'jpeg', quality: 82, scale: 'css',
            animations: 'disabled', caret: 'hide',
        });
    });

    test('la carte d’un combattant', async () => {
        await fermer();
        await ouvrirLeModule(gmos, 'Combat-OS');
        await capturer('combat-carte-de-combattant', { x: 230, y: 140, width: 910, height: 230 });
    });

    /** Une fenêtre que GM-OS ouvre à côté de la sienne — le Player Hub, la tablette. */
    for (const [nom, titre] of [['player-hub', /Lancer le Player Hub/], ['tablette-des-joueurs', /Lancer le Hub Tablette/]] as const) {
        test(nom, async () => {
            await fermer();
            const [fenetre] = await Promise.all([
                gmos.application.waitForEvent('window', { timeout: 15_000 }),
                gmos.fenetre.getByTitle(titre).first().click(),
            ]);
            await fenetre.waitForLoadState('domcontentloaded');
            const cadre = await gmos.application.browserWindow(fenetre);
            await cadre.evaluate(w => { w.setContentSize(1280, 800); });
            await fenetre.waitForTimeout(3000);
            await fenetre.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), type: 'jpeg', quality: 82, scale: 'css', animations: 'disabled' });
            await cadre.evaluate(w => w.close());
        });
    }

    // T4/J1 et J2 : chaque écran intégré a sa capture, après le choix du personnage.
    // En exécution filtrée, inclure aussi « la séance commence ».
    for (const destination of ['direct', 'inventaire', 'cartes', 'fiche', 'archives', 'pnj', 'lieux', 'messages', 'notes', 'feedback'] as const) test(`tablette-des-joueurs-${destination}`, async () => {
        await fermer();
        if (destination === 'pnj' || destination === 'lieux') {
            const plan = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees', 'plan-station-varn.png')).toString('base64');
            await gmos.fenetre.evaluate(({ ecran, image }) => {
                const magasin = (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore;
                const s = magasin.getState();
                if (ecran === 'pnj') magasin.setState({ entities: s.entities.map(e => ({ ...e,
                    isVisibleByPlayers: ['temoin-pnj-1', 'demo-pnj-3', 'demo-pnj-4'].includes(e.id) })) });
                if (ecran === 'lieux') magasin.setState({ atlasMaps: s.atlasMaps.map(l => ({ ...l, isVisited: true,
                    fileUrl: image, type: 'battlemap', narrativeDescription: 'Le pont C, entre le sas et le relais.' })) });
            }, { ecran: destination, image: plan });
        }
        if (destination === 'inventaire' || destination === 'cartes') {
            await gmos.fenetre.evaluate(ecran => {
                const magasin = (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore;
                const s = magasin.getState(), joueur = s.players[0], personnage = joueur.characters[0];
                if (ecran === 'inventaire' && !personnage.inventoryItems?.length) s.addInventoryItem(joueur.id, personnage.id, {
                    name: 'Outil multifonction', quantity: 1, type: 'equipment', rarity: 'common', weight: 1,
                    description: 'Pour ouvrir le relais.', properties: {},
                });
                if (ecran === 'cartes') magasin.setState({ deckStates: { ...s.deckStates, 'temoin-paquet': {
                    deckId: 'temoin-paquet', remainingIndices: [3, 4, 5, 6], discardedIndices: [1], currentCardIndex: null,
                    enMain: [{ index: 2, porteur: personnage.id, face: 'revelee' }],
                } } });
            }, destination);
        }
        const [fenetre] = await Promise.all([
            gmos.application.waitForEvent('window', { timeout: 15_000 }),
            gmos.fenetre.getByTitle(/Lancer le Hub Tablette/).first().click(),
        ]);
        await fenetre.waitForLoadState('domcontentloaded');
        // file:// n'a pas d'hôte pour le WebSocket ; charger l'adresse de tablette
        // sur le serveur déjà lancé par le banc, avec son port isolé.
        await fenetre.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
        const cadre = await gmos.application.browserWindow(fenetre);
        try {
            if (destination === 'cartes') await fenetre.route('**/assets/decks/generic/temoin-paquet/**', route => route.fulfill({
                contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="350"><rect width="250" height="350" fill="#142637"/><text x="125" y="175" text-anchor="middle" font-size="22" fill="white">STATION VARN</text></svg>',
            }));
            await cadre.evaluate(w => { w.setContentSize(1280, 800); });
            await fenetre.getByRole('button', { name: /Nel Varga/ }).click();
            await expect(fenetre.getByText('Synchronisation', { exact: true })).toHaveCount(0);
            await expect(fenetre.locator('[data-direct-joueur]')).toBeVisible();
            await expect(fenetre.getByText('Connecté', { exact: true })).toBeVisible();
            await expect(fenetre.getByRole('heading', { name: 'Le Silence de Varn', exact: true })).toBeVisible();
            if (destination === 'inventaire' || destination === 'cartes') {
                await fenetre.getByRole('navigation').getByTitle(destination === 'inventaire' ? 'Inventaire' : 'Cartes', { exact: true }).click();
                await expect(fenetre.locator(destination === 'inventaire' ? '[data-inventaire-joueur]' : '[data-cartes-joueur]')).toBeVisible();
            }
            if (destination === 'fiche') {
                await fenetre.getByTitle('Fiche Personnage', { exact: true }).click();
                await expect(fenetre.getByRole('heading', { name: 'Nel Varga', exact: true })).toBeVisible();
            }
            if (destination === 'archives' || destination === 'pnj' || destination === 'lieux') {
                const nom = { archives: 'Archives', pnj: 'PNJ', lieux: 'Lieux' }[destination];
                await fenetre.getByRole('navigation').getByTitle(nom, { exact: true }).click();
                await expect(fenetre.locator('[data-hub-consultation]')).toBeVisible();
            }
            if (destination === 'messages') {
                await fenetre.getByRole('navigation').getByTitle('Messages', { exact: true }).click();
                await fenetre.getByTitle('Entrer un message').fill('Le relais est ouvert.');
                await fenetre.getByTitle('Envoyer le message').click();
                await gmos.fenetre.evaluate(() => (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore.getState().sendDirectMessage('temoin-pj-1', 'Nel Varga', 'Gardez le sas fermé pendant la transmission.'));
                await expect(fenetre.getByText('Gardez le sas fermé pendant la transmission.', { exact: true })).toBeVisible();
            }
            if (destination === 'notes' || destination === 'feedback') {
                await fenetre.getByRole('navigation').getByTitle('Notes Personnelles', { exact: true }).click();
                await fenetre.getByPlaceholder(/Notez ici vos théories/).fill('Revenir au relais après la relève.');
                if (destination === 'feedback') {
                    await fenetre.getByRole('button', { name: 'Feedback MJ', exact: true }).click();
                    await fenetre.getByRole('button', { name: 'Plaisir de jeu : 4 sur 5', exact: true }).click();
                    await fenetre.getByPlaceholder(/Ce que vous avez aimé/).fill('Les échanges au relais ont bien fait avancer l’enquête.');
                }
            }
            await fenetre.evaluate(() => document.fonts.ready);
            await fenetre.waitForTimeout(800);
            await fenetre.screenshot({ path: path.join(SORTIE, `tablette-des-joueurs-${destination}.jpg`), type: 'jpeg', quality: 82, scale: 'css', animations: 'disabled' });
            // Libérer Nel et son identité avant la prochaine fenêtre de cette série.
            if (destination === 'fiche') await fenetre.getByRole('button', { name: 'Retour', exact: true }).click();
            if (destination === 'messages') await fenetre.getByTitle('Fermer la messagerie').click();
            if (destination === 'notes' || destination === 'feedback') await fenetre.getByTitle('Fermer les notes').click();
            fenetre.once('dialog', dialogue => dialogue.accept());
            await fenetre.getByRole('navigation').getByTitle('Quitter', { exact: true }).click();
            await expect(fenetre.getByRole('heading', { name: 'Qui es-tu ?', exact: true })).toBeVisible();
        } finally {
            await cadre.evaluate(w => w.close());
        }
    });

    /**
     * La tablette du meneur n'a pas de bouton : son QR code l'ouvre, jeton d'appairage compris.
     * On ouvre la même adresse que le pupitre de l'écran du bas — sans le jeton, elle reste
     * en « Reconnexion », rétrogradée en écran de joueur.
     */
    for (const [suffixe, onglet] of [
        ['', 'Pads'], ['-des', 'Dés'], ['-combat', 'Combat'],
        ['-sons', 'Sons'], ['-scenario', 'Scénario'], ['-tableau', 'Tableau'],
        ['-notes', 'Notes'], ['-messages', 'Messages'],
    ] as const) test('tablette-du-meneur' + suffixe, async () => {
        await fermer();
        const secret = await gmos.fenetre.evaluate(() => {
            const appairage = window.appBridge?.pairing;
            if (!appairage) throw new Error('Le pont d’appairage est absent du renderer.');
            return appairage.getSecret();
        });
        const adresse = `http://127.0.0.1:${gmos.ports.sync}/?window=remote&sync=${gmos.ports.sync}#token=${encodeURIComponent(secret)}`;
        const [fenetre] = await Promise.all([
            gmos.application.waitForEvent('window', { timeout: 15_000 }),
            gmos.application.evaluate(({ BrowserWindow }, url) => {
                const w = new BrowserWindow({ width: 1280, height: 800, webPreferences: { partition: 'persist:pupitre', contextIsolation: true, sandbox: true } });
                void w.loadURL(url);
            }, adresse),
        ]);
        await fenetre.waitForLoadState('domcontentloaded');
        const cadre = await gmos.application.browserWindow(fenetre);
        await cadre.evaluate(w => { w.setContentSize(1280, 800); });
        await fenetre.waitForTimeout(3500);
        // Le dernier jet projeté s'affiche aussi chez le meneur, puis s'efface de lui-même.
        await expect(fenetre.getByText(/Cliquer pour fermer/i)).toHaveCount(0, { timeout: 20_000 });
        await fenetre.getByRole('button', { name: onglet, exact: true }).first().click();
        await fenetre.waitForTimeout(600);
        await fenetre.screenshot({ path: path.join(SORTIE, 'tablette-du-meneur' + suffixe + '.jpg'), type: 'jpeg', quality: 82, scale: 'css', animations: 'disabled' });
        await cadre.evaluate(w => w.close());
    });

    test('la tour de contrôle audio', async () => {
        await fermer();
        await ouvrirLeModule(gmos, 'Musique');
        await capturer('tour-de-controle-audio', { x: 218, y: 0, width: 1222, height: 56 });
    });
});
