import { describe, it, expect } from 'vitest';
import { modeleDuMoment, fenetreValide } from './modeleDuMoment';
import { modeleAPrechauffer } from './prechauffage';

const OLLAMA = { provider: 'ollama' as const, modelId: 'gemma4:12b', modeleEnSeance: 'lfm2.5', contexte: 16384, contexteEnSeance: 32768 };

describe('un modèle pour préparer, un autre pour jouer', () => {
    it('hors séance, le modèle principal et sa fenêtre', () => {
        expect(modeleDuMoment(OLLAMA, false)).toEqual({ model: 'gemma4:12b', num_ctx: 16384, enSeance: false });
    });

    it('en séance, le modèle de séance et sa fenêtre', () => {
        expect(modeleDuMoment(OLLAMA, true)).toEqual({ model: 'lfm2.5', num_ctx: 32768, enSeance: true });
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
