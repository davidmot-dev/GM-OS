import { Brain, VolumeX, Volume2, ShieldCheck, ShieldAlert, Zap, Wand2, History } from 'lucide-react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { huePriorityQueue, HuePriority } from '../services/HuePriorityQueue';
import { gmToast } from '../../../stores/useToastStore';
import { audioCurationService } from '../services/AudioCurationService';
import { TacticalAdvicePanel } from './TacticalAdvicePanel';

export const TacticalAIControlPanel: React.FC = () => {
  const { settings, logs, hardwareStatus, updateSettings, clearLogs, isPanelOpen, setIsPanelOpen } = useTacticalAIStore();

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
    <div 
      className="w-[70rem] max-w-[95vw] h-80 bg-slate-950/90 backdrop-blur-3xl border border-accent/30 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,1)] flex overflow-hidden ring-1 ring-white/10 shadow-accent/20"
      style={{ 
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999
      }}
    >
      
      {/* 1. Header & Status (w-[15%]) */}
      <div className="w-[15%] p-4 flex flex-col justify-between border-r border-white/5 bg-accent/5 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-accent/20 text-accent">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white uppercase">Cerveau <span className="text-accent">Tactique</span></h3>
              <span className="text-[10px] font-mono text-accent/60 uppercase tracking-widest leading-none">AI Integration</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div 
              title={hardwareStatus.hue === 'connected' ? 'Hue Bridge Connecté' : 'Hue Bridge Offline (Pairing requis)'}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                hardwareStatus.hue === 'connected' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400 opacity-60 animate-pulse'
              }`}
            >
              <Zap size={12} fill={hardwareStatus.hue === 'connected' ? 'currentColor' : 'none'} />
              Hue Bridge
            </div>

            <div 
              title={hardwareStatus.audio === 'ready' ? 'Audio Immersif Prêt' : 'Assets Audio Manquants'}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                hardwareStatus.audio === 'ready' 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <Volume2 size={12} />
              Audio Server
            </div>
          </div>
        </div>

        <button onClick={() => setIsPanelOpen(false)} className="mt-4 flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase text-[10px] font-bold tracking-widest border border-white/5">
            Fermer Cortex
        </button>
      </div>

      {/* 2. Insights Actifs (flex-1 - Prominence to Analysis) */}
      <div className="flex-1 border-r border-white/5 min-w-0">
        <TacticalAdvicePanel />
      </div>

      {/* 3. Contrôles (w-[15%]) */}
      <div className="w-[15%] p-3 flex flex-col gap-2 border-r border-white/5 shrink-0">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <button
            onClick={toggleSensor}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all ${
                settings.isMuted 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
            >
            {settings.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">{settings.isMuted ? 'Muted' : 'Sensors'}</span>
            </button>
            <button
            onClick={toggleAutoDispel}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all ${
                !settings.autoApplyDispel 
                ? 'bg-slate-800/50 border-white/10 text-white/40' 
                : 'bg-accent/10 border-accent/30 text-accent'
            }`}
            >
            {settings.autoApplyDispel ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">Auto</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 shrink-0">
             <button
            onClick={testAudio}
            className="py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[9px] uppercase tracking-wider hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
            <Volume2 size={14} />
            Test
             </button>
             <button
            onClick={triggerCombatFlash}
            className="py-2 rounded-xl bg-accent text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
            <Zap size={14} fill="currentColor" />
            Flash
             </button>
          </div>
      </div>

      {/* 4. Logs (w-[20%]) */}
      <div className="w-[20%] flex flex-col bg-black/20 shrink-0">
          <div className="px-5 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <History size={12} /> Analytics
            </div>
            <button onClick={clearLogs} className="text-[10px] hover:text-white text-white/20 transition-colors uppercase font-bold">Clear</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Wand2 size={24} className="mb-2 opacity-10" />
                <span className="text-[10px] uppercase font-bold tracking-tighter px-4 text-center">En attente...</span>
              </div>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                  <p className="text-[11px] text-white/90 leading-snug" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontStyle: 'normal' }}>{log.message}</p>
                  <span className="text-[9px] font-mono text-white/20 mt-1 block tracking-tighter">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
};
