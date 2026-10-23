import { deCourant } from '../ressourcesDUsure';
import { DiceEngine, type RollResult, type ModificateurDeSauvegarde } from '../DiceEngine';
export const CLE_CTHULHU_HACK = '_gmos_cthulhu_hack';
export interface RegleCthulhuHack {
    pv:string; fortune:string; physique:string[]; personnalite:string[];
    armures:{de:string;nom:string;protection:string}[];
}
export interface EffetCH {
    id:string; nom:string; texte:string; debut:number; secondes?:number; moment?:number; debutMoment?:number; scene?:number; jour?:number; seance?:number;
    plusLong?:boolean; genre?:'os'|'desavantage'|'tremblements'|'confus'|'immobile'|'inconscient'; intensite?:number;
}
export interface ConsequenceCH {
    id:string; cycle:number; pulp:boolean; malus:number; de?:number; resultat?:number; applique?:boolean; pertes?:Record<string,number>; recupere?:boolean;
}
export interface SuiviCH {
    version:1; pulp:boolean; mort:boolean; cycle:number; tombe:boolean;
    secondes:number; moments:number; scenes:number; jours:number; seances:number;
    consequences:ConsequenceCH[]; effets:EffetCH[]; recus:string[];
    armures:{id:string;de:string;avant:number;apres:number|null;pa:string;paAvant:number;paApres:number;annule?:boolean}[];
    dernier?:string;
    test?:{id:string;champ:string;genre:'sauvegarde'|'ressource';seuil:number;modificateur:ModificateurDeSauvegarde;desavantagePresent?:boolean;reussi:boolean;utilise?:boolean};
}
export const lireCH=(f:Record<string,unknown>):SuiviCH=>{
    const s=f[CLE_CTHULHU_HACK] as SuiviCH|undefined;
    return s?.version===1&&Array.isArray(s.consequences)&&Array.isArray(s.effets)?s:{version:1,pulp:false,mort:false,cycle:0,tombe:false,secondes:0,moments:0,scenes:0,jours:0,seances:0,consequences:[],effets:[],recus:[],armures:[]};
};
const copie=(f:Record<string,unknown>)=>structuredClone(lireCH(f));
const exiger=(v:unknown,message:string)=>{if(!v)throw new Error(message);};
export const NOMS_HORS_JEU_CH=['','Mort','Détruit','Ravagé','Estropié','Os brisés','Inconscient','Commotion','Titubant','Essoufflé','Essoufflé'];
export function effetActifCH(s:SuiviCH,e:EffetCH):boolean {
    const fins=[e.moment===undefined?undefined:(s.moments??0)>=e.moment,e.secondes===undefined?undefined:s.secondes>=e.secondes,e.scene===undefined?undefined:s.scenes>=e.scene,e.jour===undefined?undefined:s.jours>=e.jour,e.seance===undefined?undefined:s.seances>=e.seance].filter(v=>v!==undefined);
    return !(e.plusLong?fins.every(Boolean):fins.some(Boolean));
}
export function avancerCH(f:Record<string,unknown>,unite:'moment'|'minute'|'heure'|'scene'|'jour'|'seance',quantite:number,id:string):Record<string,unknown>{
    const s=copie(f);if(s.recus.includes(id))return f;
    exiger(Number.isSafeInteger(quantite)&&quantite>0&&quantite<=10000,'Durée invalide.');
    if(unite==='moment')s.moments=(s.moments??0)+quantite;
    else if(unite==='minute'||unite==='heure')s.secondes+=quantite*({minute:60,heure:3600}[unite]);
    else s[unite==='scene'?'scenes':unite==='jour'?'jours':'seances']+=quantite;
    delete s.test;s.recus.push(id);s.dernier=`Temps confirmé : ${quantite} ${unite}(s).`;
    return {...f,[CLE_CTHULHU_HACK]:s};
}
export function signalerImpactCH(r:RegleCthulhuHack,f:Record<string,unknown>,avant:number,apres:number,degats:number,id:string):Record<string,unknown>{
    const s=copie(f);if(s.recus.includes(id))return f;
    if(apres>0){s.tombe=false;return {...f,[CLE_CTHULHU_HACK]:s};}
    if(s.mort||degats<=0)return f;
    if(!s.tombe||avant>0){s.cycle++;s.tombe=true;}
    const precedents=s.consequences.filter(c=>c.cycle===s.cycle);
    if(!s.pulp&&precedents.length)return f;
    s.consequences.push({id,cycle:s.cycle,pulp:s.pulp,malus:s.pulp?precedents.length:0});s.recus.push(id);
    s.dernier=s.pulp?'Hors Jeu Pulp : tirer maintenant ; aucun PV rendu pendant le combat.':'Hors Jeu : attendre que le danger soit écarté.';
    return {...f,[r.pv]:0,[CLE_CTHULHU_HACK]:s};
}
export function tirerConsequenceCH(f:Record<string,unknown>,id:string,de:number,dangerEcarte=false):Record<string,unknown>{
    const s=copie(f),c=s.consequences.find(c=>c.id===id);exiger(c&&!c.de,'Cette conséquence a déjà été tirée.');
    exiger(!s.mort&&(c!.pulp||dangerEcarte),'Attendre que le danger soit écarté.');
    exiger(Number.isInteger(de)&&de>=1&&de<=10,'Un D10 est requis.');
    c!.de=de;c!.resultat=Math.max(1,de-c!.malus);
    if(c!.resultat===1){s.mort=true;c!.applique=true;}
    if(c!.resultat!>=5){
        c!.applique=true;const n=c!.resultat!,base={id:`hors-jeu-${id}`,nom:NOMS_HORS_JEU_CH[n],texte:'Conséquence du Hors Jeu, livre p. 50.',debut:s.secondes};
        if(n===5)s.effets.push({...base,genre:'os',jour:s.jours+1,seance:s.seances+1});
        else if(n===6)s.effets.push({...base,genre:'inconscient',scene:s.scenes+1});
        else s.effets.push({...base,genre:'desavantage',secondes:s.secondes+(n===7?20:n===8?10:1)*60});
    }
    s.dernier=`${de}${c!.malus?` − ${c!.malus}`:''} → ${c!.resultat} — ${NOMS_HORS_JEU_CH[c!.resultat!]}`;
    return {...f,[CLE_CTHULHU_HACK]:s};
}
export function appliquerPertesCH(r:RegleCthulhuHack,f:Record<string,unknown>,id:string,pertes:Record<string,number>):Record<string,unknown>{
    const s=copie(f),c=s.consequences.find(c=>c.id===id);exiger(c&&c.resultat&&!c.applique,'Pertes déjà appliquées ou conséquence absente.');
    const n=c!.resultat!,champs=n===2?[...r.physique,...r.personnalite]:n===3?r.personnalite:n===4?r.physique:[];
    const allocations=Object.entries(pertes).filter(([,v])=>v>0),total=n===2?6:n===3?4:2;
    exiger(allocations.length>0&&allocations.every(([k,v])=>champs.includes(k)&&Number.isInteger(v)&&v>0&&v<=Number(f[k])),'Répartition invalide ou Sauvegarde insuffisante.');
    exiger(allocations.reduce((n,[,v])=>n+v,0)===total&&(n!==2||allocations.length===2),'Répartir le total exact ; Détruit demande deux Sauvegardes différentes.');
    const maj=Object.fromEntries(allocations.map(([k,v])=>[k,Number(f[k])-v]));c!.pertes=pertes;c!.applique=true;
    s.dernier=`Pertes permanentes appliquées une fois : ${allocations.map(([k,v])=>`${k} −${v}`).join(', ')}.`;
    return {...f,...maj,[CLE_CTHULHU_HACK]:s};
}
export function recupererCH(r:RegleCthulhuHack,f:Record<string,unknown>,id:string,de:number,max:number,dangerEcarte=false):Record<string,unknown>{
    const s=copie(f),c=s.consequences.find(c=>c.id===id);
    exiger(dangerEcarte&&s.tombe&&Number(f[r.pv])===0,'Récupération après le danger, pour la chute actuelle à 0 PV seulement.');
    exiger(c?.applique&&!c.recupere&&!s.mort&&c.resultat!>1,'Conséquence non traitée, mort ou récupération déjà faite.');
    exiger(!s.consequences.some(c=>c.cycle===s.cycle&&!c.applique),'Traiter les conséquences encore en attente.');
    exiger(Number.isInteger(de)&&de>=1&&de<=4&&Number.isFinite(max)&&max>0,'Récupération 1D4 avec un maximum de PV connu.');
    exiger(c!.cycle===s.cycle&&!s.consequences.some(v=>v.cycle===c!.cycle&&v.recupere),'Cette chute a déjà été récupérée.');
    s.consequences.filter(v=>v.cycle===c!.cycle).forEach(v=>{v.recupere=true;});s.tombe=false;s.dernier=`Danger écarté : récupération de ${de} PV.`;
    return {...f,[r.pv]:Math.min(max,Math.max(0,Number(f[r.pv])||0)+de),[CLE_CTHULHU_HACK]:s};
}
/** Appelé à l'écriture de la fiche : seul un dé d'armure déclaré fait perdre un PA. */
export function usureArmureCH(r:RegleCthulhuHack,avant:Record<string,unknown>,apres:Record<string,unknown>,id:()=>string):Record<string,unknown>{
    let f=apres;const s=copie(apres);let modifie=false;
    for(const a of r.armures){const deAvant=deCourant(avant[a.de]),deApres=deCourant(apres[a.de]);
        if(typeof deAvant!=='number'||deApres===undefined||(deApres!==null&&deApres>=deAvant))continue;
        const pa=Math.max(0,Number(avant[a.protection])||0);if(!pa)continue;
        s.armures.push({id:id(),de:a.de,avant:deAvant,apres:deApres,pa:a.protection,paAvant:pa,paApres:pa-1});
        f={...f,[a.protection]:pa-1};modifie=true;s.dernier=`${String(avant[a.nom]||'Armure')} : protection ${pa} → ${pa-1}.`;
    }
    return modifie?{...f,[CLE_CTHULHU_HACK]:s}:f;
}
/** La Fortune annule aussi le PA perdu par ce déclin, sans réparer une autre usure. */
export function annulerUsureCH(f:Record<string,unknown>,champ:string,avant:number,apres:number|null):Record<string,unknown>{
    const s=copie(f),recu=[...s.armures].reverse().find(a=>a.de===champ&&a.avant===avant&&a.apres===apres&&!a.annule);
    if(!recu)return f;
    exiger(Number(f[recu.pa])===recu.paApres,'La protection a changé depuis le jet ; le MJ doit la corriger avant de sauver cette usure.');
    recu.annule=true;return {...f,[recu.pa]:recu.paAvant,[CLE_CTHULHU_HACK]:s};
}
export function ajouterEffetMentalCH(f:Record<string,unknown>,genre:'choc'|'folie',de:number,lancer:(faces:number)=>number,id:string):Record<string,unknown>{
    const s=copie(f);if(s.recus.includes(id))return f;exiger(de>=1&&de<=6&&Number.isInteger(de),'Un D6 est requis.');
    const e:EffetCH={id,nom:'',texte:'',debut:s.secondes,debutMoment:s.moments??0};
    const temps=(n:number,unite:string)=>{if(unite==='Moment')e.moment=(s.moments??0)+n;else e.secondes=s.secondes+n*(unite==='heure'?3600:60);e.texte+=` Durée : ${n} ${unite}(s).`;};
    if(genre==='choc'){
        e.nom=['','Tremblements','Confus','Immobile','Inconscience','Frayeur','Hurlement'][de];
        if(de===1){const n=lancer(6);e.genre='tremblements';e.intensite=n;temps(n,'Moment');e.texte='Force/Dextérité : malus décroissant de 1 chaque Moment.'+e.texte;}
        if(de===2){e.genre='confus';temps(lancer(6),'Moment');e.texte='Désavantage Intelligence/Sagesse/Charisme.'+e.texte;}
        if(de===3){e.genre='immobile';temps(lancer(3),'Moment');e.texte='Aucune action ou Sauvegarde physique.'+e.texte;}
        if(de===4){e.genre='inconscient';temps(lancer(2),'Moment');e.texte='Un autre personnage peut consacrer un Moment pour le réveiller.'+e.texte;}
        if(de===5){temps(lancer(3),'Moment');e.texte='Se dissimuler est la seule action possible.'+e.texte;}
        if(de===6){e.texte='Le cri attire immédiatement l’attention.';e.secondes=s.secondes;}
    }else{
        e.nom=['','Amnésie','Évanouissement','Paranoïa','Hystérie','Paralysie','Délire'][de];
        if(de===1){const n=lancer(6);e.texte=`Amnésie ${n<=2?'rétrograde':n<=5?'antérograde':'dissociative'}. Événement déclencheur perdu.`;temps(lancer(10),'heure');}
        if(de===3){e.texte='Méfiance ; Avantage aux Sauvegardes de perception, interprétation par le joueur.';temps(lancer(10),'heure');}
        if(de===4){const n=lancer(8),sens=['','','','Vue','Équilibre','Ouïe','Voix','Toucher','Goût et odorat'];e.texte=`Désavantage en rapport avec : ${n<=2?[sens[lancer(6)+2],sens[lancer(6)+2]].join(', '):sens[n]}.`;temps(lancer(6),'heure');}
        if(de===5){e.genre='inconscient';e.texte='Sans réaction aux stimulus ; se faire porter reste possible.';temps(lancer(6),'minute');}
        if(de===2||de===6){
            if(de===6)e.texte=`Réalité alternative : D6 ${lancer(6)} ; interpréter la table du livre p. 31.`;
            else {e.genre='inconscient';e.texte='Sauvegarde de Constitution pour éviter de s’étouffer ; échec : perte de 1 PV, à confirmer.';}
            let n=0,d=20;while(d===20){d=lancer(20);n+=d;}temps(n,'minute');e.scene=s.scenes+1;e.plusLong=true;
        }
    }
    s.effets.push(e);s.recus.push(id);s.dernier=`${genre==='choc'?'Choc':'Folie passagère'} : ${de} — ${e.nom}.`;
    return {...f,[CLE_CTHULHU_HACK]:s};
}
export function modificateursCH(r:RegleCthulhuHack,f:Record<string,unknown>,champ?:string){
    const s=lireCH(f),effets=s.effets.filter(e=>effetActifCH(s,e));let malus=0,desavantage=false;
    for(const e of effets){if(e.genre==='os'&&champ&&r.physique.includes(champ))malus+=4;
        if(e.genre==='tremblements'&&champ&&r.physique.slice(0,2).includes(champ))malus+=Math.max(0,(e.intensite||0)-((s.moments??0)-(e.debutMoment??0)));
        if(e.genre==='desavantage'||e.genre==='confus'&&champ&&r.personnalite.includes(champ))desavantage=true;}
    return {malus,desavantage,indisponible:s.mort||effets.some(e=>e.genre==='inconscient'||e.genre==='immobile'&&champ&&r.physique.includes(champ))};
}

export function memoriserTestCH(f:Record<string,unknown>,test:NonNullable<SuiviCH['test']>):Record<string,unknown>{
    const s=copie(f);s.test=test;return {...f,[CLE_CTHULHU_HACK]:s};
}
export const DEPENSES_FORTUNE_CH={
    relance:'Relancer le dernier test réussi', innocent:'Mettre un innocent en danger', secret:'Demander un sombre secret',
    choc:'Infliger un Choc sans perte mentale', menace:'Introduire une nouvelle Menace',
} as const;
export function defausserFortuneCH(r:RegleCthulhuHack,f:Record<string,unknown>,raison:keyof typeof DEPENSES_FORTUNE_CH,id:string):{fiche:Record<string,unknown>;resultat?:RollResult}{
    const s=copie(f);exiger(!s.recus.includes(id),'Dépense déjà faite.');
    const t=s.test,cout=raison==='choc'||raison==='menace'||raison==='relance'&&(t?.desavantagePresent||t?.modificateur==='desavantage')?2:1;
    exiger(Number(f[r.fortune])>=cout,'Pas assez de jetons sur cette fiche.');
    let resultat:RollResult|undefined;
    if(raison==='relance'){
        exiger(t?.reussi&&!t.utilise,'Aucun test réussi encore disponible.');
        exiger(t!.genre==='sauvegarde'||deCourant(f[t!.champ])===t!.seuil,'La ressource a changé depuis ce test.');
        resultat=t!.genre==='sauvegarde'?DiceEngine.rollSauvegarde(t!.seuil,t!.modificateur):DiceEngine.rollUsure(t!.seuil,t!.modificateur);
        t!.utilise=true;
    }
    s.recus.push(id);s.dernier=`Fortune MJ −${cout} : ${DEPENSES_FORTUNE_CH[raison]}.`;
    let fiche:Record<string,unknown>={...f,[r.fortune]:Number(f[r.fortune])-cout,[CLE_CTHULHU_HACK]:s};
    if(resultat?.usure)fiche={...fiche,[t!.champ]:resultat.usure.apres===null?'épuisé':`d${resultat.usure.apres}`};
    if(raison==='choc')fiche=ajouterEffetMentalCH(fiche,'choc',DiceEngine.roll(6),n=>DiceEngine.roll(n),id+'-choc');
    return {fiche,resultat};
}
