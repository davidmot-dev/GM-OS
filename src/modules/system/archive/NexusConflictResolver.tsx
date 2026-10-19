/**
 * Nexus Conflict Resolver — Modal de gestion des conflits d'import
 *
 * Affiché lorsqu'un bundle `.gmos` importé contient une campagne
 * dont l'ID existe déjà dans le store local — et, depuis le lot E4 du chantier
 * des archives (2026-10-19), pour **toute** campagne qui arrive : rejouer se
 * fait le plus souvent sans conflit (campagne purgée, autre poste).
 *
 * L'utilisateur choisit :
 *  - Remplacer : écrase les données existantes (sans conflit : « Importer telle quelle »)
 *  - Cloner    : importe la campagne avec de nouveaux UUIDs (coexistence)
 *  - Rejouer   : une copie dont le parcours est effacé (campagnes seulement)
 *  - Annuler   : abandonne l'import, aucun changement
 *
 * Design : "Glass Terminal" — cohérent avec NexusHUD.
 *
 * @module system/archive/NexusConflictResolver
 */

import React, { useState } from 'react';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import {
    AlertTriangle,
    RefreshCw,
    Copy,
    X,
    RotateCcw,
    Download,
    Users,
    BookOpen,
    Calendar,
    Zap,
    Shield,
} from 'lucide-react';
import type { ArriveeDUneCampagne, NexusConflict, NexusConflictResolution, NexusConflictStrategy } from './nexus.types';

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface NexusConflictResolverProps {
    /** Liste des conflits détectés — vide quand une campagne arrive sans en écraser aucune */
    conflicts: NexusConflict[];
    /** La campagne de l'archive, quand c'en est une : elle seule peut se rejouer */
    arrivee?: ArriveeDUneCampagne;
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
        buttonClass: 'bg-etat-alerte/10 border-etat-alerte/30 text-etat-alerte hover:bg-etat-alerte/20 hover:border-etat-alerte/50',
        iconClass: 'text-etat-alerte',
        badgeClass: 'bg-etat-alerte/10 text-etat-alerte border-etat-alerte/20',
    },
    clone: {
        label: 'Cloner',
        description: 'Importe la campagne avec de nouveaux identifiants. Les deux versions coexistront.',
        icon: Copy,
        buttonClass: 'bg-etat-info/10 border-etat-info/30 text-etat-info hover:bg-etat-info/20 hover:border-etat-info/50',
        iconClass: 'text-etat-info',
        badgeClass: 'bg-etat-info/10 text-etat-info border-etat-info/20',
    },
    rejouer: {
        label: 'Rejouer',
        description: 'Une nouvelle partie : préparation et personnages gardés ; séances, journaux et parcours effacés ; réserves de table au départ.',
        icon: RotateCcw,
        buttonClass: 'bg-etat-succes/10 border-etat-succes/30 text-etat-succes hover:bg-etat-succes/20 hover:border-etat-succes/50',
        iconClass: 'text-etat-succes',
        badgeClass: 'bg-etat-succes/10 text-etat-succes border-etat-succes/20',
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
        <div className="bg-etat-danger/5 border border-etat-danger/20 rounded-xl p-4 space-y-3">
            {/* Header du conflit */}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-etat-danger/10 border border-etat-danger/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle size={14} className="text-etat-danger" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-ui-10 text-etat-danger/60 font-bold uppercase tracking-widest mb-0.5">
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
                <div className="bg-app-bg/30 rounded-lg p-2.5 border border-app-text/5">
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
                <div className="bg-accent/5 rounded-lg p-2.5 border border-accent/15">
                    <p className="text-ui-8 text-accent/50 font-bold uppercase tracking-widest mb-1">
                        Bundle importé
                    </p>
                    <p className="text-xs font-semibold text-accent/90 truncate">
                        {conflict.incomingName}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <Calendar size={8} className="text-accent/40" />
                        <p className="text-ui-9 text-accent/40 font-mono truncate">
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
    arrivee,
    onResolve,
}) => {
    const sansConflit = conflicts.length === 0;
    // Lot E5 : une archive des médias demande seulement la campagne qui les reçoit.
    const pourMedias = arrivee?.genre === 'medias';
    const [cible, setCible] = useState(arrivee?.campagneParDefaut ?? '');
    /*
      **Le rouge est réservé au conflit** (2026-10-19). Depuis que toute campagne
      qui arrive demande comment l'importer, la fenêtre s'ouvre le plus souvent
      sans rien écraser : un titre « danger » y criait au loup. Sans conflit, elle
      prend la teinte d'information. Des classes écrites en entier : Tailwind ne
      voit pas les noms fabriqués.
    */
    const ton = sansConflit
        ? { halo: 'bg-etat-info/10', bord: 'border-etat-info/20', ligne: 'via-etat-info/40', pastille: 'bg-etat-info/10 border-etat-info/30', icone: 'text-etat-info', discret: 'text-etat-info/50', titre: 'text-etat-info' }
        : { halo: 'bg-etat-danger/10', bord: 'border-etat-danger/20', ligne: 'via-etat-danger/40', pastille: 'bg-etat-danger/10 border-etat-danger/30', icone: 'text-etat-danger', discret: 'text-etat-danger/50', titre: 'text-etat-danger' };
    const IconeDuTitre = sansConflit ? Download : Shield;
    const handleStrategy = (strategy: NexusConflictStrategy) => {
        onResolve(pourMedias ? { strategy, campagneCible: cible } : { strategy });
    };

    /*
      **Échap annule l'import, il ne choisit aucune stratégie.** `replace`
      écrase une campagne existante et le dit en toutes lettres : *irréversible*.
      La seule voie qu'une touche frappée par réflexe peut prendre est celle qui
      n'écrit rien.
    */
    useFermetureParEchap(true, () => handleStrategy('cancel'), 'Conflit Nexus');

    return (
        /* Backdrop overlay */
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-app-bg/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]">
            {/* Glow ambiant */}
            <div className={`absolute w-96 h-96 ${ton.halo} rounded-full blur-3xl pointer-events-none`} />

            {/* Panneau principal */}
            <div className={`relative w-[480px] max-w-[95vw] bg-app-bg/85 backdrop-blur-2xl border ${ton.bord} rounded-2xl overflow-hidden shadow-2xl animate-[slideUp_250ms_ease-out]`}>

                {/* Scanline déco */}
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${ton.ligne} to-transparent`} />

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-app-text/5">
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`w-10 h-10 rounded-xl border ${ton.pastille} flex items-center justify-center`}>
                            <IconeDuTitre size={18} className={ton.icone} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <Zap size={9} className={ton.discret} />
                                <span className={`text-ui-9 ${ton.discret} font-bold uppercase tracking-[0.2em]`}>
                                    Nexus-OS · Import
                                </span>
                            </div>
                            <h2 className={`text-base font-black ${ton.titre} leading-tight`}>
                                {pourMedias ? 'Importer des médias' : sansConflit ? 'Importer une campagne' : 'Conflit de données détecté'}
                            </h2>
                        </div>
                    </div>
                    <p className="text-ui-11 text-app-text/40 leading-relaxed mt-2">
                        {pourMedias
                            ? `Les médias de « ${arrivee?.nom ?? 'Campagne'} ». Dans quelle campagne les ranger ? Ambiances, playlists et tuiles y sont copiées ; un média déjà présent reçoit seulement son étiquette.`
                            : sansConflit
                            ? `« ${arrivee?.nom ?? 'Campagne'} » — ${arrivee?.entites ?? 0} entités, ${arrivee?.seances ?? 0} séances. Comment l'importer ?`
                            : conflicts.length === 1
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

                {/* Lot E6 : l'aperçu — ce que l'archive apporte, compté comme le bilan le comptera. */}
                {!!arrivee?.contenu?.length && (
                    <div className="px-6 pb-4">
                        <p className="text-ui-10 text-app-text/30 font-bold uppercase tracking-widest mb-2">
                            Ce que l'archive apporte
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {arrivee.contenu.map(l => (
                                <span key={l.libelle} className="text-ui-10 text-app-text/60 bg-app-text/5 border border-app-text/10 rounded-full px-2 py-0.5">
                                    {l.nombre} {l.libelle}
                                </span>
                            ))}
                            {!!arrivee.medias && (
                                <span className="text-ui-10 text-app-text/60 bg-app-text/5 border border-app-text/10 rounded-full px-2 py-0.5">
                                    {arrivee.medias} {pourMedias ? 'fichiers' : 'médias'}
                                </span>
                            )}
                        </div>
                        <p className="text-ui-10 text-app-text/30 mt-2 leading-snug">
                            Une sauvegarde automatique est écrite avant que rien n'entre.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="px-6 pb-6 space-y-2.5">
                    <p className="text-ui-10 text-app-text/30 font-bold uppercase tracking-widest mb-3">
                        Choisir une action
                    </p>

                    {/* Archive des médias : la campagne qui les reçoit (lot E5) */}
                    {pourMedias && (
                        <div className="space-y-2.5">
                            <select
                                id="nexus-medias-cible"
                                value={cible}
                                onChange={e => setCible(e.target.value)}
                                className="w-full rounded-xl border border-app-text/10 bg-app-bg/60 px-3 py-2 text-xs text-app-text"
                            >
                                {(arrivee?.campagnes ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button
                                id="nexus-import-medias"
                                onClick={() => handleStrategy('replace')}
                                disabled={!cible}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 disabled:opacity-30 ${STRATEGY_CONFIG.clone.buttonClass}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-etat-info/10 border border-etat-info/20 flex items-center justify-center flex-shrink-0">
                                    <Download size={14} className={STRATEGY_CONFIG.clone.iconClass} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-xs font-bold">Importer dans cette campagne</p>
                                    <p className="text-ui-10 text-app-text/40 mt-0.5 leading-tight">
                                        {(arrivee?.campagnes ?? []).length === 0 ? 'Aucune campagne sur ce poste : créez-en une d\'abord.' : 'Rien n\'est retiré à une autre campagne.'}
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Sans conflit : importer telle quelle (la stratégie `replace` n'écrase rien) */}
                    {sansConflit && !pourMedias && (
                        <button
                            id="nexus-import-tel-quel"
                            onClick={() => handleStrategy('replace')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${STRATEGY_CONFIG.clone.buttonClass}`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-etat-info/10 border border-etat-info/20 flex items-center justify-center flex-shrink-0">
                                <Download size={14} className={STRATEGY_CONFIG.clone.iconClass} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-xs font-bold">Importer telle quelle</p>
                                <p className="text-ui-10 text-app-text/40 mt-0.5 leading-tight">
                                    La campagne revient comme elle était, séances et parcours compris.
                                </p>
                            </div>
                        </button>
                    )}

                    {/* Remplacer */}
                    {!sansConflit && <button
                        id="nexus-conflict-replace"
                        onClick={() => handleStrategy('replace')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${STRATEGY_CONFIG.replace.buttonClass}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-etat-alerte/10 border border-etat-alerte/20 flex items-center justify-center flex-shrink-0">
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
                    </button>}

                    {/* Cloner */}
                    {!sansConflit && <button
                        id="nexus-conflict-clone"
                        onClick={() => handleStrategy('clone')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${STRATEGY_CONFIG.clone.buttonClass}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-etat-info/10 border border-etat-info/20 flex items-center justify-center flex-shrink-0">
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
                    </button>}

                    {/* Rejouer — une campagne seulement (lot E4) */}
                    {arrivee && !pourMedias && (
                        <button
                            id="nexus-conflict-rejouer"
                            onClick={() => handleStrategy('rejouer')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${STRATEGY_CONFIG.rejouer.buttonClass}`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-etat-succes/10 border border-etat-succes/20 flex items-center justify-center flex-shrink-0">
                                <RotateCcw size={14} className={STRATEGY_CONFIG.rejouer.iconClass} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-xs font-bold">{STRATEGY_CONFIG.rejouer.label}</p>
                                <p className="text-ui-10 text-app-text/40 mt-0.5 leading-tight">
                                    {STRATEGY_CONFIG.rejouer.description}
                                </p>
                            </div>
                            <span className={`text-ui-9 font-bold px-2 py-0.5 rounded-full border ${STRATEGY_CONFIG.rejouer.badgeClass}`}>
                                Copie
                            </span>
                        </button>
                    )}

                    {/* Annuler */}
                    <button
                        id="nexus-conflict-cancel"
                        onClick={() => handleStrategy('cancel')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-app-text/5 text-app-text/40 hover:border-app-text/10 hover:text-app-text/60 transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-lg bg-app-text/5 border border-app-text/5 flex items-center justify-center flex-shrink-0">
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
