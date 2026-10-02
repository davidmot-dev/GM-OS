import { describe, it, expect, vi } from 'vitest';
import { ICONES_DU_SON, iconeDuSon } from './iconesDuSon';

/**
 * **Les icônes des atmosphères et des pastilles** — demandées par David,
 * posées le 2026-10-02 (refonte, L2). On garde la clé ; la palette la rend.
 */
describe('la palette des icônes du son', () => {
    it('rend une icône pour chaque clé, avec un nom lisible', () => {
        const cles = Object.keys(ICONES_DU_SON);
        expect(cles.length).toBeGreaterThanOrEqual(40);
        for (const cle of cles) {
            expect(iconeDuSon(cle)?.Icone, cle).toBeTruthy();
            expect(ICONES_DU_SON[cle].nom.length, cle).toBeGreaterThan(1);
        }
    });

    it('se tait sur une clé absente ou inconnue, plutôt que de casser l’onglet', () => {
        expect(iconeDuSon(null)).toBeNull();
        expect(iconeDuSon(undefined)).toBeNull();
        expect(iconeDuSon('')).toBeNull();
        expect(iconeDuSon('icone-retiree-depuis')).toBeNull();
    });

    it('n’offre pas deux fois la même icône sous deux noms', () => {
        const composants = Object.values(ICONES_DU_SON).map(i => i.Icone);
        expect(new Set(composants).size).toBe(composants.length);
    });
});

vi.mock('../SoundEngine', () => ({
    soundEngine: { setMasterVolume: vi.fn(), setOutputDevice: vi.fn(), unloadAudio: vi.fn(), stopAll: vi.fn() },
}));

describe('le magasin garde la clé', () => {
    it('pose et retire l’icône d’une atmosphère et d’une pastille ; effacer la pastille l’efface', async () => {
        const { useSoundStore } = await import('../useSoundStore');
        const etat = () => useSoundStore.getState();
        const atmosphere = etat().atmospheres.find(a => a.id === etat().activeAtmosphereId) ?? etat().atmospheres[0];
        etat().setActiveAtmosphereId(atmosphere.id);
        const padId = Object.keys(atmosphere.pads)[0];
        const courante = () => etat().atmospheres.find(a => a.id === atmosphere.id)!;

        etat().definirLIconeDeLAtmosphere(atmosphere.id, 'pluie');
        etat().definirLIconeDuPad(padId, 'bombe');
        expect(courante().icone).toBe('pluie');
        expect(courante().pads[padId].icone).toBe('bombe');

        etat().definirLIconeDeLAtmosphere(atmosphere.id, null);
        expect(courante().icone).toBeNull();

        etat().clearPad(padId);
        expect(courante().pads[padId].icone).toBeNull();
    });
});
