import { DEGRES_DE_REUSSITE, degreDuDe, estUneReussite, type DegreDeReussite } from '../../dice/degresDeReussite';
import { bandesDuJet } from '../../dice/systemes/revesDeDragons';
import { proposerFatigue } from './fatigueDuVoyageur';
import { CLEFS_DE_SOINS, CLE_SANTE_VOYAGEUR, etatsDeSanteVoyageur, lireSanteVoyageur, nombreDeSante, proposerTempsSante, type BlessureVoyageur } from './santeDuVoyageur';
import { operationDeVoyageur, type DonneesDeVoyage } from './operationsDeVoyageur';
import { convertirStress } from './progressionDuVoyageur';
import { entierVoyageur, lireMoral, majMoral, resultatMoral, type SituationDeMoral } from './moralDuVoyageur';

/** R4 : Livre 2.3.1, p. 87–94, 98–102, 187 et 206–208.
 * `jour` désigne la journée en cours, non celle qui commence après Château Dormant.
 * Aucun calendrier, chargement ou passage de l'horloge ne déclenche une opération.
 */
export interface ReposVoyageur {
    version: 1; jour: number; heuresDormies: number; dernierBilan: string; bilans: string[];
    maladieOuPoison: boolean; vieApresJour: number;
    effets: {id: string; type: 'queue'|'tete'|'souffle'; nombre: number; motif: string}[];
}
export function lireRepos(d: DonneesDeVoyage): ReposVoyageur | null {
    const r = d.__rddRepos231 as ReposVoyageur | undefined;
    if (r === undefined) return null;
    if (!r || r.version !== 1 || !Number.isSafeInteger(r.jour) || r.jour < 0 || !Number.isSafeInteger(r.heuresDormies) || r.heuresDormies < 0
        || typeof r.dernierBilan !== 'string' || !Array.isArray(r.bilans) || r.bilans.length > 10000 || r.bilans.some(x => typeof x !== 'string')
        || typeof r.maladieOuPoison !== 'boolean' || !Number.isSafeInteger(r.vieApresJour)
        || !Array.isArray(r.effets) || r.effets.length > 60 || r.effets.some(e => !e || typeof e.id !== 'string'
            || !['queue','tete','souffle'].includes(e.type) || !Number.isInteger(e.nombre) || e.nombre < 1 || typeof e.motif !== 'string')) {
        throw new Error('Suivi du repos invalide : conserver les données.');
    }
    return structuredClone(r);
}
function exiger(d: DonneesDeVoyage) {
    const r = lireRepos(d), s = lireSanteVoyageur(d);
    if (!r || !s) throw new Error('Activer les suivis des blessures et du repos.');
    if (etatsDeSanteVoyageur(d)?.mort) throw new Error('Le personnage est mort.');
    return {r,s};
}
export function initialiserRepos(d: DonneesDeVoyage, restants: Record<string,number>, maladieOuPoison: boolean, id: string, vieEligibleCeSoir = false) {
    if (lireRepos(d)) throw new Error('Le suivi du repos est déjà actif.');
    const s = lireSanteVoyageur(d);if (!s) throw new Error('Activer le suivi des blessures avant le repos.');
    for (const b of s.blessures.filter(b => b.soinsComplets)) {
        const jours = restants[b.id];
        if (!Number.isInteger(jours) || jours < 0 || jours > CLEFS_DE_SOINS[b.gravite]) throw new Error('Renseigner les jours restant pour chaque blessure déjà soignée (0 : test ce soir).');
        b.guerison = {prochainJour:jours,bonusHerbe:0};
    }
    const r: ReposVoyageur = {version:1,jour:0,heuresDormies:0,dernierBilan:'',bilans:[],maladieOuPoison,vieApresJour:vieEligibleCeSoir ? 0 : 1,effets:[]};
    return operationDeVoyageur(d,id,{__rddRepos231:r,[CLE_SANTE_VOYAGEUR]:s},'Activer le repos',
        ['Aucun compteur récupéré. Journée de suivi 1 ; les échéances existantes sont déclarées explicitement.']);
}
export function plafondEnduranceAuRepos(d: DonneesDeVoyage, sommeil: boolean): number {
    const maximum = nombreDeSante(d,'endurance_max',1), vieManquante = Math.max(0,nombreDeSante(d,'vie_max',1)-nombreDeSante(d,'vie'));
    const s = lireSanteVoyageur(d);if (!s) throw new Error('Blessures inconnues : activer le suivi R2.');
    const graves = s.blessures.filter(b => b.gravite === 'grave').length;
    const limiteBlessures = s.blessures.some(b => b.gravite === 'critique') ? 1 : Math.floor(maximum/2**(graves+(sommeil ? 0 : 1)));
    return Math.max(0,Math.min(maximum-2*vieManquante,limiteBlessures));
}
export function forceDuReve(tirages: number[]): number {
    if (!tirages.length || tirages.length > 100 || tirages.some((x,i) => !Number.isInteger(x) || x < 0 || x > 7 || i < tirages.length-1 && x !== 7)
        || tirages.at(-1) === 7) throw new Error('DDR : valeurs 0 à 7, relancer chaque 7 jusqu’à un résultat de 0 à 6.');
    return tirages.reduce((n,x) => n+x,0);
}
export function proposerRepos(d: DonneesDeVoyage, sommeil: boolean, minutes: number, reveAutorise: boolean,
    tirages: number[], maitrise: DegreDeReussite | undefined, id: string) {
    const {r,s} = exiger(d);
    if (etatsDeSanteVoyageur(d)?.coma) throw new Error('Le coma nécessite un arbitrage médical ; ce n’est pas un sommeil ordinaire.');
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 120 || (sommeil ? minutes !== 120 : minutes%5 !== 0)) throw new Error('Repos éveillé : multiple de 5 minutes, maximum 120. Sommeil : une heure complète de 120 minutes par aperçu.');
    const temps = proposerTempsSante(d,minutes,id);
    const apresTemps = lireSanteVoyageur({...d,...temps.maj})!;
    if (apresTemps.secondes-s.secondes !== minutes*60) throw new Error('Une obligation de santé interrompt le repos : la résoudre avant de recommencer.');
    const plafond = plafondEnduranceAuRepos(d,sommeil), avant = nombreDeSante(d,'endurance',0);
    const endurance = Math.max(avant,Math.min(plafond,sommeil ? plafond : avant+minutes/5));
    if (endurance > 0 && nombreDeSante(d,'vie') > 0) apresTemps.inconscient = false;
    let maj: DonneesDeVoyage = {...temps.maj,endurance};
    const details = [`${minutes} minutes ${sommeil ? 'de sommeil' : 'de repos éveillé'} ; endurance ${avant} → ${endurance} (plafond de récupération ${plafond}, sans retirer un excédent).`];
    if (sommeil) {
        maj = {...maj,...proposerFatigue({...d,...maj},'sommeil',1).maj};r.heuresDormies++;
        details.push(`Fatigue ${d.fatigue} → ${maj.fatigue} après récupération d’endurance.`);
        const courant = nombreDeSante(d,'reve_pts',0), seuil = nombreDeSante(d,'reve_seuil',0);
        if (reveAutorise && courant < seuil) {
            const force = forceDuReve(tirages);
            let gain = force;
            if (tirages[0] === 7) {
                const degre = courant === 0 ? 'echec-total' : maitrise;
                if (!degre || !DEGRES_DE_REUSSITE.includes(degre)) throw new Error(`Rêve de Dragon de force ${force} : résoudre la maîtrise avant de valider.`);
                gain = estUneReussite(degre) ? force : 0;
                if (gain) {if (seuil < nombreDeSante(d,'reve',0)) maj.reve_seuil = seuil+1;}
                const nombre = degre === 'echec-total' ? 2 : gain ? 0 : 1;
                if (nombre) r.effets.push({id:`${id}-queue`,type:'queue',nombre,motif:`Rêve de Dragon force ${force}`});
                if (degre === 'reussite-particuliere') r.effets.push({id:`${id}-tete`,type:'tete',nombre:1,motif:`Rêve de Dragon force ${force}`});
                details.push(`Maîtrise arbitrée : ${degre}. Queues et têtes éventuelles restent à résoudre.`);
            }
            maj.reve_pts = courant+gain;
            if (Number(maj.reve_pts) > 3*Number(maj.reve_seuil ?? seuil)) {
                maj.reve_pts = 0;r.effets.push({id:`${id}-souffle`,type:'souffle',nombre:1,motif:'Éclatement du rêve'});
                details.push('Triple du seuil dépassé : rêve à zéro, souffle de Dragon à résoudre.');
            }
            details.push(`DDR ${tirages.join(' + ')} ; rêve ${courant} → ${maj.reve_pts}. Aucun plafonnement au seuil.`);
        } else details.push(reveAutorise ? 'Seuil déjà atteint : aucune récupération de rêve.' : 'Récupération de rêve exclue pour cette heure par le gardien.');
    }
    if (r.effets.length > 60) throw new Error('Résoudre les effets de Dragon en attente avant de poursuivre.');
    return operationDeVoyageur(d,id,{...maj,__rddRepos231:r},sommeil ? 'Une heure de sommeil' : 'Repos éveillé',details);
}
export function preparerGuerison(d: DonneesDeVoyage, b: BlessureVoyageur, bonusHerbe = 0) {
    const ajustement = -Math.max(0,nombreDeSante(d,'vie_max',1)-nombreDeSante(d,'vie'))+b.bonusGuerison+bonusHerbe;
    const echelle = bandesDuJet(nombreDeSante(d,'constitution',1),ajustement);
    return {ajustement,seuil:echelle.chances,echelle};
}
export interface BilanDeNuit {
    nom: string; controlesManuels: boolean; maladieOuPoison: boolean;
    jetsBlessures: Record<string,number>; herbes: Record<string,number>;
    deVie?: number; bonusDecoction: number;
    etapesVoyageur?: {stressDe?:number;stressSecond?:number;moralDe:number;situation:SituationDeMoral;chanceDepensee:boolean};
    destineeBlessures?:string[];destineeVie?:boolean;
}
export function proposerChateauDormant(d: DonneesDeVoyage, choix: BilanDeNuit, id: string) {
    const {r,s} = exiger(d);
    if (!choix.nom.trim() || choix.nom.length > 120 || !choix.controlesManuels) throw new Error('Nommer la nuit et confirmer les autres opérations nocturnes.');
    if (r.bilans.includes(choix.nom)) throw new Error('Ce bilan de nuit est déjà appliqué.');
    if (r.bilans.length >= 10000) throw new Error('Limite des bilans conservés atteinte ; aucun reçu n’est effacé.');
    if (s.blessures.some(b => !b.soinsComplets && b.gravite !== 'legere')) throw new Error('Terminer les soins et obligations de santé avant le bilan de nuit.');
    if (!Number.isInteger(choix.bonusDecoction) || choix.bonusDecoction < 0 || choix.bonusDecoction > 10) throw new Error('Bonus de décoction : de 0 à 10.');
    const de = (v: number | undefined) => {if (!Number.isInteger(v) || v! < 1 || v! > 100) throw new Error('Renseigner chaque jet d100 exigible (1 à 100).');return v!;};
    const details: string[] = [];
    let complement:DonneesDeVoyage = {};
    if (choix.etapesVoyageur && Number(d.stress ?? 0) > 0 && r.heuresDormies > 0) {
        const c = convertirStress(d,`jour-${r.jour}`,choix.etapesVoyageur.stressDe!,choix.etapesVoyageur.stressSecond);
        complement = c.maj;details.push(...c.details);
    } else if (choix.etapesVoyageur) details.push('Aucune conversion de stress : pas de stress ou pas d’heure de sommeil.');
    let destinee = Number(d.points_de_destinee ?? 0);
    const sauverConstitution = (degre:DegreDeReussite,choisi:boolean) => {
        if (!choisi) return degre;
        entierVoyageur(Math.round(destinee*10),10,70);destinee = Math.round((destinee-1)*10)/10;
        const resultat:DegreDeReussite = degre === 'echec-total' ? 'echec-normal' : 'reussite-particuliere';
        details.push(`Un point de destinée : CONSTITUTION ${degre} → ${resultat}.`);return resultat;
    };
    let vie = nombreDeSante(d,'vie'), endurance = nombreDeSante(d,'endurance',0), fatigue = nombreDeSante(d,'fatigue',0);
    const avaitDesBlessures = s.blessures.length > 0;
    const maladieAvant = r.maladieOuPoison;
    r.maladieOuPoison = choix.maladieOuPoison;
    for (const b of [...s.blessures]) {
        if (!b.soinsComplets) continue;
        if (!b.guerison) throw new Error('Déclarer l’échéance de guérison de chaque ancienne blessure soignée.');
        if (b.guerison.prochainJour > r.jour) continue;
        const herbe = choix.herbes[b.id] ?? 0;
        if (!Number.isInteger(herbe) || herbe < 0 || herbe > 10) throw new Error('Bonus effectif d’herbe : de 0 à 10, après brins manquants.');
        const jet = preparerGuerison({...d,vie},b,herbe), tirage = de(choix.jetsBlessures[b.id]), degre = sauverConstitution(degreDuDe(tirage,jet.echelle),choix.destineeBlessures?.includes(b.id) ?? false);
        b.bonusGuerison = 0;b.guerison.bonusHerbe = 0;
        if (estUneReussite(degre)) {
            if (b.gravite === 'legere') s.blessures = s.blessures.filter(x => x.id !== b.id);
            else {b.gravite = b.gravite === 'critique' ? 'grave' : 'legere';b.guerison.prochainJour = r.jour+CLEFS_DE_SOINS[b.gravite];}
        } else if (degre === 'echec-total') {vie--;b.guerison.prochainJour = r.jour+CLEFS_DE_SOINS[b.gravite];}
        else b.guerison.prochainJour = r.jour+1;
        details.push(`Blessure ${b.id} : CONSTITUTION à ${jet.ajustement}, ${jet.seuil} %, d100 ${tirage}, ${degre}. Bonus consommés ; prochain test ${s.blessures.includes(b) ? `journée ${b.guerison.prochainJour+1}` : 'blessure disparue'}.`);
    }
    if (avaitDesBlessures && !s.blessures.length || maladieAvant && !choix.maladieOuPoison) r.vieApresJour = r.jour+1;
    if (!avaitDesBlessures && !maladieAvant && !choix.maladieOuPoison && r.jour >= r.vieApresJour && vie < nombreDeSante(d,'vie_max',1)) {
        const ajustement = -(nombreDeSante(d,'vie_max',1)-vie)+choix.bonusDecoction;
        const echelle = bandesDuJet(nombreDeSante(d,'constitution',1),ajustement), seuil = echelle.chances, tirage = de(choix.deVie), degre = sauverConstitution(degreDuDe(tirage,echelle),choix.destineeVie ?? false);
        const gain = degre === 'reussite-particuliere' ? 2 : estUneReussite(degre) ? 1 : degre === 'echec-total' ? -1 : 0;
        const effective = Math.min(gain,nombreDeSante(d,'vie_max',1)-vie);vie += effective;
        if (effective > 0) {endurance = Math.max(endurance,Math.min(plafondEnduranceAuRepos({...d,vie,[CLE_SANTE_VOYAGEUR]:s},true),endurance+2*effective));fatigue = Math.max(0,fatigue-2*effective,nombreDeSante(d,'endurance_max',1)-endurance);}
        details.push(`Récupération de vie : CONSTITUTION à ${ajustement}, ${seuil} %, d100 ${tirage}, ${degre} ; ${effective} PV. Ajustement général exclu.`);
    } else details.push('Pas de récupération de vie ce soir (blessure, maladie/poison, délai ou vie complète).');
    if (choix.etapesVoyageur) {
        const e = choix.etapesVoyageur, m = lireMoral({...d,...complement}), apres = resultatMoral(m,e.situation,e.moralDe);
        complement = {...complement,...majMoral(apres)};
        details.push(`Moral du matin ${e.situation} : d20 ${e.moralDe} / ${10+m.moral}, moral ${m.moral} → ${apres.moral}.`);
        const courant = entierVoyageur(d.points_de_chance), maximum = entierVoyageur(d.chance);
        const depensee = d.__rddChanceDepensee231 === true || e.chanceDepensee;
        complement.points_de_chance = depensee ? courant : Math.max(courant,Math.min(maximum,courant+1));
        complement.__rddChanceDepensee231 = false;
        details.push(depensee ? 'Chance dépensée aujourd’hui : aucune récupération.' : `Journée sans dépense : chance ${courant} → ${complement.points_de_chance}.`);
    }
    let reve = nombreDeSante(d,'reve_pts',0);
    if (reve > nombreDeSante(d,'reve_seuil',0)) {reve--;details.push('Après le stress : rêve supérieur au seuil, −1 point.');}
    s.alite = s.blessures.some(b => b.gravite === 'critique' || b.gravite === 'grave' && !b.soinsComplets);
    if (vie < -nombreDeSante(d,'sc',1)) s.mort = true;
    if (endurance > 0 && vie > 0) s.inconscient = false;
    s.derniereOperation = id;r.dernierBilan = choix.nom;r.bilans.push(choix.nom);r.jour++;r.heuresDormies = 0;
    const maj = {...complement,...(destinee !== Number(d.points_de_destinee ?? 0) ? {points_de_destinee:destinee} : {}),vie,endurance,fatigue,reve_pts:reve,[CLE_SANTE_VOYAGEUR]:s,__rddRepos231:r,__rddOperationFatigue:id};
    return operationDeVoyageur(d,id,maj,`Château Dormant — ${choix.nom}`,details);
}
