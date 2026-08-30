import React from 'react';
import { Coffee, MonitorSmartphone, ChevronRight, WifiOff, RotateCcw } from 'lucide-react';
import { useUlanziStore } from './useUlanziStore';
import { QUARTS, composerDefile, stressDuQuart } from './widgets/defileDesQuarts';
import { widgetsActifs, widgetsDuJeu, estActif, reservesPourLaTable } from './widgets/librairie';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';
import { useCorpusDeLaCampagne } from '../session/hooks/useCorpusDeLaCampagne';
import { useClockStore } from '../../store/useClockStore';
import { enMinutesSecondes, COULEURS_DU_MINUTEUR } from './widgets/minuteur';
import { COULEURS_DU_COMPTE } from './widgets/compteARebours';
import { COULEUR_DE_L_HEURE } from './widgets/heureDuMonde';
import { COULEUR_DE_LA_RESERVE } from './widgets/jaugeDeTable';

/**
 * Ce que chaque widget affiche quand aucune couleur n'a été choisie.
 *
 * **Un sélecteur de couleur natif n'a pas d'état « rien ».** Sans ces valeurs, il
 * montrerait du noir sur un widget qui sort en bleu — et le premier clic
 * figerait ce noir. *Un contrôle qui ment sur ce qu'il commande fait poser un
 * geste qu'on n'a pas voulu.*
 */
const COULEURS_D_ORIGINE: Record<string, string> = {
    horloges: COULEURS_DU_COMPTE.plein,
    minuteur: COULEURS_DU_MINUTEUR.encours,
    heure: COULEUR_DE_L_HEURE,
    reserves: COULEUR_DE_LA_RESERVE,
};

/** Ce que le widget « Heure du monde » suit — le mode de Clock-OS. */
const LIBELLES_DE_MODE: Record<string, string> = {
    realtime: 'temps réel',
    static: 'heure posée',
    timer: 'minuteur',
    fantasy: 'fantastique',
};

/** Les noms des Quarts, tels que le livre les nomme — accents compris. */
const LIBELLES: Record<(typeof QUARTS)[number], string> = {
    matin: 'Matin',
    journee: 'Journée',
    soiree: 'Soirée',
    nuit: 'Nuit',
};

interface Props {
    seanceOuverte: boolean;
}

/**
 * **Le tableau de bord de l'afficheur Ulanzi**, dans le cockpit central.
 *
 * Demandé par David le 2026-08-23 (§ 12 du plan), construit le 2026-08-30 :
 * *« un tableau de bord qui me permet de choisir un script pour un jeu […] ; si
 * je choisis plus d'un widget, ils doivent défiler. »*
 *
 * **Il s'appelait `PanneauDesQuarts`.** Le nom disait vrai tant qu'il n'y avait
 * qu'un widget ; il aurait menti dès le second. *Un mot qui décrit mal ce qu'il
 * fait est un défaut, même quand le code est juste* — la leçon de « face
 * visible » contre « révélée », payée sur les cartes le matin même.
 *
 * **La couture provisoire a disparu.** Le panneau ne cherche plus « blade »
 * dans le nom du jeu : c'est `systemId` qui décide, via le catalogue. La
 * sélection est *par jeu*, donc changer de campagne change ce qui défile sans
 * rien reconfigurer.
 *
 * **Le panneau reste toujours rendu, et se replie quand l'option dort.** Une
 * première version ne l'affichait que pour Blade Runner ou quand l'option était
 * déjà cochée — mais l'interrupteur vit *ici*, donc on ne pouvait pas l'allumer
 * la première fois. *Un réglage caché derrière la condition qu'il commande ne
 * s'atteint jamais.*
 *
 * **Il ne porte PAS le battement.** Celui-ci vit dans `Shell`, monté en
 * permanence : accroché à ce panneau, il se serait arrêté dès qu'on quitte
 * l'écran — donc plus de restitution, plus de rattrapage au démarrage.
 * *Un émetteur attaché à une vue émet ce que la vue veut bien.*
 */
const TableauDeBordUlanzi: React.FC<Props> = ({ seanceOuverte }) => {
    const {
        actif, basculerActif, quarts, seuilSansPause, joignable, pourquoi,
        selection, basculerLeWidget, setSecondesDuWidget, setCouleurDuWidget,
        hote, setHote, silencerLesNatives, basculerSilence,
        quartSuivant, pause, reinitialiserLesQuarts,
    } = useUlanziStore();

    /*
      **Le panneau résout le jeu lui-même**, plutôt que de le recevoir en
      propriété. Le battement le résout de son côté, par le même crochet : deux
      chemins qui se répondent, au lieu d'une valeur transmise qui pourrait un
      jour ne plus être la même que celle qui décide de ce qui est poussé.
    */
    const jeu = useCorpusDeLaCampagne();
    const disponibles = widgetsDuJeu(jeu);

    /** Ce que le miroir des horloges montre réellement — voir plus bas. */
    const tensions = useClockStore(s => s.tensions);
    const isClockProjected = useClockStore(s => s.isClockProjected);
    const horlogesMontrees = isClockProjected ? (tensions?.length ?? 0) : 0;
    const timerRemaining = useClockStore(s => s.timerRemaining);
    const timerDuration = useClockStore(s => s.timerDuration);
    const minuteurMontre = isClockProjected && (timerDuration ?? 0) > 0;
    const modeDeLHorloge = useClockStore(s => s.mode);

    /*
      **Combien de réserves la table verra.** Un pilote sans réserves est le cas
      normal — la plupart des jeux n'en ont pas — et une case cochée sans rien
      derrière ressemblerait à une panne.
    */
    const campagnes = useSessionOSStore(s => s.campaigns);
    const campagneOuverte = useSessionOSStore(s => s.activeCampaignId);
    const pilotesForges = useSessionOSStore(s => s.customGameDrivers);
    const valeursDesReserves = useRessourcesDeTableStore(s => s.reserves);
    const reservesMontrees = React.useMemo(() => {
        const campagne = campagnes?.find(c => c.id === campagneOuverte);
        if (!campagne) return 0;
        const pilote = [...(pilotesForges ?? []), ...DEFAULT_GAME_DRIVERS]
            .find(d => d.id === campagne.system);
        return reservesPourLaTable(pilote?.ressourcesDeTable, valeursDesReserves[campagne.id]).length;
    }, [campagnes, campagneOuverte, pilotesForges, valeursDesReserves]);
    const actifs = widgetsActifs(jeu, selection);
    const defileActif = estActif('quarts', jeu, selection);

    const moment = QUARTS[quarts.quartDuJour];
    const coute = stressDuQuart(quarts, seuilSansPause) > 0;
    const apercu = composerDefile(quarts, seuilSansPause);

    /** La part d'écran enregistrée pour un widget actif. */
    const secondesDe = (id: string) => actifs.find(a => a.widget.id === id)?.secondes ?? 0;
    /** La couleur choisie, ou `undefined` si le widget garde la sienne. */
    const couleurDe = (id: string) => actifs.find(a => a.widget.id === id)?.couleur;
    /** Ce que le sélecteur natif montre quand rien n'a été choisi. */
    const couleurParDefautDe = (id: string) => COULEURS_D_ORIGINE[id] ?? '#FFFFFF';

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
                    Afficheur Ulanzi
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
                    {disponibles.length === 0 && ' Aucun widget pour ce jeu.'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-shrink-0 glass-bento rounded-xl px-4 py-3 flex flex-col gap-2.5">
            {entete}

            {/*
              **Le tableau de bord : ce que ce jeu peut montrer, et ce qui défile.**

              La liste dit la *disponibilité* (ce que le catalogue offre pour ce
              jeu), les cases disent la *sélection*. Deux questions différentes,
              donc pas deux écrivains — c'est le partage du § 12.
            */}
            {disponibles.length === 0 ? (
                <p className="text-[10px] leading-snug text-app-text/40">
                    Aucun widget pour ce jeu. L&apos;afficheur garde sa routine.
                </p>
            ) : (
                <div className="flex flex-col gap-1">
                    {disponibles.map(widget => {
                        const coche = actifs.some(a => a.widget.id === widget.id);
                        return (
                            <div key={widget.id} className="flex items-center gap-2 text-[11px]">
                                <label className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={coche}
                                        onChange={() => jeu && basculerLeWidget(jeu, widget.id)}
                                        disabled={!jeu}
                                        className="h-3 w-3 shrink-0 rounded border-app-border/60 bg-app-bg/60 accent-[var(--app-accent)]"
                                    />
                                    <span className={`truncate ${coche ? 'text-app-text' : 'text-app-text/40'}`}>
                                        {widget.nom}
                                    </span>
                                </label>
                                {/*
                                  **La part d'écran est PAR widget**, et c'est une
                                  correction au § 12 : il prévoyait une cadence
                                  unique écrite dans `ATIME`. Le code pose
                                  `duration` sur chaque application, ce qui laisse
                                  l'horloge native à sa cadence — un réglage de
                                  moins à rendre — et permet de donner plus de
                                  temps au widget qui en demande.
                                */}
                                {/*
                                  **Ce que le miroir montre vraiment, dit ici.**

                                  Un widget coché dont rien ne paraît à l'écran
                                  ressemble à une panne. Les horloges peuvent
                                  n'être aucune, ou n'être pas projetées — et
                                  l'afficheur est public, donc il ne montre que
                                  ce que la table a le droit de voir. *Un absent
                                  silencieux se cherche une heure.*
                                */}
                                {coche && widget.source.de === 'horloge' && (
                                    <span className={`shrink-0 text-[10px] ${horlogesMontrees > 0 ? 'text-app-text/40' : 'text-amber-300/70'}`}>
                                        {!isClockProjected
                                            ? 'non projetées'
                                            : horlogesMontrees === 0
                                                ? 'aucune horloge'
                                                : `${horlogesMontrees} affichée${horlogesMontrees > 1 ? 's' : ''}`}
                                    </span>
                                )}
                                {coche && widget.source.de === 'pilote' && (
                                    <span className={`shrink-0 text-[10px] ${reservesMontrees > 0 ? 'text-app-text/40' : 'text-amber-300/70'}`}>
                                        {reservesMontrees > 0
                                            ? `${reservesMontrees} affichée${reservesMontrees > 1 ? 's' : ''}`
                                            : 'aucune réserve'}
                                    </span>
                                )}
                                {coche && widget.source.de === 'temps' && (
                                    <span className={`shrink-0 text-[10px] ${isClockProjected ? 'text-app-text/40' : 'text-amber-300/70'}`}>
                                        {isClockProjected ? LIBELLES_DE_MODE[modeDeLHorloge] : 'non projetée'}
                                    </span>
                                )}
                                {coche && widget.source.de === 'minuteur' && (
                                    <span className={`shrink-0 text-[10px] ${minuteurMontre ? 'text-app-text/40' : 'text-amber-300/70'}`}>
                                        {!isClockProjected
                                            ? 'non projeté'
                                            : minuteurMontre
                                                ? enMinutesSecondes(timerRemaining ?? 0)
                                                : 'aucun minuteur'}
                                    </span>
                                )}
                                {/*
                                  **La couleur, pour les widgets qui en ont une
                                  seule.** Le défilé des Quarts n'en a pas :
                                  il se colore par moment du jour, et *on ne
                                  rend pas réglable ce qui dit quelque chose.*

                                  Le bouton à droite efface le choix — sans lui,
                                  un sélecteur natif ne sait pas revenir à
                                  « aucune couleur choisie », il ne sait que
                                  poser une valeur.
                                */}
                                {coche && widget.couleurReglable && (
                                    <span className="flex shrink-0 items-center gap-1">
                                        <input
                                            type="color"
                                            value={couleurDe(widget.id) ?? couleurParDefautDe(widget.id)}
                                            onChange={e => jeu && setCouleurDuWidget(jeu, widget.id, e.target.value)}
                                            title={`Couleur de « ${widget.nom} » sur l'afficheur`}
                                            aria-label={`Couleur de ${widget.nom}`}
                                            className="h-4 w-6 cursor-pointer rounded border border-app-border/40 bg-transparent p-0"
                                        />
                                        {couleurDe(widget.id) && (
                                            <button
                                                type="button"
                                                onClick={() => jeu && setCouleurDuWidget(jeu, widget.id, null)}
                                                title="Revenir à la couleur d'origine"
                                                className="text-[10px] leading-none text-app-text/30 hover:text-app-text/70"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </span>
                                )}
                                {coche && (
                                    <label className="flex shrink-0 items-center gap-1 text-[10px] text-app-text/40">
                                        <input
                                            type="number"
                                            min={3}
                                            max={60}
                                            value={secondesDe(widget.id)}
                                            onChange={e => jeu && setSecondesDuWidget(jeu, widget.id, Number(e.target.value))}
                                            title={`Secondes pendant lesquelles « ${widget.nom} » reste à l'écran`}
                                            aria-label={`Durée de ${widget.nom} en secondes`}
                                            className="w-10 rounded bg-app-bg/60 border border-app-border/40 px-1 text-center text-app-text/70"
                                        />
                                        s
                                    </label>
                                )}
                            </div>
                        );
                    })}
                    {actifs.length === 0 && (
                        <p className="text-[10px] leading-snug text-amber-300/70">
                            Aucun widget coché — l&apos;afficheur garde sa routine.
                        </p>
                    )}
                </div>
            )}

            {/*
              **Le pupitre du défilé ne paraît que si le défilé défile.**

              Ses deux boutons poussent un instrument : ils n'ont aucun sens
              quand le widget est décoché, et les laisser donnerait à croire
              qu'on agit sur quelque chose que la table ne voit pas.
            */}
            {defileActif && (
                <div className="flex items-stretch gap-4">
                    {/*
                        **L'aperçu est figé à la taille de la matrice.**

                        Il était en `w-full` : dans la colonne centrale, un `viewBox`
                        de 32 × 8 s'étirait à près de deux cents pixels de haut et
                        mangeait l'écran. *Un aperçu qui prend plus de place que ce
                        qu'il représente n'est plus un aperçu.*
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
                            <button
                                type="button"
                                onClick={reinitialiserLesQuarts}
                                title="Repartir au matin, compteur à zéro"
                                className="shrink-0 rounded-lg border border-app-border/40 px-2 text-app-text/40 hover:text-app-text/70 transition-colors"
                            >
                                <RotateCcw size={11} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Les réglages de l'appareil, communs à tous les widgets. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-app-text/40">
                <label
                    className="flex items-center gap-1 cursor-pointer"
                    title="Coupe l'horloge, la météo, l'humidité et la batterie pendant la séance : l'afficheur ne montre plus que les widgets choisis. Ces réglages ne s'appliquent qu'au démarrage, donc l'afficheur redémarre (~10 s) à la prise et à la restitution."
                >
                    <input
                        type="checkbox"
                        checked={silencerLesNatives}
                        onChange={basculerSilence}
                        className="h-3 w-3 rounded border-app-border/60 bg-app-bg/60 accent-[var(--app-accent)]"
                    />
                    Widgets seuls
                </label>
                <input
                    type="text"
                    value={hote}
                    onChange={e => setHote(e.target.value)}
                    spellCheck={false}
                    placeholder="awtrix_73f7a4.local"
                    title="Nom mDNS ou adresse IP de l'afficheur"
                    aria-label="Adresse de l'afficheur"
                    className="flex-1 min-w-[7rem] rounded bg-app-bg/60 border border-app-border/40 px-1.5 font-mono text-[10px] text-app-text/60"
                />
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

export default TableauDeBordUlanzi;
