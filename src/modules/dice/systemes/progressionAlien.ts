/** Livre français p. 31, 35–36, 61, 104, 216. Les décisions narratives restent à Maman. */
export interface RegleDeProgressionAlien { experience:string; recit:string; fetiche:string; camarade:string; rival:string; esprit:string; competences:string[] }
export const CLE_PROGRESSION_ALIEN = '_gmos_progression_alien';
export interface ProgressionAlien {
    version:1; mode:'cinema'|'campagne'; scenario:string; acte:number; seance:string;
    objectifs:Record<string,string>; remis:Record<string,string>; finsActe:string[]; bilans:string[];
    fetiches:string[]; achats:string[]; essaisTalents:string[];
    achatId?: string;
    pxEnPlus?: number;
    detailsBilans?: Record<string,boolean[]>;
    meritesActes?: Record<string,boolean>;
}
export function lireProgressionAlien(f:Record<string,unknown>):ProgressionAlien {
    const s=f[CLE_PROGRESSION_ALIEN] as ProgressionAlien|undefined;
    return s?.version===1?s:{version:1,mode:'campagne',scenario:'',acte:1,seance:'',objectifs:{},remis:{},finsActe:[],bilans:[],fetiches:[],achats:[],essaisTalents:[]};
}
export const cleActeAlien=(s:ProgressionAlien)=>s.scenario.trim()?`${s.scenario.trim()}:${s.acte}`:'';
export const cleFeticheAlien=(s:ProgressionAlien)=>s.mode==='cinema'?`acte:${cleActeAlien(s)}`:`seance:${s.seance.trim()}`;
export const QUESTIONS_PX_ALIEN = ['Présence à la séance','Risques ou sacrifices pour son Objectif','Vie risquée pour son Camarade','Rival défié ou affronté','Test de Panique effectué','Événement dangereux surmonté','Découverte ou révélation importante','Action extraordinaire','Argent gagné'];
/** L'HTML imprime dix cases ; les PX supplémentaires restent dans la progression. */
export function totalExperienceAlien(r:RegleDeProgressionAlien,f:Record<string,unknown>):number {
    const brut=Math.max(0,Math.trunc(Number(f[r.experience])||0));
    return Math.min(10,brut)+Math.max(lireProgressionAlien(f).pxEnPlus??0,brut-10);
}
export function finirActeAlien(r:RegleDeProgressionAlien,f:Record<string,unknown>,merite:boolean):Record<string,unknown> {
    const s=lireProgressionAlien(f),cle=cleActeAlien(s);
    if(s.mode!=='cinema'||!cle||s.finsActe.includes(cle))return {};
    return {[CLE_PROGRESSION_ALIEN]:{...s,finsActe:[...s.finsActe,cle],meritesActes:{...s.meritesActes,[cle]:merite}},[r.recit]:Math.min(3,Math.max(0,Number(f[r.recit])||0)+(merite?1:0))};
}
export function bilanPxAlien(r:RegleDeProgressionAlien,f:Record<string,unknown>,reponses:boolean[]):Record<string,unknown> {
    const s=lireProgressionAlien(f),cle=s.seance.trim();
    if(s.mode!=='campagne'||!cle||s.bilans.includes(cle)||reponses.length!==9)return {};
    const px=totalExperienceAlien(r,f)+reponses.filter(Boolean).length;
    return {[CLE_PROGRESSION_ALIEN]:{...s,bilans:[...s.bilans,cle],detailsBilans:{...s.detailsBilans,[cle]:[...reponses]},pxEnPlus:Math.max(0,px-10)},[r.experience]:px};
}
export function utiliserFeticheAlien(r:RegleDeProgressionAlien,f:Record<string,unknown>,stress:string):Record<string,unknown> {
    const s=lireProgressionAlien(f),cle=cleFeticheAlien(s);
    if(!(s.mode==='cinema'?cleActeAlien(s):s.seance.trim())||!String(f[r.fetiche]??'').trim()||s.fetiches.includes(cle)||(Number(f[stress])||0)<=0)return {};
    return {[CLE_PROGRESSION_ALIEN]:{...s,fetiches:[...s.fetiches,cle]},[stress]:Math.max(0,Number(f[stress])-1)};
}
const normaliser=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function acheterAlien(r:RegleDeProgressionAlien,f:Record<string,unknown>,a:{id:string;entreSeances:boolean;type:'competence'|'talent';champ:string;nom?:string;prerequis:boolean;jour:number;reussites:number;talents:string}):Record<string,unknown> {
    const s=lireProgressionAlien(f),px=totalExperienceAlien(r,f);
    if(s.mode!=='campagne'||!a.entreSeances||!a.id||s.achats.includes(a.id)||px<5)return {};
    let maj:Record<string,unknown>={},nouveau=s;
    if(a.type==='competence'){
        const niveau=Number(f[a.champ]??0);
        if(!r.competences.includes(a.champ)||!Number.isInteger(niveau)||niveau<0||niveau>=5||niveau===0&&!a.prerequis)return {};
        maj={[a.champ]:niveau+1};
    }else{
        const nom=a.nom?.trim(),jour=`${s.scenario}:${a.jour}`;
        if(!nom||!a.prerequis||s.essaisTalents.includes(jour)||String(f[a.talents]??'').split(/\n|,|;/).some(t=>normaliser(t)===normaliser(nom)))return {};
        nouveau={...s,essaisTalents:[...s.essaisTalents,jour]};
        if(a.reussites<=0)return {[CLE_PROGRESSION_ALIEN]:{...nouveau,achats:[...s.achats,a.id]}};
        maj={[a.talents]:[String(f[a.talents]??'').trim(),nom].filter(Boolean).join('\n')};
    }
    return {...maj,[r.experience]:px-5,[CLE_PROGRESSION_ALIEN]:{...nouveau,pxEnPlus:Math.max(0,px-15),achats:[...s.achats,a.id]}};
}

/** Les brouillons et reçus narratifs ne quittent jamais le poste MJ. La remise utilise la messagerie privée. */
export function caviarderObjectifsAlien<T>(charge:T):T {
    if(Array.isArray(charge))return charge.map(caviarderObjectifsAlien) as T;
    if(!charge||typeof charge!=='object')return charge;
    if(Object.getPrototypeOf(charge)!==Object.prototype&&Object.getPrototypeOf(charge)!==null)return charge;
    return Object.fromEntries(Object.entries(charge).map(([k,v])=>[k,k===CLE_PROGRESSION_ALIEN&&v&&typeof v==='object'
        ? {...v,objectifs:{},remis:{},meritesActes:{}} : caviarderObjectifsAlien(v)])) as T;
}
