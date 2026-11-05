import type { CampDeRencontre, LigneDeRencontre } from '../../../types/rencontres.types';
import type { Combatant } from '../types';
import type { GabaritDAdversaire } from '../useBestiaireStore';
import { nomDeGabarit, origineOuDefaut } from './promotionDuCombattant';

/**
 * **Garder le plateau comme rencontre** (2026-10-12, R2).
 *
 * On compose comme d'habitude — l'Atelier, les PNJ —, puis on garde. *Un second
 * compositeur dans Combat-OS serait un second écran à apprendre pour le même
 * geste.* Ce fichier dit comment un plateau devient un **modèle** :
 *
 * - les PJ ne sont pas gardés : ils entrent à l'invocation, cochés ;
 * - un PNJ de la campagne reste un renvoi vers sa fiche ;
 * - les exemplaires d'un même adversaire (« Pillard 1 », « Pillard 2 »…) se
 *   regroupent en une ligne « 2 × Pillard », **refabriquée** à l'invocation. Un
 *   gabarit du bestiaire du même nom et du même archétype est désigné par son
 *   identifiant : ses valeurs feront foi.
 */

export interface RencontreDuPlateau {
    lignes: LigneDeRencontre[];
    /** Ce qui ne sera pas rendu tel quel — à dire avant de garder. */
    avertissements: string[];
}

const campDe = (c: Combatant): CampDeRencontre =>
    c.faction === 'ally' ? 'ally' : c.faction === 'neutral' ? 'neutral' : 'enemy';

export function rencontreDuPlateau(
    combattants: readonly Combatant[],
    gabarits: readonly GabaritDAdversaire[],
): RencontreDuPlateau {
    const lignes: LigneDeRencontre[] = [];
    const avertissements: string[] = [];
    const sansOrigine: string[] = [];

    for (const c of combattants) {
        if (c.isPlayer || c.faction === 'player') continue;
        const faction = campDe(c);

        if (c.sourceEntityId) {
            const deja = lignes.some(l => l.genre === 'entite' && l.entiteId === c.sourceEntityId);
            if (!deja) lignes.push({ genre: 'entite', entiteId: c.sourceEntityId, faction });
            continue;
        }

        // Une créature du livre redevient sa ligne (§ 210, étape D) : les exemplaires se regroupent.
        if (c.origineDuLivre) {
            const id = c.origineDuLivre.creatureId;
            const meme = lignes.find(l => l.genre === 'creature' && l.creatureId === id && l.faction === faction);
            if (meme && meme.genre === 'creature') meme.nombre += 1;
            else lignes.push({ genre: 'creature', creatureId: id, nombre: 1, nom: nomDeGabarit(c.name), faction });
            continue;
        }

        const { archetypeId, rangId } = origineOuDefaut(c.origineFabriquee);
        if (!c.origineFabriquee) sansOrigine.push(c.name);
        const nom = nomDeGabarit(c.name);
        const gabarit = gabarits.find(g => g.nom === nom && g.archetypeId === archetypeId);

        const memeLigne = lignes.find(l =>
            (l.genre === 'gabarit' || l.genre === 'archetype') && l.faction === faction && l.rangId === rangId && l.archetypeId === archetypeId
            && (l.genre === 'gabarit' ? l.nom : l.nom ?? '') === nom);
        if (memeLigne && (memeLigne.genre === 'gabarit' || memeLigne.genre === 'archetype')) {
            memeLigne.nombre += 1;
            continue;
        }

        lignes.push(gabarit
            ? { genre: 'gabarit', gabaritId: gabarit.id, nombre: 1, faction, nom, archetypeId, rangId }
            : { genre: 'archetype', archetypeId, rangId, nombre: 1, nom, faction });
    }

    if (sansOrigine.length > 0) {
        avertissements.push(
            `${sansOrigine.join(', ')} : ajouté(s) à la main, sans fiche fabriquée — `
            + 'refabriqué(s) en adversaire quelconque à l’invocation.',
        );
    }
    if (lignes.some(l => l.genre !== 'entite')) {
        avertissements.push(
            'Les adversaires fabriqués sont refabriqués à chaque invocation. Pour garder des valeurs exactes, '
            + 'range-les au bestiaire depuis leur fiche.',
        );
    }
    return { lignes, avertissements };
}
