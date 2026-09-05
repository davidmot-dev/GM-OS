import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, FileText, Folder, RefreshCw, ArrowLeft } from 'lucide-react';
import type { CoffreObsidian } from '../hooks/useRemoteSync';
import type { NoteEntry } from '../../session/useObsidianStore';

/**
 * **Le coffre Obsidian sur la tablette — 2026-09-05.**
 *
 * Demandé par David : *« est-ce que dans les notes, je pourrais avoir accès à la
 * partie Obsidian ? »*.
 *
 * ⛔ **Le coffre ne voyage pas dans la diffusion périodique.** Plus de deux mille
 * notes, et la diffusion part jusqu'à deux fois par seconde. On demande
 * l'arborescence **à l'ouverture de l'onglet**, une fois, et le contenu d'une
 * note **seulement quand on la touche**.
 *
 * L'arborescence est aplatie pour la recherche : *on cherche un nom, on ne
 * descend pas une hiérarchie de dossiers avec le pouce.* Les dossiers restent
 * visibles en navigation, mais la recherche traverse tout.
 */

interface RemoteObsidianProps {
    coffre: CoffreObsidian;
    onCharger: () => void;
    onOuvrir: (chemin: string) => void;
    /** Referme la note et rend la liste. Ne demande rien au meneur. */
    onFermer: () => void;
}

const aplati = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Toutes les notes du coffre, à plat, avec le dossier qui les porte. */
function toutesLesNotes(entrees: NoteEntry[], prefixe = ''): { nom: string; chemin: string; dossier: string }[] {
    return entrees.flatMap((entree) => {
        if (entree.type === 'directory') {
            return toutesLesNotes(entree.children ?? [], prefixe ? `${prefixe} / ${entree.name}` : entree.name);
        }
        return [{ nom: entree.name, chemin: entree.path, dossier: prefixe }];
    });
}

const RemoteObsidian: React.FC<RemoteObsidianProps> = ({ coffre, onCharger, onOuvrir, onFermer }) => {
    const [filtre, setFiltre] = useState('');

    /*
      **On demande une fois, à l'ouverture.** Redemander à chaque rendu ferait
      relire le coffre du meneur en boucle ; ne jamais redemander laisserait un
      arbre périmé. Le bouton de rafraîchissement tranche le reste.

      Une référence plutôt qu'un état : *marquer « c'est fait » n'a rien à
      afficher*, et un `setState` dans un effet relance un rendu pour rien.
    */
    const dejaDemande = useRef(false);
    useEffect(() => {
        if (dejaDemande.current) return;
        dejaDemande.current = true;
        onCharger();
    }, [onCharger]);

    const notes = useMemo(() => toutesLesNotes(coffre.notes), [coffre.notes]);

    const retenues = useMemo(() => {
        const cherche = aplati(filtre.trim());
        if (!cherche) return notes;
        return notes.filter(n => aplati(`${n.nom} ${n.dossier}`).includes(cherche));
    }, [notes, filtre]);

    /* Une note ouverte prend tout l'écran : c'est de la lecture, pas du choix. */
    if (coffre.chemin) {
        const ouverte = notes.find(n => n.chemin === coffre.chemin);
        return (
            <div className="flex flex-col gap-3 h-full">
                <div className="shrink-0 flex items-center gap-2">
                    <button
                        onClick={onFermer}
                        aria-label="Revenir à la liste"
                        className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <span className="min-w-0 flex flex-col">
                        <span className="text-sm font-bold text-slate-200 truncate">{ouverte?.nom ?? coffre.chemin}</span>
                        {ouverte?.dossier && <span className="text-[10px] text-slate-600 truncate">{ouverte.dossier}</span>}
                    </span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                    {coffre.chargement ? (
                        <p className="text-sm italic text-slate-500 text-center py-10">Lecture…</p>
                    ) : coffre.erreur ? (
                        <p className="text-sm italic text-rose-400 text-center py-10">{coffre.erreur}</p>
                    ) : (
                        <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap max-w-[80ch]">
                            {coffre.contenu || 'Cette note est vide.'}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="shrink-0 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    <input
                        type="search"
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        placeholder="Chercher une note…"
                        aria-label="Chercher une note dans le coffre"
                        className="w-full h-9 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-sm text-app-text placeholder:text-slate-600 outline-none focus:border-accent/40"
                    />
                    {filtre && (
                        <button
                            onClick={() => setFiltre('')}
                            aria-label="Effacer la recherche"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={onCharger}
                    aria-label="Recharger le coffre"
                    title="Recharger le coffre"
                    className="shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200"
                >
                    <RefreshCw size={15} className={coffre.chargement ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-white/[0.03] border border-white/5 p-3 flex flex-col gap-1">
                {coffre.chargement && notes.length === 0 ? (
                    <p className="text-sm italic text-slate-500 text-center py-10">Lecture du coffre…</p>
                ) : retenues.length === 0 ? (
                    <p className="text-sm italic text-slate-500 text-center py-10">
                        {filtre
                            ? `Aucune note ne correspond à « ${filtre} ».`
                            : "Le coffre est vide, ou son chemin n'est pas réglé sur le PC."}
                    </p>
                ) : (
                    <>
                        <p className="text-[10px] uppercase tracking-widest text-slate-600 px-1 pb-1">
                            {retenues.length} note{retenues.length > 1 ? 's' : ''}
                            {!filtre && notes.length > 0 && <span className="text-slate-700"> · tout le coffre</span>}
                        </p>
                        {retenues.map((n) => (
                            <button
                                key={n.chemin}
                                onClick={() => onOuvrir(n.chemin)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/20 text-left"
                            >
                                <FileText size={14} className="shrink-0 text-slate-600" />
                                <span className="flex-1 min-w-0 flex flex-col">
                                    <span className="text-xs font-bold text-slate-200 truncate">{n.nom}</span>
                                    {n.dossier && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-600 truncate">
                                            <Folder size={9} className="shrink-0" /> {n.dossier}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default RemoteObsidian;
