import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRouter } from './Router';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import '../styles/tokens.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            // Los errores de mutación se manejan con toast en cada componente
        },
    },
});

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(
        <React.StrictMode>
            <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <AppRouter />
                    <Toaster
                        position="top-center"
                        richColors
                        toastOptions={{
                            style: { fontFamily: 'Inter, system-ui, sans-serif' },
                        }}
                    />
                </QueryClientProvider>
            </ErrorBoundary>
        </React.StrictMode>
    );
}
