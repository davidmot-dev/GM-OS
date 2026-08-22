import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { chargerIndex, chercherDansLIndex } from './bookIndex';
import { motsDeLaQuestion } from './motsDeLaQuestion';

/**
 * Ce que ces tests protègent : **une référence au livre est vérifiable, ou elle
 * ne s'affiche pas.**
 *
 * Étage 2 de l'axe M — *« je n'ai pas, mais c'est là »*. Le renvoi n'est utile
 * que si le meneur peut y aller : *une référence fausse coûte plus cher qu'une
 * référence absente, parce qu'on s'y rend.*
 *
 * Le défaut, mesuré le 2026-08-22 sur les 544 entrées de Rêves de Dragons. Deux
 * causes, et la même racine — **deux dictionnaires de mots vides qui ne se
 * ressemblaient pas** :
 *
 * - la comparaison se faisait par SOUS-CHAÎNE, donc `fonctionne` attrapait
 *   « Fonctionnement » et renvoyait p.30 pour une question sur une serrure ;
 * - `règles` comptait comme un mot porteur ici et pas dans `ficheQuiRepond`,
 *   donc « Résumé des règles de combat p.138 » répondait au piratage
 *   informatique.
 */

const DOCS = path.join(__dirname, '..', 'docs');
const livre = chargerIndex(DOCS, 'reves de dragons');
const cherche = (q: string) => chercherDansLIndex(livre, q);

describe('l’index du livre est bien celui de Rêves de Dragons', () => {
    it('porte ses centaines d’entrées', () => {
        expect(livre.entrees.length).toBeGreaterThan(500);
    });
});

describe('ce que le livre ne doit PAS dire', () => {
    /**
     * **Les quatre renvois faux mesurés ce jour-là.** Chacun envoyait le meneur
     * à une page où il n'aurait rien trouvé.
     */
    it.each([
        ['Comment fonctionne le crochetage de serrure ?', 'Fonctionnement p.30'],
        ['Comment fonctionne la téléportation quantique ?', 'Fonctionnement p.30'],
        ['Quelles sont les règles de piratage informatique ?', 'Résumé des règles de combat'],
        ['Comment marchandent les PNJ ?', 'un titre au hasard'],
    ])('se tait sur « %s » (rendait « %s »)', (question) => {
        expect(cherche(question)).toEqual([]);
    });

    it('écarte le verbe interrogatif du côté question', () => {
        expect(motsDeLaQuestion('Fonctionnement')).toEqual(['fonctionnement']);
        expect(motsDeLaQuestion('Comment fonctionne le crochetage de serrure ?'))
            .toEqual(['crochetage', 'serrure']);
    });

    /**
     * **La sous-chaîne, mesurée séparément — et le cas est éloquent pour ce
     * jeu-là.**
     *
     * `titre.includes(mot)` faisait attraper n'importe quel mot CONTENANT le
     * mot cherché. Sur un jeu qui s'appelle *Rêves de Dragons*, une question sur
     * le rêve renvoyait donc vers **« Acrève »** et **« Blurêve »**, où `reve`
     * n'est qu'une syllabe.
     *
     * *Ce test existe parce que la vérification dans les deux sens a montré que
     * les autres ne le couvraient pas* : remettre la sous-chaîne les laissait
     * tous passer, le dictionnaire commun suffisant à les protéger. Un correctif
     * qu'aucun test ne tient n'est pas un correctif.
     */
    it('ne renvoie pas « Acrève » à qui demande le rêve', () => {
        const titres = cherche('Comment fonctionne le rêve ?').map(t => t.titre);
        expect(titres).not.toContain('Acrève');
        expect(titres).not.toContain('Blurêve');
    });

});

describe('ce que le livre doit dire', () => {
    /** Un renvoi juste reste un renvoi juste : on n'a pas éteint l'étage 2. */
    it.each([
        ['Peut-on parer une attaque avec sa monture ?', 'Monture'],
        ['Quelles sont les règles de navigation en mer ?', 'Navigation'],
        ['Quel est le prix d’une épée ?', 'Les épées'],
    ])('renvoie « %s » vers « %s »', (question, titreAttendu) => {
        const trouvailles = cherche(question);
        expect(trouvailles.length).toBeGreaterThan(0);
        expect(trouvailles[0].titre).toBe(titreAttendu);
        expect(trouvailles[0].page).toBeGreaterThan(0);
    });

    /**
     * **Et le bruit d'accompagnement a disparu.** « Navigation » ramenait aussi
     * *Résumé des règles de combat*, qui n'a rien à voir : trois renvois dont un
     * faux se lisent comme trois renvois.
     */
    it('ne mêle plus de titre étranger aux bons renvois', () => {
        const titres = cherche('Quelles sont les règles de navigation en mer ?').map(t => t.titre);
        expect(titres.every(t => t.toLowerCase().includes('navigation')), titres.join(' | ')).toBe(true);
    });
});
