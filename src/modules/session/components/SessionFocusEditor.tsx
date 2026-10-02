import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import {
    Calendar,
    ChevronLeft,
    Eye,
    EyeOff,
    Lock,
    CheckSquare,
    BookOpen,
    Skull,
    Users,
    MessageSquare,
    Save,
    Link,
    File,
    StickyNote,
    Star,
    Layers,
    ExternalLink,
    Pencil,
    Check,
} from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { Panneau, Etiquette } from '../../../components/socle';
import SessionChecklist from './SessionChecklist';
import SessionPrepEntityManager from './SessionPrepEntityManager';
import PanneauDeTrameDeSeance from './PanneauDeTrameDeSeance';
import { ouvrirLeFichierDeLaSeance } from '../logic/ouvrirLeFichierDeLaSeance';

/** Une date `AAAA-MM-JJ`, lue à midi : à minuit UTC, un fuseau négatif la ferait reculer d'un jour. */
const dateLisible = (date: string, langue: string) => {
    const jour = new Date(`${date}T12:00:00`);
    if (Number.isNaN(jour.getTime())) return date;
    const texte = jour.toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return texte.charAt(0).toUpperCase() + texte.slice(1);
};

/** Le titre d'un des trois temps de la page. */
const TempsDeLaPartie: React.FC<{ numero: number; titre: string; children?: React.ReactNode }> = ({ numero, titre, children }) => (
    <div className="flex items-center gap-3 border-b border-app-border pb-2">
        <span className="font-display text-lg font-bold text-accent">{numero}.</span>
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-app-text">{titre}</h2>
        {children}
    </div>
);

/** Le titre d'un bloc, son icône, et ce qu'on pose à sa droite. */
const titreDeBloc = (icone: React.ReactNode, titre: React.ReactNode, aside?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
            <span className="shrink-0 text-accent">{icone}</span>
            <span className="truncate">{titre}</span>
        </h3>
        {aside}
    </div>
);

/**
 * **Préparer la séance** — l'ancien « MJ Focus », refonte L5, étape 2.
 *
 * David, devant l'ancien écran : « je ne vois pas ce que c'est ». L'écran le
 * dit désormais dans son titre — « Préparer la séance n°1 — samedi 28 août
 * 2026 » — et se range **par moment d'usage** : ce qu'on prépare avant la
 * partie, ce qu'on a noté pendant, ce que les joueurs en ont dit après.
 */
const SessionFocusEditor: React.FC = () => {
    const { t, i18n } = useTranslation();
    const {
        sessions,
        selectedSessionId,
        updateSession,
        setCurrentView,
        players: storePlayers,
        activeCampaignId,
        addEntityToSession,
        removeEntityFromSession,
        campaigns
    } = useSessionOSStore();
    const [corrigerLesNotes, setCorrigerLesNotes] = useState(false);

    const session = sessions.find(s => s.id === selectedSessionId && s.campaignId === activeCampaignId);
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    if (!session) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-app-bg p-10">
                <BookOpen size={64} className="text-app-subtle mb-6" />
                <p className="text-app-subtle font-bold uppercase tracking-widest">{t('modules:session.focus.not_found')}</p>
                <button
                    onClick={() => setCurrentView('session-prep')}
                    className="mt-6 px-6 py-2 bg-app-surface text-app-muted rounded-lg font-bold"
                    title={t('modules:session.focus.back_to_list_tooltip')}
                    aria-label={t('modules:session.focus.back_to_list_tooltip')}
                >
                    {t('modules:session.focus.back_to_list')}
                </button>
            </div>
        );
    }

    // Get all characters linked to the active campaign
    const campaignCharacters = storePlayers.flatMap(p =>
        p.characters.filter(c => c.campaignId === activeCampaignId)
    );

    const linkedEntityIds = session.sessionEntityIds || [];
    const presents = campaignCharacters.filter(c => linkedEntityIds.includes(c.id));

    const fbs = session.feedbacks || [];
    const moyenne = (cle: 'funRating' | 'storyRating' | 'combatRating') =>
        fbs.length ? Number((fbs.reduce((somme, f) => somme + f[cle], 0) / fbs.length).toFixed(1)) : 0;
    const etoiles = (note: number, taille = 12) => (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} size={taille} className={idx < Math.round(note) ? 'text-etat-alerte fill-etat-alerte' : 'text-app-subtle'} />
            ))}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg text-app-text">
            {/* L'en-tête dit ce qu'est l'écran : la séance, sa date, son statut */}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border bg-app-surface/40 px-6 py-5 shrink-0">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest">
                        <button
                            onClick={() => setCurrentView('session-prep')}
                            className="flex items-center gap-1 text-app-muted transition-colors hover:text-accent"
                            title={t('modules:session.focus.back_to_list_tooltip')}
                        >
                            <ChevronLeft size={14} />{t('modules:session.focus.back_to_list')}
                        </button>
                        <span className="text-app-subtle">/</span>
                        <span className="truncate text-accent">{activeCampaign?.name || t('modules:session.prep.no_active_campaign')}</span>
                    </div>
                    <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-app-text">
                        {t('modules:session.focus.agencement.titre', { number: session.number, date: dateLisible(session.date, i18n.language).toLocaleLowerCase(i18n.language) })}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex rounded-xl border border-app-border bg-app-bg/40 p-1">
                        {(['planned', 'active', 'done'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => updateSession(session.id, { status })}
                                className={`rounded-lg px-4 py-2 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                    session.status === status
                                    ? 'bg-accent text-app-on-accent'
                                    : 'text-app-muted hover:bg-app-text/5 hover:text-app-text'
                                }`}
                            >
                                {t(`modules:session.prep.status.${status}`)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentView('cockpit')}
                        className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-app-on-accent shadow-glow-accent transition-all hover:brightness-110 active:scale-95"
                    >
                        <Save size={16} />
                        {t('modules:session.focus.save_close')}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 p-6">

                    {/* ─── 1. Avant la partie ─── */}
                    <TempsDeLaPartie numero={1} titre={t('modules:session.focus.agencement.avant')} />
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <div className="flex flex-col gap-4 xl:col-span-8">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <Panneau className="flex min-h-[20rem] flex-col focus-within:border-accent/50">
                                    {titreDeBloc(<Eye size={16} />, t('modules:session.focus.synopsis_players'),
                                        <Etiquette ton="info">{t('modules:session.focus.agencement.public')}</Etiquette>)}
                                    <p className="px-5 text-ui-10 text-app-muted">{t('modules:session.focus.agencement.public_aide')}</p>
                                    <textarea
                                        value={session.publicSummary}
                                        onChange={(e) => updateSession(session.id, { publicSummary: e.target.value })}
                                        placeholder={t('modules:session.focus.synopsis_placeholder')}
                                        title={t('modules:session.focus.synopsis_players')}
                                        className="flex-1 resize-none border-none bg-transparent px-5 py-3 text-base leading-relaxed text-app-text outline-none placeholder:text-app-subtle focus:ring-0 custom-scrollbar"
                                    />
                                </Panneau>
                                <Panneau className="flex min-h-[20rem] flex-col border-accent/30 focus-within:border-accent/60">
                                    {titreDeBloc(<Lock size={16} />, t('modules:session.focus.secrets_title'),
                                        <Etiquette ton="accent"><EyeOff size={10} className="mr-1 inline -mt-0.5" />{t('modules:session.focus.agencement.jamais_partage')}</Etiquette>)}
                                    <p className="px-5 text-ui-10 text-app-muted">{t('modules:session.focus.secrets_tooltip')}</p>
                                    <textarea
                                        value={session.gmSecrets}
                                        onChange={(e) => updateSession(session.id, { gmSecrets: e.target.value })}
                                        placeholder={t('modules:session.focus.secrets_placeholder')}
                                        title={t('modules:session.focus.secrets_title')}
                                        className="flex-1 resize-none border-none bg-transparent px-5 py-3 text-base leading-relaxed text-app-text outline-none placeholder:text-app-subtle focus:ring-0 custom-scrollbar"
                                    />
                                </Panneau>
                            </div>

                            <Panneau>
                                {titreDeBloc(<CheckSquare size={16} />, t('modules:session.focus.checklist_title'))}
                                <div className="px-5 pb-5"><SessionChecklist sessionId={session.id} /></div>
                            </Panneau>

                            {/* La trame prévue : ce que la séance va traverser, et le
                                reste s'y accroche. */}
                            <Panneau>
                                {titreDeBloc(<Layers size={16} />, t('modules:session.focus.agencement.trame_prevue'))}
                                <div className="px-5 pb-5"><PanneauDeTrameDeSeance session={session} /></div>
                            </Panneau>
                        </div>

                        <div className="flex flex-col gap-4 xl:col-span-4">
                            <Panneau>
                                {titreDeBloc(<Calendar size={16} />, t('modules:session.focus.date_title'))}
                                <div className="px-5 pb-5">
                                    <p className="mb-2 font-display text-lg font-bold text-app-text">{dateLisible(session.date, i18n.language)}</p>
                                    <input
                                        type="date"
                                        value={session.date}
                                        onChange={(e) => updateSession(session.id, { date: e.target.value })}
                                        title={t('modules:session.focus.date_tooltip')}
                                        aria-label={t('modules:session.focus.date_tooltip')}
                                        className="w-full rounded-lg border border-app-border bg-app-bg/40 px-3 py-2 text-sm font-bold text-app-text focus:border-accent/50"
                                    />
                                </div>
                            </Panneau>

                            {/* Les ressources s'ouvrent d'ici : le lien dans le
                                navigateur, le fichier par le système — la même porte
                                que le cockpit de campagne. */}
                            <Panneau>
                                {titreDeBloc(<Link size={16} />, t('modules:session.focus.resources_title'))}
                                <div className="flex flex-col gap-3 px-5 pb-5">
                                    {([
                                        ['lien', Link, session.externalLink, 'https://…', t('modules:session.focus.resource_link_label'), (v: string) => updateSession(session.id, { externalLink: v })],
                                        ['fichier', File, session.filePath, 'C:/MonDossier/mon_scénario.pdf', t('modules:session.focus.resource_file_label'), (v: string) => updateSession(session.id, { filePath: v })],
                                    ] as const).map(([cle, Icone, valeur, exemple, libelle, ecrire]) => (
                                        <label key={cle} className="flex flex-col gap-1.5">
                                            <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">{libelle}</span>
                                            <div className="flex gap-2">
                                                <div className="relative min-w-0 flex-1">
                                                    <Icone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle" />
                                                    <input
                                                        type="text"
                                                        value={valeur || ''}
                                                        onChange={(e) => ecrire(e.target.value)}
                                                        placeholder={exemple}
                                                        className="w-full rounded-lg border border-app-border bg-app-bg/40 py-2 pl-9 pr-3 text-xs text-app-text placeholder:text-app-subtle focus:border-accent/50"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={!valeur}
                                                    onClick={() => {
                                                        if (!valeur) return;
                                                        if (cle === 'lien') {
                                                            const ouvrir = window.appBridge?.web?.openExternal;
                                                            if (ouvrir) ouvrir(valeur); else window.open(valeur, '_blank', 'noopener');
                                                        } else {
                                                            void ouvrirLeFichierDeLaSeance(valeur, {
                                                                refuse: t('modules:session.cockpit.open_file_refused'),
                                                                echec: t('modules:session.cockpit.open_file_failed', { chemin: valeur }),
                                                            });
                                                        }
                                                    }}
                                                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-app-border px-3 text-ui-10 font-black uppercase tracking-widest text-accent transition-all hover:border-accent/50 disabled:opacity-30"
                                                >
                                                    <ExternalLink size={12} />{t('modules:session.focus.agencement.ouvrir')}
                                                </button>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </Panneau>

                            <Panneau>
                                {titreDeBloc(<Skull size={16} />, t('modules:session.focus.npcs_title'))}
                                <div className="px-5 pb-5"><SessionPrepEntityManager sessionId={session.id} /></div>
                            </Panneau>

                            {/* Les PJ présents d'un clic : la ligne bascule entre
                                « Présent » et « Absent ». */}
                            <Panneau>
                                {titreDeBloc(<Users size={16} />, t('modules:session.focus.players_title'),
                                    <Etiquette>{presents.length} / {campaignCharacters.length}</Etiquette>)}
                                <div className="flex flex-col gap-1.5 px-5 pb-5">
                                    {campaignCharacters.map(char => {
                                        const present = linkedEntityIds.includes(char.id);
                                        return (
                                            <button
                                                key={char.id}
                                                onClick={() => present ? removeEntityFromSession(session.id, char.id) : addEntityToSession(session.id, char.id)}
                                                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
                                                    present ? 'border-accent/40 bg-accent/10' : 'border-app-border bg-app-bg/40 hover:border-accent/30'
                                                }`}
                                            >
                                                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-app-surface-2">
                                                    {char.portraitUrl
                                                        ? <ResolvedImage src={char.portraitUrl} alt={char.name} className={`h-full w-full object-cover ${present ? '' : 'grayscale opacity-60'}`} />
                                                        : <span className="flex h-full w-full items-center justify-center text-app-subtle"><Users size={14} /></span>}
                                                </span>
                                                <span className={`min-w-0 flex-1 truncate text-sm font-bold ${present ? 'text-app-text' : 'text-app-muted'}`}>{char.name}</span>
                                                <Etiquette ton={present ? 'succes' : 'neutre'} className="shrink-0">
                                                    {present ? t('modules:session.focus.agencement.present') : t('modules:session.focus.agencement.absent')}
                                                </Etiquette>
                                            </button>
                                        );
                                    })}
                                    {campaignCharacters.length === 0 && <p className="text-xs italic text-app-subtle">{t('modules:session.focus.no_players')}</p>}
                                </div>
                            </Panneau>
                        </div>
                    </div>

                    {/* ─── 2. Pendant la partie ─── */}
                    <TempsDeLaPartie numero={2} titre={t('modules:session.focus.agencement.pendant')} />
                    {/*
                      **Les notes s'écrivent au cockpit, et se lisent ici.** Une
                      séance terminée n'a plus de cockpit : « Corriger » rouvre la
                      saisie, pour qu'une faute ne reste pas gravée.
                    */}
                    <Panneau>
                        {titreDeBloc(<StickyNote size={16} />, t('modules:session.focus.notes_title'),
                            <button
                                onClick={() => setCorrigerLesNotes(!corrigerLesNotes)}
                                className="flex items-center gap-1.5 rounded-lg border border-app-border px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest text-accent transition-all hover:border-accent/50"
                            >
                                {corrigerLesNotes ? <Check size={12} /> : <Pencil size={12} />}
                                {corrigerLesNotes ? t('modules:session.focus.agencement.terminer') : t('modules:session.focus.agencement.corriger')}
                            </button>)}
                        <div className="px-5 pb-5">
                            {corrigerLesNotes ? (
                                <textarea
                                    value={session.sessionNotes || ''}
                                    onChange={(e) => updateSession(session.id, { sessionNotes: e.target.value })}
                                    placeholder={t('modules:session.focus.notes_placeholder')}
                                    title={t('modules:session.focus.notes_title')}
                                    className="min-h-[10rem] w-full resize-none rounded-lg border border-accent/30 bg-app-bg/40 p-3 text-sm leading-relaxed text-app-text outline-none focus:border-accent custom-scrollbar"
                                />
                            ) : (
                                <p className={`whitespace-pre-wrap text-sm leading-relaxed ${session.sessionNotes ? 'text-app-text' : 'italic text-app-subtle'}`}>
                                    {session.sessionNotes || t('modules:session.focus.notes_placeholder')}
                                </p>
                            )}
                        </div>
                    </Panneau>

                    {/* ─── 3. Après la partie ─── */}
                    <TempsDeLaPartie numero={3} titre={t('modules:session.focus.agencement.apres')} />
                    <Panneau>
                        {titreDeBloc(<MessageSquare size={16} />, t('modules:session.feedback.title'),
                            fbs.length > 0 && <Etiquette>{fbs.length}</Etiquette>)}
                        <div className="px-5 pb-5">
                            {fbs.length === 0 ? (
                                <p className="py-4 text-center text-xs italic text-app-subtle">{t('modules:session.feedback.no_feedback')}</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-3 gap-3 rounded-lg border border-app-border bg-app-bg/40 p-4">
                                        {([['fun', 'funRating'], ['story', 'storyRating'], ['combat', 'combatRating']] as const).map(([cle, champ]) => (
                                            <div key={cle} className="flex flex-col items-center gap-1 text-center">
                                                <span className="text-ui-10 font-bold uppercase tracking-wider text-app-muted">{t(`modules:session.feedback.${cle}`)}</span>
                                                <span className="font-mono text-sm font-black text-accent">{moyenne(champ)} / 5</span>
                                                {etoiles(moyenne(champ))}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Chaque retour est celui d'un personnage : ses trois
                                        notes, puis son commentaire. */}
                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                        {fbs.map((f) => {
                                            const char = storePlayers.flatMap(p => p.characters).find(c => c.id === f.characterId);
                                            return (
                                                <div key={f.characterId} className="flex flex-col gap-3 rounded-lg border border-app-border bg-app-bg/40 p-4">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-app-border bg-app-surface-2">
                                                                {char?.portraitUrl ? (
                                                                    <ResolvedImage src={char.portraitUrl} alt={f.characterName} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-ui-10 font-bold text-app-muted">
                                                                        {f.characterName.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="truncate text-sm font-bold text-app-text">{f.characterName}</span>
                                                        </div>
                                                        <span className="font-mono text-ui-9 text-app-subtle">{new Date(f.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {([['fun', f.funRating], ['story', f.storyRating], ['combat', f.combatRating]] as const).map(([cle, note]) => (
                                                            <div key={cle} className="flex flex-col items-center gap-0.5">
                                                                <span className="text-ui-9 font-bold uppercase tracking-wider text-app-muted">{t(`modules:session.feedback.${cle}`)}</span>
                                                                {etoiles(note, 11)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {f.notes && (
                                                        <p className="whitespace-pre-wrap rounded-md border border-app-border bg-app-surface p-3 text-xs leading-relaxed text-app-text">{f.notes}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Panneau>
                </div>
            </div>
        </div>
    );
};

export default SessionFocusEditor;
