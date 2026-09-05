import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, FileText, Folder, ChevronRight, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import type { CoffreObsidian } from '../hooks/useRemoteSync';
import { toutesLesNotes, contenuDuChemin, range } from '../arbreDuCoffre';

/**
 * **Le coffre Obsidian sur la tablette — 2026-09-05.**
 *
 * Demandé par David : *« est-ce que dans les notes, je pourrais avoir accès à la
 * partie Obsidian ? »*, puis, en le voyant : *« peux-tu respecter le découpage »*.
 *
 * ⛔ **La première version aplatissait tout.** Les deux mille notes arrivaient en
 * une seule liste, le dossier réduit à un sous-titre — *un coffre rangé depuis
 * des années dont le rangement était jeté à l'affichage.* Les dossiers sont un
 * classement que le meneur a fait ; les ignorer lui demande de le refaire de
 * tête à chaque consultation.
 *
 * On descend donc dossier par dossier, avec un fil d'Ariane pour remonter.
 *
 * ⚠️ **Sauf en recherche.** Chercher un nom traverse **tout le coffre** et rend
 * une liste plate, chaque résultat portant son chemin : *quand on cherche, on ne
 * sait pas où c'est rangé — c'est même souvent pour cela qu'on cherche.*
 *
 * ⛔ Rappel du transport : le coffre **ne voyage pas dans la diffusion
 * périodique** (deux mille notes, deux diffusions par seconde). L'arborescence
 * est demandée à l'ouverture, le contenu d'une note quand on la touche.
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

const RemoteObsidian: React.FC<RemoteObsidianProps> = ({ coffre, onCharger, onOuvrir, onFermer }) => {
    const [filtre, setFiltre] = useState('');
    const [chemin, setChemin] = useState<string[]>([]);

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

    const toutes = useMemo(() => toutesLesNotes(coffre.notes), [coffre.notes]);

    const resultats = useMemo(() => {
        const cherche = aplati(filtre.trim());
        if (!cherche) return null;
        return toutes.filter(n => aplati(`${n.nom} ${n.dossier}`).includes(cherche));
    }, [toutes, filtre]);

    /*
      **Un chemin devenu invalide retombe à la racine, au rendu.**

      Un dossier renommé sur le PC pendant qu'on le regardait laisserait sinon un
      écran vide sans explication. Le repli se **calcule** plutôt que de passer
      par un effet : *corriger un état depuis un effet demande un rendu de plus
      pour dire ce qu'on savait déjà.*
    */
    const niveauBrut = useMemo(() => contenuDuChemin(coffre.notes, chemin), [coffre.notes, chemin]);
    const cheminEffectif = niveauBrut === null ? [] : chemin;
    const niveau = niveauBrut ?? coffre.notes;

    // ── Une note ouverte prend tout l'écran : c'est de la lecture. ──────────
    if (coffre.chemin) {
        const ouverte = toutes.find(n => n.chemin === coffre.chemin);
        return (
            <div className="flex flex-col gap-3 h-full">
                <div className="shrink-0 flex items-center gap-2">
                    <button
                        onClick={onFermer}
                        aria-label="Revenir à la liste"
                        className="w-9 h-9 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <span className="min-w-0 flex flex-col">
                        <span className="text-sm font-bold text-slate-200 truncate">{ouverte?.nom ?? coffre.chemin}</span>
                        {ouverte?.dossier && <span className="text-ui-10 text-slate-600 truncate">{ouverte.dossier}</span>}
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

    const enRecherche = resultats !== null;
    const contenu = range(niveau);

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="shrink-0 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    <input
                        type="search"
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        placeholder="Chercher dans tout le coffre…"
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

            {/*
              **Le fil d'Ariane.** Chaque niveau est touchable — *on remonte de
              trois dossiers d'un geste, au lieu d'appuyer trois fois sur retour.*
              Caché pendant une recherche, qui ne se tient dans aucun dossier.
            */}
            {!enRecherche && cheminEffectif.length > 0 && (
                <nav aria-label="Chemin dans le coffre" className="shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar text-ui-11">
                    <button
                        onClick={() => setChemin([])}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    >
                        <Home size={12} /> Coffre
                    </button>
                    {cheminEffectif.map((nom, i) => (
                        <React.Fragment key={`${nom}-${i}`}>
                            <ChevronRight size={12} className="shrink-0 text-slate-700" />
                            <button
                                onClick={() => setChemin(cheminEffectif.slice(0, i + 1))}
                                className={`shrink-0 px-2 py-1 rounded-lg hover:bg-white/5 ${i === cheminEffectif.length - 1 ? 'text-accent font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {nom}
                            </button>
                        </React.Fragment>
                    ))}
                </nav>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-white/[0.03] border border-white/5 p-3 flex flex-col gap-1">
                {coffre.chargement && coffre.notes.length === 0 ? (
                    <p className="text-sm italic text-slate-500 text-center py-10">Lecture du coffre…</p>
                ) : enRecherche ? (
                    resultats!.length === 0 ? (
                        <p className="text-sm italic text-slate-500 text-center py-10">
                            Aucune note ne correspond à « {filtre} ».
                        </p>
                    ) : (
                        <>
                            <p className="text-ui-10 uppercase tracking-widest text-slate-600 px-1 pb-1">
                                {resultats!.length} note{resultats!.length > 1 ? 's' : ''} dans tout le coffre
                            </p>
                            {resultats!.map((n) => (
                                <button
                                    key={n.chemin}
                                    onClick={() => onOuvrir(n.chemin)}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/20 text-left"
                                >
                                    <FileText size={14} className="shrink-0 text-slate-600" />
                                    <span className="flex-1 min-w-0 flex flex-col">
                                        <span className="text-xs font-bold text-slate-200 truncate">{n.nom}</span>
                                        {n.dossier && (
                                            <span className="flex items-center gap-1 text-ui-10 text-slate-600 truncate">
                                                <Folder size={9} className="shrink-0" /> {n.dossier}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </>
                    )
                ) : contenu.length === 0 ? (
                    <p className="text-sm italic text-slate-500 text-center py-10">
                        {cheminEffectif.length > 0
                            ? 'Ce dossier est vide.'
                            : "Le coffre est vide, ou son chemin n'est pas réglé dans la fiche de campagne."}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-1">
                        {contenu.map((entree) => entree.type === 'directory' ? (
                            <button
                                key={entree.path}
                                onClick={() => setChemin([...cheminEffectif, entree.name])}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.04] hover:border-accent/30 text-left"
                            >
                                <Folder size={14} className="shrink-0 text-accent/70" />
                                <span className="flex-1 min-w-0 text-xs font-bold text-slate-200 truncate">{entree.name}</span>
                                {/* Le compte dit s'il vaut la peine d'ouvrir. */}
                                <span className="shrink-0 text-ui-10 text-slate-600 tabular-nums">
                                    {(entree.children ?? []).length}
                                </span>
                                <ChevronRight size={13} className="shrink-0 text-slate-600" />
                            </button>
                        ) : (
                            <button
                                key={entree.path}
                                onClick={() => onOuvrir(entree.path)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/20 text-left"
                            >
                                <FileText size={14} className="shrink-0 text-slate-600" />
                                <span className="flex-1 min-w-0 text-xs font-bold text-slate-200 truncate">{entree.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RemoteObsidian;
