import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { Logger } from '../../utils/logger';

interface Props {
  children?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('CRITICAL_MODULE_FAILURE', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-950/80 border border-red-500/30 rounded-xl backdrop-blur-md animate-gmos-glitch-damage h-full w-full min-h-[200px]">
          <div className="flex items-center gap-3 mb-4 text-red-500">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-widest font-display">
              Module Failure: {this.props.moduleName || 'System Corrupt'}
            </h2>
          </div>
          
          <div className="bg-black/60 p-4 rounded border border-white/5 font-mono text-xs text-red-400/80 mb-6 max-w-lg overflow-auto max-h-40 w-full custom-scrollbar">
            <div className="flex items-center gap-2 mb-2 text-red-500 opacity-60">
              <Terminal className="w-4 h-4" />
              <span>STACK_TRACE_DUMP</span>
            </div>
            {this.state.error?.message || 'Unknown kernel exception'}
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-full transition-all hover:scale-105 active:scale-95 group font-bold uppercase text-xs tracking-widest"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Restart Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
