import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { success, notFound, badRequest, serverError } from '@/lib/api-helpers';
import { enqueueCarouselJob } from '@/lib/queue';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/v1/carousels/:id/generate
export async function POST(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        const { data: carousel, error: fetchError } = await supabase
            .from('carousels')
            .select('id, status')
            .eq('id', id)
            .single();

        if (fetchError || !carousel) return notFound('Carousel');
        if (!['approved', 'generated', 'draft', 'draft_with_copy'].includes(carousel.status)) {
            return badRequest(`Cannot generate for carousel with status "${carousel.status}".`);
        }

        // Update to generating
        await supabase
            .from('carousels')
            .update({ status: 'generating' })
            .eq('id', id);

        try {
            // Enqueue job
            const job = await enqueueCarouselJob('orchestrate', { carouselId: id });
            return success({ jobId: job.id, carouselId: id });
        } catch (queueError) {
            console.error('[Generate] Failed to enqueue job:', queueError);
            // Revert status to approved so user can try again
            await supabase
                .from('carousels')
                .update({ status: 'approved' })
                .eq('id', id);

            return serverError('Falha ao enfileirar processo de geração. O Redis está rodando?');
        }
    } catch (err) {
        return serverError(String(err));
    }
}
