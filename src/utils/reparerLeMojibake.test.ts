import { describe, expect, it } from 'vitest';
import { reparerLeMojibake } from './reparerLeMojibake';

describe('reparerLeMojibake', () => {
    it("rend l'emoji du rapport de combat tel que la sauvegarde du 22/09 le porte", () => {
        // Les octets relevés dans la sauvegarde : « âš”ï¸ » suivi du contrôle U+008F.
        expect(reparerLeMojibake('### âš”ï¸\u008F Rapport de Combat'))
            .toBe('### ⚔️ Rapport de Combat');
    });

    it('rend les accents et le tiret cadratin', () => {
        expect(reparerLeMojibake('DÃ©gÃ¢ts â€” fin')).toBe('Dégâts — fin');
    });

    it('laisse intact un texte français juste', () => {
        const juste = 'Déjà vu, à côté — « Où ? » ²⁄ ô Â ÿ';
        expect(reparerLeMojibake(juste)).toBe(juste);
    });

    it('laisse intact un emoji juste', () => {
        expect(reparerLeMojibake('### ⚔️ Rapport de Combat')).toBe('### ⚔️ Rapport de Combat');
    });

    it('rend le vide tel quel', () => {
        expect(reparerLeMojibake('')).toBe('');
        expect(reparerLeMojibake(undefined)).toBeUndefined();
    });
});
