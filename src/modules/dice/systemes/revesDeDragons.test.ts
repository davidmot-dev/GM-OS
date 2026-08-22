import { describe, it, expect } from 'vitest';
import { degreDuDe } from '../degresDeReussite';
import {
    bandesDuJet,
    chancesDeReussite,
    AJUSTEMENT_INFERIEUR,
    MULTIPLICATEUR_PAR_AJUSTEMENT,
    RESULTATS_SPECIAUX,
} from './revesDeDragons';

/**
 * Ce que ces tests protègent : **un jet en pourcentage est un jet juste**.
 *
 * Le pilote RdD composait `caractéristique + compétence` là où le livre
 * multiplie : Agilité 12 avec +3 annonçait 15 % au lieu de 78. *Facteur cinq,
 * dans le sens qui fait échouer les personnages compétents* — et un jet faux ne
 * se voit jamais en séance : le résultat a l'air d'un résultat.
 *
 * Ils protègent aussi **la transcription elle-même**. Les nombres viennent du
 * livre (pages 33-34), pas d'un modèle ni d'une formule : une coquille de
 * saisie ne se verrait nulle part ailleurs.
 */

describe('la cible se calcule en multipliant, jamais en additionnant', () => {
    it("rend 78 % là où l'addition rendait 15 — le défaut d'origine", () => {
        // Agilité 12, compétence +3, difficulté moyenne : ajustement +3, ×6,5.
        expect(chancesDeReussite(12, 3)).toBe(78);
        expect(chancesDeReussite(12, 3)).not.toBe(12 + 3);
    });

    it('pose la difficulté moyenne à cinq fois la caractéristique', () => {
        expect(MULTIPLICATEUR_PAR_AJUSTEMENT[0]).toBe(5);
        expect(chancesDeReussite(10, 0)).toBe(50);
    });

    it('tient les trois paliers que la courbe ne prolonge pas', () => {
        // −8 vaut ×1 ; en dessous la progression casse : ÷2 puis ÷4.
        expect(chancesDeReussite(12, -8)).toBe(12);
        expect(chancesDeReussite(12, -9)).toBe(6);
        expect(chancesDeReussite(12, -10)).toBe(3);
    });

    it('arrondit toujours à l’inférieur', () => {
        // 15 × 4,5 = 67,5 → 67, et jamais 68.
        expect(chancesDeReussite(15, -1)).toBe(67);
        // 11 × 0,25 = 2,75 → 2.
        expect(chancesDeReussite(11, -10)).toBe(2);
    });

    it('borne à +10 au lieu de prolonger la courbe, et le dit', () => {
        const bandes = bandesDuJet(10, 14);
        expect(bandes.chances).toBe(100);
        expect(bandes.remarques.join(' ')).toMatch(/s'arrête à \+10/);
    });
});

describe('les bandes, transcrites du livre', () => {
    /**
     * **L'exemple travaillé du livre, à 30 % de chances.** C'est le cas qui a
     * ouvert le chantier : la règle en prose (« les derniers 20 % de la marge »)
     * donnerait un échec particulier à 87, *et la table imprime 86*. La table
     * fait foi.
     */
    it('reproduit l’exemple à 30 % borne par borne', () => {
        const bandes = bandesDuJet(6, 0); // 6 × 5 = 30
        expect(bandes.chances).toBe(30);
        expect(bandes.particuliere).toBe(6);
        expect(bandes.significative).toBe(15);
        expect(bandes.echecParticulier).toBe(86);
        expect(bandes.echecTotal).toBe(94);

        const degre = (de: number) => degreDuDe(de, bandes);
        expect(degre(1)).toBe('reussite-particuliere');
        expect(degre(6)).toBe('reussite-particuliere');
        expect(degre(7)).toBe('reussite-significative');
        expect(degre(15)).toBe('reussite-significative');
        expect(degre(16)).toBe('reussite-normale');
        expect(degre(30)).toBe('reussite-normale');
        expect(degre(31)).toBe('echec-normal');
        expect(degre(85)).toBe('echec-normal');
        expect(degre(86)).toBe('echec-particulier');
        expect(degre(93)).toBe('echec-particulier');
        expect(degre(94)).toBe('echec-total');
        expect(degre(100)).toBe('echec-total');
    });

    it('ne dérive pas les 20 % que la prose annonce', () => {
        // Si l'on calculait « les derniers 20 % de la marge », on obtiendrait 87.
        // Ce test échoue le jour où quelqu'un remplace la table par la formule.
        expect(bandesDuJet(6, 0).echecParticulier).toBe(86);
        expect(bandesDuJet(6, 0).echecParticulier).not.toBe(87);
    });

    it('n’ouvre pas de bande significative quand elle tomberait sous la particulière', () => {
        // À 1 % de chances : particulière 01, et la moitié vaudrait 0.
        const bandes = bandesDuJet(1, -8);
        expect(bandes.chances).toBe(1);
        expect(bandes.particuliere).toBe(1);
        expect(bandes.significative).toBeNull();
        expect(degreDuDe(1, bandes)).toBe('reussite-particuliere');
    });
});

describe('la transcription de la table', () => {
    it('porte les vingt-deux lignes imprimées', () => {
        expect(RESULTATS_SPECIAUX).toHaveLength(22);
        expect(RESULTATS_SPECIAUX[0]).toMatchObject({ jusqua: 5, part: 1, echP: 81, echT: 92 });
        expect(RESULTATS_SPECIAUX[21]).toMatchObject({ jusqua: 110, part: 22, echP: null, echT: null });
    });

    it('suit la régularité de l’échec particulier — 80 plus le numéro de palier', () => {
        RESULTATS_SPECIAUX.slice(0, 19).forEach((ligne, index) => {
            expect(ligne.echP).toBe(80 + index + 1);
        });
    });

    /**
     * **L'exception qui justifie de transcrire plutôt que de dériver.** L'échec
     * total monte d'un point tous les deux paliers — 92, 92, 93, 93, … — et la
     * régularité annoncerait 101 à la ligne 91-95. Le livre imprime 00.
     */
    it('plafonne l’échec total à la dernière ligne, contre sa propre régularité', () => {
        const ligne91a95 = RESULTATS_SPECIAUX.find(l => l.jusqua === 95)!;
        const regularite = 91 + Math.ceil(19 / 2); // 101
        expect(regularite).toBe(101);
        expect(ligne91a95.echT).toBe(100);
    });
});

describe('les cas de bord que la table tranche', () => {
    it('fait échouer le double zéro même à cent pour cent de chances', () => {
        const bandes = bandesDuJet(20, 0); // 20 × 5 = 100
        expect(bandes.chances).toBe(100);
        expect(bandes.echecParticulier).toBeNull();
        expect(bandes.echecTotal).toBe(100);
        expect(degreDuDe(99, bandes)).toBe('reussite-normale');
        expect(degreDuDe(100, bandes)).toBe('echec-total');
    });

    it('rend le double zéro NORMAL au-dessus de cent pour cent', () => {
        const bandes = bandesDuJet(20, 1); // 20 × 5,5 = 110
        expect(bandes.chances).toBe(110);
        expect(bandes.echecTotal).toBeNull();
        expect(degreDuDe(100, bandes)).toBe('echec-normal');
    });

    it('garde la réussite particulière au-delà de cent pour cent', () => {
        // Le livre imprime encore les paliers 101-105 et 106-110.
        const bandes = bandesDuJet(20, 1);
        expect(bandes.particuliere).toBe(22);
        expect(degreDuDe(22, bandes)).toBe('reussite-particuliere');
        expect(degreDuDe(23, bandes)).toBe('reussite-significative');
    });

    it('signale quand il sort de la table au lieu de rendre un nombre plausible', () => {
        const bandes = bandesDuJet(20, 10); // 20 × 10 = 200
        expect(bandes.chances).toBe(200);
        expect(bandes.remarques.join(' ')).toMatch(/dépasse la table/);
        expect(bandes.particuliere).toBe(40);
    });
});

describe('l’ajustement inférieur à −10', () => {
    it('met tout le monde à un pour cent, sans particulière ni significative', () => {
        const bandes = bandesDuJet(18, -13);
        expect(bandes.chances).toBe(1);
        expect(bandes.particuliere).toBeNull();
        expect(bandes.significative).toBeNull();
        expect(degreDuDe(1, bandes)).toBe('reussite-normale');
    });

    it('rend tout échec particulier, et l’échec total à partir du seuil du livre', () => {
        const bandes = bandesDuJet(18, -13);
        expect(bandes.echecParticulier).toBe(2);
        expect(bandes.echecTotal).toBe(50);
        expect(degreDuDe(2, bandes)).toBe('echec-particulier');
        expect(degreDuDe(49, bandes)).toBe('echec-particulier');
        expect(degreDuDe(50, bandes)).toBe('echec-total');
    });

    it('descend le seuil au lieu de le monter — l’erreur des fiches du corpus', () => {
        // Les fiches écrivent « l'échec total s'élève de 90 % à 98 % » : elles
        // confondent le seuil et la probabilité. Le seuil DESCEND.
        expect(AJUSTEMENT_INFERIEUR[-11]).toBe(90);
        expect(AJUSTEMENT_INFERIEUR[-16]).toBe(2);
        expect(AJUSTEMENT_INFERIEUR[-16]).toBeLessThan(AJUSTEMENT_INFERIEUR[-11]);
    });

    it('ne laisse plus aucune réussite à partir de −17', () => {
        const bandes = bandesDuJet(20, -17);
        expect(bandes.chances).toBe(0);
        expect(degreDuDe(1, bandes)).toBe('echec-total');
        expect(degreDuDe(100, bandes)).toBe('echec-total');
    });
});
