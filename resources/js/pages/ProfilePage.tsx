import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (!isAuthenticated || !user) {
        navigate('/login?redirect=/profile');
        return null;
    }

    const initials = user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join('');

    const ROLE_LABELS: Record<string, string> = {
        user:    'Jugador',
        partner: 'Complejo deportivo',
        staff:   'Staff',
        admin:   'Administrador',
    };

    async function handleLogout() {
        await logout();
        toast.success('Sesión cerrada correctamente');
        navigate('/');
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">

            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <span className="inline-block mt-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                                {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

                {/* Sección Mis reservas */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <h2 className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        Mi actividad
                    </h2>
                    {[
                        { icon: '📋', label: 'Mis reservas', path: '/bookings' },
                    ].map((item) => (
                        <button key={item.path} type="button"
                            onClick={() => navigate(item.path)}
                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                            <span className="text-xl">{item.icon}</span>
                            <span className="flex-1 font-medium text-gray-800">{item.label}</span>
                            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </section>

                {/* Sección accesos por rol */}
                {(user.role === 'partner' || user.role === 'staff' || user.role === 'admin') && (
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <h2 className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                            Panel de gestión
                        </h2>
                        {user.role === 'partner' && (
                            <button type="button" onClick={() => navigate('/partner')}
                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                                <span className="text-xl">🏟</span>
                                <span className="flex-1 font-medium text-gray-800">Dashboard Partner</span>
                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                        {user.role === 'staff' && (
                            <button type="button" onClick={() => navigate('/staff')}
                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                                <span className="text-xl">⚡</span>
                                <span className="flex-1 font-medium text-gray-800">Panel Staff</span>
                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                        {user.role === 'admin' && (
                            <button type="button" onClick={() => navigate('/admin')}
                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                                <span className="text-xl">⚙️</span>
                                <span className="flex-1 font-medium text-gray-800">Panel Admin</span>
                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </section>
                )}

                {/* Sección cuenta */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <h2 className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        Cuenta
                    </h2>
                    <button type="button" onClick={() => navigate('/forgot-password')}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                        <span className="text-xl">🔑</span>
                        <span className="flex-1 font-medium text-gray-800">Cambiar contraseña</span>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button type="button" onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left">
                        <span className="text-xl">🚪</span>
                        <span className="flex-1 font-semibold text-red-600">Cerrar sesión</span>
                    </button>
                </section>

                {/* Información legal */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <h2 className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        Legal
                    </h2>
                    {[
                        { icon: '📄', label: 'Términos y condiciones' },
                        { icon: '🔒', label: 'Política de privacidad' },
                        { icon: '❓', label: 'Centro de ayuda' },
                    ].map((item) => (
                        <button key={item.label} type="button"
                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                            <span className="text-xl">{item.icon}</span>
                            <span className="flex-1 font-medium text-gray-800">{item.label}</span>
                            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </section>

                <p className="text-center text-xs text-gray-300 pb-4">CanchasApp v1.0 · Lima, Perú</p>
            </div>

            {/* Modal de confirmación de logout */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Cerrar sesión?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Tendrás que volver a ingresar tus datos la próxima vez.
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button type="button" onClick={handleLogout}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-white transition-colors">
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
