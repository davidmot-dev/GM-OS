import { describe, it, expect, vi } from 'vitest';
import {
    extraireJetons, pontVersLInterface, cheminDuTheme,
    extraireImportsDePolice, premiereFamille, POLICES_APPLIQUEES,
} from './jetonsDeTheme';

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

/**
 * **La police déclarée doit être téléchargée, pas seulement nommée.**
 *
 * Signalé par David le 2026-08-24 : *« en réalité les thèmes ne changent pas la
 * police »*. `--font-display` valait bien `"Montserrat", …`, mais Montserrat
 * n'était jamais chargée — on extrait les jetons SANS charger la CSS, donc
 * l'`@import` du thème ne s'exécutait pas. Le navigateur retombait en silence
 * sur `Arial Narrow`.
 */
describe('extraireImportsDePolice', () => {
    it('relève l’import d’un thème', () => {
        const css = "@import url('https://fonts.googleapis.com/css2?family=Montserrat&display=swap');"
            + ':root{}';
        expect(extraireImportsDePolice(css))
            .toEqual(['https://fonts.googleapis.com/css2?family=Montserrat&display=swap']);
    });

    it('accepte les guillemets doubles et l’absence de guillemets', () => {
        expect(extraireImportsDePolice('@import url("https://fonts.googleapis.com/a");')).toHaveLength(1);
        expect(extraireImportsDePolice('@import url(https://fonts.googleapis.com/b);')).toHaveLength(1);
    });

    /**
     * Un fichier de thème est du code exécuté par l'interface : on n'y suit pas
     * n'importe quelle URL.
     */
    it('refuse un hôte non autorisé et le dit', () => {
        const avert = vi.spyOn(console, 'warn').mockImplementation(() => { /* silence */ });
        expect(extraireImportsDePolice('@import url("https://exemple.test/polices.css");')).toEqual([]);
        expect(avert).toHaveBeenCalledOnce();
        avert.mockRestore();
    });

    it('refuse ce qui n’est pas https', () => {
        expect(extraireImportsDePolice('@import url("http://fonts.googleapis.com/a");')).toEqual([]);
    });

    it('ignore un import relatif, qui n’a rien à charger', () => {
        expect(extraireImportsDePolice("@import url('./autre.css');")).toEqual([]);
    });

    it('ne rend pas deux fois le même', () => {
        const u = 'https://fonts.googleapis.com/css2?family=Oswald';
        expect(extraireImportsDePolice(`@import url('${u}');@import url('${u}');`)).toHaveLength(1);
    });
});

describe('premiereFamille', () => {
    it('rend la police voulue, pas ses replis', () => {
        expect(premiereFamille('"Montserrat", "Arial Narrow", Arial, sans-serif')).toBe('Montserrat');
        expect(premiereFamille("'IBM Plex Mono', monospace")).toBe('IBM Plex Mono');
        expect(premiereFamille('sans-serif')).toBe('sans-serif');
    });

    it('rend null sur rien', () => {
        expect(premiereFamille(undefined)).toBeNull();
        expect(premiereFamille('  ')).toBeNull();
    });
});

/**
 * **On ne vérifie la disponibilité que des polices qu'on applique.**
 *
 * Signalé par David le 2026-08-24 : le thème Torg déclarait Libre Baskerville
 * absente alors qu'elle était correctement importée. Elle est affectée à
 * `font-body`, que le pont ne transporte pas — donc rien ne l'emploie, donc le
 * navigateur ne la télécharge jamais. Oswald, du même import mais affectée à
 * `font-display`, ne posait aucun problème.
 */
describe('POLICES_APPLIQUEES', () => {
    it('ne retient que les polices que le pont transporte', () => {
        expect([...POLICES_APPLIQUEES].sort()).toEqual(['font-display', 'font-mono']);
    });

    /**
     * **Dérivée, jamais recopiée.** Une seconde liste écrite à la main
     * dériverait au premier jeton ajouté — le motif que ce dépôt a payé cinq
     * fois dans la même journée.
     */
    it('reste d’accord avec le pont, par construction', () => {
        const duPont = Object.keys(pontVersLInterface({
            'font-display': 'X', 'font-body': 'X', 'font-ui': 'X', 'font-mono': 'X',
        }));
        expect(duPont.sort()).toEqual(['--font-display', '--font-mono']);
        expect(POLICES_APPLIQUEES).toHaveLength(duPont.length);
    });

    it('n’inclut ni font-body ni font-ui, qui appartiennent aux fiches', () => {
        expect(POLICES_APPLIQUEES).not.toContain('font-body');
        expect(POLICES_APPLIQUEES).not.toContain('font-ui');
    });
});
