import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { MessageSquare, Star, Smile, BookOpen, Swords, Calendar } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';

const SessionFeedbackModal: React.FC = () => {
    const { t } = useTranslation();
    const { sessions, activeCampaignId, campaigns, players } = useSessionOSStore();
    const { defaultValue } = useModalStore();

    const sessionId = (defaultValue as { sessionId?: string })?.sessionId;
    
    // Find campaign and session
    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const session = sessions.find(s => 
        sessionId ? s.id === sessionId : (s.campaignId === activeCampaignId && s.status === 'active')
    );

    if (!session) return null;

    const feedbacks = session.feedbacks || [];
    const feedbackCount = feedbacks.length;

    // Calculate averages
    const averages = feedbacks.reduce(
        (acc, curr) => {
            acc.fun += curr.funRating;
            acc.story += curr.storyRating;
            acc.combat += curr.combatRating;
            return acc;
        },
        { fun: 0, story: 0, combat: 0 }
    );

    const averageFun = feedbackCount > 0 ? Number((averages.fun / feedbackCount).toFixed(1)) : 0;
    const averageStory = feedbackCount > 0 ? Number((averages.story / feedbackCount).toFixed(1)) : 0;
    const averageCombat = feedbackCount > 0 ? Number((averages.combat / feedbackCount).toFixed(1)) : 0;

    // Helper to render stars
    const renderStars = (rating: number, size = 16) => {
        return (
            <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        size={size}
                        className={`${
                            i < Math.round(rating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-app-bg p-8 text-app-text select-text">
            {/* Header context info */}
            <div className="mb-6 flex items-center justify-between border-b border-app-border/10 pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <div className="text-ui-10 font-black uppercase tracking-widest text-accent mb-1">
                            {t('modules:session.feedback.title')}
                        </div>
                        <div className="text-sm font-mono text-app-text/60">
                            {t('common:labels.session_number', { number: session.number })} • {campaign?.name}
                        </div>
                    </div>
                </div>
                
                <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-ui-10 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} />
                    {new Date(session.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </div>
            </div>

            {feedbacks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-20">
                    <MessageSquare size={64} className="mb-6 text-slate-600 animate-pulse" />
                    <p className="text-lg font-black uppercase tracking-widest text-center">
                        {t('modules:session.feedback.no_feedback')}
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-8">
                    {/* Left side: Aggregate metrics */}
                    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
                        <h4 className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40">
                            {t('modules:session.feedback.aggregate')}
                        </h4>
                        
                        <div className="glass-bento rounded-[2rem] border border-app-border/40 p-6 flex flex-col gap-6 shadow-xl">
                            {/* Fun Rating average */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Smile size={16} className="text-emerald-400" />
                                        <span>{t('modules:session.feedback.fun')}</span>
                                    </div>
                                    <span className="font-mono text-accent text-sm">{averageFun} / 5</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    {renderStars(averageFun, 18)}
                                    <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full shadow-glow-accent" 
                                            style={{ width: `${(averageFun / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Story Rating average */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={16} className="text-indigo-400" />
                                        <span>{t('modules:session.feedback.story')}</span>
                                    </div>
                                    <span className="font-mono text-accent text-sm">{averageStory} / 5</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    {renderStars(averageStory, 18)}
                                    <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full shadow-glow-accent" 
                                            style={{ width: `${(averageStory / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Combat Rating average */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Swords size={16} className="text-rose-400" />
                                        <span>{t('modules:session.feedback.combat')}</span>
                                    </div>
                                    <span className="font-mono text-accent text-sm">{averageCombat} / 5</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    {renderStars(averageCombat, 18)}
                                    <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full shadow-glow-accent" 
                                            style={{ width: `${(averageCombat / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/30 border border-app-border/20 rounded-[1.5rem] p-4 text-ui-10 text-app-text/40 leading-relaxed uppercase tracking-wider font-semibold">
                            💡 {t('modules:session.feedback.average')} ({feedbackCount} {feedbackCount > 1 ? 'contributeurs' : 'contributeur'})
                        </div>
                    </div>

                    {/* Right side: Detailed feedbacks list */}
                    <div className="flex-1 min-h-0 flex flex-col gap-6">
                        <h4 className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40 shrink-0">
                            {t('modules:session.feedback.details')}
                        </h4>
                        
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2">
                            {feedbacks.map((f) => {
                                // Find character portrait from players list
                                const char = players
                                    .flatMap(p => p.characters)
                                    .find(c => c.id === f.characterId);
                                    
                                return (
                                    <div 
                                        key={f.characterId}
                                        className="glass-bento rounded-2xl border border-app-border/40 p-5 flex flex-col gap-4 hover:border-accent/20 transition-all shadow-md shrink-0"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-slate-950/40">
                                                    {char?.portraitUrl ? (
                                                        <ResolvedImage 
                                                            src={char.portraitUrl} 
                                                            alt={f.characterName} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                            {f.characterName.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-sm text-slate-200">{f.characterName}</h5>
                                                    <span className="text-ui-9 text-slate-500 font-mono">
                                                        {new Date(f.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ratings grid for this player */}
                                            <div className="flex flex-col gap-1 text-ui-10 uppercase font-bold text-slate-400 items-end bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span>{t('modules:session.feedback.fun')}</span>
                                                    {renderStars(f.funRating, 12)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>{t('modules:session.feedback.story')}</span>
                                                    {renderStars(f.storyRating, 12)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>{t('modules:session.feedback.combat')}</span>
                                                    {renderStars(f.combatRating, 12)}
                                                </div>
                                            </div>
                                        </div>

                                        {f.notes && (
                                            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 text-sm leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">
                                                {f.notes}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionFeedbackModal;
