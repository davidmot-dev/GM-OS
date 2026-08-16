import React from 'react';
import {
    BookOpen, FolderTree, Loader2, Play, AlertTriangle, Network, Check,
    MapPin, Users, KeyRound, Clapperboard, ScrollText, Info,
} from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import { gmToast } from '../../../stores/useToastStore';
import { Bloc, CibleDeCampagne } from './atomes';
import { corpusDeLaCampagne } from './ServiceDeCampagne';
import { lireLesFichesDeLaCampagne, partiesDesFiches, type LectureDesFichesDeCampagne } from './lectureDesFiches';
import { forgerLaCampagne, type ResultatDeForge, type AvancementDeForge } from './ForgeDeCampagne';
import { ecrireLaCampagne, type EcritureDeLaCampagne } from './ecritureDeLaCampagne';
import type { CorpusDeCampagne } from '../../../../electron/corpusDeCampagne';

/**
 * La Forge de campagne — les fiches deviennent des actes, des scènes et des PNJ.
 *
 * **Elle ne lit pas le livre.** L'Atelier l'a fait, sujet par sujet et acte par
 * acte ; ici on projette ses fiches. C'est la règle du projet — *dériver du
 * corpus, pas produire en parallèle* — et c'est aussi ce qui rend chaque objet
 * traçable jusqu'à une fiche vérifiée.
 *
 * **Trois temps, et l'ordre compte.** Lire le disque, forger, écrire. Le meneur
 * voit ce qui va se passer avant que sa campagne ne bouge : la revue n'est pas
 * une politesse, c'est le seul moment où un renvoi tombé à côté peut encore se
 * corriger à moindres frais.
 *
 * **La campagne se choisit ICI**, comme dans l'Atelier et pour la même raison :
 * hériter du choix d'un autre écran a conduit, le 2026-08-10, à réaffecter le
 * pilote d'une campagne Blade Runner pour pouvoir enrichir Dune.
 */
const ForgeDeLaTrame: React.FC = () => {
    const campaigns = useSessionOSStore(s => s.campaigns);
    const customGameDrivers = useSessionOSStore(s => s.customGameDrivers);
    const appliquerLaCampagneForgee = useSessionOSStore(s => s.appliquerLaCampagneForgee);
    const actesExistants = useSessionOSStore(s => s.actes);
    const scenesExistantes = useSessionOSStore(s => s.scenes);
    const entitesExistantes = useSessionOSStore(s => s.entities);
    const cartesExistantes = useSessionOSStore(s => s.atlasMaps);
    const wikiExistant = useSessionOSStore(s => s.wikiEntries);
    const indicesExistants = useSessionOSStore(s => s.clues);

    const pilotes = React.useMemo(() => tousLesPilotes(customGameDrivers), [customGameDrivers]);

    const [campagneId, setCampagneId] = React.useState('');
    const [nomNeuf, setNomNeuf] = React.useState('');
    const [corpus, setCorpus] = React.useState<CorpusDeCampagne | null>(null);
    const [lecture, setLecture] = React.useState<LectureDesFichesDeCampagne | null>(null);
    const [resultat, setResultat] = React.useState<ResultatDeForge | null>(null);
    const [ecrit, setEcrit] = React.useState<EcritureDeLaCampagne | null>(null);
    const [avancement, setAvancement] = React.useState<AvancementDeForge | null>(null);
    const [enCours, setEnCours] = React.useState(false);
    const [erreur, setErreur] = React.useState<string | null>(null);

    const campagneExistante = campaigns.find(c => c.id === campagneId);
    const nomCible = (campagneExistante?.name ?? nomNeuf).trim();
    const cheminDeclare = campagneExistante?.campaignPath;

    /*
      **Le jeu de la campagne l'emporte sur celui des fiches.** Une campagne
      existante DÉCLARE son système ; l'adopter depuis les fiches reviendrait à
      offrir de le contredire, et c'est exactement ce qui a fait réécrire le jeu
      d'une campagne depuis la Forge de chronique le 2026-08-15. Les fiches ne
      servent qu'à une campagne neuve, qui n'a rien à contredire.
    */
    const jeuCible = campagneExistante?.system || lecture?.jeu || '';
    const driver = pilotes.find(p => p.id === jeuCible) ?? null;

    // Le corpus se résout dès qu'un nom est connu : il faut MONTRER où l'on va
    // lire, parce qu'un dossier vide et un mauvais dossier se ressemblent.
    React.useEffect(() => {
        if (!nomCible) { setCorpus(null); return; }
        let vivant = true;
        void corpusDeLaCampagne(nomCible, cheminDeclare).then(c => { if (vivant) setCorpus(c); });
        return () => { vivant = false; };
    }, [nomCible, cheminDeclare]);

    // Changer de corpus invalide tout ce qui en découle : garder un projet forgé
    // sur d'autres fiches l'écrirait dans la mauvaise campagne.
    React.useEffect(() => {
        setResultat(null);
        setEcrit(null);
        if (!corpus) { setLecture(null); return; }
        let vivant = true;
        void lireLesFichesDeLaCampagne(corpus)
            .then(l => { if (vivant) setLecture(l); })
            .catch(e => { if (vivant) setErreur(e instanceof Error ? e.message : String(e)); });
        return () => { vivant = false; };
    }, [corpus]);

    const actesDuDisque = React.useMemo(
        () => (lecture ? partiesDesFiches(lecture.fiches) : []),
        [lecture],
    );

    const forger = async () => {
        if (!lecture || lecture.fiches.length === 0) return;
        setEnCours(true);
        setErreur(null);
        setEcrit(null);
        setAvancement(null);
        try {
            setResultat(await forgerLaCampagne(lecture.fiches, {
                ...(driver ? { driver } : {}),
                onProgres: setAvancement,
            }));
        } catch (e) {
            setErreur(e instanceof Error ? e.message : String(e));
        } finally {
            setEnCours(false);
            setAvancement(null);
        }
    };

    const ecrire = () => {
        if (!resultat) return;
        const ecriture = ecrireLaCampagne(resultat.projet, {
            ...(campagneExistante ? { campaignId: campagneExistante.id } : {}),
            ...(jeuCible ? { systeme: jeuCible } : {}),
            driver,
            existant: {
                actes: actesExistants,
                scenes: scenesExistantes,
                entities: entitesExistantes,
                atlasMaps: cartesExistantes,
                wikiEntries: wikiExistant,
                clues: indicesExistants,
            },
        });
        appliquerLaCampagneForgee(ecriture);
        setEcrit(ecriture);
        gmToast(`« ${nomCible} » écrite dans le magasin.`, 'success');
    };

    return (
        <div className="h-full overflow-hidden grid grid-cols-12 gap-6 p-6 bg-app-bg text-app-text">
            {/* ── Ce qu'on vise ─────────────────────── */}
            <div className="col-span-4 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <Bloc icone={<BookOpen size={16} />} titre="Campagne">
                    <div className="space-y-1">
                        <CibleDeCampagne
                            libelle="— campagne à créer —"
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
                                placeholder="Le nom du dossier de fiches à projeter"
                                className="w-full mt-3 bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-xs outline-none focus:border-accent/50"
                            />
                            <p className="text-[11px] text-app-text/30 italic leading-relaxed mt-2">
                                La campagne naîtra de cette forge, avec le jeu que ses fiches déclarent.
                            </p>
                        </>
                    )}

                    {campagneExistante && (
                        <p className="text-[11px] text-app-text/30 italic leading-relaxed mt-2">
                            Enrichissement : ce qui porte déjà ce nom ne sera ni doublé, ni réécrit.
                        </p>
                    )}

                    {corpus && (
                        <div className="mt-3 space-y-1.5">
                            <p className="flex items-center gap-2 text-[11px] font-mono text-app-text/50">
                                <FolderTree size={12} className="shrink-0" /> docs/{corpus.racine}/fiches
                            </p>
                            {corpus.contradiction && (
                                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                                    Le nom désignerait <b>{corpus.contradiction}</b>. Le chemin déclaré
                                    l'emporte — vérifie que c'est bien voulu.
                                </p>
                            )}
                        </div>
                    )}
                </Bloc>

                <Bloc icone={<ScrollText size={16} />} titre="Ce que le disque porte">
                    {!lecture ? (
                        <p className="text-[11px] text-app-text/30 italic">Choisis une campagne.</p>
                    ) : lecture.fiches.length === 0 ? (
                        <p className="text-[11px] text-amber-300/80 leading-relaxed">
                            Aucune fiche publiée dans ce dossier. La Forge lit <b>fiches/</b> et jamais
                            <b> drafts/</b> : un brouillon n'a pas été relu, et une campagne bâtie sur des
                            brouillons porterait des faits que personne n'a vérifiés.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <Compte icone={<ScrollText size={13} />} nombre={lecture.fiches.length} quoi="fiches publiées" />
                            <Compte icone={<Clapperboard size={13} />} nombre={actesDuDisque.length} quoi="actes attestés" />
                            {actesDuDisque.length > 0 && (
                                <p className="text-[11px] text-app-text/40 leading-relaxed">
                                    {actesDuDisque.join(' · ')}
                                </p>
                            )}
                            <p className="text-[10px] uppercase tracking-widest font-bold text-app-text/30 pt-1">
                                jeu : {jeuCible || 'non déclaré'}
                                {!driver && jeuCible && ' — pilote introuvable'}
                            </p>
                            {!driver && (
                                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                                    Sans pilote, les PNJ naîtront sans modèle de santé et sur le gabarit
                                    générique. Rien d'inventé — mais rien de réglé non plus.
                                </p>
                            )}
                            {lecture.ecartees.map(e => (
                                <p key={e.sujet} className="text-[11px] text-app-text/35 leading-relaxed">
                                    <b>{e.sujet}</b> — écartée : {e.raison}.
                                </p>
                            ))}
                            {lecture.ignorees.map(i => (
                                <p key={i.fichier} className="text-[11px] text-amber-300/70 leading-relaxed">
                                    {i.fichier} — {i.raison}.
                                </p>
                            ))}
                        </div>
                    )}
                </Bloc>

                <button
                    onClick={() => void forger()}
                    disabled={enCours || !lecture || lecture.fiches.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                >
                    {enCours ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    {enCours ? 'Forge en cours' : 'Forger la trame'}
                </button>

                {avancement && (
                    <p className="text-[11px] text-app-text/45 text-center leading-relaxed">
                        {avancement.rang}/{avancement.total} — {avancement.groupe.label}
                        {avancement.acte && <span className="opacity-60"> · {avancement.acte}</span>}
                    </p>
                )}

                {erreur && (
                    <p className="flex items-start gap-2 text-[11px] text-red-300/90 leading-relaxed">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {erreur}
                    </p>
                )}
            </div>

            {/* ── Ce que la Forge a produit ─────────── */}
            <div className="col-span-8 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {!resultat ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 italic gap-3">
                        <Network size={48} />
                        <p className="text-sm max-w-sm leading-relaxed">
                            La Forge lit les fiches et les projette en actes, lieux, personnages,
                            indices et scènes — dans cet ordre, chacun ne pouvant désigner que ce que
                            les précédents ont créé.
                        </p>
                    </div>
                ) : (
                    <>
                        <Bloc icone={<Network size={16} />} titre="La trame forgée">
                            <div className="grid grid-cols-3 gap-2">
                                <Compte icone={<Clapperboard size={13} />} nombre={resultat.projet.actes.length} quoi="actes" />
                                <Compte icone={<Clapperboard size={13} />} nombre={resultat.projet.scenes.length} quoi="scènes" />
                                <Compte icone={<MapPin size={13} />} nombre={resultat.projet.lieux.length} quoi="lieux" />
                                <Compte icone={<Users size={13} />} nombre={resultat.projet.pnj.length} quoi="personnages" />
                                <Compte icone={<Users size={13} />} nombre={resultat.projet.relations.length} quoi="liens" />
                                <Compte icone={<KeyRound size={13} />} nombre={resultat.projet.indices.length} quoi="indices" />
                                <Compte icone={<ScrollText size={13} />} nombre={resultat.projet.factions.length} quoi="factions" />
                                <Compte icone={<ScrollText size={13} />} nombre={resultat.projet.savoir.length} quoi="entrées" />
                            </div>

                            {resultat.projet.campagne && (
                                <p className="text-[11px] text-app-text/45 leading-relaxed mt-3">
                                    <b className="text-app-text/70">{resultat.projet.campagne.name}</b> —
                                    {' '}{resultat.projet.campagne.description}
                                </p>
                            )}
                        </Bloc>

                        {resultat.projet.actes.length > 0 && (
                            <Bloc icone={<Clapperboard size={16} />} titre="Actes et scènes">
                                <div className="space-y-3">
                                    {resultat.projet.actes.map(acte => (
                                        <div key={acte.titre}>
                                            <p className="text-xs font-bold">{acte.titre}</p>
                                            <p className="text-[11px] text-app-text/40 italic leading-relaxed">
                                                {acte.resume || 'Aucun enjeu : la structure n’était pas sur le disque.'}
                                            </p>
                                            <ul className="mt-1 space-y-0.5">
                                                {resultat.projet.scenes
                                                    .filter(s => s.acte === acte.titre)
                                                    .map(s => (
                                                        <li key={s.titre} className="text-[11px] text-app-text/55 pl-3">
                                                            · {s.titre}
                                                            {s.lieu && <span className="opacity-40"> — {s.lieu}</span>}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </Bloc>
                        )}

                        {(resultat.lacunes.length > 0 || resultat.echecs.length > 0) && (
                            <Bloc icone={<AlertTriangle size={16} />} titre="Ce qui manque">
                                <div className="space-y-2">
                                    {resultat.lacunes.map(l => (
                                        <p key={l.quoi} className="text-[11px] text-amber-300/80 leading-relaxed">
                                            <b>{l.quoi}</b> — {l.consequence}
                                        </p>
                                    ))}
                                    {resultat.echecs.map((e, i) => (
                                        <p key={`${e.groupe}-${e.acte ?? ''}-${i}`} className="text-[11px] text-app-text/40 leading-relaxed">
                                            {e.groupe}{e.acte ? ` · ${e.acte}` : ''} — {e.raison}
                                        </p>
                                    ))}
                                </div>
                            </Bloc>
                        )}

                        <button
                            onClick={ecrire}
                            disabled={!!ecrit}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/80 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:brightness-110 transition-all"
                        >
                            <Check size={13} />
                            {ecrit ? 'Écrite' : campagneExistante ? 'Enrichir la campagne' : 'Créer la campagne'}
                        </button>

                        {ecrit && (
                            <Bloc icone={<Info size={16} />} titre="Ce que l'écriture a fait">
                                <div className="space-y-2">
                                    <p className="text-[11px] text-app-text/50 leading-relaxed">
                                        {ecrit.actes.length} actes, {ecrit.scenes.length} scènes,
                                        {' '}{ecrit.entities.length} personnages, {ecrit.clues.length} indices,
                                        {' '}{ecrit.atlasMaps.length} lieux écrits.
                                    </p>

                                    {ecrit.conserves.length > 0 && (
                                        <p className="text-[11px] text-app-text/40 leading-relaxed">
                                            <b>Conservés tels quels</b> ({ecrit.conserves.length}) :
                                            {' '}{ecrit.conserves.map(c => c.nom).join(', ')}. Ce que tu avais
                                            corrigé n'a pas été touché.
                                        </p>
                                    )}

                                    {/*
                                        **Les non-résolus se disent, et c'est tout l'objet du § 6.3.**
                                        `crossDomainHelpers.ts:42` les filtrait en silence : une scène
                                        amputée de ses PNJ a l'aspect exact d'une scène qui n'en avait
                                        pas, et l'écran annonçait un succès.
                                    */}
                                    {ecrit.nonResolus.length > 0 ? (
                                        <div className="space-y-1 pt-1">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-amber-300/70">
                                                {ecrit.nonResolus.length} renvois sans cible
                                            </p>
                                            {ecrit.nonResolus.map((r, i) => (
                                                <p key={`${r.depuis}-${r.champ}-${i}`} className="text-[11px] text-amber-300/70 leading-relaxed">
                                                    {r.depuis} · {r.champ} → « {r.nom} » ne désigne rien.
                                                </p>
                                            ))}
                                            <p className="text-[11px] text-app-text/35 italic leading-relaxed pt-1">
                                                Ces renvois n'ont pas été posés. Le reste de l'objet l'a été :
                                                à rattacher à la main depuis l'écran de trame.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                                            Tous les renvois ont trouvé leur cible.
                                        </p>
                                    )}
                                </div>
                            </Bloc>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const Compte: React.FC<{ icone: React.ReactNode; nombre: number; quoi: string }> = ({ icone, nombre, quoi }) => (
    <p className={`flex items-center gap-2 text-[11px] ${nombre === 0 ? 'text-app-text/25' : 'text-app-text/60'}`}>
        <span className="text-accent/70">{icone}</span>
        <b className="text-app-text/80">{nombre}</b> {quoi}
    </p>
);

export default ForgeDeLaTrame;
