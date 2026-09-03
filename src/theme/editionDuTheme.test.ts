import { describe, it, expect } from 'vitest';
import {
    ecrireLesJetons, ecrireLImportDePolices, echelleDeTexte, tailleDeRacine,
    requeteDePolices, pileDePolice, familleDeLaPile, policeFournie, themeVierge,
    cheminDeLOriginal, JETONS_EDITABLES, BASE_DE_TEXTE_POURCENT,
} from './editionDuTheme';
import { cheminDuTheme, extraireJetons, extraireImportsDePolice } from './jetonsDeTheme';

/**
 * **L'atelier de thème : ce qu'il écrit, et surtout ce qu'il ne touche pas.**
 *
 * *Demandé par David le 2026-09-03.* Le risque de ce module n'est pas de mal
 * écrire une couleur — ça se voit à l'écran dans la seconde. C'est d'**abîmer
 * les trois cents lignes de règles `.rpg-*`** qu'il traverse et dont personne
 * ne se sert dans l'application : elles habillent les fiches de personnage, et
 * leur perte ne se verrait qu'en ouvrant une fiche, un autre jour.
 *
 * D'où la forme de ces essais : ils vérifient l'**écart**, pas le résultat.
 */

const THEME = `/* ==========================================================================
   RPG THEME — EXEMPLE
   ========================================================================== */

@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap');

:root[data-theme="exemple"] {
  color-scheme: dark;

  --rpg-bg: #020711;
  --rpg-accent: #ff5f56;
  /* Un commentaire au milieu, qui doit survivre. */
  --rpg-font-display: "Oswald", "Arial Narrow", sans-serif;
  --rpg-radius-sm: 0px;
}

:root[data-theme="exemple"] .rpg-page {
  background: linear-gradient(180deg, #020711 0%, #040914 100%);
  border-radius: var(--rpg-radius-sm);
}
`;

describe('reposer des jetons dans un thème', () => {
    it('remplace une valeur à sa place, et ne touche à rien d’autre', () => {
        const sortie = ecrireLesJetons(THEME, { accent: '#00ff88' });

        expect(extraireJetons(sortie).jetons.accent).toBe('#00ff88');
        expect(sortie).toContain('Un commentaire au milieu, qui doit survivre.');
        expect(sortie).toContain('.rpg-page {');
        expect(sortie).toContain('background: linear-gradient(180deg, #020711 0%, #040914 100%);');
        // Une seule ligne a bougé.
        expect(sortie.split('\n').length).toBe(THEME.split('\n').length);
    });

    /**
     * **L'invariant qui garde tout le reste.** Réécrire un thème avec ses
     * propres valeurs doit rendre le fichier **identique**. S'il change d'un
     * octet, l'atelier abîme quelque chose — et on le saura ici plutôt qu'en
     * ouvrant une fiche trois jours plus tard.
     */
    it('est sans effet quand on repose les valeurs lues', () => {
        expect(ecrireLesJetons(THEME, extraireJetons(THEME).jetons)).toBe(THEME);
    });

    it('ajoute un jeton absent, à l’indentation du bloc', () => {
        const sortie = ecrireLesJetons(THEME, { muted: '#84919a' });

        expect(extraireJetons(sortie).jetons.muted).toBe('#84919a');
        expect(sortie).toContain('  --rpg-muted: #84919a;');
    });

    /** Le geste « revenir au défaut » : sans lui, on ne pourrait qu'ajouter. */
    it('retire un jeton dont la valeur est vidée', () => {
        const sortie = ecrireLesJetons(THEME, { accent: '' });

        expect(extraireJetons(sortie).jetons.accent).toBeUndefined();
        expect(extraireJetons(sortie).jetons.bg).toBe('#020711');
    });

    /**
     * *On ne fabrique pas une structure dans un fichier qu'on n'a pas compris.*
     * Un fichier sans bloc racine ressort tel quel — l'atelier proposera de
     * créer un thème neuf plutôt que de mutiler celui-là.
     */
    it('laisse intact un fichier sans bloc racine', () => {
        const sansRacine = '.rpg-page { color: red; }\n';
        expect(ecrireLesJetons(sansRacine, { accent: '#fff' })).toBe(sansRacine);
    });

    /** Le dernier bloc gagne à la lecture : c'est donc lui qu'on écrit. */
    it('écrit dans le dernier bloc racine, celui que la lecture retient', () => {
        const deuxBlocs = ':root { --rpg-accent: #111; }\n:root[data-theme="x"] { --rpg-accent: #222; }\n';

        const sortie = ecrireLesJetons(deuxBlocs, { accent: '#333' });

        expect(sortie).toContain('--rpg-accent: #111;');
        expect(sortie).toContain('--rpg-accent: #333;');
        expect(extraireJetons(sortie).jetons.accent).toBe('#333');
    });
});

describe('l’import des polices', () => {
    /**
     * *Le piège du 2026-08-24 :* une police déclarée sans import n'est jamais
     * téléchargée, et le navigateur retombe **en silence** sur le repli.
     */
    it('remplace l’import existant sans déplacer le reste', () => {
        const url = requeteDePolices(['Barlow Condensed', 'IBM Plex Mono']);

        const sortie = ecrireLImportDePolices(THEME, url!);

        expect(extraireImportsDePolice(sortie)).toEqual([url]);
        expect(sortie.indexOf('@import')).toBeLessThan(sortie.indexOf(':root'));
        expect(sortie).toContain('RPG THEME — EXEMPLE');
    });

    /** Un `@import` doit précéder toute règle : c'est le langage, pas un goût. */
    it('écrit l’import en tête quand le fichier n’en a pas', () => {
        const sortie = ecrireLImportDePolices(':root { --rpg-bg: #000; }\n', 'https://fonts.googleapis.com/css2?family=Oswald&display=swap');

        expect(sortie.indexOf('@import')).toBe(0);
    });

    it('retire l’import quand plus aucune police n’en a besoin', () => {
        const sortie = ecrireLImportDePolices(THEME, null);

        expect(extraireImportsDePolice(sortie)).toEqual([]);
        expect(sortie).toContain('--rpg-bg: #020711;');
    });

    /**
     * Les axes ne se devinent pas : une requête inventée renvoie une erreur,
     * donc **aucune police**. On ne demande que ce qu'on sait demander.
     */
    it('n’invente aucune requête pour une police inconnue', () => {
        expect(requeteDePolices(['Une Police Qui N’Existe Pas'])).toBeNull();
        expect(policeFournie('Une Police Qui N’Existe Pas')).toBe('locale');
    });

    /** Redemander ce qu'`index.css` charge déjà alourdirait chaque ouverture. */
    it('ne redemande pas les polices que l’application charge déjà', () => {
        expect(requeteDePolices(['Outfit', 'JetBrains Mono'])).toBeNull();
        expect(policeFournie('Outfit')).toBe('application');
    });

    it('écrit une pile avec un repli, jamais une famille seule', () => {
        expect(pileDePolice('Oswald')).toBe('"Oswald", Arial Narrow, sans-serif');
        expect(familleDeLaPile('"Oswald", Arial Narrow, sans-serif')).toBe('Oswald');
    });
});

describe('l’échelle du texte', () => {
    /**
     * ⚠️ `index.css` pose `:root { font-size: 85% }` : **un `rem` vaut 13,6 px**.
     * L'échelle multiplie cette base — la remplacer par « 100 % » grossirait
     * toute l'interface de 18 % sans que personne ne l'ait demandé.
     */
    it('multiplie la base de GM-OS au lieu de la remplacer', () => {
        expect(tailleDeRacine('1.1')).toBe(`${(BASE_DE_TEXTE_POURCENT * 1.1).toFixed(2)}%`);
    });

    it('accepte un pourcentage comme un facteur', () => {
        expect(echelleDeTexte('110')).toBeCloseTo(1.1);
        expect(echelleDeTexte('1.1')).toBeCloseTo(1.1);
    });

    /** Une interface illisible ne se répare plus depuis l'interface. */
    it('borne ce qui rendrait l’application inutilisable', () => {
        expect(echelleDeTexte('3')).toBe(1.3);
        expect(echelleDeTexte('0.2')).toBe(0.8);
    });

    /**
     * `null` et « 1 » ne disent pas la même chose : le premier veut dire *n'y
     * touche pas*, et c'est lui qui permet de retirer le style au lieu d'écrire
     * une valeur qui ressemble au défaut.
     */
    it('distingue « rien de déclaré » de « échelle 1 »', () => {
        expect(echelleDeTexte(undefined)).toBeNull();
        expect(echelleDeTexte('')).toBeNull();
        expect(echelleDeTexte('pas un nombre')).toBeNull();
        expect(tailleDeRacine(undefined)).toBeNull();
        expect(echelleDeTexte('1')).toBe(1);
    });
});

describe('un thème neuf', () => {
    it('se relit avec les jetons qu’on lui a donnés', () => {
        const css = themeVierge('Mon Jeu', { bg: '#101010', accent: '#ff0000' });

        const relu = extraireJetons(css);
        expect(relu.jetons.bg).toBe('#101010');
        expect(relu.jetons.accent).toBe('#ff0000');
    });

    it('n’écrit pas les jetons qu’on ne lui a pas donnés', () => {
        const css = themeVierge('Mon Jeu', { bg: '#101010' });

        expect(css).not.toContain('--rpg-accent');
    });
});

describe('la copie d’origine', () => {
    /**
     * Elle se range **à côté du thème**, dans le dossier du jeu : elle voyage
     * avec lui, et un jeu copié ailleurs emporte son filet.
     */
    it('se dérive du chemin du thème, sans le réécrire à la main', () => {
        expect(cheminDeLOriginal('systems/alien')).toBe('systems/alien/theme/theme.original.css');
        expect(cheminDeLOriginal('systems/alien'))
            .toBe(cheminDuTheme('systems/alien').replace('theme.css', 'theme.original.css'));
    });
});

describe('le catalogue', () => {
    /**
     * Les vingt-deux jetons du SDK sont identiques dans les cinq thèmes du
     * dépôt — `electron/editionDuTheme.test.ts` le vérifie sur le disque. Ici on
     * garde la cohérence interne : pas de doublon, pas de clé vide.
     */
    it('ne déclare aucun jeton deux fois', () => {
        const cles = JETONS_EDITABLES.map(j => j.cle);
        expect(new Set(cles).size).toBe(cles.length);
    });

    it('donne une aide à chaque jeton — un réglage sans phrase ne se règle pas', () => {
        expect(JETONS_EDITABLES.every(j => j.aide.trim().length > 10)).toBe(true);
    });
});
