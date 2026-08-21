import { describe, it, expect } from 'vitest';
import { validateSession, SessionOSModuleSchema, FullSessionSchema } from './schemas';

/**
 * **Le chemin de chargement n'avait aucun test.** Ni le schéma, ni
 * `validateSession` — c'est-à-dire la seule porte par laquelle une sauvegarde
 * entre dans l'application. Les deux défauts ci-dessous y vivaient depuis le
 * 2026-08-20 sans que rien ne puisse les attraper.
 */

/**
 * Les six champs qui ne doivent JAMAIS porter de défaut.
 *
 * `distributeData` finit par `useSessionOSStore.setState(sessionOS)` : un
 * `setState` partiel ne touche que les clés présentes, et un `.default([])` rend
 * la clé présente avec du vide dedans. Relire une vieille sauvegarde effaçait
 * donc ce que le store portait — sans erreur et sans message.
 */
const CHAMPS_SANS_DEFAUT = [
    'timelineEvents', 'wikiEntries', 'atlasMaps',
    'sessions', 'entities', 'clues',
] as const;

describe('un champ absent de la sauvegarde reste absent après lecture', () => {
    it.each(CHAMPS_SANS_DEFAUT)('« %s » n\'est pas fabriqué à vide', champ => {
        const lu = SessionOSModuleSchema.parse({ campaigns: [], players: [] });

        // `toBeUndefined` ne suffirait pas : une clé présente valant `undefined`
        // écrase quand même au `setState`. C'est la PRÉSENCE qu'on mesure.
        expect(Object.keys(lu)).not.toContain(champ);
    });

    it('mais ce que la sauvegarde porte est conservé', () => {
        const lu = SessionOSModuleSchema.parse({
            campaigns: [],
            players: [],
            timelineEvents: [{ id: 'e1' }],
            entities: [{ id: 'pnj-1' }],
        });

        expect(lu.timelineEvents).toEqual([{ id: 'e1' }]);
        expect(lu.entities).toEqual([{ id: 'pnj-1' }]);
    });

    it('et une liste réellement vide se distingue d\'une liste absente', () => {
        const vide = SessionOSModuleSchema.parse({ campaigns: [], players: [], clues: [] });

        expect(Object.keys(vide)).toContain('clues');
        expect(vide.clues).toEqual([]);
    });

    /**
     * Le schéma ne nomme pas tous les champs durables — `actes`, `scenes`, les
     * pilotes, les decks n'y sont pas. C'est `.passthrough()` qui les sauve, et
     * c'est pourquoi ne rien déclarer vaut toujours mieux qu'un défaut.
     */
    it('les champs que le schéma ne nomme pas traversent intacts', () => {
        const lu = SessionOSModuleSchema.parse({
            campaigns: [], players: [],
            actes: [{ id: 'a1' }], scenes: [{ id: 's1' }], decks: [{ id: 'd1' }],
        }) as Record<string, unknown>;

        expect(lu.actes).toEqual([{ id: 'a1' }]);
        expect(lu.scenes).toEqual([{ id: 's1' }]);
        expect(lu.decks).toEqual([{ id: 'd1' }]);
    });
});

describe('une sauvegarde illisible se dit, elle ne se remplace pas par du vide', () => {
    /**
     * Ce qui échoue vraiment : le schéma est `.passthrough()` et presque tout y
     * est facultatif. Une campagne sans `system` faisait donc jeter le fichier
     * ENTIER — et le chargement annonçait quand même « Session chargée et
     * vérifiée 📂 ».
     */
    const sauvegardeCassee = {
        version: '5.1.0',
        modules: {
            sessionOS: {
                campaigns: [{ id: 'c1', name: 'Hadley Hope' }],  // `system` manquant
                players: [],
            },
        },
    };

    it('elle lève au lieu de rendre une session vide', () => {
        expect(() => validateSession(sauvegardeCassee)).toThrow(/illisible/i);
    });

    it('le message nomme le champ fautif et dit que rien n\'a été chargé', () => {
        let message = '';
        try { validateSession(sauvegardeCassee); } catch (err) {
            message = err instanceof Error ? err.message : String(err);
        }

        expect(message).toContain('system');
        expect(message).toContain("Rien n'a été chargé");
    });

    it('le repli d\'avant produisait bien une session valide — c\'est ce qui le rendait invisible', () => {
        // La mesure qui fonde le correctif : `parse({})` ne lève pas, il rend
        // une session complète et vide. Rien dans l'appelant ne pouvait la
        // distinguer d'un chargement réussi.
        const vide = FullSessionSchema.parse({});

        expect(vide.global.theme).toBe('cyberpunk');
        expect(vide.modules.sessionOS).toBeUndefined();
    });
});

describe('le soin des sauvegardes incomplètes est intact', () => {
    it('une sauvegarde sans « global » ni « modules » se lit sans lever', () => {
        expect(() => validateSession({ version: '5.1.0' })).not.toThrow();
    });

    it('une campagne bien formée mais lacunaire reçoit ses défauts', () => {
        const lu = validateSession({
            modules: { sessionOS: { campaigns: [{ id: 'c1', name: 'Milo', system: 'alien' }] } },
        });

        const campagne = lu.modules.sessionOS?.campaigns[0];
        expect(campagne?.description).toBe('');
        expect(campagne?.activeLocationIds).toEqual([]);
    });
});
