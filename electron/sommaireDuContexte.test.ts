import { describe, it, expect } from 'vitest';
import { sommaireDuSysteme } from './OllamaService';

/**
 * **Ce que ces tests protègent : le journal doit pouvoir répondre.**
 *
 * Le 2026-08-22, David : *« l'étape 10 fonctionne, et je ne vois pas le nom de
 * la scène »*. Le journal d'Ollama disait le modèle, les options, la réponse —
 * jamais le contexte. La question est restée indécidable sans relire le code,
 * exactement comme le 2026-08-12 pour la contrainte JSON. *Un fichier se relit
 * après coup, par n'importe qui.*
 */

const sys = (contenu: string) => [
    { role: 'system', content: contenu },
    { role: 'user', content: 'comment se comporte un xenomorphe ?' },
];

describe('le sommaire du contexte', () => {
    it('nomme les sections et dit ce que chacune pèse', () => {
        /**
         * Le poids tranche la question qu'un titre seul laisse ouverte : une
         * section vide et une section pleine portent le même titre.
         */
        const ligne = sommaireDuSysteme(sys(
            '## Campagne: Hadley Hope\n### Scène en cours\nAppel au secours\n### Indices Révélés\n',
        ));

        expect(ligne).toContain('Campagne: Hadley Hope');
        expect(ligne).toContain('Scène en cours(16)');
        expect(ligne).toContain('Indices Révélés(0)');
    });

    it('l\'absence d\'une section se voit, et c\'était toute la question', () => {
        const ligne = sommaireDuSysteme(sys('## Campagne: Hadley Hope\n### Groupe (PJ)\n- test\n'));

        expect(ligne).not.toContain('Scène');
    });

    it('le contexte RAG n\'inonde pas la ligne', () => {
        // Une fiche de règles apporte ses propres titres. Au-delà d'une
        // vingtaine, la ligne cesse d'être lisible d'un coup d'oeil — ce qui
        // est tout ce qu'on lui demande.
        const ligne = sommaireDuSysteme(sys(
            Array.from({ length: 30 }, (_, i) => `## Titre ${i}\ncorps`).join('\n'),
        ));

        expect(ligne).toContain('+10');
        expect(ligne).not.toContain('Titre 25');
    });

    it('sans message système, on le dit plutôt que de rendre une ligne vide', () => {
        // Un sommaire vide se lirait comme « aucune section », qui est un tout
        // autre diagnostic.
        expect(sommaireDuSysteme([{ role: 'user', content: 'bonjour' }]))
            .toBe('aucun message systeme');
    });

    it('un prompt sans aucun titre reste décrit par sa taille', () => {
        const ligne = sommaireDuSysteme(sys('Tu es un assistant IA expert.'));

        expect(ligne).toContain('29 car.');
        expect(ligne).toContain('sans titre');
    });
});
