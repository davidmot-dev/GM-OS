import { describe, it, expect } from 'vitest';
import { fournirRandomUUID, uuidDepuisLeHasard } from './randomUUIDHorsContexteSur';

/**
 * Ce que ces essais protègent : sur une tablette servie en `http`, le navigateur
 * retient `crypto.randomUUID` (contexte non sûr) et le lancer du panneau de jet
 * ne faisait rien (David, Argyropée, 11/11/2026).
 */

const FORME_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Un `crypto` de navigateur hors contexte sûr : le hasard, pas l'UUID. */
const cryptoSansUuid = () => ({ getRandomValues: <T extends ArrayBufferView>(t: T) => globalThis.crypto.getRandomValues(t) }) as unknown as Crypto;

describe('randomUUID hors contexte sûr', () => {
    it('un UUID version 4 bien formé, à partir de seize octets', () => {
        expect(uuidDepuisLeHasard(new Uint8Array(16))).toBe('00000000-0000-4000-8000-000000000000');
        expect(uuidDepuisLeHasard(new Uint8Array(16).fill(255))).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    });

    it('fournit randomUUID quand le navigateur le retient', () => {
        const c = cryptoSansUuid();
        expect(fournirRandomUUID(c)).toBe(true);
        const tires = Array.from({ length: 200 }, () => c.randomUUID());
        for (const u of tires) expect(u).toMatch(FORME_V4);
        expect(new Set(tires).size).toBe(tires.length);
    });

    it('ne remplace jamais celui du navigateur', () => {
        const natif = () => '11111111-1111-4111-8111-111111111111' as const;
        const c = { ...cryptoSansUuid(), randomUUID: natif } as unknown as Crypto;
        expect(fournirRandomUUID(c)).toBe(false);
        expect(c.randomUUID).toBe(natif);
    });

    it('sans hasard du tout, ne fabrique rien', () => {
        expect(fournirRandomUUID({} as Crypto)).toBe(false);
        expect(fournirRandomUUID(undefined)).toBe(false);
    });
});
