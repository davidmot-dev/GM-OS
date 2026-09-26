import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { RapportDeTheme } from '../src/theme/validationDuTheme';

/**
 * **Tous les thèmes du dépôt, passés par la vraie commande.**
 *
 * On lance `scripts/theme-valider.mjs --tous --json` — la commande que David
 * emploie — plutôt que d'appeler le validateur : l'essai prouve ainsi aussi que
 * Node lit toujours le TypeScript du dépôt sans paquet ajouté.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UN CLIQUET, PAS UNE TOLÉRANCE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-26, **aucun des six thèmes n'est accepté** : aucun n'a
 * d'`intention.md` (exigé depuis le contrat v1.1), et quatre tombent dans le
 * piège « page de livre ». Les refuser ici bloquerait tout envoi.
 *
 * `REFUS_CONNUS` fige donc **leurs erreurs exactes**. Une erreur qui apparaît
 * est une régression ; une erreur qui disparaît — un thème réparé par RPG Theme
 * Builder — fait AUSSI échouer l'essai, pour qu'on la retire de la liste. *La
 * liste ne peut que raccourcir, et un thème nouveau n'y figure pas : il doit
 * être accepté.*
 */

const REFUS_CONNUS: Record<string, string[]> = {
    alien: ['§ 1.1'],
    'blade-runner': ['§ 1.1'],
    dune: ['§ 1.1', '§ 3.5', '§ 6 muted', '§ 6 accent'],
    noc: ['§ 1.1', '§ 3.5', '§ 6 muted', '§ 6 accent'],
    'star-trek': ['§ 1.1', '§ 3.5', '§ 6 text', '§ 6 muted', '§ 6 accent-contrast'],
    torg: ['§ 1.1', '§ 3.5', '§ 4.5 radius-lg', '§ 6 muted', '§ 6 muted', '§ 6 accent'],
};

const RACINE = path.resolve(__dirname, '..');

const execution = spawnSync(process.execPath, ['scripts/theme-valider.mjs', '--tous', '--json'], {
    cwd: RACINE, encoding: 'utf-8',
});
const rapports: RapportDeTheme[] = execution.status === 2 ? [] : JSON.parse(execution.stdout || '[]');

describe('les thèmes de jeu du dépôt, devant le contrat', () => {
    it('la commande tourne et rend un rapport par thème', () => {
        expect(execution.stderr).not.toMatch(/Error|ERR_/);
        expect(rapports.length).toBeGreaterThanOrEqual(6);
        /* Refusé si un seul thème l'est — c'est le cas tant que REFUS_CONNUS n'est pas vide. */
        expect(execution.status).toBe(rapports.every(r => r.accepte) ? 0 : 1);
    });

    it.each(rapports.map(r => [r.jeu, r] as const))('%s : exactement ses erreurs connues', (jeu, r) => {
        const obtenues = r.erreurs.map(e => (e.regle === '§ 1.1' || e.regle === '§ 3.5' ? e.regle : `${e.regle} ${e.jeton}`)).sort();
        expect(
            obtenues,
            'Une erreur de plus : régression. Une de moins : le thème a été réparé — la retirer de REFUS_CONNUS.',
        ).toEqual([...(REFUS_CONNUS[jeu] ?? [])].sort());
    });

    it('le rapport d\'un thème, en texte, sort en erreur quand il est refusé', () => {
        const alien = spawnSync(process.execPath, ['scripts/theme-valider.mjs', 'alien'], { cwd: RACINE, encoding: 'utf-8' });
        expect(alien.stdout).toContain('Rapport du validateur GM-OS — thème « alien »');
        expect(alien.status).toBe(REFUS_CONNUS.alien.length ? 1 : 0);
    });
});
