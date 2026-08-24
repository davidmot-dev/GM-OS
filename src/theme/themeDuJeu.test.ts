import { describe, it, expect } from 'vitest';
import { extraireJetons, pontVersLInterface, cheminDuTheme } from './jetonsDeTheme';

/**
 * **Le thème du jeu — déposer un fichier doit suffire.**
 *
 * Ici, la **logique** d'extraction et de pont, sur des feuilles écrites à la
 * main. Les vrais `theme.css` du dépôt sont éprouvés par
 * `electron/themesDesJeux.test.ts` : les tests de `src/` tournent avec le shim
 * `fs` d'Electron et ne peuvent pas lire le disque.
 */


describe('extraireJetons', () => {
    /**
     * L'identifiant du bloc n'a pas à correspondre au dossier : le dossier dit
     * déjà de quel jeu il s'agit. Exiger les deux, c'est deux déclarations de
     * la même vérité — donc une occasion de les faire diverger.
     */
    it('accepte n’importe quel identifiant de bloc, et même aucun', () => {
        const sansId = ':root { --rpg-bg: #111; color-scheme: dark; }';
        const autreId = ':root[data-theme="pas-le-dossier"] { --rpg-bg: #222; }';
        const enHtml = 'html[data-theme=\'x\'] { --rpg-bg: #333; }';

        expect(extraireJetons(sansId).jetons.bg).toBe('#111');
        expect(extraireJetons(autreId).jetons.bg).toBe('#222');
        expect(extraireJetons(enHtml).jetons.bg).toBe('#333');
    });

    it('le dernier bloc gagne, comme en CSS', () => {
        const css = ':root { --rpg-accent: #aaa; }\n:root[data-theme="x"] { --rpg-accent: #bbb; }';
        expect(extraireJetons(css).jetons.accent).toBe('#bbb');
    });

    it('ignore ce qui n’est pas un jeton du SDK', () => {
        const css = ':root { --rpg-bg: #111; --autre-chose: #999; color: red; }';
        const { jetons } = extraireJetons(css);
        expect(jetons.bg).toBe('#111');
        expect(Object.keys(jetons)).toEqual(['bg']);
    });

    it('rend un relevé vide plutôt que de lever, sur une feuille sans jetons', () => {
        expect(extraireJetons('.rpg-panel { color: red; }').jetons).toEqual({});
        expect(extraireJetons('').jetons).toEqual({});
    });
});

describe('pontVersLInterface', () => {
    /**
     * **Ne jamais écrire par-dessus ce qui marchait.** Un thème partiel doit
     * laisser le thème d'interface combler le reste, pas poser `undefined` sur
     * une couleur valide.
     */
    it('ne rend que ce que le thème déclare vraiment', () => {
        const vars = pontVersLInterface({ accent: '#ff0000' });

        expect(vars).toEqual({ '--app-accent': '#ff0000' });
        expect('--app-bg' in vars).toBe(false);
    });

    it('un thème qui ne parle que de papier obtient quand même une surface', () => {
        expect(pontVersLInterface({ paper: '#fff' })['--app-surface']).toBe('#fff');
    });

    it('mais `surface` l’emporte sur `paper` quand les deux sont là', () => {
        const vars = pontVersLInterface({ surface: '#123456', paper: '#ffffff' });
        expect(vars['--app-surface']).toBe('#123456');
    });
});

describe('cheminDuTheme', () => {
    it('vise le theme.css du dossier de système', () => {
        expect(cheminDuTheme('systems/alien')).toBe('systems/alien/theme/theme.css');
    });

});
