import { Brain, X, VolumeX, Volume2, ShieldCheck, ShieldAlert, Zap, Wand2, History, Navigation } from 'lucide-react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { huePriorityQueue, HuePriority } from '../services/HuePriorityQueue';
import { gmToast } from '../../../stores/useToastStore';
import { audioCurationService } from '../services/AudioCurationService';

export const TacticalAIControlPanel: React.FC = () => {
  const { settings, logs, hardwareStatus, updateSettings, clearLogs, isPanelOpen, setIsPanelOpen, activeAdvices } = useTacticalAIStore();

  const toggleSensor = () => {
    const nextValue = !settings.isMuted;
    updateSettings({ isMuted: nextValue });
    gmToast(nextValue ? 'Sensors Muted' : 'Sensors Live', nextValue ? 'warning' : 'info');
  };

  const toggleAutoDispel = () => {
    const nextValue = !settings.autoApplyDispel;
    updateSettings({ autoApplyDispel: nextValue });
    gmToast(nextValue ? 'Auto-Dispel Active' : 'Auto-Dispel Desactivé', nextValue ? 'info' : 'warning');
  };

  const triggerCombatFlash = () => {
    huePriorityQueue.enqueue({
      priority: HuePriority.P1_FLASH,
      execute: async (engine) => {
        console.log('[TacticalPanel] Manual Combat Flash Triggered');
        await engine.triggerFlash('#ff0000', 1000);
      }
    });
    gmToast('Combat Flash Triggered', 'info');
  };

  const testAudio = async () => {
    console.log('[TacticalPanel] Testing Audio System...');
    gmToast('Testing Audio...', 'info');
    await audioCurationService.playTacticalCut('assets/sounds/tactical/proximity_alarm.mp3', 1.0);
  };

  if (!isPanelOpen) return null;

  return (
    <div className="fixed bottom-20 right-8 w-80 bg-slate-950/80 backdrop-blur-3xl border border-accent/20 rounded-[2rem] shadow-2xl flex flex-col z-50 overflow-hidden ring-1 ring-white/5 max-h-[80vh]">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5 bg-accent/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/20 text-accent">
            <Brain size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white uppercase italic">Cerveau <span className="text-accent">Tactique</span></h3>
            <span className="text-[10px] font-mono text-accent/60 uppercase tracking-widest leading-none">AI Integration</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Hardware Readiness Pointers */}
          <div 
            title={hardwareStatus.hue === 'connected' ? 'Hue Bridge Connecté' : 'Hue Bridge Offline (Pairing requis)'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter transition-all ${
              hardwareStatus.hue === 'connected' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400 opacity-60 animate-pulse'
            }`}
          >
            <Zap size={10} fill={hardwareStatus.hue === 'connected' ? 'currentColor' : 'none'} />
            Hue
          </div>

          <div 
            title={hardwareStatus.audio === 'ready' ? 'Audio Immersif Prêt' : 'Assets Audio Manquants'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter transition-all ${
              hardwareStatus.audio === 'ready' 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Volume2 size={10} />
            Audio
          </div>

          <button onClick={() => setIsPanelOpen(false)} className="ml-2 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Active Advices (Insights) */}
        {activeAdvices.length > 0 && (
          <div className="p-4 bg-accent/5 border-b border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest mb-1">
              <ShieldAlert size={12} /> Insights Actifs
            </div>
            {activeAdvices.map((advice) => (
              <div key={advice.id} className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mt-0.5">
                   {advice.type === 'range' && <Navigation size={14} className="text-sky-400" />}
                   {advice.type === 'dispel' && <ShieldAlert size={14} className="text-amber-500" />}
                   {advice.type === 'magic' && <Wand2 size={14} className="text-purple-400" />}
                   {advice.type !== 'range' && advice.type !== 'dispel' && advice.type !== 'magic' && <Zap size={14} className="text-accent" />}
                </div>
                <p className="text-[11px] font-medium text-white/90 leading-snug">{advice.message}</p>
              </div>
            ))}
          </div>
        )}

      {/* Toggles */}
      <div className="p-5 grid grid-cols-2 gap-3">
        <button
          onClick={toggleSensor}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
            settings.isMuted 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {settings.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          <span className="text-[10px] font-bold uppercase tracking-wider">{settings.isMuted ? 'Sensors Muted' : 'Sensors Live'}</span>
        </button>
        <button
          onClick={toggleAutoDispel}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
            !settings.autoApplyDispel 
              ? 'bg-slate-800/50 border-white/10 text-white/40' 
              : 'bg-accent/10 border-accent/30 text-accent'
          }`}
        >
          {settings.autoApplyDispel ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Dispel</span>
        </button>
      </div>

      {/* Actions */}
      <div className="px-5 mb-5 grid grid-cols-2 gap-2">
        <button
          onClick={testAudio}
          className="py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Volume2 size={14} />
          Test Audio
        </button>
        <button
          onClick={triggerCombatFlash}
          className="py-4 rounded-2xl bg-accent text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Zap size={14} fill="currentColor" />
          Flash
        </button>
      </div>

        {/* Logs */}
        <div className="flex flex-col min-h-0 bg-black/20 shrink-0">
          <div className="px-5 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <History size={12} /> Recent Analytics
            </div>
            <button onClick={clearLogs} className="text-[10px] hover:text-white text-white/20 transition-colors uppercase font-bold">Clear</button>
          </div>
          <div className="max-h-40 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-20 flex flex-col items-center justify-center text-white/20">
                <Wand2 size={24} className="mb-2 opacity-10" />
                <span className="text-[10px] uppercase font-bold tracking-tighter">Waiting for combat...</span>
              </div>
            ) : (
              logs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[11px] text-white/80 leading-relaxed font-medium">{log.message}</p>
                  <span className="text-[9px] font-mono text-white/20 mt-1 block tracking-tighter">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
