import { describe, it, expect } from 'vitest';
import type { Entity } from '../../../types/entity.types';
import type { ProfilVocal } from '../types';
import { depuisUnPnjDeCampagne, depuisUnPnjDeNpcOs, texteDuPersonnage } from './personnageAVoix';

/**
 * **Ce que ces tests protègent : les PNJ de la campagne peuvent avoir une voix,
 * et ils la gardent.**
 *
 * Le profilage vocal n'existait que dans NPC-OS — un module à part, qui ne
 * contenait qu'une fiche dans la sauvegarde du 2026-08-30, quand la galerie de
 * campagne en portait cent vingt-trois. Ces cent vingt-trois n'avaient aucun
 * champ pour ranger un profil : la case « Sync PNJ » leur devinait des réglages
 * par mots-clés et les écrasait à la sélection suivante.
 *
 * Le point sensible est la **priorité** : ce qu'on a réglé passe avant ce qu'on
 * devine. Sans elle, sélectionner un PNJ effacerait sa propre voix — le défaut
 * serait pire qu'avant, puisqu'il y aurait désormais quelque chose à perdre.
 */

const pnjDeCampagne = (patch: Partial<Entity> = {}): Entity => ({
    id: 'e-1',
    name: 'Asha',
    type: 'npc',
    role: 'neutral',
    status: 'alive',
    avatar: '',
    hp: 10, maxHp: 10, ac: 10, speed: 6, initiative: 0,
    description: 'Une contrebandière au timbre grave.',
    roleplayingNotes: 'Parle lentement, avec un accent trainant.',
    gmSecretInfo: 'Elle travaille pour la Tyrell Corporation.',
    linkedMapIds: [],
    campaignId: 'c-1',
    ...patch,
});

const profil: ProfilVocal = {
    presetId: null,
    effects: { pitch: 2, formant: -5 } as ProfilVocal['effects'],
    enregistreLe: 1,
};

describe('un PNJ de campagne décrit pour Voice-OS', () => {
    it('donne ses notes de jeu et ses traits nommés', () => {
        const p = depuisUnPnjDeCampagne(pnjDeCampagne({ faction: 'Les Nomades' }));

        expect(p.id).toBe('e-1');
        expect(p.notes).toContain('Parle lentement');
        expect(p.notes).toContain('timbre grave');
        expect(p.traits).toMatchObject({ type: 'npc', role: 'neutral', faction: 'Les Nomades' });
    });

    it("ne donne PAS les secrets du meneur", () => {
        // Ce qui part au modèle part chez le fournisseur actif, qui peut être
        // distant. Les secrets d'un PNJ ne servent pas à régler une hauteur de
        // voix.
        const p = depuisUnPnjDeCampagne(pnjDeCampagne());
        const tout = JSON.stringify(p);

        expect(tout).not.toContain('Tyrell');
    });

    it('emporte son profil enregistré quand il en a un', () => {
        expect(depuisUnPnjDeCampagne(pnjDeCampagne({ voiceProfile: profil })).voiceProfile).toBe(profil);
        expect(depuisUnPnjDeCampagne(pnjDeCampagne()).voiceProfile).toBeUndefined();
    });

    it('omet une faction absente plutôt que de la nommer vide', () => {
        // Un trait vide énuméré au modèle est une information fausse : il lira
        // « faction: » et croira qu'on a quelque chose à en dire.
        expect(depuisUnPnjDeCampagne(pnjDeCampagne())).not.toHaveProperty('traits.faction');
    });
});

describe('un PNJ de NPC-OS décrit pour Voice-OS', () => {
    it('parle la même langue que celui de la campagne', () => {
        const p = depuisUnPnjDeNpcOs({
            id: 'n-1',
            name: 'Le Spectre',
            gmNotes: 'Chuchote toujours.',
            fields: { Espèce: 'Revenant' },
            voiceProfile: profil,
        });

        expect(p).toMatchObject({ id: 'n-1', name: 'Le Spectre', notes: 'Chuchote toujours.' });
        expect(p.traits).toEqual({ Espèce: 'Revenant' });
        expect(p.voiceProfile).toBe(profil);
    });

    it('supporte une fiche sans notes ni traits', () => {
        const p = depuisUnPnjDeNpcOs({ id: 'n-2', name: 'Anonyme' });
        expect(p.notes).toBe('');
        expect(p.traits).toEqual({});
    });
});

describe('le texte lu par les mots-clés', () => {
    it('couvre le nom, les notes et les traits, en minuscules', () => {
        const texte = texteDuPersonnage(depuisUnPnjDeCampagne(
            pnjDeCampagne({ name: 'Le Spectre', faction: 'Les Errants' }),
        ));

        expect(texte).toContain('spectre');
        expect(texte).toContain('les errants');
        // Le repli par mots-clés cherchait dans trois champs de texte ; il en
        // voit maintenant autant, mais par la même porte que l'IA.
        expect(texte).toContain('accent trainant');
    });
});
