import { describe, it, expect } from 'vitest';
import { caractereQuiBoucle, OPTIONS_PAR_DEFAUT } from './OllamaService';

/**
 * Ce que ces tests protègent : **une réponse qui dégénère se nomme**.
 *
 * Mesuré le 2026-08-17 sur la Forge de campagne de David. Le groupe `relations`
 * s'est terminé par `{"source":"Ser111111111111…` : trois mille caractères de
 * JSON valide, puis le même caractère répété jusqu'à l'arrêt. Il n'a vu qu'un
 * « Expected ',' or ']' at position 3430 » — le parseur accusé à la place de la
 * cause, et une heure perdue à chercher au mauvais endroit.
 *
 * **Ce sont nos propres options qui l'ouvrent** : `temperature: 0` et
 * `top_k: 1` font un décodage strictement glouton, et `repeat_penalty: 1` avec
 * `repeat_last_n: 0` désactivent ce qui l'en sortirait. La désactivation est
 * volontaire — en JSON les tokens se répètent légitimement — mais elle a un
 * prix. *Le remède d'un défaut ouvre le suivant.*
 */
describe('la dégénérescence se nomme', () => {
    it('attrape la queue de répétition qui a cassé « relations »', () => {
        const reel = '{"relations":[{"source":"Seraphine","cible":"The Aurelian"},{"source":"Ser'
            + '1'.repeat(33);
        expect(caractereQuiBoucle(reel)).toBe('1');
    });

    it('tolère les répétitions courtes, qui sont légitimes', () => {
        // Une ligne de tirets dans une description, des zéros dans un
        // identifiant : un JSON honnête en contient.
        expect(caractereQuiBoucle('{"a":"-----------"}')).toBeNull();
        expect(caractereQuiBoucle('{"id":"00000000"}')).toBeNull();
    });

    it('ne regarde que la FIN — au milieu, c\'est une citation', () => {
        const auMilieu = `{"a":"${'x'.repeat(50)}","b":"suite normale"}`;
        expect(caractereQuiBoucle(auMilieu)).toBeNull();
    });

    it('ignore les blancs finaux', () => {
        expect(caractereQuiBoucle(`{"a":"${'z'.repeat(40)}   \n`)).toBe('z');
    });

    it('une réponse saine ne déclenche rien', () => {
        expect(caractereQuiBoucle('{"lieux":[{"name":"Sea Wall Shantytown"}]}')).toBeNull();
        expect(caractereQuiBoucle('')).toBeNull();
    });
});

describe('le plafond par défaut reste borné', () => {
    it('n\'est pas relevé globalement — il l\'est par appelant', () => {
        /*
          Un plafond haut n'est pas gratuit : il autorise l'emballement que ce
          garde-fou existe pour borner, et à 7,7 tokens/s une fuite se paie en
          minutes. Seule la Forge de campagne, qui rend des LISTES, demande plus.
        */
        expect(OPTIONS_PAR_DEFAUT.num_predict).toBe(2048);
    });
});
