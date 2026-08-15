import { describe, it, expect } from 'vitest';
import {
    resoudreCorpusDeCampagne,
    cheminDesFichesDeCampagne,
    cheminDesBrouillonsDeCampagne,
    cheminDesFichesSupplanteesDeCampagne,
} from './corpusDeCampagne';

/**
 * Ce que ces tests protègent : **l'écriture résout exactement comme la
 * lecture**.
 *
 * Une asymétrie entre les deux est indétectable par construction — ça marche
 * jusqu'au jour où ça écrit à côté. Côté systèmes, elle a coûté cher : la
 * lecture retrouvait `docs/systems/dune` par un repli sur le nom affiché,
 * l'écriture n'avait pas ce repli et déposait les personas dans
 * `systems/custom-1754…/gems.json`, qui n'existe pas. Un `catch {}` avalait le
 * vide, et **les personas de Dune n'ont jamais servi sans que rien ne le dise**.
 *
 * Ici il n'existe encore qu'un seul champ et **aucun code n'écrit dedans**.
 * C'est le bon moment pour poser la convention, avant qu'un second mécanisme
 * n'apparaisse.
 */

describe('resoudreCorpusDeCampagne', () => {
    it('suit la convention à partir du nom', () => {
        const corpus = resoudreCorpusDeCampagne({ nom: 'Agents de Dune' });
        expect(corpus.racine).toBe('campaigns/agents-de-dune');
        expect(corpus.id).toBe('agents-de-dune');
        expect(corpus.raison).toBe('convention');
    });

    it('le chemin déclaré l\'emporte sur la convention', () => {
        // C'est la règle, et elle est explicite. La faire valoir ici supprime
        // l'écart avec la lecture : `RAGService` transmet déjà `campaignPath`
        // au moteur comme périmètre prioritaire.
        const corpus = resoudreCorpusDeCampagne({
            nom: 'Agents de Dune',
            campaignPath: 'docs/notes/ma-campagne',
        });
        expect(corpus.racine).toBe('notes/ma-campagne');
        expect(corpus.raison).toBe('chemin-declare');
    });

    it('annonce la contradiction au lieu de la laisser lire entre les lignes', () => {
        // Une campagne renommée après coup garde son ancien chemin déclaré. On
        // ne change rien — le déclaré reste souverain — mais on le dit.
        const corpus = resoudreCorpusDeCampagne({
            nom: 'Agents de Dune',
            campaignPath: 'campaigns/vieux-nom',
        });
        expect(corpus.contradiction).toBe('agents-de-dune');
    });

    it('ne crie pas quand le chemin déclaré est celui de la convention', () => {
        const corpus = resoudreCorpusDeCampagne({
            nom: 'Agents de Dune',
            campaignPath: 'campaigns/agents-de-dune',
        });
        expect(corpus.contradiction).toBeUndefined();
    });

    it('normalise les séparateurs et le préfixe docs/', () => {
        const corpus = resoudreCorpusDeCampagne({ campaignPath: 'docs\\Campaigns\\Ma Campagne\\' });
        expect(corpus.racine).toBe('campaigns/ma campagne');
    });

    it('sans nom ni chemin, écrit quelque part plutôt que de refuser', () => {
        const corpus = resoudreCorpusDeCampagne({});
        expect(corpus.racine).toBe('campaigns/sans-nom');
        expect(corpus.raison).toBe('defaut');
    });

    describe('aCreer', () => {
        it('est faux quand le dossier existe', () => {
            const corpus = resoudreCorpusDeCampagne({
                nom: 'Agents de Dune',
                dossiersConnus: ['agents-de-dune', 'autre'],
            });
            expect(corpus.aCreer).toBe(false);
        });

        it('est vrai quand il manque — et cela mérite d\'être montré avant d\'écrire', () => {
            const corpus = resoudreCorpusDeCampagne({
                nom: 'Nouvelle Campagne',
                dossiersConnus: ['agents-de-dune'],
            });
            expect(corpus.aCreer).toBe(true);
        });

        it('est faux quand on n\'a pas regardé — l\'absence n\'est pas un zéro', () => {
            /**
             * Sans liste, on ne sait pas distinguer un dossier absent d'un
             * dossier qu'on n'a pas regardé. Annoncer une création qu'on n'a pas
             * vérifiée serait une affirmation, pas un silence.
             */
            expect(resoudreCorpusDeCampagne({ nom: 'X' }).aCreer).toBe(false);
        });
    });
});

describe('les trois dossiers', () => {
    const corpus = resoudreCorpusDeCampagne({ nom: 'Agents de Dune' });

    it('les fiches ne s\'appellent PAS « rules »', () => {
        // Le nom du dossier est la première chose qu'on lit en ouvrant le
        // disque, et il ne doit pas laisser croire qu'on y a rangé des règles :
        // le pilote appartient au jeu, pas à la campagne.
        expect(cheminDesFichesDeCampagne(corpus)).toBe('campaigns/agents-de-dune/fiches');
    });

    it('les brouillons et les supplantées ont chacun le leur', () => {
        expect(cheminDesBrouillonsDeCampagne(corpus)).toBe('campaigns/agents-de-dune/drafts');
        expect(cheminDesFichesSupplanteesDeCampagne(corpus)).toBe('campaigns/agents-de-dune/fiches-v1');
    });

    it('les trois sont distincts — sinon une reforge écraserait sa propre archive', () => {
        const chemins = [
            cheminDesFichesDeCampagne(corpus),
            cheminDesBrouillonsDeCampagne(corpus),
            cheminDesFichesSupplanteesDeCampagne(corpus),
        ];
        expect(new Set(chemins).size).toBe(3);
    });
});
