import { describe, it, expect } from 'vitest';

/**
 * **Une image projetée occupe tout l'écran qu'elle peut.**
 *
 * ⛔ **Le défaut, signalé par David le 2026-09-13** : *« le redimensionnement des
 * images qui parfois ne prennent pas tout l'écran »*.
 *
 * La cause tenait dans une classe absente :
 *
 * ```
 * class="relative z-10 max-w-[95%] max-h-[95%] object-contain"   ← avant
 * ```
 *
 * Une `<img>` **sans dimension** s'affiche à sa **taille naturelle**.
 * `object-contain` ne décide alors rien — il n'agit que sur une boîte dont la
 * taille est donnée — et `max-w`/`max-h` ne font que *plafonner*. Une image de
 * 4 000 px était donc ramenée à l'écran, mais **une image de 1 200 px restait à
 * 1 200 px**, perdue au milieu de son propre flou.
 *
 * *Le « parfois » de David était la définition du fichier* — et c'est ce qui
 * rend ce défaut si difficile à signaler : il dépend de la donnée, donc il passe
 * pour une lubie de l'écran.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE CETTE GARDE PEUT, ET CE QU'ELLE NE PEUT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Elle **lit la source**, elle ne rend rien : jsdom n'a pas de moteur de mise en
 * page, aucune assertion sur des pixels n'y voudrait dire quoi que ce soit.
 * *Elle attrape le retour en arrière — quelqu'un qui remettrait un plafond en
 * pourcentage — pas une régression de mise en page d'une autre nature.*
 */

const sources = import.meta.glob('/src/**/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

const projecteur = sources['/src/modules/image/components/ProjectorView.tsx'];
const hub = sources['/src/components/PlayerHub.tsx'];
const tablette = sources['/src/components/TabletHub.tsx'];

describe('l’image du projecteur', () => {
    it('la garde regarde bien le bon fichier', () => {
        expect(projecteur, 'ProjectorView.tsx est introuvable').toBeTypeOf('string');
        expect(projecteur).toContain('GM-OS Projector');
    });

    /**
     * `w-full h-full` donne une boîte à l'image ; `object-contain` la remplit
     * **en gardant ses proportions**. Une image qui n'a pas le format de l'écran
     * garde ses bandes, et c'est le flou d'elle-même qui les remplit — *c'est à
     * ça qu'il sert.*
     */
    it('reçoit une taille, au lieu de garder la sienne', () => {
        const lignes = projecteur.split('\n')
            .filter(l => l.includes('object-contain') && l.includes('class'));

        expect(lignes.length, 'plus aucune image dimensionnée dans le projecteur').toBeGreaterThan(0);
        for (const ligne of lignes) {
            expect(ligne, `une image sans dimension garde sa taille naturelle : ${ligne.trim()}`)
                .toMatch(/w-full/);
            expect(ligne).toMatch(/h-full/);
        }
    });

    /**
     * ⚠️ **Les deux couches du fondu doivent porter la même taille.** Si l'une
     * était plafonnée et l'autre non, l'image **sauterait de taille** au milieu
     * du fondu croisé — un défaut qu'on attribuerait au fondu, pas à la taille.
     */
    it('ne replafonne pas la taille en pourcentage', () => {
        const plafonds = projecteur.split('\n')
            .map((ligne, i) => [i + 1, ligne] as const)
            .filter(([, ligne]) => /max-[wh]-\[\d+%\]/.test(ligne) && ligne.includes('class'));

        expect(plafonds.map(([n]) => n), [
            'Un plafond en pourcentage sur une <img> sans dimension la laisse à sa',
            'taille naturelle : les petites images ne remplissent plus l’écran, et',
            'les deux couches du fondu peuvent ne plus avoir la même taille.',
        ].join(' ')).toEqual([]);
    });
});

/**
 * **L'ordre des deux couches du fondu se dit, il ne se devine pas.**
 *
 * ⛔ **Le défaut, signalé par David le 2026-09-13** : *« le fondu de la première
 * image fonctionne, mais après je n'ai pas de fondu entre les images
 * suivantes »*. Le « après » désignait la seule différence entre les deux cas :
 * la présence de la couche **sortante**.
 *
 * Les deux couches portent la même `relative z-10` sur leur image nette. Mais
 * la couche **entrante anime son opacité**, ce qui lui **crée un contexte
 * d'empilement** : son `z-10` y reste enfermé, et elle-même ne vaut que
 * `z-auto`. La sortante n'anime rien, donc n'en crée aucun : *son `z-10`
 * s'échappe et écrase le `0` de sa sœur.*
 *
 * **L'ancienne image passait donc par-dessus la nouvelle pendant tout le
 * fondu**, qui jouait entier, caché — puis disparaissait d'un coup au bout des
 * 700 ms. *Un fondu qui joue entièrement caché se voit comme une coupe franche.*
 *
 * ⭐ **Mesuré dans le moteur de rendu d'Electron**, et non déduit :
 * `elementFromPoint` au centre du cadre, en plein fondu, rendait `ancienne`
 * sans les `z-index` explicites et `nouvelle` avec. *Un défaut d'empilement ne
 * se raisonne pas, il se mesure.*
 *
 * ⚠️ **Ce que cette garde peut** : voir qu'on retire un `z-index` explicite.
 * Elle ne rejoue pas la mesure — jsdom n'a ni empilement ni peinture.
 */
describe('les deux couches du fondu', () => {
    it.each([
        ['le projecteur', () => projecteur],
        ['le Player Hub', () => hub],
        /* Entrée le 2026-09-14 : elle était la dernière des trois surfaces sans
           fondu, et donc la dernière où l'ordre des couches ne se posait pas. */
        ['la tablette', () => tablette],
    ])('%s ordonne ses couches explicitement', (_nom, lire) => {
        const source = lire();
        expect(source).toBeTypeOf('string');

        /* Une couche du dessous (`z-0`) et une du dessus (`z-10`) : sans les
           deux, l'ordre retombe sur un `z-index` intérieur qu'on ne contrôle pas. */
        expect(source, [
            "La couche SORTANTE doit porter `z-0` : sans z-index explicite elle ne crée",
            "aucun contexte d'empilement, et le `z-10` de son image passe par-dessus la",
            'couche entrante. Le fondu joue alors entièrement caché.',
        ].join(' ')).toMatch(/inset-0 z-0/);

        expect(source, 'La couche ENTRANTE doit porter `z-10` explicite.').toMatch(/z-10/);
    });
});
