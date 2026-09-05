import React from 'react';
import { Users, Crown, ArrowRightLeft, Hand, ChevronRight, Ban } from 'lucide-react';
import { gmToast } from '../../../stores/useToastStore';
import { useCombatStore } from '../useCombatStore';
import { useOrdreDuTourStore } from '../useOrdreDuTourStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import {
    campDe,
    candidats,
    roundTermine,
    retentionPossible,
    ouvertureGratuite,
    autreCamp,
    type Camp,
    type DescripteurDInitiative,
} from '../logic/OrdreDuTour';
import type { RessourceDeTable } from '../../table/RessourcesDeTable';

/**
 * L'ordre du tour quand il alterne entre les camps.
 *
 * **Ce qu'il remplace.** Le bouton « Jet Système » lançait une formule par
 * combattant puis triait la liste. Chez Dune il n'y a rien à lancer et rien à
 * trier : le meneur désigne qui ouvre, et la main se passe — ou se garde, en
 * payant. Ce panneau est donc la procédure du livre, dans son ordre.
 *
 * **Il ne refuse presque rien.** Une rétention au-delà du plafond est barrée
 * avec son motif écrit, parce que c'est une règle chiffrée du système ; tout le
 * reste appartient au meneur. L'outil suit l'état, il n'arbitre pas.
 */
interface PanneauDAlternanceProps {
    descripteur: DescripteurDInitiative;
    /** Pour prélever la rétention. Absentes, les gestes sont gratuits. */
    campaignId?: string;
    ressourcesDeTable?: RessourceDeTable[];
}

const NomDuCamp: React.FC<{ camp: Camp }> = ({ camp }) => (
    <span className="inline-flex items-center gap-1.5 font-black uppercase tracking-widest text-ui-10">
        {camp === 'joueurs' ? <Users size={12} /> : <Crown size={12} />}
        {camp === 'joueurs' ? 'Joueurs' : 'Adversaires'}
    </span>
);

const PanneauDAlternance: React.FC<PanneauDAlternanceProps> = ({
    descripteur, campaignId, ressourcesDeTable,
}) => {
    const combattants = useCombatStore(s => s.combatants);
    const { tour, ouvrir, faireAgir, ceder, conserver, roundSuivant, clore } = useOrdreDuTourStore();
    const depenser = useRessourcesDeTableStore(s => s.depenser);

    const monnaie = campaignId && ressourcesDeTable?.length ? { campaignId, ressourcesDeTable } : null;

    /**
     * Prélève un coût sur les réserves de table et dit ce qu'il a produit.
     *
     * Chez Dune, l'Impulsion qui manque devient de la Menace : la dépense
     * aboutit toujours, mais pas toujours au même endroit. Le taire ferait
     * monter la réserve du meneur sans que personne ne le voie.
     */
    const payer = (montant: number, ressource: string) => {
        if (!monnaie) return;
        for (const a of depenser(monnaie.campaignId, monnaie.ressourcesDeTable, ressource, montant).avertissements) {
            gmToast(a, 'warning');
        }
    };

    if (combattants.length === 0) return null;

    // ── Aucun round ouvert : le meneur désigne qui commence ──────────────────
    if (!tour) {
        return (
            <div className="space-y-2">
                <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40">
                    Ordre d'action — alternance
                </p>
                <p className="text-ui-11 text-app-text/40 leading-snug">
                    Rien ne se tire et rien ne se trie : désignez le camp qui ouvre le conflit.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {(['joueurs', 'adversaires'] as Camp[]).map(camp => (
                        <button
                            key={camp}
                            onClick={() => ouvrir(camp)}
                            className="px-3 py-2 rounded-xl border border-app-border/40 hover:border-accent/50 hover:text-accent transition-colors text-app-text/70"
                            title={camp === 'adversaires'
                                ? "Le livre demande deux points de Menace pour ouvrir sur un PNJ sans justification narrative — à la main du meneur"
                                : undefined}
                        >
                            <NomDuCamp camp={camp} />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const fini = roundTermine(combattants, tour);
    const retention = retentionPossible(descripteur, combattants, tour);
    const aJouer = candidats(combattants, tour);
    /** Le repli du livre : le camp actif n'a plus personne, l'autre finit le round. */
    const replisurAutreCamp = aJouer.length > 0 && campDe(aJouer[0]) !== tour.campActif;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40">
                    Round {tour.round}
                </p>
                <button
                    onClick={clore}
                    className="text-ui-9 font-bold uppercase tracking-widest text-app-text/30 hover:text-red-400 transition-colors"
                >
                    Clore
                </button>
            </div>

            {/* ── Le round est fini : qui ouvre le suivant ─────────────────── */}
            {fini ? (
                <div className="space-y-2 rounded-xl border border-accent/20 bg-accent/5 p-3">
                    <p className="text-ui-11 text-app-text/60 leading-snug">
                        Tout le monde a agi. Le dernier à jouer désigne le camp qui ouvre — ou paie
                        pour que le sien débute.
                    </p>
                    {(() => {
                        const gratuit = ouvertureGratuite(combattants, tour);
                        const payant = autreCamp(gratuit);
                        const cout = descripteur.coutDOuverture;
                        return (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => roundSuivant(gratuit)}
                                    className="px-3 py-2 rounded-lg border border-app-border/40 hover:border-accent/50 hover:text-accent transition-colors text-app-text/70"
                                >
                                    <NomDuCamp camp={gratuit} />
                                    <span className="block text-ui-9 font-bold text-app-text/30 mt-0.5">gratuit</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (cout) payer(cout.montant, cout.ressource);
                                        roundSuivant(payant);
                                    }}
                                    className="px-3 py-2 rounded-lg border border-amber-500/30 hover:border-amber-400/60 text-amber-200/80 transition-colors"
                                >
                                    <NomDuCamp camp={payant} />
                                    {cout && (
                                        <span className="block text-ui-9 font-bold text-amber-300/60 mt-0.5">
                                            {cout.montant} {cout.ressource}
                                        </span>
                                    )}
                                </button>
                            </div>
                        );
                    })()}
                </div>
            ) : tour.enAttenteDeDecision ? (
                /* ── Une action vient d'être résolue : céder ou garder ──────── */
                <div className="space-y-2 rounded-xl border border-accent/20 bg-accent/5 p-3">
                    <p className="text-ui-11 text-app-text/60 leading-snug">
                        Action résolue. <NomDuCamp camp={tour.campActif} /> cède la main, ou la garde.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={ceder}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-app-border/40 hover:border-accent/50 hover:text-accent transition-colors text-ui-10 font-black uppercase tracking-widest text-app-text/70"
                        >
                            <ArrowRightLeft size={12} /> Céder
                        </button>

                        {/*
                            Le motif du refus est écrit. Un bouton grisé sans
                            explication est une énigme, et le meneur ne doit pas
                            avoir à rouvrir le livre pour comprendre son écran.
                        */}
                        <button
                            onClick={() => {
                                if (!retention.possible) return;
                                if (retention.cout) payer(retention.cout.montant, retention.cout.ressource);
                                conserver();
                            }}
                            disabled={!retention.possible}
                            title={retention.raison}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-colors text-ui-10 font-black uppercase tracking-widest ${
                                retention.possible
                                    ? 'border-amber-500/30 hover:border-amber-400/60 text-amber-200/80'
                                    : 'border-app-border/20 text-app-text/20 cursor-not-allowed'
                            }`}
                        >
                            {retention.possible ? <Hand size={12} /> : <Ban size={12} />} Conserver
                            {retention.possible && retention.cout && (
                                <span className="font-mono normal-case tracking-normal">
                                    ({retention.cout.montant} {retention.cout.ressource})
                                </span>
                            )}
                        </button>
                    </div>
                    {!retention.possible && retention.raison && (
                        <p className="text-ui-10 text-amber-300/60 leading-snug">{retention.raison}</p>
                    )}
                </div>
            ) : (
                /* ── La main est à un camp : il désigne son intervenant ─────── */
                <div className="space-y-2">
                    <p className="flex items-center gap-2 text-ui-11 text-app-text/50">
                        La main est à <NomDuCamp camp={tour.campActif} />
                        {tour.activationsConsecutives > 0 && (
                            <span className="font-mono text-ui-10 text-amber-300/60">
                                {tour.activationsConsecutives} d'affilée
                            </span>
                        )}
                    </p>

                    {replisurAutreCamp && (
                        <p className="text-ui-10 text-app-text/40 leading-snug">
                            Ce camp n'a plus personne à faire agir : les combattants restants
                            terminent le round.
                        </p>
                    )}

                    <div className="space-y-1">
                        {aJouer.map(c => (
                            <button
                                key={c.id}
                                onClick={() => faireAgir(c.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-app-border/30 hover:border-accent/50 hover:bg-accent/5 transition-colors text-left"
                            >
                                <ChevronRight size={12} className="text-app-text/30" />
                                <span className="text-xs font-bold text-app-text/80 truncate">{c.name}</span>
                                <span className="ml-auto text-ui-9 font-black uppercase tracking-widest text-app-text/25">
                                    {campDe(c) === 'joueurs' ? 'joueurs' : 'adversaires'}
                                </span>
                            </button>
                        ))}
                    </div>

                    <p className="text-ui-10 text-app-text/25">
                        {combattants.length - tour.ontAgi.length} sur {combattants.length} n'ont pas encore agi.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PanneauDAlternance;
