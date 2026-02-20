'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, LayoutGrid, Plus } from 'lucide-react';

interface Carousel {
    id: string;
    title: string;
    status: string;
    style_preset: string | null;
    created_at: string;
    project_id: string;
}

export default function CarouselsPage() {
    const [carousels, setCarousels] = useState<Carousel[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCarousels();
    }, []);

    async function fetchCarousels() {
        setLoading(true);
        try {
            // Fetch all clients, then all projects, then all carousels
            const clientsRes = await fetch('/api/v1/clients');
            const clients = await clientsRes.json();

            const allCarousels: Carousel[] = [];
            for (const client of clients) {
                const projRes = await fetch(`/api/v1/clients/${client.id}/projects`);
                const projects = await projRes.json();
                for (const project of projects) {
                    const carRes = await fetch(`/api/v1/projects/${project.id}/carousels`);
                    const cars = await carRes.json();
                    allCarousels.push(...cars);
                }
            }
            setCarousels(allCarousels);
        } catch (e) {
            console.error('Error fetching carousels:', e);
        } finally {
            setLoading(false);
        }
    }

    const statusLabels: Record<string, string> = {
        draft: 'Rascunho',
        approved: 'Aprovado',
        generating: 'Gerando...',
        generated: 'Gerado',
        hires_ready: 'Hi-Res Pronto',
    };

    const filtered = carousels.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Carrosséis</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        Todos os carrosséis de todos os clientes
                    </p>
                </div>
                <Link href="/dashboard/carousels/new" className="btn btn-primary">
                    <Plus size={18} />
                    Novo Carrossel
                </Link>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: 11, color: 'var(--text-muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Buscar carrossel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 44 }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="empty-state">
                    <p>Carregando...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <LayoutGrid size={64} />
                    <h3>Nenhum carrossel encontrado</h3>
                    <p>Crie um cliente e depois um carrossel para ele.</p>
                </div>
            ) : (
                <div className="card-grid">
                    {filtered.map((carousel) => (
                        <Link key={carousel.id} href={`/dashboard/carousels/${carousel.id}/edit`} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{carousel.title}</h3>
                                    <span className={`badge badge-${carousel.status}`}>
                                        {statusLabels[carousel.status] || carousel.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                    Estilo: {carousel.style_preset || 'modern_clean'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Criado em: {new Date(carousel.created_at).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
