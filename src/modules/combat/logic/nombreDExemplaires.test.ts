import { describe, it, expect } from 'vitest';
import {
    NOMBRE_MAX, NOMBRE_MIN, nombreApresChangementDeRang, nombreSaisi, reprendreLaSuggestion,
} from './nombreDExemplaires';
import { rangParId } from './archetypes';

/**
 * **Le défaut du 2026-09-03, et l'ordre des gestes qui le cachait.**
 *
 * David demande un tireur, il en reçoit deux. Le sélecteur de rang réécrivait le
 * nombre qu'il venait de saisir.
 *
 * ⛔ **Pourquoi mes tests précédents ne pouvaient pas le voir** : ils portaient
 * sur le magasin de combat — « quatre demandés, quatre posés » — et le magasin
 * faisait son travail. Le défaut était dans **l'état de l'écran**, une couche
 * au-dessus, que rien n'éprouvait. *Un test qui vise la mauvaise couche est vert
 * pour de bonnes raisons et laisse quand même passer le défaut.* D'où cette
 * règle, sortie du composant pour être mesurable.
 */

describe('le nombre d’exemplaires', () => {
    it('suit le rang tant que le meneur n’y a pas touché', () => {
        const depart = { nombre: 4, choisiParLeMeneur: false };
        const apres = nombreApresChangementDeRang(depart, 'boss');
        expect(apres.nombre).toBe(rangParId('boss').nombreSuggere);
    });

    it('⭐ ne touche PLUS au nombre dès que le meneur l’a saisi', () => {
        /*
          Le cas exact de la capture : 1 saisi, puis « Aguerri » choisi. Avant,
          le champ repassait à 2 en silence — et deux tireurs arrivaient.
        */
        const choisi = nombreSaisi(1);
        const apres = nombreApresChangementDeRang(choisi, 'aguerri');
        expect(apres.nombre).toBe(1);
        expect(apres.choisiParLeMeneur).toBe(true);
    });

    it('⭐ tient quel que soit l’ordre des gestes', () => {
        /*
          Le défaut ne se voyait qu'une fois sur deux : rang puis nombre donnait
          le bon résultat, nombre puis rang non. Les deux chemins doivent
          désormais aboutir au même endroit.
        */
        const rangPuisNombre = nombreSaisi(1);
        const nombrePuisRang = nombreApresChangementDeRang(nombreSaisi(1), 'aguerri');
        expect(nombrePuisRang.nombre).toBe(rangPuisNombre.nombre);
    });

    it('rend la main quand on reprend explicitement la suggestion', () => {
        const apres = reprendreLaSuggestion('pietaille');
        expect(apres.nombre).toBe(rangParId('pietaille').nombreSuggere);
        expect(apres.choisiParLeMeneur).toBe(false);
    });

    it('borne la saisie sans jamais rendre zéro ni une horde', () => {
        expect(nombreSaisi(0).nombre).toBe(NOMBRE_MIN);
        expect(nombreSaisi(-3).nombre).toBe(NOMBRE_MIN);
        expect(nombreSaisi(999).nombre).toBe(NOMBRE_MAX);
        expect(nombreSaisi(3.6).nombre).toBe(4);
    });

    it('survit à un champ vidé, plutôt que de rendre NaN', () => {
        /* `parseInt('')` rend NaN, et un `for` sur NaN ne fabrique rien du tout. */
        expect(nombreSaisi(NaN).nombre).toBe(NOMBRE_MIN);
    });
});
