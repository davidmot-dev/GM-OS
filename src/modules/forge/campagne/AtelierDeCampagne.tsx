import React from 'react';
import {
    BookOpen, Globe, Loader2, Play, Check, AlertTriangle, FolderTree,
    ListOrdered, FileText, Upload, Zap, X,
} from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import { gmToast } from '../../../stores/useToastStore';
import { forgeService } from '../ForgeService';
import { listerLesCarnets, listerLesSources, type CarnetLM, type SourceDuCarnet } from '../carnetNotebookLM';
import {
    serviceDeCampagne, etapesDeLaCampagne, corpusDeLaCampagne,
    ecrireLeBrouillon, publierLaFiche, ecrireLInventaire, ecrireLaStructure,
    type EtapeDeCampagne, type FicheDeCampagne,
} from './ServiceDeCampagne';
import { reprendreLAtelier, type FicheReprise } from './reprendreLAtelier';
import { Bloc, CibleDeCampagne } from './atomes';
import type { ActeLu } from './structureDeCampagne';
import type { CorpusDeCampagne } from '../../../../electron/corpusDeCampagne';
import { SelecteurDeMoteur } from '../../ai/SelecteurDeMoteur';

/** Une fiche à l'écran : sortie du carnet, ou reprise du disque. */
type FicheAffichee = FicheDeCampagne | FicheReprise;

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
    const { campaigns, customGameDrivers } = useSessionOSStore();
    const pilotes = React.useMemo(() => tousLesPilotes(customGameDrivers), [customGameDrivers]);

    /**
     * La campagne visée — **existante ou pas encore**.
     *
     * David, le 2026-08-15 : *« je ne peux pas faire de nouvelle campagne. »*
     * L'écran n'offrait que les campagnes déjà créées, alors que forger sert
     * précisément à en documenter une qui n'existe pas encore. C'était mettre la
     * charrue avant les bœufs : **l'Atelier ne produit pas de campagne**, il
     * produit un dossier de fiches sourcées. Un nom suffit à savoir où les
     * écrire, et la campagne naîtra plus tard de la Forge — *dériver du corpus,
     * pas produire en parallèle.*
     *
     * Chaîne vide = campagne neuve, dont le nom se saisit juste en dessous.
     */
    const [campagneId, setCampagneId] = React.useState('');
    const [nomNeuf, setNomNeuf] = React.useState('');
    /**
     * Le jeu de cette campagne — **inscrit dans les fiches, pas employé ici**.
     *
     * David : *« je n'ai pas dû choisir le driver, c'est normal ? »* Oui pour
     * l'Atelier : il ne produit que du texte sourcé, et les gabarits interdisent
     * les règles. Mais **la Forge en aura besoin** — le modèle de santé des PNJ
     * (`santeSelonLeJeu`), le gabarit de fiche, le `system` de la campagne — et
     * une campagne neuve n'a nulle part où le porter.
     *
     * L'information est disponible maintenant et perdue ensuite. On l'écrit donc
     * en `jeu:` dans le frontmatter, et la chaîne se referme sans que personne
     * ait à se souvenir de son choix dans deux jours. **Il ne change rien aux
     * invites** : le carnet lit le livre de campagne, les règles y sont hors
     * sujet par construction.
     */
    const [piloteId, setPiloteId] = React.useState('');
    const [corpus, setCorpus] = React.useState<CorpusDeCampagne | null>(null);

    const [carnets, setCarnets] = React.useState<CarnetLM[]>([]);
    const [carnetId, setCarnetId] = React.useState('');
    const [sources, setSources] = React.useState<SourceDuCarnet[]>([]);
    const [sourcesRetenues, setSourcesRetenues] = React.useState<string[]>([]);
    const [chargement, setChargement] = React.useState(false);
    /**
     * Le sélecteur de carnet est une **fenêtre de l'application**, pas une liste
     * déroulante native.
     *
     * David, le 2026-08-15 : *« quand je clique sur choisir un carnet j'ai une
     * fenêtre qui s'ouvre à l'extérieur de l'application. »* Un `<select>` natif
     * ouvre un menu du système : hors du thème, hors de la fenêtre, et surtout
     * il ne sait afficher qu'**une** colonne — or le geste est en deux temps,
     * carnet **puis** sources. La Forge Système avait déjà tranché la question
     * en deux colonnes ; j'ai contourné son panneau au lieu de le reprendre.
     */
    const [selecteurOuvert, setSelecteurOuvert] = React.useState(false);

    const [inventaire, setInventaire] = React.useState<string | null>(null);
    const [actes, setActes] = React.useState<ActeLu[]>([]);
    const [structureBrute, setStructureBrute] = React.useState<string | null>(null);
    const [fiches, setFiches] = React.useState<Record<string, FicheAffichee>>({});
    const [publiees, setPubliees] = React.useState<Set<string>>(new Set());
    const [enCours, setEnCours] = React.useState<string | null>(null);
    const [erreur, setErreur] = React.useState<string | null>(null);

    const campagneExistante = campaigns.find(c => c.id === campagneId);
    const nomCible = (campagneExistante?.name ?? nomNeuf).trim();
    /*
      Une campagne existante DÉCLARE son jeu : le redemander serait offrir de le
      contredire, et c'est exactement ce qui a fait réécrire le système d'une
      campagne depuis la Forge de chronique. Ce qu'elle déclare l'emporte.
    */
    const jeuCible = campagneExistante?.system || piloteId;
    const etapes = React.useMemo(() => etapesDeLaCampagne(actes), [actes]);
    const pret = !!nomCible && !!carnetId;

    // Le corpus se résout dès qu'un nom est connu : il faut le MONTRER avant
    // d'écrire, surtout quand le dossier n'existe pas encore.
    const cheminDeclare = campagneExistante?.campaignPath;
    React.useEffect(() => {
        if (!nomCible) { setCorpus(null); return; }
        let vivant = true;
        void corpusDeLaCampagne(nomCible, cheminDeclare)
            .then(c => { if (vivant) setCorpus(c); });
        return () => { vivant = false; };
    }, [nomCible, cheminDeclare]);

    /**
     * **L'avancement se lit sur le disque, jamais en mémoire de session.**
     *
     * Sans cela, fermer l'application laissait les brouillons bien écrits mais
     * hors d'atteinte de l'écran : il aurait fallu reforger, deux minutes de
     * carnet pour une réponse déjà obtenue. On relit donc à chaque changement de
     * corpus — ce qui est publié, et ce qui attend de l'être.
     */
    React.useEffect(() => {
        if (!corpus) { setPubliees(new Set()); setFiches({}); return; }
        let vivant = true;
        void reprendreLAtelier(corpus).then(avancement => {
            if (!vivant) return;
            setPubliees(avancement.publiees);
            // Les brouillons repris ne remplacent JAMAIS une fiche que la session
            // vient de forger : celle-ci porte sa réponse brute et ses vrais
            // avertissements, que le disque ne sait pas restituer.
            setFiches(actuelles => ({ ...avancement.brouillons, ...actuelles }));
        });
        return () => { vivant = false; };
    }, [corpus]);

    const ouvrirLeSelecteur = async () => {
        setSelecteurOuvert(true);
        if (carnets.length > 0) return; // déjà chargés : on ne repaie pas l'appel
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

    /**
     * Force la réauthentification MCP.
     *
     * Le serveur laisse expirer sa session sans le dire autrement que par une
     * erreur opaque. Le bouton existe dans le sélecteur de la Forge Système pour
     * exactement cette raison, et il n'y a pas de raison qu'un atelier l'ait et
     * pas l'autre.
     */
    const reconnecter = async () => {
        setChargement(true);
        setErreur(null);
        try {
            await forgeService.callMcpTool('notebooklm-mcp-server', 'refresh_auth', {});
            setCarnets(await listerLesCarnets());
            gmToast('Pont NotebookLM rétabli.', 'success');
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
        if (corpus) await ecrireLInventaire(corpus, corpus.id, brut, jeuCible);
    });

    const lancerStructure = () => appeler('structure', async () => {
        const { actes: lus, brut } = await serviceDeCampagne.structure(carnetId, sourcesRetenues);
        setActes(lus);
        setStructureBrute(brut);
        // Écrite même quand la lecture ne trouve aucun acte : la réponse du
        // carnet contient alors les enjeux sous une forme qu'on n'a pas su lire,
        // et la jeter obligerait à la repayer.
        if (corpus) await ecrireLaStructure(corpus, corpus.id, brut, jeuCible);
        if (lus.length === 0) {
            gmToast("Aucune partie lue — relis la réponse du carnet ci-dessous et saisis-les à la main.", 'warning');
        }
    });

    const forger = (etape: EtapeDeCampagne) => appeler(etape.id, async () => {
        if (!corpus) return;
        const fiche = await serviceDeCampagne.fiche(carnetId, etape, corpus.id, sourcesRetenues, jeuCible);
        setFiches(f => ({ ...f, [etape.id]: fiche }));
        // Le brouillon part AVANT toute revue : une réponse acquise ne doit pas
        // dépendre de ce qui se passe ensuite.
        await ecrireLeBrouillon(corpus, fiche);
    });

    const publier = async (slug: string) => {
        const fiche = fiches[slug];
        if (!fiche || !corpus) return;
        const { publiee, ecartees } = await publierLaFiche(corpus, fiche);
        if (!publiee) { gmToast("La fiche n'a pas pu être écrite sur le disque.", 'error'); return; }
        setPubliees(p => new Set(p).add(slug));
        gmToast(`« ${fiche.sujet} » publiée.`, 'success');
        /*
          **Un écartement se dit.** Une fiche du même sujet et du même acte,
          publiée sous un autre nom, vient de sortir du corpus vivant. C'est
          voulu — mais silencieux, le meneur croirait avoir deux versions alors
          qu'il n'en a plus qu'une, ou l'inverse.
        */
        if (ecartees.length > 0) {
            gmToast(
                `${ecartees.length} fiche${ecartees.length > 1 ? 's' : ''} du même acte `
                + `écartée${ecartees.length > 1 ? 's' : ''} vers fiches-v1/ : ${ecartees.join(', ')}.`,
                'info',
            );
        }
    };

    /**
     * Les brouillons que le parcours courant ne montre pas.
     *
     * Au retour dans l'atelier, la structure n'a pas été relancée : il n'y a donc
     * aucune étape, et les brouillons repris n'auraient nulle part où
     * s'afficher — la reprise ne servirait à rien. On les liste à part, publiables
     * tels quels.
     */
    const brouillonsOrphelins = Object.values(fiches).filter(
        f => !publiees.has(f.slug) && !etapes.some(e => e.id === f.slug),
    );

    return (
        <div className="h-full overflow-hidden grid grid-cols-12 gap-6 p-6 bg-app-bg text-app-text">
            {/* Configuration */}
            <div className="col-span-4 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <Bloc icone={<BookOpen size={16} />} titre="Campagne">
                    {/*
                        **Une liste, pas un menu déroulant.**

                        Le menu d'un `<select>` est une fenêtre que le SYSTÈME
                        dessine — sous Windows, Chromium en fait une fenêtre
                        native. David l'a vu deux fois s'ouvrir en gris illisible.
                        `color-scheme` et `nativeTheme` corrigent la cause à la
                        racine, pour toute l'application ; ici, on n'a pas besoin
                        d'un menu du tout. Cinq lignes tiennent à l'écran, elles
                        se lisent d'un coup d'œil, et rien n'est délégué à
                        personne.
                    */}
                    <div className="space-y-1">
                        <CibleDeCampagne
                            libelle="— nouvelle campagne —"
                            actif={!campagneExistante}
                            onChoisir={() => setCampagneId('')}
                        />
                        {campaigns.map(c => (
                            <CibleDeCampagne
                                key={c.id}
                                libelle={c.name}
                                actif={campagneId === c.id}
                                onChoisir={() => setCampagneId(c.id)}
                            />
                        ))}
                    </div>

                    {!campagneExistante && (
                        <>
                            <input
                                value={nomNeuf}
                                onChange={e => setNomNeuf(e.target.value)}
                                placeholder="Le titre de la campagne, tel que le livre l'écrit"
                                className="w-full mt-3 bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-xs outline-none focus:border-accent/50"
                            />
                            {/*
                                Dire ce que l'Atelier fait, et ce qu'il ne fait
                                pas. Il documente ; il ne crée pas la campagne
                                dans l'application — c'est le travail de la Forge,
                                qui dérivera ces fiches en actes, lieux et PNJ.
                            */}
                            <p className="text-ui-11 text-app-text/30 italic leading-relaxed mt-2">
                                Pas besoin qu'elle existe déjà : l'Atelier écrit un dossier de fiches
                                sourcées. La campagne elle-même naîtra de la Forge, à partir d'elles.
                            </p>

                            {/*
                                Le jeu ne sert PAS à l'Atelier — il n'entre dans
                                aucune invite. Il est écrit dans les fiches pour
                                la Forge, qui en a besoin pour la santé des PNJ et
                                le gabarit de fiche. Une campagne existante, elle,
                                le déclare déjà : la redemander serait offrir de
                                la contredire.
                            */}
                            <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/30 mt-4 mb-2">
                                Jeu <span className="font-bold normal-case tracking-normal opacity-70">— pour la Forge, plus tard</span>
                            </p>
                            <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                                <CibleDeCampagne
                                    libelle="— je déciderai plus tard —"
                                    actif={!piloteId}
                                    onChoisir={() => setPiloteId('')}
                                />
                                {pilotes.map(p => (
                                    <CibleDeCampagne
                                        key={p.id}
                                        libelle={`${p.emoji ?? ''} ${p.name}`.trim()}
                                        actif={piloteId === p.id}
                                        onChoisir={() => setPiloteId(p.id)}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {campagneExistante && (
                        <p className="text-ui-11 text-app-text/30 italic leading-relaxed mt-2">
                            Jeu : <b className="not-italic text-app-text/50">{campagneExistante.system || 'non déclaré'}</b> —
                            celui de la campagne, inscrit tel quel dans les fiches.
                        </p>
                    )}

                    {corpus && (
                        <div className="mt-3 space-y-1.5">
                            <p className="flex items-center gap-2 text-ui-11 font-mono text-app-text/50">
                                <FolderTree size={12} className="shrink-0" /> docs/{corpus.racine}/fiches
                            </p>
                            <p className="text-ui-10 uppercase tracking-widest font-bold text-app-text/30">
                                résolu par : {corpus.raison}
                            </p>
                            {corpus.aCreer && (
                                <p className="text-ui-11 text-amber-300/80 leading-relaxed">
                                    Ce dossier n'existe pas encore : il sera créé à la première fiche.
                                </p>
                            )}
                            {corpus.contradiction && (
                                <p className="text-ui-11 text-amber-300/80 leading-relaxed">
                                    Le nom de la campagne désignerait <b>{corpus.contradiction}</b>. Le chemin
                                    déclaré l'emporte — mais vérifie que c'est bien voulu.
                                </p>
                            )}
                        </div>
                    )}
                </Bloc>

                <Bloc icone={<Globe size={16} />} titre="Carnet NotebookLM">
                    <button
                        onClick={() => void ouvrirLeSelecteur()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/20 transition-all"
                    >
                        <Globe size={12} /> {carnetId ? 'Changer de carnet' : 'Choisir un carnet'}
                    </button>

                    {carnetId && (
                        <div className="mt-3 space-y-1">
                            <p className="text-xs font-bold truncate">
                                {carnets.find(c => c.id === carnetId)?.title ?? carnetId}
                            </p>
                            <p className="text-ui-10 uppercase tracking-widest font-bold text-app-text/30">
                                {sourcesRetenues.length > 0
                                    ? `${sourcesRetenues.length} source${sourcesRetenues.length > 1 ? 's' : ''} retenue${sourcesRetenues.length > 1 ? 's' : ''}`
                                    : 'carnet entier'}
                            </p>
                            {/* Filtrer les sources a fait passer l'inventaire des
                                règles de l'échec à 72 secondes : douze sources
                                contre une. C'est le levier le plus rentable. */}
                            {sourcesRetenues.length === 0 && sources.length > 1 && (
                                <p className="text-ui-11 text-amber-300/70 leading-relaxed pt-1">
                                    Ne retenir que le livre de cette campagne accélère beaucoup les
                                    réponses — et évite que le carnet réponde depuis un autre jeu.
                                </p>
                            )}
                        </div>
                    )}
                </Bloc>


                {/*
                    **Le moteur de cette Forge — axe J.**

                    *« Cloud accepté pour les Forges, choix explicite à chaque
                    lancement, jamais de bascule automatique. »* Il était un
                    badge : il annonçait ce qui allait servir sans offrir d'en
                    changer, et le meneur devait passer par les réglages globaux
                    — donc **basculer l'Oracle et le Cortex avec**, puis penser à
                    revenir.

                    Toujours affiché, même quand il suit le réglage global :
                    *mémoriser sans montrer redonnerait un réglage qu'on a oublié
                    d'avoir posé.*
                */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
                    <span className="text-ui-10 font-black uppercase tracking-widest text-app-text/35">
                        Moteur de la forge
                    </span>
                    <SelecteurDeMoteur forge="campagne" />
                </div>

                {erreur && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-ui-10 font-black uppercase tracking-widest text-red-400">Le carnet refuse</p>
                        <p className="text-ui-11 text-app-text/60 mt-1 font-mono leading-relaxed">{erreur}</p>
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
                        <h3 className="text-ui-11 font-black uppercase tracking-widest">
                            3. Les fiches {etapes.length > 0 && <span className="text-app-text/30">({etapes.length})</span>}
                        </h3>
                    </div>

                    {/* Ce que le disque atteste, avant même d'avoir relancé quoi que ce soit. */}
                    {corpus && (publiees.size > 0 || brouillonsOrphelins.length > 0) && (
                        <p className="text-ui-11 text-app-text/40 leading-relaxed mt-2">
                            Déjà sur le disque : <b className="text-emerald-400/80">{publiees.size} publiée{publiees.size > 1 ? 's' : ''}</b>
                            {brouillonsOrphelins.length > 0 && <>, <b className="text-amber-300/80">{brouillonsOrphelins.length} brouillon{brouillonsOrphelins.length > 1 ? 's' : ''} en attente</b></>}.
                        </p>
                    )}

                    {actes.length === 0 ? (
                        <p className="text-ui-11 text-app-text/30 italic leading-relaxed mt-2">
                            Les deux sujets qui s'interrogent partie par partie — les personnages et les
                            scènes — attendent la structure. Sans elle, ils repartiraient sur la campagne
                            entière et rendraient la même réponse à chaque fois.
                        </p>
                    ) : (
                        <div className="space-y-1.5 mt-3">
                            {etapes.map(etape => (
                                <LigneDeFiche
                                    key={etape.id}
                                    titre={etape.titre}
                                    fiche={fiches[etape.id]}
                                    publiee={publiees.has(etape.id)}
                                    enCours={enCours === etape.id}
                                    actif={pret && !!corpus}
                                    onForger={() => forger(etape)}
                                    onPublier={() => void publier(etape.id)}
                                />
                            ))}
                        </div>
                    )}

                    {brouillonsOrphelins.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-app-border/10 space-y-1.5">
                            <p className="text-ui-10 font-black uppercase tracking-widest text-amber-400/60">
                                Brouillons repris du disque
                            </p>
                            {brouillonsOrphelins.map(fiche => (
                                <LigneDeFiche
                                    key={fiche.slug}
                                    titre={fiche.sujet || fiche.slug}
                                    fiche={fiche}
                                    publiee={false}
                                    enCours={false}
                                    actif={false}
                                    onForger={() => {}}
                                    onPublier={() => void publier(fiche.slug)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selecteurOuvert && (
                <SelecteurDeCarnet
                    carnets={carnets}
                    carnetId={carnetId}
                    sources={sources}
                    sourcesRetenues={sourcesRetenues}
                    chargement={chargement}
                    onChoisirCarnet={id => void choisirLeCarnet(id)}
                    onBasculerSource={id => setSourcesRetenues(r =>
                        r.includes(id) ? r.filter(x => x !== id) : [...r, id])}
                    onReconnecter={() => void reconnecter()}
                    onFermer={() => setSelecteurOuvert(false)}
                />
            )}
        </div>
    );
};

/**
 * Le choix du carnet, **dans l'application**.
 *
 * Deux colonnes, comme celui de la Forge Système : les carnets à gauche, les
 * sources du carnet retenu à droite. C'est le geste réel — *choisir le carnet,
 * puis choisir ce qu'on veut forger dedans* — et une liste déroulante ne sait
 * pas l'exprimer : elle n'a qu'une colonne, et son menu est rendu par le système
 * d'exploitation, hors de la fenêtre et hors du thème.
 */
const SelecteurDeCarnet: React.FC<{
    carnets: CarnetLM[];
    carnetId: string;
    sources: SourceDuCarnet[];
    sourcesRetenues: string[];
    chargement: boolean;
    onChoisirCarnet: (id: string) => void;
    onBasculerSource: (id: string) => void;
    onReconnecter: () => void;
    onFermer: () => void;
}> = ({ carnets, carnetId, sources, sourcesRetenues, chargement, onChoisirCarnet, onBasculerSource, onReconnecter, onFermer }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-app-bg/80 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-4xl h-[70vh] bg-app-bg border border-accent/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-accent/5">
                <h2 className="text-lg font-bold uppercase tracking-wider text-accent flex items-center gap-3">
                    <Globe size={22} /> Carnet et sources
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReconnecter}
                        title="Forcer la reconnexion au pont NotebookLM"
                        className="p-2 hover:bg-accent/10 rounded-full text-accent transition-all hover:rotate-180 duration-500"
                    >
                        <Zap size={18} />
                    </button>
                    <button onClick={onFermer} title="Fermer" className="p-2 hover:bg-app-text/5 rounded-full text-app-text/40 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/3 border-r border-app-border/10 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-app-surface/20">
                    {chargement && carnets.length === 0 ? (
                        <div className="flex items-center justify-center h-40"><Loader2 size={28} className="text-accent animate-spin" /></div>
                    ) : carnets.length === 0 ? (
                        <p className="text-ui-11 text-app-text/30 italic p-3 leading-relaxed">
                            Aucun carnet. Le pont MCP est peut-être déconnecté — l'éclair, en haut, force
                            la reconnexion.
                        </p>
                    ) : carnets.map(nb => (
                        <button
                            key={nb.id}
                            onClick={() => onChoisirCarnet(nb.id)}
                            className={`w-full text-left p-4 rounded-2xl transition-all border ${
                                carnetId === nb.id
                                    ? 'bg-accent/20 border-accent/40 text-accent'
                                    : 'border-transparent hover:bg-app-text/5 text-app-text/40'
                            }`}
                        >
                            <div className="text-xs font-bold uppercase tracking-widest">{nb.title}</div>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {!carnetId ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20 italic gap-3">
                            <BookOpen size={48} />
                            <p className="text-sm">Choisis un carnet pour voir ses sources.</p>
                        </div>
                    ) : chargement ? (
                        <div className="h-full flex items-center justify-center"><Loader2 size={36} className="text-accent animate-spin" /></div>
                    ) : (
                        <div className="space-y-3">
                            {/*
                                Rien de coché vise le carnet entier — et c'est un
                                choix, pas un oubli. Une liste vide n'est PAS « pas
                                de filtre » pour le serveur : selon les jours elle
                                peut se lire « ne retiens aucune source », d'où
                                l'omission de la clé côté service.
                            */}
                            <p className="text-ui-11 text-app-text/35 leading-relaxed">
                                {sourcesRetenues.length === 0
                                    ? 'Aucune source retenue : le carnet entier sera interrogé.'
                                    : `${sourcesRetenues.length} source${sourcesRetenues.length > 1 ? 's' : ''} retenue${sourcesRetenues.length > 1 ? 's' : ''} — les autres seront ignorées.`}
                            </p>

                            {sources.length === 0 && (
                                <p className="text-ui-11 text-app-text/30 italic">Ce carnet ne rend aucune source.</p>
                            )}

                            {sources.map(s => {
                                const retenue = sourcesRetenues.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => onBasculerSource(s.id)}
                                        className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border text-left transition-all ${
                                            retenue
                                                ? 'bg-accent/15 border-accent/40'
                                                : 'bg-app-surface/40 border-app-border/10 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <span className="text-sm font-medium truncate">{s.title}</span>
                                        <span className={`shrink-0 px-3 py-1.5 rounded-lg text-ui-10 font-black uppercase tracking-widest ${
                                            retenue ? 'bg-accent text-white' : 'bg-white/5 text-app-text/40'
                                        }`}>
                                            {retenue ? 'retenue' : 'retenir'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-app-border/10 flex justify-end bg-app-surface/20">
                <button
                    onClick={onFermer}
                    className="px-6 py-2.5 rounded-xl bg-accent text-white text-ui-10 font-black uppercase tracking-widest hover:brightness-110 transition-all"
                >
                    Terminé
                </button>
            </div>
        </div>
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
                    <h3 className="text-ui-11 font-black uppercase tracking-widest text-app-text">
                        {numero}. {titre}
                    </h3>
                    {fait && <Check size={13} className="text-emerald-400" />}
                </div>
                <p className="text-ui-11 text-app-text/35 leading-relaxed mt-1.5">{aide}</p>
            </div>
            <button
                onClick={onLancer}
                disabled={!actif || enCours}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                {enCours ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {fait ? 'Relancer' : 'Lancer'}
            </button>
        </div>
        {children}
    </div>
);

const LigneDeFiche: React.FC<{
    titre: string; fiche?: FicheAffichee; publiee: boolean;
    enCours: boolean; actif: boolean; onForger: () => void; onPublier: () => void;
}> = ({ titre, fiche, publiee, enCours, actif, onForger, onPublier }) => (
    <div className="rounded-xl border border-app-border/10 bg-app-bg/30 px-4 py-3">
        <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{titre}</p>
                {fiche && (
                    <p className="text-ui-10 uppercase tracking-widest font-bold text-app-text/30 mt-0.5">
                        couverture {fiche.couverture} · {fiche.sections.length} section{fiche.sections.length > 1 ? 's' : ''}
                        {/* Une fiche relue du disque ne porte pas les avertissements
                            de sa forge : la réponse brute du carnet n'est pas
                            conservée. Le dire évite de lire un silence comme un
                            « rien à signaler ». */}
                        {'reprise' in fiche && <span className="text-amber-400/50"> · reprise du disque</span>}
                    </p>
                )}
            </div>
            {publiee ? (
                <span className="flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-emerald-400">
                    <Check size={12} /> publiée
                </span>
            ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={onForger}
                        disabled={!actif || enCours}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/20 disabled:opacity-30 transition-all"
                    >
                        {enCours ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                        {fiche ? 'Refaire' : 'Forger'}
                    </button>
                    {fiche && (
                        <button
                            onClick={onPublier}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-ui-10 font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all"
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
                    <li key={i} className="flex items-start gap-2 text-ui-11 text-amber-300/70 leading-relaxed">
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
        <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-text/30 hover:text-app-text/60">
            Réponse du carnet
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-ui-11 leading-relaxed text-app-text/60 whitespace-pre-wrap bg-app-bg/40 rounded-xl p-4 border border-app-border/10">
            {texte}
        </pre>
    </details>
);

export default AtelierDeCampagne;
