import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HERO = 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1920&q=90';

const SPORTS = [
    { value: 'futbol5',  label: 'Fútbol 5',  emoji: '⚽' },
    { value: 'futbol7',  label: 'Fútbol 7',  emoji: '⚽' },
    { value: 'futbol11', label: 'Fútbol 11', emoji: '⚽' },
    { value: 'padel',    label: 'Pádel',     emoji: '🎾' },
    { value: 'basket',   label: 'Basket',    emoji: '🏀' },
    { value: 'tenis',    label: 'Tenis',     emoji: '🎾' },
];

const HOW = [
    {
        step: '01',
        title: 'Busca tu cancha',
        desc: 'Filtra por deporte, fecha y horario. Ve la disponibilidad en tiempo real de más de 50 complejos en Lima.',
        color: 'bg-emerald-50 text-emerald-600',
    },
    {
        step: '02',
        title: 'Elige tus horas',
        desc: 'Selecciona uno o varios horarios seguidos. Máximo 4 horas por reserva. El precio se calcula al instante.',
        color: 'bg-blue-50 text-blue-600',
    },
    {
        step: '03',
        title: 'Paga el anticipo',
        desc: 'Reserva con un anticipo digital seguro. El saldo restante lo pagas directamente en la cancha.',
        color: 'bg-violet-50 text-violet-600',
    },
];

export default function HomePage() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0]!;
    const [sport, setSport] = useState('futbol5');
    const [date,  setDate]  = useState(today);

    const go = () => navigate(`/venues?sport=${sport}&date=${date}`);

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ════════════════════════════════════════════
                HERO — desktop
            ════════════════════════════════════════════ */}
            <section className="relative hidden md:flex items-center justify-center overflow-hidden" style={{ height: '92vh', minHeight: 560, maxHeight: 720 }}>
                {/* Foto de fondo */}
                <img
                    src={HERO}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Overlay degradado */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

                {/* Contenido centrado */}
                <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-4xl mx-auto">
                    <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full border border-white/20 mb-6">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Lima, Perú · Más de 50 complejos
                    </span>

                    <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-4">
                        Tu cancha,<br />
                        <span className="text-emerald-400">cuando quieras.</span>
                    </h1>
                    <p className="text-white/70 text-lg lg:text-xl max-w-xl mb-10">
                        Reserva en segundos. Sin llamadas, sin esperas. Paga el anticipo y listo.
                    </p>

                    {/* ── PÍLDORA DE BÚSQUEDA GIGANTE ── */}
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-2 flex items-stretch gap-0">

                        {/* Deporte */}
                        <div className="flex-1 flex flex-col justify-center px-5 py-3 border-r border-slate-100 cursor-pointer group">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deporte</span>
                            <select
                                value={sport}
                                onChange={e => setSport(e.target.value)}
                                className="text-base font-bold text-slate-900 bg-transparent border-none outline-none cursor-pointer appearance-none w-full"
                            >
                                {SPORTS.map(s => (
                                    <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha */}
                        <div className="flex-1 flex flex-col justify-center px-5 py-3 cursor-pointer">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</span>
                            <input
                                type="date"
                                value={date}
                                min={today}
                                onChange={e => setDate(e.target.value)}
                                className="text-base font-bold text-slate-900 bg-transparent border-none outline-none cursor-pointer w-full"
                            />
                        </div>

                        {/* Botón buscar */}
                        <button
                            type="button"
                            onClick={go}
                            className="flex items-center gap-3 px-7 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold rounded-xl transition-all text-base whitespace-nowrap shadow-lg shadow-emerald-200 ml-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
                            </svg>
                            Buscar canchas
                        </button>
                    </div>

                    {/* Stats rápidas bajo el buscador */}
                    <div className="flex items-center gap-6 mt-6 text-white/60 text-sm">
                        {['50+ complejos', 'Reserva en 1 min', 'Pago 100% seguro'].map(s => (
                            <span key={s} className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {s}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 text-xs">
                    <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </section>

            {/* ════════════════════════════════════════════
                BUSCADOR MOBILE — compacto y sticky
            ════════════════════════════════════════════ */}
            <section className="md:hidden bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm">
                {/* Header mobile */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <button
                        type="button"
                        onClick={go}
                        className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-left hover:border-emerald-300 transition-colors"
                    >
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 leading-tight">Buscar canchas</p>
                            <p className="text-xs text-slate-400">Lima · Hoy · {SPORTS.find(s => s.value === sport)?.label}</p>
                        </div>
                    </button>
                </div>

                {/* Chips de deporte */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
                    {SPORTS.map(s => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setSport(s.value)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                sport === s.value
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <span aria-hidden="true">{s.emoji}</span>
                            {s.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════════
                CUERPO — chips de deporte (desktop) + stats + cómo funciona
            ════════════════════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">

                {/* Chips de deporte — solo desktop, bajo el hero */}
                <div className="hidden md:flex items-center justify-center gap-3 mb-12 flex-wrap">
                    {SPORTS.map(s => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => { setSport(s.value); go(); }}
                            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-0.5 ${
                                sport === s.value
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-md'
                            }`}
                        >
                            <span className="text-3xl" aria-hidden="true">{s.emoji}</span>
                            <span className="text-sm font-bold">{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* CTA mobile: fecha + botón */}
                <div className="md:hidden mb-10 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            min={today}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={go}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold rounded-2xl transition-all text-base shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
                        </svg>
                        Ver canchas disponibles
                    </button>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-3 md:gap-6 mb-12 md:mb-16">
                    {[
                        { value: '50+',    label: 'Complejos',          sub: 'en Lima Metropolitana' },
                        { value: '< 1min', label: 'Para reservar',       sub: 'desde cualquier dispositivo' },
                        { value: '100%',   label: 'Pago seguro',         sub: 'anticipo digital garantizado' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-0.5">{stat.value}</p>
                            <p className="text-sm font-bold text-slate-700">{stat.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5 hidden md:block">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Cómo funciona */}
                <section id="como-funciona">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Así de fácil</h2>
                        <p className="text-slate-500 text-base md:text-lg">Reserva tu cancha en menos de un minuto</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {HOW.map(item => (
                            <div key={item.step} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mb-4 ${item.color}`}>
                                    {item.step}
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Espacio para bottom nav mobile */}
            <div className="h-[60px] md:hidden" aria-hidden="true" />
        </div>
    );
}
