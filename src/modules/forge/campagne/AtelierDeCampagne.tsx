import React from 'react';
import {
    BookOpen, Globe, Loader2, Play, Check, AlertTriangle, FolderTree,
    ListOrdered, FileText, Upload, RotateCcw,
} from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { gmToast } from '../../../stores/useToastStore';
import { listerLesCarnets, listerLesSources, type CarnetLM, type SourceDuCarnet } from '../carnetNotebookLM';
import {
    serviceDeCampagne, etapesDeLaCampagne, corpusDeLaCampagne,
    ecrireLeBrouillon, publierLaFiche, ecrireLInventaire,
    type EtapeDeCampagne, type FicheDeCampagne,
} from './ServiceDeCampagne';
import type { ActeLu } from './structureDeCampagne';
import type { CorpusDeCampagne } from '../../../../electron/corpusDeCampagne';

/**
 * L'Atelier de campagne — interroger le carnet, sujet par sujet.
 *
 * **La campagne se choisit ICI, et nulle part ailleurs.** C'est la règle du
 * module, posée le 2026-08-10 après un incident réel : hériter du choix d'un
 * autre écran a conduit à réaffecter le pilote d'une campagne Blade Runner pour
 * pouvoir enrichir Dune. *Un défaut hérité d'ailleurs reste un choix que
 * personne n'a fait.*
 *
 * **Rien n'est publié sans passer devant un humain.** Chaque fiche s'écrit
 * d'abord en brouillon — exclu de l'index de l'Oracle — dès le retour du carnet,
 * parce qu'elle coûte une à deux minutes et serait perdue si l'écran se fermait.
 * La revue est une *publication*, à froid, plus tard.
 */
const AtelierDeCampagne: React.FC = () => {
    const { campaigns } = useSessionOSStore();

    const [campagneId, setCampagneId] = React.useState('');
    const [corpus, setCorpus] = React.useState<CorpusDeCampagne | null>(null);

    const [carnets, setCarnets] = React.useState<CarnetLM[]>([]);
    const [carnetId, setCarnetId] = React.useState('');
    const [sources, setSources] = React.useState<SourceDuCarnet[]>([]);
    const [sourcesRetenues, setSourcesRetenues] = React.useState<string[]>([]);
    const [chargement, setChargement] = React.useState(false);

    const [inventaire, setInventaire] = React.useState<string | null>(null);
    const [actes, setActes] = React.useState<ActeLu[]>([]);
    const [structureBrute, setStructureBrute] = React.useState<string | null>(null);
    const [fiches, setFiches] = React.useState<Record<string, FicheDeCampagne>>({});
    const [publiees, setPubliees] = React.useState<Set<string>>(new Set());
    const [enCours, setEnCours] = React.useState<string | null>(null);
    const [erreur, setErreur] = React.useState<string | null>(null);

    const campagne = campaigns.find(c => c.id === campagneId);
    const etapes = React.useMemo(() => etapesDeLaCampagne(actes), [actes]);
    const pret = !!campagne && !!carnetId;

    // Le corpus se résout dès que la campagne est choisie : il faut le MONTRER
    // avant d'écrire, surtout quand le dossier n'existe pas encore.
    React.useEffect(() => {
        if (!campagne) { setCorpus(null); return; }
        let vivant = true;
        void corpusDeLaCampagne(campagne.name, campagne.campaignPath)
            .then(c => { if (vivant) setCorpus(c); });
        return () => { vivant = false; };
    }, [campagne]);

    const chargerLesCarnets = async () => {
        setChargement(true);
        setErreur(null);
        try {
            setCarnets(await listerLesCarnets());
        } catch (e) {
            setErreur(e instanceof Error ? e.message : String(e));
        } finally {
            setChargement(false);
        }
    };

    const choisirLeCarnet = async (id: string) => {
        setCarnetId(id);
        // Changer de carnet vide la sélection : garder les identifiants du
        // précédent les enverrait comme filtre au nouveau, et l'écart serait
        // invisible — la liste n'affiche que les sources du carnet courant.
        setSourcesRetenues([]);
        setChargement(true);
        try {
            setSources(await listerLesSources(id));
        } catch (e) {
            setErreur(e instanceof Error ? e.message : String(e));
        } finally {
            setChargement(false);
        }
    };

    /** Un appel au carnet, avec le même traitement d'échec partout. */
    const appeler = async (clef: string, travail: () => Promise<void>) => {
        setEnCours(clef);
        setErreur(null);
        try {
            await travail();
        } catch (e) {
            // Le message du serveur remonte tel quel : un quota, une
            // authentification périmée et un carnet vide sont trois problèmes
            // différents, et les confondre ferait chercher au mauvais endroit.
            setErreur(e instanceof Error ? e.message : String(e));
        } finally {
            setEnCours(null);
        }
    };

    const lancerInventaire = () => appeler('inventaire', async () => {
        const brut = await serviceDeCampagne.inventaire(carnetId, sourcesRetenues);
        setInventaire(brut);
        if (corpus && campagne) await ecrireLInventaire(corpus, corpus.id, brut);
    });

    const lancerStructure = () => appeler('structure', async () => {
        const { actes: lus, brut } = await serviceDeCampagne.structure(carnetId, sourcesRetenues);
        setActes(lus);
        setStructureBrute(brut);
        if (lus.length === 0) {
            gmToast("Aucune partie lue — relis la réponse du carnet ci-dessous et saisis-les à la main.", 'warning');
        }
    });

    const forger = (etape: EtapeDeCampagne) => appeler(etape.id, async () => {
        if (!corpus) return;
        const fiche = await serviceDeCampagne.fiche(carnetId, etape, corpus.id, sourcesRetenues);
        setFiches(f => ({ ...f, [etape.id]: fiche }));
        // Le brouillon part AVANT toute revue : une réponse acquise ne doit pas
        // dépendre de ce qui se passe ensuite.
        await ecrireLeBrouillon(corpus, fiche);
    });

    const publier = async (etape: EtapeDeCampagne) => {
        const fiche = fiches[etape.id];
        if (!fiche || !corpus) return;
        const ok = await publierLaFiche(corpus, fiche);
        if (!ok) { gmToast("La fiche n'a pas pu être écrite sur le disque.", 'error'); return; }
        setPubliees(p => new Set(p).add(etape.id));
        gmToast(`« ${fiche.sujet} » publiée.`, 'success');
    };

    return (
        <div className="h-full overflow-hidden grid grid-cols-12 gap-6 p-6 bg-app-bg text-app-text">
            {/* Configuration */}
            <div className="col-span-4 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <Bloc icone={<BookOpen size={16} />} titre="Campagne">
                    <select
                        value={campagneId}
                        onChange={e => setCampagneId(e.target.value)}
                        className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-xs outline-none focus:border-accent/50 cursor-pointer"
                    >
                        <option value="">— choisir —</option>
                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {corpus && (
                        <div className="mt-3 space-y-1.5">
                            <p className="flex items-center gap-2 text-[11px] font-mono text-app-text/50">
                                <FolderTree size={12} className="shrink-0" /> docs/{corpus.racine}/fiches
                            </p>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-app-text/30">
                                résolu par : {corpus.raison}
                            </p>
                            {corpus.aCreer && (
                                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                                    Ce dossier n'existe pas encore : il sera créé à la première fiche.
                                </p>
                            )}
                            {corpus.contradiction && (
                                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                                    Le nom de la campagne désignerait <b>{corpus.contradiction}</b>. Le chemin
                                    déclaré l'emporte — mais vérifie que c'est bien voulu.
                                </p>
                            )}
                        </div>
                    )}
                </Bloc>

                <Bloc icone={<Globe size={16} />} titre="Carnet NotebookLM">
                    <button
                        onClick={chargerLesCarnets}
                        disabled={chargement}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-app-text/60 hover:text-app-text disabled:opacity-40 transition-all"
                    >
                        {chargement ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                        Charger les carnets
                    </button>

                    {carnets.length > 0 && (
                        <select
                            value={carnetId}
                            onChange={e => void choisirLeCarnet(e.target.value)}
                            className="w-full mt-3 bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-xs outline-none focus:border-accent/50 cursor-pointer"
                        >
                            <option value="">— choisir —</option>
                            {carnets.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    )}

                    {sources.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/30">
                                Sources ({sourcesRetenues.length || 'toutes'})
                            </p>
                            {sources.map(s => (
                                <label key={s.id} className="flex items-center gap-2 text-[11px] text-app-text/60 cursor-pointer hover:text-app-text">
                                    <input
                                        type="checkbox"
                                        checked={sourcesRetenues.includes(s.id)}
                                        onChange={() => setSourcesRetenues(r =>
                                            r.includes(s.id) ? r.filter(x => x !== s.id) : [...r, s.id])}
                                    />
                                    <span className="truncate">{s.title}</span>
                                </label>
                            ))}
                            {/* Filtrer les sources a fait passer l'inventaire des
                                règles de l'échec à 72 secondes : douze sources
                                contre une. C'est le levier le plus rentable. */}
                            <p className="text-[11px] text-app-text/25 italic leading-relaxed pt-1">
                                Rien de coché vise le carnet entier. Ne retenir que le livre de la campagne
                                accélère beaucoup les réponses.
                            </p>
                        </div>
                    )}
                </Bloc>

                {erreur && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Le carnet refuse</p>
                        <p className="text-[11px] text-app-text/60 mt-1 font-mono leading-relaxed">{erreur}</p>
                    </div>
                )}
            </div>

            {/* Le parcours */}
            <div className="col-span-8 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <Etape
                    numero="1"
                    icone={<ListOrdered size={16} />}
                    titre="Inventaire"
                    aide="Ce que les sources couvrent, sujet par sujet. Il borne le travail et rend les lacunes visibles."
                    fait={!!inventaire}
                    enCours={enCours === 'inventaire'}
                    actif={pret}
                    onLancer={lancerInventaire}
                >
                    {inventaire && <Brut texte={inventaire} />}
                </Etape>

                <Etape
                    numero="2"
                    icone={<FolderTree size={16} />}
                    titre="Structure en actes"
                    aide="La colonne vertébrale. C'est elle qui découpe les demandes suivantes — un titre déformé et elles portent sur une partie que le livre ne connaît pas."
                    fait={actes.length > 0}
                    enCours={enCours === 'structure'}
                    actif={pret}
                    onLancer={lancerStructure}
                >
                    {actes.length > 0 && (
                        <ul className="space-y-1.5 mt-3">
                            {actes.map(a => (
                                <li key={a.titre} className="flex items-start gap-3 text-xs">
                                    <span className="font-mono text-app-text/30 shrink-0">
                                        {String(a.ordre + 1).padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{a.titre}</p>
                                        {a.enjeu && <p className="text-app-text/40 leading-relaxed">{a.enjeu}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {/* La réponse brute reste visible même quand la lecture a
                        réussi : c'est la seule façon de vérifier qu'on n'a rien
                        perdu en la lisant. */}
                    {structureBrute && <Brut texte={structureBrute} repliee />}
                </Etape>

                <div className="rounded-2xl border border-app-border/10 bg-app-surface/40 p-5">
                    <div className="flex items-center gap-2 mb-1">
                        <FileText size={16} className="text-accent" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest">
                            3. Les fiches {etapes.length > 0 && <span className="text-app-text/30">({etapes.length})</span>}
                        </h3>
                    </div>

                    {actes.length === 0 ? (
                        <p className="text-[11px] text-app-text/30 italic leading-relaxed mt-2">
                            Les deux sujets qui s'interrogent partie par partie — les personnages et les
                            scènes — attendent la structure. Sans elle, ils repartiraient sur la campagne
                            entière et rendraient la même réponse à chaque fois.
                        </p>
                    ) : (
                        <div className="space-y-1.5 mt-3">
                            {etapes.map(etape => (
                                <LigneDeFiche
                                    key={etape.id}
                                    etape={etape}
                                    fiche={fiches[etape.id]}
                                    publiee={publiees.has(etape.id)}
                                    enCours={enCours === etape.id}
                                    actif={pret && !!corpus}
                                    onForger={() => forger(etape)}
                                    onPublier={() => void publier(etape)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Bloc: React.FC<{ icone: React.ReactNode; titre: string; children: React.ReactNode }> = ({ icone, titre, children }) => (
    <div className="rounded-2xl border border-app-border/10 bg-app-surface/40 p-5">
        <div className="flex items-center gap-2 mb-3 text-accent">
            {icone}
            <h3 className="text-[11px] font-black uppercase tracking-widest text-app-text">{titre}</h3>
        </div>
        {children}
    </div>
);

const Etape: React.FC<{
    numero: string; icone: React.ReactNode; titre: string; aide: string;
    fait: boolean; enCours: boolean; actif: boolean;
    onLancer: () => void; children?: React.ReactNode;
}> = ({ numero, icone, titre, aide, fait, enCours, actif, onLancer, children }) => (
    <div className="rounded-2xl border border-app-border/10 bg-app-surface/40 p-5">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <div className="flex items-center gap-2 text-accent">
                    {icone}
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-text">
                        {numero}. {titre}
                    </h3>
                    {fait && <Check size={13} className="text-emerald-400" />}
                </div>
                <p className="text-[11px] text-app-text/35 leading-relaxed mt-1.5">{aide}</p>
            </div>
            <button
                onClick={onLancer}
                disabled={!actif || enCours}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                {enCours ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {fait ? 'Relancer' : 'Lancer'}
            </button>
        </div>
        {children}
    </div>
);

const LigneDeFiche: React.FC<{
    etape: EtapeDeCampagne; fiche?: FicheDeCampagne; publiee: boolean;
    enCours: boolean; actif: boolean; onForger: () => void; onPublier: () => void;
}> = ({ etape, fiche, publiee, enCours, actif, onForger, onPublier }) => (
    <div className="rounded-xl border border-app-border/10 bg-app-bg/30 px-4 py-3">
        <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{etape.titre}</p>
                {fiche && (
                    <p className="text-[10px] uppercase tracking-widest font-bold text-app-text/30 mt-0.5">
                        couverture {fiche.couverture} · {fiche.sections.length} section{fiche.sections.length > 1 ? 's' : ''}
                    </p>
                )}
            </div>
            {publiee ? (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    <Check size={12} /> publiée
                </span>
            ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={onForger}
                        disabled={!actif || enCours}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 disabled:opacity-30 transition-all"
                    >
                        {enCours ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                        {fiche ? 'Refaire' : 'Forger'}
                    </button>
                    {fiche && (
                        <button
                            onClick={onPublier}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        >
                            <Upload size={11} /> Publier
                        </button>
                    )}
                </div>
            )}
        </div>

        {/*
            Les avertissements sont montrés, jamais comptés en silence. Une fiche
            sans titre de section n'a rien à confronter au résolveur titre → page,
            et rien n'attrape alors l'invention sur cette fiche.
        */}
        {fiche && fiche.avertissements.length > 0 && (
            <ul className="mt-2 space-y-1">
                {fiche.avertissements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-amber-300/70 leading-relaxed">
                        <AlertTriangle size={11} className="shrink-0 mt-0.5" /> {a}
                    </li>
                ))}
            </ul>
        )}
    </div>
);

/** La réponse du carnet, telle quelle. Montrée, jamais résumée. */
const Brut: React.FC<{ texte: string; repliee?: boolean }> = ({ texte, repliee }) => (
    <details open={!repliee} className="mt-3">
        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-app-text/30 hover:text-app-text/60">
            Réponse du carnet
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-[11px] leading-relaxed text-app-text/60 whitespace-pre-wrap bg-app-bg/40 rounded-xl p-4 border border-app-border/10">
            {texte}
        </pre>
    </details>
);

export default AtelierDeCampagne;
