import type { DegreDeReussite } from '../../dice/degresDeReussite';
import { operationDeVoyageur, type DonneesDeVoyage } from './operationsDeVoyageur';

/** Livre des Voyageurs 2.3.1, p. 84–85. Un ouvrage possède une seule fiche porteuse,
 * même quand plusieurs participants travaillent : leurs points rejoignent le même fonds.
 */
export const POINTS_DE_TACHE: Record<DegreDeReussite, number> = {
    'reussite-particuliere':3,'reussite-significative':2,'reussite-normale':1,
    'echec-normal':0,'echec-particulier':-2,'echec-total':-4,
};
export interface ResultatDeTache { participant: string; degre: DegreDeReussite|'absent'; jetId?: string; }
const pointsDuResultat = (r:ResultatDeTache) => r.degre === 'absent' ? 0 : POINTS_DE_TACHE[r.degre];
export interface TacheVoyageur {
    id: string; nom: string; objectif: number; difficulte: number; periodiciteSecondes: number;
    limiteSecondes: number | null; seuilNegatif: number | null; participants: string[];
    points: number; malus: number; periodes: number; etat: 'active'|'pause'|'reussie'|'echouee';
}
interface CarnetTaches { version: 1; taches: TacheVoyageur[]; jetsUtilises: string[]; }
const entier = (n: number, min: number, max = 1000000) => Number.isSafeInteger(n) && n >= min && n <= max;
export function lireTaches(d: DonneesDeVoyage): CarnetTaches {
    const c = d.__rddTaches231 as CarnetTaches | undefined;
    if (c === undefined) return {version:1,taches:[],jetsUtilises:[]};
    if (!c || c.version !== 1 || !Array.isArray(c.taches) || c.taches.length > 50 || !Array.isArray(c.jetsUtilises)
        || c.jetsUtilises.length > 10000 || c.jetsUtilises.some(x => typeof x !== 'string')
        || new Set(c.taches.map(t => t?.id)).size !== c.taches.length
        || c.taches.some(t => !t || typeof t.id !== 'string' || typeof t.nom !== 'string' || !t.nom.trim() || t.nom.length > 160
            || !entier(t.objectif,1) || !entier(t.difficulte,-100,100) || !entier(t.periodiciteSecondes,1,604800)
            || !entier(t.points,-1000000) || !entier(t.malus,-10000,0) || !entier(t.periodes,0)
            || t.limiteSecondes !== null && !entier(t.limiteSecondes,t.periodiciteSecondes,Number.MAX_SAFE_INTEGER)
            || t.seuilNegatif !== null && !entier(t.seuilNegatif,-1000000,-1)
            || !['active','pause','reussie','echouee'].includes(t.etat)
            || !Array.isArray(t.participants) || t.participants.length < 1 || t.participants.length > 20
            || new Set(t.participants).size !== t.participants.length || t.participants.some(p => typeof p !== 'string' || !p.trim() || p.length > 100))) {
        throw new Error('Carnet de tâches invalide : conserver les données et vérifier la fiche.');
    }
    return structuredClone(c);
}
export function creerTache(d: DonneesDeVoyage, parametres: Omit<TacheVoyageur,'points'|'malus'|'periodes'|'etat'>, id: string) {
    const c = lireTaches(d);
    if (c.taches.length >= 50 || c.taches.some(t => t.id === parametres.id)) throw new Error('Identifiant déjà utilisé ou limite de 50 ouvrages atteinte.');
    c.taches.push({...parametres,points:0,malus:0,periodes:0,etat:'active'});
    lireTaches({__rddTaches231:c});
    return operationDeVoyageur(d,id,{__rddTaches231:c},`Ouvrage : ${parametres.nom}`,
        [`${parametres.objectif} points, difficulté ${parametres.difficulte}, période ${parametres.periodiciteSecondes} s ; ${parametres.participants.join(', ')}.`]);
}
export function periodeDeTache(d: DonneesDeVoyage, tacheId: string, resultats: ResultatDeTache[], id: string, attente = false) {
    const c = lireTaches(d), t = c.taches.find(t => t.id === tacheId);
    if (!t || ['reussie','echouee'].includes(t.etat) || !attente && t.etat !== 'active') throw new Error('Reprendre une tâche active avant de contribuer.');
    if (attente ? resultats.length !== 0 : resultats.length !== t.participants.length
        || new Set(resultats.map(r => r.participant)).size !== t.participants.length
        || resultats.some(r => !t.participants.includes(r.participant) || r.degre !== 'absent' && !Object.hasOwn(POINTS_DE_TACHE,r.degre)
            || r.degre === 'absent' && r.jetId)) throw new Error('Un résultat ou une absence est requis pour chaque participant de cette période.');
    const jets = resultats.flatMap(r => r.jetId ? [r.jetId] : []);
    if (jets.some(j => c.jetsUtilises.includes(j)) || new Set(jets).size !== jets.length) throw new Error('Ce jet a déjà contribué à un ouvrage.');
    if (c.jetsUtilises.length + jets.length > 10000) throw new Error('Limite des jets conservés atteinte ; aucun identifiant n’est effacé.');
    c.jetsUtilises.push(...jets);
    const gain = resultats.reduce((n,r) => n+pointsDuResultat(r),0);
    t.points += gain;t.malus -= resultats.filter(r => r.degre === 'echec-total').length;t.periodes++;
    if (t.seuilNegatif !== null && t.points <= t.seuilNegatif) t.etat = 'echouee';
    else if (t.points >= t.objectif) t.etat = 'reussie';
    else if (t.limiteSecondes !== null && (t.periodes+1)*t.periodiciteSecondes > t.limiteSecondes) t.etat = 'echouee';
    lireTaches({__rddTaches231:c});
    return operationDeVoyageur(d,id,{__rddTaches231:c},`${t.nom} — période ${t.periodes}`,
        [...resultats.map(r => `${r.participant} : ${r.degre === 'absent' ? 'ne participe pas à cette période' : r.degre}, ${pointsDuResultat(r)} point(s).`),
            `${attente ? 'Attente sans travail' : `Gain ${gain}`} ; fonds ${t.points}/${t.objectif}, difficulté suivante ${t.difficulte+t.malus}, temps ${t.periodes*t.periodiciteSecondes} s ; ${t.etat}.`]);
}
export function suspendreTache(d: DonneesDeVoyage, tacheId: string, id: string, abandon = false) {
    const c = lireTaches(d), t = c.taches.find(t => t.id === tacheId);
    if (!t || !['active','pause'].includes(t.etat)) throw new Error('Cet ouvrage est terminé.');
    t.etat = abandon ? 'echouee' : t.etat === 'active' ? 'pause' : 'active';
    return operationDeVoyageur(d,id,{__rddTaches231:c},`${t.nom} — ${t.etat}`,
        [abandon ? 'Ouvrage déclaré perdu par le gardien.' : 'Le passage du temps reste explicite ; la pause n’efface ni points ni malus.']);
}
