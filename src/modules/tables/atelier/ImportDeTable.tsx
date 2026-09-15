import React, { useEffect, useMemo, useState } from 'react';
import { X, ClipboardPaste, Wand2, Loader2, AlertTriangle, FolderOpen, Image as ImageIcon, FileJson } from 'lucide-react';
import { lireUnCollage, regimeDuTexte, type RegimeDeCollage } from '../logic/collageDUneTable';
import { pontDesTables } from '../pontDesTables';
import { leModeleActifVoit, type VerdictDeVision } from '../../ai/capaciteDuModele';
import { rangerParLIA } from '../logic/miseEnFormeParLIA';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { gmToast } from '../../../stores/useToastStore';
import type { TableEntry } from '../types';

/**
 * **Coller une table de manuel — et voir ce qui en sort avant de l'accepter.**
 *
 * Demandé par David le 2026-09-15, après avoir éprouvé l'Atelier. Deux chemins,
 * et c'est délibérément deux boutons et non un réglage :
 *
 * - **Ranger tel quel** — un lecteur déterministe, hors ligne, qui ne devine
 *   rien. Le texte d'une ligne va dans le titre, entier.
 * - **Ranger par l'IA** — le modèle répartit titre / ambiance / effet. Il
 *   *propose* ; la bande de couverture de l'atelier relit derrière lui.
 *
 * ⭐ **L'aperçu chiffre avant d'appliquer.** *Un import qui remplace la table
 * puis annonce le résultat oblige à défaire ;* ici on lit « 20 entrées, 1 ligne
 * ignorée » et on décide.
 *
 * ⚠️ **Il REMPLACE les entrées.** C'est le geste qu'on attend d'un import, mais
 * il efface : d'où la confirmation dès qu'il y a quelque chose à perdre.
 */

interface Props {
    ouvert: boolean;
    onFermer: () => void;
    /** Le dé courant : il sert à poser les bornes, et il est imposé au modèle. */
    de: string;
    /** Combien d'entrées seraient perdues. */
    entreesExistantes: number;
    onAppliquer: (entrees: TableEntry[], nom?: string, de?: string) => void;
}

const REGIMES: ReadonlyArray<[RegimeDeCollage | 'auto', string]> = [
    ['auto', 'Deviner'],
    ['json', 'Table JSON'],
    ['bornes', 'Les numéros sont dans le texte'],
    ['lignes', 'Une ligne, un résultat'],
];

/** Ce qu'un refus de lecture veut dire, en français. */
const MOTIFS: Record<string, string> = {
    'extension-inconnue': 'GM-OS ne sait pas lire ce format.',
    'illisible': 'Ce fichier n’a pas pu être lu.',
    'pdf-indisponible': 'La lecture des PDF est indisponible — voir le journal.',
};

export const ImportDeTable: React.FC<Props> = ({
    ouvert, onFermer, de, entreesExistantes, onAppliquer,
}) => {
    const [texte, setTexte] = useState('');
    const [regimeChoisi, setRegimeChoisi] = useState<RegimeDeCollage | 'auto'>('auto');
    const [enCours, setEnCours] = useState(false);
    /*
      Une image ne se colle pas dans une zone de texte : elle vit à côté, et elle
      n'a **qu'un seul chemin** — le modèle. *La montrer comme une source parmi
      les autres ferait croire que « Ranger tel quel » la lit.*
    */
    const [image, setImage] = useState<{ donnees: string; mimeType: string; nom: string } | null>(null);
    /**
     * **Ce que le modèle actif sait faire d'une image** — demandé dès qu'une
     * image est là, pas au moment d'envoyer.
     *
     * ⛔ *Un modèle sans vision reçoit l'image, l'ignore, et répond quand même* :
     * la table serait inventée de bout en bout, et la bande de couverture
     * verte. Le dire **avant** le clic, c'est la différence entre un
     * avertissement et une explication d'après-coup.
     */
    const [vision, setVision] = useState<VerdictDeVision | null>(null);

    useEffect(() => {
        if (!image) { setVision(null); return; }
        let vivant = true;
        leModeleActifVoit()
            .then(v => { if (vivant) setVision(v); })
            .catch(() => { if (vivant) setVision(null); });
        return () => { vivant = false; };
    }, [image]);

    useFermetureParEchap(ouvert, onFermer, 'Importer une table');

    const apercu = useMemo(() => lireUnCollage(texte, {
        de,
        ...(regimeChoisi === 'auto' ? {} : { regime: regimeChoisi }),
    }), [texte, de, regimeChoisi]);

    const devine = useMemo(() => regimeDuTexte(texte), [texte]);

    /** *Il efface : on ne le fait pas dire deux fois.* */
    const confirmerLEcrasement = () =>
        entreesExistantes === 0
        || window.confirm(`Remplacer les ${entreesExistantes} entrées de cette table ?`);

    /**
     * **Ouvrir un fichier** — JSON, Markdown, texte, PDF ou image.
     *
     * Le texte atterrit dans la zone de collage : *le meneur voit ce qui a été
     * lu avant de le ranger*, et un PDF mal extrait se corrige à la main au lieu
     * d'être rangé de travers. Une image, elle, n'a nulle part à atterrir — elle
     * s'annonce à côté, et n'a qu'un seul chemin.
     */
    const ouvrirUnFichier = async () => {
        const pont = pontDesTables();
        if (!pont?.ouvrirUneSource) { gmToast('Ouverture indisponible hors de GM-OS.', 'error'); return; }

        const source = await pont.ouvrirUneSource();
        if (!source) return;

        if (source.genre === 'refus') {
            gmToast(`${source.nom} : ${MOTIFS[source.motif] ?? 'lecture impossible.'}`, 'error');
            return;
        }

        if (source.genre === 'image') {
            setImage({ donnees: source.donnees, mimeType: source.mimeType, nom: source.nom });
            gmToast(`${source.nom} — seule la mise en forme par l’IA peut la lire.`, 'info');
            /* Le verdict de vision arrive juste après, par l'effet : le bandeau
               dira lui-même si le modèle actif sait regarder. */
            return;
        }

        setImage(null);
        setTexte(source.texte);
        if (source.texte.trim() === '') {
            gmToast(`${source.nom} n’a rendu aucun texte.`, 'warning');
        }
    };

    const appliquerLeCollage = () => {
        if (apercu.entrees.length === 0) { gmToast('Rien à importer.', 'warning'); return; }
        if (!confirmerLEcrasement()) return;
        /* Un JSON porte son nom et son dé : les jeter obligerait à les retaper
           alors qu'ils sont là, écrits. */
        onAppliquer(apercu.entrees, apercu.nom, apercu.de);
        setTexte('');
        setImage(null);
        onFermer();
    };

    const appliquerLIA = async () => {
        if (!texte.trim() && !image) {
            gmToast('Collez un texte, ou ouvrez une image.', 'warning'); return;
        }
        /*
          ⛔ **On refuse quand on SAIT que le modèle ne voit pas.** Pas quand on
          l'ignore : un Ollama plus ancien ne déclare aucune capacité, et
          refuser alors priverait du geste quelqu'un dont le modèle voit très
          bien. *Une garde qui refuse ce qui marche finit par être contournée.*
        */
        if (image && vision && !vision.voit && vision.certain) {
            gmToast(vision.motif ?? 'Ce modèle ne sait pas lire une image.', 'error');
            return;
        }
        if (!confirmerLEcrasement()) return;

        setEnCours(true);
        try {
            const proposition = await rangerParLIA(texte, { de, ...(image ? { image } : {}) });
            if (proposition.entries.length === 0) {
                gmToast('Le modèle n’a rendu aucune entrée exploitable.', 'warning');
                return;
            }
            onAppliquer(proposition.entries, proposition.name);
            setTexte('');
            setImage(null);
            onFermer();
        } catch (err) {
            console.error('[Atelier] mise en forme par l’IA impossible :', err);
            gmToast('Le modèle n’a pas répondu — voir le journal.', 'error');
        } finally {
            setEnCours(false);
        }
    };

    if (!ouvert) return null;

    return (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
            role="dialog" aria-modal="true" aria-label="Importer une table">
            <div className="w-full max-w-3xl max-h-full flex flex-col bg-app-surface border border-app-border rounded-2xl shadow-2xl overflow-hidden">

                <header className="flex items-center gap-3 px-6 py-4 border-b border-app-border">
                    <ClipboardPaste className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-app-text">
                        Importer une table
                    </h3>
                    <div className="flex-1" />
                    <button onClick={onFermer} title="Fermer l’import"
                        className="p-1.5 text-app-text/40 hover:text-app-text transition-colors">
                        <X size={18} />
                    </button>
                </header>

                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={ouvrirUnFichier}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-app-border text-sm text-app-text/80 hover:text-app-text transition-colors">
                            <FolderOpen size={14} />Ouvrir un fichier
                        </button>
                        <span className="text-ui-9 text-app-text/30">
                            JSON · Markdown · texte · PDF · image
                        </span>
                    </div>

                    {/*
                      L'image n'a qu'un seul chemin, et l'écran doit le dire :
                      *« Ranger tel quel » ne sait pas la lire.*
                    */}
                    {image && (
                        <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2">
                            <ImageIcon size={14} className="text-accent shrink-0" />
                            <span className="text-xs text-app-text/70 truncate flex-1">{image.nom}</span>
                            <span className={`text-ui-9 uppercase tracking-widest ${
                                vision === null ? 'text-app-text/40'
                                    : !vision.voit ? 'text-red-400 font-bold'
                                        : vision.certain ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {vision === null ? 'IA seulement'
                                    : !vision.voit ? 'ce modèle ne voit pas'
                                        : vision.certain ? `${vision.modele} voit` : 'vision incertaine'}
                            </span>
                            <button onClick={() => setImage(null)} title="Retirer l’image"
                                className="p-1 text-app-text/30 hover:text-red-400 transition-colors">
                                <X size={13} />
                            </button>
                        </div>
                    )}

                    {vision?.motif && (
                        <p className={`text-ui-9 leading-snug ${vision.voit ? 'text-amber-400/80' : 'text-red-400/90'}`}>
                            {vision.motif}
                        </p>
                    )}

                    <textarea
                        value={texte}
                        onChange={e => setTexte(e.target.value)}
                        rows={10}
                        aria-label="Texte à importer"
                        placeholder={'Collez ici une table de manuel.\n\n'
                            + '1-5   Rien de notable\n'
                            + '6-12  Un bruit dans la coursive\n'
                            + '13-20 Elle est là\n\n'
                            + '…ou simplement une liste, un résultat par ligne.'}
                        className="w-full bg-app-bg border border-app-border rounded-xl p-3 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-app-text/40">Lecture :</span>
                        {REGIMES.map(([valeur, libelle]) => (
                            <button
                                key={valeur}
                                onClick={() => setRegimeChoisi(valeur)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                    regimeChoisi === valeur
                                        ? 'bg-accent text-app-bg font-bold'
                                        : 'border border-app-border text-app-text/50 hover:text-app-text'}`}
                            >
                                {libelle}
                                {valeur === 'auto' && texte.trim() !== '' && (
                                    <span className="opacity-60">
                                        {' '}({devine === 'json' ? 'JSON' : devine === 'bornes' ? 'numéros' : 'lignes'})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* L'aperçu chiffre avant qu'on applique. */}
                    {texte.trim() !== '' && (
                        <div className="rounded-xl border border-app-border/60 bg-app-bg/40 p-3 space-y-2">
                            <p className="text-xs text-app-text/60 flex flex-wrap items-center gap-x-2">
                                {apercu.regime === 'json' && (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                        <FileJson size={12} />Table JSON reconnue
                                    </span>
                                )}
                                <span>
                                <b className="text-accent">{apercu.entrees.length}</b> entrée(s) lue(s)
                                {apercu.ignorees.length > 0 && (
                                    <span className="text-amber-400">
                                        {' '}· {apercu.ignorees.length} ligne(s) non rattachée(s)
                                    </span>
                                )}
                                {apercu.nom && <span className="text-app-text/40"> · « {apercu.nom} »</span>}
                                {apercu.de && <span className="text-app-text/40"> · dé {apercu.de}</span>}
                                </span>
                            </p>

                            {apercu.ignorees.length > 0 && (
                                <ul className="text-ui-9 text-amber-400/70 space-y-0.5">
                                    {apercu.ignorees.slice(0, 3).map((l, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                            <AlertTriangle size={11} className="mt-[1px] shrink-0" />
                                            <span className="truncate">{l}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <ul className="text-xs text-app-text/50 space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                                {apercu.entrees.slice(0, 8).map((e, i) => (
                                    <li key={i} className="truncate">
                                        <span className="font-mono text-app-text/30">
                                            {e.min === e.max ? e.min : `${e.min}-${e.max}`}
                                        </span>{' '}
                                        {e.title || <i>(sans titre)</i>}
                                    </li>
                                ))}
                                {apercu.entrees.length > 8 && (
                                    <li className="italic text-app-text/30">
                                        …et {apercu.entrees.length - 8} de plus
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    <p className="text-ui-9 text-app-text/30 leading-snug">
                        Une <b>table JSON</b> — celle que produit le prompt livré avec GM-OS — est
                        reconnue toute seule, avec son nom et son dé. Sinon, le collage met chaque
                        ligne dans le <b>titre</b>, entier : il ne coupe rien au hasard. C’est la mise
                        en forme par l’IA qui répartit titre, ambiance et effet, et la bande de
                        couverture la relit derrière.
                    </p>
                </div>

                <footer className="flex flex-wrap items-center gap-2 px-6 py-4 border-t border-app-border bg-app-bg/30">
                    <button onClick={appliquerLeCollage} disabled={apercu.entrees.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-app-border text-sm text-app-text/80 hover:text-app-text disabled:opacity-40 transition-colors">
                        <ClipboardPaste size={14} />Ranger tel quel
                    </button>
                    <button onClick={appliquerLIA} disabled={enCours || (texte.trim() === '' && !image)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-app-bg font-bold text-sm hover:brightness-110 disabled:opacity-40 transition-all">
                        {enCours ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        Ranger par l’IA
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ImportDeTable;
