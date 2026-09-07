import type { LightScene } from '../useLightStore';

/**
 * **La couleur que porte une tuile qui n'a jamais été personnalisée.**
 *
 * C'est celle que `createDefaultScenes` pose sur les dix-huit — `slate-700`.
 * Elle n'a jamais voulu dire « peins-moi en gris ardoise » : elle voulait dire
 * **« personne n'a choisi »**. Tant que rien ne permettait d'en changer, la
 * distinction n'existait pas ; elle est devenue nécessaire le jour où l'éditeur
 * de tuile est arrivé.
 */
export const COULEUR_NEUTRE = '#334155';

/**
 * **La teinte à peindre, ou `null` si la tuile n'en a pas.**
 *
 * ⛔ **Sans ce filtre, la couleur par défaut était traitée comme un choix.** Le
 * fond des tuiles est `--app-surface` = `#0f172a` ; peindre `#334155` dessus
 * donne un rapport de contraste d'environ 1,6 — *sous le seuil où l'œil
 * distingue une forme*. Les cinq repères de couleur d'une tuile s'en trouvaient
 * abîmés, et quatre étaient carrément perdus :
 *
 * | Repère | Ce qu'il donnait |
 * | --- | --- |
 * | Bordure de la scène active | **écrasait la classe `border-accent`** par un gris sombre : activer une tuile la rendait *moins* visible |
 * | Halo de la scène active | invisible |
 * | Dégradé de la scène active | invisible |
 * | Icône de la tuile active | presque noire sur fond noir |
 * | Étoile ✨ « cette scène a un effet » | **invisible pour tout le monde, depuis toujours** — le seul repère permanent du lot |
 *
 * *Un défaut qui vaut « rien n'est choisi » ne doit jamais traverser la même
 * porte qu'une valeur choisie.* Quand cette fonction rend `null`, l'appelant
 * laisse jouer ses classes CSS — c'est-à-dire l'apparence d'avant l'éditeur, à
 * l'identique.
 */
export const couleurDeLaTuile = (scene: Pick<LightScene, 'color'>): string | null => {
    const couleur = scene.color?.trim();
    if (!couleur) return null;
    if (couleur.toLowerCase() === COULEUR_NEUTRE) return null;
    return couleur;
};
