import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { borner, lireLeReglage, LOUPE_MAX, LOUPE_MIN, memoriser, PAS } from './reglageDeLoupe';

/**
 * **La loupe de lecture — demandée par David le 2026-09-06 :** *« est-ce qu'on
 * pourrait faire un mécanisme de loupe pour me faciliter la lecture ? »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN ZOOM DU DOCUMENT ET PAS UN HUBLOT QUI SUIT LA SOURIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une loupe optique — un cercle grossissant qui suit le curseur — montre trois
 * mots à la fois et **occupe une main**. Or ce qu'on lit ici est une fiche
 * technique comparative à trois colonnes, en pleine partie, une main sur la
 * souris et l'autre sur les dés. *On ne lit pas un tableau par un trou de
 * serrure.*
 *
 * Le zoom du document, lui, laisse la mise en page se rerégler : les colonnes
 * restent alignées, les lignes se recassent, et le tableau garde son propre
 * défilement horizontal (posé dans `TexteMarkdown`) au lieu de pousser la page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE N'EST PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Ce n'est pas un réglage de thème.** L'atelier de thème décide de ce que le
 * jeu *est* — et ça part sur le disque, dans le `theme.css` que les joueurs
 * lisent aussi. La loupe décide de ce que **cet écran-ci** montre à cet
 * instant : elle vit dans le navigateur du meneur, ne touche aucun fichier et
 * ne traverse aucune fenêtre. *Un confort de lecture n'est pas une décision
 * d'univers.*
 *
 * Elle **multiplie** ce que la bande « Texte courant » a déjà décidé : on règle
 * le jeu une fois, puis on grossit ponctuellement le document qu'on a sous le
 * nez.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI `zoom` ET NON UNE VARIABLE HÉRITÉE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La première version posait `--loupe` sur le bloc et laissait les tailles en
 * `em` en hériter. David l'a essayée le 2026-09-06 : *« le texte ne grossit
 * pas »* — capture à 230 % où les titres crevaient l'écran pendant que les
 * paragraphes n'avaient pas bougé d'un pixel.
 *
 * La cause est **le même motif que le défaut d'origine** : les paragraphes du
 * wiki portent `prose-p:text-lg`, une classe utilitaire qui pose une taille en
 * `rem`. *Un `rem` se calcule sur la racine du document, jamais sur le bloc qui
 * le contient* — donc tout élément portant une classe `text-*` coupe la chaîne
 * d'héritage, et ils sont légion. Les titres suivaient parce que le greffon
 * typographique, lui, les écrit en `em`.
 *
 * `zoom` ne demande rien à personne : il agrandit le rendu du sous-arbre entier,
 * classes utilitaires comprises, et **la mise en page se recasse** dans la même
 * colonne (contrairement à `transform: scale`, qui déborderait). C'est
 * exactement le zoom du navigateur, appliqué à un seul panneau.
 *
 * ⚠️ **La commande reste HORS du zoom.** À 230 %, une barre de boutons zoomée
 * deviendrait un bandeau. Elle est donc soeur du contenu, pas sa mère.
 */

interface LoupeDeLectureProps {
    children: React.ReactNode;
    /** Posé sur l'enveloppe, pour les rares mises en page qui l'exigent. */
    className?: string;
}

/**
 * Enveloppe un bloc `.prose` d'une commande de grossissement.
 *
 * Deux gestes pour la même chose : **Ctrl + molette** sur le document, et les
 * deux boutons. Le pourcentage se clique pour revenir à 100 %.
 */
const LoupeDeLecture: React.FC<LoupeDeLectureProps> = ({ children, className }) => {
    const [facteur, setFacteur] = useState<number>(lireLeReglage);
    const zone = useRef<HTMLDivElement>(null);

    const regler = useCallback((suivant: number) => {
        const borne = borner(suivant);
        setFacteur(borne);
        memoriser(borne);
    }, []);

    /*
      **`onWheel` de React est passif** — `preventDefault` y est sans effet, et
      la page zoomerait par-dessus notre grossissement (Electron applique son
      propre zoom sur Ctrl + molette). Il faut donc poser l'écouteur à la main
      avec `{ passive: false }`. Le même piège est signalé dans `MapCanvas`.
    */
    useEffect(() => {
        const el = zone.current;
        if (!el) return;

        const surMolette = (e: WheelEvent) => {
            if (!e.ctrlKey) return; // une molette nue fait défiler, comme partout
            e.preventDefault();
            /* `deltaY` est négatif quand on pousse la molette vers l'avant. */
            setFacteur(actuel => {
                const suivant = borner(actuel + (e.deltaY < 0 ? PAS : -PAS));
                memoriser(suivant);
                return suivant;
            });
        };

        el.addEventListener('wheel', surMolette, { passive: false });
        return () => el.removeEventListener('wheel', surMolette);
    }, []);

    const pourcent = Math.round(facteur * 100);
    /* La commande s'efface quand la loupe ne sert pas — mais reste visible dès
       qu'elle est réglée, sinon on ne saurait pas pourquoi le texte est grand. */
    const visibilite = facteur === 1
        ? 'opacity-0 group-hover/loupe:opacity-100 focus-within:opacity-100'
        : 'opacity-100';

    return (
        <div ref={zone} className={`group/loupe relative ${className ?? ''}`}>
            <div
                role="group"
                aria-label="Loupe de lecture"
                className={`sticky top-0 z-30 flex justify-end mb-2 pointer-events-none transition-opacity ${visibilite}`}
            >
                <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-app-border bg-app-surface/90 px-1.5 py-1 backdrop-blur-sm shadow-lg">
                    <button
                        onClick={() => regler(facteur - PAS)}
                        disabled={facteur <= LOUPE_MIN}
                        aria-label="Réduire le texte"
                        title="Réduire (Ctrl + molette)"
                        className="p-1 rounded-full text-app-text/60 hover:text-accent hover:bg-white/5 disabled:opacity-20 disabled:hover:text-app-text/60 transition-colors"
                    >
                        <Minus size={14} />
                    </button>
                    <button
                        onClick={() => regler(1)}
                        aria-label="Taille normale"
                        title="Revenir à 100 %"
                        className="w-12 text-center text-ui-10 font-black font-mono text-app-text/70 hover:text-accent transition-colors"
                    >
                        {pourcent} %
                    </button>
                    <button
                        onClick={() => regler(facteur + PAS)}
                        disabled={facteur >= LOUPE_MAX}
                        aria-label="Agrandir le texte"
                        title="Agrandir (Ctrl + molette)"
                        className="p-1 rounded-full text-app-text/60 hover:text-accent hover:bg-white/5 disabled:opacity-20 disabled:hover:text-app-text/60 transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* `zoom: 1` n'est pas neutre pour tout le monde — on ne pose la
                propriété que si la loupe sert vraiment. */}
            <div data-loupe={pourcent} style={facteur === 1 ? undefined : { zoom: facteur }}>
                {children}
            </div>
        </div>
    );
};

export default LoupeDeLecture;
