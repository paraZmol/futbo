import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PartnerLayout } from '@/features/partner/components/PartnerLayout';
import { api } from '@/shared/lib/apiClient';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const eventSchema = z.object({
    field_id:   z.coerce.number().min(1, 'Elige una cancha'),
    title:      z.string().min(2, 'Mínimo 2 caracteres'),
    starts_at:  z.string().min(1),
    ends_at:    z.string().min(1),
    type:       z.enum(['maintenance', 'tournament', 'private', 'other']),
    notes:      z.string().optional(),
});
type EventForm = z.infer<typeof eventSchema>;

const TYPE_LABELS = {
    maintenance: '🔧 Mantenimiento',
    tournament:  '🏆 Torneo',
    private:     '🔒 Privado',
    other:       '📌 Otro',
};

type FieldOption = { id: number; name: string };
type EventItem = { id: number; title: string; type: string; startsAt: string; endsAt: string; fieldName: string };

export default function PartnerEventsPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    const { data: fields = [] } = useQuery<FieldOption[]>({
        queryKey: ['partner', 'fields-list'],
        queryFn: async () => {
            const res = await api.get<{ data: FieldOption[] }>('/partner/fields');
            return res.data.data;
        },
    });

    const { data: events = [], isLoading } = useQuery<EventItem[]>({
        queryKey: ['partner', 'events'],
        queryFn: async () => {
            const res = await api.get<{ data: EventItem[] }>('/partner/events');
            return res.data.data;
        },
        staleTime: 30_000,
    });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EventForm>({
        resolver: zodResolver(eventSchema),
        defaultValues: { type: 'maintenance' },
    });

    const createMutation = useMutation({
        mutationFn: (data: EventForm) => api.post('/partner/events', data),
        onSuccess: () => {
            toast.success('Bloqueo creado. Los slots del período quedarán como "evento".');
            qc.invalidateQueries({ queryKey: ['partner', 'events'] });
            setShowForm(false);
            reset();
        },
        onError: () => toast.error('No se pudo crear el bloqueo'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/partner/events/${id}`),
        onSuccess: () => {
            toast.success('Bloqueo eliminado');
            qc.invalidateQueries({ queryKey: ['partner', 'events'] });
        },
    });

    return (
        <PartnerLayout title="Bloqueos y eventos">
            <div className="max-w-3xl space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <p className="text-sm text-amber-800 font-medium">
                        ⚠️ Los bloqueos reservan las canchas para torneos, mantenimiento o eventos privados.
                        Los slots del período seleccionado NO podrán ser reservados por usuarios.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Crear bloqueo
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-3">{[1,2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
                    ))}</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <div className="text-4xl mb-3">🚫</div>
                        <p className="text-gray-500">No hay bloqueos programados.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map((ev) => {
                            const start = new Date(ev.startsAt).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                            const end   = new Date(ev.endsAt).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                            return (
                                <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">{ev.title}</span>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {TYPE_LABELS[ev.type as keyof typeof TYPE_LABELS] ?? ev.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{ev.fieldName}</p>
                                        <p className="text-xs text-gray-400">{start} → {end}</p>
                                    </div>
                                    <button type="button" onClick={() => deleteMutation.mutate(ev.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="font-bold text-gray-900 text-lg">Nuevo bloqueo</h2>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cancha</label>
                                <select {...register('field_id')}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${errors.field_id ? 'border-red-300' : 'border-gray-200'}`}>
                                    <option value="">Selecciona una cancha</option>
                                    {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo</label>
                                <select {...register('type')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título</label>
                                <input {...register('title')} placeholder="Ej: Mantenimiento de piso"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.title ? 'border-red-300' : 'border-gray-200'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Inicio</label>
                                    <input type="datetime-local" {...register('starts_at')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin</label>
                                    <input type="datetime-local" {...register('ends_at')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notas (opcional)</label>
                                <textarea {...register('notes')} rows={2} placeholder="Detalles adicionales..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={createMutation.isPending}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl">
                                    {createMutation.isPending ? 'Creando...' : 'Crear bloqueo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PartnerLayout>
    );
}
