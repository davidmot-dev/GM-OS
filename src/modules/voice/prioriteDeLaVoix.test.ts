import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVoiceStore } from './useVoiceStore';
import type { ProfilVocal } from './types';
import type { PersonnageAVoix } from './logic/personnageAVoix';

/**
 * **La règle qui décide de la voix d'un PNJ, et l'ordre dans lequel elle décide.**
 *
 * `syncWithNpc` était le seul chemin de la galerie de campagne, et il ne savait
 * faire qu'une chose : chercher des mots-clés dans le texte du PNJ, puis appliquer
 * un preset. Il tournait à chaque changement de sélection **et** à chaque tour de
 * combat.
 *
 * Depuis que les PNJ de campagne peuvent porter un profil, cet automatisme est
 * devenu dangereux : sans priorité, il aurait écrasé la voix qu'on venait de
 * régler, à la première fois qu'on reclique sur la fiche. *Le défaut aurait été
 * pire qu'avant, puisqu'il y aurait désormais quelque chose à perdre.*
 */

vi.mock('../../stores/useToastStore', () => ({ gmToast: vi.fn() }));

/*
  **Le cycle qui rend `useVoiceStore` indéfini, coupé à sa source.**

  `useVoiceStore` importe `ai/modeDeContexte`, qui importe le magasin de session,
  d'où descendent `AmbientEngine` et `MusicEngine` — dont le `setupDucking`
  s'abonne au magasin de voix pendant que celui-ci s'évalue encore. Les deux
  partent alors en rejet non capturé, et **vitest sort en échec sans qu'aucun
  test n'ait échoué**.

  Le contournement de `raccourciDeLaCampagne.test.ts` maquille le magasin de
  voix — impossible ici, c'est lui qu'on mesure. On coupe donc le cycle un cran
  plus haut : ce test ne touche pas au profilage par IA, seul consommateur de ce
  module. *C'est une fragilité réelle des deux moteurs, hors du sujet du jour.*
*/
vi.mock('../ai/modeDeContexte', () => ({ contexteAllegeMaintenant: () => false }));

const personnage = (patch: Partial<PersonnageAVoix> = {}): PersonnageAVoix => ({
    id: 'e-1',
    name: 'Asha',
    notes: '',
    traits: {},
    ...patch,
});

const profilRegle: ProfilVocal = {
    presetId: null,
    effects: { ...useVoiceStore.getState().currentEffects, pitch: 7, reverb: 0.42 },
    enregistreLe: 1,
};

beforeEach(() => {
    useVoiceStore.setState({
        isSyncNPC: true,
        lastSyncedEntityId: null,
        activePresetId: null,
        currentEffects: { ...useVoiceStore.getState().currentEffects, pitch: 0, reverb: 0 },
    });
});

describe('quand le PNJ a une voix enregistrée', () => {
    it('on la repose, telle quelle', () => {
        useVoiceStore.getState().syncWithNpc(personnage({ voiceProfile: profilRegle }));

        const apres = useVoiceStore.getState();
        expect(apres.currentEffects.pitch).toBe(7);
        expect(apres.currentEffects.reverb).toBe(0.42);
        expect(apres.lastSyncedEntityName).toBe('Asha');
    });

    it('les mots-clés ne passent pas devant', () => {
        // Le mot « spectre » appellerait le preset `ghost` ; le profil du meneur
        // gagne, et c'est tout l'objet de ce changement.
        useVoiceStore.getState().syncWithNpc(personnage({
            name: 'Le Spectre',
            voiceProfile: profilRegle,
        }));

        expect(useVoiceStore.getState().currentEffects.pitch).toBe(7);
        expect(useVoiceStore.getState().activePresetId).toBeNull();
    });
});

describe('quand le PNJ n\'a jamais eu de voix réglée', () => {
    it('on retombe sur les mots-clés, comme avant', () => {
        useVoiceStore.getState().syncWithNpc(personnage({ name: 'Le Spectre du marais' }));

        expect(useVoiceStore.getState().activePresetId).toBe('ghost');
    });

    it('les mots-clés lisent aussi les traits, pas seulement le nom', () => {
        useVoiceStore.getState().syncWithNpc(personnage({ traits: { espece: 'Androïde' } }));

        expect(useVoiceStore.getState().activePresetId).toBe('robot');
    });
});

describe('les garde-fous d\'avant, intacts', () => {
    it('ne fait rien quand la synchronisation est éteinte', () => {
        useVoiceStore.setState({ isSyncNPC: false });
        useVoiceStore.getState().syncWithNpc(personnage({ voiceProfile: profilRegle }));

        expect(useVoiceStore.getState().currentEffects.pitch).toBe(0);
    });

    it('ne repose rien deux fois pour le même PNJ', () => {
        // Sans quoi le rack se remettrait au profil à chaque rendu, et les
        // curseurs seraient inutilisables tant que la fiche est ouverte.
        useVoiceStore.setState({ lastSyncedEntityId: 'e-1' });
        useVoiceStore.getState().syncWithNpc(personnage({ voiceProfile: profilRegle }));

        expect(useVoiceStore.getState().currentEffects.pitch).toBe(0);
    });
});
