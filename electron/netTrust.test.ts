import { describe, it, expect } from 'vitest';
import { isPrivateHost, shouldRejectUnauthorized } from './netTrust';

describe('isPrivateHost — adresses privées', () => {
    it('reconnaît la boucle locale', () => {
        expect(isPrivateHost('localhost')).toBe(true);
        expect(isPrivateHost('127.0.0.1')).toBe(true);
        expect(isPrivateHost('127.1.2.3')).toBe(true);
        expect(isPrivateHost('::1')).toBe(true);
    });

    it('reconnaît les plages RFC 1918', () => {
        expect(isPrivateHost('10.0.0.1')).toBe(true);
        expect(isPrivateHost('192.168.0.21')).toBe(true);
        expect(isPrivateHost('172.16.0.1')).toBe(true);
        expect(isPrivateHost('172.31.255.255')).toBe(true);
    });

    it('reconnaît le lien-local et les noms du réseau domestique', () => {
        expect(isPrivateHost('169.254.10.1')).toBe(true);
        expect(isPrivateHost('hue-bridge.local')).toBe(true);
        expect(isPrivateHost('nas.home.arpa')).toBe(true);
        expect(isPrivateHost('fe80::1')).toBe(true);
        expect(isPrivateHost('fd00::1234')).toBe(true);
    });

    it('reconnaît une IPv4 encapsulée en IPv6', () => {
        expect(isPrivateHost('::ffff:192.168.0.21')).toBe(true);
        expect(isPrivateHost('::ffff:8.8.8.8')).toBe(false);
    });

    it('accepte la forme entre crochets', () => {
        expect(isPrivateHost('[::1]')).toBe(true);
    });
});

describe('isPrivateHost — adresses publiques', () => {
    it('refuse les hôtes Internet', () => {
        expect(isPrivateHost('generativelanguage.googleapis.com')).toBe(false);
        expect(isPrivateHost('api.anthropic.com')).toBe(false);
        expect(isPrivateHost('8.8.8.8')).toBe(false);
    });

    it('refuse les plages voisines mais publiques', () => {
        expect(isPrivateHost('172.15.0.1')).toBe(false);
        expect(isPrivateHost('172.32.0.1')).toBe(false);
        expect(isPrivateHost('11.0.0.1')).toBe(false);
        expect(isPrivateHost('192.169.0.1')).toBe(false);
    });

    it('refuse un domaine qui imite une IP privée', () => {
        // Le piège : un attaquant enregistre ce domaine pour se faire passer
        // pour du réseau local et récupérer la tolérance TLS.
        expect(isPrivateHost('192.168.0.21.evil.com')).toBe(false);
        expect(isPrivateHost('127.0.0.1.attacker.net')).toBe(false);
        expect(isPrivateHost('localhost.evil.com')).toBe(false);
    });

    it('refuse un domaine qui imite un suffixe local', () => {
        expect(isPrivateHost('evil.local.com')).toBe(false);
    });

    it('refuse les entrées vides ou malformées', () => {
        expect(isPrivateHost('')).toBe(false);
        expect(isPrivateHost('192.168.0')).toBe(false);
        expect(isPrivateHost('192.168.0.256')).toBe(false);
        expect(isPrivateHost('192.168.0.0x21')).toBe(false);
    });
});

describe('shouldRejectUnauthorized', () => {
    it('exige un certificat valide des hôtes publics', () => {
        expect(shouldRejectUnauthorized(new URL('https://api.anthropic.com/v1/messages'))).toBe(true);
        expect(shouldRejectUnauthorized(new URL('https://generativelanguage.googleapis.com/v1beta/models'))).toBe(true);
    });

    it('tolère un certificat auto-signé sur le réseau local', () => {
        expect(shouldRejectUnauthorized(new URL('https://192.168.0.21:11436/v1'))).toBe(false);
        expect(shouldRejectUnauthorized(new URL('http://127.0.0.1:11434/api/chat'))).toBe(false);
        expect(shouldRejectUnauthorized(new URL('https://192.168.1.50/api/abc/lights'))).toBe(false);
    });

    it('ignore le port dans la décision', () => {
        expect(shouldRejectUnauthorized(new URL('https://api.custom.com:8443/v1'))).toBe(true);
    });
});
