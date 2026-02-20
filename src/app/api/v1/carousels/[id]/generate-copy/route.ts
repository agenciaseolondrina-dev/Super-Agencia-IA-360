import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { success, notFound, badRequest, serverError } from '@/lib/api-helpers';
import { generateCarouselCopy } from '@/lib/ai/copy-generator';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/v1/carousels/:id/generate-copy
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        // 1. Fetch carousel with its data
        const { data: carousel, error: fetchError } = await supabase
            .from('carousels')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !carousel) return notFound('Carousel');
        if (!['draft', 'draft_with_copy'].includes(carousel.status)) {
            return badRequest(`Cannot generate copy for carousel with status "${carousel.status}".`);
        }

        // 2. Get optional overrides from request body
        let overrides: Record<string, string> = {};
        try {
            overrides = await request.json();
        } catch {
            // Body is optional
        }

        const niche = overrides.niche || carousel.niche || 'Geral';
        const theme = overrides.theme || carousel.theme || carousel.title || 'Carrossel';
        const objective = overrides.objective || carousel.objective || 'Engajamento';
        const tone = overrides.tone || carousel.tone || 'Profissional';
        const cta = overrides.cta || carousel.cta_final || 'Siga para mais dicas';

        // 3. Get existing slides count
        const { data: existingSlides } = await supabase
            .from('slides')
            .select('id, position')
            .eq('carousel_id', id)
            .order('position');

        const slidesCount = existingSlides?.length || carousel.slides_count || 5;

        // 4. Generate copy via AI
        console.log(`[Generate Copy] Calling AI for carousel ${id} (${slidesCount} slides)...`);
        const copyResult = await generateCarouselCopy({
            slidesCount,
            niche,
            theme,
            objective,
            tone,
            cta,
        });

        // 5. Update existing slides or insert new ones
        if (existingSlides && existingSlides.length > 0) {
            // Update existing slides with AI copy
            for (const aiSlide of copyResult.slides) {
                const existingSlide = existingSlides.find(s => s.position === aiSlide.idx);
                if (existingSlide) {
                    await supabase
                        .from('slides')
                        .update({
                            headline: aiSlide.headline,
                            subheadline: aiSlide.subheadline || null,
                            bullets: aiSlide.bullets || [],
                            cta_text: aiSlide.cta || null,
                        })
                        .eq('id', existingSlide.id);
                }
            }
        } else {
            // Insert new slides
            const slidesData = copyResult.slides.map((slide) => ({
                carousel_id: id,
                position: slide.idx,
                headline: slide.headline,
                subheadline: slide.subheadline || null,
                bullets: slide.bullets || [],
                cta_text: slide.cta || null,
            }));

            await supabase.from('slides').insert(slidesData);
        }

        // 6. Update carousel status and metadata
        await supabase
            .from('carousels')
            .update({
                status: 'draft_with_copy',
                niche,
                theme,
                objective,
                tone,
                cta_final: cta,
                slides_count: slidesCount,
            })
            .eq('id', id);

        // 7. Return updated carousel with slides
        const { data: updatedCarousel } = await supabase
            .from('carousels')
            .select('*, slides(*)')
            .eq('id', id)
            .single();

        console.log(`[Generate Copy] ✅ AI copy applied to carousel ${id}`);
        return success(updatedCarousel);
    } catch (err) {
        console.error('[Generate Copy] Error:', err);
        return serverError(String(err));
    }
}
