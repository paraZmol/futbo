import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

function SearchIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-5 h-5 ${active ? 'stroke-emerald-500' : 'stroke-slate-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
        </svg>
    );
}
function CalendarIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-5 h-5 ${active ? 'stroke-emerald-500' : 'stroke-slate-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
        </svg>
    );
}
function UserIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-5 h-5 ${active ? 'stroke-emerald-500' : 'stroke-slate-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    );
}

export function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [scrolled,  setScrolled]  = useState(false);
    const [dropdown,  setDropdown]  = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    const hidden = ['/staff', '/partner', '/admin', '/login', '/register', '/forgot-password']
        .some(p => pathname.startsWith(p));
    if (hidden) return null;

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdown(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    return (
        <>
            {/* ── TOP NAVBAR — desktop md+ ───────────────── */}
            <header className={`hidden md:block sticky top-0 z-50 w-full transition-all duration-200 border-b border-slate-100 ${
                scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
            }`}>
                <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between gap-8">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                        <div className="w-8 h-8 bg-emerald-500 group-hover:bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                            <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                            Canchas<span className="text-emerald-500">App</span>
                        </span>
                    </Link>

                    {/* Links centrales */}
                    <nav className="flex items-center gap-1 flex-1 justify-center">
                        {[
                            { to: '/',       label: 'Inicio',          end: true  },
                            { to: '/venues', label: 'Buscar canchas',  end: false },
                            { to: '/partner',label: 'Para complejos',  end: false },
                        ].map(l => (
                            <NavLink key={l.to} to={l.to} end={l.end}
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        isActive
                                            ? 'text-emerald-600 bg-emerald-50'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`
                                }>
                                {l.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Acciones derecha */}
                    <div className="flex items-center gap-2 shrink-0">
                        {isAuthenticated ? (
                            <div className="relative" ref={dropRef}>
                                <button type="button" onClick={() => setDropdown(v => !v)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 hidden lg:block max-w-[100px] truncate">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdown ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {dropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-slate-50">
                                            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            {[
                                                { label: 'Mis reservas', icon: '📋', path: '/bookings' },
                                                { label: 'Mi perfil',    icon: '👤', path: '/profile'  },
                                            ].map(item => (
                                                <Link key={item.path} to={item.path} onClick={() => setDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                    <span>{item.icon}</span>{item.label}
                                                </Link>
                                            ))}
                                            {user?.role === 'partner' && (
                                                <Link to="/partner" onClick={() => setDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                    <span>🏟</span>Mi dashboard
                                                </Link>
                                            )}
                                            {user?.role === 'admin' && (
                                                <Link to="/admin" onClick={() => setDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                    <span>⚙️</span>Admin
                                                </Link>
                                            )}
                                        </div>
                                        <div className="border-t border-slate-50 py-1">
                                            <button type="button"
                                                onClick={() => { logout(); setDropdown(false); navigate('/'); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                                <span>🚪</span>Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button type="button" onClick={() => navigate('/login')}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                    Ingresar
                                </button>
                                <button type="button" onClick={() => navigate('/register')}
                                    className="px-5 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl transition-all shadow-sm shadow-emerald-100">
                                    Registrarse gratis
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── BOTTOM NAV — mobile ───────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 pb-safe">
                <ul className="flex h-[60px]">
                    {([
                        { to: '/',         Icon: SearchIcon,   label: 'Buscar',   end: true  },
                        { to: '/bookings', Icon: CalendarIcon, label: 'Reservas', end: false },
                        { to: '/profile',  Icon: UserIcon,     label: 'Perfil',   end: false },
                    ] as const).map(tab => (
                        <li key={tab.to} className="flex-1">
                            <NavLink to={tab.to} end={tab.end}
                                className={({ isActive }) =>
                                    `h-full flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors relative ${
                                        isActive ? 'text-emerald-600' : 'text-slate-400'
                                    }`
                                }>
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
                                        )}
                                        <tab.Icon active={isActive} />
                                        <span>{tab.label}</span>
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
