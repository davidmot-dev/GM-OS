import { useCallback, useEffect, useMemo, useState } from 'react';
import { cheminDesLivres, type Corpus } from '../../../../electron/corpusSysteme';
import { ecrireLesLivres, lireLesLivres, type LivreDuJeu } from './livres';
import { useCorpusDuPilote, type PiloteAResoudre } from '../corpus/useCorpusDuPilote';
import type { RegistreDesLivres } from './components/LivreALaPage';

/**
 * Le registre des livres d'un jeu (`docs/systems/<jeu>/livres.json`), lu sur le disque, et le geste
 * qui l'écrit — « Les chemins des livres », étape B (06/11/2026). Même forme que
 * `useSupplementsDuJeu` : on dépend du chemin, pas du corpus, que le tableau de bord recompose à
 * chaque rendu.
 */
export function useLivresDuJeu(corpusDuJeu: Corpus | null) {
    const chemin = corpusDuJeu ? cheminDesLivres(corpusDuJeu) : null;
    const [lu, setLu] = useState<{ chemin: string; livres: LivreDuJeu[] } | null>(null);
    const livres = useMemo(() => (lu && lu.chemin === chemin ? lu.livres : []), [lu, chemin]);

    useEffect(() => {
        if (!chemin) return;
        let annule = false;
        void (async () => {
            const brut = await window.appBridge?.ai?.readDoc?.(chemin).catch(() => null);
            if (!annule) setLu({ chemin, livres: lireLesLivres(brut) });
        })();
        return () => { annule = true; };
    }, [chemin]);

    /** Écrit le registre entier ; rend `false` si l'écriture a échoué (rien n'a changé alors). */
    const ecrire = useCallback(async (suivants: LivreDuJeu[]): Promise<boolean> => {
        if (!chemin) return false;
        const ecrit = await window.appBridge?.ai?.writeDoc?.(chemin, ecrireLesLivres(suivants));
        if (!ecrit) return false;
        setLu({ chemin, livres: suivants });
        return true;
    }, [chemin]);

    /** La racine du jeu (`systems/alien`), que l'ouverture à la page (étape C) envoie. */
    const racine = chemin ? chemin.replace(/\/livres\.json$/, '') : null;
    return { livres, ecrire, chemin, racine };
}

/**
 * Le registre des livres du jeu d'un pilote, pour les boutons « Livre, p. N » (étape D) : le corpus
 * résolu comme partout (`useCorpusDuPilote`), puis son `livres.json`.
 */
export function useLivresDuPilote(pilote: PiloteAResoudre | null | undefined): RegistreDesLivres {
    const { corpus } = useCorpusDuPilote(pilote);
    const { livres, racine } = useLivresDuJeu(corpus);
    return useMemo(() => ({ racine, livres }), [racine, livres]);
}
