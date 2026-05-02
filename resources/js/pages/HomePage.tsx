import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';

const SPORTS = [
    { value: 'futbol5', label: '⚽ Fútbol 5' },
    { value: 'futbol7', label: '⚽ Fútbol 7' },
    { value: 'padel',   label: '🎾 Pádel' },
    { value: 'basket',  label: '🏀 Basket' },
    { value: 'tenis',   label: '🎾 Tenis' },
];

export default function HomePage() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0] ?? '';

    const [sport, setSport] = useState('futbol5');
    const [date, setDate]   = useState(today);

    function handleSearch() {
        navigate(`/venues?sport=${sport}&date=${date}`);
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pt-8 pb-24">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏟</span>
                    <span className="font-bold text-[var(--navy-deep)] text-lg">CanchasApp</span>
                </div>
            </header>

            <section className="space-y-4">
                <div>
                    <label htmlFor="sport-select" className="block text-sm font-medium text-[var(--gray-primary)] mb-1">
                        Deporte
                    </label>
                    <select
                        id="sport-select"
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="w-full rounded-lg border border-[var(--gray-border)] bg-white px-4 py-3 text-[var(--gray-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-mid)]"
                    >
                        {SPORTS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="date-input" className="block text-sm font-medium text-[var(--gray-primary)] mb-1">
                        Fecha
                    </label>
                    <input
                        id="date-input"
                        type="date"
                        value={date}
                        min={today}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-[var(--gray-border)] bg-white px-4 py-3 text-[var(--gray-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-mid)]"
                    />
                </div>

                <Button variant="primary" size="lg" fullWidth onClick={handleSearch}>
                    Buscar canchas →
                </Button>
            </section>
        </main>
    );
}
