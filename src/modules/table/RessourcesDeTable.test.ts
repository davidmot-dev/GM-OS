import { describe, it, expect } from 'vitest';
import {
    etatInitial,
    valeurDe,
    ventilerLaDepense,
    depenser,
    gagner,
    fixer,
    finDeScene,
    visiblePourUnJoueur,
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
