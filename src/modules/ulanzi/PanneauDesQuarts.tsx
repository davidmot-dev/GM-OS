import React from 'react';
import { Coffee, MonitorSmartphone, ChevronRight, WifiOff, RotateCcw } from 'lucide-react';
import { useUlanziStore } from './useUlanziStore';
import { QUARTS, composerDefile, stressDuQuart } from './widgets/defileDesQuarts';

/** Les noms des Quarts, tels que le livre les nomme — accents compris. */
const LIBELLES: Record<(typeof QUARTS)[number], string> = {
    matin: 'Matin',
    journee: 'Journée',
    soiree: 'Soirée',
    nuit: 'Nuit',
};

interface Props {
    seanceOuverte: boolean;
    /** L'identifiant du jeu de la campagne active, pour signaler un hors-sujet. */
    jeuDeLaCampagne?: string;
}

/**
 * Le pupitre du défilé des quarts, dans le cockpit central.
 *
 * **Deux boutons, et c'est tout** — « Quart suivant » et « Pause ». David, le
 * 2026-08-23 : *« je pousse le quart à partir du cockpit pour l'instant »*.
 * Aucun moteur ne suit le Quart : c'est une main qui pousse, et l'afficheur
 * n'est qu'un reflet de cet état-ci.
 *
 * **Le panneau est toujours rendu, et se replie quand l'option dort.** Une
 * première version ne l'affichait que pour Blade Runner ou quand l'option était
 * déjà cochée — mais l'interrupteur vit *ici*, donc on ne pouvait pas l'allumer
 * la première fois. *Un réglage caché derrière la condition qu'il commande ne
 * s'atteint jamais.*
 *
 * **Il ne porte PAS le battement.** Celui-ci vit dans `Shell`, monté en
 * permanence : accroché à ce panneau, il se serait arrêté dès qu'on quitte
 * l'écran — donc plus de restitution, plus de rattrapage au démarrage — et il
 * aurait tourné en double si le panneau venait à s'afficher à deux endroits.
 * *Un émetteur attaché à une vue émet ce que la vue veut bien.*
 */
const PanneauDesQuarts: React.FC<Props> = ({ seanceOuverte, jeuDeLaCampagne }) => {
    const {
        actif, basculerActif, quarts, seuilSansPause, joignable, pourquoi,
        secondesParWidget, setCadence, hote, setHote,
        silencerLesNatives, basculerSilence,
        quartSuivant, pause, reinitialiserLesQuarts,
    } = useUlanziStore();

    const moment = QUARTS[quarts.quartDuJour];
    const coute = stressDuQuart(quarts, seuilSansPause) > 0;
    const apercu = composerDefile(quarts, seuilSansPause);
    const horsSujet = !!jeuDeLaCampagne && !jeuDeLaCampagne.toLowerCase().includes('blade');

    const interrupteur = (
        <button
            type="button"
            onClick={() => basculerActif()}
            title={actif ? "Rendre l'afficheur à sa routine" : "Enrôler l'afficheur pour la séance"}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${actif ? 'bg-accent' : 'bg-app-border'}`}
        >
            <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${actif ? 'left-[1.125rem]' : 'left-0.5'}`}
            />
        </button>
    );

    const entete = (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <MonitorSmartphone size={13} className={`shrink-0 ${actif ? 'text-accent' : 'text-app-text/40'}`} />
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-app-text/60 truncate">
                    Défilé des quarts
                </span>
            </div>
            {interrupteur}
        </div>
    );

    // ── Replié : une seule ligne, mais l'interrupteur reste atteignable ──────
    if (!actif) {
        return (
            <div className="flex-shrink-0 glass-bento rounded-xl px-4 py-2.5 flex flex-col gap-1">
                {entete}
                <p className="text-[10px] leading-snug text-app-text/40">
                    Afficheur Ulanzi éteint — il garde sa routine.
                    {horsSujet && ' Ce widget est celui de Blade Runner.'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-shrink-0 glass-bento rounded-xl px-4 py-3 flex flex-col gap-2.5">
            {entete}

            <div className="flex items-stretch gap-4">
                {/*
                    **L'aperçu est figé à la taille de la matrice.**

                    Il était en `w-full` : dans la colonne centrale, un `viewBox`
                    de 32 × 8 s'étirait à près de deux cents pixels de haut et
                    mangeait l'écran. *Un aperçu qui prend plus de place que ce
                    qu'il représente n'est plus un aperçu* — et une taille fixe
                    est aussi plus honnête sur les proportions réelles de l'objet.
                */}
                <div
                    className="shrink-0 rounded bg-black p-1"
                    aria-label={`Quart : ${LIBELLES[moment]}, ${quarts.consecutifs} d'affilée`}
                >
                    <svg
                        width={192}
                        height={48}
                        viewBox="0 0 32 8"
                        style={{ imageRendering: 'pixelated', display: 'block' }}
                    >
                        <text
                            x={16}
                            y={4.6}
                            textAnchor="middle"
                            fill={apercu.color}
                            style={{ font: 'bold 5px "JetBrains Mono", monospace', letterSpacing: '-0.2px' }}
                        >
                            {apercu.text}
                        </text>
                        {apercu.draw.map(({ df: [x, y, l, h, c] }, i) => (
                            <rect key={i} x={x} y={y} width={l} height={h} fill={c} />
                        ))}
                    </svg>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                        <span className="font-bold text-app-text">{LIBELLES[moment]}</span>
                        <span className={coute ? 'text-red-400 font-bold' : 'text-app-text/50'}>
                            {quarts.consecutifs} d&apos;affilée{coute ? ' · +1 stress' : ''}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={quartSuivant}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-app-border/40 bg-app-surface/60 px-2 py-1.5 text-[11px] font-bold text-app-text hover:bg-accent/20 hover:border-accent/40 transition-colors"
                        >
                            <ChevronRight size={12} /> Quart suivant
                        </button>
                        <button
                            type="button"
                            onClick={pause}
                            title="Une pause consomme elle-même un Quart, et remet le compteur à zéro."
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                        >
                            <Coffee size={12} /> Pause
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-app-text/40">
                        <label
                            className="flex items-center gap-1 cursor-pointer"
                            title="Coupe l'horloge, la météo, l'humidité et la batterie pendant la séance : l'afficheur ne montre plus que le défilé. Ces réglages ne s'appliquent qu'au démarrage, donc l'afficheur redémarre (~10 s) à la prise et à la restitution."
                        >
                            <input
                                type="checkbox"
                                checked={silencerLesNatives}
                                onChange={basculerSilence}
                                className="h-3 w-3 rounded border-app-border/60 bg-app-bg/60 accent-[var(--app-accent)]"
                            />
                            Défilé seul
                        </label>
                        <label className="flex items-center gap-1">
                            Durée
                            <input
                                type="number"
                                min={3}
                                max={60}
                                value={secondesParWidget}
                                onChange={e => setCadence(Number(e.target.value))}
                                title="Secondes pendant lesquelles le défilé reste à l'écran"
                                className="w-10 rounded bg-app-bg/60 border border-app-border/40 px-1 text-center text-app-text/70"
                            />
                            s
                        </label>
                        <input
                            type="text"
                            value={hote}
                            onChange={e => setHote(e.target.value)}
                            spellCheck={false}
                            placeholder="awtrix_73f7a4.local"
                            title="Nom mDNS ou adresse IP de l'afficheur"
                            className="flex-1 min-w-[7rem] rounded bg-app-bg/60 border border-app-border/40 px-1.5 font-mono text-[10px] text-app-text/60"
                        />
                        <button
                            type="button"
                            onClick={reinitialiserLesQuarts}
                            title="Repartir au matin, compteur à zéro"
                            className="shrink-0 hover:text-app-text/70 transition-colors"
                        >
                            <RotateCcw size={11} />
                        </button>
                    </div>
                </div>
            </div>

            {/*
                **L'afficheur ne doit jamais emporter ce qu'il décrivait.** On le
                signale sans rien masquer : le Quart reste lisible ci-dessus,
                c'est l'écran de la table qui manque, pas l'information.
            */}
            {seanceOuverte && joignable === false && (
                <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] leading-snug text-amber-300/90">
                    <WifiOff size={11} className="mt-0.5 shrink-0" />
                    <span>
                        Afficheur injoignable — le Quart se tient ici et reprendra seul.
                        {pourquoi && (
                            <span className="block mt-0.5 font-mono text-[9px] leading-tight text-amber-200/70 break-all">
                                {pourquoi}
                            </span>
                        )}
                    </span>
                </p>
            )}
            {!seanceOuverte && (
                <p className="text-[10px] leading-snug text-app-text/40">
                    L&apos;afficheur garde sa routine tant qu&apos;aucune séance n&apos;est ouverte.
                </p>
            )}
        </div>
    );
};

export default PanneauDesQuarts;
