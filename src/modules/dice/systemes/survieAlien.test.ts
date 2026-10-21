import { describe,expect,it } from 'vitest';
import { combatAlienVierge,avancerLeTempsAlien,type RegleDeCombatAlien } from './combatAlien';
import { acquitterLaTacheSurvie,ajouterUneTacheSurvie,apresLeTempsDeSurvie,bilanRadiationAlien,CLE_SURVIE_ALIEN,commencerLaSortieSurvie,encombrementAlien,lireLaSurvieAlien,objetsDeSurvie,recupererUnRadAlien,refusDeRecuperationAlien,testDeReserveAlien,totalDesRadsAlien } from './survieAlien';
export const REGLE_SURVIE_TEST:RegleDeCombatAlien={sante:'sante',force:'force',endurance:'endurance',protection:'protection',talents:'talents',proprietesArmes:'proprietes',stress:'stress',androide:'androide',survie:{air:'air',eau:'eau',nourriture:'nourriture',energie:'energie',radiations:'rads',permanents:'permanents',affame:'affame',dehydrate:'dehydrate',epuise:'epuise',gele:'gele',inventaire:'inventaire',armes:'armes',encombrement:'charge'}};
describe('Alien A5 — règles françaises de survie',()=>{
    it('Air 8 lance six dés, retire un point par 1 ; réserve nulle ne lance rien',()=>{
        const des=[1,2,1,6,1,5],res=testDeReserveAlien(8,()=>des.shift()!);
        expect(res).toEqual({avant:8,des:[1,2,1,6,1,5],pertes:3,apres:5});
        expect(testDeReserveAlien(0,()=>{throw Error('Dé interdit');})).toMatchObject({des:[],apres:0});
    });
    it('aucune échéance de consommable sans activation ; Air par Tour, Eau/Nourriture par jour, Énergie à la demande',()=>{
        const c=avancerLeTempsAlien(combatAlienVierge(),'tour');
        expect(lireLaSurvieAlien(apresLeTempsDeSurvie(REGLE_SURVIE_TEST,{},c,'tour')).taches).toHaveLength(0);
        const f={[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),actif:true}};
        expect(lireLaSurvieAlien(apresLeTempsDeSurvie(REGLE_SURVIE_TEST,f,c,'tour')).taches.map(t=>t.cible)).toEqual(['air']);
        const jour=avancerLeTempsAlien(c,'jour');
        expect(lireLaSurvieAlien(apresLeTempsDeSurvie(REGLE_SURVIE_TEST,f,jour,'jour')).taches.map(t=>t.cible)).toEqual(['eau','nourriture']);
        expect(lireLaSurvieAlien(apresLeTempsDeSurvie(REGLE_SURVIE_TEST,{...f,androide:true},jour,'jour')).taches).toHaveLength(0);
    });
    it('un reçu persiste et empêche le même événement après reprise',()=>{
        const t={id:'tour:1',genre:'reserve' as const,cible:'air' as const,motif:'Air'};
        const s=ajouterUneTacheSurvie(lireLaSurvieAlien({}),t),fin=acquitterLaTacheSurvie(s,t.id,'Fait');
        expect(ajouterUneTacheSurvie(JSON.parse(JSON.stringify(fin)),t)).toEqual(fin);
    });
    it('faim/soif/froid bloquent Santé et Stress ; épuisement ne bloque que le Stress',()=>{
        for(const e of ['affame','dehydrate','gele'])for(const quoi of ['sante','stress'] as const)expect(refusDeRecuperationAlien(REGLE_SURVIE_TEST,{[e]:true},quoi)).toBeTruthy();
        expect(refusDeRecuperationAlien(REGLE_SURVIE_TEST,{epuise:true},'sante')).toBeUndefined();
        expect(refusDeRecuperationAlien(REGLE_SURVIE_TEST,{epuise:true},'stress')).toBeTruthy();
        expect(refusDeRecuperationAlien(REGLE_SURVIE_TEST,{affame:true,androide:true},'sante')).toBeUndefined();
        expect(refusDeRecuperationAlien(REGLE_SURVIE_TEST,{[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),zone:'tour'}},'sante')).toContain('irradiée');
    });
    it('boire ou manger ne retire l’état qu’après un Quart ; chaleur immédiate et sommeil d’un Quart',()=>{
        const c=combatAlienVierge();
        for(const e of ['affame','dehydrate','epuise'] as const){
            const f={[e]:true,...commencerLaSortieSurvie(REGLE_SURVIE_TEST,{[e]:true},c,e)};
            expect(refusDeRecuperationAlien(REGLE_SURVIE_TEST,f,'stress')).toBeTruthy();
            const fin=apresLeTempsDeSurvie(REGLE_SURVIE_TEST,f,avancerLeTempsAlien(c,'quart'),'quart');
            expect(fin[e]).toBe(false);
        }
        expect(commencerLaSortieSurvie(REGLE_SURVIE_TEST,{gele:true},c,'gele').gele).toBe(false);
    });
    it('les privations à zéro demandent leur propre Trépas, et les jours sans sommeil aggravent le malus',()=>{
        const f={sante:0,affame:true,dehydrate:true,epuise:true,gele:true};
        const c=avancerLeTempsAlien(combatAlienVierge(),'jour');
        const fin=apresLeTempsDeSurvie(REGLE_SURVIE_TEST,f,c,'jour'),s=lireLaSurvieAlien(fin);
        expect(s.taches).toEqual(expect.arrayContaining([expect.objectContaining({genre:'trepas',cible:'affame'}),expect.objectContaining({cible:'epuise',motif:expect.stringContaining('−1')})]));
        const lendemain=apresLeTempsDeSurvie(REGLE_SURVIE_TEST,{...f,...fin},avancerLeTempsAlien(c,'jour'),'jour');
        expect(lireLaSurvieAlien(lendemain).taches.at(-1)?.motif).toContain('−2');
    });
    it('les radiations ne plafonnent pas à six dés ; le surplus des dix cases HTML est conservé',()=>{
        let n=0;expect(bilanRadiationAlien(12,()=>++n%2?1:6)).toMatchObject({degats:6});expect(n).toBe(12);
        const f={rads:10,[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),radsEnPlus:3}};
        expect(totalDesRadsAlien(REGLE_SURVIE_TEST.survie!,f)).toBe(13);
        expect(totalDesRadsAlien(REGLE_SURVIE_TEST.survie!,{...f,rads:9})).toBe(12);
    });
    it('un 1 transforme le Rad en permanent ; les autres faces retirent seulement les temporaires',()=>{
        expect(recupererUnRadAlien(5,2,1)).toEqual({total:5,permanents:3,change:true});
        expect(recupererUnRadAlien(5,2,6)).toEqual({total:4,permanents:2,change:true});
        expect(recupererUnRadAlien(2,2,6)).toEqual({total:2,permanents:2,change:false});
        expect(()=>recupererUnRadAlien(1,2,6)).toThrow();
    });
    it('programme radiations faibles/fortes/extrêmes et récupération hors zone sur la bonne unité',()=>{
        for(const unite of ['quart','tour','round'] as const){const f={[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),zone:unite}};expect(lireLaSurvieAlien(apresLeTempsDeSurvie(REGLE_SURVIE_TEST,f,avancerLeTempsAlien(combatAlienVierge(),unite),unite)).taches[0].genre).toBe('rad');}
        const f={rads:3,permanents:1};expect(lireLaSurvieAlien(apresLeTempsDeSurvie(REGLE_SURVIE_TEST,f,avancerLeTempsAlien(combatAlienVierge(),'quart'),'quart')).taches[0].genre).toBe('recuperation-rad');
    });
    it('calcule les vrais objets et consommables ; refuse une masse manquante ou un ancien nom changé',()=>{
        let f:Record<string,unknown>={force:2,inventaire:'Couteau\nKit',armes:'Pistolet'};
        const objets=objetsDeSurvie(REGLE_SURVIE_TEST.survie!,f),poids=Object.fromEntries(objets.map((o,i)=>[o.id,[0.5,2,1][i]]));
        expect(encombrementAlien(REGLE_SURVIE_TEST,f,5,0).complet).toBe(false);
        f={...f,[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien(f),poids,autresPoids:0.25}};
        expect(encombrementAlien(REGLE_SURVIE_TEST,f,5,0)).toMatchObject({total:5.75,normal:4,maximum:8,complet:true});
        expect(encombrementAlien(REGLE_SURVIE_TEST,{...f,inventaire:'Grenade\nKit'},5,0).complet).toBe(false);
    });
});
