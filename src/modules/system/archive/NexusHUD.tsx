/**
 * Nexus-HUD v2 — Interface de progression glassmorphism
 *
 * Overlay plein écran affiché durant les opérations Nexus-OS (export/import).
 * Affiche la phase courante, la progression et un log de messages en temps réel.
 *
 * Design : "Glass Terminal" — noir profond + ambre + scanlines + particules
 *
 * @module system/archive/NexusHUD
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Package,
    Database,
    HardDrive,
    FileArchive,
    Download,
    CheckCircle2,
    AlertCircle,
    Zap,
    Layers,
    ArrowDownToLine,
} from 'lucide-react';
import type { NexusProgress, NexusOperationPhase } from './nexus.types';

// ─────────────────────────────────────────────
// CONFIGURATION DES PHASES
// ─────────────────────────────────────────────

interface PhaseConfig {
    label: string;
    icon: React.FC<{ size?: number; className?: string }>;
    color: string;
    glow: string;
}

const PHASE_CONFIG: Record<NexusOperationPhase, PhaseConfig> = {
    idle: {
        label: 'En attente',
        icon: Package,
        color: 'text-app-text/40',
        glow: 'shadow-none',
    },
    scraping: {
        label: 'Extraction des données',
        icon: Database,
        color: 'text-amber-400',
        glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    },
    harvesting: {
        label: 'Moissonnage des médias',
        icon: HardDrive,
        color: 'text-orange-400',
        glow: 'shadow-[0_0_30px_rgba(251,146,60,0.3)]',
    },
    packaging: {
        label: 'Compression du bundle',
        icon: FileArchive,
        color: 'text-yellow-400',
        glow: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]',
    },
    importing: {
        label: 'Lecture de l\'archive',
        icon: Download,
        color: 'text-sky-400',
        glow: 'shadow-[0_0_30px_rgba(56,189,248,0.3)]',
    },
    remapping: {
        label: 'Relocalisation des médias',
        icon: Layers,
        color: 'text-violet-400',
        glow: 'shadow-[0_0_30px_rgba(167,139,250,0.3)]',
    },
    injecting: {
        label: 'Injection dans la base',
        icon: ArrowDownToLine,
        color: 'text-emerald-400',
        glow: 'shadow-[0_0_30px_rgba(52,211,153,0.3)]',
    },
    done: {
        label: 'Opération terminée',
        icon: CheckCircle2,
        color: 'text-emerald-400',
        glow: 'shadow-[0_0_40px_rgba(52,211,153,0.4)]',
    },
    error: {
        label: 'Erreur',
        icon: AlertCircle,
        color: 'text-rose-400',
        glow: 'shadow-[0_0_30px_rgba(251,113,133,0.3)]',
    },
};

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface NexusHUDProps {
    progress: NexusProgress | null;
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────────

/** Particule décorative animée — utilise CSS vars pour éviter les inline styles */
const PARTICLE_POSITIONS = [10, 25, 40, 55, 70, 85] as const;
const PARTICLE_SIZES = [3, 4, 3, 5, 3, 4] as const;
const PARTICLE_DELAYS = ['0s', '0.7s', '1.4s', '2.1s', '2.8s', '3.5s'] as const;

const ParticleGroup: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLE_POSITIONS.map((x, i) => (
            <div
                key={i}
                className="absolute bottom-0 rounded-full bg-amber-400/20 animate-rise"
                style={{
                    left: `${x}%`,
                    width: PARTICLE_SIZES[i],
                    height: PARTICLE_SIZES[i],
                    animationDelay: PARTICLE_DELAYS[i],
                }}
            />
        ))}
    </div>
);

/** Ligne de scan horizontale animée */
const ScanLine: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent animate-[scan_2s_linear_infinite]" />
    </div>
);

/** Étapes de progression en mini-timeline */
const EXPORT_PHASES: NexusOperationPhase[] = ['scraping', 'harvesting', 'packaging', 'done'];
const IMPORT_PHASES: NexusOperationPhase[] = ['importing', 'remapping', 'injecting', 'done'];

const PhaseTimeline: React.FC<{ currentPhase: NexusOperationPhase; isImport: boolean }> = ({
    currentPhase,
    isImport,
}) => {
    const phases = isImport ? IMPORT_PHASES : EXPORT_PHASES;
    const currentIdx = phases.indexOf(currentPhase);

    return (
        <div className="flex items-center gap-0">
            {phases.map((phase, idx) => {
                const config = PHASE_CONFIG[phase];
                const Icon = config.icon;
                const isActive = idx === currentIdx;
                const isDone = idx < currentIdx || currentPhase === 'done';
                const isError = currentPhase === 'error';

                return (
                    <React.Fragment key={phase}>
                        <div
                            className={`flex flex-col items-center gap-1 transition-all duration-500 ${
                                isActive ? 'scale-110' : 'scale-100'
                            }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 ${
                                    isError && isActive
                                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                        : isDone
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                        : isActive
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                                        : 'bg-app-bg/40 border-app-border/30 text-app-text/20'
                                }`}
                            >
                                {isDone && !isError ? (
                                    <CheckCircle2 size={14} />
                                ) : (
                                    <Icon size={14} />
                                )}
                            </div>
                            <span
                                className={`text-[8px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                                    isActive ? 'text-amber-400' : isDone ? 'text-emerald-400/60' : 'text-app-text/20'
                                }`}
                            >
                                {config.label.split(' ')[0]}
                            </span>
                        </div>
                        {idx < phases.length - 1 && (
                            <div
                                className={`flex-1 h-px mx-2 mb-4 transition-all duration-700 ${
                                    isDone ? 'bg-emerald-500/40' : 'bg-app-border/20'
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

export const NexusHUD: React.FC<NexusHUDProps> = ({ progress }) => {
    const [visible, setVisible] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [isExiting, setIsExiting] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const prevProgressRef = useRef<NexusProgress | null>(null);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Gestion de l'entrée/sortie avec animation
    // On utilise un ref pour tracker l'état précédent de progress
    const prevHadProgressRef = useRef(false);

    if (progress && !prevHadProgressRef.current) {
        // Première apparition : réinitialisation et affichage
        prevHadProgressRef.current = true;
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    } else if (!progress && prevHadProgressRef.current) {
        // Disparition : sortie différée
        prevHadProgressRef.current = false;
    }

    useEffect(() => {
        if (progress) {
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
            setIsExiting(false);
            setLogs([]);
            setVisible(true);
        } else {
            setIsExiting(true);
            exitTimerRef.current = setTimeout(() => {
                setVisible(false);
                setIsExiting(false);
            }, 600);
        }
        return () => {
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!progress]); // Déclenché uniquement quand progress passe null <-> non-null

    // Accumulation des logs
    useEffect(() => {
        if (
            progress?.message &&
            progress.message !== prevProgressRef.current?.message
        ) {
            const newLog = `[${new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })}] ${progress.message}`;
            setLogs((prev) => [...prev.slice(-7), newLog]);
        }
        prevProgressRef.current = progress;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress?.message]); // Déclenché uniquement sur changement de message

    // Auto-scroll des logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (!visible) return null;

    const phase = progress?.phase ?? 'idle';
    const config = PHASE_CONFIG[phase];
    const Icon = config.icon;
    const isImport = phase === 'importing' || phase === 'remapping' || phase === 'injecting';
    const isDone = phase === 'done';
    const isError = phase === 'error';
    const progressValue = progress?.progress ?? 0;

    return (
        // Backdrop overlay
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-600 ${
                isExiting ? 'opacity-0 backdrop-blur-0' : 'opacity-100 backdrop-blur-sm'
            } bg-black/60`}
        >
            {/* Panneau principal */}
            <div
                className={`relative w-[520px] max-w-[95vw] transition-all duration-500 ${
                    isExiting ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
                }`}
            >
                {/* Glow ambiant */}
                <div
                    className={`absolute -inset-4 rounded-3xl blur-2xl opacity-30 transition-all duration-1000 ${
                        isDone
                            ? 'bg-emerald-500'
                            : isError
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                    }`}
                />

                {/* Corps du HUD */}
                <div className="relative bg-black/80 backdrop-blur-2xl border border-amber-500/20 rounded-2xl overflow-hidden">
                    {/* Scanline animée */}
                    <ScanLine />

                    {/* Particules décoratives */}
                    {!isDone && !isError && <ParticleGroup />}

                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            {/* Icône de phase animée */}
                            <div
                                className={`relative w-14 h-14 rounded-xl flex items-center justify-center border ${
                                    isDone
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : isError
                                        ? 'bg-rose-500/10 border-rose-500/30'
                                        : 'bg-amber-500/10 border-amber-500/30'
                                } ${config.glow} transition-all duration-700`}
                            >
                                <Icon
                                    size={26}
                                    className={`${config.color} ${
                                        !isDone && !isError
                                            ? 'animate-[pulse_2s_ease-in-out_infinite]'
                                            : ''
                                    }`}
                                />
                                {/* Anneau de rotation */}
                                {!isDone && !isError && (
                                    <div className="absolute inset-0 rounded-xl border-2 border-amber-400/20 border-t-amber-400/60 animate-spin" />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Zap size={10} className="text-amber-400/60" />
                                    <span className="text-[9px] text-amber-400/60 font-bold uppercase tracking-[0.2em]">
                                        Nexus-OS
                                    </span>
                                </div>
                                <h2 className={`text-lg font-black ${config.color} leading-tight`}>
                                    {config.label}
                                </h2>
                                <p className="text-[11px] text-app-text/40 font-mono mt-0.5 truncate">
                                    {progress?.message ?? '...'}
                                </p>
                            </div>

                            {/* Pourcentage */}
                            <div className="text-right">
                                <span
                                    className={`text-3xl font-black font-mono ${config.color} tabular-nums`}
                                >
                                    {progressValue}
                                </span>
                                <span className={`text-sm font-bold ${config.color} opacity-60`}>%</span>
                            </div>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="px-6 py-4">
                        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                            {/* Track — eslint-disable-next-line react/forbid-dom-props (width dynamique obligatoire) */}
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                                    isDone
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                        : isError
                                        ? 'bg-gradient-to-r from-rose-700 to-rose-500'
                                        : 'bg-gradient-to-r from-amber-600 via-amber-400 to-orange-400'
                                }`}
                                style={{ width: `${progressValue}%` }}
                            />
                            {/* Shimmer */}
                            {!isDone && !isError && progressValue > 0 && (
                                <div
                                    className="absolute inset-y-0 w-20 bg-white/20 animate-shimmer rounded-full"
                                    style={{ left: `${Math.max(0, progressValue - 10)}%` }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Timeline des phases */}
                    <div className="px-6 pb-4">
                        <PhaseTimeline currentPhase={phase} isImport={isImport} />
                    </div>

                    {/* Terminal de logs */}
                    <div className="mx-6 mb-6 bg-black/40 border border-white/5 rounded-xl p-3 h-28 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                                <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                            </div>
                            <span className="text-[8px] text-app-text/20 font-mono uppercase tracking-widest">
                                nexus.log
                            </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            {logs.map((log, idx) => (
                                <p
                                    key={idx}
                                    className={`text-[10px] font-mono leading-relaxed transition-opacity duration-300 ${
                                        idx === logs.length - 1
                                            ? 'text-amber-400/80'
                                            : 'text-app-text/30'
                                    }`}
                                >
                                    {log}
                                </p>
                            ))}
                            {logs.length === 0 && (
                                <p className="text-[10px] font-mono text-app-text/20 italic">
                                    Initialisation...
                                </p>
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* Footer — message de succès ou d'erreur */}
                    {(isDone || isError) && (
                        <div
                            className={`px-6 pb-6 flex items-center gap-2 ${
                                isDone ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                            {isDone ? (
                                <CheckCircle2 size={14} />
                            ) : (
                                <AlertCircle size={14} />
                            )}
                            <span className="text-xs font-bold">
                                {isDone
                                    ? 'Fermeture automatique dans 3 secondes...'
                                    : `Erreur : ${progress?.message ?? 'Inconnue'}`}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NexusHUD;
