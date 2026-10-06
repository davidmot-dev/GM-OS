import React, { useMemo, useState } from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Panneau } from '../../../components/socle/Panneau';
import { Etiquette } from '../../../components/socle/Etiquette';
import { EyeOff, FileText, Layers, BookOpen, Search, X, Lightbulb, Vault } from 'lucide-react';
import { type RemoteLectureDuMeneur, type RemoteActe, type RemoteScene } from '../segmentDeLecture';
import MarqueDIntrigue from '../../session/components/trame/MarqueDIntrigue';
import {
    styleDuTitre, infobulle, infobulleDeLImportance,
} from '../../session/logic/importanceDeLaScene';
import RemoteObsidian from './RemoteObsidian';
import type { CoffreObsidian } from '../hooks/useRemoteSync';
import { chroniquesParType, LIBELLE_DE_CATEGORIE } from '../chroniquesParType';
import TexteMarkdown from '../../../components/TexteMarkdown';

/**
 * **Le panneau de lecture du meneur — élargi le 2026-09-05.**
 *
 * Demandé par David : *« je voudrais que les notes contiennent aussi d'autres
 * éléments comme la trame, les scènes prévues dans la session, l'accès au wiki
 * »*. Il ne portait que le résumé public et les secrets de la séance, deux
 * champs de texte libre — et tout ce qu'on relit vraiment en jouant vivait sur
 * l'écran du PC, c'est-à-dire hors de portée dès qu'on tient la tablette.
 *
 * Six vues, et **l'ordre est celui de la fréquence, pas celui du modèle** :
 * *Séance* d'abord, parce que « où en est-on » est la question qu'on se pose dix
 * fois par soirée.
 */

interface RemoteNotesProps {
    notes: { public: string, private: string };
    lecture?: RemoteLectureDuMeneur;
    isAventureMode: boolean;
    /** Le coffre Obsidian — hors du flux périodique, voir `RemoteObsidian`. */
    coffre: CoffreObsidian;
    onChargerLeCoffre: () => void;
    onOuvrirUneNote: (chemin: string) => void;
    onFermerLaNote: () => void;
}

type Vue = 'seance' | 'trame' | 'wiki' | 'obsidian' | 'indices' | 'secrets';

const aplati = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Ce que chaque état de scène dit, et de quelle couleur. */
const ETATS = {
    'en-cours': { mot: 'En cours', ton: 'succes', teinte: 'text-etat-succes border-etat-succes/40' },
    'en-pause': { mot: 'En pause', ton: 'alerte', teinte: 'text-etat-alerte border-etat-alerte/40' },
    'prevue': { mot: 'À jouer', ton: 'neutre', teinte: 'text-app-muted border-app-text/10' },
    'terminee': { mot: 'Close', ton: 'neutre', teinte: 'text-app-subtle border-app-text/5' },
} as const;

/** Une scène en une ligne : titre et état, le reste au déplié. */
const LigneDeScene: React.FC<{ scene: RemoteScene; ouverte: boolean; basculer: () => void }> = ({
    scene, ouverte, basculer,
}) => {
    const etat = ETATS[scene.etat];
    return (
        <Panneau as="div" habillage="libre" className={`rounded-lg border ${scene.etat === 'en-cours' ? 'border-etat-succes/40 bg-etat-succes/5' : 'border-app-text/5 bg-app-text/[0.02]'}`}>
            <Bouton habillage="libre" cibleTactile
                onClick={basculer}
                aria-expanded={ouverte}
                title={infobulle(infobulleDeLImportance(scene.importance))}
                className="w-full min-h-[48px] flex flex-wrap items-center gap-2 px-3 py-3 text-left"
            >
                {/*
                  ⭐ **Le même liseré que sur l'écran du meneur.** C'est ici qu'on
                  lit sa trame en jouant : savoir qu'une scène est optionnelle au
                  moment où l'on hésite à la lancer vaut plus que de le savoir en
                  préparation.

                  ⚠️ Le titre est en `font-bold` par défaut sur la tablette —
                  d'où `font-normal` dans `styleDuTitre` pour l'optionnelle, sans
                  quoi elle paraîtrait plus appuyée qu'une scène secondaire.
                */}
                <MarqueDIntrigue scene={scene} />
                <Etiquette habillage="libre" ton={etat.ton} className={`shrink-0 text-[14px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${etat.teinte}`}>
                    {etat.mot}
                </Etiquette>
                <span className={`flex-1 min-w-[120px] text-[16px] font-bold [overflow-wrap:anywhere] ${styleDuTitre(scene.importance)} ${scene.etat === 'terminee' ? 'text-app-subtle line-through' : 'text-app-text'}`}>
                    {scene.titre}
                </span>
                {/*
                  *Close sans avoir été jouée* n'est pas *close* : le journal
                  lirait la seconde comme du vécu. La trame du meneur fait déjà
                  cette distinction — la tablette la garde.
                */}
                {scene.jamaisJouee && (
                    <span className="shrink-0 text-[14px] italic text-app-subtle">jamais jouée</span>
                )}
            </Bouton>
            {ouverte && (
                <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
                    {scene.resume && <p className="text-[14px] leading-relaxed text-app-muted">{scene.resume}</p>}
                    {scene.notesDuMeneur && (
                        <p className="text-[14px] leading-relaxed text-etat-alerte/80 border-l-2 border-etat-alerte/30 pl-2 whitespace-pre-wrap">
                            {scene.notesDuMeneur}
                        </p>
                    )}
                    {!scene.resume && !scene.notesDuMeneur && scene.suites.length === 0 && (
                        <p className="text-[14px] italic text-app-subtle">Rien d'écrit sur cette scène.</p>
                    )}

                    {/*
                      ⭐ **Où ça peut aller ensuite.** C'est en pleine partie qu'on se
                      pose la question, tablette en main — et jusqu'ici la réponse
                      vivait sur l'écran du PC, c'est-à-dire hors de portée.
                    */}
                    {scene.suites.length > 0 && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-app-text/5">
                            <span className="text-[14px] font-black uppercase tracking-wider text-etat-info/60">
                                Peut mener à
                            </span>
                            {scene.suites.map((suite, index) => (
                                <span key={`${suite.titre}-${index}`} className="flex items-baseline gap-1.5 text-[14px]">
                                    <span className="text-etat-info/80 font-bold">{suite.titre}</span>
                                    {suite.libelle && <span className="italic text-app-muted">{suite.libelle}</span>}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Panneau>
    );
};

const RemoteNotes: React.FC<RemoteNotesProps> = ({
    notes, lecture, isAventureMode, coffre, onChargerLeCoffre, onOuvrirUneNote, onFermerLaNote,
}) => {
    const [vue, setVue] = useState<Vue>('seance');
    const [filtreWiki, setFiltreWiki] = useState('');
    const [ficheOuverte, setFicheOuverte] = useState<string | null>(null);
    const [scenesOuvertes, setScenesOuvertes] = useState<Set<string>>(new Set());
    const [actesReplies, setActesReplies] = useState<Set<string>>(new Set());

    const actes = useMemo(() => lecture?.actes ?? [], [lecture]);
    const wiki = useMemo(() => lecture?.wiki ?? [], [lecture]);
    const indices = lecture?.indices ?? [];

    const basculer = (id: string, poser: React.Dispatch<React.SetStateAction<Set<string>>>) =>
        poser((avant) => {
            const apres = new Set(avant);
            if (apres.has(id)) apres.delete(id); else apres.add(id);
            return apres;
        });

    /*
      **Ce qui se joue maintenant, tous actes confondus.** Une scène en cours
      peut appartenir à un acte qu'on croyait derrière soi — *la trame est un
      plan glissant tant que la campagne vit.*
    */
    const scenesDuMoment = useMemo(() => {
        const toutes = actes.flatMap((a) => a.scenes.map((s) => ({ scene: s, acte: a })));
        return {
            enCours: toutes.filter(({ scene }) => scene.etat === 'en-cours'),
            enPause: toutes.filter(({ scene }) => scene.etat === 'en-pause'),
            aJouer: toutes.filter(({ scene, acte }) => scene.etat === 'prevue' && !acte.acheve),
        };
    }, [actes]);

    const wikiFiltre = useMemo(() => {
        const cherche = aplati(filtreWiki.trim());
        if (!cherche) return wiki;
        return wiki.filter((f) => aplati(`${f.titre} ${f.contenu} ${f.tags.join(' ')}`).includes(cherche));
    }, [wiki, filtreWiki]);

    /* Le rangement vit dans `chroniquesParType`, où il est testé. */
    const groupesDeChroniques = useMemo(() => chroniquesParType(wikiFiltre), [wikiFiltre]);

    const VUES: { id: Vue; titre: string; icone: typeof Layers; compte?: number }[] = [
        { id: 'seance', titre: 'Séance', icone: FileText },
        { id: 'trame', titre: 'Trame', icone: Layers, compte: actes.length },
        { id: 'wiki', titre: 'Chroniques', icone: BookOpen, compte: wiki.length },
        /*
          **Le coffre Obsidian est à côté du wiki, et pas dedans.** Le wiki
          appartient à la campagne ; le coffre est le carnet Obsidian rattaché à
          cette campagne. *Les mêler ferait chercher dans l'un ce qui est dans
          l'autre.*

          ⛔ **Il s'appelait « Coffre » et David ne le trouvait pas** (2026-09-05).
          Le module s'appelle **« Nexus Wiki »** partout ailleurs — l'écran des
          réglages dit même « Coffre Obsidian (Nexus Wiki) ». Chercher un nom
          qu'on n'a pas écrit, c'est passer devant sans le voir, et il y a un
          onglet « Wiki » juste à côté qui montre autre chose. *Le nom d'un
          bouton se prend dans le vocabulaire de celui qui le cherche.*
        */
        { id: 'obsidian', titre: 'Nexus Wiki', icone: Vault },
        { id: 'indices', titre: 'Indices', icone: Lightbulb, compte: indices.length },
        { id: 'secrets', titre: 'Secrets', icone: EyeOff },
    ];

    const cadre = 'flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-app-text/[0.03] border border-app-text/5 p-3';

    return (
        <div className="flex min-w-0 min-h-0 flex-col gap-3 h-full">
            {/*
              T4/M2 : les six vues restent visibles, trois par rangée en portrait.
            */}
            <nav aria-label="Vues des Notes" className="grid grid-cols-3 min-[1100px]:grid-cols-6 gap-1 bg-app-text/5 p-1 rounded-xl border border-app-text/10 shrink-0">
                {VUES.map(({ id, titre, icone: Icone, compte }) => (
                    <Bouton habillage="libre" cibleTactile
                        key={id}
                        onClick={() => setVue(id)}
                        aria-current={vue === id ? 'page' : undefined}
                        className={`min-w-0 min-h-[48px] px-1 py-2 rounded-lg flex flex-wrap justify-center items-center gap-1 text-[14px] font-bold transition-colors ${vue === id ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'}`}
                    >
                        <Icone size={13} /> {titre}
                        {compte !== undefined && compte > 0 && (
                            <span className={vue === id ? 'opacity-60' : 'text-app-subtle'}>{compte}</span>
                        )}
                    </Bouton>
                ))}
            </nav>

            {/* ── La séance : où en est-on ──────────────────────────────── */}
            {vue === 'seance' && (
                <Panneau as="div" habillage="libre" className={`${cadre} flex flex-col gap-4`}>
                    {([
                        ['Ce qui se joue', scenesDuMoment.enCours],
                        ['En pause', scenesDuMoment.enPause],
                        ['À jouer', scenesDuMoment.aJouer],
                    ] as const).map(([titre, lot]) => (
                        <section key={titre} className="flex flex-col gap-1.5">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-app-muted px-1">
                                {titre} <span className="text-app-subtle">{lot.length}</span>
                            </h3>
                            {lot.length === 0 ? (
                                <p className="text-[14px] italic text-app-subtle px-1">Rien ici.</p>
                            ) : (
                                <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-1.5">
                                    {lot.map(({ scene, acte }) => (
                                        <div key={scene.id} className="flex flex-col gap-0.5">
                                            <span className="text-[14px] uppercase tracking-wider text-app-subtle px-1 [overflow-wrap:anywhere]">{acte.titre}</span>
                                            <LigneDeScene
                                                scene={scene}
                                                ouverte={scenesOuvertes.has(scene.id)}
                                                basculer={() => basculer(scene.id, setScenesOuvertes)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}

                    {notes?.public && (
                        <section className="flex flex-col gap-1.5">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-app-muted px-1">Résumé public</h3>
                            <p className="text-[14px] leading-relaxed text-app-text whitespace-pre-wrap px-1 max-w-[75ch]">{notes.public}</p>
                        </section>
                    )}
                </Panneau>
            )}

            {/* ── La trame entière ──────────────────────────────────────── */}
            {vue === 'trame' && (
                <Panneau as="div" habillage="libre" className={`${cadre} flex flex-col gap-2`}>
                    {actes.length === 0 ? (
                        <p className="text-[16px] italic text-app-muted text-center py-10">Aucune trame sur cette campagne.</p>
                    ) : actes.map((acte: RemoteActe) => (
                        <Panneau key={acte.id} habillage="libre" className={`rounded-xl border p-2 ${acte.acheve ? 'border-app-text/5 bg-app-text/[0.01]' : 'border-app-text/10 bg-app-text/[0.03]'}`}>
                            <Bouton habillage="libre" cibleTactile
                                onClick={() => basculer(acte.id, setActesReplies)}
                                aria-expanded={!actesReplies.has(acte.id)}
                                className="w-full min-h-[48px] flex flex-wrap items-center gap-2 text-left px-1 pb-1.5"
                            >
                                <span className={`text-[16px] font-black ${acte.acheve ? 'text-app-subtle' : 'text-accent'}`}>{acte.titre}</span>
                                {acte.acheve && <span className="text-[14px] uppercase tracking-wider text-app-subtle">achevé</span>}
                                <span className="ml-auto shrink-0 text-[14px] text-app-subtle">{acte.scenes.length} scènes</span>
                            </Bouton>
                            {!actesReplies.has(acte.id) && (
                                <div className="flex flex-col gap-1.5">
                                    {acte.resume && <p className="text-[14px] italic text-app-muted px-1">{acte.resume}</p>}
                                    {acte.notesDuMeneur && (
                                        <p className="text-[14px] text-etat-alerte/80 border-l-2 border-etat-alerte/30 pl-2 mx-1 whitespace-pre-wrap">
                                            {acte.notesDuMeneur}
                                        </p>
                                    )}
                                    {acte.scenes.map((scene) => (
                                        <LigneDeScene
                                            key={scene.id}
                                            scene={scene}
                                            ouverte={scenesOuvertes.has(scene.id)}
                                            basculer={() => basculer(scene.id, setScenesOuvertes)}
                                        />
                                    ))}
                                </div>
                            )}
                        </Panneau>
                    ))}
                </Panneau>
            )}

            {/* ── Le wiki ───────────────────────────────────────────────── */}
            {vue === 'wiki' && (
                <>
                    <div className="relative shrink-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle pointer-events-none" />
                        <input
                            type="search"
                            value={filtreWiki}
                            onChange={(e) => setFiltreWiki(e.target.value)}
                            placeholder="Chercher dans le wiki…"
                            aria-label="Chercher dans le wiki"
                            className="w-full h-[44px] pl-9 pr-16 rounded-xl bg-app-text/5 border border-app-text/10 text-[16px] text-app-text placeholder:text-app-subtle outline-none focus:border-accent/40"
                        />
                        {filtreWiki && (
                            <Bouton habillage="libre" cibleTactile
                                onClick={() => setFiltreWiki('')}
                                aria-label="Effacer la recherche"
                                className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] w-6 h-6 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text"
                            >
                                <X size={14} />
                            </Bouton>
                        )}
                    </div>
                    <Panneau as="div" habillage="libre" className={`${cadre} flex flex-col gap-3`}>
                        {wikiFiltre.length === 0 ? (
                            <p className="text-[16px] italic text-app-muted text-center py-10">
                                {filtreWiki ? `Rien ne correspond à « ${filtreWiki} ».` : 'Le wiki de cette campagne est vide.'}
                            </p>
                        ) : groupesDeChroniques.map(({ cle, titre, fiches }) => (
                        <section key={cle} className="flex flex-col gap-1.5">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-app-muted px-1">
                                {titre} <span className="text-app-subtle tabular-nums">{fiches.length}</span>
                            </h3>
                            {fiches.map((fiche) => (
                            <Panneau key={fiche.id} as="div" habillage="libre" className="rounded-lg border border-app-text/5 bg-app-text/[0.02]">
                                <Bouton habillage="libre" cibleTactile
                                    onClick={() => setFicheOuverte(ficheOuverte === fiche.id ? null : fiche.id)}
                                    aria-expanded={ficheOuverte === fiche.id}
                                    className="w-full min-h-[48px] flex flex-wrap items-center gap-2 px-3 py-3 text-left"
                                >
                                    <Etiquette habillage="libre" ton="neutre" className="shrink-0 text-[14px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-app-text/10 text-app-muted">
                                        {LIBELLE_DE_CATEGORIE[fiche.categorie] ?? fiche.categorie}
                                    </Etiquette>
                                    <span className="flex-1 min-w-[120px] text-[16px] font-bold text-app-text [overflow-wrap:anywhere]">{fiche.titre}</span>
                                </Bouton>
                                {ficheOuverte === fiche.id && (
                                    <div className="px-2.5 pb-2.5 flex flex-col gap-2">
                                        {fiche.contenu ? (
                                            /* Une fiche de wiki est écrite en Markdown comme le
                                               reste : elle mérite d'être lue, pas épelée. */
                                            <div className="prose prose-invert prose-base max-w-[80ch] prose-headings:font-black prose-headings:tracking-tight prose-headings:text-app-text prose-p:text-app-text prose-li:text-app-text prose-strong:text-app-text prose-a:text-accent prose-code:text-accent prose-table:text-[14px] prose-th:text-app-muted prose-td:text-app-text">
                                                <TexteMarkdown>{fiche.contenu}</TexteMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-[14px] italic text-app-muted">Cette fiche n'a pas de contenu.</p>
                                        )}
                                        {fiche.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {fiche.tags.map((tag) => (
                                                    <Etiquette key={tag} habillage="libre" ton="neutre" className="text-[14px] px-1.5 py-0.5 rounded bg-app-text/5 text-app-muted">{tag}</Etiquette>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Panneau>
                            ))}
                        </section>
                        ))}
                    </Panneau>
                </>
            )}

            {vue === 'obsidian' && (
                <RemoteObsidian
                    coffre={coffre}
                    onCharger={onChargerLeCoffre}
                    onOuvrir={onOuvrirUneNote}
                    onFermer={onFermerLaNote}
                />
            )}

            {/* ── Les indices ───────────────────────────────────────────── */}
            {vue === 'indices' && (
                <Panneau as="div" habillage="libre" className={`${cadre} grid grid-cols-1 min-[900px]:grid-cols-2 gap-1.5 content-start`}>
                    {indices.length === 0 ? (
                        <p className="text-[16px] italic text-app-muted text-center py-10 col-span-full">Aucun indice sur cette campagne.</p>
                    ) : indices.map((indice) => (
                        <Panneau key={indice.id} as="div" habillage="libre" className={`rounded-lg border p-2.5 flex flex-col gap-1 ${indice.revele ? 'border-etat-succes/30 bg-etat-succes/5' : 'border-app-text/5 bg-app-text/[0.02]'}`}>
                            <div className="flex items-center gap-2">
                                <Etiquette habillage="libre" ton={indice.revele ? 'succes' : 'neutre'} className={`shrink-0 text-[14px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${indice.revele ? 'border-etat-succes/40 text-etat-succes' : 'border-app-text/10 text-app-muted'}`}>
                                    {indice.revele ? 'Donné' : 'En main'}
                                </Etiquette>
                                <span className="text-[16px] font-bold text-app-text [overflow-wrap:anywhere]">{indice.titre}</span>
                            </div>
                            {indice.contenu && (
                                <p className="text-[14px] leading-relaxed text-app-muted whitespace-pre-wrap">{indice.contenu}</p>
                            )}
                        </Panneau>
                    ))}
                </Panneau>
            )}

            {/* ── Les secrets du meneur ─────────────────────────────────── */}
            {vue === 'secrets' && (
                <Panneau as="div" habillage="libre" className={`${cadre} ${isAventureMode ? 'blur-md grayscale pointer-events-none' : ''}`}>
                    <div className="whitespace-pre-wrap font-sans text-[16px] leading-relaxed text-app-text max-w-[75ch]">
                        {isAventureMode
                            ? "Contenu protégé par le Mode Aventure."
                            : (notes?.private || "Aucun secret enregistré pour cette séance.")}
                    </div>
                </Panneau>
            )}
        </div>
    );
};

export default RemoteNotes;
