import { describe, it, expect } from 'vitest';
import { changementsDeFiche, cumuler, direLeChangement, type ChangementDeChamp } from './historiqueDesFiches';

/** **H1** (2026-10-22) : ce qui a changé sur une fiche, dit au journal. */
describe('ce qui a changé sur une fiche', () => {
    it('les valeurs lues par la table, pas les mécanismes', () => {
        expect(changementsDeFiche(
            { force: 3, fatigue: false, _gmos_progression_alien: { a: 1 }, __franchissements: {}, notes: '' },
            { force: 4, fatigue: true, _gmos_progression_alien: { a: 2 }, __franchissements: { s: true } },
        )).toEqual([
            { champ: 'force', avant: 3, apres: 4 },
            { champ: 'fatigue', avant: false, apres: true },
        ]);
    });

    it('un curseur qu\'on fait glisser donne une ligne ; revenir au départ n\'a rien changé', () => {
        const moment = new Map<string, ChangementDeChamp>();
        cumuler(moment, [{ champ: 'force', avant: 3, apres: 4 }]);
        cumuler(moment, [{ champ: 'force', avant: 4, apres: 5 }]);
        expect([...moment.values()]).toEqual([{ champ: 'force', avant: 3, apres: 5 }]);
        cumuler(moment, [{ champ: 'force', avant: 5, apres: 3 }]);
        expect(moment.size).toBe(0);
    });

    it('se dit comme la table le lit', () => {
        expect(direLeChangement({ champ: 'force', avant: 3, apres: 4 }, 'Force')).toBe('Force 3 → 4');
        expect(direLeChangement({ champ: 'fatigue', avant: false, apres: true }, 'Fatigué')).toBe('Fatigué coché');
        expect(direLeChangement({ champ: 'nom', avant: '', apres: 'Ilya' }, 'Nom')).toBe('Nom — → Ilya');
        expect(direLeChangement({ champ: 'notes', avant: 'a', apres: 'x'.repeat(80) }, 'Notes')).toBe('« Notes » modifié');
    });
});
