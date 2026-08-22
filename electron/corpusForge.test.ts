import { describe, it, expect } from 'vitest';
import { resoudreCorpus } from './corpusSysteme';
import { selectContext, type IndexedFile } from './ragSelection';
import fs from 'node:fs';
import path from 'node:path';
import { laFicheRepondSeule } from '../src/modules/ai/lacunes/ficheQuiRepond';
import { atteinteDeLaRecherche, estUneLacune } from '../src/modules/ai/lacunes/atteinteDeLaRecherche';

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

/**
 * **Le dernier maillon : la fiche repond-elle SEULE ?**
 *
 * Le corpus resolu et la fiche retenue ne suffisent pas a voir « Tire de la
 * fiche » : il faut encore que le `sujet:` recouvre la question. Ce maillon
 * n'avait aucun test sur du reel — seulement des fixtures ecrites a la main,
 * qui disent ce qu'on a prevu et jamais ce que le corpus contient.
 *
 * On le mesure donc sur **les 21 fiches du disque**, avec des questions telles
 * qu'on les pose a la table.
 */
describe('l’étage 1 sur le corpus réel', () => {
    const DOSSIER = path.join(__dirname, '..', 'docs/systems/reves de dragons/rules');

    const fichesDuDisque = (): IndexedFile[] =>
        fs.readdirSync(DOSSIER).filter(f => f.endsWith('.md')).map(f => {
            const contenu = fs.readFileSync(path.join(DOSSIER, f), 'utf-8');
            const m = /^sujet:\s*"?(.+?)"?\s*$/m.exec(contenu);
            return {
                path: `systems/reves de dragons/rules/${f}`,
                sujet: m ? m[1] : undefined,
                content: contenu,
            };
        });

    /** Ce que la chaine complete rend pour une question : la fiche qui repond seule. */
    const ficheQuiRepond = (question: string): string | undefined => {
        const corpus = resoudreCorpus({ ...PILOTE_FORGE, dossiersConnus: DOSSIERS });
        const choix = selectContext(fichesDuDisque(), {
            systemId: PILOTE_FORGE.systemId,
            campaignName: 'A la claire fontaine',
            systemPath: corpus.racine,
            query: question,
        });
        return choix.retenus
            .find(r => r.provenance === 'fiche' && laFicheRepondSeule(r.sujet, question))
            ?.sujet;
    };

    it('toutes les fiches du disque déclarent un sujet', () => {
        const sans = fichesDuDisque().filter(f => !f.sujet).map(f => f.path);
        expect(sans, 'une fiche sans sujet ne sera jamais une « fiche »').toEqual([]);
    });

    it.each([
        ["Quelles sont les règles de l'éthylisme ?", 'Éthylisme (jet, degrés et malus)'],
        ['Comment se déroule une poursuite ?', 'Poursuites'],
        ["Comment fonctionne l'initiative ?", 'Initiative et déroulement du tour'],
        ['Comment fonctionne la santé et les blessures ?', 'Santé et blessures'],
        ['Quels sont les degrés de réussite ?', 'Degrés de réussite et critiques'],
    ])('« %s » est répondue par la fiche seule', (question, sujetAttendu) => {
        expect(ficheQuiRepond(question)).toBe(sujetAttendu);
    });

    /**
     * **Et l'etage 1 doit se taire quand il le faut.** « Parer avec un cheval »
     * croise deux sujets sans etre couvert par aucun : repondre avec une fiche
     * exacte et hors sujet serait pire qu'une paraphrase. *L'absence
     * d'etiquette est le cas NORMAL, pas une panne* — c'est la raison meme de
     * la ligne de journal posee dans `AIService`.
     */
    it('se tait quand aucune fiche ne couvre la question', () => {
        expect(ficheQuiRepond('Comment parer avec un cheval ?')).toBeUndefined();
    });

    /**
     * **Le cas de table du 2026-08-22, de bout en bout sur le disque.**
     *
     * « Comment se calculent les dégâts de chute ? » retient deux fiches — et
     * aucune ne parle de la chute. Le meneur repartait sans règle, sans renvoi
     * au livre, et **sans que la Forge apprenne le manque** : la recherche avait
     * touché une fiche, donc tout allait bien.
     *
     * Deux verdicts portaient sur la même chose et se contredisaient. *C'est le
     * test de l'étage 1 qui tranche désormais*, ici comme là-bas.
     */
    it('une question que seules des fiches voisines touchent entre dans la file', () => {
        const question = 'Comment se calculent les dégâts de chute ?';
        const corpus = resoudreCorpus({ ...PILOTE_FORGE, dossiersConnus: DOSSIERS });
        const choix = selectContext(fichesDuDisque(), {
            systemId: PILOTE_FORGE.systemId,
            campaignName: 'A la claire fontaine',
            systemPath: corpus.racine,
            query: question,
        });

        expect(choix.retenus.length, 'des fiches ont bien été retenues').toBeGreaterThan(0);
        expect(choix.retenus.every(r => r.provenance === 'fiche')).toBe(true);

        const atteinte = atteinteDeLaRecherche(choix.retenus, question);
        expect(atteinte, 'voisines, mais aucune ne couvre').toBe('fiche-hors-sujet');
        expect(estUneLacune(atteinte), 'la Forge doit l’apprendre').toBe(true);
    });
});
