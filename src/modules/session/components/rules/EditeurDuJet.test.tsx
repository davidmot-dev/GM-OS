import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditeurDuJet from './EditeurDuJet';
import type { GameDriver } from '../../../../types/drivers';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **une cible se déclare à la main, ou elle ne se
 * déclare pas du tout.**
 *
 * La cible calculée est née le 2026-08-22 avec la table de Rêves de Dragons, et
 * elle n'avait aucun écran : le seul moyen d'en poser une était de repasser les
 * huit groupes du pilote devant le modèle. Or `enrichirLePilote` remplit ce qui
 * est vide et ne remplace jamais ce qui est rempli — la dérivation aurait donc
 * ajouté la cible **à côté** des douze composantes de seuil du pilote RdD, et le
 * panneau de jet compose ses menus depuis les deux listes réunies : quatorze
 * choix à faire, et `LANCER` mort dès qu'une vieille entrée vise une section
 * disparue. *La reforge seule aurait rendu le pilote moins jouable qu'avant.*
 */

const GABARIT: SheetTemplate = {
    id: 't-rdd',
    name: 'Haut-rêvant',
    sections: [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [] },
        { id: 'competences', label: 'Compétences', fields: [] },
    ],
} as unknown as SheetTemplate;

const pilote = (jet?: GameDriver['jet']): GameDriver => ({
    id: 'custom-rdd',
    templateId: 't-rdd',
    name: 'Rêves de Dragons',
    author: 'David',
    version: '1',
    description: '',
    emoji: '🐉',
    dice: { defaultDice: '1d100', logic: 'd100-low' },
    combat: { statsToTrack: [], initiativeFormula: 'reve' },
    ...(jet ? { jet } : {}),
});

/** Les douze numérotées du pilote enregistré, telles qu'elles sont en base. */
const DOUZE = Array.from({ length: 12 }, (_, i) => ({
    id: `competence_${i + 1}`,
    label: `Compétence ${i + 1}`,
    sectionId: 'competences',
}));

/** Le dernier `jet` écrit par l'écran. */
const jetEcrit = (onUpdate: ReturnType<typeof vi.fn>) =>
    onUpdate.mock.calls.at(-1)![0].jet as NonNullable<GameDriver['jet']>;

describe('poser une cible calculée à la main', () => {
    it('choisir une mécanique écrit une cible QUI PORTE DÉJÀ sa caractéristique', () => {
        /*
          Le cas exact du 2026-08-22 : la première dérivation à produire une
          cible l'a rendue sans caractéristique, et `undefined.sectionId` a fait
          tomber toute la Revue du Pilote — l'écran qui existe pour signaler ce
          défaut, mis hors service par lui. Ici c'est inexprimable.
        */
        const onUpdate = vi.fn();
        render(<EditeurDuJet driver={pilote({ sens: 'sous-ou-egal' })} gabarit={GABARIT} onUpdate={onUpdate} />);

        fireEvent.change(screen.getByTitle(/table qui calcule la cible/i), {
            target: { value: 'reves-de-dragons' },
        });

        const jet = jetEcrit(onUpdate);
        expect(jet.cible?.mecanique).toBe('reves-de-dragons');
        expect(jet.cible?.caracteristique).toBeTruthy();
        expect(jet.cible?.caracteristique.sectionId).toBe('');
        // Le reste du descripteur ne bouge pas : on édite une moitié du jet.
        expect(jet.sens).toBe('sous-ou-egal');
    });

    it('le menu ne propose que les mécaniques du registre', () => {
        /*
          Un nom saisi à la main — « runequest », « percentile » — ne calcule
          aucune cible et affiche zéro pour cent. Une liste rend la faute
          inexprimable, au lieu de la rattraper à la revue.
        */
        render(<EditeurDuJet driver={pilote()} gabarit={GABARIT} onUpdate={vi.fn()} />);
        const menu = screen.getByTitle(/table qui calcule la cible/i) as HTMLSelectElement;

        expect([...menu.options].map(o => o.value)).toEqual(['', 'reves-de-dragons']);
    });

    it('revenir à « aucune » RETIRE la clé, au lieu de l’annuler', () => {
        /*
          `estVide` traite `undefined` et l'absence de la même façon, mais pas
          `JSON.stringify` ni la revue qui lit les clés : un pilote exporté
          porterait une cible fantôme.
        */
        const onUpdate = vi.fn();
        render(
            <EditeurDuJet
                driver={pilote({
                    sens: 'sous-ou-egal',
                    cible: {
                        mecanique: 'reves-de-dragons',
                        caracteristique: { id: 'carac', label: 'Caractéristique', sectionId: 'caracteristiques' },
                    },
                })}
                gabarit={GABARIT}
                onUpdate={onUpdate}
            />,
        );

        fireEvent.change(screen.getByTitle(/table qui calcule la cible/i), { target: { value: '' } });

        expect('cible' in jetEcrit(onUpdate)).toBe(false);
    });

    it('une cible sans caractéristique s’affiche au lieu de faire tomber l’écran', () => {
        // Un pilote antérieur, ou une dérivation ratée. L'écran qui doit le
        // réparer est le dernier qui ait le droit de tomber dessus.
        const driver = pilote({
            sens: 'sous-ou-egal',
            cible: { mecanique: 'reves-de-dragons' } as NonNullable<GameDriver['jet']>['cible'],
        });

        expect(() => render(<EditeurDuJet driver={driver} gabarit={GABARIT} onUpdate={vi.fn()} />)).not.toThrow();
        expect(screen.getByText(/ce qui se lit en ordonnée/i)).toBeTruthy();
    });
});

describe('le seuil resté à côté de la cible', () => {
    const avecLesDeux = {
        sens: 'sous-ou-egal' as const,
        seuil: DOUZE,
        cible: {
            mecanique: 'reves-de-dragons' as const,
            caracteristique: { id: 'carac', label: 'Caractéristique', sectionId: 'caracteristiques' },
            ajustement: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
        },
    };

    it('se signale, en disant combien elles sont', () => {
        render(<EditeurDuJet driver={pilote(avecLesDeux)} gabarit={GABARIT} onUpdate={vi.fn()} />);

        expect(screen.getByText(/12 composantes de seuil subsistent/i)).toBeTruthy();
    });

    it('se vide d’un geste, et rien d’autre ne bouge', () => {
        const onUpdate = vi.fn();
        render(<EditeurDuJet driver={pilote(avecLesDeux)} gabarit={GABARIT} onUpdate={onUpdate} />);

        fireEvent.click(screen.getByText('Vider le seuil'));

        const jet = jetEcrit(onUpdate);
        expect(jet.seuil).toEqual([]);
        expect(jet.cible?.ajustement).toHaveLength(1);
        expect(jet.sens).toBe('sous-ou-egal');
    });

    it('ne se signale pas quand le seuil est le seul à décider', () => {
        // L'avertissement ne vaut que pour la cohabitation : un jeu qui
        // additionne son seuil n'a rien à se reprocher.
        render(<EditeurDuJet driver={pilote({ sens: 'sous-ou-egal', seuil: DOUZE })} gabarit={GABARIT} onUpdate={vi.fn()} />);

        expect(screen.queryByText('Vider le seuil')).toBeNull();
    });
});
