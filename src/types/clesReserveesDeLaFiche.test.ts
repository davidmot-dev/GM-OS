import { describe, expect, it } from 'vitest';
import { DonneesDeFicheSchema, estCleReserveeDeLaFiche } from './donneesDeFiche';
import { SessionOSModuleSchema } from './schemas';

/**
 * **Toute clé réservée qu'un pilote écrit dans la fiche doit se relire** — 15/11/2026.
 *
 * Le contrôle des sauvegardes ne connaissait que Rêve de Dragon, Alien et Cthulhu Hack. Les clés de
 * Dune, RuneQuest, Delta Green… faisaient refuser **toute** la sauvegarde : la restauration et la
 * semence de la répétition échouaient, données intactes dans le fichier. Cette garde relit chaque
 * `export const CLE_… = '_gmos_…' | '__…'` de `src/` : une clé neuve non déclarée fait échouer ici.
 */
const SOURCES = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const DECLARATION = /export const (CLE_[A-Z0-9_]+)\s*=\s*'((?:_gmos_|__)[A-Za-z0-9_]+)'/g;

const clesDeclarees = Object.entries(SOURCES).flatMap(([fichier, texte]) =>
    [...texte.matchAll(DECLARATION)].map(([, nom, cle]) => ({ fichier, nom, cle })));

describe('les clés réservées de la fiche', () => {
    it('trouve les déclarations dans le code (la garde lit vraiment quelque chose)', () => {
        expect(clesDeclarees.length).toBeGreaterThanOrEqual(20);
        expect(clesDeclarees.map(c => c.cle)).toEqual(expect.arrayContaining(['_gmos_dune', '_gmos_runequest', '__deltaGreen']));
    });

    it('accepte chaque clé réservée déclarée dans src/', () => {
        const oubliees = clesDeclarees.filter(c => !estCleReserveeDeLaFiche(c.cle)).map(c => `${c.nom} = '${c.cle}' (${c.fichier})`);
        expect(oubliees).toEqual([]);
    });

    it('relit une sauvegarde qui porte les états de neuf jeux, sans en perdre', () => {
        const sheetData = { nom: 'Fictif', vie: 3,
            _gmos_dune: { determination: 2 }, _gmos_runequest: { experience: ['epee'] }, __deltaGreen: { liens: [1] },
            __shadowrunDerogations: [], __cocSuivi: { san: 50 }, _gmos_symbaroum: { corruption: 1 }, _gmos_star_trek: { stress: 0 },
            _gmos_degenesis: { ego: 2 }, _gmos_blade_runner: { promotion: 1 } };
        const original = { players: [{ id: 'j', realName: 'Fictif', avatarUrl: '', isOnline: false,
            characters: [{ id: 'pj', name: 'Fictif', portraitUrl: '', campaignId: 'c', sheetData }] }] };
        expect(SessionOSModuleSchema.parse(JSON.parse(JSON.stringify(original))).players?.[0].characters[0].sheetData).toEqual(sheetData);
    });

    it('refuse toujours une clé inconnue, et ne garde pas `__proto__`', () => {
        expect(() => DonneesDeFicheSchema.parse({ _gmos_inconnu: { objet: true } })).toThrow();
        // Zod écarte la clé sans erreur : elle n'est ni gardée, ni capable de polluer les objets.
        const relu = DonneesDeFicheSchema.parse(JSON.parse('{"__proto__": {"pollue": true}, "nom": "Fictif"}'));
        expect(Object.hasOwn(relu, '__proto__')).toBe(false);
        expect(({} as Record<string, unknown>).pollue).toBeUndefined();
    });
});
