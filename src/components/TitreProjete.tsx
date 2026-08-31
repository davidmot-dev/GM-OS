import React, { useCallback, useEffect, useState } from 'react';
import {
    estPourCetEcran, lireLeTitre, minuterieDuTitre, useTitreProjeteStore,
    type TitreProjete as Titre,
} from '../modules/storyboard/titreProjete';

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

    return (
        <div className="pointer-events-none absolute inset-x-0 top-[8%] z-40 flex justify-center px-8" aria-live="polite">
            <h1
                style={{
                    // **La police vient du thème du jeu**, posée par `useThemeDuJeu`
                    // depuis le CSS de la campagne. Rien à régler ici.
                    fontFamily: 'var(--font-display)',
                    opacity: visible ? 1 : 0,
                    transitionDuration: `${titre.fondu}s`,
                    animationDuration: `${titre.fondu}s`,
                }}
                className="max-w-[90%] text-center text-4xl sm:text-6xl font-black italic uppercase tracking-[0.2em]
                           text-white transition-opacity ease-in-out animate-in fade-in
                           [text-shadow:0_2px_24px_rgba(0,0,0,0.9),0_0_60px_rgba(0,0,0,0.7)]"
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
export const TitreProjete: React.FC<{ cible: string }> = ({ cible }) => {
    const titre = useTitreProjeteStore(e => e.titre);
    const poserLeTitre = useTitreProjeteStore(e => e.poserLeTitre);

    /* Le pont Electron alimente les fenêtres, et c'est le seul chemin. */
    useEffect(() => {
        const surMessage = (_e: unknown, ...args: unknown[]) => {
            const [type, charge] = args as [string, string];
            if (type !== 'titre') return;
            poserLeTitre(lireLeTitre(charge));
        };
        window.appBridge?.on?.('image:sync-hub-data', surMessage);
        return () => window.appBridge?.off?.('image:sync-hub-data', surMessage);
    }, [poserLeTitre]);

    const retirer = useCallback(() => poserLeTitre(null), [poserLeTitre]);

    if (!estPourCetEcran(titre, cible) || !titre!.texte) return null;

    // La clé rejoue le fondu d'entrée à chaque nouveau titre : sans elle, un
    // second titre reprendrait l'état visible du premier et apparaîtrait sec.
    return <TexteDuTitre key={titre!.texte} titre={titre!} surRetrait={retirer} />;
};

export default TitreProjete;
