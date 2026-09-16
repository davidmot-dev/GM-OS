/**
 * **Trouver un média dans la médiathèque.**
 *
 * David, le 2026-09-16 : *« peux-tu rajouter un moteur de recherche dans le
 * mediahub, j'ai parfois du mal à trouver »*.
 *
 * ⛔ **Il y en avait un.** Il filtrait bien sur le nom, les étiquettes et le
 * type — mais son champ était **invisible** (texte d'invite à 5 % d'opacité,
 * loupe à 10 %), et il cherchait **à la lettre près** :
 *
 * | Ce qu'on tape | Ce que l'ancien trouvait |
 * | --- | --- |
 * | `sirene` | rien, si le fichier s'appelle *sirène* |
 * | `taverne combat` | rien, si le fichier s'appelle *combat taverne* |
 *
 * *Une recherche qui échoue sur un accent ne se lit pas comme une recherche
 * stricte : elle se lit comme une médiathèque qui a perdu le fichier.*
 *
 * ⚠️ **La déaccentuation est réécrite ici pour la dixième fois du dépôt** —
 * `archetypes.ts`, `canevas.ts`, `structureDeCampagne.ts`, `inventaire.ts`,
 * `rechercheDansLeManuel.ts` et cinq autres en portent chacun leur copie. Les
 * réunir est un chantier à part entière ; l'inscrire ici plutôt que de le taire.
 */

/** Minuscules, sans accents, sans espaces de bord. */
export function normaliserPourLaRecherche(texte: string): string {
    return texte
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .trim();
}

/**
 * Les mots d'une recherche, dans n'importe quel ordre.
 *
 * Une requête vide ne rend aucun mot — l'appelant montre alors **tout**, et
 * c'est le comportement attendu : *un champ vide n'est pas un filtre qui ne
 * trouve rien, c'est l'absence de filtre.*
 */
export function motsDeLaRecherche(recherche: string): string[] {
    return normaliserPourLaRecherche(recherche).split(/\s+/).filter(Boolean);
}

export interface MediaCherchable {
    name: string;
    tags: string[];
    type: string;
}

/**
 * Ce média répond-il à la recherche ?
 *
 * **Tous les mots doivent correspondre, chacun n'importe où** — nom, étiquette
 * ou type. C'est ce qui rend `taverne combat` capable de trouver *« combat à la
 * taverne.mp3 »* : on cherche des morceaux de nom dont on se souvient, pas une
 * phrase exacte. *Exiger l'ordre, c'est demander de se rappeler ce qu'on est
 * précisément en train de chercher.*
 */
export function correspondALaRecherche(media: MediaCherchable, recherche: string): boolean {
    const mots = motsDeLaRecherche(recherche);
    if (mots.length === 0) return true;

    const champs = [
        normaliserPourLaRecherche(media.name),
        normaliserPourLaRecherche(media.type),
        ...media.tags.map(normaliserPourLaRecherche),
    ];

    return mots.every(mot => champs.some(champ => champ.includes(mot)));
}
