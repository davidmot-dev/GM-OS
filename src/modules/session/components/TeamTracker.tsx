import { useSessionOSStore } from '../useSessionOSStore';
import type { PlayerCharacter } from '../useSessionOSStore';
import { gmAlert, gmConfirm } from '../../../stores/useModalStore';
import { Plus, Settings2, MoreVertical } from 'lucide-react';

const TeamTracker: React.FC = () => {
    const { party, healParty } = useSessionOSStore();

    // Calculate overall party health
    const totalHp = party.reduce((sum: number, p: PlayerCharacter) => sum + p.hp, 0);
    const totalMaxHp = party.reduce((sum: number, p: PlayerCharacter) => sum + p.hpMax, 0);
    const healthPercent = totalMaxHp > 0 ? (totalHp / totalMaxHp) * 100 : 0;

    return (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-6 w-full lg:w-auto overflow-x-auto custom-scrollbar no-scrollbar">
                <div className="flex -space-x-3 shrink-0">
                    {party.map((player: PlayerCharacter) => {
                        const healthRatio = player.hp / player.hpMax;
                        let ringColor = 'border-emerald-500';
                        if (healthRatio < 0.3) ringColor = 'border-red-500';
                        else if (healthRatio < 0.6) ringColor = 'border-yellow-500';

                        return (
                            <div key={player.id} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 relative group cursor-help transition-transform hover:-translate-y-1 hover:z-10 bg-cover bg-center" style={{ backgroundImage: `url(${player.avatar})` }} title={`${player.name} (${player.hp}/${player.hpMax})`}>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-slate-900 bg-slate-900 shadow-inner flex items-center justify-center`}>
                                    <div className={`w-full h-full rounded-full border-2 ${ringColor}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-1 w-48 shrink-0">
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Party Health</span>
                        <span className="text-xs text-slate-300 font-mono">{Math.round(healthPercent)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                            className={`h-full transition-all duration-500 ${healthPercent < 30 ? 'bg-red-500' : healthPercent < 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                            style={{ width: `${healthPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 shrink-0 ml-4">
                <button
                    onClick={() => gmConfirm('Heal entire party?', () => {
                        healParty();
                        gmAlert('The entire party has been restored to full health.');
                    })}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors" title="Heal Party"
                >
                    <Plus size={18} />
                </button>
                <button
                    onClick={() => gmAlert('Management of the team (Add/Remove players) will be available in the next update.')}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors" title="Manage Team"
                >
                    <Settings2 size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                </button>
            </div>
        </div>
    );
};

export default TeamTracker;
