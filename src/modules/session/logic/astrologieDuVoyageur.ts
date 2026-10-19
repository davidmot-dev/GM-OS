import { HEURES_DRACONIQUES } from './ficheDeVoyageur';
import { entierVoyageur as entier } from './moralDuVoyageur';
import { bandesDuJet } from '../../dice/systemes/revesDeDragons';
import { degreDuDe, estUneReussite } from '../../dice/degresDeReussite';
import { etatDuVoyageur } from './fatigueDuVoyageur';

/** Livre 2.3.1 p. 78, 155–157. Le repère Clock-OS est déclaré par le MJ, jamais deviné. */
export interface AstrologieVoyageur {
    version:1; origine:number;
    nombres?:Record<string,number>;
    observations?:{id:string;personnage:string;nuit:number;jour:number;de:number;ajustement:number;xp:number;instant:number}[];
    predictions:Record<string,{jour:number;nombre:number}[]>;
}
export function lireAstrologie(a:AstrologieVoyageur): AstrologieVoyageur {
    if (!a || a.version !== 1 || !Number.isSafeInteger(a.origine) || Math.abs(a.origine) > 8640000000000000
        || !a.predictions || typeof a.predictions !== 'object' || Array.isArray(a.predictions)) throw new Error('Calendrier astrologique invalide.');
    if (a.nombres) for (const [jour,nombre] of Object.entries(a.nombres)) {entier(jour,-1000000);entier(nombre,1,12);}
    for (const liste of Object.values(a.predictions)) {
        if (!Array.isArray(liste) || liste.length > 10000) throw new Error('Carnet astrologique invalide.');
        for (const p of liste) {entier(p.jour,-1000000);entier(p.nombre,1,12);}
    }
    if (a.observations !== undefined && (!Array.isArray(a.observations) || a.observations.length > 10000)) throw new Error('Historique astrologique invalide.');
    return structuredClone(a);
}
export function momentDraconique(origine:number,instant:number) {
    if (!Number.isSafeInteger(origine) || !Number.isSafeInteger(instant)) throw new Error('Date Clock-OS invalide.');
    const jour = Math.floor((instant-origine)/86400000);
    const heure = Math.floor(((instant-origine)%86400000+86400000)%86400000/7200000)+1;
    return {jour,heure,nom:HEURES_DRACONIQUES[heure-1]};
}
export function signeVoyageur(valeur:unknown):number {
    const i = HEURES_DRACONIQUES.indexOf(String(valeur));
    if (i < 0) throw new Error('Renseigner une heure de naissance reconnue.');
    return i+1;
}
export function ajustementAstral(signe:number,nombre:number,heure:number):number {
    [signe,nombre,heure].forEach(n=>entier(n,1,12));
    const favorable = (signe+nombre-1)%12+1, distance = (heure-favorable+12)%12;
    return distance === 0 ? 4 : [4,8].includes(distance) ? 2 : distance === 6 ? -4 : [3,9].includes(distance) ? -2 : 0;
}
export function bonusAstralReel(a:AstrologieVoyageur,instant:number,signe:unknown):number {
    const m = momentDraconique(a.origine,instant), n = a.nombres?.[m.jour];
    if (n === undefined) throw new Error('Le MJ doit définir le nombre astral réel du jour avant ce jet.');
    return ajustementAstral(signeVoyageur(signe),n,m.heure);
}
export function fixerNombreAstral(a:AstrologieVoyageur,jour:number,nombre:number):AstrologieVoyageur {
    const r = lireAstrologie(a);entier(jour,-1000000);entier(nombre,1,12);
    if (!r.nombres || !r.observations) throw new Error('Accès MJ au calendrier requis.');
    if (r.nombres[jour] !== undefined && r.nombres[jour] !== nombre) throw new Error('Ce nombre est déjà fixé : ne pas modifier rétroactivement les prédictions.');
    r.nombres[jour] = nombre;return r;
}
export function observerAstres(a:AstrologieVoyageur,instant:number,personnage:string,d:Record<string,unknown>,
    jour:number,visibilite:number,de:number,fauxNombre:number,id:string) {
    const r = lireAstrologie(a), m = momentDraconique(r.origine,instant);
    if (!r.nombres || !r.observations) throw new Error('Observation réservée au MJ.');
    entier(jour,m.jour);entier(visibilite,-100,0);entier(de,1,100);entier(fauxNombre,1,12);
    if (m.heure < 8) throw new Error('Les étoiles se lisent du Serpent au Château Dormant, avec un ciel visible.');
    if (r.observations.some(o=>o.personnage === personnage && o.nuit === m.jour && o.jour === jour)) throw new Error('Ce jour a déjà été observé cette nuit pour ce personnage.');
    if (r.observations.length >= 10000) throw new Error('Limite des observations atteinte ; aucune preuve n’est effacée.');
    if (r.observations.some(o=>o.personnage===personnage && Math.abs(instant-o.instant)<1200000)) throw new Error('Vingt minutes doivent séparer deux observations : avancer le temps de jeu.');
    const vrai = r.nombres[jour];if (vrai === undefined) throw new Error('Fixer d’abord le nombre astral réel du jour visé.');
    const ajustement = entier(d.astrologie,-11,1000)+visibilite-Math.floor((jour-m.jour)/2)+etatDuVoyageur(d).total;
    const degre = degreDuDe(de,bandesDuJet(entier(d.intellect,1),ajustement));
    const succes = estUneReussite(degre);
    if (!succes && fauxNombre === vrai) throw new Error('En cas d’échec, communiquer un nombre différent du vrai.');
    const annonce = succes ? vrai : fauxNombre;
    // Jamais de degré, de booléen correct/incorrect ni de points d'XP secrets dans la prédiction.
    r.predictions[personnage] = [...(r.predictions[personnage] ?? []),{jour,nombre:annonce}];
    r.observations.push({id,personnage,nuit:m.jour,jour,de,ajustement,xp:degre === 'reussite-particuliere' && ajustement < 0 ? -ajustement : 0,instant});
    return {astrologie:r,annonce,degre,ajustement};
}

