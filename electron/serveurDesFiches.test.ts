import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { cheminServi, PORT_DES_FICHES } from './serveurDesFiches';

/**
 * **Le périmètre du serveur des fiches.**
 *
 * Il écoute sur `0.0.0.0` : *il voit passer ce que le réseau lui envoie, pas ce
 * qu'on avait prévu.* `cheminServi` est la seule fonction qui décide quoi que ce
 * soit, et c'est elle qu'on éprouve — sans ouvrir de socket.
 */

const DOCS = path.resolve('C:', 'gm-os', 'docs');
const sous = (...bouts: string[]) => path.resolve(DOCS, ...bouts);

describe('cheminServi — ce qu’il accepte', () => {
    it('sert le moteur et les fiches', () => {
        expect(cheminServi('/fiches/Character_Sheet_Manager.html', DOCS))
            .toBe(sous('fiches', 'Character_Sheet_Manager.html'));
        expect(cheminServi('/fiches/Blade%20Runner/BRN.html', DOCS))
            .toBe(sous('fiches', 'Blade Runner', 'BRN.html'));
    });

    /** La tablette n'a pas `readDoc` : c'est le seul moyen pour elle de lire la table. */
    it('sert les tables de correspondance', () => {
        expect(cheminServi('/systems/blade-runner/fiche/correspondance.json', DOCS))
            .toBe(sous('systems', 'blade-runner', 'fiche', 'correspondance.json'));
    });

    it('coupe la query string et l’ancre', () => {
        expect(cheminServi('/fiches/Character_Sheet_Manager.html?v=2#page', DOCS))
            .toBe(sous('fiches', 'Character_Sheet_Manager.html'));
    });
});

describe('cheminServi — ce qu’il refuse', () => {
    /**
     * Le refus qui compte. La query se coupe **avant** décodage : sinon
     * `?x=%2E%2E%2F` repasse dans le chemin après coup.
     */
    it('refuse de sortir de docs/, quelle que soit l’écriture', () => {
        for (const url of [
            '/fiches/../../secrets.html',
            '/fiches/..%2F..%2Fsecrets.html',
            '/fiches/%2e%2e%2f%2e%2e%2fsecrets.html',
            '/systems/../../.env.json',
        ]) {
            expect(cheminServi(url, DOCS), url).toBeNull();
        }
    });

    it('refuse tout ce qui n’est pas une des deux routes', () => {
        for (const url of [
            '/', '/index.html', '/media/carte.png', '/sessions/gmos-session.json',
            '/Fiches/x.html', 'fiches/x.html',
        ]) {
            expect(cheminServi(url, DOCS), url).toBeNull();
        }
    });

    /** Une route ne sert qu'une extension : pas de HTML sous `/systems/`, et l'inverse. */
    it('refuse une extension qui n’est pas celle de la route', () => {
        expect(cheminServi('/fiches/notes.json', DOCS)).toBeNull();
        expect(cheminServi('/systems/blade-runner/fiche/page.html', DOCS)).toBeNull();
        expect(cheminServi('/fiches/moteur.html.txt', DOCS)).toBeNull();
        expect(cheminServi('/fiches/moteur', DOCS)).toBeNull();
    });

    it('refuse un octet nul et un pourcentage mal formé', () => {
        expect(cheminServi('/fiches/x\0.html', DOCS)).toBeNull();
        expect(cheminServi('/fiches/%ZZ.html', DOCS)).toBeNull();
        expect(cheminServi('', DOCS)).toBeNull();
    });
});

describe('le port', () => {
    /**
     * **C'est toute la raison d'être de ce module.** Le même port que le
     * `SyncServer` remettrait la fiche sur l'origine du Player Hub, avec accès à
     * son stockage — ce qu'un port distinct évite pour le même prix.
     */
    it('n’est pas celui du SyncServer', () => {
        expect(PORT_DES_FICHES).not.toBe(3001);
    });
});
