'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle, Sparkles, Plus, Trash2, Wand2, Loader2 } from 'lucide-react';

interface Slide {
    id: string;
    carousel_id: string;
    position: number;
    headline: string;
    subheadline: string | null;
    bullets: string[];
    cta_text: string | null;
    preview_url: string | null;
}

interface Carousel {
    id: string;
    title: string;
    status: string;
    style_preset: string;
    project_id: string;
    slides: Slide[];
}

export default function CarouselEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [carousel, setCarousel] = useState<Carousel | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generatingCopy, setGeneratingCopy] = useState(false);

    useEffect(() => {
        fetchCarousel();
    }, [id]);

    async function fetchCarousel() {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/carousels/${id}`);
            const data = await res.json();
            setCarousel(data);
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setLoading(false);
        }
    }

    async function saveSlide(slide: Slide) {
        setSaving(true);
        try {
            await fetch(`/api/v1/slides/${slide.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    headline: slide.headline,
                    subheadline: slide.subheadline,
                    bullets: slide.bullets,
                    cta_text: slide.cta_text,
                }),
            });
        } catch (e) {
            console.error('Error saving:', e);
        } finally {
            setSaving(false);
        }
    }

    async function approveCarousel() {
        try {
            await fetch(`/api/v1/carousels/${id}/approve`, { method: 'POST' });
            fetchCarousel();
        } catch (e) {
            console.error('Error approving:', e);
        }
    }

    async function generatePreviews() {
        try {
            await fetch(`/api/v1/carousels/${id}/generate`, { method: 'POST' });
            fetchCarousel();
        } catch (e) {
            console.error('Error generating:', e);
        }
    }

    async function generateCopyWithAI() {
        setGeneratingCopy(true);
        try {
            const res = await fetch(`/api/v1/carousels/${id}/generate-copy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                await fetchCarousel();
                setActiveSlide(0);
            } else {
                const err = await res.json();
                console.error('Error generating copy:', err);
                alert(err.error || 'Erro ao gerar copy com IA');
            }
        } catch (e) {
            console.error('Error generating copy:', e);
            alert('Erro de conexão ao gerar copy');
        } finally {
            setGeneratingCopy(false);
        }
    }

    function updateSlideField(index: number, field: string, value: unknown) {
        if (!carousel) return;
        const updated = { ...carousel };
        const slides = [...updated.slides];
        slides[index] = { ...slides[index], [field]: value };
        updated.slides = slides;
        setCarousel(updated);
    }

    function updateBullet(slideIndex: number, bulletIndex: number, value: string) {
        if (!carousel) return;
        const bullets = [...carousel.slides[slideIndex].bullets];
        bullets[bulletIndex] = value;
        updateSlideField(slideIndex, 'bullets', bullets);
    }

    function addBullet(slideIndex: number) {
        if (!carousel) return;
        const bullets = [...carousel.slides[slideIndex].bullets, ''];
        updateSlideField(slideIndex, 'bullets', bullets);
    }

    function removeBullet(slideIndex: number, bulletIndex: number) {
        if (!carousel) return;
        const bullets = carousel.slides[slideIndex].bullets.filter((_, i) => i !== bulletIndex);
        updateSlideField(slideIndex, 'bullets', bullets);
    }

    if (loading) return <div className="empty-state"><p>Carregando...</p></div>;
    if (!carousel) return <div className="empty-state"><p>Carrossel não encontrado</p></div>;

    const currentSlide = carousel.slides[activeSlide];
    const isDraft = carousel.status === 'draft' || carousel.status === 'draft_with_copy';

    const statusLabels: Record<string, string> = {
        draft: 'Rascunho', draft_with_copy: 'Copy Gerada ✨', approved: 'Aprovado', generating: 'Gerando...', generated: 'Gerado', hires_ready: 'Hi-Res Pronto',
    };

    return (
        <div>
            {/* AI Generation Loading Overlay */}
            {generatingCopy && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, flexDirection: 'column', gap: 20,
                    backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 16,
                        background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }}>
                        <Wand2 size={36} color="white" />
                    </div>
                    <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
                        ✨ Gerando copy com IA...
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                        Preenchendo {carousel.slides.length} slides automaticamente
                    </div>
                    <Loader2 size={24} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            )}

            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <Link href="/dashboard/clients">Clientes</Link>
                        <span>/</span>
                        <Link href="/dashboard/carousels">Carrosséis</Link>
                        <span>/</span>
                        <span>Editor</span>
                    </div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/dashboard/carousels" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        {carousel.title}
                        <span className={`badge badge-${carousel.status}`}>{statusLabels[carousel.status]}</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {isDraft && (
                        <>
                            <button
                                className="btn"
                                onClick={generateCopyWithAI}
                                disabled={generatingCopy}
                                style={{
                                    background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                                    color: 'white', border: 'none',
                                }}
                            >
                                <Wand2 size={16} /> {generatingCopy ? 'Gerando...' : '✨ Gerar com IA'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => currentSlide && saveSlide(currentSlide)} disabled={saving}>
                                <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button className="btn btn-primary" onClick={approveCarousel}>
                                <CheckCircle size={16} /> Aprovar
                            </button>
                        </>
                    )}
                    {(carousel.status === 'approved' || carousel.status === 'generated' || carousel.status === 'draft_with_copy') && (
                        <button className="btn btn-primary" onClick={generatePreviews}>
                            <Sparkles size={16} /> Gerar Criativos
                        </button>
                    )}
                    {carousel.status === 'generated' && (
                        <Link href={`/dashboard/carousels/${id}/preview`} className="btn btn-secondary">
                            Ver Previews →
                        </Link>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div style={{ display: 'flex', gap: 24 }}>
                {/* Slide nav */}
                <div className="slide-nav">
                    {carousel.slides.map((slide, i) => (
                        <div
                            key={slide.id}
                            className={`slide-nav-item ${activeSlide === i ? 'active' : ''}`}
                            onClick={() => {
                                // Auto-save current slide before switching
                                if (currentSlide && isDraft) saveSlide(currentSlide);
                                setActiveSlide(i);
                            }}
                        >
                            {slide.preview_url ? (
                                <div style={{
                                    width: '100%', aspectRatio: '4/5', borderRadius: 6,
                                    background: `url(${slide.preview_url}) center/cover`,
                                    marginBottom: 4,
                                }} />
                            ) : null}
                            Slide {slide.position}
                        </div>
                    ))}
                </div>

                {/* Slide editor */}
                {currentSlide && (
                    <div className="card" style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-secondary)' }}>
                            Slide {currentSlide.position} de {carousel.slides.length}
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Headline *</label>
                            <textarea
                                className="form-textarea"
                                value={currentSlide.headline}
                                onChange={(e) => updateSlideField(activeSlide, 'headline', e.target.value)}
                                placeholder="Texto principal do slide"
                                rows={2}
                                disabled={!isDraft}
                            />
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                {currentSlide.headline.length}/60 caracteres
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Subheadline</label>
                            <input
                                className="form-input"
                                value={currentSlide.subheadline || ''}
                                onChange={(e) => updateSlideField(activeSlide, 'subheadline', e.target.value || null)}
                                placeholder="Texto de apoio (opcional)"
                                disabled={!isDraft}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Bullets</label>
                            {currentSlide.bullets.map((bullet, bi) => (
                                <div key={bi} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <input
                                        className="form-input"
                                        value={bullet}
                                        onChange={(e) => updateBullet(activeSlide, bi, e.target.value)}
                                        placeholder={`Bullet ${bi + 1}`}
                                        disabled={!isDraft}
                                    />
                                    {isDraft && (
                                        <button className="btn btn-danger btn-sm" onClick={() => removeBullet(activeSlide, bi)} type="button">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isDraft && (
                                <button className="btn btn-secondary btn-sm" onClick={() => addBullet(activeSlide)} type="button">
                                    <Plus size={14} /> Adicionar bullet
                                </button>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">CTA</label>
                            <input
                                className="form-input"
                                value={currentSlide.cta_text || ''}
                                onChange={(e) => updateSlideField(activeSlide, 'cta_text', e.target.value || null)}
                                placeholder="Ex: Saiba mais"
                                disabled={!isDraft}
                            />
                        </div>

                        {/* Live preview mini */}
                        {currentSlide.preview_url && (
                            <div className="form-group">
                                <label className="form-label">Preview</label>
                                <div style={{
                                    width: 200, aspectRatio: '4/5', borderRadius: 8, overflow: 'hidden',
                                    border: '1px solid var(--border)',
                                }}>
                                    <img src={currentSlide.preview_url} alt={`Preview slide ${currentSlide.position}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
