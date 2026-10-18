import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { DescripteurDeJet } from '../../dice/DescripteurDeJet';
export const ficheDuJet: SheetTemplate = {id: 'rdd-r1-test', name: 'Voyageur fictif', emoji: '', reglesDeFiche: 'rdd-231', sections: [
    {id: 'caracteristiques', label: 'Caractéristiques', fields: ['melee','reve','chance'].map(id => ({id,label:id,type:'number',defaultValue:13}))},
    {id:'competences',label:'Compétences',fields:[{id:'discretion',label:'Discrétion',type:'number',defaultValue:3}]},
]};
export const jetDuTest: DescripteurDeJet = {sens:'sous-ou-egal', reserve:{base:1,max:1,faces:100}, cible:{mecanique:'reves-de-dragons',
    caracteristique:{id:'caracteristique',label:'Caractéristique',sectionId:'caracteristiques'},
    ajustement:[{id:'competence',label:'Compétence',sectionId:'competences',facultative:true}]}};
export const valeursDuJet = {endurance_max:23,endurance:23,vie_max:11,vie:8,fatigue:24,melee:13,reve:14,chance:10,discretion:3,__rddFatigue231:1};
