import { describe, it, expect } from 'vitest';
import { fichierValide, adresseDeLaBanniere } from './banniereDuPilote';

describe('la bannière du pilote (2026-10-03)', () => {
    it('un nom d’image du dossier, rien d’autre', () => {
        expect(fichierValide('Blade Runner Band.jpg')).toBe('Blade Runner Band.jpg');
        expect(fichierValide('bandeau.WEBP')).toBe('bandeau.WEBP');
        expect(fichierValide('../secret.jpg')).toBeNull();
        expect(fichierValide('theme/fond.png')).toBeNull();
        expect(fichierValide('notes.md')).toBeNull();
        expect(fichierValide('  ')).toBeNull();
        expect(fichierValide(undefined)).toBeNull();
    });

    it('l’adresse gmos encode chaque segment — les noms ont des espaces', () => {
        expect(adresseDeLaBanniere('systems/blade-runner', 'Blade Runner Band.jpg'))
            .toBe('gmos://media/docs/systems/blade-runner/Blade%20Runner%20Band.jpg');
        expect(adresseDeLaBanniere('systems/cthulhu hack', 'Cthulhu-Hack Band.jpg'))
            .toBe('gmos://media/docs/systems/cthulhu%20hack/Cthulhu-Hack%20Band.jpg');
    });

    it('sans fichier valide ou sans dossier, pas d’adresse', () => {
        expect(adresseDeLaBanniere('systems/alien', undefined)).toBeNull();
        expect(adresseDeLaBanniere('', 'fond.jpg')).toBeNull();
        expect(adresseDeLaBanniere('systems/alien', '../../x.jpg')).toBeNull();
    });
});
