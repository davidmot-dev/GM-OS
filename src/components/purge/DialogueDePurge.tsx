import React from 'react';
import {
    AlertTriangle, Archive, FolderOpen, RefreshCw, Search, ShieldAlert, Trash2, X,
} from 'lucide-react';
import { useFermetureParEchap } from '../../hooks/useFermetureParEchap';
import { gmToast } from '../../stores/useToastStore';
import {
    apercuDeLaCampagne, apercuDuPilote, purgerLaCampagne, purgerLePilote,
    ouvrirLaQuarantaine,
    type ApercuDePurge, type BilanDePurge, type GenrePurge,
} from '../../services/purge/PurgeService';

/**
 * **Repartir de zéro — l'écran qui montre avant d'agir.**
 *
 * Trois temps, et le meneur peut s'arrêter aux deux premiers :
 *
 * 1. **Ce qu'il y a.** Chaque module dit ce qu'il détient, chaque lot de
 *    fichiers dit son compte et sa taille. Rien n'a encore bougé.
 * 2. **Ce qu'on garde.** Tout se coche et se décoche. Ce que la Forge
 *    refabrique est coché d'avance ; ce que le meneur a apporté — le manuel, son
 *    index, le thème — ne l'est pas. *L'inconnu se penche du côté qui ne
 *    détruit pas.*
 * 3. **Ce qui s'est passé.** Le bilan dit où sont partis les fichiers, avec le
 *    bouton qui ouvre le dossier. Une réversibilité qu'on ne sait pas atteindre
 *    n'en est pas une.
 *
 * ⛔ **Le nom se retape.** C'est le seul geste de l'application qui vide
 * plusieurs modules d'un coup ; la quarantaine rattrape les fichiers, la
 * sauvegarde rattrape les données, mais aucune des deux ne rattrape *« je
 * croyais avoir sélectionné l'autre »*. Retaper le nom force à lire lequel.
 */

interface Props {
    genre: GenrePurge;
    /** L'identifiant de la campagne ou du pilote. */
    cibleId: string;
    onClose: () => void;
    /** Appelé après une purge effective — l'écran appelant se rafraîchit. */
    onPurge?: () => void;
}

const enMo = (octets: number) => (octets / 1024 / 1024).toFixed(2);

const DialogueDePurge: React.FC<Props> = ({ genre, cibleId, onClose, onPurge }) => {
    const [apercu, setApercu] = React.useState<ApercuDePurge | null>(null);
    const [enAnalyse, setEnAnalyse] = React.useState(true);
    const [enPurge, setEnPurge] = React.useState(false);
    const [bilan, setBilan] = React.useState<BilanDePurge | null>(null);
    const [modules, setModules] = React.useState<Set<string>>(new Set());
    const [lots, setLots] = React.useState<Set<string>>(new Set());
    const [saisie, setSaisie] = React.useState('');

    useFermetureParEchap(true, onClose, 'Purge');

    React.useEffect(() => {
        let vivant = true;
        setEnAnalyse(true);
        const chercher = genre === 'campagne' ? apercuDeLaCampagne(cibleId) : apercuDuPilote(cibleId);

        chercher
            .then(resultat => {
                if (!vivant) return;
                setApercu(resultat);
                /* Les cases d'avance viennent des registres, jamais de l'écran :
                   deux endroits qui décident du même défaut finiraient par ne
                   plus être d'accord. */
                setModules(new Set(resultat?.donnees.modules.filter(m => m.parDefaut).map(m => m.module) ?? []));
                setLots(new Set(resultat?.corpus.filter(g => g.parDefaut).map(g => g.cle) ?? []));
            })
            .catch(err => {
                console.error('[Purge] Aperçu impossible :', err);
                if (vivant) setApercu(null);
            })
            .finally(() => { if (vivant) setEnAnalyse(false); });

        return () => { vivant = false; };
    }, [genre, cibleId]);

    const basculer = (ensemble: Set<string>, poser: (s: Set<string>) => void, cle: string) => {
        const suivant = new Set(ensemble);
        if (suivant.has(cle)) suivant.delete(cle); else suivant.add(cle);
        poser(suivant);
    };

    const barrage = (apercu?.campagnesQuiJouent.length ?? 0) > 0;
    const incomplet = apercu ? !apercu.donnees.complet : false;
    const nomTape = apercu ? saisie.trim().toLowerCase() === apercu.nom.trim().toLowerCase() : false;
    const rienDeCoche = modules.size === 0 && lots.size === 0;
    const peutPurger = !!apercu && !barrage && !incomplet && nomTape && !rienDeCoche && !enPurge;

    const lancer = async () => {
        if (!apercu || !peutPurger) return;
        setEnPurge(true);
        try {
            const choix = { modules: [...modules], lotsDuCorpus: [...lots] };
            const resultat = genre === 'campagne'
                ? await purgerLaCampagne(cibleId, apercu, choix)
                : await purgerLePilote(cibleId, apercu, choix);

            setBilan(resultat);
            if (resultat.refus) {
                gmToast(resultat.refus, 'error');
            } else {
                gmToast(
                    `« ${apercu.nom} » purgé — ${resultat.modulesPurges.length} module(s)`
                    + (resultat.fichiersDeplaces > 0 ? `, ${resultat.fichiersDeplaces} fichier(s) en quarantaine` : ''),
                    'success',
                );
                onPurge?.();
            }
        } finally {
            setEnPurge(false);
        }
    };

    const titre = genre === 'campagne' ? 'Purger la campagne' : 'Purger le pilote';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-app-surface border border-app-border/20 shadow-2xl overflow-hidden">

                <div className="flex items-start justify-between gap-4 p-6 border-b border-app-border/10">
                    <div>
                        <h3 className="text-app-text font-black text-lg uppercase tracking-tight">{titre}</h3>
                        <p className="text-xs text-app-text/40 mt-1">
                            {apercu ? `« ${apercu.nom} »` : 'Analyse en cours…'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-app-text/30 hover:text-app-text transition-colors"
                        title="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-5">

                    {enAnalyse && (
                        <p className="flex items-center gap-3 text-ui-11 text-app-text/40">
                            <Search size={14} className="animate-pulse" />
                            On regarde ce qui existe. Rien n’est touché.
                        </p>
                    )}

                    {!enAnalyse && !apercu && (
                        <p className="text-ui-11 text-app-text/40 italic">
                            Introuvable — il a peut-être déjà été supprimé.
                        </p>
                    )}

                    {/* ⛔ Le barrage. Une campagne vivante dont le jeu disparaît devient
                        injouable : c'est au meneur de trancher, pas à la purge. */}
                    {apercu && barrage && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <ShieldAlert size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="text-ui-11 text-red-200/80 leading-relaxed">
                                <p className="font-bold mb-1">Ce pilote est encore joué.</p>
                                <p>
                                    {apercu.campagnesQuiJouent.map(c => `« ${c.nom} »`).join(', ')} —
                                    change leur jeu, ou supprime-les d’abord.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ⚠️ Un avertissement, pas un barrage : partager un corpus est
                        parfois exactement ce que le meneur a voulu. Mais le lui
                        rappeler AVANT est la seule façon d'éviter qu'il le
                        découvre des semaines plus tard, par une absence. */}
                    {apercu && !barrage && apercu.autresPilotesDuCorpus.length > 0 && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-ui-11 text-amber-200/80 leading-relaxed">
                                <span className="font-bold">Ce dossier est partagé.</span>{' '}
                                {apercu.autresPilotesDuCorpus.map(n => `« ${n} »`).join(', ')} pointe(nt)
                                vers <span className="font-mono">docs/{apercu.corpusRelatif}</span> :
                                ce qui part d’ici leur manquera aussi.
                            </p>
                        </div>
                    )}

                    {apercu && incomplet && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-ui-11 text-amber-200/80 leading-relaxed">
                                Ces modules n’ont pas répondu : {apercu.donnees.modulesEnEchec.join(', ')}.
                                La purge est refusée tant qu’un module reste muet — il détient peut-être
                                ce qu’on croit absent.
                            </p>
                        </div>
                    )}

                    {apercu && !barrage && !bilan && (
                        <>
                            <section className="flex flex-col gap-2">
                                <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">
                                    Dans l’application
                                </p>
                                {apercu.donnees.modules.length === 0 ? (
                                    <p className="text-ui-11 text-app-text/30 italic">Aucun module ne retient rien.</p>
                                ) : apercu.donnees.modules.map(m => (
                                    <label
                                        key={m.module}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-app-bg/40 border border-app-border/10 cursor-pointer hover:border-app-border/30 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={modules.has(m.module)}
                                            onChange={() => basculer(modules, setModules, m.module)}
                                            className="mt-0.5 accent-accent"
                                        />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-ui-11 font-bold text-app-text/80">{m.module}</span>
                                            <span className="block text-ui-10 text-app-text/40 mt-0.5">
                                                {m.lots.map(l => `${l.compte} ${l.sujet}`).join(' · ')}
                                            </span>
                                            {m.note && (
                                                <span className="block text-ui-10 text-accent/70 italic mt-1">{m.note}</span>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </section>

                            <section className="flex flex-col gap-2">
                                <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">
                                    Sur le disque
                                    {apercu.corpusRelatif && (
                                        <span className="ml-2 font-mono normal-case tracking-normal text-app-text/25">
                                            docs/{apercu.corpusRelatif}
                                        </span>
                                    )}
                                </p>

                                {!apercu.disqueAccessible ? (
                                    <p className="text-ui-11 text-app-text/30 italic">
                                        Le disque n’est pas accessible depuis cette fenêtre.
                                    </p>
                                ) : apercu.corpus.length === 0 ? (
                                    <p className="text-ui-11 text-app-text/30 italic">
                                        Aucun dossier de corpus — rien à déplacer.
                                    </p>
                                ) : apercu.corpus.map(g => (
                                    <label
                                        key={g.cle}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-app-bg/40 border border-app-border/10 cursor-pointer hover:border-app-border/30 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={lots.has(g.cle)}
                                            onChange={() => basculer(lots, setLots, g.cle)}
                                            className="mt-0.5 accent-accent"
                                        />
                                        <span className="flex-1 min-w-0">
                                            <span className="flex items-baseline justify-between gap-3">
                                                <span className="text-ui-11 font-bold text-app-text/80">{g.nom}</span>
                                                <span className="text-ui-10 tabular-nums text-app-text/25 flex-shrink-0">
                                                    {g.fichiers.length} fichier(s) · {enMo(g.octets)} Mo
                                                </span>
                                            </span>
                                            <span className="block text-ui-10 text-app-text/40 mt-0.5 leading-relaxed">
                                                {g.quoi}
                                            </span>
                                        </span>
                                    </label>
                                ))}

                                <p className="flex items-center gap-2 text-ui-10 text-app-text/30 mt-1">
                                    <Archive size={11} className="flex-shrink-0" />
                                    Les fichiers ne sont pas supprimés : ils partent dans
                                    <span className="font-mono">docs/_purges/</span>, arborescence gardée.
                                </p>
                            </section>
                        </>
                    )}

                    {bilan && (
                        <section className="flex flex-col gap-3 p-4 rounded-xl bg-app-bg/40 border border-app-border/20">
                            {bilan.refus ? (
                                <p className="text-ui-11 text-red-300/80 leading-relaxed">{bilan.refus}</p>
                            ) : (
                                <>
                                    <p className="text-ui-11 text-app-text/70 leading-relaxed">
                                        {bilan.modulesPurges.length} module(s) purgé(s)
                                        {bilan.fichiersDeplaces > 0
                                            ? ` · ${bilan.fichiersDeplaces} fichier(s) déplacé(s), ${enMo(bilan.octetsDeplaces)} Mo`
                                            : ' · aucun fichier déplacé'}.
                                    </p>
                                    {bilan.modulesEnEchec.length > 0 && (
                                        <p className="text-ui-11 text-amber-300/80">
                                            N’ont pas pu rendre : {bilan.modulesEnEchec.join(', ')}.
                                        </p>
                                    )}
                                    {bilan.sansInstantane && (
                                        <p className="text-ui-10 text-amber-300/70 italic">{bilan.sansInstantane}</p>
                                    )}
                                    {bilan.quarantaine && (
                                        <button
                                            onClick={() => void ouvrirLaQuarantaine()}
                                            className="self-start flex items-center gap-2 text-ui-11 font-bold uppercase tracking-widest text-accent hover:underline"
                                        >
                                            <FolderOpen size={14} />
                                            Ouvrir le dossier des purges
                                        </button>
                                    )}
                                </>
                            )}
                        </section>
                    )}
                </div>

                {apercu && !barrage && !bilan && (
                    <div className="p-6 border-t border-app-border/10 flex flex-col gap-3">
                        <label className="flex flex-col gap-2">
                            <span className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">
                                Retape « {apercu.nom} » pour confirmer
                            </span>
                            <input
                                value={saisie}
                                onChange={e => setSaisie(e.target.value)}
                                /* ⚠️ Échap ne doit pas passer d'ici à la surcouche : la frappe
                                   annulerait la saisie ET refermerait l'écran derrière. */
                                onKeyDown={e => { if (e.key === 'Escape') e.stopPropagation(); }}
                                placeholder={apercu.nom}
                                className="px-4 py-2.5 rounded-xl bg-app-bg border border-app-border/20 text-app-text text-sm focus:border-accent/50 outline-none"
                            />
                        </label>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => void lancer()}
                                disabled={!peutPurger}
                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-5 py-2.5 rounded-xl text-ui-11 font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:bg-red-500/10 disabled:hover:text-red-400"
                            >
                                {enPurge ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                {enPurge ? 'Purge en cours…' : 'Purger'}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={enPurge}
                                className="text-ui-11 font-bold uppercase tracking-widest text-app-text/30 hover:text-app-text/60 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            {rienDeCoche && (
                                <span className="text-ui-10 text-app-text/25 italic">Rien n’est coché.</span>
                            )}
                        </div>

                        <p className="text-ui-10 text-app-text/25 leading-relaxed">
                            Une sauvegarde de l’état est prise juste avant, automatiquement.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DialogueDePurge;
