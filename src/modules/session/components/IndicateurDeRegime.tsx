import React from 'react';
import { Armchair, Users } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { momentDeJeu } from '../../ai/budgetsDeTemps';

/**
 * **Le régime d'interface, affiché et renversable — la porte de sortie du mode
 * « table ».**
 *
 * Demandé par David le 2026-09-09 : *« je voulais le MJ Focus, mais je veux
 * aussi une possibilité d'en sortir au besoin. »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EXISTAIT DÉJÀ, ET CE QUI MANQUAIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le mode existe depuis l'axe N.3 (2026-08-23/24) : `aLaTable` densifie cinq
 * modules, pré-choisit ce qui peut l'être, et **éloigne les actions destructives
 * de ce qu'on touche dix fois par tour**. Il se déduit de `momentDeJeu` — une
 * séance ouverte et non en pause.
 *
 * Ce qui manquait n'était donc pas le mode : c'était **de le voir et de pouvoir
 * le contredire**. L'axe F.5 avait donné les deux à l'IA dès août, et son
 * `IndicateurDeMode` porte la règle mot pour mot :
 *
 * > *« Si la Forge se comporte différemment parce qu'une session est ouverte,
 * > c'est la Forge qui doit le dire, **avec le moyen de passer outre**. »*
 *
 * Ce composant est cette phrase, appliquée à l'écran au lieu du moteur. Il
 * montre **la raison** et pas seulement l'état — *un comportement qui change
 * sans être annoncé se lit comme une panne.*
 *
 * ⛔ **Il vit dans la barre du haut, et jamais dans ce que le mode replie.**
 * C'est une cicatrice : le 2026-08-23, le mode compact avait rendu trois boutons
 * **introuvables** en héritant d'un `opacity-0 group-hover:opacity-100` que
 * l'original n'avait pas. *Une porte de sortie qui disparaît avec le mode qu'elle
 * doit quitter n'est pas une porte.*
 */
export const IndicateurDeRegime: React.FC = () => {
    const moment = useSessionOSStore(s => momentDeJeu(s.sessions));
    const surcharge = useSessionStore(s => s.surchargeDuRegime);
    const forcerLeRegime = useSessionStore(s => s.forcerLeRegime);

    const effectif = surcharge ?? moment;
    const aLaTable = effectif === 'partie';

    /*
      **La raison, en trois cas et pas deux.** « Table » parce qu'une séance est
      ouverte n'est pas la même chose que « Table » parce qu'on l'a demandé :
      dans le second cas, le meneur doit reconnaître son propre geste, sinon il
      cherchera la séance qui n'existe pas.
    */
    const raison = surcharge
        ? 'forcé'
        : aLaTable ? 'séance ouverte' : 'hors séance';

    const Icone = aLaTable ? Users : Armchair;
    const teinte = aLaTable ? 'text-emerald-400' : 'text-sky-400';

    return (
        <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest ${teinte}`}>
                <Icone size={12} />
                {aLaTable ? 'Table' : 'Atelier'}
                <span className="text-app-text/30 normal-case tracking-normal font-medium">({raison})</span>
            </span>

            {/*
              **Deux boutons distincts et non une bascule**, quand le forçage est
              actif : *revenir à ce que la séance dit* et *forcer l'autre régime*
              sont deux intentions différentes, et une bascule unique obligerait à
              passer par l'une pour atteindre l'autre.
            */}
            <button
                onClick={() => forcerLeRegime(aLaTable ? 'preparation' : 'partie')}
                title={aLaTable
                    ? "Repasser en atelier : densité normale, outils d'édition à portée"
                    : 'Passer à la table : densité augmentée, actions destructives éloignées'}
                className="text-ui-10 font-bold uppercase tracking-widest text-app-text/35 hover:text-app-text/70 underline underline-offset-2 transition-colors"
            >
                {aLaTable ? 'Atelier' : 'Table'}
            </button>

            {surcharge && (
                <button
                    onClick={() => forcerLeRegime(null)}
                    title="Rendre la main à la séance : le régime suivra de nouveau son ouverture et sa pause"
                    className="text-ui-10 font-bold uppercase tracking-widest text-amber-400/60 hover:text-amber-400 underline underline-offset-2 transition-colors"
                >
                    Auto
                </button>
            )}
        </div>
    );
};
