import React, { useState } from 'react';
import type { RegimeDInterface } from '../logic/regimeDInterface';

interface Props {
    regime: RegimeDInterface;
    /** Ce qu'on annonce à la place, quand l'action est repliée. */
    libelle: string;
    /** L'action destructive elle-même — inchangée, jamais réécrite. */
    children: React.ReactNode;
    /**
     * Rendu discret, pour une icône logée dans une ligne de liste plutôt qu'un
     * bouton pleine largeur.
     */
    compact?: boolean;
    /**
     * Ne se montrer qu'au survol de la ligne qui le contient.
     *
     * **À n'activer que là où l'original se comportait déjà ainsi** — les
     * corbeilles du journal et des PNJ, logées dans une ligne `.group`. Ailleurs
     * c'est un piège : les trois commandes de la carte étaient **toujours
     * visibles** et n'ont aucun parent `.group`, donc `opacity-0` les a rendues
     * introuvables en séance. Signalé par David le 2026-08-24 :
     * *« je ne vois pas les boutons »*.
     *
     * *Un remplaçant qui hérite d'un style que l'original n'avait pas ne
     * remplace pas, il efface.*
     */
    surInvitation?: boolean;
    /**
     * L'icône du bouton replié, rendue **en sourdine**.
     *
     * David, le 2026-08-24 : *« c'est pas hyper clair, mais quand on le sait
     * c'est bien »*. Trois points ne disent rien de ce qu'ils cachent : on
     * perdait la corbeille qu'on reconnaissait, pour un symbole qu'il faut
     * apprendre. *Une commande qui ne s'annonce plus n'est pas éloignée, elle
     * est déguisée.*
     *
     * L'icône revient donc, atténuée : on reconnaît l'action, et il faut
     * toujours deux gestes. Absente, on retombe sur les trois points.
     */
    icone?: React.ReactNode;
}

/**
 * **Ce qui détruit s'éloigne de ce qu'on touche — axe N, troisième temps.**
 *
 * > *« Aucune action destructive ni monopolisante près de ce qu'on touche en
 * > partie. »* — plan du 2026-08-07, axe N.
 *
 * En préparation, l'action est rendue telle quelle : on travaille, on range, on
 * supprime, et rien ne doit gêner. **En séance, elle demande un geste de plus.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE COMPOSANT N'EST PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Ce n'est pas un verrou.** On ne retire pas au meneur une commande de son
 * propre écran : elle reste atteignable en deux gestes au lieu d'un. *Une
 * fonction qu'on désactive « pour son bien » est une fonction qu'on lui reprend.*
 *
 * **Ce n'est pas une confirmation non plus**, et la distinction est le cœur du
 * sujet : une confirmation empêche le **dégât**, pas l'**interruption**. Une
 * fenêtre modale ouverte par mégarde au milieu d'un tour monopolise la table le
 * temps qu'on comprenne d'où elle vient. Les deux se complètent — celles qui
 * confirment déjà gardent leur confirmation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI IL EST PARTAGÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le garde-fou de l'axe N est impératif : *« toute vue dédoublée partage ses
 * composants, jamais son implémentation »*. Cinq modules replient du destructif
 * — combat, carte, PNJ, Oracle, journal. Écrit cinq fois, ce repli aurait cinq
 * comportements au premier ajustement, et **on ne s'en apercevrait qu'à la
 * table**.
 */
const HorsDePortee: React.FC<Props> = ({ regime, libelle, children, compact, surInvitation, icone }) => {
    const [revele, setRevele] = useState(false);

    if (regime.destructifAPortee || revele) return <>{children}</>;

    if (compact) {
        return (
            <button
                type="button"
                onClick={e => { e.stopPropagation(); setRevele(true); }}
                title={`${libelle} — un geste de plus pendant la séance`}
                aria-label={libelle}
                className={`px-1.5 py-1 rounded text-app-text/30 hover:text-app-text/70 transition-all `
                    + `text-[11px] leading-none font-bold tracking-widest opacity-60 hover:opacity-100 `
                    + (surInvitation ? 'opacity-0 group-hover:opacity-100' : '')}
            >
                {icone ?? '···'}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setRevele(true)}
            title={`${libelle} — un geste de plus pendant la séance`}
            className="w-full py-2 text-[10px] uppercase tracking-widest text-app-text/30 hover:text-red-500/70 transition-colors"
        >
            {libelle}…
        </button>
    );
};

export default HorsDePortee;
