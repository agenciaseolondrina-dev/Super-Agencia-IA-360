import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { success, notFound, badRequest, serverError } from '@/lib/api-helpers';
import { enqueueCarouselJob } from '@/lib/queue';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/v1/carousels/:id/approve
export async function POST(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        // Check current status
        const { data: carousel, error: fetchError } = await supabase
            .from('carousels')
            .select('id, status')
            .eq('id', id)
            .single();

        if (fetchError || !carousel) return notFound('Carousel');
        if (!['draft', 'draft_with_copy'].includes(carousel.status)) {
            return badRequest(`Cannot approve carousel with status "${carousel.status}". Must be "draft" or "draft_with_copy".`);
        }

        // Update status to approved
        const { data, error } = await supabase
            .from('carousels')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return serverError(error.message);

        try {
            // Enqueue the orchestrator job
            const job = await enqueueCarouselJob('orchestrate', { carouselId: id });

            // Create job record
            await supabase.from('jobs').insert({
                carousel_id: id,
                type: 'generate_layout',
                status: 'queued',
                payload: { bullmq_job_id: job.id },
            });

            return success(data);
        } catch (queueError) {
            console.error('[Approve] Failed to enqueue job:', queueError);
            // Revert status to draft_with_copy (or draft)
            await supabase
                .from('carousels')
                .update({ status: 'draft_with_copy' })
                .eq('id', id);

            return serverError('Carrossel aprovado no banco, mas falha ao iniciar processamento. O Redis está rodando?');
        }
    } catch (err) {
        return serverError(String(err));
    }
}
