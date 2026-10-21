import type { CombatAlien, RegleDeCombatAlien, UniteAlien } from './combatAlien';
import { estUnAndroide } from './paniqueAlien';
import type { RessourceDeTable } from '../../table/RessourcesDeTable';

/** Livre français p. 34–35, 106–107 et 110, relu pour A5 le 21/10/2026. */
export interface RegleDeSurvieAlien {
    air: string; eau: string; nourriture: string; energie: string;
    radiations: string; permanents: string;
    affame: string; dehydrate: string; epuise: string; gele: string;
    inventaire: string; armes: string; encombrement: string;
}
export type EtatDeSurvieAlien = 'affame' | 'dehydrate' | 'epuise' | 'gele';
export type ReserveAlien = 'air' | 'eau' | 'nourriture' | 'energie';
export const RESERVES_ALIEN: ReserveAlien[] = ['air','eau','nourriture','energie'];
export const ETATS_ALIEN: EtatDeSurvieAlien[] = ['affame','dehydrate','epuise','gele'];
export const NOMS_SURVIE = { air:'Air', eau:'Eau', nourriture:'Nourriture', energie:'Énergie', affame:'Affamé', dehydrate:'Déshydraté', epuise:'Épuisé', gele:'Gelé' };
export const CLE_SURVIE_ALIEN = '_gmos_survie_alien';
export const idDeReserveCollective = (r: ReserveAlien) => `alien-survie-${r}`;
export const RESERVES_COLLECTIVES_ALIEN: RessourceDeTable[] = RESERVES_ALIEN.map(r=>({id:idDeReserveCollective(r),label:`${NOMS_SURVIE[r]} du groupe`,proprietaire:'meneur',depart:0,min:0,horsDuBandeau:true,visibleAuxJoueurs:true}));
export interface TacheDeSurvieAlien {
    id: string; genre: 'reserve' | 'etat' | 'suffocation' | 'trepas' | 'rad' | 'recuperation-rad';
    cible?: ReserveAlien | EtatDeSurvieAlien; motif: string;
}
export interface SurvieAlien {
    version: 1; actif: boolean; collectif: boolean; taches: TacheDeSurvieAlien[]; traites: string[];
    sorties: Partial<Record<EtatDeSurvieAlien, number>>; joursSansSommeil: number;
    froid: 'jour' | 'quart' | 'tour'; zone: false | 'quart' | 'tour' | 'round';
    manqueAir: number; dangerAir: boolean; dangerRadiations: boolean;
    poids: Record<string, number>; autresPoids?: number;
    dernier?: string;
    radsEnPlus?: number;
}
export function lireLaSurvieAlien(fiche: Record<string, unknown>): SurvieAlien {
    const s = fiche[CLE_SURVIE_ALIEN] as SurvieAlien | undefined;
    return s?.version === 1 && Array.isArray(s.taches) ? s : { version:1,actif:false,collectif:false,taches:[],traites:[],sorties:{},joursSansSommeil:1,froid:'quart',zone:false,manqueAir:0,dangerAir:false,dangerRadiations:false,poids:{} };
}
export const entierSurvie = (v: unknown): number => Math.max(0, Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);
export const cocheSurvie = (v: unknown) => v === true || v === 1 || ['true','1','on','oui'].includes(String(v).toLowerCase());
export function etatDeSurvieActif(r: RegleDeCombatAlien, fiche: Record<string, unknown>, e: EtatDeSurvieAlien): boolean {
    return !!r.survie && !estUnAndroide(r,fiche) && cocheSurvie(fiche[r.survie[e]]);
}
export function refusDeRecuperationAlien(r: RegleDeCombatAlien | undefined, f: Record<string, unknown>, quoi: 'sante' | 'stress'): string | undefined {
    if (!r?.survie) return;
    const etats = ETATS_ALIEN.filter(e => (quoi === 'stress' || e !== 'epuise') && etatDeSurvieActif(r,f,e));
    if (etats.length) return `Récupération de ${quoi === 'sante' ? 'Santé' : 'Stress'} interdite : ${etats.map(e=>NOMS_SURVIE[e]).join(', ')}.`;
    if (quoi === 'sante' && lireLaSurvieAlien(f).zone) return 'Récupération de Santé interdite en zone irradiée.';
}
export function ajouterUneTacheSurvie(s: SurvieAlien, t: TacheDeSurvieAlien): SurvieAlien {
    return s.traites.includes(t.id) || s.taches.some(v=>v.id===t.id) ? s : { ...s,taches:[...s.taches,t] };
}
export function acquitterLaTacheSurvie(s: SurvieAlien, id: string, texte: string): SurvieAlien {
    return !s.taches.some(t=>t.id===id) ? s : { ...s,taches:s.taches.filter(t=>t.id!==id),traites:[...s.traites,id],dernier:texte };
}
export function testDeReserveAlien(reserve: number, de: () => number) {
    const avant = entierSurvie(reserve), des = Array.from({length:Math.min(6,avant)},de), pertes = des.filter(d=>d===1).length;
    return {avant,des,pertes,apres:Math.max(0,avant-pertes)};
}
/** Les états viennent des cases reliées à l'HTML ; leurs échéances restent dans le suivi privé. */
export function apresLeTempsDeSurvie(r: RegleDeCombatAlien, f: Record<string, unknown>, combat: CombatAlien, unite: UniteAlien): Record<string, unknown> {
    if (!r.survie) return {};
    let s = lireLaSurvieAlien(f); const maj: Record<string, unknown> = {};
    const numero = combat.temps[unite], androide = estUnAndroide(r,f);
    for (const e of ETATS_ALIEN) if (!androide && s.sorties[e] !== undefined && unite === 'quart' && numero >= s.sorties[e]!) {
        maj[r.survie[e]] = false;
        s = { ...s, sorties:{...s.sorties,[e]:undefined}, taches:s.taches.filter(t=>t.cible!==e) };
        if (e==='epuise') s = {...s,joursSansSommeil:1};
    }
    const actif = (e: EtatDeSurvieAlien) => etatDeSurvieActif(r,{...f,...maj},e);
    const ajouter = (genre: TacheDeSurvieAlien['genre'], cible: TacheDeSurvieAlien['cible'], motif: string, suffixe = '') => {
        s = ajouterUneTacheSurvie(s,{id:`${genre}:${cible??''}:${unite}:${numero}${suffixe}`,genre,cible,motif});
    };
    if (s.actif) for (const reserve of RESERVES_ALIEN) {
        if (reserve === 'energie' || androide) continue;
        if (unite !== (reserve === 'air' ? 'tour' : 'jour')) continue;
        ajouter('reserve',reserve,`${NOMS_SURVIE[reserve]} : ${unite} ${numero}${s.collectif?' — groupe':''}`);
    }
    if (!androide) {
        if (actif('affame') && unite==='jour') ajouter(entierSurvie(f[r.sante])===0?'trepas':'etat','affame','Faim : échéance quotidienne');
        if (actif('dehydrate') && unite==='quart') ajouter(entierSurvie(f[r.sante])===0?'trepas':'etat','dehydrate','Déshydratation : échéance par Quart');
        if (actif('epuise') && unite==='jour') {
            ajouter('etat','epuise',`Épuisement : Endurance −${s.joursSansSommeil} (jours sans sommeil)`);
            s={...s,joursSansSommeil:s.joursSansSommeil+1};
        }
        if (actif('gele') && unite===s.froid) ajouter(entierSurvie(f[r.sante])===0?'trepas':'etat','gele',`Froid : échéance par ${s.froid}`);
        if (s.dangerAir && unite==='round') ajouter('trepas','air','Suffocation : Trépas à chaque Round');
    }
    if (s.zone && unite===s.zone) ajouter('rad',undefined,'Exposition : un nouveau Rad');
    if (!s.zone && unite==='quart' && totalDesRadsAlien(r.survie,f)>entierSurvie(f[r.survie.permanents])) ajouter('recuperation-rad',undefined,'Hors zone : élimination possible d’un Rad');
    return {...maj,[CLE_SURVIE_ALIEN]:s};
}
export function commencerLaSortieSurvie(r: RegleDeCombatAlien, f: Record<string, unknown>, combat: CombatAlien, etat: EtatDeSurvieAlien): Record<string, unknown> {
    if (!r.survie || !etatDeSurvieActif(r,f,etat)) return {};
    const s=lireLaSurvieAlien(f);
    // Au chaud, la récupération reprend immédiatement ; nourriture/eau/sommeil demandent un Quart.
    return etat==='gele' ? {[r.survie.gele]:false,[CLE_SURVIE_ALIEN]:{...s,taches:s.taches.filter(t=>t.cible!=='gele')}}
        : {[CLE_SURVIE_ALIEN]:{...s,sorties:{...s.sorties,[etat]:combat.temps.quart+1}}};
}
export function bilanRadiationAlien(total: number, de: () => number) {
    const des=Array.from({length:entierSurvie(total)},de);
    return {des,degats:des.filter(d=>d===1).length};
}
/** La fiche imprimée n'a que dix cases. Le surplus reste conservé hors de cette représentation. */
export function totalDesRadsAlien(r: RegleDeSurvieAlien, f: Record<string,unknown>): number {
    const brut=entierSurvie(f[r.radiations]);
    return Math.min(10,brut)+Math.max(entierSurvie(lireLaSurvieAlien(f).radsEnPlus),brut-10);
}
export function recupererUnRadAlien(total: number, permanents: number, de: number) {
    const t=entierSurvie(total),p=entierSurvie(permanents);
    if (p>t) throw new Error('Les Rads permanents ne peuvent pas dépasser le total.');
    return t<=p ? {total:t,permanents:p,change:false} : de===1 ? {total:t,permanents:p+1,change:true} : {total:t-1,permanents:p,change:true};
}
export function objetsDeSurvie(r: RegleDeSurvieAlien,f:Record<string,unknown>) {
    return (['inventaire','armes'] as const).flatMap(source=>String(f[r[source]]??'').split(/\r?\n/).map((nom,i)=>({id:`${source}:${i}:${nom.trim()}`,nom:nom.trim()})).filter(v=>v.nom));
}
export function encombrementAlien(r: RegleDeCombatAlien,f:Record<string,unknown>, eau: number, nourriture: number) {
    const s=lireLaSurvieAlien(f), objets=r.survie?objetsDeSurvie(r.survie,f):[];
    const manquants=objets.filter(o=>s.poids[o.id]===undefined);
    const valide=(v:number|undefined)=>v!==undefined&&Number.isFinite(v)&&v>=0&&Number.isInteger(v*4);
    const complet=s.autresPoids!==undefined&&valide(s.autresPoids)&&objets.every(o=>valide(s.poids[o.id]));
    const total=objets.reduce((n,o)=>n+(s.poids[o.id]??0),0)+(s.autresPoids??0)+Math.ceil(entierSurvie(eau)/4)+Math.ceil(entierSurvie(nourriture)/4);
    const normal=entierSurvie(f[r.force])*2,maximum=normal*2;
    return {total,normal,maximum,complet,manquants,etat:total>maximum?'Au-delà de Force ×4 : charge à réduire.':total>normal?'Encombré : Mobilité pour courir ou ramper ; échec = lâcher la charge ou rester immobile.':'Charge ordinaire.'};
}
