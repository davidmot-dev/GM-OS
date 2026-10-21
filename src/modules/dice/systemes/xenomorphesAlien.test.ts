import { describe,it,expect } from 'vitest';
import { apresImpactXeno,critiqueXenoAlien,projeterSanteXeno,resoudreAcideAlien,xenoViergeAlien } from './xenomorphesAlien';
import { combatAlienVierge } from './combatAlien';
describe('A6 — critiques particuliers et sang XX121',()=>{
    it('zéro Santé crée une demande D6 ; le sang dépend de l’espèce et du feu',()=>{
        const s={...combatAlienVierge(),xenomorphe:{...xenoViergeAlien(),xx121:true,acide:8,vitesse:2}};
        const b=apresImpactXeno(s,0,4,'ordinaire','coup');expect(b.critiques).toEqual(['coup']);expect(b.xenomorphe?.demandesAcide).toEqual([{id:'coup',des:12}]);
        expect(apresImpactXeno(s,0,4,'fire','feu').xenomorphe?.demandesAcide).toEqual([]);expect(apresImpactXeno({...s,xenomorphe:{...s.xenomorphe,xx121:false}},1,2,'ordinaire','sans').xenomorphe?.demandesAcide).toEqual([]);
    });
    it('Blessé réduit la Vitesse à un minimum de un et restaure un seul point',()=>{const s={...combatAlienVierge(),critiques:['c'],xenomorphe:{...xenoViergeAlien(),vitesse:2}};const b=critiqueXenoAlien(s,'c',2,'Blessé','');expect(b).toMatchObject({sante:1,retirerCarte:true,suivi:{xenomorphe:{vitesse:1,etat:'blesse'}}});expect(critiqueXenoAlien(b.suivi,'c',2,'','').suivi).toBe(b.suivi);});
    it('dernier souffle blessé entretemps meurt ; 5–6 tuent immédiatement',()=>{const s={...combatAlienVierge(),critiques:['c'],xenomorphe:xenoViergeAlien()},b=critiqueXenoAlien(s,'c',4,'','').suivi;expect(apresImpactXeno(b,0,1,'ordinaire','d').mort).toBe(true);for(const n of [5,6])expect(critiqueXenoAlien(s,'c',n,'','').suivi.mort).toBe(true);});
    it('protection rongée par ses six ; l’acide sans dégâts cesse',()=>{expect(resoudreAcideAlien(12,4,6,2,2,1)).toMatchObject({degats:2,protection:4,acide:{des:12,trepas:true}});expect(resoudreAcideAlien(6,1,4,1,2,2)).toEqual({degats:0,protection:3,acide:undefined});});
    it('la projection de santé à zéro conserve une créature encore active',()=>{const r={sante:'sante'} as Parameters<typeof projeterSanteXeno>[0],s={...combatAlienVierge(),xenomorphe:xenoViergeAlien()};expect(projeterSanteXeno(r,{sante:0},s,{type:'hp',data:{current:0,max:6},state:'dead',badges:[]})?.state).toBe('critical');});
});
