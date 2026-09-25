import { describe, it, expect } from 'vitest';
import { bruitagesProposes, bruitageDuMoment, type EtatDeSoundOS } from './bruitageDuMoment';

/**
 * **Le bruitage d'un moment désigne une atmosphère ET un pad.**
 *
 * *Signalé par David le 2026-09-25 : « la liste des sons de Sound-OS n'est pas
 * complète, elle ne reflète pas toutes les playlists ».*
 */

const pad = (id: string, title: string, filePath: string | null = `m-${id}`) =>
    ({ id, title, filePath, volume: 1 });

const ETAT: EtatDeSoundOS = {
    activeAtmosphereId: 'a-exploration',
    atmospheres: [
        {
            id: 'a-exploration', name: 'Exploration', campagneId: null,
            pads: { PAD_01: pad('PAD_01', 'Porte'), PAD_02: pad('PAD_02', '', null) },
        },
        {
            id: 'a-combat', name: 'Combat', campagneId: 'c-1',
            pads: { PAD_01: pad('PAD_01', 'Épée'), PAD_03: pad('PAD_03', 'Cri') },
        },
        {
            id: 'a-autre', name: 'Autre campagne', campagneId: 'c-2',
            pads: { PAD_01: pad('PAD_01', 'Laser') },
        },
        { id: 'a-vide', name: 'Vide', campagneId: null, pads: { PAD_01: pad('PAD_01', '', null) } },
    ],
};

describe('les bruitages proposés à un moment', () => {
    /** **Le test qui garde le signalement de David.** */
    it('viennent de TOUTES les atmosphères de la campagne, pas de la seule active', () => {
        const rubriques = bruitagesProposes(ETAT, 'c-1', ['c-1', 'c-2']);
        expect(rubriques.map(r => r.atmosphere.name)).toEqual(['Combat', 'Exploration']);
    });

    it('écartent les pads muets, et les atmosphères qui n’ont rien qui sonne', () => {
        const rubriques = bruitagesProposes(ETAT, 'c-1', ['c-1', 'c-2']);
        const exploration = rubriques.find(r => r.atmosphere.id === 'a-exploration');
        expect(exploration?.pads.map(p => p.title)).toEqual(['Porte']);
        expect(rubriques.some(r => r.atmosphere.id === 'a-vide')).toBe(false);
    });

    it('n’offrent pas les atmosphères d’une autre campagne', () => {
        const rubriques = bruitagesProposes(ETAT, 'c-1', ['c-1', 'c-2']);
        expect(rubriques.some(r => r.atmosphere.id === 'a-autre')).toBe(false);
    });
});

describe('le pad qu’un moment désigne', () => {
    /**
     * ⛔ **Le défaut sous la liste.** `PAD_01` existe dans chaque atmosphère :
     * sans la sienne, le moment jouait celui de l'atmosphère active.
     */
    it('est pris dans SON atmosphère, même quand une autre est active', () => {
        const b = bruitageDuMoment({ soundPadId: 'PAD_01', soundAtmosphereId: 'a-combat' }, ETAT);
        expect(b?.pad.title).toBe('Épée');
        expect(b?.dansLAtmosphereActive).toBe(false);
    });

    /**
     * Joué sous `PAD_01`, il couperait le `PAD_01` de l'atmosphère affichée et
     * l'allumerait à tort.
     */
    it('joue sous une clé à part quand son atmosphère n’est pas celle affichée', () => {
        expect(bruitageDuMoment({ soundPadId: 'PAD_01', soundAtmosphereId: 'a-combat' }, ETAT)?.cle)
            .toBe('a-combat:PAD_01');
        expect(bruitageDuMoment({ soundPadId: 'PAD_01', soundAtmosphereId: 'a-exploration' }, ETAT)?.cle)
            .toBe('PAD_01');
    });

    it('garde son sens d’origine pour un moment écrit sans atmosphère', () => {
        const b = bruitageDuMoment({ soundPadId: 'PAD_01' }, ETAT);
        expect(b?.pad.title).toBe('Porte');
        expect(b?.dansLAtmosphereActive).toBe(true);
    });

    it('rend null pour une atmosphère disparue ou un pad devenu muet', () => {
        expect(bruitageDuMoment({ soundPadId: 'PAD_01', soundAtmosphereId: 'a-supprimee' }, ETAT)).toBeNull();
        expect(bruitageDuMoment({ soundPadId: 'PAD_02', soundAtmosphereId: 'a-exploration' }, ETAT)).toBeNull();
    });
});
