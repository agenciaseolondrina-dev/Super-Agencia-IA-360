import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { success, created, badRequest, serverError } from '@/lib/api-helpers';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/v1/clients/:id/projects
export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', id)
            .order('created_at', { ascending: false });

        if (error) return serverError(error.message);
        return success(data);
    } catch (err) {
        return serverError(String(err));
    }
}

// POST /api/v1/clients/:id/projects
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();
        const body = await request.json();

        if (!body.name) return badRequest('name is required');

        const { data, error } = await supabase
            .from('projects')
            .insert({
                client_id: id,
                name: body.name,
                description: body.description || null,
            })
            .select()
            .single();

        if (error) return serverError(error.message);
        return created(data);
    } catch (err) {
        return serverError(String(err));
    }
}
