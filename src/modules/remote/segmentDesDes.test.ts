import { describe, it, expect } from 'vitest';
import { segmentDesDes } from './segmentDesDes';
import SYNCHRONISEUR from './hooks/useNexusSynchronizer.ts?raw';
import type { RemoteSyncData } from './types/remote.types';

/**
 * **Le meneur envoie le pupitre de dés en entier.**
 *
 * ⛔ Défaut trouvé par David à l'écran le 2026-09-17 : *« je ne vois aucune
 * différence entre résine / verre / métal »*. Il avait raison, et ce n'était pas
 * une affaire de matériau — **le Player Hub n'a jamais reçu le réglage.** Le
 * segment portait trois champs sur cinq, et il était écrit **deux fois** dans le
 * synchroniseur.
 *
 * ⚠️ **`enable3D` était dans ce cas depuis toujours** : la case « Rendu 3D » du
 * pupitre ne faisait rien sur un hub déjà ouvert. *Le choix de matière n'a pas
 * créé le défaut, il l'a rendu visible.*
 *
 * ⭐ **La vraie garde est le type de retour** — retirer un champ de la fonction
 * fait échouer `tsc -b`. Ces essais ne gardent que ce que le type ne peut pas
 * dire : que les valeurs sont **recopiées**, et que **personne ne reconstruit le
 * segment à côté.**
 */

const MAGASIN: NonNullable<RemoteSyncData['dice']> = {
    lastRoll: { id: 'r1', title: 'Attaque', totalDisplay: '17', rolls: [], total: 17 } as never,
    isDiceProjected: true,
    projectionTrigger: 7,
    enable3D: true,
    styleDesDes: 'metal',
};

describe('le segment des dés', () => {
    it('porte les cinq champs déclarés', () => {
        expect(Object.keys(segmentDesDes(MAGASIN)).sort()).toEqual([
            'enable3D', 'isDiceProjected', 'lastRoll', 'projectionTrigger', 'styleDesDes',
        ]);
    });

    it('recopie les deux champs qui manquaient — le rendu 3D et la matière', () => {
        const segment = segmentDesDes(MAGASIN);

        expect(segment.enable3D).toBe(true);
        expect(segment.styleDesDes).toBe('metal');
    });

    it('ne change rien à ce qui passait déjà', () => {
        const segment = segmentDesDes(MAGASIN);

        expect(segment.lastRoll).toBe(MAGASIN.lastRoll);
        expect(segment.isDiceProjected).toBe(true);
        expect(segment.projectionTrigger).toBe(7);
    });

    it('supporte un pupitre qui n’a encore rien lancé', () => {
        const vierge: NonNullable<RemoteSyncData['dice']> = {
            lastRoll: null, isDiceProjected: false, projectionTrigger: 0,
            enable3D: false, styleDesDes: 'resine',
        };

        expect(segmentDesDes(vierge)).toEqual(vierge);
    });
});

/**
 * ⭐ **La garde qui vise la vraie cause : le segment était écrit DEUX FOIS.**
 *
 * Le synchroniseur a deux chemins — l'envoi rapide d'un seul segment, et l'envoi
 * complet. Chacun construisait son propre littéral. *Une seconde déclaration de
 * la même vérité dérive toujours*, et ce dépôt l'a payé cinq fois le 2026-08-24.
 *
 * ⚠️ Le type ne peut rien pour ça : un littéral anonyme affecté à
 * `Record<string, unknown>` n'oblige à rien. **Seul un essai qui lit la source
 * peut voir qu'on a recommencé à côté.**
 */
describe('personne ne reconstruit le segment des dés à côté', () => {
    it('les deux chemins du synchroniseur passent par la même fonction', () => {
        const appels = SYNCHRONISEUR.match(/segmentDesDes\(/g) ?? [];
        expect(appels).toHaveLength(2);
    });

    it('aucun littéral n’assemble un segment de dés à la main', () => {
        /* Un `lastRoll:` suivi d'autre chose que l'appel à la fonction serait un
           segment reconstruit — c'est exactement ce qui existait avant. */
        const litteraux = SYNCHRONISEUR.match(/dice[^\n]*lastRoll:\s*\w/g) ?? [];
        expect(litteraux).toEqual([]);
    });
});
