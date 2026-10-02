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
];

function releve(): Map<string, number> {
    const parLieu = new Map<string, number>();
    const parcourir = (dossier: string) => {
        for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
            const complet = path.join(dossier, e.name);
            if (e.isDirectory()) { parcourir(complet); continue; }
            const relatif = path.relative(SRC, complet).split(path.sep).join('/');
            if (!fichierCompte(relatif)) continue;
            const n = compterLesCouleursBrutes(fs.readFileSync(complet, 'utf-8'));
            if (n) parLieu.set(lieuDuFichier(relatif), (parLieu.get(lieuDuFichier(relatif)) ?? 0) + n);
        }
    };
    parcourir(SRC);
    return parLieu;
}

describe('les couleurs brutes', () => {
    const parLieu = releve();

    it('le relevé trouve bien quelque chose — sinon le motif ne voit plus rien', () => {
        const total = [...parLieu.values()].reduce((a, b) => a + b, 0);
        expect(total).toBeGreaterThan(1000);
    });

    it.each(MODULES_MIGRES.length ? MODULES_MIGRES : ['(aucun module migré pour l’instant)'])(
        '%s : plus aucune couleur brute',
        (lieu) => {
            if (!MODULES_MIGRES.includes(lieu)) return;
            expect(parLieu.get(lieu) ?? 0, `${lieu} est migré : ses couleurs passent par des jetons`).toBe(0);
        },
    );
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
