import { identifiantDeTable, objetSimple } from '../../src/modules/modulesDuJeu/protocole';
import type { RequeteDeModule } from '../../src/modules/modulesDuJeu/protocole';

/**
 * **Les gestes que la tablette du meneur envoie par le réseau** — 07/11/2026, plan
 * `documentation/Planning/2026-11-07-modules-du-jeu-tablette-du-meneur.md`, T1.
 *
 * Au poste, ces demandes arrivent par l'IPC de la fenêtre principale, que personne d'autre ne
 * peut appeler. Par la WebSocket, elles viennent d'un appareil : on ne garde que les champs
 * attendus, au bon type, avant que le service ne les vérifie à son tour (contexte, personnages,
 * manifeste). Une clé de trop suffit à refuser — *une charge qu'on « nettoie » finit par laisser
 * passer ce qu'on n'avait pas prévu.*
 */
export type DemandeDuMeneur =
    | { type: 'commander'; requete: RequeteDeModule }
    | { type: 'autoriser'; demande: { campagneId: string; moduleId: string; personnages: string[]; contexte: number } }
    | { type: 'tout-couper'; demande: { campagneId: string; contexte: number } }
    | { type: 'diffusion'; demande: { campagneId: string; moduleId: string; appareilId: string; contexte: number } };

const MODULE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const seulement = (charge: Record<string, unknown>, cles: string[]) => Object.keys(charge).every(k => cles.includes(k));
const contexteValide = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const moduleValide = (v: unknown): v is string => typeof v === 'string' && v.length <= 80 && MODULE.test(v);

export function demandeDuMeneur(type: string, charge: Record<string, unknown>): DemandeDuMeneur | null {
    const { campagneId, contexte } = charge;
    if (!identifiantDeTable(campagneId) || !contexteValide(contexte)) return null;
    switch (type) {
        case 'modules:mj:commander': {
            const { moduleId, commande, requeteId } = charge;
            if (!seulement(charge, ['requeteId', 'campagneId', 'moduleId', 'contexte', 'commande']) || !moduleValide(moduleId)
                || !objetSimple(commande) || typeof commande.id !== 'string' || !seulement(commande, ['id', 'charge'])) return null;
            return { type: 'commander', requete: { requeteId: String(requeteId), campagneId, moduleId, contexte, commande: { id: commande.id, charge: commande.charge } } };
        }
        case 'modules:mj:autoriser': {
            const { moduleId, personnages } = charge;
            if (!seulement(charge, ['requeteId', 'campagneId', 'moduleId', 'contexte', 'personnages']) || !moduleValide(moduleId)
                || !Array.isArray(personnages) || personnages.length > 256 || !personnages.every(identifiantDeTable)) return null;
            return { type: 'autoriser', demande: { campagneId, moduleId, contexte, personnages: [...personnages] } };
        }
        case 'modules:mj:tout-couper':
            if (!seulement(charge, ['requeteId', 'campagneId', 'contexte'])) return null;
            return { type: 'tout-couper', demande: { campagneId, contexte } };
        case 'modules:mj:diffusion': {
            const { moduleId, appareilId } = charge;
            if (!seulement(charge, ['requeteId', 'campagneId', 'moduleId', 'contexte', 'appareilId']) || !moduleValide(moduleId) || !identifiantDeTable(appareilId)) return null;
            return { type: 'diffusion', demande: { campagneId, moduleId, contexte, appareilId } };
        }
        default:
            return null;
    }
}
