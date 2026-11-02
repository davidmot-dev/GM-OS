import { useCallback, useEffect, useMemo, useState } from 'react';
import { cheminDesSupplements, type Corpus } from '../../../../electron/corpusSysteme';
import { ajouterUnSupplement, lireLesSupplements, type SupplementDeclare } from './supplements';

/**
 * Les suppléments déclarés pour un jeu, lus sur le disque, et le geste qui en
 * déclare un nouveau — § 185 du registre.
 *
 * Sorti de l'atelier le 01/11/2026 : le choix du livre y vivait, dans une
 * surcouche qui ne s'ouvre qu'après « Analyser les sources ». David ne le
 * voyait pas (*« je ne vois pas "livre documenté" »*), et le clic lançait
 * l'inventaire du livre de base avant qu'il ait pu choisir. Le choix se fait
 * désormais dans le panneau de gauche, sous le corpus visé.
 *
 * **On dépend du chemin, pas du corpus** : le tableau de bord recompose son
 * corpus à chaque rendu, et en dépendre relirait le fichier en boucle.
 */
export function useSupplementsDuJeu(corpusDuJeu: Corpus | null) {
  const chemin = corpusDuJeu ? cheminDesSupplements(corpusDuJeu) : null;
  // La liste lue est rangée avec le chemin d'où elle vient : changer de jeu
  // la rend caduque sans qu'un effet ait à la vider.
  const [lu, setLu] = useState<{ chemin: string; liste: SupplementDeclare[] } | null>(null);
  const supplements = useMemo(() => (lu && lu.chemin === chemin ? lu.liste : []), [lu, chemin]);

  useEffect(() => {
    if (!chemin) return;
    let annule = false;
    void (async () => {
      const brut = await window.appBridge?.ai?.readDoc?.(chemin).catch(() => null);
      if (!annule) setLu({ chemin, liste: lireLesSupplements(brut) });
    })();
    return () => { annule = true; };
  }, [chemin]);

  /** Rend le supplément déclaré, ou `null` si le titre est vide ou l'écriture a échoué. */
  const declarer = useCallback(async (titre: string): Promise<SupplementDeclare | null> => {
    if (!chemin) return null;
    const { liste, supplement } = ajouterUnSupplement(supplements, titre);
    if (!supplement) return null;
    if (liste.length !== supplements.length) {
      const ecrit = await window.appBridge?.ai?.writeDoc?.(chemin, JSON.stringify(liste, null, 2));
      if (!ecrit) return null;
      setLu({ chemin, liste });
    }
    return supplement;
  }, [chemin, supplements]);

  return { supplements, declarer };
}
