import { describe, it, expect } from 'vitest';
import { adresseDeLaBarre } from './adresseDeLaBarre';

describe('la barre d’adresse du navigateur', () => {
    it('ajoute le protocole qu’on ne tape pas', () => {
        expect(adresseDeLaBarre('srd.exemple.org')).toBe('https://srd.exemple.org/');
        expect(adresseDeLaBarre('  5thsrd.org/spells  ')).toBe('https://5thsrd.org/spells');
    });

    it('garde une adresse complète, normalisée comme celle que la page rapporte', () => {
        expect(adresseDeLaBarre('https://5thsrd.org')).toBe('https://5thsrd.org/');
        expect(adresseDeLaBarre('http://192.168.1.20:8080/regles')).toBe('http://192.168.1.20:8080/regles');
    });

    it('ne fait rien de ce qui n’est pas du web', () => {
        expect(adresseDeLaBarre('file:///C:/Windows')).toBeNull();
        expect(adresseDeLaBarre('javascript:alert(1)')).toBeNull();
        expect(adresseDeLaBarre('')).toBeNull();
        expect(adresseDeLaBarre('deux mots')).toBeNull();
    });
});
