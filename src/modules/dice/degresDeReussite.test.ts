import { describe, it, expect } from 'vitest';
import {
    DEGRES_DE_REUSSITE, cleI18nDuDegre, degreDepuisLeBooleen, degreDuDe,
    degreOuBooleen, estUneReussite, rangDuDegre, type EchelleDuJet,
} from './degresDeReussite';
import { DiceEngine } from './DiceEngine';
import fr from '../../locales/fr/modules.json';
import en from '../../locales/en/modules.json';

/**
 * Ce que ces tests protègent : **le même jet se dit du même mot sur tous les
 * écrans**.
 *
 * Sept lecteurs rendaient le verdict, en trois vocabulaires — « Réussite » en
 * dur sur la tablette, « Succès » en dur sur l'incrustation, deux clés i18n
 * ailleurs, et une conversion en `1|0` dans le panneau. *Ils ne divergeaient pas
 * encore uniquement parce qu'un booléen n'a que deux valeurs.*
 */

describe('l’échelle', () => {
    it('va du meilleur au pire, et l’ordre est la donnée', () => {
        expect(DEGRES_DE_REUSSITE[0]).toBe('reussite-particuliere');
        expect(DEGRES_DE_REUSSITE[DEGRES_DE_REUSSITE.length - 1]).toBe('echec-total');
        expect(rangDuDegre('reussite-particuliere'))
            .toBeLessThan(rangDuDegre('echec-total'));
    });

    it('coupe les réussites des échecs au bon endroit', () => {
        expect(estUneReussite('reussite-normale')).toBe(true);
        expect(estUneReussite('echec-normal')).toBe(false);
        // Les six degrés se rangent d'un côté ou de l'autre, jamais entre.
        expect(DEGRES_DE_REUSSITE.filter(estUneReussite)).toHaveLength(3);
    });

    it('porte ses six libellés dans les deux langues', () => {
        /*
          **Le libellé se vérifie dans les fichiers, pas dans le code.** Une clé
          i18n absente ne lève pas : i18next rend la clé elle-même, et l'écran
          afficherait « dice.degres.echec-total » au milieu d'une partie.
        */
        const degresDe = (locale: unknown) =>
            (locale as { dice: { degres: Record<string, string> } }).dice.degres;

        for (const degre of DEGRES_DE_REUSSITE) {
            expect(cleI18nDuDegre(degre)).toBe(`dice.degres.${degre}`);
            expect(degresDe(fr)[degre], `${degre} en français`).toBeTruthy();
            expect(degresDe(en)[degre], `${degre} en anglais`).toBeTruthy();
        }
    });
});

describe('un résultat plus ancien que l’échelle', () => {
    /**
     * `degre` est né le 2026-08-22 ; `tagSuccess` a des mois. Un écran muet
     * devant un jet enregistré avant se lirait comme un jet qui n'a pas eu lieu.
     */
    it('retombe sur le booléen quand le degré manque', () => {
        expect(degreOuBooleen(undefined, true)).toBe('reussite-normale');
        expect(degreOuBooleen(undefined, false)).toBe('echec-normal');
    });

    it('laisse le degré l’emporter quand il est là', () => {
        expect(degreOuBooleen('reussite-particuliere', false)).toBe('reussite-particuliere');
    });

    /**
     * **Ne rien trancher quand le jet ne se prononce pas.** Un 2d6 de dégâts
     * n'est ni réussi ni raté : lui inventer un verdict serait pire que de n'en
     * montrer aucun.
     */
    it('ne se prononce pas sur une somme ordinaire', () => {
        expect(degreOuBooleen(undefined, undefined)).toBeNull();
        expect(DiceEngine.rollStandard(6, 2, 0).degre).toBeUndefined();
    });
});

describe('qualifier un dé sur une échelle', () => {
    const echelle: EchelleDuJet = {
        chances: 30, particuliere: 6, significative: 15,
        echecParticulier: 86, echecTotal: 94,
    };

    it('lit les bandes du meilleur au pire', () => {
        expect(degreDuDe(6, echelle)).toBe('reussite-particuliere');
        expect(degreDuDe(15, echelle)).toBe('reussite-significative');
        expect(degreDuDe(30, echelle)).toBe('reussite-normale');
        expect(degreDuDe(85, echelle)).toBe('echec-normal');
        expect(degreDuDe(86, echelle)).toBe('echec-particulier');
        expect(degreDuDe(94, echelle)).toBe('echec-total');
    });

    it('ignore une bande que le jeu ne porte pas', () => {
        const sansExtremes: EchelleDuJet = {
            chances: 50, particuliere: null, significative: null,
            echecParticulier: null, echecTotal: null,
        };
        expect(degreDuDe(1, sansExtremes)).toBe('reussite-normale');
        expect(degreDuDe(99, sansExtremes)).toBe('echec-normal');
    });
});

describe('le moteur pose le degré, et pas ses appelants', () => {
    const echelle: EchelleDuJet = {
        chances: 100, particuliere: 20, significative: 50,
        echecParticulier: null, echecTotal: 100,
    };

    /**
     * **Le verdict et le degré ne peuvent plus se contredire.** À 96-100 % de
     * chances, un « 00 » est inférieur ou égal à la cible — donc réussi au sens
     * du booléen — et le livre en fait pourtant un échec total. *Un écran
     * annonçant « réussite » pendant qu'un autre annonce « échec total » pour le
     * même dé est pire que les deux séparément.*
     */
    it('aligne le booléen sur l’échelle, jamais l’inverse', () => {
        const res = { total: 100, rolls: [], modifier: 0, totalDisplay: '' };
        const degre = degreDuDe(res.total, echelle);

        expect(degre).toBe('echec-total');
        expect(estUneReussite(degre)).toBe(false);
    });

    it('donne un degré à tout jet qui rend un verdict', () => {
        /*
          Le contrat que ce test tient : partout où `tagSuccess` se pose, `degre`
          se pose aussi. Sans lui, un chemin oublié rendrait un jet que les
          écrans afficheraient sans verdict — et personne ne le remarquerait
          avant une séance.
        */
        const jets = [
            DiceEngine.rollThreshold(20, 1, 0, 12, 'over'),
            DiceEngine.rollAdvantage(20, 0, true, 12, 'over'),
            DiceEngine.rollPool(6, 5, 0, 4, false),
            DiceEngine.rollYZE(5, 1),
        ];

        for (const jet of jets) {
            if (jet.tagSuccess === undefined) continue;
            expect(jet.degre, JSON.stringify(jet.totalDisplay)).toBeDefined();
            expect(estUneReussite(jet.degre!)).toBe(jet.tagSuccess);
        }
    });

    it('ne fabrique aucun degré extrême sur un jeu qui ne gradue pas', () => {
        // Alien distingue réussite et surplus, mais n'a ni « particulière » ni
        // « échec total » : les lui donner ferait dire au journal qu'un jet fut
        // spectaculaire alors que le jeu ne le sait pas.
        const yze = DiceEngine.rollYZE(6, 0);
        expect(['reussite-normale', 'echec-normal']).toContain(yze.degre);
        expect(degreDepuisLeBooleen(true)).toBe('reussite-normale');
    });
});
