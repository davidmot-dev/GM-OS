import { describe,it,expect } from 'vitest';
import { acheterAlien,bilanPxAlien,caviarderObjectifsAlien,CLE_PROGRESSION_ALIEN,finirActeAlien,lireProgressionAlien,totalExperienceAlien,utiliserFeticheAlien,type RegleDeProgressionAlien } from './progressionAlien';
const r:RegleDeProgressionAlien={experience:'px',recit:'recit',fetiche:'objet',camarade:'ami',rival:'rival',esprit:'esprit',competences:['comtech']};
const fiche=(mode:'cinema'|'campagne'='campagne')=>({px:12,recit:2,objet:'Photo',stress:4,talent:'',comtech:0,[CLE_PROGRESSION_ALIEN]:{...lireProgressionAlien({}),mode,scenario:'Film-1',acte:1,seance:'seance-1'}});
describe('A7 — périodes, gains et achats persistants',()=>{
    it('fin d’acte +1 plafonné à trois et attribué une seule fois',()=>{const f=fiche('cinema'),m=finirActeAlien(r,f,true);expect(m.recit).toBe(3);expect(finirActeAlien(r,JSON.parse(JSON.stringify({...f,...m})),true)).toEqual({});expect(finirActeAlien(r,fiche(),true)).toEqual({});});
    it('une fin d’acte sans gain est aussi traitée',()=>{const f=fiche('cinema'),m=finirActeAlien(r,f,false);expect(m.recit).toBe(2);expect(finirActeAlien(r,{...f,...m},true)).toEqual({});});
    it('les neuf oui donnent neuf PX une seule fois',()=>{const f=fiche(),m=bilanPxAlien(r,f,Array(9).fill(true));expect(m.px).toBe(21);expect(bilanPxAlien(r,{...f,...m},Array(9).fill(true))).toEqual({});});
    it('le fétiche est par acte en Cinéma, par séance en Campagne',()=>{
        for(const mode of ['cinema','campagne'] as const){let f:Record<string,unknown>=fiche(mode);f={...f,...utiliserFeticheAlien(r,f,'stress')};expect(f.stress).toBe(3);expect(utiliserFeticheAlien(r,f,'stress')).toEqual({});f[CLE_PROGRESSION_ALIEN]={...lireProgressionAlien(f),acte:2};expect(Object.keys(utiliserFeticheAlien(r,f,'stress')).length>0).toBe(mode==='cinema');}
    });
    it('refuse un apprentissage en séance et une nouvelle compétence sans prérequis',()=>{const f=fiche(),a={id:'achat',type:'competence' as const,champ:'comtech',entreSeances:false,prerequis:true,jour:1,reussites:1,talents:'talent'};expect(acheterAlien(r,f,a)).toEqual({});expect(acheterAlien(r,f,{...a,entreSeances:true,prerequis:false})).toEqual({});});
    it('achat à 5 PX, niveau +1, reçu conservé après reconnexion',()=>{const f=fiche(),a={id:'achat',type:'competence' as const,champ:'comtech',entreSeances:true,prerequis:true,jour:1,reussites:1,talents:'talent'},m=acheterAlien(r,f,a);expect(m).toMatchObject({px:7,comtech:1});expect(acheterAlien(r,JSON.parse(JSON.stringify({...f,...m})),a)).toEqual({});expect(acheterAlien(r,{...f,comtech:5},a)).toEqual({});});
    it('talent raté : tentative du jour consommée, aucun PX ; pas de seconde tentative',()=>{
        const f=fiche(),a={id:'a',type:'talent' as const,champ:'',nom:'Nerfs d’acier',entreSeances:true,prerequis:true,jour:1,reussites:0,talents:'talent'},m=acheterAlien(r,f,a);expect(m.px).toBeUndefined();expect(acheterAlien(r,{...f,...m},{...a,id:'b',reussites:1})).toEqual({});expect(acheterAlien(r,{...f,...m},{...a,id:'b',jour:2,reussites:1})).toMatchObject({px:7,talent:'Nerfs d’acier'});
    });
    it('aucun objectif secret ou reçu de remise dans le flux public, même imbriqué',()=>{
        const f=fiche('cinema');f[CLE_PROGRESSION_ALIEN].objectifs={'Film-1:1':'SECRET'};f[CLE_PROGRESSION_ALIEN].remis={'Film-1:1':'SECRET'};
        const charge={session:{players:[{characters:[{sheetData:f}]}]},combat:{combatants:[{sheetData:f}]}},publics=caviarderObjectifsAlien(charge);
        expect(JSON.stringify(publics)).not.toContain('SECRET');expect(JSON.stringify(charge)).toContain('SECRET');
    });
    it('conserve les PX au-delà des dix cases HTML et paie depuis le total réel',()=>{
        const f=fiche(),m=bilanPxAlien(r,f,Array(9).fill(true)),retourHtml={...f,...m,px:10};expect(totalExperienceAlien(r,retourHtml)).toBe(21);
        const achat=acheterAlien(r,retourHtml,{id:'p',type:'competence',champ:'comtech',entreSeances:true,prerequis:true,jour:1,reussites:1,talents:'talent'});expect(achat.px).toBe(16);
        expect(totalExperienceAlien(r,{...retourHtml,...achat,px:10})).toBe(16);
    });
});
