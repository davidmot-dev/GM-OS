import React from 'react';
import { Gauge, Layers } from 'lucide-react';
import { useModeDeContexte } from './modeDeContexte';

/**
 * **Le mode, affiché là où il agit — axe F.5.**
 *
 * *« Si la Forge se comporte différemment parce qu'une session est ouverte,
 * c'est la Forge qui doit le dire, avec le moyen de passer outre. Sinon on
 * recrée l'action à distance qu'on cherche à éviter. »*
 *
 * **Le cockpit ne suffit pas**, et c'est tout l'objet de cet axe : le meneur qui
 * demande un butin depuis un autre écran ne voit pas le cockpit, et ne comprend
 * donc pas pourquoi la réponse est plus maigre que la veille. *Un comportement
 * qui change sans être annoncé se lit comme une panne.*
 *
 * **Il montre la RAISON, pas seulement l'état** — « séance ouverte » — parce que
 * c'est elle qui rend le choix compréhensible, et donc renversable en
 * connaissance de cause.
 */
export const IndicateurDeMode: React.FC<{
    /** Le choix explicite du meneur. `undefined` : il suit le moment. */
    surcharge?: boolean;
    /** Rend le nouveau choix. Sans lui, l'indicateur est en lecture seule. */
    onSurcharge?: (valeur: boolean | undefined) => void;
    compact?: boolean;
}> = ({ surcharge, onSurcharge, compact = false }) => {
    const mode = useModeDeContexte(surcharge);

    const Icone = mode.allege ? Gauge : Layers;
    const teinte = mode.allege ? 'text-amber-400' : 'text-sky-400';

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${teinte}`}>
                <Icone size={12} />
                {mode.libelle}
            </span>

            {onSurcharge && (
                <button
                    onClick={() => onSurcharge(!mode.allege)}
                    className="text-[10px] font-bold uppercase tracking-widest text-app-text/35 hover:text-app-text/70 underline underline-offset-2 transition-colors"
                >
                    {mode.allege ? 'Prendre tout le contexte' : 'Alléger'}
                </button>
            )}

            {/*
                **Revenir au défaut est un troisième choix, et il doit exister.**
                Sans lui, un meneur qui a surchargé une fois garde son choix pour
                la soirée entière — y compris après la clôture de la séance, où
                il n'a plus de sens. *Une surcharge sans retour devient un
                réglage qu'on a oublié d'avoir posé.*
            */}
            {onSurcharge && surcharge !== undefined && !compact && (
                <button
                    onClick={() => onSurcharge(undefined)}
                    className="text-[10px] font-bold uppercase tracking-widest text-app-text/25 hover:text-app-text/60 transition-colors"
                >
                    suivre la séance
                </button>
            )}
        </div>
    );
};

export default IndicateurDeMode;
