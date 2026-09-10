import { describe, it, expect } from 'vitest';
import { poserLaCle, identifiantDuSecret } from './clesDesFournisseurs';

/**
 * **La clé est posée par le processus principal, jamais transportée.**
 *
 * L'appariement clé ↔ hôte fermait le cas de la clé partie au mauvais endroit.
 * Il ne fermait pas le mélange entre fournisseurs : rien n'empêchait un appel
 * déclaré `custom` de porter la clé d'Anthropic, puisque c'est l'écran qui
 * assemblait les en-têtes. Ici, l'écran ne les assemble plus.
 */

/** Un coffre de test : une carte, pas un fichier. */
const coffre = (entrees: Record<string, string>) =>
    (id: string) => entrees[id] ?? null;

const CLES = {
    'ai-key-anthropic': 'sk-ant-secret',
    'ai-key-gemini': 'AIza-secret',
    'ai-key-custom': 'tok-maison',
    'ai-key-image': 'cf-jeton',
};

describe('chaque fournisseur pose sa clé où son API l’attend', () => {
    it('Anthropic : en-tête x-api-key', () => {
        const r = poserLaCle('anthropic', 'https://api.anthropic.com/v1/messages', {}, coffre(CLES));
        expect(r.prete).toBe(true);
        expect(r.prete === true && r.entetes['x-api-key']).toBe('sk-ant-secret');
    });

    /*
      Le cas qui interdit une fonction unique : Gemini ne lit aucun en-tête, sa
      clé est un paramètre de l'URL. C'est aussi le plus exposé — une URL part
      dans les journaux du serveur d'en face.
    */
    it('Gemini : paramètre `key` de l’URL', () => {
        const r = poserLaCle(
            'gemini',
            'https://generativelanguage.googleapis.com/v1beta/models/x:generateContent',
            {},
            coffre(CLES),
        );
        expect(r.prete).toBe(true);
        expect(r.prete === true && new URL(r.url).searchParams.get('key')).toBe('AIza-secret');
        expect(r.prete === true && r.entetes).toEqual({});
    });

    it('Custom et Cloudflare : Authorization Bearer', () => {
        const c = poserLaCle('custom', 'https://api.together.xyz/v1/chat', {}, coffre(CLES));
        expect(c.prete === true && c.entetes.Authorization).toBe('Bearer tok-maison');

        const i = poserLaCle('image-cloudflare', 'https://api.cloudflare.com/client/v4/x', {}, coffre(CLES));
        expect(i.prete === true && i.entetes.Authorization).toBe('Bearer cf-jeton');
    });

    /* Le proxy ne sert pas Ollama, et le réseau local n'a pas de clé à égarer. */
    it('Ollama : rien à poser', () => {
        const r = poserLaCle('ollama', 'http://127.0.0.1:11434/api/chat', {}, coffre({}));
        expect(r.prete).toBe(true);
        expect(r.prete === true && r.entetes).toEqual({});
    });
});

describe('les en-têtes déjà présents sont préservés', () => {
    it('ajoute la clé sans effacer le Content-Type', () => {
        const r = poserLaCle(
            'anthropic',
            'https://api.anthropic.com/v1/messages',
            { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
            coffre(CLES),
        );
        expect(r.prete === true && r.entetes).toEqual({
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': 'sk-ant-secret',
        });
    });

    /*
      `searchParams.set` remplace au lieu d'ajouter. Sans ça, une URL où un
      `?key=` traînerait partirait avec DEUX clés, et le serveur choisirait —
      probablement la première, c'est-à-dire la mauvaise.
    */
    it('remplace un `key` déjà présent plutôt que d’en ajouter un second', () => {
        const r = poserLaCle(
            'gemini',
            'https://generativelanguage.googleapis.com/v1beta/models?key=ANCIENNE',
            {},
            coffre(CLES),
        );
        expect(r.prete).toBe(true);
        const params = r.prete === true ? new URL(r.url).searchParams.getAll('key') : [];
        expect(params).toEqual(['AIza-secret']);
    });
});

describe('la clé absente', () => {
    /* Anthropic et Gemini ne répondent à rien sans clé : le dire ici vaut mieux
       qu'un 401 illisible trois écrans plus loin. */
    it('est refusée, avec le nom de l’entrée manquante', () => {
        const r = poserLaCle('anthropic', 'https://api.anthropic.com/v1/messages', {}, coffre({}));
        expect(r.prete).toBe(false);
        expect(r.prete === false && r.raison).toContain('ai-key-anthropic');
        expect(r.prete === false && r.raison).toContain('réglages');
    });

    /*
      ⚠️ Sauf pour `custom` : un serveur d'inférence maison ne demande pas de
      clé, et refuser l'appel casserait un usage réel.
    */
    it('reste admise pour `custom`, dont l’endpoint peut être ouvert', () => {
        const r = poserLaCle('custom', 'http://192.168.0.42:8080/v1/chat', {}, coffre({}));
        expect(r.prete).toBe(true);
        expect(r.prete === true && r.entetes.Authorization).toBeUndefined();
    });

    it('ne prend pas une chaîne vide pour une clé', () => {
        const r = poserLaCle('gemini', 'https://generativelanguage.googleapis.com/v1', {}, coffre({ 'ai-key-gemini': '   ' }));
        expect(r.prete).toBe(false);
    });
});

describe('l’identifiant du coffre', () => {
    /*
      ⚠️ Le jeton d'image est rangé sous `ai-key-image` et non
      `ai-key-image-cloudflare` : c'est ce qu'écrit `useAIStore` depuis toujours,
      et le renommer viderait le coffre des meneurs qui l'ont déjà saisi.
    */
    it('suit ce que le magasin écrit déjà, jeton d’image compris', () => {
        expect(identifiantDuSecret('anthropic')).toBe('ai-key-anthropic');
        expect(identifiantDuSecret('image-cloudflare')).toBe('ai-key-image');
        expect(identifiantDuSecret('ollama')).toBeNull();
    });
});
