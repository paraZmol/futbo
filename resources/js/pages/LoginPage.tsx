import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/features/auth/hooks/useAuth';

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'El correo es requerido')
        .email('Ingresa un correo válido'),
    password: z
        .string()
        .min(1, 'La contraseña es requerida')
        .min(6, 'Mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const login = useAuth((s) => s.login);
    const [apiError, setApiError] = useState<string | null>(null);

    const redirectTo = searchParams.get('redirect') ?? '/';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(data: LoginFormData) {
        setApiError(null);
        try {
            await login({ email: data.email, password: data.password });
            navigate(redirectTo, { replace: true });
        } catch (err: unknown) {
            if (
                err &&
                typeof err === 'object' &&
                'response' in err &&
                err.response &&
                typeof err.response === 'object' &&
                'data' in err.response &&
                err.response.data &&
                typeof err.response.data === 'object' &&
                'message' in err.response.data
            ) {
                setApiError(String((err.response.data as { message: string }).message));
            } else {
                setApiError('Correo o contraseña incorrectos. Intenta de nuevo.');
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 justify-center">
                        <span className="text-3xl" aria-hidden="true">🏟</span>
                        <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                            Canchas<span className="text-emerald-600">App</span>
                        </span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white shadow-xl rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                        Bienvenido de vuelta
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Ingresa a tu cuenta para gestionar tus reservas
                    </p>

                    {/* Error de API */}
                    {apiError && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                            <span aria-hidden="true" className="text-base leading-none mt-0.5">⚠️</span>
                            <span>{apiError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="tu@correo.com"
                                {...register('email')}
                                className={[
                                    'w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none',
                                    'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
                                    errors.email
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300',
                                ].join(' ')}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Contraseña
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    Olvidé mi contraseña
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                {...register('password')}
                                className={[
                                    'w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none',
                                    'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
                                    errors.password
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300',
                                ].join(' ')}
                            />
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-sm mt-2"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Ingresando...
                                </span>
                            ) : (
                                'Ingresar'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            ¿No tienes cuenta?{' '}
                            <Link
                                to="/register"
                                className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                            >
                                Registrarse
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-gray-400">
                    Al continuar aceptas nuestros{' '}
                    <a href="#" className="underline hover:text-gray-600">Términos de uso</a>
                    {' '}y{' '}
                    <a href="#" className="underline hover:text-gray-600">Política de privacidad</a>.
                </p>
            </div>
        </div>
    );
}
