import type { HealthSystem } from '../../../types/entity.types';
import type { DegreDeReussite } from '../../dice/degresDeReussite';
import { degreDuDe, estUneReussite } from '../../dice/degresDeReussite';
import { bandesDuJet } from '../../dice/systemes/revesDeDragons';
import { etatDuVoyageur, suivrePerteDEndurance } from './fatigueDuVoyageur';

/** R2, David le 18/10/2026. Livre 2.3.1 p. 78, 91–99 et 120.
 * Aucune horloge réelle : le gardien valide les rounds et le temps écoulé.
 * Les dés sont injectés pour conserver le même tirage entre aperçu et application.
 */
export const CLE_SANTE_VOYAGEUR = '__rddSante231';
export type DonneesDeSante = Record<string, unknown>;
export type GraviteVoyageur = 'legere' | 'grave' | 'critique';
export interface BlessureVoyageur {
    id: string; gravite: GraviteVoyageur; localisation: string;
    pointsSoins: number; malusSoins: number; excedentSoins: number; bonusGuerison: number;
    premiersSoins: boolean; soinsComplets: boolean; repitJusqua: number | null;
    prochainJetVie: number | null; soigneeAuRound: number | null;
    dernierJetSoinsRound?: number;
}
export interface SanteVoyageur {
    version: 1; round: number; secondes: number; blessures: BlessureVoyageur[];
    sonneJusqua: number; inconscient: boolean; alite: boolean; mort: boolean;
    perteEnduranceRound: number; cumulTeste: number; experienceConstitution: number;
    derniereOperation: string;
}
export interface PropositionSante {
    maj: DonneesDeSante; motif: string; details: string[]; des: {faces: number; valeur: number}[];
}
export const CLEFS_DE_SOINS: Record<GraviteVoyageur, number> = {legere: 2, grave: 4, critique: 6};
export function nombreDeSante(d: DonneesDeSante, cle: string, min = -Infinity): number {
    const v = d[cle];
    if (v === '' || v === null || typeof v === 'boolean' || !Number.isInteger(Number(v)) || Number(v) < min) throw new Error(`« ${cle} » doit contenir un entier${min > -Infinity ? ` au moins égal à ${min}` : ''}.`);
    return Number(v);
}
export function lireSanteVoyageur(d: DonneesDeSante): SanteVoyageur | null {
    const v = d[CLE_SANTE_VOYAGEUR] as SanteVoyageur | undefined;
    if (!v) return null;
    const entierPositif = (x:unknown) => typeof x === 'number' && Number.isInteger(x) && x >= 0;
    if (v.version !== 1 || !entierPositif(v.round) || v.round < 1 || !entierPositif(v.secondes)
        || ![v.sonneJusqua,v.perteEnduranceRound,v.cumulTeste,v.experienceConstitution].every(entierPositif)
        || ![v.inconscient,v.alite,v.mort].every(x => typeof x === 'boolean') || typeof v.derniereOperation !== 'string'
        || !Array.isArray(v.blessures) || new Set(v.blessures.map(b => b?.id)).size !== v.blessures.length
        || v.blessures.some(b => !b || !CLEFS_DE_SOINS[b.gravite] || typeof b.id !== 'string' || typeof b.localisation !== 'string'
            || !Number.isInteger(b.pointsSoins) || !Number.isInteger(b.malusSoins) || !entierPositif(b.excedentSoins) || !entierPositif(b.bonusGuerison)
            || typeof b.premiersSoins !== 'boolean' || typeof b.soinsComplets !== 'boolean'
            || ![b.repitJusqua,b.prochainJetVie,b.soigneeAuRound].every(x => x === null || entierPositif(x)))) {
        throw new Error('Suivi des blessures invalide : conserver les données et vérifier la fiche.');
    }
    return structuredClone(v);
}
export function initialiserSanteVoyageur(d: DonneesDeSante, existantes: Partial<Record<GraviteVoyageur, number>> = {},
    soinsExistants:Record<string,'non'|'premiers'|'complets'> = {}, repitsRestants:Record<string,number> = {}, bonusExistants:Record<string,number> = {}): DonneesDeSante {
    if (lireSanteVoyageur(d)) return d;
    const endurance = nombreDeSante(d,'endurance',0), vie = nombreDeSante(d,'vie'), sc = nombreDeSante(d,'sc',1);
    const blessures: BlessureVoyageur[] = [];
    for (const gravite of ['legere','grave','critique'] as const) {
        const n = existantes[gravite] ?? 0, maximum = gravite === 'legere' ? 5 : gravite === 'grave' ? 2 : 1;
        if (!Number.isInteger(n) || n < 0 || n > maximum) throw new Error(`Nombre de blessures ${gravite} : de 0 à ${maximum}.`);
        for (let i=0;i<n;i++) blessures.push({id:`reprise-${gravite}-${i}`,gravite,localisation:'',pointsSoins:0,malusSoins:0,excedentSoins:0,bonusGuerison:0,
            premiersSoins:false,soinsComplets:false,repitJusqua:null,prochainJetVie:null,soigneeAuRound:null});
    }
    const s: SanteVoyageur = {
        version:1, round:1, secondes:0, blessures:[], sonneJusqua:0, inconscient:endurance === 0, alite:false,
        mort:vie < -sc, perteEnduranceRound:0, cumulTeste:0, experienceConstitution:0, derniereOperation:'',
    };
    for (const b of blessures) {
        const soin = soinsExistants[b.id] ?? 'non';
        if (!['non','premiers','complets'].includes(soin)) throw new Error('État des soins existants inconnu.');
        if (soin !== 'non') {
            const minutes = repitsRestants[b.id] ?? 0, bonus = bonusExistants[b.id] ?? 0;
            if (!Number.isInteger(minutes) || minutes < 0 || minutes > sc*120 || !Number.isInteger(bonus) || bonus < 0 || bonus > 3) throw new Error('Vérifier le répit restant et le bonus des soins existants.');
            b.premiersSoins = true;b.pointsSoins = CLEFS_DE_SOINS[b.gravite];
            // Aucun nouveau répit accordé à un soin ancien ; zéro signifie expiré.
            b.repitJusqua = minutes*60;b.soinsComplets = soin === 'complets';b.bonusGuerison = b.soinsComplets ? bonus : 0;
        }
    }
    s.blessures = blessures;s.alite = blessures.some(b => b.gravite === 'critique' || endurance <= 1 && b.gravite === 'grave' && !b.soinsComplets);planifierVie(d,s);
    return {...d, __rddAvantSante231: d.__rddAvantSante231 ?? structuredClone(d), [CLE_SANTE_VOYAGEUR]:s};
}
function exigerSuivi(d: DonneesDeSante): SanteVoyageur {
    const s = lireSanteVoyageur(d);if (!s) throw new Error('Activer le suivi des blessures avant cette opération.');
    return s;
}
export function etatsDeSanteVoyageur(d: DonneesDeSante) {
    const s = lireSanteVoyageur(d);if (!s) return null;
    const vie = nombreDeSante(d,'vie'), endurance = nombreDeSante(d,'endurance',0);
    const mort = s.mort || vie < -nombreDeSante(d,'sc',1);
    const coma = !mort && vie <= 0;
    const inconscient = !mort && !coma && (s.inconscient || endurance === 0);
    const fatigue = nombreDeSante(d,'fatigue',0);
    const assommeFatigue = fatigue >= 2*nombreDeSante(d,'endurance_max',1)
        || typeof d.__rddFatigueReveil === 'number' && fatigue > d.__rddFatigueReveil;
    const sonne = !mort && !coma && !inconscient && s.round <= s.sonneJusqua;
    const libelle = mort ? 'Mort' : coma ? 'Coma' : inconscient ? 'Inconscient' : assommeFatigue ? 'Assommé de fatigue' : s.alite ? 'Alité, sans action' : sonne ? 'Sonné' : 'Conscient';
    return {mort, coma, inconscient, sonne, assommeFatigue, alite:s.alite, libelle, horsCombat:mort || coma || inconscient || assommeFatigue || s.alite};
}

/** Une projection pour le socle : zéro de vie signifie coma, pas décès. */
export function projeterSanteVoyageur(d: DonneesDeSante, ancienne?: HealthSystem): HealthSystem | undefined {
    const e = etatsDeSanteVoyageur(d);if (!e) return ancienne;
    return {type:'hp', badges:ancienne?.badges ?? [], state:e.mort ? 'dead' : e.horsCombat ? 'critical' : exigerSuivi(d).blessures.length > 0 || nombreDeSante(d,'vie') < nombreDeSante(d,'vie_max',1) ? 'wounded' : 'healthy',
        data:{...(ancienne?.type === 'hp' ? ancienne.data : {}), current:nombreDeSante(d,'vie'), max:nombreDeSante(d,'vie_max',1),
            rdd:{...e, sc:nombreDeSante(d,'sc',1), mortIrreversible:exigerSuivi(d).mort}}};
}
export function jetDEnduranceRequis(d: DonneesDeSante): boolean {
    const s = lireSanteVoyageur(d);
    return !!s && !etatsDeSanteVoyageur(d)?.horsCombat && s.perteEnduranceRound >= 2 && s.cumulTeste < s.perteEnduranceRound;
}
function hemorragieActive(b: BlessureVoyageur, secondes: number): boolean {
    return b.gravite !== 'legere' && !b.soinsComplets && (!b.premiersSoins || (b.repitJusqua !== null && secondes >= b.repitJusqua));
}
export function jetsDeVieRequis(d: DonneesDeSante): BlessureVoyageur[] {
    const s = lireSanteVoyageur(d);if (!s || etatsDeSanteVoyageur(d)?.mort) return [];
    // Le livre demande un jet au blessé, pas un jet supplémentaire par plaie.
    return s.blessures.filter(b => hemorragieActive(b,s.secondes) && b.prochainJetVie !== null && b.prochainJetVie <= s.secondes)
        .sort((a,b) => Number(b.gravite === 'critique')-Number(a.gravite === 'critique') || a.prochainJetVie!-b.prochainJetVie!).slice(0,1);
}
function planifierVie(d: DonneesDeSante, s: SanteVoyageur) {
    for (const b of s.blessures) {
        if (b.gravite === 'legere') {b.prochainJetVie = null;continue;}
        if (b.soinsComplets) {b.prochainJetVie = null;continue;}
        if (b.premiersSoins && b.repitJusqua !== null && s.secondes < b.repitJusqua) {
            // À l'expiration du répit, le prochain test redevient exigible.
            b.prochainJetVie = b.repitJusqua;continue;
        }
        if (b.prochainJetVie === null && (b.gravite === 'critique' || b.gravite === 'grave' && nombreDeSante(d,'endurance',0) === 0)) {
            b.prochainJetVie = s.secondes + (b.gravite === 'critique' ? 6 : nombreDeSante(d,'sc',1) * 60);
        }
    }
}
function enregistrer(d: DonneesDeSante, s: SanteVoyageur, maj: DonneesDeSante, id: string, motif: string,
    details: string[] = [], des: PropositionSante['des'] = []): PropositionSante {
    if (!id) throw new Error('Identifiant du mouvement requis.');
    s.derniereOperation = id;
    const suivantes = {...d,...maj,[CLE_SANTE_VOYAGEUR]:s};
    if (nombreDeSante(suivantes,'vie') < -nombreDeSante(d,'sc',1)) s.mort = true;
    planifierVie(suivantes,s);
    return {maj:{...maj,[CLE_SANTE_VOYAGEUR]:s,__rddOperationFatigue:id},motif,details,des};
}
function retirerEndurance(d: DonneesDeSante, s: SanteVoyageur, perte: number, viePerdue: number, zeroDejaCompte = false) {
    const avant = nombreDeSante(d,'endurance',0), endurance = Math.max(0,avant-perte);
    const effective = avant-endurance;
    let vie = nombreDeSante(d,'vie')-viePerdue;
    if (avant > 0 && endurance === 0) {s.inconscient = true;if (!zeroDejaCompte) vie--;}
    s.perteEnduranceRound += effective;
    const fatigue = nombreDeSante(d,'fatigue',0), maximum = nombreDeSante(d,'endurance_max',1)*2;
    return {endurance,vie,fatigue:Math.max(fatigue,Math.min(maximum,fatigue+effective))};
}
export interface LectureEncaissement {gravite: GraviteVoyageur | 'contusion'; desEndurance: number[]; vie: number; aZero: boolean; promue: boolean;}
export function lireEncaissement(total: number, nonMortel: boolean, blessures: readonly BlessureVoyageur[]): LectureEncaissement {
    if (!Number.isInteger(total)) throw new Error('Encaissement entier requis.');
    let gravite: LectureEncaissement['gravite'] = total <= 10 ? 'contusion' : nonMortel ? total <= 15 ? 'contusion' : 'legere' : total <= 15 ? 'legere' : total <= 19 ? 'grave' : 'critique';
    const initiale = gravite;
    if (gravite === 'legere' && blessures.filter(b => b.gravite === 'legere').length >= 5) gravite = 'grave';
    if (gravite === 'grave' && blessures.filter(b => b.gravite === 'grave').length >= 2) gravite = 'critique';
    const promue = initiale !== gravite;
    if (gravite === 'critique') return {gravite,desEndurance:[],vie:4+Math.max(0,total-20),aZero:true,promue};
    if (gravite === 'grave') return {gravite,desEndurance:[6,6],vie:2,aZero:false,promue};
    if (gravite === 'legere' && nonMortel && !promue) return {gravite,desEndurance:total >= 20 ? [] : [6,6],vie:total >= 20 ? 1 : 0,aZero:total >= 20,promue};
    return {gravite,desEndurance:[total <= 10 ? 4 : 6],vie:0,aZero:false,promue};
}
export type TirerDuVoyageur = (faces: number) => number;
function tirage(tirer: TirerDuVoyageur, faces: number, des: PropositionSante['des']): number {
    const valeur = tirer(faces);
    if (!Number.isInteger(valeur) || valeur < 1 || valeur > faces) throw new Error(`Le d${faces} doit donner un entier de 1 à ${faces}.`);
    des.push({faces,valeur});return valeur;
}
export function proposerEncaissement(d: DonneesDeSante, dommages: number, protection: number, nonMortel: boolean,
    tirer: TirerDuVoyageur, id: string, tenterHeroisme = false, localisation = ''): PropositionSante {
    const s = exigerSuivi(d);
    if (etatsDeSanteVoyageur(d)?.mort) throw new Error('Le personnage est mort.');
    if (jetsDeVieRequis(d).length) throw new Error('Résoudre les jets de vie exigibles avant une nouvelle agression.');
    if (!Number.isInteger(dommages) || !Number.isInteger(protection)) throw new Error('Dommages et protection doivent être entiers, positifs ou négatifs.');
    const des: PropositionSante['des'] = [];
    const a = tirage(tirer,10,des), b = tirage(tirer,10,des), total = a+b+dommages-protection;
    const lecture = lireEncaissement(total,nonMortel,s.blessures);
    const perte = lecture.aZero ? nombreDeSante(d,'endurance',0) : lecture.desEndurance.reduce((n,f) => n+tirage(tirer,f,des),0);
    const dejaCritique = s.blessures.some(b => b.gravite === 'critique');
    const details = [`${a} + ${b} + (${dommages}) − (${protection}) = ${total} : ${lecture.gravite}${lecture.promue ? ' (promotion des blessures)' : ''}.`];
    let maj: DonneesDeSante;
    if (dejaCritique) {
        maj = {vie:nombreDeSante(d,'vie')-lecture.vie-perte};
        details.push(`Déjà critique : ${perte} points de perte d’endurance deviennent des pertes de vie.`);
        if (lecture.gravite === 'critique') {s.mort = true;details.push('Deuxième critique : mort immédiate.');}
    } else {
        // La table donne déjà la perte totale pour « endurance à 0 » : p. 97,
        // l'exemple à 22 enlève six points de vie, pas sept.
        maj = retirerEndurance(d,s,perte,lecture.vie,lecture.aZero);
        const eligible = !lecture.aZero && perte === nombreDeSante(d,'endurance',0) && perte > 0 && s.perteEnduranceRound <= nombreDeSante(d,'sc',1);
        if (eligible && tenterHeroisme) {
            const provisoire = {...d,...maj,endurance:1,vie:nombreDeSante(d,'vie')-lecture.vie};
            const echelle = bandesDuJet(nombreDeSante(d,'volonte',1),etatDuVoyageur(provisoire).total), seuil = echelle.chances;
            const de = tirage(tirer,100,des);
            const brut = degreDuDe(de,echelle), effectif = etatsDeSanteVoyageur(d)?.sonne ? effetDuSonne(brut,false) : brut;
            const reussi = estUneReussite(effectif);
            if (reussi) {maj = {...provisoire};s.inconscient = false;}
            details.push(`Héroïsme : ${de} / ${seuil} %, ${reussi ? 'réussi, dernier point conservé' : 'échoué'}.`);
        } else if (eligible) details.push('Héroïsme possible : la tentative devait être choisie avant les dés.');
    }
    if (lecture.gravite !== 'contusion' && !(dejaCritique && lecture.gravite === 'critique')) s.blessures.push({id,gravite:lecture.gravite,localisation,
        pointsSoins:0,malusSoins:0,excedentSoins:0,bonusGuerison:0,premiersSoins:false,soinsComplets:false,
        repitJusqua:null,prochainJetVie:null,soigneeAuRound:null});
    details.push(`Endurance ${d.endurance} → ${maj.endurance ?? d.endurance} ; vie ${d.vie} → ${maj.vie ?? d.vie}.`);
    return enregistrer(d,s,maj,id,'Encaisser',details,des);
}

export function proposerJetEndurance(d: DonneesDeSante, tirer: TirerDuVoyageur, id: string): PropositionSante {
    if (!jetDEnduranceRequis(d)) throw new Error('Aucun jet d’endurance en attente.');
    const s = exigerSuivi(d), des: PropositionSante['des'] = [], de = tirage(tirer,20,des);
    const reussi = de === 1 || de !== 20 && de <= nombreDeSante(d,'endurance',0);
    s.cumulTeste = s.perteEnduranceRound;
    if (!reussi) s.sonneJusqua = Math.max(s.sonneJusqua,s.round+1);
    if (de === 1) s.experienceConstitution++;
    return enregistrer(d,s,{},id,'Jet d’endurance',[`${de} / ${d.endurance} : ${reussi ? 'réussi' : `sonné jusqu’à la fin du round ${s.sonneJusqua}`}${de === 1 ? ' ; 1 XP Constitution à reporter' : ''}.`],des);
}
export function proposerJetVie(d: DonneesDeSante, blessureId: string, tirer: TirerDuVoyageur, id: string): PropositionSante {
    if (!jetsDeVieRequis(d).some(b => b.id === blessureId)) throw new Error('Ce jet de vie n’est pas encore exigible.');
    const s = exigerSuivi(d), b = s.blessures.find(b => b.id === blessureId)!, des: PropositionSante['des'] = [];
    const de = tirage(tirer,20,des), avant = nombreDeSante(d,'vie');
    const reussi = de === 1 || de !== 20 && de <= avant;
    if (de === 20) s.mort = true;
    const vie = avant-(reussi ? 0 : 1);
    const periode = b.gravite === 'critique' ? 6 : nombreDeSante(d,'sc',1)*60;
    const facteur = de === 1 && vie > 0 ? 20 : 1;
    b.prochainJetVie = s.secondes+periode*facteur;
    for (const autre of s.blessures) if (autre.id !== b.id && hemorragieActive(autre,s.secondes) && autre.prochainJetVie !== null) {
        autre.prochainJetVie = s.secondes+(autre.gravite === 'critique' ? 6 : nombreDeSante(d,'sc',1)*60)*facteur;
    }
    return enregistrer(d,s,{vie},id,'Jet de vie',[`${de} / ${avant} : ${de === 20 ? 'mort immédiate' : reussi ? 'réussi' : 'perte de 1 point de vie'}.`],des);
}
export function proposerFinRound(d: DonneesDeSante, id: string, tirer?: TirerDuVoyageur): PropositionSante {
    const s = exigerSuivi(d);
    if (jetsDeVieRequis(d).length || jetDEnduranceRequis(d)) throw new Error('Résoudre les jets en attente avant de terminer le round.');
    const details = [`Fin du round de santé ${s.round}.`];
    const saigne = s.blessures.some(b => b.gravite === 'grave' && hemorragieActive(b,s.secondes+6) && b.soigneeAuRound !== s.round);
    const maj: DonneesDeSante = saigne && !etatsDeSanteVoyageur(d)?.mort ? retirerEndurance(d,s,1,0) : {};
    const des: PropositionSante['des'] = [];
    if (Number(maj.endurance) > 0 && s.perteEnduranceRound >= 2 && s.cumulTeste < s.perteEnduranceRound) {
        if (!tirer) throw new Error('Le dé du jet d’endurance de fin de round est requis.');
        const de = tirage(tirer,20,des), reussi = de === 1 || de !== 20 && de <= Number(maj.endurance);
        if (!reussi) s.sonneJusqua = Math.max(s.sonneJusqua,s.round+1);
        if (de === 1) s.experienceConstitution++;
        details.push(`Jet d’endurance de la phase santé : ${de} / ${maj.endurance}, ${reussi ? 'réussi' : 'sonné'}.`);
    }
    s.secondes += 6;s.round++;s.perteEnduranceRound = 0;s.cumulTeste = 0;
    if (saigne) details.push('Hémorragie grave : −1 endurance (une fois par round).');
    return enregistrer(d,s,maj,id,'Fin de round',details,des);
}
export function proposerTempsSante(d: DonneesDeSante, minutes: number, id: string): PropositionSante {
    const s = exigerSuivi(d);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080) throw new Error('Durée entière de 1 à 10 080 minutes requise.');
    if (jetsDeVieRequis(d).length || jetDEnduranceRequis(d)) throw new Error('Résoudre les jets en attente avant d’avancer le temps.');
    if (s.blessures.some(b => b.gravite === 'grave' && hemorragieActive(b,s.secondes) && nombreDeSante(d,'endurance',0) > 0)) throw new Error('Hémorragie active : procéder round par round.');
    const echeances = s.blessures.flatMap(b => b.prochainJetVie !== null && b.prochainJetVie > s.secondes ? [b.prochainJetVie] : []);
    const avant = s.secondes;
    s.secondes = Math.min(s.secondes+minutes*60,...echeances);
    s.round += Math.floor((s.secondes-avant)/6);s.perteEnduranceRound = 0;s.cumulTeste = 0;
    return enregistrer(d,s,{},id,'Temps de santé',[`${s.secondes-avant} secondes écoulées ; arrêt à la prochaine obligation de santé. Aucun repos ni soin automatique.`]);
}

const POINTS_DE_TACHE: Record<DegreDeReussite, number> = {'reussite-particuliere':3,'reussite-significative':2,'reussite-normale':1,'echec-normal':0,'echec-particulier':-2,'echec-total':-4};
export function proposerSoins(d: DonneesDeSante, blessureId: string, complets: boolean, degre: DegreDeReussite, id: string, changerOperant = false): PropositionSante {
    const s = exigerSuivi(d), b = s.blessures.find(b => b.id === blessureId);
    if (!b || !(degre in POINTS_DE_TACHE)) throw new Error('Blessure et résultat de soins requis.');
    const cle = CLEFS_DE_SOINS[b.gravite], details: string[] = [];
    if (complets) {
        if (!b.premiersSoins) throw new Error('Accomplir les premiers soins avant les soins complets.');
        if (degre === 'echec-total') {
            b.premiersSoins = false;b.soinsComplets = false;b.pointsSoins = 0;b.malusSoins--;b.excedentSoins = 0;
            b.repitJusqua = null;b.prochainJetVie = null;b.bonusGuerison = 0;b.soigneeAuRound = null;
            details.push('Hémorragie relancée, premiers soins à reprendre à −1 supplémentaire ; pansements et eau à dépenser de nouveau.');
        } else {
            b.soinsComplets = true;b.prochainJetVie = null;b.repitJusqua = null;
            b.bonusGuerison = degre === 'reussite-particuliere' ? 3 : degre === 'reussite-significative' ? 2 : degre === 'reussite-normale' ? 1 : 0;
            details.push(`Soins complets ; bonus ${b.bonusGuerison} au prochain test de guérison, à partir de ${cle} jours (R4).`);
        }
    } else {
        if (b.premiersSoins) throw new Error('Les premiers soins sont déjà accomplis.');
        if (b.dernierJetSoinsRound === s.round) throw new Error('Un seul jet de premiers soins par round pour cette blessure. Terminer le round de santé.');
        b.dernierJetSoinsRound = s.round;
        if (changerOperant) b.pointsSoins = Math.max(0,b.pointsSoins);
        b.pointsSoins += POINTS_DE_TACHE[degre];
        if (degre === 'echec-total') b.malusSoins--;
        if (b.pointsSoins >= cle) {
            b.premiersSoins = true;b.excedentSoins = b.pointsSoins-cle;b.soigneeAuRound = s.round;
            b.repitJusqua = s.secondes+nombreDeSante(d,'sc',1)*7200;b.prochainJetVie = b.repitJusqua;
            details.push('Premiers soins accomplis : aucun décompte dans ce round.');
        }
        details.push(`Premiers soins ${b.pointsSoins}/${cle} ; difficulté ${-cle+b.malusSoins}, excédent ${b.excedentSoins}.`);
    }
    let maj: DonneesDeSante = {};
    if (b.premiersSoins && nombreDeSante(d,'endurance',0) === 0 && nombreDeSante(d,'vie') > 0 && !s.mort) {
        maj = {endurance:1};s.inconscient = false;s.alite = true;
        details.push('Reprise de conscience avec 1 endurance : reste couché, aucune action.');
    }
    if (b.soinsComplets && !s.blessures.some(x => x.gravite === 'critique' || x.gravite === 'grave' && !x.soinsComplets)) s.alite = false;
    return enregistrer(d,s,maj,id,complets ? 'Soins complets' : 'Premiers soins',details);
}

/** Les écritures ordinaires restent cohérentes avec le suivi : une perte rejouée
 * ou déjà décrite par une opération R2 n'est jamais appliquée deux fois.
 */
export function suivreSanteVoyageur(avant: DonneesDeSante, apres: DonneesDeSante): DonneesDeSante {
    const s = lireSanteVoyageur(apres);if (!s) return apres;
    const precedent = lireSanteVoyageur(avant);
    if (!precedent || precedent.derniereOperation !== s.derniereOperation) return apres;
    const perte = nombreDeSante(avant,'endurance',0)-nombreDeSante(apres,'endurance',0);
    if (perte <= 0) {
        if (perte < 0 && nombreDeSante(apres,'endurance',0) > 0 && nombreDeSante(apres,'vie') > 0
            && !s.blessures.some(b => b.gravite !== 'legere' && !b.premiersSoins)) {
            s.inconscient = false;return {...apres,[CLE_SANTE_VOYAGEUR]:s};
        }
        return apres;
    }
    s.perteEnduranceRound += perte;
    const maj: DonneesDeSante = {...apres,[CLE_SANTE_VOYAGEUR]:s};
    if (nombreDeSante(apres,'endurance',0) === 0) {s.inconscient = true;maj.vie = nombreDeSante(apres,'vie')-1;}
    planifierVie(maj,s);
    return maj;
}
export function effetDuSonne(degre: DegreDeReussite, offensif: boolean): DegreDeReussite {
    if (degre === 'reussite-particuliere') return 'reussite-significative';
    const effectif = degre === 'reussite-normale' ? 'echec-normal' : degre;
    return offensif && (effectif === 'echec-normal' || effectif === 'echec-particulier') ? 'echec-total' : effectif;
}
export function finaliserMajSante(d: DonneesDeSante, p: PropositionSante): DonneesDeSante {
    // Réutilise le seuil de réveil R1 sans refaire le coût d'endurance.
    return suivrePerteDEndurance(d,{...d,...p.maj});
}
