import { describe, it, expect } from 'vitest';
import {
    TAILLE_DU_RATELIER, idDeCase, numeroDeCase, nomParDefaut, casesAGarnir,
} from './ratelierDeLaCampagne';
import type { LightScene } from '../useLightStore';

/**
 * Ce que ces tests protègent : **chaque campagne a ses dix-huit cases, et
 * personne n'en fabrique deux fois.**
 *
 * Jusqu'au 2026-09-19, les dix-huit étaient *partagées* : rattacher une tuile à
 * *Alien* la retirait de la grille de *Rêves de Dragons*. On ne rangeait pas,
 * on rétrécissait — et c'est ce qui bloquait l'idée d'une IA qui compose des
 * ambiances : *elle n'avait nulle part où les ranger.*
 *
 * ⛔ **Le garnissage est le seul endroit du module qui CRÉE des tuiles.** Un
 * garnissage qui se répète remplirait le magasin à chaque ouverture d'écran, et
 * rien ne le dirait avant que la grille ne compte trente-six cases.
 */

const tuile = (id: string, campagneId: string | null, pleine = false): LightScene => ({
    id,
    name: nomParDefaut(id),
    icon: 'wb_incandescent',
    color: '#334155',
    lightStates: pleine ? { '1': { on: true, bri: 200 } } : {},
    campagneId,
});

const enRecord = (tuiles: LightScene[]): Record<string, LightScene> =>
    Object.fromEntries(tuiles.map(t => [t.id, t]));

describe('l’identifiant d’une case', () => {
    it('garde sa forme d’origine pour le pot commun', () => {
        expect(idDeCase(null, 7)).toBe('SCENE_07');
        expect(idDeCase(null, 18)).toBe('SCENE_18');
    });

    /** ⛔ Les dix-huit tuiles d'origine gardent leur identifiant : aucun lien cassé. */
    it('porte la campagne quand il y en a une', () => {
        expect(idDeCase('c-1758295200000', 7)).toBe('SCENE_c-1758295200000_07');
    });

    /**
     * ⛔ `sceneId.split('_')[1]` rendait la campagne au lieu du numéro, et
     * `parseInt` en faisait `NaN` : une tuile effacée s'appelait **« Scene
     * NaN »**.
     */
    it('se relit par la fin, jamais par le début', () => {
        expect(numeroDeCase('SCENE_07')).toBe(7);
        expect(numeroDeCase('SCENE_c-1758295200000_07')).toBe(7);
        expect(nomParDefaut('SCENE_c-1758295200000_12')).toBe('Scene 12');
    });

    it('ne rend jamais NaN, même sur un identifiant qu’on n’attendait pas', () => {
        expect(numeroDeCase('SCENE_inattendu')).toBe(0);
        expect(nomParDefaut('SCENE_inattendu')).toBe('Scene 0');
    });
});

describe('garnir un râtelier', () => {
    it('donne ses dix-huit cases à une campagne qui n’en a aucune', () => {
        const manquantes = casesAGarnir({}, 'camp-a');

        expect(manquantes).toHaveLength(TAILLE_DU_RATELIER);
        expect(manquantes.every(t => t.campagneId === 'camp-a')).toBe(true);
        expect(manquantes[0].id).toBe('SCENE_camp-a_01');
    });

    it('et au pot commun les siennes, sous leurs identifiants d’origine', () => {
        const manquantes = casesAGarnir({}, null);

        expect(manquantes[0].id).toBe('SCENE_01');
        expect(manquantes[0].campagneId).toBeNull();
    });

    /** ⛔ La règle qui empêche le magasin d'enfler à chaque ouverture d'écran. */
    it('ne rend rien la seconde fois', () => {
        const premier = casesAGarnir({}, 'camp-a');

        expect(casesAGarnir(enRecord(premier), 'camp-a')).toHaveLength(0);
    });

    it('ne complète que ce qui manque', () => {
        const partiel = enRecord([
            tuile('SCENE_camp-a_01', 'camp-a', true),
            tuile('SCENE_camp-a_02', 'camp-a'),
        ]);

        const manquantes = casesAGarnir(partiel, 'camp-a');

        expect(manquantes).toHaveLength(TAILLE_DU_RATELIER - 2);
        expect(manquantes.map(t => t.id)).not.toContain('SCENE_camp-a_01');
    });

    it('ne touche pas au râtelier des autres', () => {
        const dAilleurs = enRecord([tuile('SCENE_camp-b_01', 'camp-b', true)]);

        const manquantes = casesAGarnir(dAilleurs, 'camp-a');

        expect(manquantes).toHaveLength(TAILLE_DU_RATELIER);
        expect(manquantes.map(t => t.id)).not.toContain('SCENE_camp-b_01');
    });

    /**
     * ⚠️ **Dix-huit est un plancher, pas un plafond.** Le meneur peut rattacher
     * une tuile commune à sa campagne : son râtelier en compte alors dix-neuf,
     * et on ne lui en retire pas une. *Un nombre rond n'a jamais valu qu'on
     * refuse un geste au meneur.*
     */
    it('ne retire jamais rien à un râtelier trop plein', () => {
        const trop = enRecord(
            Array.from({ length: 19 }, (_, i) => tuile(idDeCase('camp-a', i + 1), 'camp-a', true)),
        );

        expect(casesAGarnir(trop, 'camp-a')).toHaveLength(0);
    });

    /**
     * ⛔ **Le cas qui écraserait du travail.** Une case a été rattachée
     * ailleurs : son identifiant est pris, mais elle ne compte plus dans ce
     * râtelier. On saute son numéro au lieu de fabriquer une tuile par-dessus.
     */
    it('saute un numéro dont l’identifiant est déjà pris par quelqu’un d’autre', () => {
        const pris = enRecord([tuile('SCENE_camp-a_01', 'camp-b', true)]);

        const manquantes = casesAGarnir(pris, 'camp-a');

        expect(manquantes.map(t => t.id)).not.toContain('SCENE_camp-a_01');
        expect(manquantes).toHaveLength(TAILLE_DU_RATELIER - 1);
    });

    it('naît vide, donc prête à capturer', () => {
        const [premiere] = casesAGarnir({}, 'camp-a');

        expect(premiere.lightStates).toEqual({});
        expect(premiere.name).toBe('Scene 1');
    });
});
