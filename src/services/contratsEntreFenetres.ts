import type { EtatsDuHub } from '../utils/magasinsDuHub';
import type { CarteDuHub, TableauDuHub, CombatDuHub, HorlogesDuHub } from '../modules/remote/types/donneesDuHub';
import { lireChamps, lireDonneesDuHub, reglesCarteDuHub, type Regles } from '../modules/remote/lectureDuHub';
import type { WindowMessage } from './windowTransport';

/** Les données locales de carte incluent météo, effets et moniteur de projection. */
export type CarteEntreFenetres = CarteDuHub & Partial<Pick<EtatsDuHub['useMapStore'],
    'ecranDeLaCarte' | 'tokens' | 'pings' | 'projectedWeatherType' | 'projectedWeatherIntensity'
    | 'projectedTimeOfDay' | 'projectedMagicEffects' | 'projectedDangerZones'
>>;

interface ChargesEntreFenetres {
    map: CarteEntreFenetres;
    whiteboard: TableauDuHub;
    combat: CombatDuHub;
    clock: HorlogesDuHub;
    'map:lock': { tokenId: string };
    'map:unlock': { tokenId: string };
    'hub:ready': undefined;
}
export type TypeEntreFenetres = keyof ChargesEntreFenetres;
export type MessageEntreFenetres = {
    [Type in TypeEntreFenetres]: { type: Type; senderId: string } & (
        Type extends 'hub:ready' ? { payload?: undefined } : { payload: ChargesEntreFenetres[Type] }
    )
}[TypeEntreFenetres];
export type MiseAJourEntreFenetres = Extract<MessageEntreFenetres, { type: 'map' | 'whiteboard' | 'combat' | 'clock' }>;
/** Une union de tuples garde la relation entre le nom et sa charge à l'émission. */
export type DiffusionEntreFenetres = {
    [Type in TypeEntreFenetres]: Type extends 'hub:ready'
        ? [type: Type, payload?: undefined] : [type: Type, payload: ChargesEntreFenetres[Type]]
}[TypeEntreFenetres];

const objet = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const nombre = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const choix = (...valeurs: string[]) => (v: unknown) => typeof v === 'string' && valeurs.includes(v);
const effets = (v: unknown) => Array.isArray(v) && v.every(e => objet(e) && typeof e.id === 'string'
    && nombre(e.x) && nombre(e.y) && nombre(e.width) && nombre(e.height) && nombre(e.rotation));

const reglesCarte: Regles<CarteEntreFenetres> = {
    ...reglesCarteDuHub,
    ecranDeLaCarte: v => v === null || typeof v === 'string',
    tokens: reglesCarteDuHub.projectedTokens, pings: reglesCarteDuHub.projectedPings,
    projectedWeatherType: choix('none', 'rain', 'snow', 'smoke'),
    projectedWeatherIntensity: nombre,
    projectedTimeOfDay: choix('dawn', 'day', 'overcast', 'dusk', 'night'),
    projectedMagicEffects: effets, projectedDangerZones: effets,
};

/**
 * Le transport fournit une enveloppe ; le service n'accepte que ses sept flux.
 * La relecture des données est commune au Hub. Elle conserve les absences des
 * diffs et écarte les méthodes ; elle n'est pas un schéma d'import de campagne.
 */
export function lireMessageEntreFenetres(message: WindowMessage): MessageEntreFenetres | null {
    const { type, senderId, payload } = message;
    switch (type) {
        case 'hub:ready':
            return payload === undefined ? { type, senderId } : null;
        case 'map:lock':
        case 'map:unlock':
            return objet(payload) && typeof payload.tokenId === 'string'
                ? { type, senderId, payload: { tokenId: payload.tokenId } } : null;
        case 'map': {
            const lu = lireChamps(payload, reglesCarte);
            return lu ? { type, senderId, payload: lu } : null;
        }
        case 'whiteboard': {
            const lu = lireDonneesDuHub({ whiteboard: payload })?.whiteboard;
            return lu ? { type, senderId, payload: lu } : null;
        }
        case 'combat': {
            const lu = lireDonneesDuHub({ combat: payload })?.combat;
            return lu ? { type, senderId, payload: lu } : null;
        }
        case 'clock': {
            const lu = lireDonneesDuHub({ clock: payload })?.clock;
            return lu ? { type, senderId, payload: lu } : null;
        }
        default: return null;
    }
}
