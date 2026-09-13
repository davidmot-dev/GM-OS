import { useEffect, useRef } from 'react';
import { empilerLaSurcouche, depilerLaSurcouche } from '../utils/surcouchesOuvertes';

/**
 * **Échap ferme cette surcouche — et lui donne la main sur le clavier.**
 *
 * Le geste attendu partout dans GM-OS depuis le 2026-09-12, et qui manquait à
 * une trentaine d'écrans. Le pourquoi, le comptage et les deux faces du défaut
 * vivent dans `surcouchesOuvertes.ts` ; ici, la règle d'emploi.
 *
 * ```tsx
 * useFermetureParEchap(estOuverte, onFermer, 'Médiathèque');
 * ```
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, EN UNE PHRASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ **Échap fait ce que fait le bouton de fermeture de l'écran — jamais plus.**
 *
 * C'est la règle qui décide qui prend ce crochet et qui ne le prend pas.
 * L'atelier de brainstorm de la Forge en est exclu pour cette raison : sa croix
 * **réinitialise** la série — soixante-douze secondes d'inventaire et une
 * demi-heure de fiches en revue, sans confirmation. *Une touche frappée par
 * réflexe ne doit pas pouvoir détruire une demi-heure de travail.*
 *
 * Pour un `confirm`, c'est donc **la voie d'annulation**, jamais la voie de
 * confirmation : Échap n'exécute rien.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ **Une édition en ligne qui écoute Échap sur son champ doit arrêter la
 * propagation.** Sans ça, une frappe annule la saisie **et** referme l'écran
 * derrière — le registre dit pourquoi la règle est dans ce sens-là.
 *
 * ⚠️ **Le rappel est lu dans une référence, et l'inscription ne bouge pas.**
 * Un `onFermer` reconstruit à chaque rendu — le cas normal d'une fonction
 * fléchée passée en `prop` — réinscrirait la surcouche à chaque fois, et elle
 * repasserait **au sommet** de la pile devant ses propres enfants. *Une pile
 * qui se réordonne au rendu ne dit plus qui est au-dessus* : le meneur fermerait
 * la médiathèque en voulant refermer l'image qu'elle affiche.
 */
export function useFermetureParEchap(
    actif: boolean,
    onFermer: () => void,
    nom: string,
): void {
    const rappel = useRef(onFermer);
    rappel.current = onFermer;

    useEffect(() => {
        if (!actif) return;

        const jeton = Symbol(nom);
        empilerLaSurcouche({ jeton, nom, fermer: () => rappel.current() });
        return () => depilerLaSurcouche(jeton);
    }, [actif, nom]);
}
