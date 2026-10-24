import { describe, it, expect } from 'vitest';
import {
    etatInitial,
    valeurDe,
    ventilerLaDepense,
    depenser,
    gagner,
    fixer,
    finDeScene,
    debutDeSeance,
    nouveauScenario,
    visiblePourUnJoueur,
    plafondDe,
    manipulableParUnJoueur,
    type RessourceDeTable,
} from './RessourcesDeTable';

/**
 * Les valeurs testées ici sortent de `docs/systems/dune/rules/monnaie-de-table.md`,
 * fiche v3 dont les sections se résolvent en pages du livre. Aucune n'est
 * inventée : c'est ce qui distingue une référence d'un exemple.
 */
const IMPULSION: RessourceDeTable = {
    id: 'impulsion',
    label: 'Impulsion',
    proprietaire: 'joueurs',
    depart: 0,
    min: 0,
    max: 6,
    erosionFinDeScene: 1,
    reportSurEpuisement: 'menace',
};

const MENACE: RessourceDeTable = {
    id: 'menace',
    label: 'Menace',
    proprietaire: 'meneur',
    depart: 2,
    min: 0,
};

const DUNE = [IMPULSION, MENACE];

describe('l\'état de départ', () => {
    it('chaque réserve part de sa valeur déclarée', () => {
        expect(etatInitial(DUNE)).toEqual({ impulsion: 0, menace: 2 });
    });

    it('une réserve absente de l\'état vaut son départ, pas zéro', () => {
        // Le cas réel : un pilote gagne une ressource après le début d'une
        // chronique. Retomber sur zéro poserait la Menace à zéro sans que
        // personne ne l'ait dépensée.
        expect(valeurDe(DUNE, {}, 'menace')).toBe(2);
        expect(valeurDe(DUNE, { impulsion: 4 }, 'menace')).toBe(2);
    });
});

describe('gagner — le plafond refuse en le disant', () => {
    it('l\'excédent d\'un test réussi alimente la réserve du groupe', () => {
        const r = gagner(DUNE, { impulsion: 1, menace: 2 }, 'impulsion', 3);
        expect(r.etat.impulsion).toBe(4);
        expect(r.perdu).toBe(0);
        expect(r.mouvements).toEqual([{ ressourceId: 'impulsion', delta: 3 }]);
    });

    it('« à six points, tout gain est perdu » — et le perdu est compté', () => {
        const r = gagner(DUNE, { impulsion: 5, menace: 2 }, 'impulsion', 4);
        expect(r.etat.impulsion).toBe(6);
        expect(r.perdu).toBe(3);
        expect(r.avertissements[0]).toContain('plafonne à 6');
    });

    it('la Menace n\'a pas de plafond, et ce n\'est pas un oubli', () => {
        const r = gagner(DUNE, { impulsion: 0, menace: 2 }, 'menace', 40);
        expect(r.etat.menace).toBe(42);
        expect(r.perdu).toBe(0);
        expect(r.avertissements).toEqual([]);
    });
});

describe('dépenser — ce que la réserve ne paie pas, l\'autre l\'encaisse', () => {
    /**
     * **La règle qu'aucune jauge individuelle ne saurait porter.** « S'il ne
     * dispose pas d'Impulsion collective, il ajoute autant de points à la
     * réserve de Menace du meneur de jeu. » Le manque ne bloque pas la
     * dépense : il change de camp.
     */
    it('la réserve suffit : rien ne bouge ailleurs', () => {
        const r = depenser(DUNE, { impulsion: 5, menace: 2 }, 'impulsion', 3);
        expect(r.etat).toEqual({ impulsion: 2, menace: 2 });
        expect(r.avertissements).toEqual([]);
    });

    it('la réserve est vide : la dépense entière part en Menace', () => {
        const r = depenser(DUNE, { impulsion: 0, menace: 2 }, 'impulsion', 3);
        expect(r.etat).toEqual({ impulsion: 0, menace: 5 });
        expect(r.avertissements[0]).toContain('Menace augmente');
    });

    it('la réserve est partielle : le manque seul part en Menace', () => {
        const r = depenser(DUNE, { impulsion: 1, menace: 2 }, 'impulsion', 3);
        expect(r.etat).toEqual({ impulsion: 0, menace: 4 });
        expect(r.mouvements).toEqual([
            { ressourceId: 'impulsion', delta: -1 },
            { ressourceId: 'menace', delta: 2 },
        ]);
    });

    it('sans report déclaré, la dépense est partielle et le dit', () => {
        // La Menace ne se reporte nulle part : « à zéro, le meneur ne peut plus
        // compliquer d'action ». On ne l'empêche pas — on l'annonce.
        const r = depenser(DUNE, { impulsion: 0, menace: 1 }, 'menace', 3);
        expect(r.etat.menace).toBe(0);
        expect(r.avertissements[0]).toContain('2 points non payés');
    });

    it('une réserve inconnue ne lève pas : elle avertit', () => {
        // Un pilote mal renseigné ne doit pas interrompre une partie.
        const r = depenser(DUNE, { impulsion: 3 }, 'chinyen', 2);
        expect(r.etat).toEqual({ impulsion: 3 });
        expect(r.avertissements[0]).toContain('chinyen');
    });
});

describe('ventiler — annoncer le coût avant de s\'engager', () => {
    it('dit d\'où viendra chaque point', () => {
        expect(ventilerLaDepense(DUNE, { impulsion: 2, menace: 2 }, 'impulsion', 3)).toEqual({
            surLaReserve: 2,
            reporte: 1,
            ressourceDeReport: 'menace',
            impaye: 0,
        });
    });

    it('paie par choix sur le report, et le manque par-dessus', () => {
        // Dune, lot D2 (2026-10-22) : trois points, dont deux en Menace par choix.
        expect(ventilerLaDepense(DUNE, { impulsion: 4, menace: 0 }, 'impulsion', 3, 2)).toEqual({
            surLaReserve: 1, reporte: 2, ressourceDeReport: 'menace', impaye: 0, choisi: 2,
        });
        // Une seule Impulsion : un point choisi, un payé, un manquant.
        expect(ventilerLaDepense(DUNE, { impulsion: 1, menace: 0 }, 'impulsion', 3, 1)).toEqual({
            surLaReserve: 1, reporte: 2, ressourceDeReport: 'menace', impaye: 0, choisi: 1,
        });
        // Plus que le coût : borné au coût.
        expect(ventilerLaDepense(DUNE, { impulsion: 4 }, 'impulsion', 3, 9).reporte).toBe(3);
    });

    it('la dépense dit ce qui est choisi, et ce qui manque', () => {
        const r = depenser(DUNE, { impulsion: 1, menace: 0 }, 'impulsion', 3, 1);
        expect(r.etat).toEqual({ impulsion: 0, menace: 2 });
        expect(r.avertissements[0]).toBe('1 point payé en Menace par choix, 1 point d\'Impulsion manquant : Menace augmente de 2.');
    });

    it('ne touche à rien — c\'est tout son intérêt', () => {
        const etat = { impulsion: 2, menace: 2 };
        ventilerLaDepense(DUNE, etat, 'impulsion', 3);
        expect(etat).toEqual({ impulsion: 2, menace: 2 });
    });
});

describe('fin de scène — l\'érosion, et rien d\'autre', () => {
    it('l\'Impulsion perd un point, la Menace ne bouge pas', () => {
        const r = finDeScene(DUNE, { impulsion: 4, menace: 3 });
        expect(r.etat).toEqual({ impulsion: 3, menace: 3 });
        expect(r.mouvements).toEqual([{ ressourceId: 'impulsion', delta: -1 }]);
    });

    it('à zéro, elle ne passe pas en négatif', () => {
        const r = finDeScene(DUNE, { impulsion: 0, menace: 3 });
        expect(r.etat).toEqual({ impulsion: 0, menace: 3 });
        expect(r.mouvements).toEqual([]);
    });
});

describe('fixer — le meneur pose la valeur qu\'il veut, dans les bornes', () => {
    it('ramène au plafond', () => {
        expect(fixer(DUNE, { impulsion: 2 }, 'impulsion', 9).etat.impulsion).toBe(6);
    });

    it('ramène au plancher', () => {
        expect(fixer(DUNE, { menace: 5 }, 'menace', -4).etat.menace).toBe(0);
    });

    it('une réserve sans plafond accepte la valeur telle quelle', () => {
        expect(fixer(DUNE, { menace: 2 }, 'menace', 30).etat.menace).toBe(30);
    });
});

describe('qui voit la réserve, et qui la fait bouger', () => {
    /**
     * **La demande de David, le 2026-08-15** : *« Impulsion est une jauge gérée
     * par les joueurs et cela fait partie du Gameplay, cette gestion commune de
     * la ressource. »*
     *
     * Deux questions distinctes de la propriété, et il fallait les séparer :
     * chez Dune la **Menace appartient au meneur et se voit** — c'est de la
     * regarder monter qui fait pression.
     */
    const impulsion: RessourceDeTable = {
        id: 'impulsion', label: 'Impulsion', proprietaire: 'joueurs', depart: 0, min: 0, max: 6,
    };
    const menace: RessourceDeTable = {
        id: 'menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0,
    };

    it('sans rien déclarer, on suit la propriété', () => {
        // Le défaut compte : les pilotes déjà forgés ne portent aucun de ces
        // deux champs, et l'Impulsion doit être visible sans reforge.
        expect(visiblePourUnJoueur(impulsion)).toBe(true);
        expect(manipulableParUnJoueur(impulsion)).toBe(true);
        expect(visiblePourUnJoueur(menace)).toBe(false);
        expect(manipulableParUnJoueur(menace)).toBe(false);
    });

    it('une réserve du meneur peut être publique sans devenir manipulable', () => {
        const publique = { ...menace, visibleAuxJoueurs: true };
        expect(visiblePourUnJoueur(publique)).toBe(true);
        expect(manipulableParUnJoueur(publique), 'la voir n\'est pas y toucher').toBe(false);
    });

    it('manipuler suppose voir — et le refus est ici, pas dans les écrans', () => {
        /**
         * Une réserve déclarée manipulable mais cachée serait un bouton sur un
         * nombre qu'on ne lit pas : le joueur dépenserait à l'aveugle. Le pilote
         * vient d'un modèle de langage, cette contradiction est donc possible.
         */
        const incoherente = { ...impulsion, visibleAuxJoueurs: false, manipulableParLesJoueurs: true };
        expect(manipulableParUnJoueur(incoherente)).toBe(false);
    });

    it('une réserve commune peut rester dans la main du meneur', () => {
        const tenue = { ...impulsion, manipulableParLesJoueurs: false };
        expect(visiblePourUnJoueur(tenue)).toBe(true);
        expect(manipulableParUnJoueur(tenue)).toBe(false);
    });
});

/**
 * NOC — `docs/systems/noc/rules/monnaie-de-table.md`. Le Fiel, de zéro à cinq,
 * « se vide pour augmenter la Menace de plus un » ; la Menace, sans plafond,
 * baisse d'un point à chaque séance et revient à zéro à chaque aventure.
 */
const FIEL: RessourceDeTable = {
    id: 'fiel',
    label: 'Fiel',
    proprietaire: 'meneur',
    depart: 0,
    min: 0,
    max: 5,
    debordement: { vers: 'menace' },
};

const MENACE_NOC: RessourceDeTable = {
    id: 'menace',
    label: 'Menace',
    proprietaire: 'meneur',
    depart: 0,
    min: 0,
    erosionDebutDeSeance: 1,
    remiseAuDepartParScenario: true,
};

const NOC = [FIEL, MENACE_NOC];

describe('le débordement — à cinq gouttes, le Fiel se vide en Menace', () => {
    it('la cinquième goutte vide la jauge et fait monter la Menace', () => {
        const r = gagner(NOC, { fiel: 4, menace: 1 }, 'fiel', 1);
        expect(r.etat).toEqual({ fiel: 0, menace: 2 });
        expect(r.perdu).toBe(0);
        expect(r.mouvements).toEqual([
            { ressourceId: 'fiel', delta: -4 },
            { ressourceId: 'menace', delta: 1 },
        ]);
        // Le moment où la Loi applique ses effets : il se dit, il ne se devine pas.
        expect(r.avertissements).toEqual(['Fiel atteint 5 : la jauge se vide, Menace +1 → 2.']);
    });

    it('ce qui franchit le seuil continue de remplir la jauge vidée', () => {
        const r = gagner(NOC, { fiel: 4, menace: 0 }, 'fiel', 3);
        expect(r.etat).toEqual({ fiel: 2, menace: 1 });
    });

    it('un grand gain peut la vider plusieurs fois, et le dit', () => {
        const r = gagner(NOC, { fiel: 0, menace: 0 }, 'fiel', 12);
        expect(r.etat).toEqual({ fiel: 2, menace: 2 });
        expect(r.avertissements[0]).toContain('2 fois');
    });

    it('sous le seuil, rien ne déborde et rien ne se dit', () => {
        const r = gagner(NOC, { fiel: 1, menace: 0 }, 'fiel', 2);
        expect(r.etat).toEqual({ fiel: 3, menace: 0 });
        expect(r.avertissements).toEqual([]);
    });

    it('une jauge posée à la main sur son seuil déborde au gain suivant', () => {
        const r = gagner(NOC, { fiel: 5, menace: 0 }, 'fiel', 1);
        expect(r.etat).toEqual({ fiel: 1, menace: 1 });
    });

    it('sans plafond, un débordement déclaré est ignoré : la réserve monte', () => {
        const sansSeuil = [{ ...FIEL, max: undefined }, MENACE_NOC];
        const r = gagner(sansSeuil, { fiel: 4, menace: 0 }, 'fiel', 3);
        expect(r.etat).toEqual({ fiel: 7, menace: 0 });
    });

    it("une boucle déclarée s'arrête là où elle revient", () => {
        const a: RessourceDeTable = { id: 'a', label: 'A', proprietaire: 'meneur', depart: 0, min: 0, max: 2, debordement: { vers: 'b' } };
        const b: RessourceDeTable = { id: 'b', label: 'B', proprietaire: 'meneur', depart: 0, min: 0, max: 2, debordement: { vers: 'a' } };
        const r = gagner([a, b], { a: 1, b: 1 }, 'a', 1);
        // A se vide dans B, B se vide dans A — qui, déjà traversée, monte simplement.
        expect(r.etat).toEqual({ a: 1, b: 0 });
    });
});

describe('les rythmes de la Menace — la séance et le scénario', () => {
    it('le début de séance retire un point de Menace, et laisse le Fiel', () => {
        const r = debutDeSeance(NOC, { fiel: 3, menace: 3 });
        expect(r.etat).toEqual({ fiel: 3, menace: 2 });
        expect(r.mouvements).toEqual([{ ressourceId: 'menace', delta: -1 }]);
    });

    it("à zéro, la séance n'érode plus rien", () => {
        expect(debutDeSeance(NOC, { fiel: 0, menace: 0 }).mouvements).toEqual([]);
    });

    it('la fin de scène ne touche pas à la Menace de NOC', () => {
        expect(finDeScene(NOC, { fiel: 3, menace: 3 }).mouvements).toEqual([]);
    });

    it('un nouveau scénario remet la Menace à son départ, même sans plafond', () => {
        const r = nouveauScenario(NOC, { fiel: 3, menace: 7 });
        expect(r.etat).toEqual({ fiel: 3, menace: 0 });
        expect(r.mouvements).toEqual([{ ressourceId: 'menace', delta: -7 }]);
    });

    it('une réserve qui ne le déclare pas ne bouge pas au scénario', () => {
        expect(nouveauScenario(DUNE, { impulsion: 4, menace: 5 }).mouvements).toEqual([]);
    });
});

/**
 * **Le plafond lu sur une autre réserve** — Nephilim, 2026-10-17 : la Jauge de
 * Traque plafonne au Seuil RK du lieu (2 à 9), et à ce seuil elle se vide et
 * fait monter l'Intensité de la Traque.
 */
describe('maxSur — la Traque plafonne au Seuil RK du lieu', () => {
    const SEUIL: RessourceDeTable = { id: 'seuilRK', label: 'Seuil RK', proprietaire: 'meneur', depart: 5, min: 2, max: 9 };
    const TRAQUE: RessourceDeTable = {
        id: 'traque', label: 'Jauge de Traque', proprietaire: 'joueurs', depart: 0, min: 0,
        maxSur: 'seuilRK', debordement: { vers: 'intensite' },
    };
    const INTENSITE: RessourceDeTable = { id: 'intensite', label: 'Intensité de la Traque', proprietaire: 'meneur', depart: 1, min: 1, max: 5 };
    const NEPHILIM = [SEUIL, TRAQUE, INTENSITE];

    it('le plafond suit le Seuil RK courant', () => {
        expect(plafondDe(NEPHILIM, { seuilRK: 3 }, TRAQUE)).toBe(3);
        expect(plafondDe(NEPHILIM, {}, TRAQUE)).toBe(5);
    });

    it('dans une zone surveillée (RK 3), le troisième jeton fait monter l’Intensité', () => {
        const r = gagner(NEPHILIM, { seuilRK: 3, traque: 2, intensite: 1 }, 'traque', 1);
        expect(r.etat).toMatchObject({ traque: 0, intensite: 2 });
        expect(r.avertissements[0]).toBe('Jauge de Traque atteint 3 : la jauge se vide, Intensité de la Traque +1 → 2.');
    });

    it('dans une zone sauvage (RK 8), le même jeton ne déborde pas', () => {
        const r = gagner(NEPHILIM, { seuilRK: 8, traque: 2, intensite: 1 }, 'traque', 1);
        expect(r.etat).toMatchObject({ traque: 3, intensite: 1 });
    });

    it('fixer la jauge la ramène sous le Seuil RK', () => {
        expect(fixer(NEPHILIM, { seuilRK: 4 }, 'traque', 7).etat.traque).toBe(4);
    });

    it('une réserve désignée qui n’existe pas laisse le plafond déclaré', () => {
        expect(plafondDe(NEPHILIM, {}, { ...TRAQUE, maxSur: 'absente', max: 6 })).toBe(6);
    });
});

/** Star Trek, 2026-10-23 : « 2 points de Menace par personnage joueur présent » (Livre de Base, p. 264). */
describe('le départ par personnage joueur', () => {
    const menace: RessourceDeTable = { id: 'menace', label: 'Menace', proprietaire: 'meneur', depart: 2, min: 0, remiseAuDepartParScenario: true, departParPersonnage: 2 };
    it('Nouveau scénario remet la Menace à deux par personnage', () => {
        const r = nouveauScenario([menace], { menace: 11 }, 4);
        expect(r.etat.menace).toBe(8);
        expect(r.mouvements).toEqual([{ ressourceId: 'menace', delta: -3 }]);
    });
    it('sans compte de personnages, le départ fixe', () => {
        expect(nouveauScenario([menace], { menace: 11 }).etat.menace).toBe(2);
    });
});
