import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { success, created, badRequest, serverError } from '@/lib/api-helpers';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/v1/projects/:id/carousels
export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('carousels')
            .select('*, slides(id, position, headline, preview_url)')
            .eq('project_id', id)
            .order('created_at', { ascending: false });

        if (error) return serverError(error.message);
        return success(data);
    } catch (err) {
        return serverError(String(err));
    }
}

// POST /api/v1/projects/:id/carousels
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();
        const body = await request.json();

        if (!body.title) return badRequest('title is required');

        // Create carousel
        const { data: carousel, error: carouselError } = await supabase
            .from('carousels')
            .insert({
                project_id: id,
                title: body.title,
                style_preset: body.style_preset || 'modern_clean',
            })
            .select()
            .single();

        if (carouselError || !carousel) return serverError(carouselError?.message || 'Failed to create carousel');

        // Create slides (default 5)
        const slidesData = body.slides?.length
            ? body.slides.map((s: Record<string, unknown>, i: number) => ({
                carousel_id: carousel.id,
                position: i + 1,
                headline: s.headline || `Slide ${i + 1}`,
                subheadline: s.subheadline || null,
                bullets: s.bullets || [],
                cta_text: s.cta_text || null,
                cta_url: s.cta_url || null,
            }))
            : Array.from({ length: 5 }, (_, i) => ({
                carousel_id: carousel.id,
                position: i + 1,
                headline: `Slide ${i + 1}`,
                subheadline: null,
                bullets: [],
                cta_text: null,
                cta_url: null,
            }));

        const { data: slides, error: slidesError } = await supabase
            .from('slides')
            .insert(slidesData)
            .select();

        if (slidesError) return serverError(slidesError.message);

        return created({ ...carousel, slides });
    } catch (err) {
        return serverError(String(err));
    }
}
