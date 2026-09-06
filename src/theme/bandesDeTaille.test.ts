import { describe, it, expect } from 'vitest';
import {
    JETONS_EDITABLES, echelleDeTexte, palierDeLEchelle, PALIERS_DE_TAILLE,
    ECHELLE_MIN, ECHELLE_MAX,
} from './editionDuTheme';

/**
 * **Les quatre bandes de taille.**
 *
 * Posées le 2026-09-05 : David voulait régler « la taille des différentes
 * polices ». Il a fallu d'abord convertir **1 832 tailles écrites en pixels en
 * dur**, qui n'obéissaient à aucune échelle — le curseur d'avant ne
 * redimensionnait que la moitié de l'écran, sans le dire.
 *
 * ⚠️ **CE QUE CE FICHIER NE GARDE PAS.** Les paliers vivent dans `index.css`,
 * et cette feuille est **illisible depuis les tests** : ni `?raw` (le pipeline
 * CSS de Vite passe avant), ni `node:fs`, ni `import.meta.glob`. Les trois ont
 * été essayés. *Mieux vaut le dire que laisser croire à une garde qui n'existe
 * pas.*
 *
 * Ce qui est gardé ici : **l'arithmétique de la conversion** et **le contrat
 * des jetons**. Si `index.css` change de valeurs, ces tests passeront toujours
 * — et c'est le tableau ci-dessous qu'il faudra relire.
 */

/**
 * ⛔ **La racine porte `font-size: 85%`** — un `rem` vaut donc **13,6 px**, pas
 * 16. C'est le piège que ce dépôt a déjà payé le 2026-08-23, et il a failli se
 * rejouer : prendre les valeurs sur 16 px aurait rétréci toute l'interface de
 * 15 %, sur chaque écran à la fois.
 */
const RACINE_POURCENT = 85;
const PX_PAR_REM = 16 * (RACINE_POURCENT / 100);

/** Le tableau qui doit correspondre à `@theme` dans `index.css`, pixel pour rem. */
const PALIERS_DINTERFACE: readonly (readonly [string, number, number])[] = [
    ['ui-7', 0.5147, 7],
    ['ui-8', 0.5882, 8],
    ['ui-9', 0.6618, 9],
    ['ui-10', 0.7353, 10],
    ['ui-11', 0.8088, 11],
    ['ui-12', 0.8824, 12],
];

describe('la conversion ne change rien à l’écran', () => {
    it.each(PALIERS_DINTERFACE)('« %s » rend %f rem, soit %i px', (_nom, rem, px) => {
        expect(rem * PX_PAR_REM).toBeCloseTo(px, 1);
    });

    it('les paliers montent dans l’ordre', () => {
        const rems = PALIERS_DINTERFACE.map(([, rem]) => rem);
        expect([...rems].sort((a, b) => a - b)).toEqual(rems);
    });

    it('ils ne s’emboîtent PAS sous `xs`, et c’est pourquoi ils ne s’appellent pas « 2xs »', () => {
        /*
          `text-xs` vaut 0,75 rem, soit 10,2 px à cette racine : `ui-11` est
          donc plus GRAND que lui. Les nommer par la ladder de Tailwind aurait
          menti sur l'ordre. *Un nom qui ment sur l'ordre se paie au premier
          doute.*
        */
        const xsEnPx = 0.75 * PX_PAR_REM;
        expect(xsEnPx).toBeCloseTo(10.2, 1);
        expect(0.8088 * PX_PAR_REM).toBeGreaterThan(xsEnPx);
    });
});

describe('les quatre bandes sont offertes dans l’atelier', () => {
    const BANDES = ['scale-interface', 'scale-corps', 'scale-titres', 'scale-mono'];

    it.each(BANDES)('« %s » est un jeton d’échelle, réglable sur l’interface', (cle) => {
        const jeton = JETONS_EDITABLES.find(j => j.cle === cle);
        expect(jeton).toBeDefined();
        expect(jeton!.famille).toBe('echelle');
        expect(jeton!.surLInterface).toBe(true);
        expect(jeton!.groupe).toBe('tailles');
    });

    it('elles sont quatre — sans quoi la boucle ci-dessus ne prouverait rien', () => {
        expect(BANDES.length).toBe(4);
    });

    it('le réglage d’ensemble reste là, à côté', () => {
        const general = JETONS_EDITABLES.find(j => j.cle === 'font-scale');
        expect(general?.famille).toBe('echelle');
    });
});

describe('ce qu’une bande accepte comme valeur', () => {
    it('lit un pourcentage comme un facteur', () => {
        expect(echelleDeTexte('110')).toBeCloseTo(1.1, 3);
    });

    it('lit un facteur tel quel', () => {
        expect(echelleDeTexte('1.2')).toBeCloseTo(1.2, 3);
    });

    it('rend `null` sur une valeur vide — et c’est ce qui EFFACE la variable', () => {
        /*
          *Ne rien dire et dire « échelle 1 » doivent laisser la même page* :
          `themeDeLInterface` retire la propriété plutôt que d'écrire « 1 ».
        */
        expect(echelleDeTexte('')).toBeNull();
        expect(echelleDeTexte(undefined)).toBeNull();
    });

    it('borne une saisie absurde au lieu d’inverser l’intention', () => {
        const grand = echelleDeTexte('500');
        expect(grand).not.toBeNull();
        expect(grand!).toBeGreaterThan(1);
    });
});

/**
 * **Les paliers nommés** — demandés par David le 2026-09-06 : *« ne serait-ce
 * pas plus simple d'avoir une liste avec les différentes tailles ? »*
 *
 * Ce qui se garde ici est **l'accord entre la liste et la borne**. Offrir un
 * palier qu'`echelleDeTexte` borderait afficherait un nom pour une taille qu'on
 * n'obtient pas — le motif « un contrôle qui se trompe est pire qu'un contrôle
 * absent », déjà payé sur la dérivation de Cthulhu Hack.
 */
describe('les paliers de taille', () => {
    it('tiennent tous dans les bornes — un nom ne doit jamais promettre une taille bornée', () => {
        for (const p of PALIERS_DE_TAILLE) {
            expect(echelleDeTexte(p.valeur)).toBeCloseTo(Number(p.valeur), 6);
        }
    });

    it('montent dans l’ordre, et proposent « Normal »', () => {
        const valeurs = PALIERS_DE_TAILLE.map(p => Number(p.valeur));
        expect([...valeurs].sort((a, b) => a - b)).toEqual(valeurs);
        expect(valeurs).toContain(1);
    });

    /**
     * **Le dernier palier EST le plafond.** Sinon on borderait une plage que
     * rien ne permet d'atteindre — un plafond que l'interface ne sait pas
     * offrir n'existe que dans le code.
     */
    it('vont jusqu’au plafond, et pas au-delà', () => {
        const valeurs = PALIERS_DE_TAILLE.map(p => Number(p.valeur));
        expect(Math.max(...valeurs)).toBe(ECHELLE_MAX);
        expect(Math.min(...valeurs)).toBe(ECHELLE_MIN);
    });

    it('portent des noms distincts — deux libellés identiques ne se choisissent pas', () => {
        expect(new Set(PALIERS_DE_TAILLE.map(p => p.label)).size).toBe(PALIERS_DE_TAILLE.length);
    });

    it('se retrouvent depuis la valeur du thème, en facteur comme en pourcentage', () => {
        expect(palierDeLEchelle('1.2')?.label).toBe('Très grand');
        expect(palierDeLEchelle('120')?.label).toBe('Très grand');
    });

    it('rendent `null` sur une valeur hors liste — c’est ce qui la garde sélectionnable', () => {
        /*
          Un thème réglé au curseur d'avant peut porter « 107 % ». Le confondre
          avec « rien de réglé » le remplacerait au premier passage dans
          l'atelier, sans que personne ne l'ait demandé.
        */
        expect(palierDeLEchelle('1.07')).toBeNull();
        expect(echelleDeTexte('1.07')).toBeCloseTo(1.07, 3);
        expect(palierDeLEchelle('')).toBeNull();
    });
});
