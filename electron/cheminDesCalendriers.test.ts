import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { cheminDUnCalendrier, racineDesCalendriers } from './cheminDesCalendriers';

/**
 * **Le confinement du dossier des calendriers.**
 *
 * ⛔ **La fuite existait déjà en lecture.** `clock:load-calendar` composait
 * `path.join(appRoot, 'databases', 'calendars', id + '.json')` avec un `id` venu
 * du renderer, sans rien regarder. Tant que personne n'écrivait, le pire était
 * de lire un JSON qu'on n'aurait pas dû lire ; **le jour où l'Atelier écrit, la
 * même forme écrase n'importe quel fichier du dépôt.**
 *
 * *On ne branche pas une écriture sur un chemin qu'on ne contient pas.*
 */

const RACINE = process.platform === 'win32' ? 'C:\\app' : '/app';
const dossier = racineDesCalendriers(RACINE);

describe('cheminDUnCalendrier — ce qui passe', () => {
    it('accepte un identifiant simple', () => {
        expect(cheminDUnCalendrier(RACINE, 'harptos'))
            .toBe(path.join(dossier, 'harptos.json'));
    });

    it('accepte les tirets, les chiffres et le soulignement', () => {
        expect(cheminDUnCalendrier(RACINE, 'an-du-dragon_2')).not.toBeNull();
    });

    it('ignore les espaces autour', () => {
        expect(cheminDUnCalendrier(RACINE, '  harptos  '))
            .toBe(path.join(dossier, 'harptos.json'));
    });
});

describe('⛔ cheminDUnCalendrier — ce qui est refusé', () => {
    /** La traversée, celle qui écrasait un fichier du dépôt. */
    it.each([
        '..',
        '../secret',
        '../../package',
        'sous/dossier',
        'sous\\dossier',
    ])('refuse « %s »', (id) => {
        expect(cheminDUnCalendrier(RACINE, id)).toBeNull();
    });

    it('refuse un identifiant vide', () => {
        expect(cheminDUnCalendrier(RACINE, '')).toBeNull();
        expect(cheminDUnCalendrier(RACINE, '   ')).toBeNull();
        expect(cheminDUnCalendrier(RACINE, '.')).toBeNull();
    });

    it('refuse un octet nul', () => {
        expect(cheminDUnCalendrier(RACINE, 'har\0ptos')).toBeNull();
    });

    /**
     * ⚠️ Windows refuse ces caractères. Les laisser passer ferait échouer
     * l'écriture avec un message système que personne ne relie à la saisie.
     */
    it.each([':', '*', '?', '"', '<', '>', '|'])('refuse le caractère « %s »', (c) => {
        expect(cheminDUnCalendrier(RACINE, `har${c}ptos`)).toBeNull();
    });

    /**
     * ⚠️ **Un seul niveau, et pas seulement « sous la racine ».** Un fichier
     * imbriqué que `list-calendars` ne montrerait jamais serait un calendrier
     * qu'on peut écrire et jamais relire.
     */
    it('reste à plat, comme le listage', () => {
        const chemin = cheminDUnCalendrier(RACINE, 'harptos');
        expect(path.dirname(chemin!)).toBe(path.resolve(dossier));
    });
});
