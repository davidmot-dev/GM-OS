import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { CALCULS_DU_VOYAGEUR, HEURES_DRACONIQUES } from './ficheDeVoyageur';
export const fiche: SheetTemplate = {
    id: 'fiche-voyageur-test', name: 'Voyageur', emoji: '', reglesDeFiche: 'rdd-231',
    sections: [{ id: 'valeurs', label: 'Valeurs', fields: Object.entries({
        taille: 10, constitution: 13, force: 11, agilite: 14, vue: 13, dexterite: 12,
        volonte: 12, reve: 14, chance: 10, points_de_chance: 3,
        vie: 7, endurance: 12, reve_pts: 17, reve_seuil: 14,
        melee: 0, tir: 0, lancer: 0, derobee: 0, vie_max: 0, endurance_max: 0,
        sc: 4, sust: 3, plus_dom: 0, enc: 0, reve_eclatement: 0,
    }).map(([id, defaultValue]) => ({id, label: id, type: CALCULS_DU_VOYAGEUR[id] ? 'formula' as const : 'number' as const,
        defaultValue, ...(CALCULS_DU_VOYAGEUR[id] ? {formula: CALCULS_DU_VOYAGEUR[id]} : {})})),
    }, { id: 'identite', label: 'Identité', fields: [
        {id: 'heure_naissance', label: 'Heure de naissance', type: 'select', defaultValue: 'Le Dragon', options: HEURES_DRACONIQUES},
        {id: 'poids_kg', label: 'Poids', type: 'text', defaultValue: '65'},
        {id: 'beaute', label: 'Beauté', type: 'number', defaultValue: 12},
    ] }],
};
