import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { processQueuedResourceJob } from '@/lib/resources/processing';
import { trackServerEvent } from '@/lib/analytics/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId, jobId, filePath, fileName, fileType, fileSize } = await request.json();
    if (!resourceId || !jobId || !filePath) {
      return NextResponse.json({ error: 'Missing required processing payload' }, { status: 400 });
    }

    await processQueuedResourceJob({
      supabase,
      resourceId,
      jobId,
      userId: user.id,
      filePath,
      fileName,
      fileType,
      fileSize,
    });

    const { data: resource } = await supabase
      .from('resources')
      .select('processing_status,processing_metadata,processing_error')
      .eq('id', resourceId)
      .single();

    await trackServerEvent({
      userId: user.id,
      eventName: resource?.processing_status === 'ready' ? 'upload_succeeded' : 'extraction_failed',
      idempotencyKey: `resource-worker:${jobId}:${resource?.processing_status ?? 'unknown'}`,
      properties: {
        resourceId,
        jobId,
        extractionPath: resource?.processing_metadata?.extraction_path ?? null,
        error: resource?.processing_error ?? null,
      },
    });

    return NextResponse.json({ success: true, status: resource?.processing_status ?? 'queued' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Worker failed' }, { status: 500 });
  }
}
