/**
 * **Ce qu'un moment a demandé, et ce qui a réellement eu lieu.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ L'INCIDENT DU 2026-09-12 : UNE SÉQUENCE À MOITIÉ JOUÉE, ET AUCUNE TRACE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David, en séance : *« j'ai lancé une scène qui avait une séquence de
 * Storyboard liée, cette séquence ne s'est pas bien exécutée — pas d'image
 * projetée, les lumières ne se sont pas allumées, l'ambiance s'arrête »*.
 *
 * **Le journal de l'application ne porte rien.** Ni `error`, ni `warn` : la
 * dernière ligne de ce niveau date du 5 septembre. L'incident est passé
 * intégralement sous silence, et il n'est donc pas diagnosticable après coup.
 *
 * Deux causes à ce silence, et elles se cumulent :
 *
 * 1. **`window.useToastStore` n'est assigné nulle part.** Sept appels le lisent
 *    — les trois moteurs audio et le storyboard — tous gardés par un
 *    `if (gmToast)` qui ne passe jamais. *« Fichier d'ambiance introuvable »*
 *    était prêt, et n'est jamais sorti.
 * 2. **Chaque effet est un `if` silencieux.** `if (moment.musicPadId &&
 *    gWindow.useMusicStore)` : si le magasin n'est pas là, l'effet est sauté
 *    **sans un mot**. *Un `&&` qui protège est un `&&` qui cache.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE MODULE FAIT, ET CE QU'IL NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il ne répare aucun effet : **il les rend observables.** Chaque moteur déclare
 * ce qu'il a fait de ce qu'on lui demandait, et le moment rend un rapport.
 *
 * ⭐ **La distinction qui compte est entre « introuvable » et « module
 * absent ».** La première dit *ta donnée a bougé* (un pad supprimé, un média
 * effacé) ; la seconde dit *le code n'était pas là*. Les deux produisent le même
 * silence à la table, et demandent des réparations opposées — *un diagnostic qui
 * ne les sépare pas ne sert à rien.*
 *
 * ⚠️ **Ce qui n'est pas demandé n'est pas un manque.** Un moment sans musique
 * n'a pas « raté sa musique » : il n'en voulait pas. Confondre les deux
 * remplirait le journal de faux négatifs, et *un avertissement qui crie tout le
 * temps ne se lit plus.*
 */

export type SortDUnEffet =
    /** Demandé, et le moteur l'a fait. */
    | 'joue'
    /** Demandé, mais la donnée n'existe plus — pad supprimé, média effacé. */
    | 'introuvable'
    /** Demandé, mais le module n'a pas répondu : il n'était pas chargé. */
    | 'module-absent'
    /**
     * **Une scène lumineuse liée à un son a été écartée** — 2026-09-22.
     *
     * ⛔ Le défaut trouvé par David : *« quand je joue la lumière Intro de
     * Light-OS et dans une séquence de storyboard, l'effet n'est pas le même »*.
     * Le moment posait bien sa scène, puis ses sons appliquaient la leur
     * par-dessus. La règle qu'il a tranchée : **ce que le meneur a déclaré dans
     * le moment gagne sur ce qu'un enchaînement propose.**
     *
     * On l'inscrit au rapport plutôt que de le taire : *un réglage ignoré sans
     * un mot se lit comme un réglage qui ne marche pas*, et le meneur
     * chercherait pourquoi son bruitage n'a plus d'effet lumineux.
     */
    | 'liee-ecartee'
    /**
     * Demandé, le module a répondu — **mais il n'y avait rien à jouer.**
     *
     * ⛔ Le cas d'Ambient-OS, trouvé le 2026-09-20 : une *scène* ne charge
     * aucun son, elle pose des volumes sur les huit pistes en place. Appliquée
     * alors qu'aucune piste ne porte d'adresse, elle réussit **parfaitement**
     * et ne produit aucun son. *Une ambiance qui ne sort pas ressemble à une
     * ambiance discrète* — et c'est précisément ce qu'on ne peut pas laisser
     * passer sans le dire.
     */
    | 'sans-matiere'
    /** Le moment ne demandait rien de ce côté-là. */
    | 'non-demande';

export interface EffetDuMoment {
    /** Le nom que le meneur reconnaît : « Musique », « Lumières », « Image »… */
    nom: string;
    sort: SortDUnEffet;
    /** L'identifiant cherché, quand il aide à retrouver la donnée disparue. */
    cherche?: string;
}

export interface RapportDuMoment {
    moment: string;
    effets: readonly EffetDuMoment[];
}

/** Ce qui a été demandé et n'a pas eu lieu. */
export function effetsManques(rapport: RapportDuMoment): EffetDuMoment[] {
    return rapport.effets.filter(
        e => e.sort === 'introuvable' || e.sort === 'module-absent' || e.sort === 'sans-matiere',
    );
}

/** Ce que le moment a réellement posé sur la table. */
export function effetsJoues(rapport: RapportDuMoment): EffetDuMoment[] {
    return rapport.effets.filter(e => e.sort === 'joue');
}

/**
 * Le résumé à dire au meneur et à écrire au journal — ou `null` si tout ce qui
 * était demandé a eu lieu.
 *
 * ⛔ **Il nomme les effets, jamais un compte.** *« 3 effets ont échoué »* ne dit
 * pas quoi regarder ; *« Image : introuvable »* envoie directement à la
 * médiathèque. C'est la règle déjà posée pour le démarrage amputé.
 *
 * ⚠️ **Et il distingue les deux causes dans le texte même**, parce que le meneur
 * n'ouvrira pas le journal pour ça : « introuvable » lui dit de chercher sa
 * donnée, « module non chargé » lui dit que ce n'est pas de sa faute.
 */
export function resumeDuMoment(rapport: RapportDuMoment): string | null {
    const manques = effetsManques(rapport);
    if (manques.length === 0) return null;

    /*
      ⚠️ **Trois causes, trois gestes** — et le texte doit les séparer, parce
      que le meneur n'ouvrira pas le journal pour ça : « introuvable » lui dit
      de chercher sa donnée, « module non chargé » que ce n'est pas de sa faute,
      « aucun son chargé » qu'il lui manque un **thème** avant sa scène.
    */
    const CAUSES: Record<string, string> = {
        introuvable: 'introuvable',
        'module-absent': 'module non chargé',
        'sans-matiere': 'aucun son chargé',
    };

    const dits = manques.map(e => {
        const cause = CAUSES[e.sort] ?? e.sort;
        return e.cherche ? `${e.nom} : ${cause} (${e.cherche})` : `${e.nom} : ${cause}`;
    });

    return `Moment « ${rapport.moment} » incomplet — ${dits.join(', ')}`;
}

/**
 * La ligne de journal, **toujours rendue**, même quand tout s'est bien passé.
 *
 * ⚠️ *Une trace qui n'existe que les mauvais jours ne permet pas de comparer.*
 * Quand la séquence suivante rate, on veut pouvoir regarder ce qu'a fait la
 * précédente — et un silence ne se distingue pas d'une absence de moteur.
 */
export function traceDuMoment(rapport: RapportDuMoment): string {
    const parts = rapport.effets
        .filter(e => e.sort !== 'non-demande')
        .map(e => `${e.nom}=${e.sort}`);

    return parts.length === 0
        ? `Moment « ${rapport.moment} » : aucun effet déclaré.`
        : `Moment « ${rapport.moment} » : ${parts.join(' ')}`;
}
