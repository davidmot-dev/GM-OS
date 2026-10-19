import { DEGRES_DE_REUSSITE, degreDuDe, estUneReussite, type DegreDeReussite } from '../../dice/degresDeReussite';
import { bandesDuJet } from '../../dice/systemes/revesDeDragons';
import { effetDuSonne } from './santeDuVoyageur';
import { entierVoyageur as entier, lireMoral, majMoral, varierMoral, type MoralVoyageur } from './moralDuVoyageur';
import { operationDeVoyageur, type DonneesDeVoyage } from './operationsDeVoyageur';
import type { NatureDeJetVoyageur } from './fatigueDuVoyageur';

/** Livre 2.3.1 p. 150–154, 161. Le résultat et le choix survivent à la fermeture. */
export interface ActionVoyageur {
    id:string; titre:string; caracteristique:string; competence:string; nature:NatureDeJetVoyageur;
    valeur:number; ajustement:number; de:number; degre:DegreDeReussite; perceptionActive:boolean;
    sonne:boolean; offensif:boolean; moralEngage:boolean; moralAvant:MoralVoyageur; moralApres:MoralVoyageur;
    recours:'aucun'|'chance-reussie'|'chance-echouee'|'relancee'|'destinee'|'clos';
}
export function lireAction(d:DonneesDeVoyage): ActionVoyageur|null {
    const a = d.__rddAction231 as ActionVoyageur|undefined;
    if (a === undefined) return null;
    if (!a || typeof a.id !== 'string' || !a.id || typeof a.titre !== 'string' || typeof a.caracteristique !== 'string'
        || typeof a.competence !== 'string' || !DEGRES_DE_REUSSITE.includes(a.degre)
        || !['action','rituel','chance','guerison','stress','resistance','ethylisme'].includes(a.nature)
        || !['aucun','chance-reussie','chance-echouee','relancee','destinee','clos'].includes(a.recours)
        || [a.perceptionActive,a.sonne,a.offensif,a.moralEngage].some(x=>typeof x !== 'boolean')) throw new Error('Résultat de jet conservé invalide.');
    entier(a.valeur,0);entier(a.ajustement,-1000,1000);entier(a.de,1,100);
    for (const m of [a.moralAvant,a.moralApres]) {
        if (!m) throw new Error('Contexte du moral manquant.');
        lireMoral(majMoral(m));
    }
    return structuredClone(a);
}
export function actionAdmetRecours(a:Pick<ActionVoyageur,'caracteristique'|'nature'|'perceptionActive'>): boolean {
    if (a.nature !== 'action') return false;
    if (['force','agilite','dexterite','derobee','apparence','melee','tir','lancer'].includes(a.caracteristique)) return true;
    return a.perceptionActive && ['vue','ouie','odorat_gout','empathie'].includes(a.caracteristique);
}
export function preparerAppelMoral(d:DonneesDeVoyage, appel:boolean, deDesespoir?:number) {
    const avant = lireMoral(d);
    if (!appel) return {avant,base:avant,bonus:0};
    if (avant.moral > 0) return {avant,base:avant,bonus:1};
    entier(deDesespoir,1,20);
    return deDesespoir! <= 10+avant.moral ? {avant,base:avant,bonus:1} : {avant,base:varierMoral(avant,-1),bonus:0};
}
export function enregistrerAction(d:DonneesDeVoyage, a:Omit<ActionVoyageur,'moralAvant'|'moralApres'|'recours'>,
    appel:boolean, deDesespoir:number|undefined, id:string) {
    if (appel && !actionAdmetRecours(a)) throw new Error('Cette action n’admet pas l’appel au moral.');
    const m = preparerAppelMoral(d,appel,deDesespoir);
    if (a.moralEngage !== (m.bonus === 1)) throw new Error('Repréparer le bonus de moral avant le jet.');
    const apres = m.bonus && !estUneReussite(a.degre) ? varierMoral(m.base,-1) : m.base;
    const action:ActionVoyageur = {...a,moralAvant:m.base,moralApres:apres,recours:'aucun'};
    lireAction({__rddAction231:action});
    const precedent = lireAction(d);
    if (precedent?.recours === 'chance-reussie') throw new Error('Terminer la relance de chance en attente avant un nouveau jet.');
    return operationDeVoyageur(d,id,{__rddAction231:action,...majMoral(apres)},'Conserver un jet',
        [`${a.titre} : d100 ${a.de}, ${a.degre}, ajustement final ${a.ajustement}.`,
            appel ? `Appel au moral : bonus ${m.bonus}, moral ${m.avant.moral} → ${apres.moral}.` : 'Aucun appel au moral.']);
}
function exigerRecours(d:DonneesDeVoyage) {
    const a = lireAction(d);if (!a || a.recours !== 'aucun') throw new Error('Ce résultat a déjà reçu un recours ou a été clôturé.');
    if (JSON.stringify(lireMoral(d)) !== JSON.stringify(a.moralApres)) throw new Error('Le moral a changé depuis ce jet : arbitrer le recours avant de poursuivre.');
    return a;
}
export function appelChance(d:DonneesDeVoyage,de:number,astrologie:number,id:string) {
    const a = exigerRecours(d);entier(de,1,100);entier(astrologie,-4,4);
    if (!actionAdmetRecours(a) || estUneReussite(a.degre)) throw new Error('L’appel à la chance exige une action admissible échouée.');
    const points = entier(d.points_de_chance), e = bandesDuJet(points,astrologie);
    if (!points) throw new Error('Aucun point de chance disponible.');
    const degre = degreDuDe(de,e), reussi = estUneReussite(degre);
    a.recours = reussi ? 'chance-reussie' : 'chance-echouee';
    return operationDeVoyageur(d,id,{__rddAction231:a,...(reussi ? {points_de_chance:points-1,__rddChanceDepensee231:true} : {})},'Appel à la chance',
        [`Points de chance ${points}, astrologie ${astrologie}, ${e.chances} %, d100 ${de} : ${degre}. ${reussi ? 'Un point payé ; une seule relance de cette action est ouverte.' : 'Aucune dépense ; chance et destinée ne peuvent plus sauver cette action.'}`]);
}
function apresNouvelleIssue(a:ActionVoyageur,degre:DegreDeReussite) {
    const m = a.moralEngage && !estUneReussite(degre) ? varierMoral(a.moralAvant,-1) : a.moralAvant;
    a.moralApres = m;a.degre = degre;
    return majMoral(m);
}
export function relancerAction(d:DonneesDeVoyage,de:number,id:string) {
    const a = lireAction(d);entier(de,1,100);
    if (!a || a.recours !== 'chance-reussie') throw new Error('Aucune relance de chance autorisée.');
    if (JSON.stringify(lireMoral(d)) !== JSON.stringify(a.moralApres)) throw new Error('Le moral a changé depuis cette action.');
    const brut = degreDuDe(de,bandesDuJet(a.valeur,a.ajustement)), degre = a.sonne ? effetDuSonne(brut,a.offensif) : brut;
    const m = apresNouvelleIssue(a,degre);a.de = de;a.recours = 'relancee';
    return operationDeVoyageur(d,id,{__rddAction231:a,...m},'Relancer l’action',
        [`Même caractéristique, ajustement et bonus de moral : d100 ${de}, ${degre}. Le premier résultat est annulé ; aucune seconde dépense de moral.`]);
}
export function destineeAction(d:DonneesDeVoyage,id:string) {
    const a = exigerRecours(d), destinee = Number(d.points_de_destinee ?? 0);entier(Math.round(destinee*10),0,70);
    if (destinee < 1) throw new Error('Un point entier de destinée est requis.');
    let degre:DegreDeReussite;
    if (a.caracteristique === 'constitution') degre = a.degre === 'echec-total' ? 'echec-normal' : 'reussite-particuliere';
    else {
        if (!actionAdmetRecours(a) || estUneReussite(a.degre) || a.ajustement <= -11) throw new Error('Destinée indisponible : action inadmissible, réussie, ou ajustement ≤ −11.');
        degre = 'reussite-significative';
    }
    const m = apresNouvelleIssue(a,degre);a.recours = 'destinee';
    return operationDeVoyageur(d,id,{__rddAction231:a,points_de_destinee:Math.round((destinee-1)*10)/10,...m},'Destinée sur le jet',
        [`Un point de destinée, aucune chance dépensée, résultat ${degre}. ${a.caracteristique === 'constitution' ? 'Exception CONSTITUTION.' : 'Aucun nouveau lancer.'}`]);
}
export function recupererChanceParDestinee(d:DonneesDeVoyage,id:string) {
    const points = Number(d.points_de_destinee ?? 0);entier(Math.round(points*10),0,70);
    if (points < 1) throw new Error('Un point entier de destinée est requis.');
    return operationDeVoyageur(d,id,{points_de_destinee:Math.round((points-1)*10)/10,points_de_chance:entier(d.chance)},'Destinée pour la chance',['Un point de destinée rend tous les points de chance.']);
}
export function attribuerVoyage(d:DonneesDeVoyage,points:number,motif:string,id:string) {
    entier(points,1,70);const avant = Number(d.points_de_destinee ?? 0);entier(Math.round(avant*10),0,70);
    if (!motif.trim()) throw new Error('Indiquer l’étape de voyage récompensée.');
    return operationDeVoyageur(d,id,{points_de_destinee:Math.min(70,Math.round(avant*10)+points)/10},'Attribuer des points de voyage',
        [`${motif.slice(0,160)} : ${points} dixième(s) de destinée, sept destinées maximum.`]);
}
export function cloreAction(d:DonneesDeVoyage,id:string) {
    const a = lireAction(d);if (!a || a.recours === 'chance-reussie') throw new Error('Terminer la relance en attente.');
    a.recours = 'clos';
    return operationDeVoyageur(d,id,{__rddAction231:a,__rddJetPourTache231:{id:a.id,degre:a.degre,titre:a.titre}},'Accepter le résultat définitif',
        [`${a.degre} : recours terminés. Ce résultat peut servir à une tâche et à l’expérience admissible.`]);
}
