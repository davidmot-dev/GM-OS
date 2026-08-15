import { useSessionOSStore } from '../useSessionOSStore';
import { gmAlert, gmConfirm } from '../../../stores/useModalStore';
import { aUneJaugeDeVie, fractionDeVie, decrireLaSante } from '../../combat/logic/SanteDuCombattant';
import { Plus, Settings2, MoreVertical } from 'lucide-react';

const TeamTracker: React.FC = () => {
    const { players, activeCampaignId, updateCharacterHP } = useSessionOSStore();

    // Reconstruct the active campaign characters
    const party = players.flatMap(player => 
        player.characters
            .filter(c => c.campaignId === activeCampaignId)
            .map(c => ({
                ...c,
                playerId: player.id // keep track of the player ID to update HP
            }))
    );

    const healParty = () => {
        // On ne soigne que ceux qui ont une jauge : rendre `undefined` points
        // de vie à un personnage qui n'en a pas lui en inventerait.
        party.forEach(char => {
            if (typeof char.maxHp === 'number') updateCharacterHP(char.playerId, char.id, char.maxHp);
        });
    };

    /*
      **La santé du groupe ne compte que ceux qui en ont une.**

      Ces sommes lisaient `p.hp` et `p.maxHp` directement. Depuis que les points
      de vie sont facultatifs — ils ne sont que le détail d'un modèle sur cinq —
      un personnage d'Alien y entrait pour `undefined`, et la barre entière
      partait en `NaN`. Les additionner comme des zéros aurait été pire : le
      groupe aurait paru à l'agonie parce qu'un de ses membres relève d'un jeu
      qui ne compte pas comme ça.
    */
    const avecJauge = party.filter(aUneJaugeDeVie);
    const totalHp = avecJauge.reduce((sum: number, p) => sum + p.hp!, 0);
    const totalMaxHp = avecJauge.reduce((sum: number, p) => sum + p.maxHp!, 0);
    const healthPercent = totalMaxHp > 0 ? (totalHp / totalMaxHp) * 100 : 0;

    return (
        <div className="bg-app-surface/60 rounded-xl border border-app-border/40 p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-6 w-full lg:w-auto overflow-x-auto custom-scrollbar no-scrollbar">
                <div className="flex -space-x-3 shrink-0">
                    {party.map((char) => {
                        // `null` sans jauge : l'anneau reste neutre plutôt que
                        // de virer au rouge sur une division impossible.
                        const healthRatio = fractionDeVie(char);
                        let ringColor = healthRatio === null ? 'border-app-border' : 'border-emerald-500';
                        if (healthRatio !== null && healthRatio < 0.3) ringColor = 'border-red-500';
                        else if (healthRatio !== null && healthRatio < 0.6) ringColor = 'border-yellow-500';

                        return (
                            <div key={char.id} className="w-10 h-10 rounded-full border-2 border-app-bg bg-app-surface relative group cursor-help transition-transform hover:-translate-y-1 hover:z-10 bg-cover bg-center" style={{ backgroundImage: `url(${char.portraitUrl})` }} title={[char.name, decrireLaSante(char)].filter(Boolean).join(' — ')}>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-app-bg bg-app-bg shadow-inner flex items-center justify-center`}>
                                    <div className={`w-full h-full rounded-full border-2 ${ringColor}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-1 w-48 shrink-0">
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-app-text/40 font-bold uppercase tracking-tighter">Party Health</span>
                        <span className="text-xs text-app-text/80 font-mono">{Math.round(healthPercent)}%</span>
                    </div>
                    <div className="w-full bg-app-bg h-2 rounded-full overflow-hidden border border-app-border/30">
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
                    className="p-2 text-app-text/40 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-colors" title="Heal Party"
                >
                    <Plus size={18} />
                </button>
                <button
                    onClick={() => gmAlert('Management of the team (Add/Remove players) will be available in the next update.')}
                    className="p-2 text-app-text/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Manage Team"
                >
                    <Settings2 size={18} />
                </button>
                <button className="p-2 text-app-text/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                </button>
            </div>
        </div>
    );
};

export default TeamTracker;

