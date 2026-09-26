import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    compterLesCouleursBrutes, lieuDuFichier, fichierCompte,
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
const MODULES_MIGRES: string[] = [];

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
