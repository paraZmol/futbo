import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PartnerLayout } from '@/features/partner/components/PartnerLayout';
import { api } from '@/shared/lib/apiClient';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const SPORTS = ['futbol5', 'futbol7', 'futbol11', 'padel', 'basket', 'tenis'];
const SURFACES = ['grass_sintetico', 'grass_natural', 'cemento', 'parquet', 'otro'];
const SPORT_LABELS: Record<string, string> = {
    futbol5: 'Fútbol 5', futbol7: 'Fútbol 7', futbol11: 'Fútbol 11',
    padel: 'Pádel', basket: 'Basket', tenis: 'Tenis',
};
const SURFACE_LABELS: Record<string, string> = {
    grass_sintetico: 'Grass sintético', grass_natural: 'Grass natural',
    cemento: 'Cemento', parquet: 'Parquet', otro: 'Otro',
};

const fieldSchema = z.object({
    name:             z.string().min(2, 'Mínimo 2 caracteres'),
    sport:            z.string(),
    surface:          z.string(),
    capacity_players: z.coerce.number().min(2).max(30),
    is_indoor:        z.boolean(),
});
type FieldForm = z.infer<typeof fieldSchema>;

type Field = {
    id: number; publicId: string; name: string; sport: string;
    surface: string; capacityPlayers: number; isIndoor: boolean; isActive: boolean;
};

export default function PartnerFieldsPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editField, setEditField] = useState<Field | null>(null);

    const { data: fields = [], isLoading } = useQuery<Field[]>({
        queryKey: ['partner', 'my-fields'],
        queryFn: async () => {
            const res = await api.get<{ data: Field[] }>('/partner/fields');
            return res.data.data;
        },
        staleTime: 60_000,
    });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FieldForm>({
        resolver: zodResolver(fieldSchema),
        defaultValues: { sport: 'futbol5', surface: 'grass_sintetico', capacity_players: 10, is_indoor: false },
    });

    const saveMutation = useMutation({
        mutationFn: async (data: FieldForm) => {
            if (editField) {
                await api.put(`/partner/fields/${editField.id}`, data);
            } else {
                await api.post('/partner/fields', data);
            }
        },
        onSuccess: () => {
            toast.success(editField ? 'Cancha actualizada' : 'Cancha creada');
            qc.invalidateQueries({ queryKey: ['partner', 'my-fields'] });
            setShowForm(false);
            setEditField(null);
            reset();
        },
        onError: () => toast.error('No se pudo guardar la cancha'),
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
            await api.patch(`/partner/fields/${id}`, { is_active: active });
        },
        onSuccess: () => {
            toast.success('Estado actualizado');
            qc.invalidateQueries({ queryKey: ['partner', 'my-fields'] });
        },
    });

    function openEdit(field: Field) {
        setEditField(field);
        reset({
            name: field.name, sport: field.sport, surface: field.surface,
            capacity_players: field.capacityPlayers, is_indoor: field.isIndoor,
        });
        setShowForm(true);
    }

    function openNew() {
        setEditField(null);
        reset({ sport: 'futbol5', surface: 'grass_sintetico', capacity_players: 10, is_indoor: false });
        setShowForm(true);
    }

    return (
        <PartnerLayout title="Mis canchas">
            <div className="max-w-3xl">

                {/* Header de sección */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-gray-500 text-sm">
                            {fields.length} cancha{fields.length !== 1 ? 's' : ''} registrada{fields.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button type="button" onClick={openNew}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar cancha
                    </button>
                </div>

                {/* Lista de canchas */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1,2].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
                            </div>
                        ))}
                    </div>
                ) : fields.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="text-5xl mb-3">🏟</div>
                        <h3 className="font-bold text-gray-900 mb-1">Sin canchas aún</h3>
                        <p className="text-gray-500 text-sm mb-4">Agrega tu primera cancha para empezar a recibir reservas.</p>
                        <button type="button" onClick={openNew}
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm">
                            Agregar primera cancha
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field) => (
                            <div key={field.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900">{field.name}</h3>
                                        {!field.isActive && (
                                            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                                                Inactiva
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                                            {SPORT_LABELS[field.sport] ?? field.sport}
                                        </span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                                            {SURFACE_LABELS[field.surface] ?? field.surface}
                                        </span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                                            {field.isIndoor ? '🏠 Techada' : '☀️ Descubierta'}
                                        </span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                                            {field.capacityPlayers} jugadores
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button type="button" onClick={() => openEdit(field)}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Editar">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    {/* Toggle activo/inactivo */}
                                    <button type="button"
                                        onClick={() => toggleMutation.mutate({ id: field.id, active: !field.isActive })}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${field.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${field.isActive ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulario modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="font-bold text-gray-900 text-lg">
                                {editField ? 'Editar cancha' : 'Nueva cancha'}
                            </h2>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la cancha</label>
                                <input {...register('name')} placeholder="Ej: Cancha 1 - Grass Sintético"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.name ? 'border-red-300' : 'border-gray-200'}`} />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deporte</label>
                                    <select {...register('sport')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                                        {SPORTS.map((s) => <option key={s} value={s}>{SPORT_LABELS[s]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Superficie</label>
                                    <select {...register('surface')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                                        {SURFACES.map((s) => <option key={s} value={s}>{SURFACE_LABELS[s]}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capacidad (jugadores)</label>
                                    <input type="number" {...register('capacity_players')} min={2} max={30}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div className="flex flex-col justify-end pb-0.5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" {...register('is_indoor')} className="w-4 h-4 rounded accent-emerald-600" />
                                        <span className="text-sm font-semibold text-gray-700">Cancha techada</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting || saveMutation.isPending}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                                    {saveMutation.isPending ? 'Guardando...' : (editField ? 'Guardar cambios' : 'Crear cancha')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PartnerLayout>
    );
}
