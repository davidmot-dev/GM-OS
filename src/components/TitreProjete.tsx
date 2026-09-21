import React, { useCallback, useEffect, useState } from 'react';
import {
    estPourCetEcran, lireLeTitre, minuterieDuTitre, useTitreProjeteStore,
    type TitreProjete as Titre,
} from '../modules/storyboard/titreProjete';
import { pileDePolice, requeteDePolices } from '../theme/editionDuTheme';

/**
 * Le texte lui-même, et ses deux fondus.
 *
 * **Séparé du reste pour que le fondu d'entrée n'ait pas à s'écrire en état.**
 * Il vit dans l'animation CSS, jouée au montage ; c'est la clé posée sur ce
 * composant qui le rejoue à chaque nouveau titre. *Un `setState` synchrone dans
 * un effet pour « rendre visible » relance un rendu pour rien — et React le
 * signale à juste titre.*
 *
 * Seule la **sortie** est un état : elle arrive plus tard, sur minuterie.
 */
const TexteDuTitre: React.FC<{ titre: Titre; surRetrait: () => void }> = ({ titre, surRetrait }) => {
    const [visible, setVisible] = useState(true);

    /*
      **Deux minuteries, et pas une.** Le fondu de sortie commence à la fin de la
      tenue ; le texte ne quitte l'arbre qu'une fois ce fondu joué. Le retirer à
      la fin de la tenue supprimerait le fondu au lieu de le jouer.

      Un titre permanent n'arme ni l'une ni l'autre : il s'en va avec le moment,
      ou quand un autre titre le remplace.
    */
    useEffect(() => {
        const { sortieDansMs, retraitDansMs } = minuterieDuTitre(titre);
        if (sortieDansMs === null || retraitDansMs === null) return;

        const sortie = setTimeout(() => setVisible(false), sortieDansMs);
        const retrait = setTimeout(surRetrait, retraitDansMs);
        return () => { clearTimeout(sortie); clearTimeout(retrait); };
    }, [titre, surRetrait]);

    /* La police demandée doit exister dans CETTE fenêtre : le projecteur et le
       Player Hub sont deux documents distincts. */
    useEffect(() => { if (titre?.police) chargerLaPolice(titre.police); }, [titre?.police]);

    return (
        <div
            className={`pointer-events-none absolute inset-x-0 z-40 flex justify-center px-8 ${PLACEMENTS[titre.position]}`}
            aria-live="polite"
        >
            <h1
                style={{
                    /*
                      **La police du thème reste le défaut**, posée par
                      `useThemeDuJeu` depuis le CSS de la campagne — c'était le
                      seul choix jusqu'au 2026-09-21. Un titre peut désormais en
                      demander une autre, prise dans la même liste que les
                      réglages, et `pileDePolice` lui ajoute son repli.
                    */
                    fontFamily: titre.police ? pileDePolice(titre.police) : 'var(--font-display)',
                    color: titre.couleur,
                    textShadow: OMBRES[titre.contour],
                    opacity: visible ? 1 : 0,
                    transitionDuration: `${titre.fondu}s`,
                    /*
                      **Le fondu d'entrée est une vraie animation, pas la classe
                      `animate-in fade-in`** : ce projet n'a pas le greffon
                      `tailwindcss-animate`, ces deux classes n'y produisent
                      aucune règle, et le titre apparaissait donc d'un coup.
                      *Une classe qui n'existe pas ne prévient pas.*

                      ⚠️ Sans mode de remplissage : `both` garderait l'opacité de
                      fin après l'animation et **battrait le style en ligne**,
                      qui est ce qui joue le fondu de SORTIE — le titre ne
                      partirait plus jamais.
                    */
                    animation: `gmos-fondu-entrant ${titre.fondu}s ease-in-out`,
                }}
                className="max-w-[90%] text-center text-4xl sm:text-6xl font-black italic uppercase tracking-[0.2em]
                           transition-opacity ease-in-out"
            >
                {titre.texte}
            </h1>
        </div>
    );
};

/**
 * **Le titre, par-dessus l'image projetée.**
 *
 * *Demandé par David le 2026-08-31.* Monté par les deux surfaces qui montrent
 * une projection — la fenêtre de projection et le Player Hub —, et chacune passe
 * **sa** cible : le titre d'un moment envoyé sur le moniteur 2 ne doit pas
 * apparaître sur l'écran de la table.
 *
 * *Le storyboard ne vise pas les tablettes (décision de David) : elles reçoivent
 * le message et ne le lisent pas.*
 */
/**
 * **Où le titre se pose.** Trois hauteurs, et pas un curseur : *un titre au
 * tiers supérieur gauche n'est pas un réglage qu'on refait deux fois pareil.*
 */
const PLACEMENTS: Record<Titre['position'], string> = {
    haut: 'top-[8%]',
    milieu: 'top-1/2 -translate-y-1/2',
    bas: 'bottom-[8%]',
};

/**
 * **L'ombre portée — elle n'est pas décorative.**
 *
 * ⛔ C'est elle qui rend le texte lisible sur une image claire comme sur une
 * sombre. `fort` reproduit exactement ce que faisait le titre avant qu'on puisse
 * en changer. *Un titre illisible sur une image trop claire ressemble à un titre
 * qui ne s'est pas affiché* — d'où `aucun` offert, mais jamais par défaut.
 */
const OMBRES: Record<Titre['contour'], string> = {
    aucun: 'none',
    leger: '0 2px 12px rgba(0,0,0,0.65)',
    fort: '0 2px 24px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.7)',
};

/**
 * **Charger la police demandée, si elle n'est pas déjà là.**
 *
 * ⛔ **On n'emploie PAS `poserLesPolices`** : ce helper *retire* tous les liens
 * qu'il a posés avant d'ajouter les siens, et il sert au thème du jeu. S'en
 * servir ici arracherait les polices de toute l'interface à chaque titre. *Un
 * helper qui fait table rase ne se partage pas.*
 *
 * ⚠️ Les familles marquées `deja` dans `POLICES_CONNUES` sont chargées par
 * `index.css` pour toute l'application : `requeteDePolices` rend alors `null`, et
 * il n'y a rien à injecter.
 */
function chargerLaPolice(famille: string): void {
    if (!famille || typeof document === 'undefined') return;

    const url = requeteDePolices([famille]);
    if (!url) return;
    if (document.head.querySelector(`link[data-police-de-titre="${CSS.escape(famille)}"]`)) return;

    const lien = document.createElement('link');
    lien.rel = 'stylesheet';
    lien.href = url;
    lien.setAttribute('data-police-de-titre', famille);
    document.head.appendChild(lien);
}

export const TitreProjete: React.FC<{ cible: string }> = ({ cible }) => {
    const titre = useTitreProjeteStore(e => e.titre);
    const poserLeTitre = useTitreProjeteStore(e => e.poserLeTitre);

    /* Le pont Electron alimente les fenêtres, et c'est le seul chemin. */
    useEffect(() => {
        const surMessage = (type: string, charge: string) => {
            if (type !== 'titre') return;
            poserLeTitre(lireLeTitre(charge));
        };
        const retirerLAbonnement = window.appBridge?.image?.onSyncHubData?.(surMessage);

        /*
          **Et on demande le titre en cours, une fois abonné.**

          *Défaut trouvé par David le 2026-09-02 : « le texte du Titre n'apparaît
          parfois pas tout de suite ».* La séquence qui projette une image sur un
          moniteur éteint **crée** la fenêtre de projection ; le titre partait
          dans la seconde qui suit, vers un rendu qui n'écoutait pas encore, et
          il était perdu. L'image, elle, attendait déjà `did-finish-load`.

          Demander en arrivant vaut mieux que retarder l'envoi : l'émetteur n'a
          toujours pas à savoir quelles fenêtres existent, et un écran ouvert au
          milieu d'une séquence rattrape son titre.
        */
        window.appBridge?.image?.requestCurrentTitle?.(cible);

        return () => retirerLAbonnement?.();
    }, [poserLeTitre, cible]);

    const retirer = useCallback(() => poserLeTitre(null), [poserLeTitre]);

    if (!estPourCetEcran(titre, cible) || !titre!.texte) return null;

    // La clé rejoue le fondu d'entrée à chaque nouveau titre : sans elle, un
    // second titre reprendrait l'état visible du premier et apparaîtrait sec.
    return <TexteDuTitre key={titre!.texte} titre={titre!} surRetrait={retirer} />;
};

export default TitreProjete;
