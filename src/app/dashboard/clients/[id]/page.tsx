'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Upload, Palette } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    brand_colors: { primary?: string; secondary?: string; accent?: string };
    brand_fonts: { heading?: string; body?: string };
    instagram_handle: string | null;
}

interface Carousel {
    id: string;
    title: string;
    status: string;
    created_at: string;
    slides?: { id: string; position: number; headline: string; preview_url: string | null }[];
}

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [client, setClient] = useState<Client | null>(null);
    const [carousels, setCarousels] = useState<Carousel[]>([]);
    const [activeTab, setActiveTab] = useState<'brand' | 'carousels'>('carousels');
    const [showNewCarousel, setShowNewCarousel] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchClient(), fetchCarousels()]).finally(() => setLoading(false));
    }, [id]);

    async function fetchClient() {
        const res = await fetch(`/api/v1/clients/${id}`);
        setClient(await res.json());
    }

    async function fetchCarousels() {
        // We need the projects first, then get carousels per project
        const projRes = await fetch(`/api/v1/clients/${id}/projects`);
        const projects = await projRes.json();

        const allCarousels: Carousel[] = [];
        for (const project of projects) {
            const carRes = await fetch(`/api/v1/projects/${project.id}/carousels`);
            const cars = await carRes.json();
            allCarousels.push(...cars);
        }
        setCarousels(allCarousels);
    }

    if (loading) return <div className="empty-state"><p>Carregando...</p></div>;
    if (!client) return <div className="empty-state"><p>Cliente não encontrado</p></div>;

    const statusLabels: Record<string, string> = {
        draft: 'Rascunho',
        approved: 'Aprovado',
        generating: 'Gerando...',
        generated: 'Gerado',
        hires_ready: 'Hi-Res Pronto',
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <Link href="/dashboard">Clientes</Link>
                        <span>/</span>
                        <span>{client.name}</span>
                    </div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        {client.name}
                    </h1>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNewCarousel(true)}>
                    <Plus size={18} /> Novo Carrossel
                </button>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'carousels' ? 'active' : ''}`} onClick={() => setActiveTab('carousels')}>
                    Carrosséis
                </button>
                <button className={`tab ${activeTab === 'brand' ? 'active' : ''}`} onClick={() => setActiveTab('brand')}>
                    <Palette size={16} style={{ marginRight: 6 }} /> Brand Kit
                </button>
            </div>

            {activeTab === 'brand' && (
                <div className="card" style={{ maxWidth: 600 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Identidade Visual</h3>

                    <div className="form-group">
                        <label className="form-label">Logo</label>
                        {client.logo_url ? (
                            <img src={client.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'contain', background: 'var(--bg-tertiary)', padding: 8 }} />
                        ) : (
                            <button className="btn btn-secondary btn-sm"><Upload size={14} /> Enviar Logo</button>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cores</label>
                        <div className="color-row">
                            {client.brand_colors?.primary && <div className="color-swatch" style={{ background: client.brand_colors.primary }} title="Primária" />}
                            {client.brand_colors?.secondary && <div className="color-swatch" style={{ background: client.brand_colors.secondary }} title="Secundária" />}
                            {client.brand_colors?.accent && <div className="color-swatch" style={{ background: client.brand_colors.accent }} title="Accent" />}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fontes</label>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            Heading: <strong>{client.brand_fonts?.heading || 'Inter'}</strong> |
                            Body: <strong>{client.brand_fonts?.body || 'Inter'}</strong>
                        </p>
                    </div>

                    {client.instagram_handle && (
                        <div className="form-group">
                            <label className="form-label">Instagram</label>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{client.instagram_handle}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'carousels' && (
                <>
                    {carousels.length === 0 ? (
                        <div className="empty-state">
                            <h3>Nenhum carrossel ainda</h3>
                            <p>Crie o primeiro carrossel para este cliente.</p>
                        </div>
                    ) : (
                        <div className="card-grid">
                            {carousels.map((carousel) => (
                                <Link key={carousel.id} href={`/dashboard/carousels/${carousel.id}/edit`} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{ cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{carousel.title}</h3>
                                            <span className={`badge badge-${carousel.status}`}>
                                                {carousel.status === 'generating' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor', marginRight: 4 }} />}
                                                {statusLabels[carousel.status] || carousel.status}
                                            </span>
                                        </div>
                                        {carousel.slides && carousel.slides.length > 0 && (
                                            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                                {carousel.slides.slice(0, 5).map(slide => (
                                                    <div key={slide.id} style={{
                                                        width: 44, height: 55, borderRadius: 4,
                                                        background: slide.preview_url ? `url(${slide.preview_url}) center/cover` : 'var(--bg-tertiary)',
                                                        fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                                                    }}>
                                                        {!slide.preview_url && slide.position}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                                            {carousel.slides?.length || 0} slides
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showNewCarousel && (
                <CreateCarouselModal
                    clientId={id}
                    onClose={() => setShowNewCarousel(false)}
                    onCreated={() => { setShowNewCarousel(false); fetchCarousels(); }}
                />
            )}
        </div>
    );
}

function CreateCarouselModal({ clientId, onClose, onCreated }: { clientId: string; onClose: () => void; onCreated: () => void }) {
    const [title, setTitle] = useState('');
    const [projectName, setProjectName] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            // Create project first (or use existing)
            const projRes = await fetch(`/api/v1/clients/${clientId}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: projectName || title }),
            });
            const project = await projRes.json();

            // Create carousel with 5 default slides
            await fetch(`/api/v1/projects/${project.id}/carousels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });

            onCreated();
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Novo Carrossel</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Projeto</label>
                        <input className="form-input" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Nome do projeto (opcional)" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Título do Carrossel *</label>
                        <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: 5 Dicas de Produtividade" />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || !title}>
                            {saving ? 'Criando...' : 'Criar Carrossel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
