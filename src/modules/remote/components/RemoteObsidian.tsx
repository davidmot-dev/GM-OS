import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Panneau } from '../../../components/socle/Panneau';
import { Search, X, FileText, Folder, ChevronRight, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import type { CoffreObsidian } from '../hooks/useRemoteSync';
import { toutesLesNotes, contenuDuChemin, range } from '../arbreDuCoffre';
import TexteMarkdown from '../../../components/TexteMarkdown';

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
                    <Bouton habillage="libre" cibleTactile
                        onClick={onFermer}
                        aria-label="Revenir à la liste"
                        className="min-w-[44px] w-9 h-9 shrink-0 rounded-lg bg-app-text/5 border border-app-text/10 flex items-center justify-center text-app-muted hover:text-app-text"
                    >
                        <ArrowLeft size={16} />
                    </Bouton>
                    <span className="min-w-0 flex flex-col">
                        <span className="text-sm font-bold text-app-text truncate">{ouverte?.nom ?? coffre.chemin}</span>
                        {ouverte?.dossier && <span className="text-ui-10 text-app-subtle truncate">{ouverte.dossier}</span>}
                    </span>
                </div>
                <Panneau as="div" habillage="libre" className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-app-text/[0.03] border border-app-text/5 p-4">
                    {coffre.chargement ? (
                        <p className="text-sm italic text-app-muted text-center py-10">Lecture…</p>
                    ) : coffre.erreur ? (
                        <p className="text-sm italic text-etat-danger text-center py-10">{coffre.erreur}</p>
                    ) : coffre.contenu ? (
                        /*
                          **Le coffre s'affichait en texte brut jusqu'au 2026-09-05.**
                          Une note d'Obsidian est du Markdown : ses titres, ses
                          listes et ses tableaux étaient rendus avec leurs dièses
                          et leurs barres verticales. *Montrer la source d'un
                          document au lieu du document est une panne discrète —
                          rien ne manque à l'écran, tout est illisible.*
                        */
                        <div className="prose prose-invert prose-sm max-w-[80ch] prose-headings:font-black prose-headings:tracking-tight prose-headings:text-app-text prose-p:text-app-text prose-li:text-app-text prose-strong:text-app-text prose-a:text-accent prose-code:text-accent prose-table:text-xs prose-th:text-app-muted prose-td:text-app-text">
                            <TexteMarkdown>{coffre.contenu}</TexteMarkdown>
                        </div>
                    ) : (
                        <p className="text-sm italic text-app-muted text-center py-10">Cette note est vide.</p>
                    )}
                </Panneau>
            </div>
        );
    }

    const enRecherche = resultats !== null;
    const contenu = range(niveau);

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="shrink-0 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle pointer-events-none" />
                    <input
                        type="search"
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        placeholder="Chercher dans tout le coffre…"
                        aria-label="Chercher une note dans le coffre"
                        className="w-full h-[44px] pl-9 pr-16 rounded-xl bg-app-text/5 border border-app-text/10 text-sm text-app-text placeholder:text-app-subtle outline-none focus:border-accent/40"
                    />
                    {filtre && (
                        <Bouton habillage="libre" cibleTactile
                            onClick={() => setFiltre('')}
                            aria-label="Effacer la recherche"
                            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] w-6 h-6 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text"
                        >
                            <X size={14} />
                        </Bouton>
                    )}
                </div>
                <Bouton habillage="libre" cibleTactile
                    onClick={onCharger}
                    aria-label="Recharger le coffre"
                    title="Recharger le coffre"
                    className="shrink-0 min-w-[44px] w-9 h-9 rounded-lg bg-app-text/5 border border-app-text/10 flex items-center justify-center text-app-muted hover:text-app-text"
                >
                    <RefreshCw size={15} className={coffre.chargement ? 'animate-spin' : ''} />
                </Bouton>
            </div>

            {/*
              **Le fil d'Ariane.** Chaque niveau est touchable — *on remonte de
              trois dossiers d'un geste, au lieu d'appuyer trois fois sur retour.*
              Caché pendant une recherche, qui ne se tient dans aucun dossier.
            */}
            {!enRecherche && cheminEffectif.length > 0 && (
                <nav aria-label="Chemin dans le coffre" className="shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar text-ui-11">
                    <Bouton habillage="libre" cibleTactile
                        onClick={() => setChemin([])}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-app-muted hover:text-app-text hover:bg-app-text/5"
                    >
                        <Home size={12} /> Coffre
                    </Bouton>
                    {cheminEffectif.map((nom, i) => (
                        <React.Fragment key={`${nom}-${i}`}>
                            <ChevronRight size={12} className="shrink-0 text-app-subtle" />
                            <Bouton habillage="libre" cibleTactile
                                onClick={() => setChemin(cheminEffectif.slice(0, i + 1))}
                                className={`shrink-0 px-2 py-1 rounded-lg hover:bg-app-text/5 ${i === cheminEffectif.length - 1 ? 'text-accent font-bold' : 'text-app-muted hover:text-app-text'}`}
                            >
                                {nom}
                            </Bouton>
                        </React.Fragment>
                    ))}
                </nav>
            )}

            <Panneau as="div" habillage="libre" className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-app-text/[0.03] border border-app-text/5 p-3 flex flex-col gap-1">
                {coffre.chargement && coffre.notes.length === 0 ? (
                    <p className="text-sm italic text-app-muted text-center py-10">Lecture du coffre…</p>
                ) : enRecherche ? (
                    resultats!.length === 0 ? (
                        <p className="text-sm italic text-app-muted text-center py-10">
                            Aucune note ne correspond à « {filtre} ».
                        </p>
                    ) : (
                        <>
                            <p className="text-ui-10 uppercase tracking-widest text-app-subtle px-1 pb-1">
                                {resultats!.length} note{resultats!.length > 1 ? 's' : ''} dans tout le coffre
                            </p>
                            {resultats!.map((n) => (
                                <Bouton habillage="libre" cibleTactile
                                    key={n.chemin}
                                    onClick={() => onOuvrir(n.chemin)}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-app-text/5 bg-app-text/[0.02] hover:border-app-text/20 text-left"
                                >
                                    <FileText size={14} className="shrink-0 text-app-subtle" />
                                    <span className="flex-1 min-w-0 flex flex-col">
                                        <span className="text-xs font-bold text-app-text truncate">{n.nom}</span>
                                        {n.dossier && (
                                            <span className="flex items-center gap-1 text-ui-10 text-app-subtle truncate">
                                                <Folder size={9} className="shrink-0" /> {n.dossier}
                                            </span>
                                        )}
                                    </span>
                                </Bouton>
                            ))}
                        </>
                    )
                ) : contenu.length === 0 ? (
                    <p className="text-sm italic text-app-muted text-center py-10">
                        {cheminEffectif.length > 0
                            ? 'Ce dossier est vide.'
                            : "Le coffre est vide, ou son chemin n'est pas réglé dans la fiche de campagne."}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-1">
                        {contenu.map((entree) => entree.type === 'directory' ? (
                            <Bouton habillage="libre" cibleTactile
                                key={entree.path}
                                onClick={() => setChemin([...cheminEffectif, entree.name])}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-app-text/5 bg-app-text/[0.04] hover:border-accent/30 text-left"
                            >
                                <Folder size={14} className="shrink-0 text-accent/70" />
                                <span className="flex-1 min-w-0 text-xs font-bold text-app-text truncate">{entree.name}</span>
                                {/* Le compte dit s'il vaut la peine d'ouvrir. */}
                                <span className="shrink-0 text-ui-10 text-app-subtle tabular-nums">
                                    {(entree.children ?? []).length}
                                </span>
                                <ChevronRight size={13} className="shrink-0 text-app-subtle" />
                            </Bouton>
                        ) : (
                            <Bouton habillage="libre" cibleTactile
                                key={entree.path}
                                onClick={() => onOuvrir(entree.path)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-app-text/5 bg-app-text/[0.02] hover:border-app-text/20 text-left"
                            >
                                <FileText size={14} className="shrink-0 text-app-subtle" />
                                <span className="flex-1 min-w-0 text-xs font-bold text-app-text truncate">{entree.name}</span>
                            </Bouton>
                        ))}
                    </div>
                )}
            </Panneau>
        </div>
    );
};

export default RemoteObsidian;
