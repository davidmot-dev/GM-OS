import { describe, it, expect } from 'vitest';
import { ecrireLaCampagne } from './ecritureDeLaCampagne';
import { projetVide, type ProjetDeCampagne } from './ForgeDeCampagne';
import type { GameDriver } from '../../../types/drivers';

/**
 * Ce que ces tests protègent : **rien ne disparaît, et rien n'est écrasé**.
 *
 * Les deux défauts visés sont muets par nature. Un renvoi filtré laisse une
 * scène d'aspect normal ; une reforge qui écrase laisse une campagne d'aspect
 * normal. Ni l'un ni l'autre ne se voit à la relecture — seulement à table, et
 * trop tard.
 */

/** Identifiants prévisibles : les tests portent sur les liens, pas sur l'aléa. */
function compteur() {
    const rangs: Record<string, number> = {};
    return (prefixe: string) => `${prefixe}-${rangs[prefixe] = (rangs[prefixe] ?? 0) + 1}`;
}

const PROJET = (): ProjetDeCampagne => ({
    ...projetVide(),
    campagne: { name: 'Le secret de Milo', description: 'Une enquête.', synopsis: 'Venise.' },
    actes: [{ titre: 'Mystères en Italie', resume: 'On creuse.' }],
    lieux: [{ name: "Villa d'Este", type: 'region' }],
    factions: [{ title: 'La Confrérie', content: 'Elle veut le codex.' }],
    pnj: [
        { name: 'Milo Torricelli', faction: 'La Confrérie', lieu: "Villa d'Este", acte: 'Mystères en Italie' },
        { name: 'Furlan', role: 'hostile' },
    ],
    relations: [{ source: 'Milo Torricelli', cible: 'Furlan', type: 'rival', description: 'Ils se disputent le codex.' }],
    indices: [{ title: 'La chouette', content: 'Elle désigne la villa.', porteur: 'Milo Torricelli', lieu: "Villa d'Este", acte: 'Mystères en Italie' }],
    scenes: [{
        titre: 'La villa au crépuscule',
        acte: 'Mystères en Italie',
        lieu: "Villa d'Este",
        pnj: ['Milo Torricelli'],
        indices: ['La chouette'],
    }],
    savoir: [{ title: 'La lettre', content: 'Elle arrive au matin.', category: 'lore' }],
});

const options = () => ({ identifiant: compteur(), campaignId: 'c-1' });

describe('ecrireLaCampagne', () => {
    it('résout les renvois de la scène vers ce que les étages ont créé', () => {
        const ecrit = ecrireLaCampagne(PROJET(), options());

        const scene = ecrit.scenes[0];
        expect(scene.acteId).toBe(ecrit.actes[0].id);
        expect(scene.lieuId).toBe(ecrit.atlasMaps[0].id);
        expect(scene.entiteIds).toEqual([ecrit.entities[0].id]);
        expect(scene.indiceIds).toEqual([ecrit.clues[0].id]);
        expect(ecrit.nonResolus).toEqual([]);
    });

    it('accroche un indice à son porteur, son lieu et son acte', () => {
        const ecrit = ecrireLaCampagne(PROJET(), options());

        expect(ecrit.clues[0].ownerId).toBe(ecrit.entities[0].id);
        expect(ecrit.clues[0].locationId).toBe(ecrit.atlasMaps[0].id);
        // Le moment porte le TITRE de l'acte : c'est un champ que des écrans
        // affichent tel quel.
        expect(ecrit.clues[0].campaignMoment).toBe('Mystères en Italie');
    });

    it('pose le lien sur le personnage source', () => {
        const ecrit = ecrireLaCampagne(PROJET(), options());

        expect(ecrit.entities[0].relations).toEqual([{
            targetId: ecrit.entities[1].id,
            targetType: 'npc',
            type: 'rival',
            description: 'Ils se disputent le codex.',
        }]);
    });

    it('tolère un accent ou une majuscule perdus en chemin', () => {
        const projet = PROJET();
        projet.scenes[0].pnj = ['MILO TORRICELLI'];
        projet.scenes[0].lieu = "villa d'este";

        const ecrit = ecrireLaCampagne(projet, options());

        expect(ecrit.scenes[0].entiteIds).toHaveLength(1);
        expect(ecrit.scenes[0].lieuId).toBeDefined();
        expect(ecrit.nonResolus).toEqual([]);
    });
});

describe('les renvois qui ne tombent pas juste', () => {
    it('dit ce qui manque au lieu de le filtrer en silence', () => {
        const projet = PROJET();
        projet.scenes[0].pnj = ['Milo Torricelli', 'Un figurant du livre'];
        projet.scenes[0].lieu = 'Une auberge jamais créée';

        const ecrit = ecrireLaCampagne(projet, options());

        // La scène garde ce qui se résout…
        expect(ecrit.scenes[0].entiteIds).toEqual([ecrit.entities[0].id]);
        expect(ecrit.scenes[0].lieuId).toBeUndefined();
        // …et ce qui ne se résout pas est NOMMÉ.
        expect(ecrit.nonResolus).toEqual(expect.arrayContaining([
            { depuis: 'scène « La villa au crépuscule »', champ: 'pnj', nom: 'Un figurant du livre' },
            { depuis: 'scène « La villa au crépuscule »', champ: 'lieu', nom: 'Une auberge jamais créée' },
        ]));
    });

    it("ne crée pas de scène orpheline quand l'acte ne se résout pas", () => {
        const projet = PROJET();
        projet.scenes[0].acte = 'Un acte qui n\'existe pas';

        const ecrit = ecrireLaCampagne(projet, options());

        expect(ecrit.scenes).toEqual([]);
        expect(ecrit.nonResolus.some(r => r.champ === 'acte')).toBe(true);
    });

    it('garde une faction hors liste sur la fiche du PNJ, mais la signale', () => {
        const projet = PROJET();
        projet.pnj[0].faction = 'Une guilde inventée';

        const ecrit = ecrireLaCampagne(projet, options());

        expect(ecrit.entities[0].faction).toBe('Une guilde inventée');
        expect(ecrit.nonResolus.some(r => r.champ === 'faction')).toBe(true);
    });

    it("écarte un lien d'un personnage vers lui-même", () => {
        const projet = PROJET();
        projet.relations = [{ source: 'Milo Torricelli', cible: 'Milo Torricelli', type: 'rival' }];

        const ecrit = ecrireLaCampagne(projet, options());

        expect(ecrit.entities[0].relations).toEqual([]);
    });
});

describe('reforger une campagne déjà travaillée', () => {
    const dejaLa = () => ({
        campaignId: 'c-1',
        identifiant: compteur(),
        existant: {
            actes: [{ id: 'acte-ancien', campaignId: 'c-1', ordre: 1, titre: 'Mystères en Italie', resume: 'Un enjeu que David a écrit.' }],
            entities: [{ id: 'e-ancien', campaignId: 'c-1', name: 'Milo Torricelli' } as never],
            atlasMaps: [{ id: 'am-ancien', campaignId: 'c-1', name: "Villa d'Este" } as never],
        },
    });

    it('ne double ni ne réécrit ce qui porte déjà ce nom', () => {
        const ecrit = ecrireLaCampagne(PROJET(), dejaLa());

        expect(ecrit.actes).toEqual([]);
        expect(ecrit.atlasMaps).toEqual([]);
        expect(ecrit.entities.map(e => e.name)).toEqual(['Furlan']);
        expect(ecrit.conserves).toEqual(expect.arrayContaining([
            { quoi: 'acte', nom: 'Mystères en Italie' },
            { quoi: 'personnage', nom: 'Milo Torricelli' },
        ]));
    });

    it("fait pointer les nouveaux renvois vers les objets conservés", () => {
        const ecrit = ecrireLaCampagne(PROJET(), dejaLa());

        expect(ecrit.scenes[0].acteId).toBe('acte-ancien');
        expect(ecrit.scenes[0].lieuId).toBe('am-ancien');
        expect(ecrit.scenes[0].entiteIds).toEqual(['e-ancien']);
        expect(ecrit.clues[0].ownerId).toBe('e-ancien');
    });

    it('rend à part les liens dont la source est un personnage conservé', () => {
        const ecrit = ecrireLaCampagne(PROJET(), dejaLa());

        // Milo est conservé : son lien vers Furlan ne peut pas voyager avec les
        // entités neuves, et le perdre priverait l'enrichissement de son objet.
        expect(ecrit.liensSurExistants).toHaveLength(1);
        expect(ecrit.liensSurExistants[0].entityId).toBe('e-ancien');
        expect(ecrit.liensSurExistants[0].relation.targetId).toBe(ecrit.entities[0].id);
    });

    it('range les scènes neuves après celles qui existaient déjà', () => {
        const ecrit = ecrireLaCampagne(PROJET(), {
            ...dejaLa(),
            existant: {
                ...dejaLa().existant,
                scenes: [{ id: 's-ancienne', acteId: 'acte-ancien', ordre: 3 } as never],
            },
        });

        expect(ecrit.scenes[0].ordre).toBe(4);
    });
});

describe('les PNJ suivent le modèle de santé du jeu', () => {
    const pilote = (combat: Record<string, unknown>) =>
        ({ name: 'x', templateId: 'tpl-alien', combat } as unknown as GameDriver);

    it("n'invente ni classe d'armure, ni vitesse, ni points de vie", () => {
        const ecrit = ecrireLaCampagne(PROJET(), {
            ...options(),
            driver: pilote({ defaultHealthType: 'clocks' }),
        });

        const milo = ecrit.entities[0];
        expect(milo.ac).toBe(0);
        expect(milo.speed).toBe(0);
        expect(milo.hp).toBe(0);
        expect(milo.healthSystem?.type).toBe('clocks');
        expect(milo.templateId).toBe('tpl-alien');
    });

    it('reprend les points rendus par la Forge quand le jeu en compte', () => {
        const projet = PROJET();
        projet.pnj[0].hp = 4;
        projet.pnj[0].maxHp = 4;

        const ecrit = ecrireLaCampagne(projet, {
            ...options(),
            driver: pilote({ defaultHealthType: 'hp' }),
        });

        expect(ecrit.entities[0].healthSystem?.data).toMatchObject({ current: 4, max: 4 });
    });

    it("retombe sur le gabarit générique quand le jeu n'a pas pu être établi", () => {
        const ecrit = ecrireLaCampagne(PROJET(), options());

        expect(ecrit.entities[0].templateId).toBe('generic');
        expect(ecrit.entities[0].healthSystem).toBeUndefined();
    });
});

describe('la campagne elle-même', () => {
    it("s'annonce à créer quand aucune campagne n'est visée", () => {
        const ecrit = ecrireLaCampagne(PROJET(), { identifiant: compteur() });

        expect(ecrit.campagne?.creee).toBe(true);
        expect(ecrit.campagne?.champs.name).toBe('Le secret de Milo');
        expect(ecrit.campaignId).toBe('c-1');
    });

    it('porte le jeu déclaré par les fiches', () => {
        const ecrit = ecrireLaCampagne(PROJET(), { ...options(), systeme: 'cthulhu-hack' });

        expect(ecrit.campagne?.champs.system).toBe('cthulhu-hack');
    });
});
