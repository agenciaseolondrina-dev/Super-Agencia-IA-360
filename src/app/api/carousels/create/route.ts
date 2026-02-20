import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { created, badRequest, serverError } from '@/lib/api-helpers';
import { generateCarouselCopy } from '@/lib/ai/copy-generator';

// POST /api/carousels/create
export async function POST(request: NextRequest) {
    try {
        const supabase = createServiceClient();
        const body = await request.json();

        // Validate required fields
        const { slidesCount, niche, theme, objective, tone, cta } = body;
        if (!slidesCount || slidesCount < 1 || slidesCount > 10) return badRequest('slidesCount must be 1–10');
        if (!niche) return badRequest('niche is required');
        if (!theme) return badRequest('theme is required');
        if (!objective) return badRequest('objective is required');
        if (!tone) return badRequest('tone is required');
        if (!cta) return badRequest('cta is required');

        // 1. Create or find a default project for carousels without a client
        let projectId = body.projectId;
        if (!projectId) {
            // Find or create a default "Geral" client
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('slug', 'geral')
                .single();

            let clientId: string;
            if (existingClient) {
                clientId = existingClient.id;
            } else {
                const { data: newClient, error: clientError } = await supabase
                    .from('clients')
                    .insert({
                        name: 'Geral',
                        slug: 'geral',
                        brand_colors: { primary: '#6c5ce7', secondary: '#1a1a2e', accent: '#e94560' },
                    })
                    .select('id')
                    .single();
                if (clientError || !newClient) return serverError('Failed to create default client');
                clientId = newClient.id;
            }

            // Find or create default project
            const { data: existingProject } = await supabase
                .from('projects')
                .select('id')
                .eq('client_id', clientId)
                .eq('name', 'Carrosséis Rápidos')
                .single();

            if (existingProject) {
                projectId = existingProject.id;
            } else {
                const { data: newProject, error: projError } = await supabase
                    .from('projects')
                    .insert({
                        client_id: clientId,
                        name: 'Carrosséis Rápidos',
                        description: 'Carrosséis criados via gerador automático',
                    })
                    .select('id')
                    .single();
                if (projError || !newProject) return serverError('Failed to create default project');
                projectId = newProject.id;
            }
        }

        // 2. Create carousel record
        const { data: carousel, error: carouselError } = await supabase
            .from('carousels')
            .insert({
                project_id: projectId,
                title: theme,
                status: 'draft_with_copy',
                niche,
                theme,
                objective,
                tone,
                cta_final: cta,
                slides_count: slidesCount,
                style_preset: body.stylePreset || 'modern_clean',
            })
            .select()
            .single();

        if (carouselError || !carousel) {
            return serverError(carouselError?.message || 'Failed to create carousel');
        }

        // 3. Generate copy via AI
        console.log(`[Create Carousel] Generating copy for ${slidesCount} slides...`);
        const copyResult = await generateCarouselCopy({
            slidesCount,
            niche,
            theme,
            objective,
            tone,
            cta,
        });

        // 4. Insert slides with AI-generated copy
        const slidesData = copyResult.slides.map((slide) => ({
            carousel_id: carousel.id,
            position: slide.idx,
            headline: slide.headline,
            subheadline: slide.subheadline || null,
            bullets: slide.bullets || [],
            cta_text: slide.cta || null,
        }));

        const { data: slides, error: slidesError } = await supabase
            .from('slides')
            .insert(slidesData)
            .select();

        if (slidesError) {
            // Cleanup carousel if slides fail
            await supabase.from('carousels').delete().eq('id', carousel.id);
            return serverError(slidesError.message);
        }

        console.log(`[Create Carousel] ✅ Carousel ${carousel.id} created with ${slides?.length} AI-filled slides`);

        // 5. Return carousel with slides
        return created({
            ...carousel,
            slides: slides?.sort((a: { position: number }, b: { position: number }) => a.position - b.position),
        });
    } catch (err) {
        console.error('[Create Carousel] Error:', err);
        return serverError(String(err));
    }
}
