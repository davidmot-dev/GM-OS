import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Save, Check, Music, Lightbulb, ImageIcon, Map as MapIcon, Clock, Eye, AlertTriangle } from 'lucide-react';
import { useModalStore } from '../../../stores/useModalStore';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { CadreDeSurcouche, BoutonPrincipal, BoutonSecondaire, Etiquette } from '../../../components/socle';

interface SessionSnapshotModalProps {
    onClose: () => void;
}

/** Une date `AAAA-MM-JJ`, lue à midi : à minuit UTC, un fuseau négatif la ferait reculer d'un jour. */
const dateLongue = (date: string) => {
    const jour = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date(date);
    return Number.isNaN(jour.getTime()) ? date : jour.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * **Capturer l'état** — refonte, L5, cadre commun des surcouches.
 *
 * Une phrase dit ce qu'est un instantané, les modules concernés en pastilles,
 * puis la séance à choisir. Une séance qui en porte déjà un le dit, avec son
 * heure : **il sera remplacé**, et ce n'est pas une décision qui se découvre
 * après coup.
 */
const SessionSnapshotModal: React.FC<SessionSnapshotModalProps> = ({ onClose }) => {
    const { sessions, activeCampaignId, saveSystemSnapshot } = useSessionOSStore();
    const { showCustom } = useModalStore();

    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    useFermetureParEchap(true, onClose, 'Instantané de séance');

    const relevantSessions = sessions
        .filter(s => s.campaignId === activeCampaignId && (s.status === 'planned' || s.status === 'active'))
        .sort((a, b) => b.number - a.number);

    const handleSave = () => {
        if (!selectedSessionId) return;
        saveSystemSnapshot(selectedSessionId);
        setIsSaved(true);
        setTimeout(() => { onClose(); }, 1500);
    };

    const MODULES = [
        { icone: Music, libelle: 'Musique, bruitages et ambiances' },
        { icone: Lightbulb, libelle: 'Light-OS' },
        { icone: ImageIcon, libelle: 'Image-OS' },
        { icone: MapIcon, libelle: 'Cartographie' },
    ];

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <CadreDeSurcouche
                titre="Capturer l'état des modules"
                icone={<Save size={18} />}
                onFermer={onClose}
                largeur="moyen"
                pied={<>
                    <BoutonSecondaire onClick={onClose}>Annuler</BoutonSecondaire>
                    <BoutonPrincipal
                        onClick={handleSave}
                        disabled={!selectedSessionId || isSaved}
                        className={`flex items-center gap-2 disabled:opacity-40 ${isSaved ? '!bg-etat-succes !text-app-bg' : ''}`}
                    >
                        {isSaved ? <><Check size={15} />État capturé</> : <><Save size={15} />Capturer l'état actuel</>}
                    </BoutonPrincipal>
                </>}
            >
                <div className="flex flex-col gap-5 px-5 py-4">
                    <div className="flex flex-col gap-3">
                        <p className="text-sm leading-relaxed text-app-text">
                            Un instantané enregistre l'état de tous vos modules, associé à une séance : au lancement, il se restaure d'un clic.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {MODULES.map(({ icone: Icone, libelle }) => (
                                <span key={libelle} className="flex items-center gap-1.5 rounded-md border border-app-border bg-app-bg/40 px-2.5 py-1 text-xs font-bold text-app-text">
                                    <Icone size={12} className="text-accent" />{libelle}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-ui-10 font-black uppercase tracking-widest text-app-muted">Choisir la séance</p>
                        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto custom-scrollbar">
                            {relevantSessions.map(s => {
                                const choisie = selectedSessionId === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        role="radio"
                                        aria-checked={choisie}
                                        tabIndex={0}
                                        onClick={() => setSelectedSessionId(s.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSessionId(s.id); } }}
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                                            choisie ? 'border-accent bg-accent/10' : 'border-app-border bg-app-bg/40 hover:border-accent/40'
                                        }`}
                                    >
                                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${choisie ? 'border-accent text-accent' : 'border-app-border text-app-muted'}`}>
                                            <Clock size={15} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-app-text">
                                                <span className="font-display font-bold">Séance n°{s.number}</span>
                                                <span className="ml-2 text-xs text-app-muted">{dateLongue(s.date)}</span>
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <Etiquette ton={s.status === 'active' ? 'accent' : 'neutre'}>{s.status === 'active' ? 'En cours' : 'Planifiée'}</Etiquette>
                                                {s.moduleSnapshot ? (
                                                    <span className="flex items-center gap-1 rounded border border-etat-alerte/40 bg-etat-alerte/10 px-2 py-0.5 text-ui-10 font-bold text-etat-alerte">
                                                        <AlertTriangle size={11} />
                                                        Instantané du {new Date(s.moduleSnapshot.timestamp).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — sera remplacé
                                                    </span>
                                                ) : (
                                                    <span className="text-ui-10 text-app-muted">Aucun instantané</span>
                                                )}
                                            </div>
                                        </div>
                                        {s.moduleSnapshot && !isSaved && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    showCustom('snapshot-viewer', { snapshot: s.moduleSnapshot, sessionName: `Séance n°${s.number}` });
                                                }}
                                                className="flex shrink-0 items-center gap-1.5 rounded-md border border-app-border px-2.5 py-1.5 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-accent"
                                                title="Voir le contenu de l'instantané"
                                            >
                                                <Eye size={12} />Voir
                                            </button>
                                        )}
                                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${choisie ? 'border-accent bg-accent text-app-on-accent' : 'border-app-border'}`}>
                                            {choisie && <Check size={13} />}
                                        </span>
                                    </div>
                                );
                            })}
                            {relevantSessions.length === 0 && (
                                <p className="rounded-lg border border-dashed border-app-border py-8 text-center text-xs text-app-muted">
                                    Aucune séance planifiée ou en cours — créez-en une d'abord.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CadreDeSurcouche>
        </div>
    );
};

export default SessionSnapshotModal;
