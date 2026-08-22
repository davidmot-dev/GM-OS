import { describe, it, expect } from 'vitest';
import { resoudreCorpus } from './corpusSysteme';
import { selectContext, type IndexedFile } from './ragSelection';

/**
 * Ce que ces tests protègent : **une campagne forgée trouve son corpus.**
 *
 * Le défaut, relevé en réel le 2026-08-22 après trois essais infructueux de
 * David. Sa campagne portait `system: 'custom-1777730495114'` — la Forge nomme
 * ses pilotes de l'horodatage de leur naissance — et le moteur cherchait donc un
 * dossier `docs/systems/custom-1777730495114`. Il retombait sur le nom affiché,
 * qu'il allait chercher **dans les gabarits de fiche**, où un pilote forgé n'a
 * rien à faire.
 *
 * **Aucune fiche du corpus n'a jamais été retenue pour une campagne forgée**, et
 * rien ne le signalait : l'Oracle répondait de sa propre mémoire, avec aplomb.
 * *Une recherche qui n'atteint rien produit tout de même une réponse confiante.*
 */

/** Le pilote de David, tel qu'il est enregistré sur son disque. */
const PILOTE_FORGE = {
    systemId: 'custom-1777730495114',
    systemName: 'Rêve de Dragon',
    ragPath: 'systems/reves de dragons/rules',
};

const DOSSIERS = ['alien', 'reves de dragons', 'dune', '2d20', 'star-trek'];

describe('un pilote forgé sait où vit son corpus', () => {
    it('résout la racine depuis le chemin hérité', () => {
        const corpus = resoudreCorpus({ ...PILOTE_FORGE, dossiersConnus: DOSSIERS });

        expect(corpus.racine).toBe('systems/reves de dragons');
        expect(corpus.raison).toBe('chemin-rag-herite');
    });

    /**
     * **Le singulier contre le pluriel**, et c'est pourquoi le nom affiché ne
     * suffisait pas : « Rêve de Dragon » donne `reve-de-dragon`, le dossier est
     * `reves-de-dragons`, et `memeIdentite` ne rapproche que des identifiants
     * égaux ou préfixés d'un tiret.
     */
    it('ne pouvait pas y arriver par le nom affiché seul', () => {
        const parLeNom = resoudreCorpus({
            systemId: PILOTE_FORGE.systemId,
            systemName: PILOTE_FORGE.systemName,
            dossiersConnus: DOSSIERS,
        });

        expect(parLeNom.racine).not.toBe('systems/reves de dragons');
    });

    /**
     * Le bout de la chaîne, et le seul qui compte pour le meneur : la fiche
     * est-elle retenue ?
     */
    it('et la sélection retient alors la fiche', () => {
        const corpus = resoudreCorpus({ ...PILOTE_FORGE, dossiersConnus: DOSSIERS });
        const fichiers: IndexedFile[] = [
            {
                path: 'systems/reves de dragons/rules/ethylisme-jet-degres-et-malus.md',
                sujet: 'Éthylisme (jet, degrés et malus)',
                content: 'Le personnage jette sous sa Constitution.',
            },
            { path: 'systems/alien/rules/stress.md', sujet: 'Stress', content: 'Autre jeu.' },
        ];

        const choix = selectContext(fichiers, {
            systemId: PILOTE_FORGE.systemId,
            campaignName: 'A la claire fontaine',
            systemPath: corpus.racine,
            query: "règles d'éthylisme",
        });

        const retenue = choix.retenus.find(r => r.path.includes('ethylisme'));
        expect(retenue, 'la fiche du bon corpus est retenue').toBeDefined();
        expect(retenue?.provenance, 'et elle est reconnue comme une FICHE').toBe('fiche');
        expect(choix.context).toContain('Constitution');
    });

    it('sans le chemin résolu, elle ne retient rien', () => {
        const fichiers: IndexedFile[] = [{
            path: 'systems/reves de dragons/rules/ethylisme-jet-degres-et-malus.md',
            sujet: 'Éthylisme (jet, degrés et malus)',
            content: 'Le personnage jette sous sa Constitution.',
        }];

        const choix = selectContext(fichiers, {
            systemId: PILOTE_FORGE.systemId,
            campaignName: 'A la claire fontaine',
            query: "règles d'éthylisme",
        });

        expect(choix.retenus, 'le défaut d’origine, reproduit').toEqual([]);
    });
});
