import { describe, it, expect } from 'vitest';
import { adresseNavigable } from './navigateurIntegre';

/** Ce qui entre dans la page intégrée du navigateur — L6, 2026-10-03. */
describe('le navigateur intégré', () => {
    it('laisse entrer le web', () => {
        expect(adresseNavigable('https://srd.example.org/regles')).toBe(true);
        expect(adresseNavigable('http://192.168.1.20:8080/')).toBe(true);
    });

    it('refuse tout ce qui ouvrirait autre chose que le web', () => {
        expect(adresseNavigable('file:///C:/Users/david/AppData/Roaming/gm-os-v5/')).toBe(false);
        expect(adresseNavigable('gmos://media/carte.png')).toBe(false);
        expect(adresseNavigable('javascript:alert(1)')).toBe(false);
        expect(adresseNavigable('data:text/html,<script></script>')).toBe(false);
    });

    it("refuse ce qui n'est pas une adresse", () => {
        expect(adresseNavigable(undefined)).toBe(false);
        expect(adresseNavigable('')).toBe(false);
        expect(adresseNavigable('srd.example.org')).toBe(false);
    });
});
