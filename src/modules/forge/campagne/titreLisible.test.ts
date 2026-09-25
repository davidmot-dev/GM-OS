import { describe, it, expect } from 'vitest';
import { titreLisible, memeTitreSansEspaces } from './titreLisible';

/**
 * **Les titres en capitales espacées d'un PDF redeviennent lisibles.**
 *
 * Le cas réel : les cinq actes d'« Anges de Feu » (*Fiery Angels*), forgés le
 * 2026-09-24 — trouvés par David dans le graphe de la trame le 2026-09-25.
 */

describe('titreLisible', () => {
    /** **Les cinq titres du livre, tels que la fiche de structure les porte.** */
    it('recolle les lettres, garde les mots, et retire les dièses', () => {
        expect(titreLisible('S TA R T I N G  S C E N E')).toBe('Starting Scene');
        expect(titreLisible('B R I E F I N G')).toBe('Briefing');
        expect(titreLisible('### T H E  I N V E S T I G A T I O N')).toBe('The Investigation');
        expect(titreLisible('### F I N A L  C O N F R O N T A T I O N')).toBe('Final Confrontation');
        expect(titreLisible('### A F T E R M A T H')).toBe('Aftermath');
    });

    it('supporte une lettre collée à sa voisine — « E M PAT H Y »', () => {
        expect(titreLisible('TA K I N G  T H E  E M PAT H Y  T E S T')).toBe('Taking The Empathy Test');
    });

    it('ne touche pas un titre ordinaire', () => {
        expect(titreLisible('Le secret de Milo')).toBe('Le secret de Milo');
        expect(titreLisible('A la claire fontaine')).toBe('A la claire fontaine');
        expect(titreLisible('Acte I — La Chute de Carthag')).toBe('Acte I — La Chute de Carthag');
    });

    it('garde la casse d’un titre qui n’était pas tout en capitales', () => {
        expect(titreLisible('RUNNING FROM THE LAW')).toBe('RUNNING FROM THE LAW');
    });

    it('retire les dièses d’un titre ordinaire aussi', () => {
        expect(titreLisible('### Les Ruines')).toBe('Les Ruines');
    });
});

describe('memeTitreSansEspaces', () => {
    /**
     * L'acte en base a perdu ses doubles espaces (`cellule()` les réduit) : il
     * doit encore être reconnu, sinon reforger créerait un doublon.
     */
    it('reconnaît l’acte réduit en base sous son titre lisible', () => {
        expect(memeTitreSansEspaces('S TA R T I N G S C E N E', 'Starting Scene')).toBe(true);
        expect(memeTitreSansEspaces('### T H E I N V E S T I G A T I O N', 'The Investigation')).toBe(true);
    });

    it('ne confond pas deux titres différents', () => {
        expect(memeTitreSansEspaces('Briefing', 'Aftermath')).toBe(false);
        expect(memeTitreSansEspaces('', '')).toBe(false);
    });
});
