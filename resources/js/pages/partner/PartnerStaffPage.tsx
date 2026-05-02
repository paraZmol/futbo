import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PartnerLayout } from '@/features/partner/components/PartnerLayout';
import { api } from '@/shared/lib/apiClient';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const staffSchema = z.object({
    name:     z.string().min(2, 'Mínimo 2 caracteres'),
    email:    z.string().email('Correo inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type StaffForm = z.infer<typeof staffSchema>;

type StaffMember = { id: number; name: string; email: string; status: string; createdAt: string };

export default function PartnerStaffPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
        queryKey: ['partner', 'staff'],
        queryFn: async () => {
            const res = await api.get<{ data: StaffMember[] }>('/partner/staff');
            return res.data.data;
        },
        staleTime: 60_000,
    });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StaffForm>({
        resolver: zodResolver(staffSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: StaffForm) => api.post('/partner/staff', data),
        onSuccess: () => {
            toast.success('Staff agregado. Se envió un correo de bienvenida.');
            qc.invalidateQueries({ queryKey: ['partner', 'staff'] });
            setShowForm(false);
            reset();
        },
        onError: () => toast.error('No se pudo agregar el staff'),
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: number) => api.patch(`/partner/staff/${id}`, { status: 'suspended' }),
        onSuccess: () => {
            toast.success('Staff desactivado');
            qc.invalidateQueries({ queryKey: ['partner', 'staff'] });
        },
    });

    return (
        <PartnerLayout title="Gestión de Staff">
            <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-500 text-sm">{staff.length} empleado{staff.length !== 1 ? 's' : ''}</p>
                    <button type="button" onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar staff
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-3">{[1,2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-16" />
                    ))}</div>
                ) : staff.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="text-5xl mb-3">👥</div>
                        <h3 className="font-bold text-gray-900 mb-1">Sin staff registrado</h3>
                        <p className="text-gray-500 text-sm mb-4">Agrega empleados para que puedan hacer check-in y walk-ins.</p>
                        <button type="button" onClick={() => setShowForm(true)}
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm">
                            Agregar primer empleado
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {staff.map((s) => (
                            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                                    {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{s.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                    }`}>
                                        {s.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {s.status === 'active' && (
                                        <button type="button" onClick={() => deactivateMutation.mutate(s.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Desactivar">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 text-lg">Nuevo empleado</h2>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="px-6 py-5 space-y-4">
                            {[
                                { name: 'name' as const, label: 'Nombre completo', type: 'text', placeholder: 'Juan Pérez' },
                                { name: 'email' as const, label: 'Correo electrónico', type: 'email', placeholder: 'juan@correo.com' },
                                { name: 'password' as const, label: 'Contraseña temporal', type: 'password', placeholder: 'Mínimo 8 caracteres' },
                            ].map((f) => (
                                <div key={f.name}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                                    <input type={f.type} {...register(f.name)} placeholder={f.placeholder}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors[f.name] ? 'border-red-300' : 'border-gray-200'}`} />
                                    {errors[f.name] && <p className="mt-1 text-xs text-red-500">{errors[f.name]?.message}</p>}
                                </div>
                            ))}
                            <p className="text-xs text-gray-400">
                                El empleado recibirá un correo con sus credenciales de acceso.
                            </p>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={createMutation.isPending}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                                    {createMutation.isPending ? 'Creando...' : 'Crear empleado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PartnerLayout>
    );
}
