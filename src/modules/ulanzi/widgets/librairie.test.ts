import { describe, it, expect } from 'vitest';
import {
    LIBRAIRIE,
    COMPOSITEURS,
    basculer,
    bornerLesSecondes,
    estActif,
    nomAwtrix,
    nomsAwtrixDeTousLesWidgets,
    reglerLesSecondes,
    SECONDES_MAX,
    SECONDES_MIN,
    SECONDES_PAR_DEFAUT,
    widgetsActifs,
    widgetsDuJeu,
    type WidgetDeTable,
} from './librairie';

/**
 * **La librairie de widgets — § 12 du plan, construite le 2026-08-30.**
 *
 * Ce que ces tests gardent avant tout : **rien ne s'allume ni ne s'éteint tout
 * seul.** C'est la famille de défauts que ce projet paie le plus cher, et un
 * afficheur est l'endroit où elle se voit le moins — personne ne remarque un
 * widget qui aurait dû être là.
 */

/** Un catalogue de laboratoire : la vraie librairie n'a qu'une entrée. */
const CATALOGUE: WidgetDeTable[] = [
    { id: 'quarts', nom: 'Quarts', type: 'rang', systemId: 'blade-runner', source: { de: 'main' }, parDefaut: true },
    { id: 'impulsion', nom: 'Impulsion', type: 'jauge', systemId: 'dune', source: { de: 'pilote', champ: 'impulsion' } },
    { id: 'tension', nom: 'Tension', type: 'compte-a-rebours', source: { de: 'pilote', champ: 'clock' } },
];

const ids = (actifs: { widget: WidgetDeTable }[]) => actifs.map(a => a.widget.id);

describe('ce qu’un jeu peut montrer', () => {
    it('prend les siens et les universels, jamais ceux d’un autre jeu', () => {
        expect(widgetsDuJeu('blade-runner', CATALOGUE).map(w => w.id)).toEqual(['quarts', 'tension']);
        expect(widgetsDuJeu('dune', CATALOGUE).map(w => w.id)).toEqual(['impulsion', 'tension']);
    });

    it('ne garde que les universels quand aucun jeu n’est ouvert', () => {
        expect(widgetsDuJeu(null, CATALOGUE).map(w => w.id)).toEqual(['tension']);
    });
});

describe('ce qui défile', () => {
    /** C'est ce qui fait que le défilé marchait avant qu'un tableau de bord existe. */
    it('sans sélection, prend les widgets marqués par défaut', () => {
        expect(ids(widgetsActifs('blade-runner', undefined, CATALOGUE))).toEqual(['quarts']);
    });

    /**
     * **Absent n'est pas vide, et la nuance est tout le sujet.** Si « rien de
     * choisi » valait « tout allumé », ajouter une entrée au catalogue
     * allumerait un widget chez quelqu'un qui ne l'a jamais demandé.
     */
    it('une sélection vide ne pousse rien — c’est un choix', () => {
        expect(widgetsActifs('blade-runner', { 'blade-runner': [] }, CATALOGUE)).toEqual([]);
    });

    it('respecte l’ordre de la sélection', () => {
        const selection = { 'blade-runner': [
            { widgetId: 'tension', secondes: 10 },
            { widgetId: 'quarts', secondes: 20 },
        ] };
        expect(ids(widgetsActifs('blade-runner', selection, CATALOGUE))).toEqual(['tension', 'quarts']);
    });

    /** Changer de campagne ne doit pas pousser l'Impulsion de Dune chez Blade Runner. */
    it('écarte un widget d’un autre jeu resté dans la sélection', () => {
        const selection = { 'blade-runner': [{ widgetId: 'impulsion', secondes: 20 }] };
        expect(widgetsActifs('blade-runner', selection, CATALOGUE)).toEqual([]);
    });

    /** Une sélection est persistée : elle survit à une version qui retire une entrée. */
    it('écarte un widget disparu du catalogue', () => {
        const selection = { 'blade-runner': [{ widgetId: 'widget-supprime', secondes: 20 }] };
        expect(widgetsActifs('blade-runner', selection, CATALOGUE)).toEqual([]);
    });

    it('borne la part d’écran lue depuis la sélection', () => {
        const selection = { 'blade-runner': [{ widgetId: 'quarts', secondes: 999 }] };
        expect(widgetsActifs('blade-runner', selection, CATALOGUE)[0].secondes).toBe(SECONDES_MAX);
    });
});

describe('allumer et éteindre', () => {
    /**
     * **Le premier geste fige l'implicite.** Sans cela, éteindre un widget actif
     * par défaut n'aurait aucun effet : la sélection resterait absente, et le
     * tour suivant le rallumerait.
     */
    it('éteindre un widget par défaut le retire vraiment', () => {
        const apres = basculer('quarts', 'blade-runner', undefined, CATALOGUE);

        expect(apres).toEqual([]);
        expect(estActif('quarts', 'blade-runner', { 'blade-runner': apres }, CATALOGUE)).toBe(false);
    });

    it('allumer ajoute à la fin, sans passer devant les autres', () => {
        const apres = basculer('tension', 'blade-runner', undefined, CATALOGUE);
        expect(apres.map(e => e.widgetId)).toEqual(['quarts', 'tension']);
    });

    it('rallumer après extinction remet le widget', () => {
        const eteint = basculer('quarts', 'blade-runner', undefined, CATALOGUE);
        const rallume = basculer('quarts', 'blade-runner', { 'blade-runner': eteint }, CATALOGUE);

        expect(rallume.map(e => e.widgetId)).toEqual(['quarts']);
        expect(rallume[0].secondes).toBe(SECONDES_PAR_DEFAUT);
    });

    it('change la part d’écran d’un seul widget', () => {
        const deux = basculer('tension', 'blade-runner', undefined, CATALOGUE);
        const apres = reglerLesSecondes('tension', 9, 'blade-runner', { 'blade-runner': deux }, CATALOGUE);

        expect(apres).toEqual([
            { widgetId: 'quarts', secondes: SECONDES_PAR_DEFAUT },
            { widgetId: 'tension', secondes: 9 },
        ]);
    });

    it('borne les secondes plutôt que d’accepter n’importe quoi', () => {
        expect(bornerLesSecondes(0)).toBe(SECONDES_MIN);
        expect(bornerLesSecondes(1000)).toBe(SECONDES_MAX);
        expect(bornerLesSecondes(12.4)).toBe(12);
    });
});

describe('les noms sur l’appareil', () => {
    /** Le nom historique ne change pas : deux applications se seraient superposées. */
    it('garde gmos_quarts au défilé', () => {
        expect(nomAwtrix('quarts')).toBe('gmos_quarts');
    });

    /**
     * **La restitution retire TOUT ce que GM-OS a pu poser**, pas seulement les
     * actifs : un widget éteint en cours de séance reste sur l'appareil jusqu'à
     * l'expiration de sa durée de vie.
     */
    it('énumère tous les noms du catalogue, actifs ou non', () => {
        expect(nomsAwtrixDeTousLesWidgets(CATALOGUE))
            .toEqual(['gmos_quarts', 'gmos_impulsion', 'gmos_tension']);
    });
});

describe('le catalogue livré', () => {
    it('n’a qu’une entrée, et c’est le défilé', () => {
        // A ne livre AUCUN widget nouveau : si un second entrait ici maintenant,
        // on ne saurait plus lequel des deux a validé la librairie.
        expect(LIBRAIRIE.map(w => w.id)).toEqual(['quarts']);
    });

    it('chaque widget composé a son compositeur', () => {
        for (const widget of LIBRAIRIE) {
            if (widget.source.de === 'main') {
                expect(COMPOSITEURS[widget.id], widget.id).toBeTypeOf('function');
            }
        }
    });

    it('le compositeur du défilé produit une charge dessinable', () => {
        const charge = COMPOSITEURS.quarts({
            quarts: { quartDuJour: 1, consecutifs: 4 },
            seuilSansPause: 3,
        }) as unknown as { text: string; draw: unknown[] };

        expect(charge.text).toBe('JOURNEE');
        expect(charge.draw.length).toBeGreaterThan(0);
    });
});
