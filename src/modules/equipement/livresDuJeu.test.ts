import { describe, it, expect, vi, afterEach } from 'vitest';
import { lireLesLivresDuJeu } from './livresDuJeu';
import type { Corpus } from '../../../electron/corpusSysteme';

/**
 * La lecture des livres sur le disque — § 203, étape C. Le pont d'Electron est
 * simulé : un livre de base à deux fiches dont une d'équipement, un supplément.
 */
const ARMES = `---\nsujet: Armes\nsources: "ALIEN, le jeu de rôle"\nsections: "« PISTOLETS »"\n---\n\n### Tableau des Pistolets\n\n| Arme | Bonus |\n|:--- |:--- |\n| **Revolver 357 Magnum** | +1 |\n`;
const STRESS = `---\nsujet: Stress\nsources: "ALIEN, le jeu de rôle"\n---\n\n| D6 | Effet |\n|:--- |:--- |\n| 1 | Tremblement |\n`;
const FICHIERS: Record<string, string[]> = {
    'systems/alien/rules': ['armes.md', 'stress.md', 'notes.txt'],
    'systems/alien/supplements/colonial-marines/rules': ['pistolets.md'],
};
const CONTENUS: Record<string, string> = {
    'systems/alien/rules/armes.md': ARMES,
    'systems/alien/rules/stress.md': STRESS,
    'systems/alien/supplements/colonial-marines/rules/pistolets.md': ARMES.replace('ALIEN, le jeu de rôle', 'ALN-Marines Coloniaux_FR.pdf'),
};
const corpus: Corpus = { racine: 'systems/alien', id: 'alien', raison: 'identifiant', aCreer: false };

afterEach(() => { delete (window as { appBridge?: unknown }).appBridge; });

describe('lireLesLivresDuJeu', () => {
    it('lit le livre de base puis les suppléments, ne garde que les fiches d’équipement, et résout les pages dans l’index de chaque livre', async () => {
        const resolveSections = vi.fn(async (systeme: string) => ({
            indexDisponible: true, sources: [], resolutions: [{ demande: 'PISTOLETS', statut: 'exact' as const, page: systeme === 'alien' ? 119 : 66, score: 1 }],
        }));
        (window as { appBridge?: unknown }).appBridge = { ai: {
            listDir: async (d: string) => FICHIERS[d] ?? [],
            readDoc: async (c: string) => CONTENUS[c] ?? null,
            resolveSections,
        } };
        const livres = await lireLesLivresDuJeu(corpus, [{ slug: 'colonial-marines', titre: 'Colonial Marines Operations Manual' }], 'Alien');
        expect(livres.map(l => [l.cle, l.titre, l.fiches.length, l.total])).toEqual([
            ['jeu', 'Livre de base', 1, 2],
            ['colonial-marines', 'Colonial Marines Operations Manual', 1, 1],
        ]);
        // Le livre de base prend son nom du `sources:` ; le supplément garde son titre déclaré, pas le nom du PDF.
        expect(livres.map(l => l.fiches[0].livre)).toEqual(['ALIEN, le jeu de rôle', 'Colonial Marines Operations Manual']);
        expect(livres.map(l => l.fiches[0].pages)).toEqual([[{ titre: 'PISTOLETS', page: 119 }], [{ titre: 'PISTOLETS', page: 66 }]]);
        expect(resolveSections.mock.calls.map(c => c[0])).toEqual(['alien', 'alien/supplements/colonial-marines']);
    });

    it('rend des livres vides, sans lever, quand le pont est absent', async () => {
        const livres = await lireLesLivresDuJeu(corpus, [], 'Alien');
        expect(livres).toEqual([{ cle: 'jeu', titre: 'Livre de base', fiches: [], total: 0 }]);
    });
});
