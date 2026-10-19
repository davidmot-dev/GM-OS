import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { degreDuDe, type DegreDeReussite } from '../../dice/degresDeReussite';
import { bandesDuJet } from '../../dice/systemes/revesDeDragons';
import { operationDeVoyageur, type DonneesDeVoyage } from './operationsDeVoyageur';
import { entierVoyageur as entier, lireMoral, majMoral } from './moralDuVoyageur';
import { lireAction } from './recoursDuVoyageur';
import type { AstrologieVoyageur } from './astrologieDuVoyageur';

/** Livre 2.3.1, p. 143–148. XP de stress et d'exercice restent identifiables. */
export interface ProgressionVoyageur {
    version:1; reserveStress:number; archetype:Record<string,number>;
    stress:Record<string,number>; exercice:Record<string,number>; jetsUtilises:string[]; nuits:string[];
}
export const CARACTERISTIQUES_PROGRESSIVES = ['apparence','constitution','force','agilite','dexterite','vue','ouie','odorat_gout','volonte','intellect','empathie','reve','chance'];
const MENTALES = ['volonte','intellect','empathie','reve','chance'];
export function competencesProgressives(f: SheetTemplate) {
    return f.sections.filter(s=>['competences_generales','competences_particulieres','competences_specialisees','connaissances','combat','draconic'].includes(s.id))
        .flatMap(s=>s.fields).filter(f=>f.type === 'number');
}
export function lireProgression(d: DonneesDeVoyage): ProgressionVoyageur {
    const p = d.__rddProgression231 as ProgressionVoyageur|undefined;
    if (p === undefined) return {version:1,reserveStress:0,archetype:{},stress:{},exercice:{},jetsUtilises:[],nuits:[]};
    if (!p || p.version !== 1) throw new Error('Carnet d’expérience invalide.');
    entier(p.reserveStress);
    for (const [nom,min,max] of [['archetype',0,1000],['stress',0,1000000],['exercice',0,1000000]] as const) {
        const valeurs = p[nom];
        if (!valeurs || Array.isArray(valeurs) || typeof valeurs !== 'object' || Object.keys(valeurs).length > 500) throw new Error('Comptes d’expérience invalides.');
        Object.values(valeurs).forEach(v=>entier(v,min,max));
    }
    for (const liste of [p.jetsUtilises,p.nuits]) if (!Array.isArray(liste) || liste.length > 10000 || liste.some(x=>typeof x !== 'string') || new Set(liste).size !== liste.length) throw new Error('Preuves d’expérience invalides.');
    return structuredClone(p);
}
export function coutCompetence(niveauVise: number): number {
    entier(niveauVise,-10,1000);
    return niveauVise <= -8 ? 5 : niveauVise <= -4 ? 10 : niveauVise <= 0 ? 15 : niveauVise <= 4 ? 20
        : niveauVise <= 6 ? 30 : niveauVise <= 8 ? 40 : niveauVise <= 10 ? 60 : 100;
}
export function coutCaracteristique(valeurVisee: number): number {
    entier(valeurVisee,7,100000);
    return valeurVisee <= 8 ? 6 : valeurVisee <= 10 ? 7 : valeurVisee <= 12 ? 8 : valeurVisee <= 14 ? 9 : (valeurVisee-14)*10;
}
export function attribuerStress(d: DonneesDeVoyage, points:number, motif:string, id:string) {
    entier(points,1,20);if (!motif.trim()) throw new Error('Décrire la situation stressante.');
    const stress = entier(d.stress ?? 0)+points;entier(stress);
    return operationDeVoyageur(d,id,{stress},'Attribuer du stress',[`${motif.slice(0,160)} : +${points} stress. Le maximum de 20 concerne chaque situation, pas le cumul.`]);
}
export function convertirStress(d: DonneesDeVoyage, nuit:string, de:number, second?:number) {
    const p = lireProgression(d), m = lireMoral(d), stress = entier(d.stress ?? 0), reve = entier(d.reve_pts);
    if (!nuit || p.nuits.includes(nuit)) throw new Error('Stress déjà traité pour cette nuit.');
    const repos = d.__rddRepos231 as {jour?:number;heuresDormies?:number}|undefined;
    if (!repos || !Number.isInteger(repos.jour) || !repos.heuresDormies) throw new Error('Une heure de sommeil déclarée est requise avant la conversion.');
    if (!stress) throw new Error('Aucun stress à convertir.');
    entier(de,1,100);const e = bandesDuJet(reve,0), degre = degreDuDe(de,e);
    let double = false;
    if (degre === 'reussite-particuliere') {entier(second,1,100);double = ['reussite-particuliere','reussite-significative'].includes(degreDuDe(second!,e));}
    const taux:Record<DegreDeReussite,number> = {'echec-total':0,'echec-particulier':10,'echec-normal':20,'reussite-normale':50,'reussite-significative':75,'reussite-particuliere':double ? 150 : 100};
    const brut = Math.floor(stress*taux[degre]/100), annules = Math.min(m.dissolution,brut);
    const xp = brut+m.exaltation-annules;
    const restant = Math.max(0,stress-Math.min(stress,brut));
    m.exaltation = 0;m.dissolution -= annules;p.reserveStress += xp;p.nuits.push(nuit);
    lireProgression({__rddProgression231:p});
    return {maj:{stress:Math.max(0,restant-(restant ? 1 : 0)),__rddProgression231:p,...majMoral(m)},
        details:[`Stress : rêve actuel ${reve} à zéro (${e.chances} %), d100 ${de}${second === undefined ? '' : ` puis ${second}`}, ${double ? 'double particulière' : degre}. ${taux[degre]} % : ${brut} XP, ${xp} après exaltation/dissolution ; ${Math.max(0,restant-(restant ? 1 : 0))} stress conservés.`]};
}
export function declarerArchetype(d: DonneesDeVoyage, f:SheetTemplate, cle:string, niveau:number, id:string) {
    if (!competencesProgressives(f).some(c=>c.id === cle)) throw new Error('Choisir une compétence du pilote.');
    entier(niveau,0,1000);const p = lireProgression(d);p.archetype[cle] = niveau;
    // Les niveaux supérieurs à onze peuvent venir d'une vie antérieure : pas de plafond inventé.
    return operationDeVoyageur(d,id,{__rddProgression231:p},'Déclarer l’Archétype',[`${cle} : potentiel ${niveau}. Valeur reportée du carnet existant ; aucune compétence actuelle changée.`]);
}
export function allouerStress(d: DonneesDeVoyage, f:SheetTemplate, cle:string, points:number, id:string) {
    const p = lireProgression(d);entier(points,1);const niveau = entier(d[cle],-11,999);
    const archetype = p.archetype[cle];
    if (!competencesProgressives(f).some(c=>c.id === cle) || archetype === undefined || niveau >= archetype) throw new Error('Le niveau actuel doit être inférieur à l’Archétype déclaré.');
    let possible = 0;for (let n = niveau+1;n <= archetype;n++) possible += coutCompetence(n);
    possible -= (p.stress[cle] ?? 0)+(p.exercice[cle] ?? 0);
    if (points > p.reserveStress || points > possible) throw new Error('Réserve insuffisante ou allocation dépassant le potentiel de l’Archétype.');
    p.reserveStress -= points;p.stress[cle] = (p.stress[cle] ?? 0)+points;
    return operationDeVoyageur(d,id,{__rddProgression231:p},'Allouer l’expérience du stress',[`${cle} : +${points} XP de voie/compétence, réserve ${p.reserveStress}. Niveau inchangé jusqu’à validation de l’augmentation.`]);
}
export function augmenterVoyageur(d: DonneesDeVoyage, f:SheetTemplate, cle:string, id:string) {
    const p = lireProgression(d), competence = competencesProgressives(f).some(c=>c.id === cle);
    if (!competence && !CARACTERISTIQUES_PROGRESSIVES.includes(cle)) throw new Error('Pas de progression directe de TAILLE ni des dérivées.');
    const avant = entier(d[cle],competence ? -11 : 6,999), vise = avant+1;
    if (!competence && !MENTALES.includes(cle) && vise > 20) throw new Error('Caractéristique physique humaine limitée à 20.');
    const cout = competence ? coutCompetence(vise) : coutCaracteristique(vise);
    const stressDisponible = competence && vise <= (p.archetype[cle] ?? -1) ? p.stress[cle] ?? 0 : 0;
    const utiliseStress = Math.min(stressDisponible,cout), utiliseExercice = cout-utiliseStress;
    if ((p.exercice[cle] ?? 0) < utiliseExercice) throw new Error('Expérience insuffisante pour ce niveau.');
    p.stress[cle] = (p.stress[cle] ?? 0)-utiliseStress;p.exercice[cle] = (p.exercice[cle] ?? 0)-utiliseExercice;
    return operationDeVoyageur(d,id,{[cle]:vise,__rddProgression231:p},'Augmenter une valeur',
        [`${cle} : ${avant} → ${vise}, coût ${cout} XP (${utiliseStress} stress, ${utiliseExercice} exercice). Les réserves actuelles ne sont pas remplies.`]);
}
export function reporterExperience(d:DonneesDeVoyage,f:SheetTemplate,cle:string,points:number,motif:string,id:string) {
    if (!competencesProgressives(f).some(c=>c.id === cle) && !CARACTERISTIQUES_PROGRESSIVES.includes(cle)) throw new Error('Champ non progressif.');
    entier(points,1);if (!motif.trim()) throw new Error('Préciser la provenance : exercice, apprentissage ou ancien carnet.');
    const p = lireProgression(d);p.exercice[cle] = (p.exercice[cle] ?? 0)+points;lireProgression({__rddProgression231:p});
    return operationDeVoyageur(d,id,{__rddProgression231:p},'Reporter l’expérience d’exercice',[`${cle} : +${points} XP — ${motif.slice(0,160)}. Aucun stress converti.`]);
}
export function acheterVoyage(d:DonneesDeVoyage,points:number,id:string) {
    entier(points,1);const p = lireProgression(d);
    if (p.reserveStress < points*2) throw new Error('Deux XP de stress requises par point de voyage.');
    const dixiemes = Math.round(Number(d.points_de_destinee ?? 0)*10);
    entier(dixiemes,0,70);p.reserveStress -= points*2;
    return operationDeVoyageur(d,id,{__rddProgression231:p,points_de_destinee:Math.min(70,dixiemes+points)/10},'Acheter des points de voyage',
        [`${points*2} XP de stress → ${points} point(s) de voyage. Dix points font une destinée ; total plafonné à sept destinées.`]);
}

/** Particulière réellement conservée ; les exceptions demandent un choix explicite du MJ. */
export function experienceDuJet(d:DonneesDeVoyage,f:SheetTemplate,dommages:boolean,memoire:boolean,composante:string,id:string) {
    const a = lireAction(d), p = lireProgression(d);
    if (!a || a.recours !== 'clos' || a.degre !== 'reussite-particuliere' || a.ajustement >= 0 || !['action','rituel'].includes(a.nature)) throw new Error('Conserver définitivement une particulière d’action à ajustement final négatif.');
    if (p.jetsUtilises.includes(a.id)) throw new Error('Expérience déjà attribuée pour ce résultat.');
    if (p.jetsUtilises.length >= 10000) throw new Error('Limite des jets d’expérience atteinte.');
    if (a.offensif && !dommages) throw new Error('Une attaque ne donne de l’expérience que si des dommages sont infligés.');
    if (memoire && (a.caracteristique !== 'intellect' || !f.sections.find(s=>s.id === 'connaissances')?.fields.some(c=>c.id === a.competence))) throw new Error('Le test de mémoire concerne INTELLECT/Connaissance.');
    const total = -a.ajustement, competenceValide = competencesProgressives(f).some(c=>c.id === a.competence);
    const allocations:Record<string,number> = {};
    const carac = !competenceValide ? Math.max(1,Math.floor(total/2)) : Math.floor(total/2);
    if (competenceValide && !memoire) allocations[a.competence] = Math.ceil(total/2);
    const ajouter = (cle:string,n:number) => {if (n) allocations[cle] = (allocations[cle] ?? 0)+n;};
    const derives:Record<string,string[]> = {melee:['force','agilite'],tir:['vue','dexterite'],lancer:['vue','dexterite','force'],derobee:['agilite']};
    const composants = derives[a.caracteristique];
    if (composants) {
        if (carac%composants.length && !composants.includes(composante)) throw new Error('Choisir la composante qui reçoit le reliquat de la caractéristique dérivée.');
        composants.forEach(c=>ajouter(c,Math.floor(carac/composants.length)));
        ajouter(composante,carac%composants.length);
    } else if (CARACTERISTIQUES_PROGRESSIVES.includes(a.caracteristique)) ajouter(a.caracteristique,carac);
    for (const [cle,n] of Object.entries(allocations)) p.exercice[cle] = (p.exercice[cle] ?? 0)+n;
    p.jetsUtilises.push(a.id);lireProgression({__rddProgression231:p});
    return operationDeVoyageur(d,id,{__rddProgression231:p},'Expérience par l’exercice',Object.entries(allocations).map(([cle,n])=>`${cle} : +${n} XP d’exercice.`));
}
export function experienceObservation(d:DonneesDeVoyage,a:AstrologieVoyageur,personnage:string,observation:string,id:string) {
    const o=a.observations?.find(o=>o.id===observation&&o.personnage===personnage),p=lireProgression(d);
    if(!o||o.xp<=0)throw new Error('Aucune expérience secrète à communiquer pour cette observation.');
    const preuve=`astrologie-${o.id}`;
    if(p.jetsUtilises.includes(preuve))throw new Error('Cette expérience astrologique a déjà été communiquée.');
    p.exercice.astrologie=(p.exercice.astrologie ?? 0)+Math.ceil(o.xp/2);
    p.exercice.intellect=(p.exercice.intellect ?? 0)+Math.floor(o.xp/2);
    p.jetsUtilises.push(preuve);lireProgression({__rddProgression231:p});
    return operationDeVoyageur(d,id,{__rddProgression231:p},'Communiquer l’expérience d’astrologie',
        [`${Math.ceil(o.xp/2)} XP Astrologie, ${Math.floor(o.xp/2)} XP INTELLECT. Le nombre astral réel reste secret.`]);
}
