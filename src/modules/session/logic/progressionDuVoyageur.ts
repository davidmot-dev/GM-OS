import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { degreDuDe, type DegreDeReussite } from '../../dice/degresDeReussite';
import { bandesDuJet } from '../../dice/systemes/revesDeDragons';
import { operationDeVoyageur, type DonneesDeVoyage } from './operationsDeVoyageur';
import { entierVoyageur as entier, lireMoral, majMoral } from './moralDuVoyageur';
import { lireAction } from './recoursDuVoyageur';
import type { AstrologieVoyageur } from './astrologieDuVoyageur';
import { proposerFatigue } from './fatigueDuVoyageur';

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

/** Un désir lancinant ou thanataire en cours empêche les XP d'exercice (p. 198–199). */
function desirEnCours(d: DonneesDeVoyage): string | null {
    const actifs = (d.__rddHautReve231 as {actifs?: {nom?: string}[]} | undefined)?.actifs ?? [];
    return actifs.find(e => /^(Désir|Coup de foudre|Haine fatale)/.test(e.nom ?? ''))?.nom ?? null;
}
const MELEE_SEULE = ['corps_a_corps','dague_melee','epee_1m','bouclier','esquive'];
export interface Entrainement {
    competence: string; caracteristique: string;
    /** Points de fatigue de l'heure d'entraînement : deux au moins, selon la compétence. */
    fatigue: number;
    /** Le d6 qui donne le nombre de jets, et ces jets. */
    d6: number; jets: number[];
    /** Le niveau du partenaire, pour la mêlée qui s'entraîne à deux. */
    partenaire?: number;
}
/**
 * L'entraînement (p. 146–147) : une heure pleine, deux points de fatigue au
 * moins, puis 1d6 jets à un ajustement final de −1 quel que soit le niveau.
 * Chaque particulière rapporte un point d'expérience, chaque échec total est une
 * maladresse. En mêlée, à deux : la difficulté vise −1 pour le plus faible, seul
 * à pouvoir gagner de l'expérience.
 */
export function proposerEntrainement(d: DonneesDeVoyage, f: SheetTemplate, e: Entrainement, id: string) {
    const section = f.sections.find(s => s.fields.some(c => c.id === e.competence))?.id;
    if (!competencesProgressives(f).some(c => c.id === e.competence) || section === 'connaissances' || section === 'draconic') {
        throw new Error('L’entraînement vaut pour les compétences pratiques ; connaissances et Draconic s’apprennent avec un maître ou un livre.');
    }
    if (MELEE_SEULE.includes(e.competence) && e.partenaire === undefined) throw new Error('La mêlée s’entraîne à deux : indiquer le niveau du partenaire.');
    entier(e.fatigue,2,12);entier(e.d6,1,6);
    if (e.jets.length !== e.d6) throw new Error(`Le d6 donne ${e.d6} jet(s) : en renseigner autant.`);
    const niveau = entier(d[e.competence],-11,999), carac = entier(d[e.caracteristique],1,999);
    const difficulte = -1-(e.partenaire === undefined ? niveau : Math.min(niveau,entier(e.partenaire,-11,999)));
    const ajustement = difficulte+niveau, echelle = bandesDuJet(carac,ajustement);
    const degres = e.jets.map(j => degreDuDe(entier(j,1,100),echelle));
    const particulieres = degres.filter(x => x === 'reussite-particuliere').length, maladresses = degres.filter(x => x === 'echec-total').length;
    const desir = desirEnCours(d), gagne = ajustement < 0 && !desir ? particulieres : 0;
    const p = lireProgression(d);
    if (gagne) p.exercice[e.competence] = (p.exercice[e.competence] ?? 0)+gagne;
    // Avec le suivi R1, la fatigue suit la piste du personnage ; sans lui, elle s'ajoute au champ.
    let fatigue: number;
    try {fatigue = Number(proposerFatigue(d,'libre',e.fatigue).maj.fatigue);} catch {fatigue = entier(d.fatigue ?? 0)+e.fatigue;}
    const nom = (cle: string) => f.sections.flatMap(s => s.fields).find(c => c.id === cle)?.label ?? cle;
    const details = [`${nom(e.caracteristique)}/${nom(e.competence)} : difficulté ${difficulte}, ajustement final ${ajustement} (${echelle.chances} %), ${e.d6} jet(s) : ${e.jets.join(', ')}.`,
        `${particulieres} particulière(s) : +${gagne} XP d’exercice${desir ? ` — aucune tant que dure « ${desir} »` : ajustement >= 0 ? ' — le plus fort des deux partenaires ne gagne rien' : ''}.`,
        `Fatigue +${e.fatigue} pour l’heure d’entraînement.`];
    if (maladresses) details.push(`${maladresses} échec(s) total(aux) : autant de maladresses, au meneur de les décrire.`);
    return operationDeVoyageur(d,id,{__rddProgression231:p,fatigue},'Une heure d’entraînement',details);
}

/**
 * Le rythme de l'apprentissage (p. 145–146) : trois XP par semaine jusqu'au
 * niveau zéro, une par semaine jusqu'à +3, puis une toutes les deux semaines
 * pour +4, trois pour +5… Passer de +3 à +4 prend 40 semaines, de +4 à +5, 90.
 */
export function semainesParPoint(niveauVise: number): number {
    return niveauVise <= 0 ? 1/3 : niveauVise <= 3 ? 1 : niveauVise-2;
}
/** Combien d'XP rapportent tant de semaines à plein temps, sans dépasser le niveau du maître. */
export function experienceDApprentissage(niveau: number, xpDejaAcquise: number, semaines: number, maitre: number): {xp: number; niveauAtteint: number} {
    let xp = 0, cible = niveau+1, versCible = xpDejaAcquise, temps = semaines;
    while (cible <= maitre && temps > 1e-9) {
        const cout = coutCompetence(cible), manque = Math.max(0,cout-versCible), rythme = semainesParPoint(cible);
        const possibles = Math.floor(temps/rythme+1e-9);
        if (possibles < manque) {xp += possibles;break;}
        xp += manque;temps -= manque*rythme;versCible = Math.max(0,versCible-cout);cible++;
    }
    return {xp,niveauAtteint:cible-1};
}
export function proposerApprentissage(d: DonneesDeVoyage, f: SheetTemplate, cle: string, semaines: number, maitre: number, id: string) {
    if (!competencesProgressives(f).some(c => c.id === cle)) throw new Error('Choisir une compétence ou une voie de Draconic.');
    entier(semaines,1,520);
    const niveau = entier(d[cle],-11,999);
    if (!Number.isInteger(maitre) || maitre <= niveau) throw new Error('Le maître doit posséder la compétence à un niveau plus élevé que l’élève.');
    const p = lireProgression(d), acquis = (p.exercice[cle] ?? 0)+(p.stress[cle] ?? 0);
    const {xp,niveauAtteint} = experienceDApprentissage(niveau,acquis,semaines,maitre);
    if (!xp) throw new Error('Ces semaines ne rapportent aucun point : allonger l’apprentissage ou augmenter d’abord la compétence.');
    p.exercice[cle] = (p.exercice[cle] ?? 0)+xp;
    return operationDeVoyageur(d,id,{__rddProgression231:p},'Apprentissage avec un maître',[
        `${cle} : ${semaines} semaine(s) à plein temps (5 heures par jour) avec un maître de niveau ${maitre} : +${xp} XP d’apprentissage, de quoi viser ${niveauAtteint}.`,
        'Entre deux aventures, en gris rêve ; impossible de dépasser le niveau du maître. Le niveau monte avec « Préparer l’augmentation d’un niveau ».']);
}
