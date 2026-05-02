import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SPORTS = [
    { value: 'futbol5',  label: 'Fútbol 5',  icon: '⚽' },
    { value: 'futbol7',  label: 'Fútbol 7',  icon: '⚽' },
    { value: 'padel',    label: 'Pádel',     icon: '🎾' },
    { value: 'basket',   label: 'Basket',    icon: '🏀' },
    { value: 'tenis',    label: 'Tenis',     icon: '🎾' },
];

const HERO = 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1600&q=85';

export default function HomePage() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0] ?? '';
    const [sport, setSport] = useState('futbol5');
    const [date, setDate]   = useState(today);

    const go = () => navigate(`/venues?sport=${sport}&date=${date}`);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* HERO desktop */}
            <section className="relative hidden md:block">
                <div className="h-[520px] overflow-hidden">
                    <img src={HERO} alt="Cancha de fútbol iluminada" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <span className="bg-emerald-600/90 text-white text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
                        Lima · Perú
                    </span>
                    <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
                        Reserva tu cancha<br />en segundos
                    </h1>
                    <p className="text-white/80 text-lg mb-8 max-w-md">
                        Más de 50 complejos deportivos en Lima listos para tu partido.
                    </p>
                    {/* Pill buscador estilo Airbnb */}
                    <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-stretch w-full max-w-2xl">
                        <div className="flex-1 px-5 py-2.5 border-r border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 mb-0.5">Deporte</p>
                            <select value={sport} onChange={(e) => setSport(e.target.value)}
                                className="w-full text-sm font-semibold text-gray-900 bg-transparent focus:outline-none cursor-pointer">
                                {SPORTS.map((s) => (
                                    <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 px-5 py-2.5">
                            <p className="text-xs font-semibold text-gray-500 mb-0.5">Fecha</p>
                            <input type="date" value={date} min={today}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full text-sm font-semibold text-gray-900 bg-transparent focus:outline-none cursor-pointer" />
                        </div>
                        <button type="button" onClick={go}
                            className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 ml-2 shadow-lg shadow-emerald-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Buscar
                        </button>
                    </div>
                </div>
            </section>

            {/* Buscador compacto móvil */}
            <section className="md:hidden bg-white sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <div className="px-4 pt-3 pb-2">
                    <button type="button" onClick={go}
                        className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-left hover:border-emerald-300 transition-colors">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Buscar canchas</p>
                            <p className="text-xs text-gray-400">Lima · Hoy · Cualquier deporte</p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full shrink-0">
                            Ir
                        </span>
                    </button>
                </div>
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                    {SPORTS.map((s) => (
                        <button key={s.value} type="button" onClick={() => setSport(s.value)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                sport === s.value
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}>
                            {s.icon} {s.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Cuerpo */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">

                {/* Chips deporte desktop */}
                <div className="hidden md:flex items-center gap-3 mb-10">
                    {SPORTS.map((s) => (
                        <button key={s.value} type="button"
                            onClick={() => { setSport(s.value); go(); }}
                            className={`shrink-0 flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                sport === s.value
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm'
                            }`}>
                            <span className="text-3xl">{s.icon}</span>
                            <span className="text-xs font-semibold">{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
                    {[
                        { icon: '🏟', value: '50+',   label: 'Complejos en Lima' },
                        { icon: '⚡', value: '1 min',  label: 'Para reservar'    },
                        { icon: '🔒', value: 'Seguro', label: 'Pago digital'     },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm text-center">
                            <div className="text-2xl md:text-3xl mb-1">{stat.icon}</div>
                            <div className="font-bold text-gray-900 text-sm md:text-lg">{stat.value}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA fecha + botón solo móvil */}
                <div className="md:hidden mb-8 space-y-3">
                    <input type="date" value={date} min={today}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    <button type="button" onClick={go}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all text-base shadow-lg shadow-emerald-100">
                        Ver canchas disponibles
                    </button>
                </div>

                {/* Cómo funciona */}
                <section id="como-funciona">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Así de fácil</h2>
                    <p className="text-gray-500 mb-6 text-sm md:text-base">Reserva tu cancha en menos de un minuto, desde cualquier dispositivo.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { n: '1', title: 'Busca tu cancha',  desc: 'Filtra por deporte, fecha y horario cerca de ti.' },
                            { n: '2', title: 'Elige tu horario', desc: 'Ve la disponibilidad en tiempo real y elige tus horas.' },
                            { n: '3', title: 'Paga el anticipo', desc: 'Reserva con un anticipo digital. El saldo lo pagas en la cancha.' },
                        ].map((item) => (
                            <div key={item.n} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg flex items-center justify-center shrink-0">
                                    {item.n}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
