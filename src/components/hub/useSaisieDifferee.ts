import { useEffect, useRef, useState } from 'react';

/**
 * **Une saisie de la tablette, envoyée après une pause de frappe** — Nephilim,
 * 2026-10-18 (les Incarnations et les Vécus, saisis dans la vue synthétique).
 *
 * Chaque lettre ne part pas au meneur : une écriture réseau par frappe
 * inonderait la table. La valeur reste en **brouillon** sur la tablette, part
 * après `delai` sans frappe — ou tout de suite à la fermeture —, et le brouillon
 * s'efface dès que la fiche revenue du meneur porte la même valeur : c'est elle
 * qui fait foi.
 *
 * @param envoyer    ce qui écrit une valeur sur la fiche, chez le meneur
 * @param enregistre la fiche telle que le meneur l'a renvoyée
 */
export function useSaisieDifferee(
    envoyer: (champ: string, valeur: string) => void,
    enregistre: Record<string, unknown> | undefined,
    delai = 700,
) {
    const [brouillons, setBrouillons] = useState<Record<string, string>>({});
    const enAttente = useRef<Record<string, string>>({});
    const minuteurs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    // La dernière fonction d'envoi : la fermeture envoie avec elle, pas avec celle du premier rendu.
    const envoi = useRef(envoyer);
    envoi.current = envoyer;

    const partir = (champ: string) => {
        if (!(champ in enAttente.current)) return;
        const valeur = enAttente.current[champ];
        delete enAttente.current[champ];
        envoi.current(champ, valeur);
    };

    const saisir = (champ: string, valeur: string) => {
        setBrouillons(b => ({ ...b, [champ]: valeur }));
        enAttente.current[champ] = valeur;
        clearTimeout(minuteurs.current[champ]);
        minuteurs.current[champ] = setTimeout(() => partir(champ), delai);
    };

    // À la fermeture, ce qui attend part tout de suite.
    useEffect(() => () => {
        Object.values(minuteurs.current).forEach(clearTimeout);
        Object.keys(enAttente.current).forEach(partir);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // La fiche du meneur porte la valeur : le brouillon n'a plus lieu d'être.
    useEffect(() => {
        setBrouillons(b => {
            const restants = Object.entries(b).filter(([champ, v]) => enregistre?.[champ] !== v || champ in enAttente.current);
            return restants.length === Object.keys(b).length ? b : Object.fromEntries(restants);
        });
    }, [enregistre]);

    return { brouillons, saisir };
}
