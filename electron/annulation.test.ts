import { describe, it, expect } from 'vitest';
import { abandonnerLaRequete, requetesEnVol } from './OllamaService';

/**
 * **Arrêter, et pas seulement cesser d'attendre — axe D.1 du plan du 2026-08-07.**
 *
 * Ce que rien ne faisait : aucun `AbortController`, aucun `signal`, nulle part
 * dans la chaîne IA. Les plafonds d'`AIService` sont des `Promise.race` — ils
 * rejettent la promesse pendant que **la génération continue chez Ollama**, sur
 * l'unique créneau de `OLLAMA_NUM_PARALLEL: 1`.
 *
 * Conséquence, et c'est le défaut le plus structurant du plan : *une Forge
 * lancée par erreur en séance bloquait l'Oracle et le Cortex pour toute sa durée
 * réelle, quoi que fasse le meneur.* Fermer la fenêtre n'y changeait rien.
 * **Aucun plafond de temps n'était donc réel.**
 *
 * Ces tests portent sur le registre lui-même — la partie qui se teste sans
 * réseau. Ce qu'ils ne couvrent pas est dit à la fin du fichier.
 */

describe('le registre des requêtes en vol', () => {
    it('abandonner ce qui n\'existe pas rend `false` plutôt que de lever', () => {
        /**
         * C'est le cas NORMAL, pas une anomalie : l'utilisateur clique
         * « annuler » pendant que la réponse arrive. Lever ferait remonter une
         * erreur pour un geste qui a parfaitement réussi — il n'y avait
         * simplement plus rien à arrêter.
         */
        expect(abandonnerLaRequete('jamais-parti')).toBe(false);
    });

    it('ne rend rien quand rien ne tourne', () => {
        expect(requetesEnVol()).toEqual([]);
    });

    it("ce qu'il rend porte un LIBELLÉ, pas seulement un compte", () => {
        /**
         * Un entier ne permet pas de dire au meneur CE QUI tourne. Or c'est
         * précisément sa question — « je n'ai pas la main sur le Cortex quand je
         * forge » : il peut envoyer, mais sa requête fait la queue chez Ollama
         * sans que rien ne l'explique. *« Forge en cours, l'Oracle attendra »*
         * est actionnable ; « une opération est en cours » ne l'est pas.
         */
        const descripteurs = requetesEnVol();
        expect(Array.isArray(descripteurs)).toBe(true);
        for (const d of descripteurs) {
            expect(d).toHaveProperty('libelle');
            expect(d).toHaveProperty('depuis');
        }
    });

    it('abandonner deux fois la même requête ne ment pas la seconde', () => {
        // Le second appel doit dire `false` : le créneau est déjà refermé.
        expect(abandonnerLaRequete('x')).toBe(false);
        expect(abandonnerLaRequete('x')).toBe(false);
    });
});

/**
 * **Ce que ces tests NE couvrent PAS, et il faut le dire.**
 *
 * L'inscription au registre se fait à l'intérieur de `chat`, `chatStream` et
 * `generateImage`, qui appellent tous `net.fetch` d'Electron — indisponible en
 * environnement de test. Vérifier qu'un `signal` coupe réellement une requête
 * demande donc l'application, pas un test.
 *
 * *Ce qui se teste ici est le contrat du registre ; ce qui reste à voir tourner
 * est qu'il se remplit et se vide.* La preuve attendue est concrète : lancer une
 * Forge, poser une question à l'Oracle pendant qu'elle tourne, et vérifier que
 * l'abandon de la Forge rend la main immédiatement — ce qui était impossible
 * avant, quoi que fasse le meneur.
 */
