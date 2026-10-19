import type { AstrologieVoyageur } from './astrologieDuVoyageur';

/** Projection par socket avant sérialisation ; le carnet d'un autre PJ ne voyage pas. */
export function astrologiePourLeJoueur(a:AstrologieVoyageur,personnage:string|null):AstrologieVoyageur {
    return {version:1,origine:a.origine,predictions:personnage && a.predictions?.[personnage]
        ? {[personnage]:structuredClone(a.predictions[personnage])} : {}};
}
export function filtrerAstrologieDistante<T>(charge:T,personnage:string|null):T {
    if (!charge || typeof charge !== 'object') return charge;
    const c = charge as {session?:{campaigns?:{rddAstrologie?:AstrologieVoyageur}[]}};
    if (!Array.isArray(c.session?.campaigns)) return charge;
    return {...c,session:{...c.session,campaigns:c.session.campaigns.map(campagne=>campagne.rddAstrologie
        ? {...campagne,rddAstrologie:astrologiePourLeJoueur(campagne.rddAstrologie,personnage)} : campagne)}} as T;
}
