import { describe, it, expect } from 'vitest';
import { lireLesFichesDeLaCampagne, partiesDesFiches } from './lectureDesFiches';
import { resoudreCorpusDeCampagne } from '../../../../electron/corpusDeCampagne';
import type { AccesAuxFiches } from '../rules/lectureDuCorpus';

/**
 * Ce que ces tests protègent : **le second axe de découpage survit au disque**.
 *
 * Une fiche de campagne porte deux coordonnées — son sujet et sa partie. Perdre
 * la seconde ne casse rien de visible : la Forge tourne, rend des scènes, et les
 * mélange sur les trois actes. C'est le genre de défaut qui ne se voit qu'à
 * table.
 */

const corpus = resoudreCorpusDeCampagne({ nom: 'Le secret de Milo' });

const fiche = (entete: Record<string, string>, corps: string) =>
    ['---', ...Object.entries(entete).map(([k, v]) => `${k}: ${v}`), '---', '', corps, ''].join('\n');

function disque(fichiers: Record<string, string>): AccesAuxFiches {
    return {
        listDir: async chemin =>
            Object.keys(fichiers)
                .filter(c => c.startsWith(`${chemin}/`))
                .map(c => c.slice(chemin.length + 1)),
        readDoc: async chemin => fichiers[chemin] ?? null,
    };
}

const DOSSIER = 'campaigns/le-secret-de-milo/fiches';

describe('lireLesFichesDeLaCampagne', () => {
    it('retient la partie qui borne une fiche par acte', async () => {
        const lu = await lireLesFichesDeLaCampagne(corpus, disque({
            [`${DOSSIER}/personnages-non-joueurs--acte-ii.md`]: fiche(
                { sujet: 'Personnages non joueurs', campagne: 'le-secret-de-milo', partie: 'Mystères en Italie' },
                'Milo Torricelli — antiquaire.',
            ),
        }));

        expect(lu.fiches).toHaveLength(1);
        expect(lu.fiches[0].partie).toBe('Mystères en Italie');
        expect(lu.fiches[0].contenu).toContain('Milo Torricelli');
    });

    it('rabat le sujet sur le canevas et garde ce que la fiche a écrit', async () => {
        const lu = await lireLesFichesDeLaCampagne(corpus, disque({
            [`${DOSSIER}/lieux.md`]: fiche(
                { sujet: 'Lieux majeurs de la campagne', campagne: 'le-secret-de-milo' },
                "L'Hôtel Artemide.",
            ),
        }));

        expect(lu.fiches[0].sujet).toBe('Lieux majeurs');
        expect(lu.fiches[0].sujetEcrit).toBe('Lieux majeurs de la campagne');
    });

    it("écarte la fiche des règles propres, sans la confondre avec un échec de lecture", async () => {
        const lu = await lireLesFichesDeLaCampagne(corpus, disque({
            [`${DOSSIER}/regles-propres-a-cette-campagne.md`]: fiche(
                { sujet: 'Règles propres à cette campagne', campagne: 'le-secret-de-milo' },
                "Une horloge de corruption avance d'un cran par nuit.",
            ),
        }));

        expect(lu.fiches).toHaveLength(0);
        expect(lu.ignorees).toHaveLength(0);
        expect(lu.ecartees).toHaveLength(1);
        expect(lu.ecartees[0].sujet).toBe('Règles propres à cette campagne');
    });

    it('remonte le jeu déclaré par les fiches', async () => {
        const lu = await lireLesFichesDeLaCampagne(corpus, disque({
            [`${DOSSIER}/pitch-et-ton.md`]: fiche(
                { sujet: 'Pitch et ton', campagne: 'le-secret-de-milo', jeu: 'cthulhu-hack' },
                'Une enquête vénitienne.',
            ),
        }));

        expect(lu.jeu).toBe('cthulhu-hack');
    });

    it('dit ce qu\'il n\'a pas su lire au lieu de le laisser disparaître', async () => {
        const lu = await lireLesFichesDeLaCampagne(corpus, disque({
            [`${DOSSIER}/sans-sujet.md`]: '---\ncampagne: le-secret-de-milo\n---\n\nDu texte.\n',
            [`${DOSSIER}/vide.md`]: '   ',
            [`${DOSSIER}/entete-seul.md`]: '---\nsujet: Pitch et ton\n---\n',
        }));

        expect(lu.fiches).toHaveLength(0);
        expect(lu.ignorees.map(i => i.fichier).sort()).toEqual(
            ['entete-seul.md', 'sans-sujet.md', 'vide.md'],
        );
    });

    it('rend une lecture vide sur une campagne jamais travaillée, sans lever', async () => {
        const lu = await lireLesFichesDeLaCampagne(corpus, disque({}));

        expect(lu.fiches).toEqual([]);
        expect(lu.chemin).toBe(DOSSIER);
    });
});

describe('partiesDesFiches', () => {
    it("rend les actes dans l'ordre où les fiches les nomment, sans doublon", () => {
        const parties = partiesDesFiches([
            { sujet: 'Personnages non joueurs', sujetEcrit: 'PNJ', partie: "Manigances d'Arlequin", contenu: 'x' },
            { sujet: 'Scènes prévues', sujetEcrit: 'Scènes', partie: "Manigances d'Arlequin", contenu: 'x' },
            { sujet: 'Personnages non joueurs', sujetEcrit: 'PNJ', partie: 'Mystères en Italie', contenu: 'x' },
            { sujet: 'Pitch et ton', sujetEcrit: 'Pitch', contenu: 'x' },
        ]);

        expect(parties).toEqual(["Manigances d'Arlequin", 'Mystères en Italie']);
    });
});
