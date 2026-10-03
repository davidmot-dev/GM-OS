import { describe, it, expect } from 'vitest';
import { modeleDuMoment, fenetreValide, CONSIGNES_EN_SEANCE_PAR_DEFAUT } from './modeleDuMoment';
import { modeleAPrechauffer } from './prechauffage';

const OLLAMA = { provider: 'ollama' as const, modelId: 'gemma4:12b', modeleEnSeance: 'lfm2.5', contexte: 16384, contexteEnSeance: 32768 };

describe('un modèle pour préparer, un autre pour jouer', () => {
    it('hors séance, le modèle principal et sa fenêtre', () => {
        expect(modeleDuMoment(OLLAMA, false)).toEqual({ model: 'gemma4:12b', num_ctx: 16384, enSeance: false });
    });

    it('en séance, le modèle de séance et sa fenêtre', () => {
        expect(modeleDuMoment(OLLAMA, true)).toEqual({
            model: 'lfm2.5', num_ctx: 32768, enSeance: true, consignes: CONSIGNES_EN_SEANCE_PAR_DEFAUT,
        });
    });

    /* David, 2026-10-03 : « la contrainte de 20 lignes ne vaut pas pour une question à gemma hors session ». */
    it('les consignes de table ne valent QUE pour le modèle de séance', () => {
        expect(modeleDuMoment(OLLAMA, false).consignes).toBeUndefined();
        expect(modeleDuMoment({ ...OLLAMA, modeleEnSeance: '' }, true).consignes).toBeUndefined();
        expect(CONSIGNES_EN_SEANCE_PAR_DEFAUT).toMatch(/français/);
        expect(CONSIGNES_EN_SEANCE_PAR_DEFAUT).toMatch(/Vingt lignes/);
    });

    it('des consignes réglées passent devant le défaut ; vides, il n’y en a aucune', () => {
        expect(modeleDuMoment({ ...OLLAMA, consignesEnSeance: 'Sois bref.' }, true).consignes).toBe('Sois bref.');
        expect(modeleDuMoment({ ...OLLAMA, consignesEnSeance: '  ' }, true).consignes).toBeUndefined();
    });

    it('sans modèle de séance, rien ne change — même en séance', () => {
        const sans = { ...OLLAMA, modeleEnSeance: '' };
        expect(modeleDuMoment(sans, true)).toEqual({ model: 'gemma4:12b', num_ctx: 16384, enSeance: false });
        expect(modeleDuMoment({ provider: 'ollama', modelId: 'gemma4:12b' }, true))
            .toEqual({ model: 'gemma4:12b', num_ctx: undefined, enSeance: false });
    });

    it('une fenêtre hors bornes ne part jamais vers Ollama', () => {
        expect(fenetreValide(32768)).toBe(32768);
        expect(fenetreValide(512)).toBeUndefined();
        expect(fenetreValide(1e9)).toBeUndefined();
        expect(fenetreValide(16384.5)).toBeUndefined();
        expect(fenetreValide(undefined)).toBeUndefined();
    });
});

describe('le préchauffage charge le modèle qui répondra en séance', () => {
    it('le modèle de séance, avec SA fenêtre — sinon Ollama rechargerait à la première question', () => {
        expect(modeleAPrechauffer('ollama', { ollama: OLLAMA })).toEqual({ model: 'lfm2.5', num_ctx: 32768 });
    });

    it('sans modèle de séance, le modèle principal, comme avant', () => {
        expect(modeleAPrechauffer('ollama', { ollama: { provider: 'ollama', modelId: 'gemma4:12b' } }))
            .toEqual({ model: 'gemma4:12b' });
    });
});
