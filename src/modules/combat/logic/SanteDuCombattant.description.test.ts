import { describe, it, expect } from 'vitest';
import {
    decrireLaSante, santeDeDepart, aUneJaugeDeVie, fractionDeVie,
    pointsDeVieApres, estHorsDeCombat, type PorteurDeSante,
} from './SanteDuCombattant';

/**
 * Ce que ces tests protègent : **l'invite envoyée à l'IA ne doit rien affirmer
 * qu'elle ne sache.**
 *
 * Relevé le 2026-08-14 : trois écrits — `useOracleContext`, `AIService` et
 * `useJournalStore` — envoyaient `HP ${c.hp}/${c.maxHp}` sans jamais consulter
 * le modèle de santé du pilote. Sur Alien, qui n'a pas de points de vie,
 * l'Oracle recevait littéralement **« HP undefined/undefined »** pour chaque
 * personnage. Le Sage ne pouvait que l'ignorer ou l'inventer.
 *
 * *Une valeur fausse dans une invite est une affirmation, pas un silence.*
 */

describe('décrire une santé qu\'on connaît', () => {
    it('des points de vie ordinaires', () => {
        expect(decrireLaSante({ hp: 12, hpMax: 20 })).toBe('12/20 PV');
    });

    it('accepte les deux noms du maximum', () => {
        // `Combatant` dit `hpMax` ; `Entity` et `PlayerCharacter` disent `maxHp`.
        // Le piège est ancien et documenté ; il ne doit pas coûter une ligne muette.
        expect(decrireLaSante({ hp: 3, maxHp: 4 })).toBe('3/4 PV');
    });

    it('une horloge de défaite — c\'est Dune', () => {
        expect(decrireLaSante({
            healthSystem: { type: 'clocks', data: { filled: 2, segments: 6 }, state: 'wounded' },
        })).toBe('horloge de défaite 2/6 (blessé)');
    });

    it('des cases cochées', () => {
        expect(decrireLaSante({
            healthSystem: {
                type: 'boxes',
                data: { boxes: [{ filled: true }, { filled: true }, { filled: false }] },
                state: 'scratched',
            },
        })).toBe('2/3 cases cochées (égratigné)');
    });

    it('un niveau de blessure nommé', () => {
        expect(decrireLaSante({
            healthSystem: {
                type: 'wounds',
                data: { levels: ['Sonné', 'Blessé', 'Grave'], currentIndex: 1 },
                state: 'wounded',
            },
        })).toBe('blessure « Blessé » (blessé)');
    });

    it('le système fait autorité sur la jauge', () => {
        // C'est la règle du module : `healthSystem` l'emporte, c'est lui que
        // `HealthInterpreter` fait vivre.
        expect(decrireLaSante({
            hp: 99, hpMax: 99,
            healthSystem: { type: 'clocks', data: { filled: 6, segments: 6 }, state: 'dead' },
        })).toBe('horloge de défaite 6/6 (hors de combat)');
    });
});

describe('se taire quand il n\'y a rien à dire', () => {
    it('un personnage d\'Alien n\'a pas de points de vie', () => {
        /**
         * Le cas exact du défaut. Avant, cette absence produisait
         * « HP undefined/undefined » dans l'invite de l'Oracle.
         */
        expect(decrireLaSante({})).toBeNull();
        expect(decrireLaSante({ hp: undefined, maxHp: undefined })).toBeNull();
    });

    it('un maximum à zéro n\'est pas une jauge', () => {
        // Diviser par lui n'aurait aucun sens, et l'afficher ferait croire à un
        // mourant. *L'absence n'est pas un zéro.*
        expect(decrireLaSante({ hp: 0, hpMax: 0 })).toBeNull();
    });

    it('un système sans données chiffrables rend son état, jamais un faux compte', () => {
        expect(decrireLaSante({ healthSystem: { type: 'anatomy', data: {}, state: 'critical' } }))
            .toBe('état critique');
        expect(decrireLaSante({ healthSystem: { type: 'clocks', data: {}, state: 'healthy' } }))
            .toBe('indemne');
    });

    it('un état inconnu se rend tel quel plutôt que d\'être traduit au hasard', () => {
        expect(decrireLaSante({ healthSystem: { type: 'hp', data: {}, state: 'stase' } }))
            .toBe('stase');
    });
});

describe('la santé de départ, lue sur la fiche', () => {
    /**
     * **Le défaut : sept endroits écrivaient dix.** Chez Alien la Santé vaut la
     * Force du personnage — deux à cinq — et tous les combattants entraient
     * avec dix points de vie. Même défaut que `createDefault('clocks')`, qui
     * donnait six segments à tout le monde : *une valeur qui dépend du
     * personnage ne peut pas vivre dans le pilote.*
     */
    const fiche = (v: Record<string, number>) => (champ: string) => v[champ.toLowerCase()];

    it('un attribut seul — c\'est Alien', () => {
        expect(santeDeDepart('force', fiche({ force: 4 }))).toBe(4);
    });

    it('une composition de deux attributs — c\'est le SRD Year Zero Engine', () => {
        // « la moyenne des scores de Force et d'Agilité, arrondie à l'entier
        // supérieur, plus un ». Un champ unique n'aurait pas su l'exprimer.
        expect(santeDeDepart('(force + agilite) / 2 + 1', fiche({ force: 4, agilite: 3 }))).toBe(5);
    });

    it('arrondit au supérieur : un demi point de vie n\'existe nulle part', () => {
        expect(santeDeDepart('force / 2', fiche({ force: 5 }))).toBe(3);
    });

    it('jamais en dessous de un — un personnage ne naît pas hors de combat', () => {
        expect(santeDeDepart('force - 10', fiche({ force: 2 }))).toBe(1);
        expect(santeDeDepart('force', fiche({ force: 0 }))).toBe(1);
    });

    it('sans formule, on ne fait rien — l\'existant garde son comportement', () => {
        expect(santeDeDepart(undefined, fiche({ force: 4 }))).toBeNull();
        expect(santeDeDepart('', fiche({ force: 4 }))).toBeNull();
        expect(santeDeDepart('   ', fiche({ force: 4 }))).toBeNull();
    });

    it('un champ absent de la fiche ne vaut pas zéro : on renonce', () => {
        // Le contrôle du pilote signale ce cas à la revue. En séance, on rend
        // `null` et l'écran garde ce qu'il fournissait, plutôt que de faire
        // naître un personnage à un point de vie.
        expect(santeDeDepart('vigueur', fiche({ force: 4 }))).toBeNull();
    });

    it('un attribut en dés échelonnés est illisible, pas nul', () => {
        /**
         * **Charge réelle du 2026-08-15**, relevée dans l'état persisté de
         * David : quatre de ses cinq personnages portent `force: "D (D6)"` — la
         * notation de la seconde variante de Year Zero Engine, où un attribut
         * est une **taille de dé** et non un nombre.
         *
         * Substituer zéro les aurait fait naître avec un point de vie, à partir
         * d'une valeur qu'on n'avait pas su lire. *L'absence n'est pas un zéro,
         * et un champ illisible est une absence.*
         */
        const echelonnee = (champ: string) => (champ === 'force' ? undefined : 0);
        expect(santeDeDepart('force', echelonnee)).toBeNull();
    });

    it('n\'exécute rien : ce qui n\'est pas de l\'arithmétique est refusé', () => {
        /**
         * La formule vient du pilote, donc d'un modèle de langage, qui écrit ce
         * qu'il veut. On la calcule, on ne l'évalue pas.
         */
        expect(santeDeDepart('force);alert(1', fiche({ force: 4 }))).toBeNull();
        expect(santeDeDepart('((force', fiche({ force: 4 }))).toBeNull();
        expect(santeDeDepart('force /', fiche({ force: 4 }))).toBeNull();
    });

    it('une division par zéro renonce plutôt que de rendre l\'infini', () => {
        expect(santeDeDepart('force / agilite', fiche({ force: 4, agilite: 0 }))).toBeNull();
    });
});

describe('la santé d\'un personnage sans points de vie', () => {
    /**
     * **Le cadrage de David, le 2026-08-15, et il débloque tout le reste :**
     * *« normalement tout jeu a un mécanisme de Santé ; tu peux dire que s'il
     * n'y en a pas, il peut mettre un système de HP par défaut ».*
     *
     * C'est juste, et la distinction est celle qui manquait : **le mécanisme,
     * c'est `healthSystem`** — il connaît cinq formes et il est toujours là.
     * Les points de vie n'en sont qu'une, celle du modèle `hp`. Les tenir pour
     * obligatoires revenait à imposer D&D à tous les jeux, et c'est ce qui
     * cassait la logique des pilotes dans Combat OS.
     *
     * `hp`/`maxHp` sont donc devenus facultatifs sur `PlayerCharacter`, et les
     * six écrans qui les lisaient passent par ces fonctions.
     */
    it('un personnage d\'Alien n\'a ni jauge ni fraction, sans que rien ne casse', () => {
        const perso = { name: 'Ripley' } as PorteurDeSante;

        expect(aUneJaugeDeVie(perso)).toBe(false);
        expect(fractionDeVie(perso), 'aucune barre à dessiner').toBeNull();
        expect(pointsDeVieApres(perso, -3), 'rien à retrancher').toBeNull();
        expect(estHorsDeCombat(perso), 'faute d\'information, on ne le déclare pas mort').toBe(false);
    });

    it('le système de santé fait autorité, même sans points de vie', () => {
        const brise = {
            healthSystem: { type: 'clocks', data: { filled: 6, segments: 6 }, state: 'dead' },
        };
        expect(estHorsDeCombat(brise)).toBe(true);
        expect(decrireLaSante(brise)).toContain('hors de combat');
    });

    it('les deux noms du maximum donnent la même fraction', () => {
        // `Combatant` dit `hpMax`, `PlayerCharacter` dit `maxHp` : un piège
        // ancien, qui aurait rendu la moitié des écrans muets.
        expect(fractionDeVie({ hp: 3, hpMax: 6 })).toBe(0.5);
        expect(fractionDeVie({ hp: 3, maxHp: 6 })).toBe(0.5);
    });
});
