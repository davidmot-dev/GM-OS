import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Settings } from 'lucide-react';
import { gmAlert } from '../../../stores/useModalStore';

const CampaignWidget: React.FC = () => {
    const { campaigns, activeCampaignId, sessions } = useSessionOSStore();
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const activeSession = activeCampaign ? sessions.find(s => s.id === activeCampaign.activeSessionId && s.status === 'active') : null;
    const sessionCount = sessions.filter(s => s.campaignId === activeCampaignId).length;

    const campaignName = activeCampaign?.name || 'Aucune campagne';
    const sessionNumber = activeSession?.number || 0;
    const sessionMax = sessionCount || 1;

    const progress = (sessionNumber / sessionMax) * 100;

    return (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 transition-all hover:border-gm-gold/30">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-ui-10 uppercase font-bold text-slate-500 tracking-widest mb-1">Active Campaign</p>
                    <h3 className="text-slate-100 font-bold tracking-tight text-lg line-clamp-1">{campaignName}</h3>
                </div>
                <button
                    onClick={() => gmAlert('Campaign configurations like export/import will be available in the next update.')}
                    className="p-1.5 text-slate-500 hover:text-gm-gold hover:bg-gm-gold/10 rounded-lg transition-all"
                >
                    <Settings size={16} />
                </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>Session Progress</span>
                    <span>Stage {sessionNumber}/{sessionMax}</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-gm-gold h-full shadow-glow-gold transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CampaignWidget;
