import { create } from 'zustand';
import { consignerLeJet, type JetAConsigner } from '../journal/consignerLeJet';
import type { RollRecord } from '../../stores/useDiceStore';

/**
 * **Les jets cachés — ce que seul le meneur voit** (plan
 * `documentation/Planning/2026-11-11-jets-demandes-et-caches.md`, T5, C7 et C8).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI UN MAGASIN À PART, ET PAS UN DRAPEAU DANS `useDiceStore`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Tout jet posé par `setLastRoll` part à la table, par trois chemins :
 *
 * 1. `lastRoll` est envoyé aux tablettes et au Player Hub par `segmentDesDes` ;
 * 2. `useDiceStore` est persisté **en entier** sous `gmos-dice-storage`, dans le
 *    `localStorage` que partagent le meneur, le Hub et le projecteur (même
 *    origine) ;
 * 3. le magasin est exposé au Hub (`exposerMagasinDuHub`).
 *
 * Un drapeau « caché » sur le jet aurait obligé chacun de ces lecteurs, et ceux
 * qui viendront, à s'en souvenir. *Un secret caviardé à l'affichage est déjà
 * déposé sur l'appareil* (audit du 22/10). Le jet caché ne touche donc **jamais**
 * `useDiceStore` : il vit ici, **en mémoire de la fenêtre du meneur**, sans
 * persistance ni exposition, et disparaît à la fermeture de GM-OS.
 *
 * Ce qui en reste après la séance est **la ligne du journal**, marquée
 * (`consignerLeJet` avec `cache`) : le journal ne part vers aucune tablette, et
 * la marque le garde hors du récit que résume l'IA.
 *
 * Deux portes, une liste : le pupitre de dés (`garderLeJetCache`, un lancer
 * entier, dont le titre porte déjà la formule) et le panneau de fiche du
 * meneur (`consignerUnJetCache`, ce qu'il consigne déjà). Le pupitre montre
 * les deux (T7).
 */

/** Combien de jets cachés le pupitre garde sous la main — le journal garde le reste. */
export const JETS_CACHES_GARDES = 20;

/** Ce que le pupitre montre d'un jet caché — jamais le lancer entier. */
export interface JetCache extends JetAConsigner {
    id: string;
    timestamp: number;
}

interface EtatDesJetsCaches {
    /** Du plus récent au plus ancien. */
    jets: JetCache[];
    vider: () => void;
}

export const useJetsCachesStore = create<EtatDesJetsCaches>()((set) => ({
    jets: [],
    vider: () => set({ jets: [] }),
}));

/**
 * Consigne un jet caché : au journal, marqué, et à la liste du pupitre —
 * **nulle part ailleurs**. La porte du panneau de fiche du meneur.
 */
export function consignerUnJetCache(jet: JetAConsigner): void {
    consignerLeJet({ ...jet, cache: true });
    const garde: JetCache = {
        titre: jet.titre,
        totalDisplay: jet.totalDisplay,
        degre: jet.degre,
        tagSuccess: jet.tagSuccess,
        seuil: jet.seuil,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };
    useJetsCachesStore.setState(etat => ({
        jets: [garde, ...etat.jets].slice(0, JETS_CACHES_GARDES),
    }));
}

/**
 * Lance en caché depuis le pupitre de dés.
 *
 * Remplace `useDiceStore.getState().setLastRoll(jet)` pour un jet caché ; ne
 * l'appelle jamais, ni avant ni après.
 */
export function garderLeJetCache(jet: RollRecord, seuil?: number): void {
    consignerUnJetCache({
        titre: jet.title,
        totalDisplay: jet.totalDisplay,
        degre: jet.degre,
        tagSuccess: jet.tagSuccess,
        seuil,
    });
}
