import { describe, it, expect } from 'vitest';

/**
 * **Un écran se montre au meneur sous le nom que le meneur lui a donné.**
 *
 * ⛔ **Le défaut, signalé par David le 2026-09-13** : *« les noms des moniteurs
 * ne sont pas corrects dans le storyboard »*.
 *
 * L'éditeur d'un moment listait `ecran.label` — **l'étiquette du système**,
 * quand ce n'est pas l'identifiant brut (`Écran 2528732444`). Les noms donnés
 * par le meneur vivent ailleurs : dans `useHardwareStore`, rangés **par
 * signature** pour survivre au rebranchement, et rendus par `getDisplayLabel`.
 *
 * ⚠️ **Ce qui rend cet oubli si facile** : le même composant nommait déjà
 * correctement les **sorties audio**, trois listes plus haut, avec
 * `getAudioLabel`. *Deux moitiés d'un même réglage, écrites au même endroit, et
 * une seule fait le détour par le nom du meneur.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cette garde balaie **tout `src/`** plutôt qu'une liste tenue à la main : le
 * jour où un dixième écran proposera de choisir un moniteur, c'est elle qui
 * dira qu'il doit passer par le nom du meneur.
 *
 * ⚠️ **Elle lit des noms, pas des intentions.** Un fichier qui importerait
 * `getDisplayLabel` sans l'appeler lui échapperait. Ce qu'elle attrape est
 * l'oubli, qui est le cas réel.
 */

const sources = import.meta.glob('/src/**/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

/**
 * **Le code sans les commentaires — et ce n'est pas une commodité.**
 *
 * ⛔ **Sans ça, cette garde se validait sur sa propre documentation.** Le
 * commentaire qui explique le défaut, dans `StoryboardDashboard.tsx`, **cite
 * `getDisplayLabel`** : la garde le trouvait, et déclarait le fichier conforme
 * même avec le défaut remis. *Un appel et une citation ne se distinguent que si
 * l'on retire les commentaires.*
 *
 * C'est le troisième cas de ce motif dans ce dépôt, après
 * `nomsSansEcrivainNiLecteur` : **une garde qui lit des noms ne peut pas lire
 * des intentions** — mais elle peut au moins ne lire que du code.
 */
function sansCommentaires(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

/**
 * **Là où l'étiquette du système est la bonne chose à montrer.**
 *
 * ⛔ *Une exception qu'aucune décision n'explique est un oubli* — d'où le motif
 * à côté, et non un simple chemin.
 */
const DISPENSES: ReadonlyArray<readonly [string, string]> = [
    [
        '/src/components/GlobalSettingsModal.tsx',
        "c'est l'écran où l'on NOMME les moniteurs : il doit montrer l'identité système "
        + "(libellé et définition) à côté du champ de saisie, sinon le meneur ne sait pas "
        + 'lequel des trois il est en train de nommer',
    ],
];

const dispenses = new Set(DISPENSES.map(([chemin]) => chemin));

/** Les façons légitimes d'obtenir le nom d'un écran. */
const NOMME_CORRECTEMENT = /getDisplayLabel|ecransDeProjection/;

/**
 * **Qui énumère les écrans.**
 *
 * ⚠️ La première version de cette garde cherchait `\.displays\)` — la forme du
 * sélecteur Zustand. Elle **ne voyait pas l'écran des Réglages**, qui déstructure
 * le magasin (`const { displays } = ...`), et aurait donc manqué tout futur
 * lecteur écrit de cette façon-là. *Sa propre liste de dispenses l'a dénoncée :
 * elle dispensait un fichier qu'elle ne trouvait même pas.*
 *
 * On cherche donc le **geste** — parcourir la liste — et non la façon de
 * l'obtenir.
 */
const LIT_LA_LISTE = /(?:displays|ecrans)\.map\(/;

describe('les moniteurs proposés au meneur', () => {
    const liseurs = Object.entries(sources)
        .map(([chemin, source]) => [chemin, sansCommentaires(source)] as const)
        .filter(([, code]) => LIT_LA_LISTE.test(code));

    it('la garde voit bien quelque chose', () => {
        // Une garde qui ne trouve rien passe pour de bonnes raisons.
        expect(Object.keys(sources).length).toBeGreaterThan(150);
        expect(liseurs.length, 'plus personne ne lit la liste des écrans ?').toBeGreaterThan(2);
    });

    it('portent le nom donné par le meneur, jamais celui du système', () => {
        const fautifs = liseurs
            .filter(([chemin]) => !dispenses.has(chemin))
            .filter(([, code]) => !NOMME_CORRECTEMENT.test(code))
            .map(([chemin]) => chemin);

        expect(fautifs, [
            'Ces écrans listent des moniteurs sans passer par `getDisplayLabel` :',
            'le meneur y verra l’étiquette du système, voire un identifiant brut,',
            'au lieu du nom qu’il a donné dans les Réglages.',
            'Passez par getDisplayLabel(id), ou par ecransDeProjection() qui le prend en paramètre.',
        ].join(' ')).toEqual([]);
    });

    /** *Une dispense qui survit à ce qu'elle dispense devient un mensonge tranquille.* */
    it('aucune dispense ne parle d’un fichier disparu ou déjà corrigé', () => {
        const mortes = DISPENSES
            .filter(([chemin]) => {
                const source = sources[chemin];
                return source === undefined || !LIT_LA_LISTE.test(sansCommentaires(source));
            })
            .map(([chemin]) => chemin);

        expect(mortes, 'ces dispenses ne dispensent plus rien : retirez-les').toEqual([]);
    });
});
