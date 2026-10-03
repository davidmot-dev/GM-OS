import React from 'react';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { Loader2 } from 'lucide-react';

const LoadingOverlay: React.FC = () => {
  const { isLoading, message } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-app-bg/40 backdrop-blur-md transition-all duration-300">
      {/* CRT Scanline effect */}
      <div className="absolute inset-0 pointer-events-none crt-overlay opacity-20" />
      
      <div className="relative flex flex-col items-center p-8 rounded-2xl border border-app-text/5 bg-app-bg/60 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full scale-150 animate-pulse" />
          <Loader2 className="w-12 h-12 text-accent animate-spin relative z-10" />
        </div>
        
        {message && (
          <div className="text-center space-y-2 relative z-10">
            <p className="text-accent font-display font-black uppercase tracking-widest text-sm animate-pulse">
              SYSTEM_BUSY
            </p>
            <p className="text-app-text font-mono text-xs opacity-80 max-w-xs leading-relaxed">
              {message.toUpperCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
