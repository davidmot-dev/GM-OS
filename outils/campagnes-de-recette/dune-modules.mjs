import './charger-typescript.mjs';
const {creerConflitDune,commanderConflitDune,validerConflitDune}=await import('../../src/modules/dice/systemes/conflitsDeDune.ts');
const {maisonDepuisLaFiche}=await import('../../src/modules/modulesDuJeu/dune/maisonDeLaFiche.ts');
export function preparerModuleDune(pcs,maison,prefixe,{laboratoire=false}={}){
    let e=creerConflitDune();const cmd=(id,charge)=>{e=commanderConflitDune(e,{id,charge},{role:'mj'});};
    cmd('cadre',{arene:laboratoire?'escarmouche':'intrigue',mode:laboratoire?'agent':'architecte'});
    cmd('scene',{nom:laboratoire?'LABORATOIRE — les cinq arènes':'S08 — La garantie de Nalia'});
    cmd('maison',{...maisonDepuisLaFiche(maison),allies:'Ateliers du Parvis ; opérateurs du Relais',atouts:'Archives de concession ; équipes de maintenance ; délégation accréditée'});
    const zones=[['parvis','Les ateliers du Parvis',true,'Nombreux témoins','prudents','SECRET_MODULE_DUNE : garantir une journée de distribution avant toute saisie.',4],['nalia','Nalia Sareth',true,'Mandat de négociation','réservée','SECRET_DESIR_NALIA : faire payer ses ouvriers et dissocier sa Maison de Ravel.',6],['commission','La commission locale',true,'Audience publique','impartiale','SECRET_MODULE_DUNE : obtenir une preuve contradictoire avant de suspendre le contrat.',6],['rav','Le réseau de Ravel',true,'Intermédiaires sous contrat','hostile','SECRET_MODULE_DUNE : provoquer une vente forcée sans être nommé.',7],['cache','Réserve cachée de Ravel',false,'SECRET_ZONE_DUNE : comptes hors registre','','SECRET_MODULE_DUNE : conserver les avances.',5]];
    const nomsDeLabo=['Quai des citernes','Passerelle de service','Vanne centrale','Cour du dépôt','Local masqué'];
    for(const [i,[slug,nom,visible,traits,disposition,desir,discipline]]of zones.entries())cmd('zone',{id:`${prefixe}-zone-${slug}`,nom:laboratoire?nomsDeLabo[i]:nom,visible,traits:laboratoire?(visible?'Zone abstraite de laboratoire':'SECRET_ZONE_DUNE : local technique'):traits,disposition,desir,discipline,desirRevele:false});
    for(const [a,b]of [['parvis','nalia'],['nalia','commission'],['commission','rav'],['rav','cache'],['parvis','commission']])cmd('lier',{zoneId:`${prefixe}-zone-${a}`,autreId:`${prefixe}-zone-${b}`});
    const atouts=[['analyse','Copie du registre',pcs[0].name,1,false,true,true,'offensif','parvis'],['sceau','Sceau de délégation',pcs[1].name,1,true,true,true,'autre','parvis'],['garde','Équipe de protection',pcs[2].name,1,true,true,true,'defensif','parvis'],['soutien','Soutien des ateliers','Maison Vaëlan',0,false,false,true,'autre','parvis'],['escorte','Escorte sous contrat','Ravel',1,true,true,true,'defensif','rav'],['pression','Avance privée — SECRET_ATOUT_DUNE','Ravel',2,false,true,false,'offensif','cache']];
    for(const [slug,nom,proprietaire,qualite,tangible,permanent,visible,usage,zone]of atouts)cmd('atout',{id:`${prefixe}-atout-${slug}`,nom,proprietaire,qualite,tangible,permanent,visible,usage,zone:`${prefixe}-zone-${zone}`,militaire:laboratoire&&slug==='garde'});
    validerConflitDune(e);return {'dune-conflits':{versionDonnees:1,donnees:e}};
}
