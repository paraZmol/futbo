export function registerServiceWorker(): void {
    if ('serviceWorker' in navigator && window.location.pathname.startsWith('/staff')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('SW registration failed:', err);
            });
        });
    }
}
