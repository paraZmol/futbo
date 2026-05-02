import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const NAV_ITEMS = [
    { to: '/partner',          icon: '📊', label: 'Hoy',         end: true  },
    { to: '/partner/bookings', icon: '📅', label: 'Reservas',    end: false },
    { to: '/partner/fields',   icon: '🏟', label: 'Mis canchas', end: false },
    { to: '/partner/staff',    icon: '👥', label: 'Staff',       end: false },
    { to: '/partner/analytics',icon: '💰', label: 'Ingresos',    end: false },
    { to: '/partner/events',   icon: '🚫', label: 'Bloqueos',    end: false },
];

type Props = { children: React.ReactNode; title: string };

export function PartnerLayout({ children, title }: Props) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">

            {/* Sidebar desktop */}
            <aside className="hidden md:flex flex-col w-60 bg-slate-900 text-white shrink-0 min-h-screen sticky top-0">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-slate-800">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🏟</span>
                        <span className="font-bold text-white text-lg">
                            Canchas<span className="text-emerald-400">App</span>
                        </span>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 truncate">Panel del complejo</p>
                </div>

                {/* Nav items */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }>
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User footer */}
                <div className="px-4 py-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => { logout(); navigate('/'); }}
                        className="w-full text-left text-xs text-slate-400 hover:text-red-400 transition-colors py-1">
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-100 sticky top-0 z-20 h-14 flex items-center px-4 md:px-6 gap-4">
                    {/* Hamburger móvil */}
                    <button type="button" onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <h1 className="font-bold text-gray-900 text-lg flex-1">{title}</h1>

                    <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hidden md:block">
                        Ver app →
                    </Link>
                </header>

                <main className="flex-1 px-4 md:px-6 py-6 overflow-auto">
                    {children}
                </main>
            </div>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 z-50 flex flex-col">
                        <div className="px-5 py-5 border-b border-slate-800 flex justify-between items-center">
                            <span className="font-bold text-white text-lg">
                                Canchas<span className="text-emerald-400">App</span>
                            </span>
                            <button type="button" onClick={() => setMobileMenuOpen(false)}
                                className="text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <nav className="flex-1 px-3 py-4 space-y-1">
                            {NAV_ITEMS.map((item) => (
                                <NavLink key={item.to} to={item.to} end={item.end}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                            isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`
                                    }>
                                    <span>{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </>
            )}
        </div>
    );
}
