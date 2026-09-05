import { useObsidianStore } from '../../session/useObsidianStore';
import type { ActionRegistry } from './types';

/**
 * **Le coffre Obsidian sur la tablette du meneur — question, puis réponse.**
 *
 * Demandé par David le 2026-09-05 : *« est-ce que dans les notes, je pourrais
 * avoir accès à la partie Obsidian ? »*.
 *
 * ⛔ **Le coffre ne peut pas voyager dans la diffusion périodique.** Il contient
 * plus de deux mille notes (mesuré le 2026-08-29) et la diffusion part jusqu'à
 * deux fois par seconde. Le dépôt refuse déjà d'y mettre l'historique des
 * messages pour cette raison exacte : *l'historique complet grossirait la charge
 * à chaque diffusion.*
 *
 * D'où un aller-retour : la tablette **demande**, le meneur **répond**. Rien ne
 * circule tant qu'on ne touche à rien, et le contenu d'une note ne part que
 * quand on l'ouvre.
 *
 * ⚠️ **La réponse ne part qu'aux tablettes de meneur** (`'remote'`). Le coffre
 * est le carnet privé du meneur : le diffuser à tous le déposerait sur
 * l'appareil de chaque joueur. *C'est la règle de `mainsPourLaTable` — un secret
 * caviardé à l'affichage a déjà voyagé.*
 */

/** Ce que la tablette reçoit en retour. Les deux formes, nommées ici. */
export type ReponseObsidian =
    | { type: 'obsidian:arbre'; payload: { notes: unknown[] } }
    | { type: 'obsidian:note'; payload: { chemin: string; contenu: string | null; erreur?: string } };

/** Répond à la tablette, et à elle seule. */
function repondre(reponse: ReponseObsidian): void {
    window.appBridge?.remote?.broadcastUIAction?.(reponse, 'remote');
}

/**
 * L'arborescence du coffre — **noms et chemins, jamais les contenus**.
 *
 * On rafraîchit avant de répondre : le meneur a pu ajouter des notes depuis
 * qu'il a ouvert GM-OS, et servir un arbre périmé est le genre de faute qui se
 * découvre en cherchant une note qu'on vient d'écrire.
 */
const listerLeCoffre = async () => {
    const magasin = useObsidianStore.getState();
    try {
        await magasin.fetchNotes();
    } catch (err) {
        console.warn('[Obsidian] Rafraîchissement impossible, on répond avec ce qu’on a', err);
    }
    repondre({ type: 'obsidian:arbre', payload: { notes: useObsidianStore.getState().notes } });
};

/**
 * Le contenu d'**une** note.
 *
 * ⚠️ Le chemin arrive du réseau. `selectNote` passe par le pont, qui le résout **sous le coffre** côté
 * Electron, et c'est cette résolution qui fait foi : *croire un chemin sur
 * parole laisserait lire n'importe quel fichier de la machine.* On ne le
 * réécrit donc pas ici, on le passe tel quel au pont qui sait le borner.
 */
const lireUneNote = async (payload: unknown) => {
    const chemin = (payload as { chemin?: string })?.chemin;
    if (!chemin) return;

    try {
        await useObsidianStore.getState().selectNote(chemin);
        repondre({
            type: 'obsidian:note',
            payload: { chemin, contenu: useObsidianStore.getState().activeNoteContent },
        });
    } catch (err) {
        console.warn('[Obsidian] Lecture impossible :', chemin, err);
        repondre({
            type: 'obsidian:note',
            payload: { chemin, contenu: null, erreur: 'Note illisible.' },
        });
    }
};

export const obsidianActions: ActionRegistry = {
    'remote:obsidian:lister': listerLeCoffre,
    'remote:obsidian:lire': lireUneNote,
};
