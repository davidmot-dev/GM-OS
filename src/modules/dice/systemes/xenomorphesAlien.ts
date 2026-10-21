import type { HealthSystem } from '../../../types/entity.types';
import type { CombatAlien, RegleDeCombatAlien } from './combatAlien';

export interface XenomorpheAlien {
    vitesse: number; maximum: number; protection: number; competences: Record<string,number>;
    table: string; xx121: boolean; acide: number; etat: 'actif'|'ruse'|'blesse'|'reflexe'|'souffle'|'mort';
    critique?: { code: number; titre: string; effet: string }; fuiteRound?: number;
    demandesAcide: {id:string;des:number}[]; recusAcide: string[];
    reflexe?: 'fuite'|'attaque';
    attaque?: {code:number;titre:string;effet:string};
    reflexeActions?: {lente:boolean;rapide:boolean};
}
export interface AspersionAlien { id:string; des:number; round:number; traiteRound?:number }
export interface AcideAlien { des: number; round: number; trepas: boolean; traiteRound?: number; trepasRound?: number; aspersions?:AspersionAlien[] }
export function xenoViergeAlien(): XenomorpheAlien {
    return {vitesse:1,maximum:1,protection:0,competences:{},table:'attaques_xenomorphe_rodeur',xx121:false,acide:0,etat:'actif',demandesAcide:[],recusAcide:[]};
}
/** Les impacts réels produisent des demandes persistantes ; le feu ne fait pas couler le sang. */
export function apresImpactXeno(s: CombatAlien, hp: number, degats: number, origine: string, id: string): CombatAlien {
    let x = s.xenomorphe; if(!x || x.etat==='mort' || degats<=0) return s;
    if(x.xx121 && x.acide>0 && !['feu','fire'].includes(origine) && !x.demandesAcide.some(d=>d.id===id) && !x.recusAcide.includes(id))
        x={...x,demandesAcide:[...x.demandesAcide,{id,des:x.acide+degats}]};
    if(x.etat==='souffle') return {...s,mort:true,xenomorphe:{...x,etat:'mort'}};
    return {...s,xenomorphe:x,...(hp<=0 && !s.critiques.includes(id) && !s.blessureTraitee.includes(id)?{critiques:[...s.critiques,id]}:{})};
}
export function critiqueXenoAlien(s:CombatAlien,id:string,code:number,titre:string,effet:string): {suivi:CombatAlien;sante?:number;retirerCarte:boolean} {
    const x=s.xenomorphe;
    if(!x || s.critiques[0]!==id || !Number.isInteger(code) || code<1 || code>6) return {suivi:s,retirerCarte:false};
    const etat = (['ruse','blesse','reflexe','souffle','mort','mort'] as const)[code-1];
    return {suivi:{...s,mort:code>=5,critiques:s.critiques.slice(1),blessureTraitee:[...s.blessureTraitee,id],
        xenomorphe:{...x,etat,critique:{code,titre,effet},vitesse:code===2?Math.max(1,x.vitesse-1):x.vitesse}},
        sante:code===2?1:undefined,retirerCarte:code===2&&x.vitesse>1};
}
/** Une santé à zéro peut encore agir : aucun Brisé, aucun soin humain. */
export function projeterSanteXeno(r:RegleDeCombatAlien|undefined,f:Record<string,unknown>,s:CombatAlien,h:HealthSystem|undefined):HealthSystem|undefined {
    if(!r || !s.xenomorphe || !h) return h;
    const x=s.xenomorphe;
    return {...h,state:x.etat==='mort'?'dead':Number(f[r.sante])>0?'healthy':'critical',data:{...h.data,alienXenomorphe:{etat:x.etat}}};
}
export function resoudreAcideAlien(des:number,reussites:number,protection:number,sixProtection:number,hp:number,round:number) {
    const degats=Math.max(0,reussites-sixProtection);
    return {degats,protection:Math.max(0,protection-sixProtection),acide:degats>0?{des,round,trepas:hp<=degats} satisfies AcideAlien:undefined};
}
