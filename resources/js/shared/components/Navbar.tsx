import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
}

export function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleComoFunciona = (e: React.MouseEvent) => {
        e.preventDefault();
        scrollToSection('como-funciona');
    };

    return (
        <>
            {/* ── TOP NAV (md+) ────────────────────────────────── */}
            <header
                className={[
                    'hidden md:block sticky top-0 z-40 w-full transition-shadow duration-200',
                    scrolled
                        ? 'bg-white shadow-md'
                        : 'bg-white border-b border-gray-100',
                ].join(' ')}
            >
                <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <span className="text-2xl">🏟</span>
                        <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                            Canchas<span className="text-emerald-600">App</span>
                        </span>
                    </Link>

                    {/* Links centro */}
                    <nav className="flex items-center gap-1">
                        <NavLink
                            to="/venues"
                            end={false}
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg text-base font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`
                            }
                        >
                            Buscar canchas
                        </NavLink>

                        <button
                            type="button"
                            onClick={handleComoFunciona}
                            className="px-4 py-2 rounded-lg text-base font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                            Cómo funciona
                        </button>

                        <NavLink
                            to="/para-complejos"
                            end={true}
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg text-base font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`
                            }
                        >
                            Para complejos
                        </NavLink>
                    </nav>

                    {/* Acciones derecha */}
                    <div className="flex items-center gap-2 shrink-0">
                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700"
                                    aria-haspopup="true"
                                    aria-expanded={menuOpen}
                                >
                                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                        {user?.name?.charAt(0).toUpperCase() ?? '?'}
                                    </span>
                                    <span className="hidden lg:block max-w-[120px] truncate">{user?.name?.split(' ')[0]}</span>
                                    <svg
                                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/bookings"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <span aria-hidden="true">📋</span>
                                            Mis reservas
                                        </Link>
                                        {user?.role === 'partner' && (
                                            <Link
                                                to="/partner"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <span aria-hidden="true">🏟</span>
                                                Mi dashboard
                                            </Link>
                                        )}
                                        {user?.role === 'admin' && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <span aria-hidden="true">⚙️</span>
                                                Admin
                                            </Link>
                                        )}
                                        <hr className="my-1 border-gray-100" />
                                        <button
                                            type="button"
                                            onClick={() => { void logout(); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <span aria-hidden="true">🚪</span>
                                            Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="px-4 py-2 text-base font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Ingresar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/register')}
                                    className="px-5 py-2 text-base font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                                >
                                    Registrarse gratis
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── BOTTOM NAV (mobile) ───────────────────────────── */}
            <nav
                aria-label="Navegación principal"
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgb(0,0,0,0.06)]"
            >
                <ul className="flex h-16">
                    {[
                        { to: '/venues', icon: '🔍', label: 'Buscar',   end: false },
                        { to: '/bookings', icon: '📋', label: 'Reservas', end: false },
                        {
                            to: isAuthenticated ? '/profile' : '/login',
                            icon: '👤',
                            label: 'Perfil',
                            end: false,
                        },
                    ].map((tab) => (
                        <li key={tab.to} className="flex-1">
                            <NavLink
                                to={tab.to}
                                end={tab.end}
                                className={({ isActive }) =>
                                    `h-full flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors relative ${
                                        isActive ? 'text-emerald-600' : 'text-gray-400'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        {isActive && (
                                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-full" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}
