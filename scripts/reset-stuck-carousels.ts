import { createServiceClient } from '../src/lib/supabase/server';

/**
 * Script to reset carousels stuck in 'generating' status back to 'approved'
 * or 'draft_with_copy' so they can be retried once Redis is running.
 */
async function resetStuckCarousels() {
    const supabase = createServiceClient();

    console.log('🔍 Searching for stuck carousels...');

    const { data, error } = await supabase
        .from('carousels')
        .select('id, title, status')
        .eq('status', 'generating');

    if (error) {
        console.error('Error fetching carousels:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('✅ No stuck carousels found.');
        return;
    }

    console.log(`Found ${data.length} stuck carousels. Resetting to 'approved'...`);

    for (const carousel of data) {
        console.log(`- Resetting: ${carousel.title} (${carousel.id})`);

        const { error: updateError } = await supabase
            .from('carousels')
            .update({ status: 'approved' })
            .eq('id', carousel.id);

        if (updateError) {
            console.error(`  Failed to reset ${carousel.id}:`, updateError.message);
        } else {
            console.log(`  Done.`);
        }
    }

    console.log('✨ All stuck carousels have been reset.');
}

resetStuckCarousels().catch(console.error);
