import React from 'react';
import { useTranslation } from 'react-i18next';
import { cleI18nDuDegre, degreOuBooleen, estUneReussite } from './degresDeReussite';
import type { RollResult } from './DiceEngine';

/**
 * Le verdict d'un jet, écrit **au même endroit pour tous les écrans**.
 *
 * **Le défaut qu'elle supprime.** Quatre écrans annonçaient le même jet, et
 * aucun ne disait la même chose : « Réussite » en dur sur la tablette des
 * joueurs, « Succès » en dur sur l'incrustation de résultat, deux clés i18n
 * ailleurs. Un booléen n'ayant que deux valeurs, l'écart restait discret — *six
 * degrés l'auraient rendu criant le jour même* : le meneur lisant « Réussite
 * significative » pendant que la table lit « Succès ».
 *
 * **Ce qu'elle décide, et ce qu'elle laisse.** Elle décide du **mot** et du
 * **verdict** — réussite ou échec. Elle ne décide rien de l'allure : chaque
 * écran passe ses propres classes, parce qu'une pastille de pupitre et une
 * bannière de tablette n'ont pas à se ressembler.
 *
 * **Elle ne s'affiche pas quand il n'y a rien à dire.** Une somme ordinaire —
 * 2d6 de dégâts — n'est ni réussie ni ratée, et inventer un verdict pour elle
 * serait pire que de n'en montrer aucun.
 */
export const EtiquetteDuDegre: React.FC<{
    resultat: Pick<RollResult, 'degre' | 'tagSuccess'>;
    /** Les classes de l'étiquette, selon que le jet est réussi ou non. */
    classes: (reussi: boolean) => string;
    /** Enveloppe facultative — la tablette anime la sienne. */
    enveloppe?: (contenu: React.ReactNode, reussi: boolean) => React.ReactNode;
}> = ({ resultat, classes, enveloppe }) => {
    const { t } = useTranslation(['modules', 'common']);

    /*
      **Le degré d'abord, le booléen en repli.** `degre` est né le 2026-08-22 ;
      `tagSuccess` a des mois. Un jet relu d'une séance enregistrée avant, ou
      reçu d'une tablette qui n'a pas la mise à jour, ne porte que le booléen —
      et un écran muet se lirait comme un jet qui n'a pas eu lieu.
    */
    const degre = degreOuBooleen(resultat.degre, resultat.tagSuccess);
    if (!degre) return null;

    const reussi = estUneReussite(degre);
    const contenu = <div className={classes(reussi)}>{t(cleI18nDuDegre(degre))}</div>;

    return <>{enveloppe ? enveloppe(contenu, reussi) : contenu}</>;
};
