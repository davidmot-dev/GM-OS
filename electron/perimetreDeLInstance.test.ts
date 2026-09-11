import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
    racineDuCorpus, coffreObsidian, appareilsMuets,
    COFFRE_OBSIDIAN_PAR_DEFAUT,
    VARIABLE_RACINE_DOCS, VARIABLE_COFFRE_OBSIDIAN, VARIABLE_SANS_APPAREILS,
} from './perimetreDeLInstance';

/**
 * **Le périmètre d'une instance.**
 *
 * Ce que ces tests gardent avant tout : **rien ne bouge pour qui ne règle
 * rien**. Un meneur qui lance GM-OS sans variable retrouve son corpus, son
 * coffre et ses lampes.
 */

const APP_ROOT = 'C:\\Projet_David\\GM-OS-v5';

describe('sans variable, rien ne change', () => {
    it('le corpus reste dans le dépôt', () => {
        expect(racineDuCorpus({}, APP_ROOT)).toBe(path.join(APP_ROOT, 'docs'));
    });

    it('le coffre reste celui du meneur', () => {
        expect(coffreObsidian({})).toBe(COFFRE_OBSIDIAN_PAR_DEFAUT);
    });

    it('les appareils répondent', () => {
        expect(appareilsMuets({})).toBe(false);
    });

    /* Une variable posée mais vide n'est pas un choix. */
    it('une variable vide se lit comme absente', () => {
        expect(racineDuCorpus({ [VARIABLE_RACINE_DOCS]: '   ' }, APP_ROOT)).toBe(path.join(APP_ROOT, 'docs'));
        expect(coffreObsidian({ [VARIABLE_COFFRE_OBSIDIAN]: '' })).toBe(COFFRE_OBSIDIAN_PAR_DEFAUT);
        expect(appareilsMuets({ [VARIABLE_SANS_APPAREILS]: '  ' })).toBe(false);
    });
});

describe('avec variable', () => {
    it('déplace le corpus', () => {
        expect(racineDuCorpus({ [VARIABLE_RACINE_DOCS]: 'D:\\essai\\docs' }, APP_ROOT))
            .toBe('D:\\essai\\docs');
    });

    it('déplace le coffre', () => {
        expect(coffreObsidian({ [VARIABLE_COFFRE_OBSIDIAN]: 'D:\\essai\\coffre' }))
            .toBe('D:\\essai\\coffre');
    });

    it('retire les espaces autour du chemin', () => {
        expect(racineDuCorpus({ [VARIABLE_RACINE_DOCS]: '  D:\\essai  ' }, APP_ROOT)).toBe('D:\\essai');
    });
});

describe('l’interrupteur des appareils', () => {
    it.each(['1', 'true', 'TRUE', 'oui', 'Oui'])('« %s » les rend muets', (valeur) => {
        expect(appareilsMuets({ [VARIABLE_SANS_APPAREILS]: valeur })).toBe(true);
    });

    /*
      ⚠️ Le sens prudent, et il mérite d'être explicite : une valeur inattendue
      laisse les appareils RÉPONDRE. Mieux vaut qu'une variable mal écrite se
      remarque — les lampes s'allument — plutôt qu'elle ne se cache, le test
      passant en silence sans avoir rien piloté.
    */
    it.each(['0', 'false', 'non', 'yes', 'ouii', 'vrai'])('« %s » les laisse répondre', (valeur) => {
        expect(appareilsMuets({ [VARIABLE_SANS_APPAREILS]: valeur })).toBe(false);
    });
});

describe('le périmètre est réellement branché', () => {
    /*
      ⛔ **Une variable posée n'est pas une variable prise.**

      Les assertions de bout en bout vérifient que l'environnement porte les
      trois variables — pas que l'application les honore. Ce contrôle-ci lit le
      source des trois appelants, dans l'idiome de `verrouDuCheminDeDonnees` :
      *ce matin, un contrôle dont le motif ne correspondait jamais est resté vert
      pendant que je le croyais actif.*
    */
    const lire = async (fichier: string) => {
        const fs = await import('node:fs');
        const { fileURLToPath } = await import('node:url');
        return fs.readFileSync(fileURLToPath(new URL(`./${fichier}`, import.meta.url)), 'utf-8');
    };

    it('le corpus passe par `racineDuCorpus`, des deux côtés', async () => {
        const rag = await lire('RAGEngine.ts');
        const main = await lire('main.ts');

        expect(rag, "l'Oracle et la Forge lisent le corpus d'ici").toContain('racineDuCorpus(');
        expect(rag, 'le chemin ne doit plus être recomposé à la main').not.toMatch(/path\.join\([^)]*APP_ROOT[^)]*'docs'/);
        expect(main, 'le serveur des fiches sert la même racine').toContain('racineDuCorpus(');
    });

    it('le coffre Obsidian passe par `coffreObsidian`', async () => {
        const pont = await lire('obsidian_bridge.ts');
        expect(pont).toContain('coffreObsidian(process.env)');
        /* Le chemin en dur a quitté ce fichier : il vit dans le périmètre. */
        expect(pont, 'le chemin du coffre est revenu en dur').not.toContain('OneDrive');
    });

    /*
      L'ordre compte autant que la présence : une garde posée APRÈS l'ouverture
      de la requête ne protège rien — la commande est déjà partie vers la lampe.
    */
    it('les appareils sont coupés AVANT que la requête ne parte', async () => {
        const main = await lire('main.ts');

        const handler = main.indexOf("ipcMain.handle('light:request'");
        const garde = main.indexOf('appareilsMuets(process.env)', handler);
        const envoi = main.indexOf('lib.request(', handler);

        expect(handler, 'le handler existe').toBeGreaterThan(-1);
        expect(garde, 'la garde est dans le handler').toBeGreaterThan(-1);
        expect(envoi).toBeGreaterThan(garde);
    });

    it('le dépôt d’icônes est coupé lui aussi', async () => {
        const main = await lire('main.ts');
        const handler = main.indexOf("ipcMain.handle('ulanzi:deposer-icones'");
        const garde = main.indexOf('appareilsMuets(process.env)', handler);
        const envoi = main.indexOf('deposerLesIcones(', handler);

        expect(garde, 'la garde est dans le handler').toBeGreaterThan(-1);
        expect(envoi).toBeGreaterThan(garde);
    });
});
