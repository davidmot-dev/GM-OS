import { describe, it, expect } from 'vitest';
import { demanderLAtelierDesRegles, prendreLaDemande } from './ouvertureDeLaForge';

describe('la demande d’ouverture de la Forge', () => {
    it('mène une fois à l’atelier des règles, puis s’efface', () => {
        demanderLAtelierDesRegles();
        expect(prendreLaDemande()).toBe('rules');
        expect(prendreLaDemande(), 'une demande qui reste posée rouvrirait l’atelier à chaque visite').toBeNull();
    });

    it('sans demande, la Forge s’ouvre comme d’habitude', () => {
        expect(prendreLaDemande()).toBeNull();
    });
});
