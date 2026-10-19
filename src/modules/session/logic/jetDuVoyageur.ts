import { preparerLeJet, type DescripteurDeJet } from '../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { etatDuVoyageur, malusDuJetVoyageur, type NatureDeJetVoyageur } from './fatigueDuVoyageur';
import { lireMoral } from './moralDuVoyageur';

/** R1 compose l'ajustement ; le moteur RdD existant conserve sa table et ses degrés. */
export function preparerJetDuVoyageur(descripteur: DescripteurDeJet, fiche: SheetTemplate,
    valeurs: Record<string, unknown>, champs: Record<string, string>, difficulte: number, nature: NatureDeJetVoyageur = 'action',
    options: {astrologie?:number;moralEngage?:number} = {}) {
    if (descripteur.cible?.mecanique !== 'reves-de-dragons') throw new Error('Ce panneau attend une résolution Rêve de Dragon.');
    const caracteristique = nature === 'chance' ? 'chance' : champs[descripteur.cible.caracteristique.id];
    const malus = malusDuJetVoyageur(etatDuVoyageur(valeurs), nature, caracteristique);
    const chance = caracteristique === 'chance';
    const section = {id: '__rddEtatDuJet', label: 'État général', fields: [{id: '__rddEtatDuJet', label: 'État général', type: 'number' as const, defaultValue: 0}]};
    const d = {...descripteur, cible: {...descripteur.cible,
        ajustement: [...(chance ? [] : descripteur.cible.ajustement ?? []), {id: '__rddEtatDuJet', label: 'État général', sectionId: section.id}]}};
    const moralVolonte = caracteristique === 'volonte' ? lireMoral(valeurs).moral : 0;
    const astrologie = chance || nature === 'rituel' ? options.astrologie ?? 0 : 0;
    const bonus = moralVolonte+astrologie+(options.moralEngage ?? 0);
    const jet = preparerLeJet(d, {...valeurs, __rddEtatDuJet: malus}, {champs: {...champs,
        [d.cible.caracteristique.id]: caracteristique, __rddEtatDuJet: '__rddEtatDuJet'}, ajustementDeDifficulte: difficulte+bonus}, [...fiche.sections, section]);
    return {jet, malus, moralVolonte, astrologie, assomme:etatDuVoyageur(valeurs).assomme};
}
