'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2 } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    brand_colors: { primary?: string; secondary?: string; accent?: string };
    instagram_handle: string | null;
    created_at: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    async function fetchClients() {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/clients');
            const data = await res.json();
            setClients(data);
        } catch (e) {
            console.error('Error fetching clients:', e);
        } finally {
            setLoading(false);
        }
    }

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Clientes</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        Gerencie seus clientes e projetos de carrossel
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Novo Cliente
                </button>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: 11, color: 'var(--text-muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Buscar cliente..."
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
                    <Building2 size={64} />
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Crie seu primeiro cliente para começar a gerar carrosséis.</p>
                </div>
            ) : (
                <div className="card-grid">
                    {filtered.map((client) => (
                        <Link key={client.id} href={`/dashboard/clients/${client.id}`} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div className="avatar" style={{
                                        background: client.brand_colors?.primary
                                            ? `linear-gradient(135deg, ${client.brand_colors.primary}, ${client.brand_colors.accent || client.brand_colors.primary})`
                                            : undefined,
                                    }}>
                                        {client.logo_url
                                            ? <img src={client.logo_url} alt={client.name} />
                                            : client.name.charAt(0).toUpperCase()
                                        }
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{client.name}</div>
                                        {client.instagram_handle && (
                                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                {client.instagram_handle}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {client.brand_colors?.primary && (
                                    <div className="color-row" style={{ marginTop: 14 }}>
                                        <div className="color-swatch" style={{ background: client.brand_colors.primary }} />
                                        {client.brand_colors.secondary && (
                                            <div className="color-swatch" style={{ background: client.brand_colors.secondary }} />
                                        )}
                                        {client.brand_colors.accent && (
                                            <div className="color-swatch" style={{ background: client.brand_colors.accent }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {showModal && (
                <CreateClientModal
                    onClose={() => setShowModal(false)}
                    onCreated={() => { setShowModal(false); fetchClients(); }}
                />
            )}
        </div>
    );
}

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [instagram, setInstagram] = useState('');
    const [primary, setPrimary] = useState('#6c5ce7');
    const [secondary, setSecondary] = useState('#1a1a2e');
    const [accent, setAccent] = useState('#e94560');
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch('/api/v1/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    instagram_handle: instagram || null,
                    brand_colors: { primary, secondary, accent },
                }),
            });
            onCreated();
        } catch (e) {
            console.error('Error creating client:', e);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Novo Cliente</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nome *</label>
                        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Café Premium" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Instagram</label>
                        <input className="form-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cores da marca</label>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                Primária <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                Secundária <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                Accent <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || !name}>
                            {saving ? 'Salvando...' : 'Criar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
