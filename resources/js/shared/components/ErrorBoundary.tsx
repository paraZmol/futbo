import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, message: '' };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">😵</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Ocurrió un error inesperado. Por favor recarga la página.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Recargar página
                    </button>
                </div>
            </div>
        );
    }
}
