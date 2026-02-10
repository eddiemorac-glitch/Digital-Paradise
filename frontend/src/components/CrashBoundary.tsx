import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class CrashBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleCopyError = () => {
        const text = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.errorInfo?.componentStack}`;
        navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] bg-[#050a06] text-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>

                    <h1 className="text-3xl font-black mb-2 tracking-tighter">Algo salió mal</h1>
                    <p className="text-white/40 mb-8 max-w-md">
                        Ha ocurrido un error inesperado en la aplicación. Hemos registrado el problema.
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 w-full max-w-2xl text-left overflow-auto max-h-[300px]">
                        <p className="text-red-400 font-mono text-xs font-bold mb-2">
                            {this.state.error?.toString()}
                        </p>
                        <pre className="text-white/30 font-mono text-[10px] whitespace-pre-wrap">
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={this.handleReload}
                            className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all"
                        >
                            <RefreshCw size={18} />
                            Recargar Página
                        </button>

                        <button
                            onClick={this.handleCopyError}
                            className="flex items-center gap-2 bg-white/5 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
                        >
                            <Copy size={18} />
                            Copiar Error
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
