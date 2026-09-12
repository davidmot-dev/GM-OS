import { create } from 'zustand';
import type { RapportDeDemarrage, ResultatDEtape } from './logic/etapesDuDemarrage';

/**
 * **Ce que le démarrage est en train de faire — pour que l'écran d'attente le dise.**
 *
 * ⛔ **Sa seule raison d'être.** L'écran `GM-OS BOOTING...` d'[App.tsx] est le
 * vrai écran bloqué du 2026-09-12, et il n'affichait **rien d'autre que ces
 * trois mots**. Un meneur devant lui n'avait aucun moyen de savoir si le
 * système travaillait ou s'il avait renoncé — et moi non plus, le lendemain,
 * quand il a fallu diagnostiquer.
 *
 * ⚠️ **Jamais persisté, et ce n'est pas un oubli** : un rapport de démarrage ne
 * décrit qu'un lancement. Rendu au suivant, il parlerait d'une panne éteinte.
 */
interface EtatDuDemarrage {
    /** Le nom de l'étape en cours, ou `null` — avant le début comme après la fin. */
    etapeEnCours: string | null;
    /** Ce qui est déjà tranché, dans l'ordre. */
    rendus: readonly ResultatDEtape[];
    /** Le bilan, une fois le démarrage terminé. */
    rapport: RapportDeDemarrage | null;

    avancer: (etapeEnCours: string | null, rendus: readonly ResultatDEtape[]) => void;
    conclure: (rapport: RapportDeDemarrage) => void;
}

export const useDemarrageStore = create<EtatDuDemarrage>((set) => ({
    etapeEnCours: null,
    rendus: [],
    rapport: null,

    avancer: (etapeEnCours, rendus) => set({ etapeEnCours, rendus }),
    conclure: (rapport) => set({ rapport, etapeEnCours: null, rendus: rapport.etapes }),
}));
