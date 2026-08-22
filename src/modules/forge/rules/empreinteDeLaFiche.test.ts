import { describe, it, expect } from 'vitest';
import {
    aEteRetouchee, corpsDeLaFiche, empreinteDeclaree, empreinteDuCorps, provenanceDeLaFiche,
} from './empreinteDeLaFiche';
import { marquerCommeRelue } from './marqueDeRelecture';

/**
 * Ce que ces tests protègent : **une reforge ne mange pas une correction.**
 *
 * Une reforge qui retombe sur le même slug **écrase en place** — comportement
 * voulu tant que la fiche n'a pas été touchée, perte silencieuse dès qu'elle
 * l'a été. Le plan du 2026-08-07 le dit sans détour : *sans quoi le MJ cesse de
 * corriger.*
 */

const fiche = (corps: string, tete: string[] = ['relu: false']) =>
    ['---', 'sujet: Résolution des jets', ...tete, '---', '', corps, ''].join('\n');

describe('l’empreinte', () => {
    it('ne couvre que le corps, jamais le frontmatter', () => {
        const a = fiche('Le même texte.', ['relu: false']);
        const b = fiche('Le même texte.', ['relu: true', 'sources: "ailleurs.pdf"']);

        expect(empreinteDuCorps(a)).toBe(empreinteDuCorps(b));
    });

    /**
     * **Sans cette règle, relire une fiche la ferait passer pour corrigée** — et
     * le dispositif qui doit protéger les corrections prendrait sa propre trace
     * pour une correction.
     */
    it('ne bouge pas quand on déclare la fiche relue', () => {
        const avant = fiche('Un corps qui ne change pas.');
        const apres = marquerCommeRelue(avant)!;

        expect(apres).toContain('relu: true');
        expect(empreinteDuCorps(apres)).toBe(empreinteDuCorps(avant));
    });

    it('change dès que le corps change', () => {
        expect(empreinteDuCorps(fiche('Un texte.')))
            .not.toBe(empreinteDuCorps(fiche('Un autre texte.')));
    });

    /**
     * *Une empreinte qui change toute seule accuse à tort.* Un fichier qui
     * traverse Git sous Windows change de fins de ligne sans que personne ne
     * l'ait touché.
     */
    it('survit à un changement de fins de ligne', () => {
        const unix = fiche('Deux lignes.\nLa seconde.');
        expect(empreinteDuCorps(unix.replace(/\n/g, '\r\n'))).toBe(empreinteDuCorps(unix));
    });

    it('traite un document sans frontmatter comme tout entier son corps', () => {
        expect(corpsDeLaFiche('# Une note libre')).toBe('# Une note libre');
        expect(empreinteDeclaree('# Une note libre')).toBeNull();
    });
});

describe('savoir qu’une fiche a été retouchée', () => {
    const generee = () => {
        const brut = fiche('Le texte d’origine.');
        return brut.replace('relu: false', `relu: false\nempreinte: ${empreinteDuCorps(brut)}`);
    };

    it('dit non tant que le corps est celui d’origine', () => {
        expect(aEteRetouchee(generee())).toBe(false);
    });

    it('dit oui dès que le meneur a édité', () => {
        expect(aEteRetouchee(generee().replace('Le texte d’origine.', 'Le texte corrigé.'))).toBe(true);
    });

    /**
     * **Rend `false` quand on ne sait pas.** Les 194 fiches d'avant ce jour n'en
     * portent aucune : les traiter comme corrigées bloquerait des reforges qui
     * marchaient hier. *Le doute penche du côté du comportement d'avant.*
     */
    it('ne se prononce pas sur une fiche sans empreinte', () => {
        expect(aEteRetouchee(fiche('Un corps quelconque.'))).toBe(false);
    });
});

describe('la provenance, déduite et jamais demandée', () => {
    const avecEmpreinte = (corps: string, tete: string[]) => {
        const brut = fiche(corps, tete);
        return brut.replace('---\n\n', `empreinte: ${empreinteDuCorps(brut)}\n---\n\n`);
    };

    it('distingue générée et relue', () => {
        expect(provenanceDeLaFiche(avecEmpreinte('Texte.', ['relu: false']))).toBe('generee');
        expect(provenanceDeLaFiche(avecEmpreinte('Texte.', ['relu: true']))).toBe('relue');
    });

    /**
     * **`corrigee` l'emporte sur `relue`** : une fiche éditée porte encore sa
     * marque de relecture, mais ce qui compte alors est qu'elle ne vient plus
     * du modèle.
     */
    it('fait gagner « corrigée » sur « relue »', () => {
        const editee = avecEmpreinte('Texte.', ['relu: true']).replace('Texte.', 'Texte revu à la main.');
        expect(provenanceDeLaFiche(editee)).toBe('corrigee');
    });

    it('ne prétend rien sur ce qui n’est pas une fiche', () => {
        expect(provenanceDeLaFiche('# Une note libre')).toBe('inconnue');
    });
});
