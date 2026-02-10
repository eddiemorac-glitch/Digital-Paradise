import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Map Crashed:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="relative w-full h-full min-h-[400px] bg-slate-900 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-6">
                        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
                            <AlertTriangle className="text-red-500" size={40} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Radar Interrumpido</h2>
                            <p className="text-white/40 text-sm leading-relaxed">
                                Se detectó una anomalía en la renderización del mapa táctico.
                                Esto puede deberse a un error en el motor de Leaflet o datos corruptos.
                            </p>
                        </div>

                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-xs mx-auto hover:bg-primary/80 transition-all hover:scale-105"
                        >
                            <RefreshCw size={14} />
                            Reiniciar Sistema
                        </button>

                        {import.meta.env.DEV && (
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left overflow-auto max-h-40">
                                <code className="text-[10px] text-red-400 font-mono">
                                    {this.state.error?.toString()}
                                </code>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
