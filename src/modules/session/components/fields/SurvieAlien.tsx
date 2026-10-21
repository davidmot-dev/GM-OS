import { useState } from 'react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import { malusDesBlessures, type CombatAlien, type RegleDeCombatAlien, type UniteAlien } from '../../../dice/systemes/combatAlien';
import { estUnAndroide } from '../../../dice/systemes/paniqueAlien';
import { acquitterLaTacheSurvie, ajouterUneTacheSurvie, bilanRadiationAlien, CLE_SURVIE_ALIEN, commencerLaSortieSurvie, encombrementAlien, entierSurvie, ETATS_ALIEN, etatDeSurvieActif, idDeReserveCollective, lireLaSurvieAlien, NOMS_SURVIE, objetsDeSurvie, recupererUnRadAlien, RESERVES_ALIEN, RESERVES_COLLECTIVES_ALIEN, testDeReserveAlien, totalDesRadsAlien,
    type EtatDeSurvieAlien, type ReserveAlien, type SurvieAlien as Suivi, type TacheDeSurvieAlien } from '../../../dice/systemes/survieAlien';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';

const bouton='rounded border border-app-border px-2 py-1 text-xs disabled:opacity-40';
const champ='block w-full min-w-0 rounded border border-app-border bg-app-bg p-1';
interface Props {
    regle:RegleDeCombatAlien; valeurs:Record<string,unknown>; actuel:()=>Record<string,unknown>; combat:()=>CombatAlien;
    ecrire:(maj:Record<string,unknown>)=>void; noterCombat:(s:CombatAlien)=>void;
    impact:(n:number,soin?:boolean,procedure?:'survie'|'suffocation')=>void; avancer:(u:UniteAlien)=>void;
    joueur:boolean; campaignId?:string; dire:(texte:string,res?:RollResult)=>void;
}
/** Les échéances de jeu et résultats d'Endurance sont confirmés par Maman, comme les soins A3. */
export default function SurvieAlien({regle:r,valeurs:f,actuel,combat,ecrire,noterCombat,impact,avancer,joueur,campaignId,dire}:Props) {
    const [reussites,setReussites]=useState(0),[quantites,setQuantites]=useState<Partial<Record<ReserveAlien,number>>>({});
    const reserves=useRessourcesDeTableStore(s=>s.reserves);
    if (!r.survie) return null;
    const cfg=r.survie,s=lireLaSurvieAlien(f),android=estUnAndroide(r,f),mort=combat().mort&&!android;
    const lire=()=>lireLaSurvieAlien(actuel());
    const noter=(suivi:Suivi,maj:Record<string,unknown>={})=>ecrire({...maj,[CLE_SURVIE_ALIEN]:suivi});
    const groupe=!!campaignId&&s.collectif;
    const valeur=(c:ReserveAlien)=>groupe?entierSurvie(reserves[campaignId!]?.[idDeReserveCollective(c)]):entierSurvie(f[cfg[c]]);
    const valeurActuelle=(c:ReserveAlien)=>groupe?useRessourcesDeTableStore.getState().valeur(campaignId!,RESERVES_COLLECTIVES_ALIEN,idDeReserveCollective(c)):entierSurvie(actuel()[cfg[c]]);
    const fixer=(c:ReserveAlien,n:number)=>groupe?useRessourcesDeTableStore.getState().fixer(campaignId!,RESERVES_COLLECTIVES_ALIEN,idDeReserveCollective(c),n,'Consommables Alien : quantité confirmée par Maman'):ecrire({[cfg[c]]:n});
    const demande=(genre:TacheDeSurvieAlien['genre'],cible?:TacheDeSurvieAlien['cible'],motif='Demande explicite de Maman')=>{
        noter(ajouterUneTacheSurvie(lire(),{id:crypto.randomUUID(),genre,cible,motif}));
    };
    const acquitter=(id:string,texte:string,maj:Record<string,unknown>={})=>{noter(acquitterLaTacheSurvie(lire(),id,texte),maj);dire(texte);};
    const de=()=>DiceEngine.roll(6);
    const trepas=()=>{
        const fiche=actuel(),c=combat(),n=Math.max(0,entierSurvie(fiche[r.force])+entierSurvie(fiche[r.endurance])+malusDesBlessures(c,'endurance'));
        const res=DiceEngine.rollYZE(n,0);noterCombat({...c,mort:(res.successes??0)<1});
        dire(`Trépas de survie : ${n} dés sans Stress ni forçage — ${(res.successes??0)>0?'sursis':'mort'}. Les soins médicaux ne retirent pas la cause.`,res);
    };
    const rad=(t:TacheDeSurvieAlien)=>{
        const fiche=actuel(),suivi=lire();
        if(entierSurvie(fiche[cfg.permanents])>totalDesRadsAlien(cfg,fiche)){dire('Corriger les Rads permanents : ils dépassent le total.');return;}
        if (t.genre==='recuperation-rad') {
            if (suivi.zone) return;
            const n=de(),fin=recupererUnRadAlien(totalDesRadsAlien(cfg,fiche),entierSurvie(fiche[cfg.permanents]),n);
            if (!fin.change) {acquitter(t.id,'Aucun Rad temporaire à éliminer.');return;}
            const texte=`Élimination d’un Rad, D6 ${n} : total ${fin.total}, permanents ${fin.permanents}. Aucun test de Panique.`;
            noter({...acquitterLaTacheSurvie(suivi,t.id,texte),radsEnPlus:Math.max(0,fin.total-10)}, {[cfg.radiations]:Math.min(10,fin.total),[cfg.permanents]:fin.permanents});dire(texte);
        } else {
            const total=totalDesRadsAlien(cfg,fiche)+1,p=entierSurvie(fiche[cfg.permanents]);
            if (p>total) {dire('Corriger les Rads permanents : ils dépassent le total.');return;}
            const res=bilanRadiationAlien(total,de),avant=entierSurvie(fiche[r.sante]);
            noter({...suivi,radsEnPlus:Math.max(0,total-10)},{[cfg.radiations]:Math.min(10,total)});
            if (res.degats) impact(res.degats,false,'survie');
            if (avant===0&&suivi.dangerRadiations&&!android) trepas();
            const texte=`Exposition : total ${total} Rads, [${res.des.join(', ')}], ${res.degats} dégât(s), sans Panique.`;
            noter({...acquitterLaTacheSurvie(lire(),t.id,texte),dangerRadiations:!android&&(suivi.dangerRadiations||res.degats>0&&entierSurvie(actuel()[r.sante])===0)});dire(texte);
        }
    };
    const resoudre=(t:TacheDeSurvieAlien)=>{
        if (joueur||mort||!lire().taches.some(v=>v.id===t.id)) return;
        if (t.genre==='rad'||t.genre==='recuperation-rad') {rad(t);return;}
        const c=t.cible;
        if (t.genre==='reserve'&&c&&RESERVES_ALIEN.includes(c as ReserveAlien)) {
            const reserve=c as ReserveAlien;
            if (android&&reserve!=='energie') {acquitter(t.id,'Synthétique : aucun besoin de cette réserve.');return;}
            const res=testDeReserveAlien(valeurActuelle(reserve),de),texte=`${NOMS_SURVIE[reserve]}${groupe?' du groupe':''} : ${res.avant} → ${res.apres}, [${res.des.join(', ')}] ; aucun test de Panique.`;
            fixer(reserve,res.apres);let fin=acquitterLaTacheSurvie(lire(),t.id,texte);
            if (reserve==='air'&&res.apres===0&&!android) fin=ajouterUneTacheSurvie(fin,{id:`${t.id}:suffocation`,genre:'suffocation',cible:'air',motif:'Air épuisé : Endurance, puis malus cumulatif'});
            noter(fin);dire(texte);return;
        }
        if (android) {acquitter(t.id,'Synthétique : pas de privation biologique ni de Trépas.');return;}
        if (t.genre==='suffocation') {
            if (reussites<1) {impact(entierSurvie(actuel()[r.sante]),false,'suffocation');}
            const fin=lire();noter({...acquitterLaTacheSurvie(fin,t.id,'Suffocation : résultat final d’Endurance confirmé.'),manqueAir:fin.manqueAir+1,dangerAir:fin.dangerAir||reussites<1});return;
        }
        if (t.genre==='trepas') {
            if(c==='air'&&!lire().dangerAir||c&&ETATS_ALIEN.includes(c as EtatDeSurvieAlien)&&!etatDeSurvieActif(r,actuel(),c as EtatDeSurvieAlien)){acquitter(t.id,'Cause terminée : pas de Trépas de survie.');return;}
            if (c==='dehydrate') impact(1,false,'survie');
            trepas();acquitter(t.id,'Trépas de survie résolu ; prochaine échéance conservée.');return;
        }
        const etat=c as EtatDeSurvieAlien;
        if (!etatDeSurvieActif(r,actuel(),etat)) {acquitter(t.id,'État terminé : demande sans effet.');return;}
        if (entierSurvie(actuel()[r.sante])===0&&etat!=='epuise') {if(etat==='dehydrate')impact(1,false,'survie');trepas();}
        else if (etat==='dehydrate'||reussites<1&&etat!=='epuise') impact(1,false,'survie');
        else if (etat==='epuise'&&reussites<1) ecrire(commencerLaSortieSurvie(r,actuel(),combat(),'epuise'));
        acquitter(t.id,`${NOMS_SURVIE[etat]} : échéance traitée${etat==='epuise'&&reussites<1?' ; effondrement, un Quart de sommeil requis':''}.`);
    };
    const charge=encombrementAlien(r,f,entierSurvie(f[cfg.eau]),entierSurvie(f[cfg.nourriture]));
    const nRads=totalDesRadsAlien(cfg,f),permanents=entierSurvie(f[cfg.permanents]);
    return <section data-survie-alien className="space-y-3 rounded-lg border border-app-border p-3 text-xs text-app-text">
        <details><summary className="font-bold">Survie Alien</summary><div className="space-y-3 pt-2">
        <details open data-reserves-alien><summary className="font-bold">Réserves et temps de jeu</summary>
            {!joueur&&<div className="space-y-1"><label className="block"><input type="checkbox" checked={s.actif} onChange={e=>noter({...lire(),actif:e.target.checked})}/> Suivre les consommables en pénurie</label>
                <label className="block"><input type="checkbox" checked={s.collectif} disabled={!campaignId||s.taches.some(t=>t.genre==='reserve')} onChange={e=>noter({...lire(),collectif:e.target.checked})}/> Réserves communes à la campagne</label>
            </div>}
            <p>{s.actif?'Suivi de pénurie actif.':'Consommables sans décompte automatique.'} {groupe?'Réserves du groupe partagées : une seule fiche déclenche leurs échéances, choisie par Maman. Les réserves personnelles restent conservées.':'Réserves individuelles.'}</p>
            {RESERVES_ALIEN.map(c=><div key={c} className="flex flex-wrap items-end gap-2 border-t border-app-border py-1"><span>{NOMS_SURVIE[c]} : {valeur(c)}{android&&c!=='energie'?' — sans besoin biologique':''}</span>
                {!joueur&&<><label>Quantité confirmée — {NOMS_SURVIE[c]}<input type="number" min="0" className={champ} value={quantites[c]??valeur(c)} onChange={e=>setQuantites(v=>({...v,[c]:entierSurvie(e.target.value)}))}/></label>
                    <button type="button" className={bouton} onClick={()=>fixer(c,quantites[c]??valeur(c))}>Renseigner {NOMS_SURVIE[c]}</button>
                    <button type="button" className={bouton} disabled={!s.actif||mort||android&&c!=='energie'} onClick={()=>demande('reserve',c,`${NOMS_SURVIE[c]} : utilisation confirmée par Maman`)}>Demander le test — {NOMS_SURVIE[c]}</button></>}
            </div>)}
            <p>Air : par Tour et après effort. Eau : par jour et après effort. Nourriture : par jour. Énergie : selon l’appareil, sur demande. Maximum six dés par test de Réserve, chaque 1 retire un point ; aucune Panique.</p>
            {!joueur&&<div className="flex flex-wrap gap-2">{(['round','tour','quart','jour'] as const).map(u=><button type="button" className={bouton} key={u} onClick={()=>avancer(u)}>Valider {u} — survie</button>)}
                <button type="button" className={bouton} disabled={!s.actif||android} onClick={()=>{let v=lire();for(const c of ['air','eau'] as const)v=ajouterUneTacheSurvie(v,{id:crypto.randomUUID(),genre:'reserve',cible:c,motif:'Activité éprouvante confirmée par Maman'});noter(v);}}>Effort terminé : Air et Eau</button>
            </div>}
        </details>
        <details open data-etats-survie><summary className="font-bold">Privations et récupération</summary>
            {android?<p>Synthétique : aucun besoin d’Air/Eau/Nourriture/sommeil, immunisé au froid ; anciens états biologiques ignorés.</p>:<>
                {ETATS_ALIEN.map(e=><div key={e} className="space-y-1 py-1"><label className="mr-2"><input type="checkbox" disabled={joueur} checked={etatDeSurvieActif(r,f,e)} onChange={ev=>{
                    const v=lire();let fin={...v,sorties:{...v.sorties,[e]:undefined},joursSansSommeil:e==='epuise'?ev.target.checked?2:1:v.joursSansSommeil,taches:v.taches.filter(t=>t.cible!==e)};
                    if(ev.target.checked&&(e==='affame'||e==='epuise'))fin=ajouterUneTacheSurvie(fin,{id:crypto.randomUUID(),genre:e==='affame'&&entierSurvie(actuel()[r.sante])===0?'trepas':'etat',cible:e,motif:e==='affame'?'Faim : première journée sans alimentation suffisante':'Épuisement : Endurance −1 (première journée sans sommeil)'});
                    noter(fin,{[cfg[e]]:ev.target.checked});
                }}/> {NOMS_SURVIE[e]}</label>
                    {!joueur&&etatDeSurvieActif(r,f,e)&&<button type="button" className={bouton} disabled={s.sorties[e]!==undefined} onClick={()=>ecrire(commencerLaSortieSurvie(r,actuel(),combat(),e))}>{e==='affame'?'Repas pris : commencer le Quart de récupération':e==='dehydrate'?'Boisson prise : commencer le Quart de récupération':e==='epuise'?'Commencer un Quart de sommeil':'À l’abri et au chaud'}</button>}
                    {s.sorties[e]!==undefined&&<p>Fin prévue au Quart {s.sorties[e]} ; les restrictions persistent jusque-là.</p>}
                </div>)}
                <p>Maman confirme Affamé/Déshydraté/Épuisé après une journée sans apport ou sommeil suffisant ; Gelé si la protection est insuffisante. Faim, soif et froid interdisent Santé et soulagement du Stress ; Épuisé interdit seulement le soulagement du Stress.</p>
                {!joueur&&etatDeSurvieActif(r,f,'epuise')&&<label>Jours sans sommeil au prochain test<input type="number" min="1" className={champ} value={s.joursSansSommeil} onChange={e=>noter({...lire(),joursSansSommeil:Math.max(1,entierSurvie(e.target.value))})}/></label>}
                {!joueur&&<label>Fréquence des tests de froid<select className={champ} value={s.froid} onChange={e=>noter({...lire(),froid:e.target.value as Suivi['froid']})}><option value="jour">Au-dessus de 0 °C : par jour</option><option value="quart">Sous 0 °C : par Quart</option><option value="tour">Dans le vide : par Tour</option></select></label>}
                <p>Faim : Endurance quotidienne. Soif : 1 dégât et Stress +1 par Quart. Épuisement : Endurance quotidienne avec malus des jours sans sommeil ; échec = sommeil d’un Quart. Froid : Endurance, échec = 1 dégât et Stress +1. À zéro, Trépas selon la cause ; les soins médicaux n’enlèvent pas faim/soif/froid.</p>
                {s.dangerAir&&<p>Suffocation : Trépas à chaque Round jusqu’au retour dans un environnement respirable.</p>}
                {!joueur&&<button type="button" className={bouton} onClick={()=>noter({...lire(),dangerAir:false,manqueAir:0,taches:lire().taches.filter(t=>t.cible!=='air'||t.genre==='reserve')})}>Environnement respirable retrouvé</button>}
            </>}
        </details>
        <details open data-radiations-alien><summary className="font-bold">Radiations</summary>
            <p>Total : {nRads} Rads, dont {permanents} permanents.{nRads>10?' La fiche HTML montre dix cases ; le surplus reste conservé ici.':''}</p>
            {permanents>nRads&&<p role="alert">Corriger les permanents : ils dépassent le total.</p>}
            {!joueur&&<><label>Zone irradiée<select className={champ} value={s.zone||'non'} onChange={e=>noter({...lire(),zone:e.target.value==='non'?false:e.target.value as Suivi['zone'],dangerRadiations:e.target.value==='non'?false:lire().dangerRadiations})}><option value="non">Hors zone</option><option value="quart">Faible : 1 Rad par Quart</option><option value="tour">Forte : 1 Rad par Tour</option><option value="round">Extrême : 1 Rad par Round</option></select></label>
                <button type="button" className={bouton} disabled={mort} onClick={()=>demande('rad',undefined,'Un Rad reçu, confirmé par Maman')}>Demander un Rad reçu</button>
            </>}
            <p>Chaque nouveau Rad : autant de dés que le total, sans plafond à six ; chaque 1 inflige un dégât. Pas de récupération de Santé en zone. Hors zone : un dé par Quart pour éliminer un Rad ; sur 1, il reste et devient permanent.</p>
        </details>
        <details open data-echeances-survie><summary className="font-bold">Échéances à résoudre — {s.taches.length}</summary>
            {!joueur&&<label>Réussites finales d’Endurance validées<input type="number" min="0" className={champ} value={reussites} onChange={e=>setReussites(entierSurvie(e.target.value))}/></label>}
            <p>Résoudre le test d’Endurance dans le panneau de jet avec le malus indiqué, Panique et forçage éventuels, puis reporter son résultat final. Le Trépas se lance ici sans Stress ni forçage.</p>
            {s.taches.map(t=><article key={t.id} className="space-y-1 border-t border-app-border py-1"><p>{t.motif}{t.genre==='suffocation'?` — Endurance ${s.manqueAir?-s.manqueAir:0}`:''}</p>{!joueur&&<div className="flex flex-wrap gap-2"><button type="button" className={bouton} disabled={mort||t.genre==='recuperation-rad'&&!!s.zone} onClick={()=>resoudre(t)}>Résoudre : {t.motif}</button><button type="button" className={bouton} onClick={()=>acquitter(t.id,`Demande annulée par Maman : ${t.motif}`)}>Annuler : {t.motif}</button></div>}</article>)}
            {s.dernier&&<p role="status">{s.dernier}</p>}
        </details>
        <details data-encombrement-alien><summary className="font-bold">Encombrement</summary>
            <p>{charge.complet?`Charge : ${charge.total}`:'Calcul incomplet : renseigner les masses de tous les objets et les autres charges.'} ; ordinaire {charge.normal}, maximum temporaire {charge.maximum}. {charge.complet?charge.etat:''}</p>
            <p>Masses en objets ordinaires : ¼, ½, 1, 2… Minuscule = 0. Eau et Nourriture : un objet par tranche de quatre points. En collectif, renseigner dans les quantités personnelles la part effectivement portée.</p>
            {groupe&&(['eau','nourriture']as const).map(c=><label key={c}>{NOMS_SURVIE[c]} personnellement portée<input className={champ} type="number" min="0" disabled={joueur} value={entierSurvie(f[cfg[c]])} onChange={e=>ecrire({[cfg[c]]:entierSurvie(e.target.value)})}/></label>)}
            {objetsDeSurvie(cfg,f).map(o=><label className="block" key={o.id}>{o.nom} — masse<input type="number" step="0.25" min="0" disabled={joueur} className={champ} value={s.poids[o.id]??''} onChange={e=>{const v=lire(),poids={...v.poids};if(e.target.value==='')delete poids[o.id];else poids[o.id]=Math.max(0,Number(e.target.value));noter({...v,poids});}}/></label>)}
            <label>Autres charges portées (armure, bouteilles, batteries ; zéro si aucune)<input type="number" min="0" step="0.25" disabled={joueur} className={champ} value={s.autresPoids??''} onChange={e=>noter({...lire(),autresPoids:e.target.value===''?undefined:Math.max(0,Number(e.target.value))})}/></label>
            {!joueur&&<button type="button" className={bouton} disabled={!charge.complet} onClick={()=>ecrire({[cfg.encombrement]:charge.total})}>Reporter la charge sur la fiche</button>}
        </details>
        </div></details>
    </section>;
}
