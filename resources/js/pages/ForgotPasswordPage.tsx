import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/shared/lib/apiClient';
import { toast } from 'sonner';

const schema = z.object({
    email: z.string().email('Ingresa un correo válido'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    async function onSubmit(data: FormData) {
        try {
            await api.post('/auth/forgot-password', { email: data.email });
            setSent(true);
        } catch {
            // Por seguridad, respuesta siempre idéntica (anti-enumeración)
            setSent(true);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md">

                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <span className="text-3xl">🏟</span>
                        <span className="font-extrabold text-2xl text-gray-900">
                            Canchas<span className="text-emerald-600">App</span>
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {sent ? '¡Correo enviado!' : 'Recuperar contraseña'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {sent
                            ? 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.'
                            : 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.'}
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                {...register('email')}
                                placeholder="tu@correo.com"
                                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <button type="submit" disabled={isSubmitting}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-base active:scale-[0.98]">
                            {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <div className="text-5xl mb-4">📬</div>
                        <p className="text-gray-600 text-sm mb-6">
                            Revisa tu bandeja de entrada y también la carpeta de spam.
                        </p>
                    </div>
                )}

                <p className="text-center text-sm text-gray-500 mt-6">
                    <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        ← Volver al inicio de sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}
