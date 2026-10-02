import { describe, it, expect } from 'vitest';
import fr from '../../../../locales/fr/modules.json';
import en from '../../../../locales/en/modules.json';
import { MOTEURS_DU_JET, moteurDuPilote } from './moteursDuJet';
import { DEFAULT_GAME_DRIVERS } from '../../../../data/defaultGameDrivers';

describe('les moteurs du Grimoire', () => {
    it('proposent les moteurs des jeux de David : dés échelonnés et sauvegarde', () => {
        const ids = MOTEURS_DU_JET.map(m => m.id);
        expect(ids).toContain('yze-echelonne');
        expect(ids).toContain('sauvegarde');
    });

    it('proposent le moteur de chaque pilote livré', () => {
        for (const pilote of DEFAULT_GAME_DRIVERS) {
            expect(moteurDuPilote(pilote.dice?.engine), `${pilote.id} : ${pilote.dice?.engine}`).toBeDefined();
        }
    });

    it('disent chacun ce qu’ils font, avec un exemple, dans les deux langues', () => {
        for (const langue of [fr, en]) {
            const moteurs = (langue as any).session.rule_engine_editor.core.agencement.moteurs;
            for (const m of MOTEURS_DU_JET) {
                expect(moteurs[m.cle]?.nom, m.cle).toBeTruthy();
                expect(moteurs[m.cle]?.clair, m.cle).toBeTruthy();
                expect(moteurs[m.cle]?.exemple, m.cle).toBeTruthy();
            }
        }
    });
});
