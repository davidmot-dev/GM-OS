import * as THREE from 'three';

/**
 * **Empêcher deux dés d'occuper la même place.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, David : *« est-ce que tu peux faire en sorte que les dés ne
 * s'imbriquent pas les uns dans les autres »*.
 *
 * La chute ne connaissait que le sol et les murs. **Les dés ne se voyaient pas
 * entre eux** : deux dés lancés au même endroit se traversaient et finissaient
 * posés l'un dans l'autre, ce qui est la seule chose qu'un vrai dé ne fait jamais.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ POURQUOI DES SPHÈRES, ET POURQUOI C'EST LE BON CHOIX ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une collision exacte entre polyèdres tournant sur eux-mêmes demande un moteur
 * physique. Aucun n'est installé, et en ajouter un pour ça coûterait bien plus
 * que le problème.
 *
 * On approche donc chaque dé par une **sphère**. Reste à choisir son rayon :
 *
 * | Rayon | Ce que ça donne |
 * | --- | --- |
 * | le rayon **inscrit** | les coins continuent de se traverser |
 * | le rayon **circonscrit** | les dés se repoussent de loin, avec un vide visible entre eux |
 * | **la moyenne des deux** | un léger jeu, jamais d'imbrication |
 *
 * ⭐ ***Quand la demande est « qu'ils ne s'imbriquent pas », une petite distance
 * vaut mieux qu'un contact parfait.*** On prend la moyenne, et l'erreur penche du
 * côté qui ne se voit pas.
 *
 * ⚠️ La moyenne se calcule **par solide** : sur un cube elle vaut 79 % du rayon
 * circonscrit, sur un icosaèdre 90 %. *Une constante unique aurait été fausse
 * pour cinq dés sur six.*
 */

/** Ce qu'il faut savoir d'un dé pour l'empêcher d'en croiser un autre. */
export interface CorpsDeDe {
    position: THREE.Vector3;
    vitesse: THREE.Vector3;
    /** Le rayon de la sphère qui l'approche. */
    rayonDeCollision: number;
}

/**
 * Combien de l'interpénétration est corrigée à chaque passe.
 *
 * ⚠️ Pas 1 : corriger tout d'un coup fait sauter les dés d'une pile serrée. En
 * corrigeant un peu à chaque image, l'amas se détend au lieu d'exploser.
 */
export const CORRECTION_PAR_PASSE = 0.6;

/** Ce qu'il reste de vitesse après un choc entre deux dés. */
export const RESTITUTION = 0.35;

/**
 * Sépare tous les dés qui se chevauchent, et rend le nombre de chocs traités.
 *
 * ⛔ **Le cas qui casse tout si on l'oublie** : deux dés exactement au même point.
 * `normalize()` sur un vecteur nul rend un vecteur nul, donc *aucune séparation
 * — et les deux dés restent imbriqués pour toujours, sans erreur nulle part.*
 * On leur donne alors une direction horizontale arbitraire.
 */
export const separerLesDes = (des: CorpsDeDe[]): number => {
    let chocs = 0;
    const axe = new THREE.Vector3();

    for (let i = 0; i < des.length; i++) {
        for (let j = i + 1; j < des.length; j++) {
            const a = des[i];
            const b = des[j];
            const ecartMini = a.rayonDeCollision + b.rayonDeCollision;

            axe.subVectors(b.position, a.position);
            const distance = axe.length();
            if (distance >= ecartMini) continue;

            chocs++;

            if (distance < 1e-4) {
                /* Deux dés au même point : il faut choisir une direction, sinon
                   ils y restent. L'angle est tiré au sort pour que deux amas ne
                   se défassent pas tous dans le même sens. */
                const angle = Math.random() * Math.PI * 2;
                axe.set(Math.cos(angle), 0, Math.sin(angle));
            } else {
                axe.divideScalar(distance);
            }

            const correction = (ecartMini - distance) * CORRECTION_PAR_PASSE * 0.5;
            a.position.addScaledVector(axe, -correction);
            b.position.addScaledVector(axe, correction);

            /* L'échange de vitesse le long de l'axe du choc : sans lui, les dés
               se repousseraient en glissant l'un sur l'autre sans jamais rebondir. */
            const vitesseRelative = b.vitesse.dot(axe) - a.vitesse.dot(axe);
            if (vitesseRelative < 0) {
                const impulsion = -vitesseRelative * (1 + RESTITUTION) * 0.5;
                a.vitesse.addScaledVector(axe, -impulsion);
                b.vitesse.addScaledVector(axe, impulsion);
            }
        }
    }

    return chocs;
};

/**
 * Où poser les dés au départ, pour qu'aucun ne naisse dans un autre.
 *
 * ⛔ L'ancien placement alignait tout le monde sur une seule rangée, avec un
 * écart qui **rétrécissait** à mesure que les dés étaient nombreux :
 * `Math.min(3, 13 / n)`. À dix dés, l'écart tombait à 1,3 — *moins que la
 * largeur d'un dé.* Ils naissaient donc imbriqués, et la séparation avait à
 * défaire un nœud au lieu d'éviter un contact.
 *
 * ⭐ ***Ce qu'on empêche pendant la chute, il faut d'abord ne pas le créer au
 * départ.*** L'écart est ici un plancher, jamais un plafond : quand la rangée
 * déborde du tapis, on passe à la rangée suivante.
 */
export const placementDuJet = (
    nombre: number,
    ecartMini: number,
    rayonDuTapis: number,
): { x: number; z: number }[] => {
    if (nombre <= 0) return [];

    const maxParRangee = Math.max(1, Math.min(nombre, Math.floor((2 * rayonDuTapis) / ecartMini)));
    const rangees = Math.ceil(nombre / maxParRangee);

    /*
      ⚠️ **Les rangées sont égalisées, et chacune est centrée.** Un simple
      découpage par paquets laisse une dernière rangée d'un seul dé, collée au
      bord gauche — *un jet de six dés aurait l'air d'un jet de cinq plus un
      oublié.*
    */
    const base = Math.floor(nombre / rangees);
    const reste = nombre % rangees;

    const places: { x: number; z: number }[] = [];
    for (let rangee = 0; rangee < rangees; rangee++) {
        const combien = base + (rangee < reste ? 1 : 0);
        for (let colonne = 0; colonne < combien; colonne++) {
            places.push({
                x: (colonne - (combien - 1) / 2) * ecartMini,
                z: (rangee - (rangees - 1) / 2) * ecartMini,
            });
        }
    }
    return places;
};
