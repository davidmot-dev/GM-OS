import { describe, it, expect } from 'vitest';
import { PALETTES, type ThemeID } from './themeDeLInterface';
import { PAIRES_DU_CONTRAT } from './contratDuTheme';
import { contraste } from './editionDuTheme';

/**
 * **T0.3 · La garde de contraste des quatre thèmes de base** — phase 0 de la
 * refonte (`documentation/Planning/2026-09-17-refonte-interface.md`, § 3).
 *
 * *Ce dépôt a payé deux fois exactement ça* : `#334155` sur le fond de Light-OS
 * donnait 1,6 de contraste, et le champ de recherche du Media Hub était à 5 %
 * d'opacité. Aucune relecture ne les avait vus ; un nombre les aurait vus tous
 * les deux.
 *
 * Les seuils sont ceux que le contrat impose aux thèmes de jeu (§ 6 du cahier) :
 * **un thème de base n'a pas droit à moins qu'un thème de jeu**. Les paires
 * dont un membre n'existe pas encore dans les palettes de base — le texte
 * estompé, les états, le texte sur l'accent — entreront ici avec la phase 1,
 * quand les thèmes de base deviendront des paquets de jetons (décision D3).
 */

/** Ce que la palette d'un thème de base sait nommer aujourd'hui, sous les noms du contrat. */
function jetonsDeLaPalette(theme: ThemeID): Record<string, string> {
    return PALETTES[theme].jetons;
}

const THEMES = Object.keys(PALETTES) as ThemeID[];

describe('les quatre thèmes de base, devant les seuils du contrat', () => {
    it('ils sont quatre — un cinquième doit entrer ici aussi', () => {
        expect(THEMES.sort()).toEqual(['claire', 'cyberpunk', 'medieval', 'modern']);
    });

    for (const theme of THEMES) {
        const jetons = jetonsDeLaPalette(theme);
        const paires = PAIRES_DU_CONTRAT.filter(p => jetons[p.avant] && jetons[p.fond]);

        it.each(paires.map(p => [`${p.avant} sur ${p.fond}`, p] as const))(`${theme} : %s`, (_nom, p) => {
            const ratio = contraste(jetons[p.avant], jetons[p.fond]);
            expect(ratio, `${jetons[p.avant]} sur ${jetons[p.fond]}`).not.toBeNull();
            expect(ratio!, `${theme} : ${p.avant} sur ${p.fond} — minimum ${p.minimum}`).toBeGreaterThanOrEqual(p.minimum);
        });

        /*
          La polarité déclarée doit être celle du fond réel (§ 3.5 du cahier) :
          sinon les contrôles natifs — listes, champs, barres de défilement —
          s'affichent à contre-jour.
        */
        it(`${theme} : la polarité suit le fond`, () => {
            const sombre = contraste('#ffffff', PALETTES[theme].jetons.bg)! > contraste('#000000', PALETTES[theme].jetons.bg)!;
            expect(PALETTES[theme].clarte).toBe(sombre ? 'dark' : 'light');
        });
    }

    /*
      ⚠️ **Les pastilles d'accent proposées dans les réglages** : le meneur peut
      en choisir une à la main, et elle passe devant l'accent du thème. Une
      pastille illisible sur son propre thème serait un piège posé par
      l'application elle-même.
    */
    for (const theme of THEMES) {
        it(`${theme} : chaque pastille d'accent proposée se lit sur le fond — hors défauts connus`, () => {
            const fond = PALETTES[theme].jetons.bg;
            const faibles = PALETTES[theme].palettes
                .filter(c => contraste(c, fond)! < 3)
                .sort();
            expect(
                faibles,
                `pastilles sous 3 sur ${fond}. Une de plus : régression. Une de moins : corrigée — la retirer de PASTILLES_ILLISIBLES.`,
            ).toEqual([...(PASTILLES_ILLISIBLES[theme] ?? [])].sort());
        });
    }
});

/**
 * **Trouvé par cette garde à son premier passage, le 2026-09-26.**
 *
 * Médiéval propose quatre accents sur cinq qui ne se lisent pas sur son fond
 * `#181411` : rouge 2,83, bleu 2,10, brun 1,95, violet 1,67. Le meneur peut les
 * choisir dans les réglages — l'application lui tend un piège. Seul l'or de
 * base (8,71) passe.
 *
 * Laissé en l'état **exprès** : choisir leurs remplaçantes est une décision de
 * design, qui appartient à la phase 1 (Médiéval devient une personnalité
 * complète, décision D3). Un cliquet, comme `REFUS_CONNUS` pour les thèmes de
 * jeu : la liste ne peut que raccourcir.
 */
const PASTILLES_ILLISIBLES: Partial<Record<ThemeID, string[]>> = {
    medieval: ['#b91c1c', '#7c2d12', '#4c1d95', '#1e40af'],
};
