import './charger-typescript.mjs';
import fs from 'node:fs';
const {HealthInterpreter,etatDesCases}=await import('../../src/modules/session/logic/HealthInterpreter.ts');
export function fabriqueNephilim(pilote,fiche){
    const referentiel=JSON.parse(fs.readFileSync('docs/systems/nephilim/vecus/index.json','utf8')).entrees;
    const regle=pilote.jet.nephilim;
    function valeurs(h,maj={}){
        const v=Object.fromEntries(fiche.sections.flatMap(s=>s.fields.map(f=>[f.id,f.defaultValue??(f.type==='checkbox'?false:['number','formula','gauge'].includes(f.type)?0:'')])));
        Object.assign(v,Object.fromEntries(['fire','air','water','earth','moon'].map((e,i)=>['ka_'+e,h.ka[i]])),{identity_name:h.nom,identity_metamorph:h.metamorphe,identity_metamorph_degree:2,identity_summary:h.histoire,ka_dominant:h.dominant,
            simulacrum_name:h.simulacre,simulacrum_experience:h.metier,simulacrum_experience_degree:4,simulacrum_ka:3,simulacrum_age:'34',simulacrum_description:h.description,simulacrum_resources:h.materiel.join('\n'),simulacrum_relatives:'Contacts fictifs : Maëlle Bréant et Ada Sorel.',
            quest_fraternity_name:'Les Veilleurs du Méridien — Pentacle de recette',quest_fraternity_degree:1,quest_arcana_name:'Le Bateleur',quest_arcana_degree:1,resources_sapience:12,resources_sapience_chute:0,stasis_degree:4,stasis_name:`Stase de ${h.nom} — objet fictif de recette`,
            quests_esoteric:h.motivation,knowledge_esoteric:'Le méridien et les plaques : connaissances originales de cette campagne, sans effet mécanique automatique.',possessions_weapons:h.materiel.join('\n')});
        for(const [i,nom]of [h.passe,h.passe2].entries()){const r=referentiel.find(x=>x.nom===nom);if(!r)throw Error('Vécu absent : '+nom);v[`pastlives_${i}_name`]=nom;v[`pastlives_${i}_degree`]=i===0?4:3;v[`incarnations_${i}_era`]=r.details['Époque'];}
        Object.assign(v,{metamorphoses_0_name:h.metamorphe,metamorphoses_0_permanent:false});
        if(h.art==='Magie')Object.assign(v,{occult_magic_first:4,occult_magic_second:2,occult_magic_path:'Voie de recette à préciser en jeu',magic_spells_0_name:'RECETTE — Trace de braise',magic_spells_0_circle:1,magic_spells_0_art:'Basse Magie',magic_spells_0_element:'Feu',magic_spells_0_degree:2,magic_spells_0_range:'À arbitrer pour cet essai',magic_spells_0_duration:'Une scène fictive, arbitrage du MJ',magic_spells_0_effect:'Effet original de recette : faire apparaître un repère sur la plaque. Ne reproduit aucun sort officiel.',magic_spells_0_memorization:'Profil de test disponible ; mémorisation non jouée.'});
        if(h.art==='Kabbale')Object.assign(v,{occult_kabbalah_malkuth:3,occult_kabbalah_yesod:2,occult_kabbalah_hod:4,occult_kabbalah_world:'Monde de recette à préciser',kabbalah_ordinances_degree:1,kabbalah_ordinances_0_type:'Ordonnance fictive de test, à arbitrer',kabbalah_invocations_0_name:'RECETTE — Le Messager de nacre',kabbalah_invocations_0_sephirah:'Hod',kabbalah_invocations_0_world:'Profil fictif de test',kabbalah_invocations_0_element:'Eau',kabbalah_invocations_0_degree:2,kabbalah_invocations_0_notes:'Créature de recette originale. Peut porter une réponse dans la fiction ; pacte non noué au chargement.',kabbalah_invocations_0_memorization:'Profil pour tester invocation et pacte, pas un effet actif.'});
        if(h.art==='Alchimie')Object.assign(v,{occult_alchemy_black:4,occult_alchemy_white:2,occult_alchemy_path:'Voie de recette à préciser',alchemy_constructs_retort_assembly:'Œuvre au noir',alchemy_constructs_retort_water:4,alchemy_constructs_retort_moon:3,alchemy_formulas_0_name:'RECETTE — Brume révélatrice',alchemy_formulas_0_substance:'Prélèvement étiqueté de la serre',alchemy_formulas_0_element:'Eau',alchemy_formulas_0_degree:2,alchemy_formulas_0_effect:'Effet original de recette : révéler des différences de surface sur une plaque. Aucun profil officiel recopié.',alchemy_formulas_0_memorization:'Formule de test disponible, transmutation non jouée.'});
        for(const e of ['fire','air','water','earth','moon']){const max=h.art==='Alchimie'?4+Number(v['ka_'+e]):0;v[`alchemy_materia_${e}_max`]=max;v[`alchemy_materia_${e}`]=max;}
        Object.assign(v,maj);
        const elements=['Feu','Air','Eau','Terre','Lune'];v.ka_dominant_degre=Number(v[['ka_fire','ka_air','ka_water','ka_earth','ka_moon'][elements.indexOf(v.ka_dominant)]]??0);
        Object.assign(v,{actions_initiative:Number(v.ka_water)*2,actions_movement:Number(v.ka_water)*2,actions_insight:Math.max(1,11-Number(v.ka_air)),actions_recovery:Math.max(1,11-Number(v.ka_earth)),actions_damagebonus:Math.floor(Number(v.ka_fire)/5),actions_veil:Math.floor(Number(v.ka_moon)/5)});
        for(const p of Object.values(regle.sante)){v[p.compte]=p.cases.filter(c=>v[c.champ]===true).length;}
        return v;
    }
    function sante(d){const e=HealthInterpreter.createDefault('boxes',{cases:pilote.combat.casesDeSante}),p=regle.sante.physique;const cles=[...p.cases.slice(0,3).map(c=>c.champ),...p.consequences.map(c=>c.champ)];e.data.boxes.forEach((b,i)=>b.filled=d[cles[i]]===true);e.state=etatDesCases(e.data.seuils,e.data.boxes.filter(b=>b.filled).length);return e;}
    return {valeurs,sante};
}
