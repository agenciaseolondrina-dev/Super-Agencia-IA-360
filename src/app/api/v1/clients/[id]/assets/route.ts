import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { success, created, badRequest, serverError } from '@/lib/api-helpers';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/v1/clients/:id/assets
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        let query = supabase.from('assets').select('*').eq('client_id', id);
        if (type) query = query.eq('type', type);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return serverError(error.message);

        return success(data);
    } catch (err) {
        return serverError(String(err));
    }
}

// POST /api/v1/clients/:id/assets
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();
        const formData = await request.formData();

        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string | null;

        if (!file) return badRequest('file is required');
        if (!type) return badRequest('type is required (logo, icon, pattern, photo)');

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split('.').pop() || 'png';
        const storagePath = `${id}/${type}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) return serverError(uploadError.message);

        const { data: urlData } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(storagePath);

        const { data, error } = await supabase
            .from('assets')
            .insert({
                client_id: id,
                type,
                filename: file.name,
                storage_path: storagePath,
                storage_url: urlData.publicUrl,
                mime_type: file.type,
                size_bytes: buffer.length,
            })
            .select()
            .single();

        if (error) return serverError(error.message);
        return created(data);
    } catch (err) {
        return serverError(String(err));
    }
}
