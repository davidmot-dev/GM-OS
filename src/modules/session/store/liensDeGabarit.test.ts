import { describe, it, expect } from 'vitest';
import { reparerLiensDeGabarit } from './liensDeGabarit';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **un pilote qui désigne un modèle de fiche
 * inexistant n'affiche aucune fiche, et ne dit rien.**
 *
 * `AddEntityForm` donne `driver.templateId` à chaque nouveau personnage, puis
 * `CombatCard` cherche le modèle par cet identifiant. Introuvable : pas de
 * fiche, pas d'erreur, pas de champ en rouge.
 *
 * Le cas réel qui a déclenché tout ceci, lu dans l'état persisté de David le
 * 2026-08-14 : le pilote « Within » visait `custom-template-1775595326986`,
 * pendant que son modèle « Archive de Personnage » vivait sous
 * `tpl-1775595327012` sans propriétaire — vingt-six millisecondes d'écart, les
 * deux créés dans la même fonction.
 *
 * **Le risque du remède est pire que le mal s'il devine.** Rattacher un pilote
 * au modèle d'un autre jeu produirait une fiche plausible et fausse. Un lien
 * cassé se voit ; une mauvaise fiche se joue. D'où les tests d'abstention
 * ci-dessous, qui comptent plus que ceux de réparation.
 */

const pilote = (id: string, name: string, templateId: string) =>
    ({ id, name, templateId } as GameDriver);
const modele = (id: string) => ({ id, name: id, sections: [] } as unknown as SheetTemplate);

describe('rattacher un pilote à son modèle perdu', () => {
    it('le cas de « Within », au millième près', () => {
        const drivers = [pilote('custom-1775595326986', 'Within', 'custom-template-1775595326986')];
        const templates = [modele('tpl-1775595327012')];

        const { drivers: corriges, reparations } = reparerLiensDeGabarit(drivers, templates);

        expect(reparations).toEqual([{
            driverId: 'custom-1775595326986',
            driverName: 'Within',
            ancienTemplateId: 'custom-template-1775595326986',
            nouveauTemplateId: 'tpl-1775595327012',
        }]);
        expect(corriges[0].templateId).toBe('tpl-1775595327012');
    });

    it('ne touche pas aux pilotes dont le lien tient', () => {
        const drivers = [pilote('c1', 'Alien', 'tpl-1786696751497')];
        const templates = [modele('tpl-1786696751497')];
        const { drivers: corriges, reparations } = reparerLiensDeGabarit(drivers, templates);
        expect(reparations).toEqual([]);
        // La même référence, pour qu'une hydratation ne déclenche pas de rendu.
        expect(corriges).toBe(drivers);
    });
});

describe('ce qu\'on refuse de deviner', () => {
    it('deux modèles orphelins dans la fenêtre : on ne tranche pas', () => {
        const drivers = [pilote('c1', 'Ambigu', 'custom-template-1000000000000')];
        const templates = [modele('tpl-1000000000100'), modele('tpl-1000000000200')];
        const { drivers: corriges, reparations } = reparerLiensDeGabarit(drivers, templates);
        expect(reparations).toEqual([]);
        expect(corriges[0].templateId).toBe('custom-template-1000000000000');
    });

    it('un orphelin trop ancien n\'a rien à voir avec ce pilote', () => {
        // Antérieur au pilote : il ne peut pas être né de la même sauvegarde.
        const drivers = [pilote('c1', 'Tardif', 'custom-template-1700000000000')];
        const templates = [modele('tpl-1600000000000')];
        expect(reparerLiensDeGabarit(drivers, templates).reparations).toEqual([]);
    });

    it('un orphelin hors de la fenêtre reste orphelin', () => {
        const drivers = [pilote('c1', 'Lointain', 'custom-template-1700000000000')];
        const templates = [modele('tpl-1700000060000')]; // une minute plus tard
        expect(reparerLiensDeGabarit(drivers, templates).reparations).toEqual([]);
    });

    it('un modèle déjà réclamé par un autre pilote n\'est pas volé', () => {
        /**
         * Le voler laisserait deux pilotes sur un modèle et un troisième sans
         * rien — on aurait déplacé le défaut au lieu de le corriger.
         */
        const drivers = [
            pilote('c1', 'Casse', 'custom-template-1700000000000'),
            pilote('c2', 'Sain', 'tpl-1700000000100'),
        ];
        const templates = [modele('tpl-1700000000100')];
        expect(reparerLiensDeGabarit(drivers, templates).reparations).toEqual([]);
    });

    it('un templateId cassé qui n\'a pas la signature du défaut est laissé tel quel', () => {
        // Un identifiant écrit à la main, ou venu d'un import : on ne sait pas
        // ce qui l'a produit, donc on ne sait pas ce qu'il visait.
        const drivers = [pilote('c1', 'Inconnu', 'generic')];
        const templates = [modele('tpl-1700000000100')];
        expect(reparerLiensDeGabarit(drivers, templates).reparations).toEqual([]);
    });

    it('un état vide ne fabrique rien', () => {
        expect(reparerLiensDeGabarit([], [])).toEqual({ drivers: [], reparations: [] });
    });
});
