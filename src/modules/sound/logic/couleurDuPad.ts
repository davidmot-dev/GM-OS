/**
 * **La couleur d'une pastille de son — et pourquoi elle n'a jamais rien coloré.**
 *
 * ⛔ Chaque pastille naissait avec `color: 'var(--electric-violet)'`. Cette
 * variable CSS **n'est définie nulle part dans le dépôt** : une seule occurrence
 * dans tout le projet, celle qui l'emploie. Les **cinq** usages de la couleur
 * pointaient donc vers rien —
 *
 * | Où | Ce que ça donnait |
 * | --- | --- |
 * | Bordure de la pastille active | valeur invalide : la classe reprenait la main |
 * | Fond teinté (`${color}15`) | `var(--electric-violet)15` — **du CSS qui n'existe dans aucune grammaire** |
 * | Barre de progression | sans couleur |
 * | Halo de la barre | sans couleur |
 * | Dégradé du bas | sans couleur |
 *
 * *Une couleur qui ne s'applique pas ne rend aucune erreur : l'élément garde
 * simplement ce qu'il avait.* Et `setPadColor` existait, implémentée, appelée par
 * personne — donc rien ne pouvait remplacer cette valeur morte. Trouvé le
 * 2026-09-07 par le contrôle des noms sans écrivain ni lecteur.
 */

/**
 * Le violet de l'application — `gm.violet` de la configuration Tailwind, dont le
 * commentaire dit « Music/Sound/Voice OS ». *On reprend la couleur que le projet
 * avait déjà choisie pour ces modules, on n'en invente pas une.*
 */
export const COULEUR_PAD_DEFAUT = '#8b5cf6';

/** Une couleur exploitable en CSS **et** en calcul d'opacité : six chiffres hexadécimaux. */
const HEXADECIMALE = /^#[0-9a-f]{6}$/i;

/**
 * La couleur à peindre pour une pastille.
 *
 * Tout ce qui n'est pas une hexadécimale à six chiffres retombe sur le défaut :
 * cela couvre l'absence de valeur, la variable morte des pastilles d'avant, et
 * une valeur abîmée venue d'une sauvegarde. **Aucune migration n'est nécessaire**
 * — les pastilles existantes gardent leur champ tel quel et s'affichent enfin.
 */
export const couleurDuPad = (couleur?: string): string => {
    const propre = couleur?.trim() ?? '';
    return HEXADECIMALE.test(propre) ? propre : COULEUR_PAD_DEFAUT;
};

/**
 * La même couleur, atténuée — pour le fond d'une pastille qui joue.
 *
 * ⚠️ **C'est ici que vivait la faute la plus discrète.** Le code écrivait
 * `` `${color}15` ``, ce qui n'est valide **que** si `color` est une hexadécimale
 * à six chiffres. Coller deux caractères au bout d'une valeur CSS est une
 * opération qui ne se vérifie pas toute seule : *une concaténation suppose une
 * forme, et rien ne l'impose.* On passe donc par `couleurDuPad`, qui la garantit.
 *
 * @param alpha Deux chiffres hexadécimaux, `'15'` valant environ 8 %.
 */
export const couleurDuPadAttenuee = (couleur: string | undefined, alpha: string): string =>
    `${couleurDuPad(couleur)}${alpha}`;
