import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { verdictDeLHote } from './hotesDesFournisseurs';

/**
 * **L'appariement clé ↔ hôte du proxy IA.**
 *
 * `ai:proxy-request` transmettait une URL arbitraire avec les en-têtes qu'on lui
 * donnait — et les clés voyagent dedans. Ces tests fixent la règle : un
 * fournisseur dont l'hôte est connu ne joint que celui-là, un fournisseur libre
 * l'est **explicitement**, et tout le reste est refusé.
 */

describe('les fournisseurs à hôte connu', () => {
    it('laissent passer leur propre hôte', () => {
        expect(verdictDeLHote('anthropic', 'https://api.anthropic.com/v1/messages').admis).toBe(true);
        expect(verdictDeLHote('gemini', 'https://generativelanguage.googleapis.com/v1beta/models').admis).toBe(true);
        expect(verdictDeLHote('image-cloudflare', 'https://api.cloudflare.com/client/v4/accounts/x/ai/run/y').admis).toBe(true);
    });

    /*
      Le cas qui motive tout : la clé Gemini est DANS l'URL (`?key=…`). Un envoi
      vers le mauvais hôte ne fuite pas seulement la requête, il livre la clé au
      serveur d'en face, qui l'écrit dans ses journaux.
    */
    it('refusent un autre hôte, même quand la clé est dans l’URL', () => {
        const verdict = verdictDeLHote(
            'gemini',
            'https://ailleurs.example.com/v1beta/models/x:generateContent?key=SECRET',
        );
        expect(verdict.admis).toBe(false);
        expect(verdict.admis === false && verdict.raison).toContain('gemini');
    });

    /*
      La comparaison est EXACTE, pas par suffixe : ce nom se termine bien par
      `api.anthropic.com` et appartient à quelqu'un d'autre.
    */
    it('refusent un hôte qui se contente de finir par le bon nom', () => {
        expect(verdictDeLHote('anthropic', 'https://api.anthropic.com.piege.net/v1/messages').admis).toBe(false);
    });

    it('ignorent la casse de l’hôte', () => {
        expect(verdictDeLHote('anthropic', 'https://API.Anthropic.COM/v1/messages').admis).toBe(true);
    });
});

describe('les fournisseurs à hôte libre', () => {
    /*
      `custom` existe pour joindre l'endpoint que le meneur nomme — Together, un
      serveur maison, autre chose. Le lui interdire supprimerait sa fonction.
    */
    it('laissent passer ce que le meneur a nommé', () => {
        expect(verdictDeLHote('custom', 'https://api.together.xyz/v1/chat/completions').admis).toBe(true);
        expect(verdictDeLHote('custom', 'http://192.168.0.42:8080/v1/chat').admis).toBe(true);
        expect(verdictDeLHote('ollama', 'http://127.0.0.1:11434/api/chat').admis).toBe(true);
    });
});

describe('ce que la table ne prévoit pas', () => {
    /*
      La distinction qui fait tout le sens de ce module : un fournisseur
      **oublié** est refusé, un fournisseur **libre** est admis. Un chemin réseau
      ajouté sans passer par la table échoue donc au développement, pas en séance.

      `openai` est le cas réel : il existe dans les réglages, aucun appel ne
      passe par le proxy pour lui, et il n'a donc pas d'entrée.
    */
    it('refuse un fournisseur absent de la table', () => {
        const verdict = verdictDeLHote('openai', 'https://api.openai.com/v1/chat/completions');
        expect(verdict.admis).toBe(false);
        expect(verdict.admis === false && verdict.raison).toContain('hotesDesFournisseurs');
    });

    it('refuse une URL illisible plutôt que de la laisser partir', () => {
        expect(verdictDeLHote('gemini', 'pas une url').admis).toBe(false);
    });

    /* `hasOwnProperty` et non `in` : sans ça, `toString` serait un fournisseur. */
    it('ne prend pas une propriété héritée pour un fournisseur', () => {
        expect(verdictDeLHote('toString', 'https://exemple.test/').admis).toBe(false);
        expect(verdictDeLHote('constructor', 'https://exemple.test/').admis).toBe(false);
    });
});

describe('le refus est toujours motivé', () => {
    /* Un refus qu'on ne sait pas expliquer se fait désactiver à la première
       fausse alerte. Le motif part dans le journal d'audit. */
    it('porte une raison lisible dans chaque cas', () => {
        for (const [f, u] of [
            ['gemini', 'https://ailleurs.example.com/'],
            ['openai', 'https://api.openai.com/'],
            ['gemini', 'pas une url'],
        ] as const) {
            const verdict = verdictDeLHote(f, u);
            expect(verdict.admis).toBe(false);
            expect(verdict.admis === false && verdict.raison.length).toBeGreaterThan(20);
        }
    });
});

describe('le handler s’en sert, et avant d’envoyer', () => {
    /*
      Même parti pris que `demandeDeLEtatCourant` : on lit le source. Ce test ne
      prouve pas qu'un appel est refusé — il dit que le contrôle est **branché**
      et qu'il vient AVANT la requête. Un contrôle posé après l'envoi ne protège
      rien : la clé est déjà partie.
    */
    const MAIN = fs.readFileSync(path.join(__dirname, 'main.ts'), 'utf-8');

    it('appelle le verdict dans le handler du proxy', () => {
        expect(MAIN).toContain('verdictDeLHote(fournisseur, url)');
    });

    it('journalise le refus', () => {
        expect(MAIN).toMatch(/if \(!verdict\.admis\)[\s\S]{0,200}auditDenied/);
    });

    it('vérifie avant d’ouvrir la requête réseau', () => {
        const controle = MAIN.indexOf('verdictDeLHote(fournisseur, url)');
        const envoi = MAIN.indexOf('lib.request(', controle);

        expect(controle, 'le contrôle est branché').toBeGreaterThan(-1);
        expect(envoi, 'la requête réseau suit').toBeGreaterThan(-1);
        expect(envoi).toBeGreaterThan(controle);
    });
});
