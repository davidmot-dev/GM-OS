import React, { useEffect, useRef, useState } from 'react';
import { Music, Waves, Swords, Timer, Power, WifiOff, ShieldAlert, MessageSquare } from 'lucide-react';
import { type RemoteLecture } from '../types/remote.types';

/**
 * **La ligne d'état — ce qui est en cours, toujours visible.**
 *
 * Écrite le 2026-09-05, en remplacement de l'en-tête. Celui-ci occupait 104 px
 * de haut pour un titre (« GM Remote », qu'on sait déjà) et un point de
 * connexion. Pendant ce temps, **rien ne disait ce qui jouait** : pour savoir
 * si une musique tournait ou où en était le round, il fallait changer d'onglet
 * — ou regarder l'écran du PC, c'est-à-dire cesser de se servir de la
 * télécommande.
 *
 * Elle ne montre **que ce qui est vrai en ce moment** : une chose absente ne
 * laisse pas de case vide, elle disparaît. *Un bandeau qui affiche « — » partout
 * apprend au regard à ne plus s'y arrêter.*
 */

interface RemoteStatusBarProps {
    status: 'connecting' | 'connected' | 'error';
    isPaired: boolean;
    lecture?: RemoteLecture;
    combat: { combatants: { name: string }[]; currentTurnIdx: number; round: number };
    minuteur?: { timerRemaining: number; timerIsRunning: boolean };
    /** Combien de messages de joueurs le meneur n'a lus nulle part. */
    messagesNonLus?: number;
    onVoirLesMessages?: () => void;
    onStopAll: () => void;
}

/** `mm:ss`, en chiffres à chasse fixe pour que la ligne ne tressaute pas. */
function enMinutes(secondes: number): string {
    const m = Math.floor(secondes / 60);
    const s = secondes % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Le temps d'appui qui déclenche l'arrêt général. */
const APPUI_LONG_MS = 700;

const RemoteStatusBar: React.FC<RemoteStatusBarProps> = ({
    status, isPaired, lecture, combat, minuteur, messagesNonLus, onVoirLesMessages, onStopAll,
}) => {
    const [progression, setProgression] = useState(0);
    const debutRef = useRef<number | null>(null);
    const imageRef = useRef<number | null>(null);

    /*
      **Le silence se tient enfoncé.** Le geste vivait dans le troisième onglet,
      alors que c'est celui qu'on veut atteindre sans chercher. Mais un bouton
      qui coupe le son, à portée de pouce sur une tablette posée entre deux dés,
      se déclencherait tout seul : *l'appui long est ce qui permet de le rendre
      atteignable sans le rendre dangereux.*

      ⚠️ **Il s'appelait « Tout couper » et ne coupait que les bruitages** —
      David l'a trouvé en séance le 2026-09-05. Le handler ne touchait ni la
      musique ni l'ambiance. Il les coupe maintenant, et **les images et les
      lumières restent** : le rideau complet est le bouton du meneur.
    */
    const arreterLAppui = () => {
        debutRef.current = null;
        if (imageRef.current !== null) cancelAnimationFrame(imageRef.current);
        imageRef.current = null;
        setProgression(0);
    };

    const commencerLAppui = () => {
        if (debutRef.current !== null) return;
        debutRef.current = performance.now();

        const avancer = () => {
            if (debutRef.current === null) return;
            const part = Math.min(1, (performance.now() - debutRef.current) / APPUI_LONG_MS);
            setProgression(part);
            if (part >= 1) {
                arreterLAppui();
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 60, 40]);
                onStopAll();
                return;
            }
            imageRef.current = requestAnimationFrame(avancer);
        };
        imageRef.current = requestAnimationFrame(avancer);
    };

    /* Un doigt qui quitte l'écran sans `pointerup` — l'appel entrant, le
       verrouillage — laisserait l'animation tourner indéfiniment. */
    useEffect(() => arreterLAppui, []);

    const combattantCourant = combat?.combatants?.[combat.currentTurnIdx]?.name;
    const enCombat = (combat?.combatants?.length ?? 0) > 0;
    const minuteurActif = !!minuteur?.timerIsRunning && minuteur.timerRemaining > 0;

    /* Le compte des pistes remplace le nom quand l'ambiance a été composée à la
       main : c'est vrai, là où un nom serait inventé. */
    const ambiance = lecture?.ambiance
        ?? (lecture?.pistesDAmbiance ? `${lecture.pistesDAmbiance} pistes` : null);

    return (
        <header className="shrink-0 flex items-center gap-3 px-3 h-12 border-b border-white/5 bg-app-bg/80 backdrop-blur-xl">
            {/* L'état de liaison : un point, et un mot seulement quand ça ne va pas. */}
            <div className="flex items-center gap-2 shrink-0">
                <span
                    className={`w-2 h-2 rounded-full ${status === 'connected'
                        ? (isPaired ? 'bg-emerald-500' : 'bg-amber-500')
                        : 'bg-rose-500 animate-pulse'}`}
                />
                {status !== 'connected' && (
                    <span className="flex items-center gap-1 text-ui-10 font-black uppercase tracking-widest text-rose-400">
                        <WifiOff size={12} /> Reconnexion
                    </span>
                )}
                {status === 'connected' && !isPaired && (
                    <span className="flex items-center gap-1 text-ui-10 font-black uppercase tracking-widest text-amber-400">
                        <ShieldAlert size={12} /> Non appairée
                    </span>
                )}
            </div>

            {/*
              Ce qui joue. Chaque élément disparaît quand il n'a rien à dire —
              la ligne se remplit à mesure que la séance se met en route.
            */}
            <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                {lecture?.musique && (
                    <span className="flex items-center gap-1.5 min-w-0 text-slate-300">
                        <Music size={13} className="text-accent shrink-0" />
                        <span className="text-xs truncate">{lecture.musique}</span>
                    </span>
                )}
                {ambiance && (
                    <span className="flex items-center gap-1.5 min-w-0 text-slate-300">
                        <Waves size={13} className="text-cyan-400 shrink-0" />
                        <span className="text-xs truncate">{ambiance}</span>
                    </span>
                )}
                {enCombat && (
                    <span className="flex items-center gap-1.5 min-w-0 text-slate-300">
                        <Swords size={13} className="text-rose-400 shrink-0" />
                        <span className="text-xs whitespace-nowrap">
                            R{combat.round}
                            {combattantCourant && <span className="text-slate-500"> · {combattantCourant}</span>}
                        </span>
                    </span>
                )}
                {minuteurActif && (
                    <span className={`flex items-center gap-1.5 shrink-0 ${minuteur!.timerRemaining <= 10 ? 'text-rose-400' : 'text-slate-300'}`}>
                        <Timer size={13} className="shrink-0" />
                        <span className="text-xs font-mono tabular-nums">{enMinutes(minuteur!.timerRemaining)}</span>
                    </span>
                )}
            </div>

            {/*
              **Les messages non lus se signalent ici** — demandé par David le
              2026-09-05. Un message reçu pendant qu'on est dans un autre onglet
              n'appelait rien : *une messagerie qu'il faut penser à aller voir
              n'est pas une messagerie, c'est une boîte aux lettres.*

              Le compte disparaît à zéro, comme le reste de cette ligne.
            */}
            {!!messagesNonLus && (
                <button
                    onClick={onVoirLesMessages}
                    title={`${messagesNonLus} message(s) non lu(s)`}
                    aria-label={`${messagesNonLus} message(s) non lu(s)`}
                    className="shrink-0 h-8 px-2.5 rounded-lg border border-accent/40 bg-accent/15 text-accent flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                    <MessageSquare size={13} strokeWidth={2.5} />
                    <span className="text-xs font-black tabular-nums">{messagesNonLus}</span>
                </button>
            )}

            <button
                onPointerDown={commencerLAppui}
                onPointerUp={arreterLAppui}
                onPointerLeave={arreterLAppui}
                onPointerCancel={arreterLAppui}
                onContextMenu={(e) => e.preventDefault()}
                title="Couper le son — maintenir appuyé"
                aria-label="Couper le son — maintenir appuyé"
                className="relative shrink-0 h-8 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center gap-1.5 overflow-hidden select-none touch-none"
            >
                {/* La jauge de l'appui : le geste se voit avancer, donc s'annule. */}
                <span
                    className="absolute inset-y-0 left-0 bg-rose-600/60 pointer-events-none"
                    style={{ width: `${progression * 100}%` }}
                />
                <Power size={14} strokeWidth={2.5} className="relative" />
                <span className="relative text-ui-10 font-black uppercase tracking-widest">Couper le son</span>
            </button>
        </header>
    );
};

export default RemoteStatusBar;
