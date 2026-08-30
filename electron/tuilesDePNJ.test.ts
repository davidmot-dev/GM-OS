import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Les tuiles de PNJ ne déclarent qu'UNE hauteur, et c'est celle du portrait.**
 *
 * Ce contrôle existe parce que le même défaut a été signalé **deux fois par
 * David**, à neuf jours d'écart, avec la même phrase : on ne voit pas les
 * boutons sous les PNJ.
 *
 * - **2026-08-21** — la carte valait `h-96` pendant que ses deux moitiés en
 *   réclamaient plus. On a retiré la hauteur de la carte, et le commentaire a
 *   conclu que « la même erreur ne peut plus se reproduire ».
 * - **2026-08-30** — elle s'est reproduite. `h-48` était resté sur la moitié
 *   basse, **trop court pour son propre contenu** : ~138 px demandés pour 129
 *   disponibles (avec `:root { font-size: 85% }`, où `h-48` vaut 163 px et non
 *   192), et 21 de plus dès qu'un nom passe sur deux lignes. Les cartes à nom
 *   court étaient rognées de neuf pixels, celles à nom long de trente.
 *
 * *Retirer une des trois hauteurs laissait deux vérités concurrentes, ce qui
 * suffit à diverger.* Et surtout : **un commentaire qui affirme une propriété
 * ne la vérifie pas.** D'où ce fichier.
 *
 * Il vit dans `electron/` parce que c'est le seul projet en environnement node :
 * le projet « renderer » n'a pas de `fs`. Même raison que `racineDuCorpus`, qui
 * lit lui aussi des fichiers de `src/`.
 */

const SOURCE = fs.readFileSync(
    path.join(__dirname, '..', 'src/modules/session/components/NpcGallery.tsx'),
    'utf-8',
);

/**
 * Le `className` qui **commence par** ce début-là.
 *
 * On vise le début de la liste de classes, pas un repère quelconque : chercher
 * « après un texte » retombait sur le `className` du bloc suivant dès que le
 * repère se trouvait déjà à l'intérieur d'un `className` — et le test comparait
 * alors la mauvaise moitié de la carte.
 */
function classesCommencantPar(debut: string): string {
    const motif = new RegExp(
        `className=\\{?([\`"])(${debut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\`"]*)\\1`,
    );
    const m = motif.exec(SOURCE);
    if (!m) throw new Error(`aucun className commençant par « ${debut} »`);
    return m[2];
}

/** Une hauteur figée : `h-48`, `h-[26rem]`… mais pas `h-full` ni `min-h-`. */
const HAUTEUR_FIGEE = /(?<!min-)\bh-(?:\d+|\[[^\]]+\])/;

describe('la carte de PNJ', () => {
    it('ne déclare aucune hauteur : elle est la somme de ses parties', () => {
        const carte = classesCommencantPar('group relative flex flex-col rounded-2xl');
        expect(carte).toContain('flex flex-col');
        expect(carte, `hauteur figée sur la carte : « ${carte} »`).not.toMatch(HAUTEUR_FIGEE);
    });

    /**
     * Le défaut du 30/08, exactement. `flex-1` laisse le contenu prendre ce
     * qu'il lui faut, et la grille étire toutes les cartes d'une rangée à la
     * même hauteur — donc des boutons alignés d'une carte à l'autre.
     */
    it('laisse sa moitié basse prendre la place qu’il lui faut', () => {
        const contenu = classesCommencantPar('p-5 ');
        expect(contenu, 'le contenu doit croître, pas être borné').toContain('flex-1');
        expect(contenu, `hauteur figée sur le contenu : « ${contenu} »`).not.toMatch(HAUTEUR_FIGEE);
    });

    /** Le portrait est la seule hauteur écrite, et elle est légitime. */
    it('garde une hauteur de portrait, et une seule', () => {
        expect(classesCommencantPar('relative h-56')).toMatch(/\bh-56\b/);
    });

    /**
     * `min-h` et non `h` : seule dans sa rangée, la case « ajouter » garde sa
     * taille ; entourée de cartes plus hautes, la grille l'étire au lieu de la
     * rogner — ce qui ferait réapparaître le défaut par la porte d'à côté.
     */
    it('donne à la case « ajouter » un plancher, pas un plafond', () => {
        expect(SOURCE).toMatch(/const HAUTEUR_DE_CARTE = 'min-h-\[/);
    });
});

/**
 * **Quatre colonnes au maximum — demandé par David le 2026-08-30.**
 *
 * La cinquième, au-delà de 1900 px, ramenait chaque carte sous 250 px : un nom
 * un peu long y passait systématiquement sur deux lignes, ce qui déclenchait
 * l'autre moitié du défaut. *Remplir l'écran restait le but ; le remplir de
 * cartes illisibles ne l'était pas.*
 */
describe('la grille des PNJ', () => {
    it('ne dépasse pas quatre colonnes', () => {
        const grille = classesCommencantPar('grid grid-cols-1');
        expect(grille).toContain('2xl:grid-cols-4');
        expect(grille, 'aucune règle ne doit rouvrir une cinquième colonne')
            .not.toMatch(/grid-cols-([5-9]|\d{2})/);
    });
});

