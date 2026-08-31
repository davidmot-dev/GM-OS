import { horodatageValide } from '../../../store/useClockStore';

/**
 * **Ce que les champs de saisie manuelle affichent — et qui ne lève jamais.**
 *
 * *Le défaut signalé par David le 2026-08-31, à l'écran* :
 * `RangeError: Invalid time value`, et tout le tableau de bord des horloges
 * emporté avec.
 *
 * La cause était un `NaN` dans le magasin, et elle est corrigée à la source —
 * `useClockStore` refuse désormais un horodatage qui n'en est pas un. **Ces
 * fonctions sont la seconde ceinture**, et elles ne font pas double emploi : ce
 * magasin a d'autres écrivains que ce formulaire — la synchro entre fenêtres,
 * un import Nexus, un calendrier fantastique mal formé. *Un écran qui meurt
 * emporte tout ce qu'il montrait ; il vaut mieux qu'il montre une valeur de
 * repli et reste debout.*
 *
 * **Pourquoi `toISOString` et pas les autres.** C'est la seule des trois
 * conversions employées ici qui **lève** sur une date invalide :
 *
 * | | date invalide |
 * | --- | --- |
 * | `toISOString()` | ⛔ `RangeError` |
 * | `toTimeString()` | `"Invalid Date"` |
 * | `getHours()` | `NaN` |
 *
 * *Deux de ces trois défauts se seraient vus à l'écran sans rien casser ; le
 * troisième a tué le composant.* C'est pour cela que le champ de date tombait
 * et pas celui de l'heure — alors que les deux lisaient la même valeur fausse.
 */

/** L'horodatage à afficher : celui qu'on a, ou maintenant s'il est inutilisable. */
function utilisable(horodatage: number): Date {
    return new Date(horodatageValide(horodatage) ? horodatage : Date.now());
}

/** `AAAA-MM-JJ`, ce qu'attend un `<input type="date">`. */
export function dateDuChamp(horodatage: number): string {
    /*
      **En heure locale, pas en UTC.** `toISOString()` convertit vers UTC : une
      soirée de jeu à 23 h en France s'y affiche au lendemain. Le champ montrait
      donc parfois une date que le meneur n'avait pas posée — un défaut discret,
      qui vivait à côté de celui qui plantait.
    */
    const quand = utilisable(horodatage);
    const mois = `${quand.getMonth() + 1}`.padStart(2, '0');
    const jour = `${quand.getDate()}`.padStart(2, '0');
    return `${quand.getFullYear()}-${mois}-${jour}`;
}

/** `HH:MM:SS`, ce qu'attend un `<input type="time">` avec `step="1"`. */
export function heureDuChamp(horodatage: number): string {
    const quand = utilisable(horodatage);
    return [quand.getHours(), quand.getMinutes(), quand.getSeconds()]
        .map(n => `${n}`.padStart(2, '0'))
        .join(':');
}
