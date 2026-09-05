import React from 'react';
import { MonitorPlay, Check } from 'lucide-react';
import type { EcranDeProjection } from '../modules/web/ecransDeProjection';

/**
 * **La liste des écrans où envoyer quelque chose, partout la même.**
 *
 * Écrite le 2026-09-06, quand un deuxième endroit en a eu besoin : le bouton
 * *Projeter* d'un lieu de l'Atlas, après celui des vidéos YouTube de Web-OS.
 *
 * ⚠️ **Ce composant ne dessine que les lignes, jamais leur cadre.** Web-OS les
 * pose sur le pad lui-même — une liste flottante dans une grille de vignettes se
 * fait recouvrir par la suivante ; l'Atlas les déroule sous son bouton. *Ce qui
 * diffère est la place, pas le contenu :* les partager entièrement aurait obligé
 * l'un des deux à porter la forme de l'autre.
 *
 * Chaque ligne **dit son état et fait l'inverse** : ce qui est à l'antenne se
 * coupe, le reste s'allume. Pas de bouton « couper » séparé, qui laisserait
 * deviner lequel des écrans il coupe.
 */

interface MenuDesEcransProps {
    destinations: readonly EcranDeProjection[];
    /** Appelé avec l'écran touché, et ce qu'il faut en faire. */
    onChoisir: (evenement: React.MouseEvent, ecranId: string, aLAntenne: boolean) => void;
    /** Ce qu'on projette, pour l'infobulle — « Projeter Hadley Hope sur… ». */
    quoi?: string;
}

const MenuDesEcrans: React.FC<MenuDesEcransProps> = ({ destinations, onChoisir, quoi }) => (
    <>
        {destinations.map((ecran) => (
            <button
                key={ecran.id}
                onClick={(e) => onChoisir(e, ecran.id, ecran.aLAntenne)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-bold transition-colors shrink-0 ${
                    ecran.aLAntenne
                        ? 'bg-accent text-app-bg shadow-glow-accent'
                        : 'bg-app-surface/60 text-app-text hover:bg-app-surface'
                }`}
                title={ecran.aLAntenne
                    ? `Couper sur ${ecran.libelle}`
                    : `Projeter${quoi ? ` ${quoi}` : ''} sur ${ecran.libelle}`}
            >
                {ecran.aLAntenne
                    ? <Check size={13} className="shrink-0" />
                    : <MonitorPlay size={13} className="shrink-0" />}
                <span className="truncate">{ecran.libelle}</span>
            </button>
        ))}
    </>
);

export default MenuDesEcrans;
