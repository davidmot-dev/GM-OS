import { describe, it, expect } from 'vitest';
import { PALETTES, PERSONNALITES, type ThemeID } from './themeDeLInterface';
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
 * dont un membre n'existe pas dans une palette de base sont sautées : le texte
 * estompé, les états et le texte sur l'accent y sont entrés avec P1.2
 * (2026-09-29) ; le cadre y entrera avec les personnalités, qui le déclarent.
 */

/**
 * Ce que la palette d'un thème de base affiche, sous les noms du contrat —
 * **le cadre compris** (P1.6) : absent, il vaut `bg`, `text` et `accent`
 * (§ 4.8), et c'est ce qu'on mesure alors.
 */
function jetonsDeLaPalette(theme: ThemeID): Record<string, string> {
    const j = PALETTES[theme].jetons;
    return { 'frame-bg': j.bg, 'frame-text': j.text, 'frame-accent': j.accent, ...j };
}

const THEMES = Object.keys(PALETTES) as ThemeID[];

describe('les quatre thèmes de base, devant les seuils du contrat', () => {
    it('ils sont quatre — un cinquième doit entrer ici aussi', () => {
        expect(THEMES.sort()).toEqual(['claire', 'cyberpunk', 'medieval', 'modern']);
    });

    for (const theme of THEMES) {
        const jetons = jetonsDeLaPalette(theme);
        const paires = PAIRES_DU_CONTRAT.filter(p => jetons[p.avant] && jetons[p.fond]);

        // P1.6 : toutes les paires du contrat, pour les quatre thèmes. Une paire sautée ne protège rien.
        it(`${theme} : les ${PAIRES_DU_CONTRAT.length} paires du contrat sont mesurées`, () => {
            expect(paires.length).toBe(PAIRES_DU_CONTRAT.length);
        });

        it.each(paires.map(p => [`${p.avant} sur ${p.fond}`, p] as const))(`${theme} : %s`, (nom, p) => {
            const ratio = contraste(jetons[p.avant], jetons[p.fond]);
            expect(ratio, `${jetons[p.avant]} sur ${jetons[p.fond]}`).not.toBeNull();
            if (PAIRES_ILLISIBLES[theme]?.includes(nom)) {
                expect(ratio!, `${theme} : ${nom} passe désormais — la retirer de PAIRES_ILLISIBLES`).toBeLessThan(p.minimum);
                return;
            }
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

/**
 * **Trouvé par cette garde le 2026-09-29, quand les états sont entrés (P1.2).**
 *
 * Le thème clair écrit ses états avec les couleurs en dur des thèmes sombres —
 * emerald, amber et sky 500 — sur son fond crème `#fbfbf9` : succès 2,45,
 * alerte 2,07, info 2,67 (seuil 3). Seul le danger (red-500, 3,63) passe.
 * **C'est l'écran d'aujourd'hui** : les règles `claire` d'`index.css` ne
 * repeignent pas ces couleurs.
 *
 * Laissé en l'état **exprès** : P1.2 se fait à pixel constant. Les remplaçantes
 * se choisissent avec la personnalité du thème clair (P1.7). Un cliquet : la
 * liste ne peut que raccourcir.
 */
const PAIRES_ILLISIBLES: Partial<Record<ThemeID, string[]>> = {
    claire: ['success sur bg', 'warning sur bg', 'info sur bg'],
};

/**
 * **P1.7 · Les personnalités devant les mêmes seuils** — et sans cliquet :
 * elles sont neuves, aucun défaut connu ne leur est permis. Le cadre se
 * mesure avec ses propres couleurs quand elles sont déclarées (Médiéval,
 * Moderne), par ses replis sinon.
 */
describe('les quatre personnalités, devant les seuils du contrat', () => {
    for (const theme of THEMES) {
        const j = PERSONNALITES[theme].jetons;
        const jetons: Record<string, string> = { 'frame-bg': j.bg, 'frame-text': j.text, 'frame-accent': j.accent, ...j };

        it.each(PAIRES_DU_CONTRAT.map(p => [`${p.avant} sur ${p.fond}`, p] as const))(`${theme} : %s`, (_nom, p) => {
            const ratio = contraste(jetons[p.avant], jetons[p.fond]);
            expect(ratio!, `${theme} : ${jetons[p.avant]} sur ${jetons[p.fond]} — minimum ${p.minimum}`).toBeGreaterThanOrEqual(p.minimum);
        });

        it(`${theme} : la polarité suit le fond`, () => {
            const sombre = contraste('#ffffff', j.bg)! > contraste('#000000', j.bg)!;
            expect(PERSONNALITES[theme].clarte).toBe(sombre ? 'dark' : 'light');
        });

        it(`${theme} : chaque pastille d'accent proposée se lit sur le fond`, () => {
            const faibles = PERSONNALITES[theme].palettes.filter(c => contraste(c, j.bg)! < 3);
            expect(faibles).toEqual([]);
            expect(PERSONNALITES[theme].palettes[0]).toBe(j.accent);
        });
    }
});
