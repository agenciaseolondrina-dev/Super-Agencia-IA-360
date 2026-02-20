'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewCarouselPage() {
    const router = useRouter();
    const [slidesCount, setSlidesCount] = useState(5);
    const [niche, setNiche] = useState('');
    const [theme, setTheme] = useState('');
    const [objective, setObjective] = useState('');
    const [tone, setTone] = useState('Profissional');
    const [cta, setCta] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/carousels/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slidesCount,
                    niche,
                    theme,
                    objective,
                    tone,
                    cta,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Erro ao criar carrossel');
                return;
            }

            const data = await res.json();
            router.push(`/dashboard/carousels/${data.id}/edit`);
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const toneOptions = [
        'Profissional', 'Casual', 'Inspirador', 'Educativo',
        'Divertido', 'Urgente', 'Luxuoso', 'Técnico',
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <Link href="/dashboard/clients">Clientes</Link>
                        <span>/</span>
                        <Link href="/dashboard/carousels">Carrosséis</Link>
                        <span>/</span>
                        <span>Novo</span>
                    </div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/dashboard/carousels" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        Novo Carrossel
                    </h1>
                </div>
            </div>

            {/* Loading overlay */}
            {loading && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, flexDirection: 'column', gap: 20,
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 16,
                        background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }}>
                        <Sparkles size={36} color="white" />
                    </div>
                    <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
                        ✨ A IA está criando seu carrossel...
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                        Gerando copy para {slidesCount} lâminas
                    </div>
                    <Loader2 size={24} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            )}

            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div className="card">
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                            <Sparkles size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
                            Crie seu Carrossel com IA
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            Informe os dados abaixo e a IA vai gerar automaticamente a copy de cada lâmina.
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px', marginBottom: 20, borderRadius: 8,
                            background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)',
                            color: '#e94560', fontSize: 14,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Slides count */}
                        <div className="form-group">
                            <label className="form-label">
                                Quantidade de Lâminas: <strong>{slidesCount}</strong>
                            </label>
                            <input
                                type="range"
                                min={3}
                                max={10}
                                value={slidesCount}
                                onChange={(e) => setSlidesCount(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                <span>3</span>
                                <span>10</span>
                            </div>
                        </div>

                        {/* Niche */}
                        <div className="form-group">
                            <label className="form-label">Nicho *</label>
                            <input
                                className="form-input"
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                placeholder="Ex: Marketing Digital, Fitness, Finanças..."
                                required
                            />
                        </div>

                        {/* Theme */}
                        <div className="form-group">
                            <label className="form-label">Tema do Carrossel *</label>
                            <input
                                className="form-input"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                placeholder="Ex: 5 Erros que Matam seu Engajamento"
                                required
                            />
                        </div>

                        {/* Objective */}
                        <div className="form-group">
                            <label className="form-label">Objetivo *</label>
                            <input
                                className="form-input"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Ex: Gerar leads, Aumentar engajamento, Educar..."
                                required
                            />
                        </div>

                        {/* Tone */}
                        <div className="form-group">
                            <label className="form-label">Tom *</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {toneOptions.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTone(t)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: 20,
                                            border: tone === t ? '2px solid var(--accent)' : '1px solid var(--border)',
                                            background: tone === t ? 'rgba(108,92,231,0.1)' : 'var(--bg-secondary)',
                                            color: tone === t ? 'var(--accent)' : 'var(--text-secondary)',
                                            fontSize: 13,
                                            fontWeight: tone === t ? 600 : 400,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="form-group">
                            <label className="form-label">CTA Final *</label>
                            <input
                                className="form-input"
                                value={cta}
                                onChange={(e) => setCta(e.target.value)}
                                placeholder="Ex: Siga para mais dicas, Baixe nosso e-book..."
                                required
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !niche || !theme || !objective || !cta}
                            style={{
                                width: '100%', padding: '14px', fontSize: 16, fontWeight: 600,
                                marginTop: 8, gap: 10,
                            }}
                        >
                            <Sparkles size={20} />
                            {loading ? 'Gerando com IA...' : 'Criar Carrossel com IA'}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
