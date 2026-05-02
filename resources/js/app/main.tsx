import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';

function App() {
    return (
        <div className="min-h-screen bg-[var(--gray-page)] flex items-center justify-center">
            <h1 className="text-2xl font-bold text-[var(--navy-deep)]">
                Ecosistema Digital de Canchas
            </h1>
        </div>
    );
}

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(<App />);
}
