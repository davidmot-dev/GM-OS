import type { LightScene } from '../useLightStore';

/**
 * **Combien de cases compte un râtelier.**
 *
 * Dix-huit depuis toujours — c'est ce que la grille montre, et ce que le guide
 * promet. Ce n'est plus un **plafond** depuis le 2026-09-19, mais un
 * **garnissage** : voir {@link casesAGarnir}.
 */
export const TAILLE_DU_RATELIER = 18;

/** La couleur d'une tuile que personne n'a peinte. Voir `couleurDeLaTuile`. */
const COULEUR_NEUTRE = '#334155';

/**
 * **L'identifiant d'une case.**
 *
 * | Râtelier | Forme | Exemple |
 * | --- | --- | --- |
 * | Le **pot commun** | `SCENE_NN` | `SCENE_07` |
 * | Une **campagne** | `SCENE_<campagne>_NN` | `SCENE_c-1758…_07` |
 *
 * ⚠️ **L'identifiant n'est pas le propriétaire.** C'est `campagneId` qui dit à
 * qui appartient une tuile, et lui seul : un identifiant ne change jamais, sous
 * peine de casser les liens que cinq autres modules tiennent dessus (pads de
 * Sound-OS et Music-OS, pistes d'Ambient-OS, zones de danger, moments de
 * storyboard). La campagne apparaît dans l'identifiant pour qu'il soit
 * **lisible et triable**, pas pour être relue.
 *
 * ⛔ Les dix-huit tuiles d'origine gardent donc `SCENE_01`…`SCENE_18` : *aucune
 * migration, aucun lien cassé.*
 */
export const idDeCase = (campagneId: string | null, numero: number): string => {
    const rang = numero.toString().padStart(2, '0');
    return campagneId ? `SCENE_${campagneId}_${rang}` : `SCENE_${rang}`;
};

/**
 * Le numéro d'une case, lu **après le dernier tiret bas**.
 *
 * ⛔ `sceneId.split('_')[1]` marchait tant qu'il n'y avait qu'un râtelier : sur
 * `SCENE_c-1758…_07` il rendait la campagne, et `parseInt` en faisait `NaN` —
 * d'où une tuile effacée qui s'appelait **« Scene NaN »**.
 */
export const numeroDeCase = (id: string): number => {
    const dernier = id.slice(id.lastIndexOf('_') + 1);
    const numero = parseInt(dernier, 10);
    return Number.isFinite(numero) ? numero : 0;
};

/** Le nom que porte une case vide : `Scene 7`. */
export const nomParDefaut = (id: string): string => `Scene ${numeroDeCase(id)}`;

/** Une case libre, neuve. */
const caseLibre = (campagneId: string | null, numero: number): LightScene => {
    const id = idDeCase(campagneId, numero);
    return {
        id,
        name: nomParDefaut(id),
        icon: 'wb_incandescent',
        color: COULEUR_NEUTRE,
        lightStates: {},
        campagneId,
    };
};

/**
 * **Les cases qui manquent à un râtelier pour en avoir dix-huit.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI GARNIR, ET NON PLAFONNER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Jusqu'au 2026-09-19, les dix-huit cases étaient **partagées par toutes les
 * campagnes**. Rattacher une tuile à *Alien* la retirait de la grille de *Rêves
 * de Dragons* : on ne rangeait pas, on rétrécissait. Chaque campagne a
 * désormais ses dix-huit, plus le **pot commun** — ce qui n'a pas d'étiquette
 * sert partout.
 *
 * ⚠️ **Dix-huit est un plancher, pas un plafond.** Un meneur peut rattacher une
 * tuile commune à sa campagne : son râtelier en compte alors dix-neuf, et le
 * pot commun se regarnit tout seul à la prochaine ouverture. *Un nombre rond
 * n'a jamais valu qu'on refuse un geste au meneur.*
 *
 * ⛔ **Ce que cette fonction ne doit jamais faire, c'est en créer deux fois.**
 * Elle ne regarde donc pas *combien de cases il faudrait* mais **quels numéros
 * sont libres** : appelée deux fois de suite, la seconde ne rend rien.
 *
 * @param scenes toutes les tuiles, tous râteliers confondus
 * @param campagneId le râtelier à garnir, ou `null` pour le pot commun
 */
export function casesAGarnir(
    scenes: Record<string, LightScene>,
    campagneId: string | null,
): LightScene[] {
    const duRatelier = Object.values(scenes).filter(
        s => (s.campagneId ?? null) === campagneId,
    );
    if (duRatelier.length >= TAILLE_DU_RATELIER) return [];

    const prises = new Set(duRatelier.map(s => s.id));
    const manquantes: LightScene[] = [];

    for (let numero = 1; numero <= TAILLE_DU_RATELIER; numero++) {
        if (duRatelier.length + manquantes.length >= TAILLE_DU_RATELIER) break;
        const id = idDeCase(campagneId, numero);
        /*
          Une case peut exister sous cet identifiant tout en appartenant à
          quelqu'un d'autre — le meneur l'a rattachée ailleurs. On saute alors
          le numéro plutôt que d'écraser sa tuile.
        */
        if (prises.has(id) || scenes[id]) continue;
        manquantes.push(caseLibre(campagneId, numero));
    }

    return manquantes;
}
