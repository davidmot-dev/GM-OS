import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    ChevronLeft, 
    Plus, 
    BookOpen,
    AlertCircle,
    Trash2,
    ListChecks,
    Skull,
    Users,
    Play,
    Eye,
} from 'lucide-react';
import { gmConfirm } from '../../../stores/useModalStore';
import { Panneau, Etiquette } from '../../../components/socle';

/** Une date `AAAA-MM-JJ`, lue à midi : à minuit UTC, un fuseau négatif la ferait reculer d'un jour. */
const dateLisible = (date: string, langue: string) => {
    const jour = new Date(`${date}T12:00:00`);
    if (Number.isNaN(jour.getTime())) return date;
    const texte = jour.toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return texte.charAt(0).toUpperCase() + texte.slice(1);
};

const SessionPrep: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { 
        sessions, 
        activeCampaignId, 
        setSelectedSession, 
        addSession, 
        deleteSession,
        setCurrentView,
        campaigns,
        entities,
        players,
    } = useSessionOSStore();

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const campaignSessions = sessions.filter(s => s.campaignId === activeCampaignId);

    const handleCreateSession = () => {
        const nextNum = campaignSessions.length > 0 
            ? Math.max(...campaignSessions.map(s => s.number)) + 1 
            : 1;
        
        const newId = addSession({
            campaignId: activeCampaignId!,
            number: nextNum,
            date: new Date().toISOString().split('T')[0],
            status: 'planned',
            publicSummary: '',
            gmSecrets: '',
            checklist: [],
            sessionEntityIds: []
        });
        setSelectedSession(newId);
        setCurrentView('session-focus');
    };

    if (!activeCampaignId) return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-app-bg">
            <AlertCircle size={48} className="text-app-subtle mb-4" />
            <p className="text-app-muted font-bold uppercase tracking-widest">{t('modules:session.prep.no_active_campaign')}</p>
            <button 
                onClick={() => setCurrentView('library')}
                className="mt-6 px-6 py-2 bg-accent text-app-on-accent rounded-lg font-bold"
            >
                {t('modules:session.prep.select_campaign')}
            </button>
        </div>
    );

    /*
      **Le ruban, de la plus récente à la plus ancienne** — refonte, L5,
      étape 2. La prochaine séance en haut, la séance en cours détachée, les
      terminées en bas, resserrées : on ne les rouvre que pour consulter.
    */
    const ruban = [...campaignSessions].sort((a, b) => b.number - a.number);
    const comptes = {
        planned: campaignSessions.filter(s => s.status === 'planned').length,
        active: campaignSessions.filter(s => s.status === 'active').length,
        done: campaignSessions.filter(s => s.status === 'done').length,
    };
    const personnages = players.flatMap(p => p.characters.filter(c => c.campaignId === activeCampaignId));
    const TON = { planned: 'alerte', active: 'accent', done: 'succes' } as const;

    const ouvrir = (id: string) => {
        setSelectedSession(id);
        setCurrentView('session-focus');
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border bg-app-surface/40 px-6 py-5 shrink-0">
                <div className="min-w-0">
                    <button
                        onClick={() => setCurrentView('cockpit')}
                        className="flex items-center gap-1 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-accent"
                        title={t('modules:session.prep.back_to_cockpit')}
                    >
                        <ChevronLeft size={14} />{t('modules:session.prep.back_to_cockpit')}
                    </button>
                    <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-app-text">
                        {t('modules:session.prep.agencement.titre', { name: activeCampaign?.name ?? '' })}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {(['planned', 'active', 'done'] as const).map(statut => (
                            <Etiquette key={statut} ton={comptes[statut] ? TON[statut] : 'neutre'}>
                                {t(`modules:session.prep.agencement.compte_${statut}`, { count: comptes[statut] })}
                            </Etiquette>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleCreateSession}
                    className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-app-on-accent shadow-glow-accent transition-all hover:brightness-110 active:scale-95"
                >
                    <Plus size={18} />
                    {t('modules:session.prep.create_session')}
                </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="mx-auto flex max-w-4xl flex-col">
                    {ruban.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-app-subtle">
                            <BookOpen size={64} className="mb-6" />
                            <p className="whitespace-pre-line text-center text-lg font-bold uppercase tracking-widest">{t('modules:session.prep.no_sessions')}</p>
                        </div>
                    ) : ruban.map((s, rang) => {
                        const enCours = s.status === 'active';
                        const terminee = s.status === 'done';
                        const faites = s.checklist.filter(c => c.isCompleted).length;
                        const ids = new Set(s.sessionEntityIds || []);
                        const pnj = entities.filter(e => e.campaignId === activeCampaignId && ids.has(e.id));
                        const presents = personnages.filter(c => ids.has(c.id));
                        const absents = s.status === 'planned' ? 0 : personnages.length - presents.length;
                        const synopsis = s.publicSummary.split('\n').map(l => l.trim()).find(Boolean);
                        /* Le libellé suit le statut — décidé par David le 2026-09-29.
                           Un seul geste existe : ouvrir la préparation. */
                        const geste = enCours ? 'reprendre' : terminee ? 'consulter' : 'preparer';
                        const nom = (liste: { name: string }[]) => liste.slice(0, 2).map(x => x.name).join(', ') + (liste.length > 2 ? '…' : '');

                        return (
                            <div key={s.id} className="relative flex gap-4">
                                {/* Le ruban : un trait, et le numéro de chaque séance dessus */}
                                <div className="relative flex w-12 shrink-0 justify-center">
                                    <span className={`absolute inset-y-0 w-px ${rang === 0 ? 'top-6' : ''} ${rang === ruban.length - 1 ? 'bottom-auto h-6' : ''} bg-app-border`} />
                                    <span className={`relative z-10 mt-4 flex h-9 w-9 items-center justify-center rounded-md border font-mono text-xs font-black ${
                                        enCours ? 'border-accent bg-accent text-app-on-accent' : terminee ? 'border-app-border bg-app-surface text-app-muted' : 'border-etat-alerte/60 bg-app-surface text-etat-alerte'
                                    }`}>#{s.number}</span>
                                </div>

                                {/*
                                  **La carte n'est pas un `<button>`, et ne peut pas l'être :**
                                  elle en contient — la corbeille, le geste. Un bouton dans un
                                  bouton est interdit par le HTML, et le navigateur défait
                                  l'imbrication à sa façon.
                                */}
                                <Panneau className={`mb-4 min-w-0 flex-1 ${enCours ? 'border-accent shadow-glow-accent/20' : ''}`}>
                                    <div className={`flex flex-col gap-3 ${terminee ? 'p-4' : 'p-5'}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="min-w-0 font-display text-base font-bold text-app-text">
                                                <span className="mr-2 text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('modules:session.prep.agencement.seance', { number: s.number })}</span>
                                                {dateLisible(s.date, i18n.language)}
                                            </h3>
                                            <Etiquette ton={TON[s.status]}>{t(`modules:session.prep.status.${s.status}`)}</Etiquette>
                                        </div>

                                        <p className={`text-sm leading-relaxed ${synopsis ? 'text-app-text' : 'italic text-app-subtle'} ${enCours ? 'font-bold' : ''} line-clamp-2`}>
                                            {synopsis ? `« ${synopsis} »` : t('modules:session.prep.agencement.sans_synopsis')}
                                        </p>

                                        {/* Ce que la préparation contient déjà */}
                                        <div className={`grid gap-2 ${terminee ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
                                            <div className="rounded-lg border border-app-border bg-app-bg/40 px-3 py-2">
                                                <div className="flex items-center justify-between gap-2 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                                                    <span className="flex items-center gap-1.5"><ListChecks size={12} />{t('modules:session.prep.agencement.checklist')}</span>
                                                    <span className={s.checklist.length && faites === s.checklist.length ? 'text-etat-succes' : 'text-app-text'}>{faites} / {s.checklist.length}</span>
                                                </div>
                                                {s.checklist.length > 0 && (
                                                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-app-bg">
                                                        <div className="h-full bg-accent" style={{ width: `${(faites / s.checklist.length) * 100}%` }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rounded-lg border border-app-border bg-app-bg/40 px-3 py-2 text-xs text-app-text">
                                                <span className="flex items-center gap-1.5 font-bold"><Skull size={12} className="text-app-muted" />{t('modules:session.prep.agencement.pnj', { count: pnj.length })}</span>
                                                {pnj.length > 0 && !terminee && <span className="mt-0.5 block truncate text-ui-10 text-app-muted">{nom(pnj)}</span>}
                                            </div>
                                            <div className="rounded-lg border border-app-border bg-app-bg/40 px-3 py-2 text-xs text-app-text">
                                                <span className="flex items-center gap-1.5 font-bold">
                                                    <Users size={12} className="text-app-muted" />
                                                    {t(s.status === 'planned' ? 'modules:session.prep.agencement.pj_prevus' : 'modules:session.prep.agencement.pj_presents', { count: presents.length })}
                                                    {absents > 0 && <span className="text-etat-danger">· {t('modules:session.prep.agencement.absents', { count: absents })}</span>}
                                                </span>
                                                {presents.length > 0 && !terminee && <span className="mt-0.5 block truncate text-ui-10 text-app-muted">{nom(presents)}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    gmConfirm(
                                                        t('modules:session.prep.delete_confirm', { number: s.number }),
                                                        () => deleteSession(s.id),
                                                        () => {},
                                                        t('modules:session.prep.delete_btn'),
                                                        t('modules:session.prep.cancel_btn')
                                                    );
                                                }}
                                                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-app-subtle transition-all hover:bg-etat-danger/10 hover:text-etat-danger"
                                                title={t('modules:session.prep.delete_tooltip')}
                                            >
                                                <Trash2 size={13} />{t('modules:session.prep.delete_btn')}
                                            </button>
                                            <button
                                                onClick={() => ouvrir(s.id)}
                                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                                    enCours ? 'bg-accent text-app-on-accent hover:brightness-110' : 'border border-app-border text-accent hover:border-accent/50 hover:bg-accent/10'
                                                }`}
                                            >
                                                {enCours ? <Play size={12} fill="currentColor" /> : terminee ? <Eye size={12} /> : <BookOpen size={12} />}
                                                {t(`modules:session.prep.agencement.${geste}`)}
                                            </button>
                                        </div>
                                    </div>
                                </Panneau>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SessionPrep;
