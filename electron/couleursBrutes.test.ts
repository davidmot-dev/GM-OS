import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    compterLesCouleursBrutes, lieuDuFichier, fichierCompte, PALETTES_DE_CONTENU,
} from '../src/theme/releveDesCouleurs';

/**
 * **T0.2 · La garde des couleurs brutes — elle grandit avec la migration.**
 *
 * Phase 0 de la refonte (`documentation/Planning/2026-09-17-refonte-interface.md`).
 * Un module **migré** (phase 4) ne doit plus contenir une seule couleur de la
 * palette Tailwind brute : ses états, ses textes secondaires et ses catégories
 * passent par des jetons, que chaque thème — de base ou de jeu — peut habiller.
 *
 * `MODULES_MIGRES` est **vide** aujourd'hui : aucun jeton d'état n'existe encore
 * (phase 1). Chaque module migré y entre, et n'en sort plus. *Posée à la fin,
 * cette garde n'aurait protégé que ce qui restait à faire.*
 *
 * Dans `electron/` parce qu'elle lit le disque (`node:fs` n'existe pas dans le
 * projet de tests du renderer).
 */

const SRC = path.resolve(__dirname, '..', 'src');

/** Les lieux (`modules/combat`, `components`…) dont la migration est finie. */
const MODULES_MIGRES: string[] = [
    'modules/dice',   // phase 4, L1 — 2026-09-30
    'modules/image',  // phase 4, L1 — 2026-09-30
    'modules/combat', // phase 4, L1 — 2026-09-30
    'modules/sound',   // phase 4, L2 — 2026-10-02
    'modules/ambient', // phase 4, L2 — 2026-10-02
    'modules/music',   // phase 4, L2 — 2026-10-02 (palette des pastilles exemptée)
    'modules/light',   // phase 4, L2 — 2026-10-02 (catalogue des effets exempté)
    'modules/map',     // phase 4, L3 — 2026-10-02
    'modules/forge',   // phase 4, L3 — 2026-10-02
    'modules/npc',     // phase 4, L4 — 2026-10-02
    'modules/clock',   // phase 4, L4 — 2026-10-02 (cadrans exemptés)
    'modules/favorite', // phase 4, L4 — 2026-10-02
    'modules/remote',  // phase 4, L4 — 2026-10-02 (tableau blanc exempté)
    'modules/session', // phase 4, L5 — 2026-10-02 (cinq sous-lots)
    'modules/storyboard', // phase 4, L5 (poste du meneur) — 2026-10-02
    'modules/ai',      // phase 4, L6 — 2026-10-03
    'modules/system',  // phase 4, L6 — 2026-10-03 (HUD Nexus : phases en cours à l'accent)
    'modules/tactical-ai', // phase 4, L6 — 2026-10-03
    'modules/debug',   // phase 4, L6 — 2026-10-03
    'modules/voice',   // phase 4, L6 — 2026-10-03
    'modules/web',     // phase 4, L6 — 2026-10-03 (couleurs des liens exemptées)
    'modules/journal', // phase 4, L6 — 2026-10-03
    'modules/shared',  // phase 4, L6 — 2026-10-03
    'modules/tables',  // phase 4, L6 — 2026-10-03
    'modules/whiteboard', // phase 4, L6 — 2026-10-03 (papier clair exempté)
    'modules/ulanzi',  // phase 4, L6 — 2026-10-03
    'modules/fiches',  // phase 4, L6 — 2026-10-03
    'modules/aide',    // phase 4, L6 — 2026-10-03
    'modules/table',   // phase 4, L6 — 2026-10-03
];

/**
 * **Les fichiers migrés d'un module qui se migre par morceaux** — phase 4,
 * L5 (2026-10-02). `session` compte 77 fichiers à couleurs : il se migre en
 * cinq sous-lots, et il n'entre dans `MODULES_MIGRES` qu'au dernier. Chaque
 * sous-lot fini inscrit ici ses fichiers, qui n'en sortent plus — *une garde
 * posée à la fin n'aurait protégé que ce qui restait à faire.*
 */
const FICHIERS_MIGRES: string[] = [
    /* Vide depuis que `session` est entré entier dans `MODULES_MIGRES`
       (2026-10-02) ; elle sert désormais à `components/` (lot 6). */
    'components/ModalProvider.tsx', // le cadre commun des surcouches — L5, 2026-10-03
    'components/SpotlightSearch.tsx', // la palette Ctrl+K — L5, 2026-10-03
    'components/GlobalSettingsModal.tsx', // L6, 2026-10-03
    'components/MediaBrowser.tsx', // L6, 2026-10-03
    'components/TabletHub.tsx', // L6, 2026-10-03
    'components/Shell.tsx', // L6, 2026-10-03
    'components/ToastProvider.tsx', // L6, 2026-10-03
    'components/NetworkQRCodeModal.tsx', // L6, 2026-10-03
    'components/LoupeDeLecture.tsx', // L6, 2026-10-03
    'components/PlayerHub.tsx', // L6, 2026-10-03
    'components/common/ErrorBoundary.tsx', // L6, 2026-10-03
    'components/common/LoadingOverlay.tsx', // L6, 2026-10-03
    'components/audio/MasterAudioController.tsx', // L6, 2026-10-03
    'components/hub/HubAtlas.tsx', // L6, 2026-10-03
    'components/hub/HubAtlasViewer.tsx', // L6, 2026-10-03
    'components/hub/HubCharacterSheet.tsx', // L6, 2026-10-03
    'components/hub/HubClockWidgets.tsx', // L6, 2026-10-03
    'components/hub/HubCombatTracker.tsx', // L6, 2026-10-03
    'components/hub/HubDiceDisplay.tsx', // L6, 2026-10-03
    'components/hub/HubInventory.tsx', // L6, 2026-10-03
    'components/hub/HubItemViewer.tsx', // L6, 2026-10-03
    'components/hub/HubMainDeCartes.tsx', // L6, 2026-10-03
    'components/hub/HubNotificationCenter.tsx', // L6, 2026-10-03
    'components/hub/HubNpcViewer.tsx', // L6, 2026-10-03
    'components/hub/HubProjectionCard.tsx', // L6, 2026-10-03
    'components/hub/HubRuleViewer.tsx', // L6, 2026-10-03
    'components/hub/LobbyOnboarding.tsx', // L6, 2026-10-03
];

let fichiersParcourus = 0;

function releve(): Map<string, number> {
    const parLieu = new Map<string, number>();
    const parcourir = (dossier: string) => {
        for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
            const complet = path.join(dossier, e.name);
            if (e.isDirectory()) { parcourir(complet); continue; }
            const relatif = path.relative(SRC, complet).split(path.sep).join('/');
            if (!fichierCompte(relatif)) continue;
            fichiersParcourus++;
            const n = compterLesCouleursBrutes(fs.readFileSync(complet, 'utf-8'));
            if (n) parLieu.set(lieuDuFichier(relatif), (parLieu.get(lieuDuFichier(relatif)) ?? 0) + n);
        }
    };
    parcourir(SRC);
    return parLieu;
}

describe('les couleurs brutes', () => {
    const parLieu = releve();

    /*
      Le motif doit voir une couleur brute, sinon toute la garde passe à vide.
      On l'éprouvait sur le total du dépôt (« plus de 1000 ») ; la migration
      l'a fait fondre sous ce seuil au lot 6 (2026-10-03) — d'où un échantillon
      fixe, qui ne décroît pas avec le travail fait.
    */
    it('le motif voit les couleurs brutes, et pas les jetons', () => {
        expect(compterLesCouleursBrutes('bg-red-500/10 text-emerald-400 border-slate-800')).toBe(3);
        expect(compterLesCouleursBrutes('bg-etat-danger/10 text-gm-violet border-app-border text-accent')).toBe(0);
        // Une ligne de commentaire ne compte pas ; un commentaire en fin de code, si.
        expect(compterLesCouleursBrutes(' * remplace `text-slate-400`\n// bg-red-500\n/* bg-white */')).toBe(0);
        expect(compterLesCouleursBrutes('const c = "bg-red-500"; // text-white')).toBe(2);
    });

    it('le relevé du dépôt parcourt bien les fichiers', () => {
        expect(fichiersParcourus).toBeGreaterThan(300);
    });

    /*
      **Tout `src/` est migré** — fin du lot 6, 2026-10-03. Les listes
      ci-dessous gardent l'histoire de la migration ; celle-ci garde l'avenir :
      un fichier NEUF, dans un lieu que personne n'a inscrit, est compté lui
      aussi. Une couleur qui est la donnée va dans `PALETTES_DE_CONTENU`, avec
      sa raison.
    */
    it('aucun lieu de src/ ne contient de couleur brute', () => {
        expect(Object.fromEntries(parLieu), 'passer par les jetons du thème, ou déclarer une palette de contenu').toEqual({});
    });

    it.each(MODULES_MIGRES.length ? MODULES_MIGRES : ['(aucun module migré pour l’instant)'])(
        '%s : plus aucune couleur brute',
        (lieu) => {
            if (!MODULES_MIGRES.includes(lieu)) return;
            expect(parLieu.get(lieu) ?? 0, `${lieu} est migré : ses couleurs passent par des jetons`).toBe(0);
        },
    );
});

describe('les fichiers migrés un à un', () => {
    it.each(FICHIERS_MIGRES.length ? FICHIERS_MIGRES : ['(aucun fichier isolé pour l’instant)'])('%s : plus aucune couleur brute', (relatif) => {
        if (!FICHIERS_MIGRES.includes(relatif)) return;
        const chemin = path.join(SRC, ...relatif.split('/'));
        expect(fs.existsSync(chemin), `${relatif} a disparu : retirez-le de la liste`).toBe(true);
        expect(compterLesCouleursBrutes(fs.readFileSync(chemin, 'utf-8'))).toBe(0);
    });
});

/**
 * **Les palettes de contenu existent encore** — L2, 2026-10-02. Une exemption
 * qui survit à son fichier (renommé, déplacé) n'exempte plus rien, mais un
 * successeur sous un autre nom serait compté sans qu'on sache pourquoi il
 * échoue. *Une exception doit pouvoir être retrouvée.*
 */
describe('les palettes de contenu', () => {
    it.each(Object.keys(PALETTES_DE_CONTENU))('%s existe', (relatif) => {
        expect(fs.existsSync(path.join(SRC, ...relatif.split('/')))).toBe(true);
        expect(PALETTES_DE_CONTENU[relatif].length).toBeGreaterThan(10);
    });

    it('ne parle plus en gris : son chrome est passé aux jetons', () => {
        const pastilles = fs.readFileSync(path.join(SRC, 'modules/music/logic/couleursDePastille.ts'), 'utf-8');
        expect(pastilles).not.toMatch(/(?<![\w-])(?:text|bg|border)-(?:slate|gray|zinc)-\d{2,3}/);
    });
});

/**
 * **Le socle naît sans couleur brute** — refonte, phase 3, 2026-09-30.
 *
 * Les composants de `components/socle/` sont les seuls à connaître la forme,
 * et ils la lisent dans le thème. Une couleur de la palette Tailwind écrite en
 * dur y serait une couleur que ni un thème de base ni un jeu ne peut habiller —
 * et chaque module migré en hériterait. *Une garde posée après coup ne protège
 * que ce qui reste à faire.*
 */
describe('le socle, sans couleur brute', () => {
    const SOCLE = path.join(SRC, 'components', 'socle');
    const fichiers = fs.readdirSync(SOCLE).filter(n => fichierCompte(n));

    it('le socle existe', () => {
        expect(fichiers.length).toBeGreaterThanOrEqual(8);
    });

    it.each(fichiers)('%s ne contient aucune couleur brute', (nom) => {
        expect(compterLesCouleursBrutes(fs.readFileSync(path.join(SOCLE, nom), 'utf-8'))).toBe(0);
    });
});
