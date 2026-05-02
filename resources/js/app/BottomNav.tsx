import React from 'react';
import { NavLink } from 'react-router-dom';

const tabs = [
    { to: '/',         label: 'Buscar',      icon: '🔍' },
    { to: '/bookings', label: 'Mis reservas', icon: '📋' },
    { to: '/profile',  label: 'Perfil',       icon: '👤' },
];

export function BottomNav() {
    return (
        <nav
            aria-label="Navegación principal"
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--gray-border)] z-20 safe-area-pb"
        >
            <ul className="flex">
                {tabs.map((tab) => (
                    <li key={tab.to} className="flex-1">
                        <NavLink
                            to={tab.to}
                            end={tab.to === '/'}
                            className={({ isActive }) =>
                                [
                                    'flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                                    isActive
                                        ? 'text-[var(--navy-deep)]'
                                        : 'text-[var(--gray-placeholder)] hover:text-[var(--gray-secondary)]',
                                ].join(' ')
                            }
                        >
                            <span className="text-xl" aria-hidden="true">{tab.icon}</span>
                            {tab.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
