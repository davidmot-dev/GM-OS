/**
 * Nexus Conflict Resolver — Modal de gestion des conflits d'import
 *
 * Affiché lorsqu'un bundle `.gmos` importé contient une campagne
 * dont l'ID existe déjà dans le store local.
 *
 * L'utilisateur choisit :
 *  - Remplacer : écrase les données existantes
 *  - Cloner    : importe la campagne avec de nouveaux UUIDs (coexistence)
 *  - Annuler   : abandonne l'import, aucun changement
 *
 * Design : "Glass Terminal" — cohérent avec NexusHUD.
 *
 * @module system/archive/NexusConflictResolver
 */

import React from 'react';
import {
    AlertTriangle,
    RefreshCw,
    Copy,
    X,
    Users,
    BookOpen,
    Calendar,
    Zap,
    Shield,
} from 'lucide-react';
import type { NexusConflict, NexusConflictResolution, NexusConflictStrategy } from './nexus.types';

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface NexusConflictResolverProps {
    /** Liste des conflits détectés (toujours au moins 1 si le composant est affiché) */
    conflicts: NexusConflict[];
    /** Appelé avec la stratégie choisie par l'utilisateur */
    onResolve: (resolution: NexusConflictResolution) => void;
}

// ─────────────────────────────────────────────
// CONFIGURATION DES STRATÉGIES
// ─────────────────────────────────────────────

interface StrategyConfig {
    label: string;
    description: string;
    icon: React.FC<{ size?: number; className?: string }>;
    buttonClass: string;
    iconClass: string;
    badgeClass: string;
}

const STRATEGY_CONFIG: Record<Exclude<NexusConflictStrategy, 'cancel'>, StrategyConfig> = {
    replace: {
        label: 'Remplacer',
        description: 'Écrase la campagne existante avec les données du bundle. Irréversible.',
        icon: RefreshCw,
        buttonClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50',
        iconClass: 'text-amber-400',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    clone: {
        label: 'Cloner',
        description: 'Importe la campagne avec de nouveaux identifiants. Les deux versions coexistront.',
        icon: Copy,
        buttonClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50',
        iconClass: 'text-sky-400',
        badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
};

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : Carte de conflit
// ─────────────────────────────────────────────

const ConflictCard: React.FC<{ conflict: NexusConflict }> = ({ conflict }) => {
    const exportDate = new Date(conflict.exportedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-3">
            {/* Header du conflit */}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle size={14} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-ui-10 text-rose-400/60 font-bold uppercase tracking-widest mb-0.5">
                        Conflit détecté
                    </p>
                    <p className="text-sm font-bold text-app-text truncate">
                        {conflict.incomingName}
                    </p>
                </div>
            </div>

            {/* Comparatif Existant vs Bundle */}
            <div className="grid grid-cols-2 gap-2">
                {/* Version locale */}
                <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
                    <p className="text-ui-8 text-app-text/30 font-bold uppercase tracking-widest mb-1">
                        Version locale
                    </p>
                    <p className="text-xs font-semibold text-app-text/80 truncate">
                        {conflict.existingName}
                    </p>
                    <p className="text-ui-9 text-app-text/40 font-mono mt-1 truncate">
                        ID: {conflict.existingId.slice(0, 16)}…
                    </p>
                </div>
                {/* Bundle importé */}
                <div className="bg-amber-500/5 rounded-lg p-2.5 border border-amber-500/15">
                    <p className="text-ui-8 text-amber-400/50 font-bold uppercase tracking-widest mb-1">
                        Bundle importé
                    </p>
                    <p className="text-xs font-semibold text-amber-400/90 truncate">
                        {conflict.incomingName}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <Calendar size={8} className="text-amber-400/40" />
                        <p className="text-ui-9 text-amber-400/40 font-mono truncate">
                            {exportDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats du bundle */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <Users size={10} className="text-app-text/30" />
                    <span className="text-ui-10 text-app-text/40">
                        {conflict.entityCount} entités
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <BookOpen size={10} className="text-app-text/30" />
                    <span className="text-ui-10 text-app-text/40">
                        {conflict.sessionCount} sessions
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

export const NexusConflictResolver: React.FC<NexusConflictResolverProps> = ({
    conflicts,
    onResolve,
}) => {
    const handleStrategy = (strategy: NexusConflictStrategy) => {
        onResolve({ strategy });
    };

    return (
        /* Backdrop overlay */
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]">
            {/* Glow ambiant */}
            <div className="absolute w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Panneau principal */}
            <div className="relative w-[480px] max-w-[95vw] bg-black/85 backdrop-blur-2xl border border-rose-500/20 rounded-2xl overflow-hidden shadow-2xl animate-[slideUp_250ms_ease-out]">

                {/* Scanline déco */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                            <Shield size={18} className="text-rose-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <Zap size={9} className="text-rose-400/50" />
                                <span className="text-ui-9 text-rose-400/50 font-bold uppercase tracking-[0.2em]">
                                    Nexus-OS · Import
                                </span>
                            </div>
                            <h2 className="text-base font-black text-rose-400 leading-tight">
                                Conflit de données détecté
                            </h2>
                        </div>
                    </div>
                    <p className="text-ui-11 text-app-text/40 leading-relaxed mt-2">
                        {conflicts.length === 1
                            ? 'Une campagne dans ce bundle possède le même identifiant qu\'une campagne déjà présente dans votre bibliothèque.'
                            : `${conflicts.length} campagnes en conflit ont été détectées. Choisissez comment procéder.`}
                    </p>
                </div>

                {/* Corps : liste des conflits */}
                <div className="px-6 py-4 space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                    {conflicts.map((conflict) => (
                        <ConflictCard key={conflict.existingId} conflict={conflict} />
                    ))}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 space-y-2.5">
                    <p className="text-ui-10 text-app-text/30 font-bold uppercase tracking-widest mb-3">
                        Choisir une action
                    </p>

                    {/* Remplacer */}
                    <button
                        id="nexus-conflict-replace"
                        onClick={() => handleStrategy('replace')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${STRATEGY_CONFIG.replace.buttonClass}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <RefreshCw size={14} className={STRATEGY_CONFIG.replace.iconClass} />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-xs font-bold">Remplacer</p>
                            <p className="text-ui-10 text-app-text/40 mt-0.5 leading-tight">
                                {STRATEGY_CONFIG.replace.description}
                            </p>
                        </div>
                        <span className={`text-ui-9 font-bold px-2 py-0.5 rounded-full border ${STRATEGY_CONFIG.replace.badgeClass}`}>
                            Écraser
                        </span>
                    </button>

                    {/* Cloner */}
                    <button
                        id="nexus-conflict-clone"
                        onClick={() => handleStrategy('clone')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${STRATEGY_CONFIG.clone.buttonClass}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                            <Copy size={14} className={STRATEGY_CONFIG.clone.iconClass} />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-xs font-bold">Cloner</p>
                            <p className="text-ui-10 text-app-text/40 mt-0.5 leading-tight">
                                {STRATEGY_CONFIG.clone.description}
                            </p>
                        </div>
                        <span className={`text-ui-9 font-bold px-2 py-0.5 rounded-full border ${STRATEGY_CONFIG.clone.badgeClass}`}>
                            Sûr
                        </span>
                    </button>

                    {/* Annuler */}
                    <button
                        id="nexus-conflict-cancel"
                        onClick={() => handleStrategy('cancel')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 text-app-text/40 hover:border-white/10 hover:text-app-text/60 transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                            <X size={14} />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-xs font-bold">Annuler</p>
                            <p className="text-ui-10 text-app-text/30 mt-0.5">
                                Abandonne l'import. Aucune modification effectuée.
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NexusConflictResolver;
