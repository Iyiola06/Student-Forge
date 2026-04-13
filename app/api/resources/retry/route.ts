import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId } = await request.json();
    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
    }

    const { data: resource, error } = await supabase
      .from('resources')
      .select('id,title,file_type,file_size_bytes,processing_metadata')
      .eq('id', resourceId)
      .eq('user_id', user.id)
      .single();

    if (error || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const storagePath = (resource.processing_metadata as Record<string, unknown> | null)?.storage_path;
    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json({ error: 'Original file path is unavailable for retry' }, { status: 400 });
    }

    await supabase
      .from('resources')
      .update({
        processing_status: 'retrying',
        processing_error: null,
        processing_metadata: {
          ...(resource.processing_metadata as Record<string, unknown> | null),
          phase: 'retrying',
          storage_path: storagePath,
        },
      })
      .eq('id', resourceId);

    const origin = new URL(request.url).origin;
    const retryResponse = await fetch(`${origin}/api/resources/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
        authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify({
        resourceId,
        filePath: storagePath,
        fileName: resource.title,
        fileType: resource.file_type,
        fileSize: resource.file_size_bytes,
      }),
    });

    const payload = await retryResponse.json();
    if (!retryResponse.ok) {
      return NextResponse.json({ error: payload.error || 'Retry failed' }, { status: retryResponse.status });
    }

    return NextResponse.json({ success: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Retry failed' }, { status: 500 });
  }
}
