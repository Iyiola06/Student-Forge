import { after, NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { buildConfidence, buildPreview } from '@/lib/resources/processing';
import { trackServerEvent } from '@/lib/analytics/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { supabase, user, accessToken } = await createAuthedRouteClient(request);
    if (!user || !accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath, fileName, fileType, fileSize, extractedText, resourceId } = await request.json();
    if (!filePath) {
      return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('resources').getPublicUrl(filePath);

    const basePayload = {
      user_id: user.id,
      title: fileName,
      subject: 'General',
      file_url: publicUrl,
      file_type: fileType,
      file_size_bytes: fileSize,
      processing_metadata: { storage_path: filePath, file_type: fileType },
    };

    await trackServerEvent({
      userId: user.id,
      eventName: 'upload_started',
      idempotencyKey: `upload-started:${resourceId ?? filePath}`,
      properties: { fileType, fileSize },
    });

    if (extractedText) {
      const readyPayload = {
        ...basePayload,
        content: extractedText,
        processing_status: 'ready',
        extraction_method: 'client',
        extraction_confidence: buildConfidence(extractedText),
        extracted_preview: buildPreview(extractedText),
        processing_started_at: new Date().toISOString(),
        processing_completed_at: new Date().toISOString(),
        processing_error: null,
        processing_metadata: {
          storage_path: filePath,
          phase: 'ready',
          extraction_method: 'client',
          character_count: extractedText.length,
          source_health: extractedText.length > 600 ? 'strong' : 'usable',
          diagnostics_summary: `client extracted ${extractedText.length} characters`,
        },
      };

      const query = resourceId
        ? supabase.from('resources').update(readyPayload).eq('id', resourceId).eq('user_id', user.id).select().single()
        : supabase.from('resources').insert(readyPayload).select().single();

      const { error: dbError, data } = await query;
      if (dbError || !data) {
        return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
      }

      await supabase.from('resource_processing_events').insert({
        resource_id: data.id,
        user_id: user.id,
        event_type: 'resource_ready',
        status: 'ready',
        detail: {
          storage_path: filePath,
          extraction_method: 'client',
          character_count: extractedText.length,
        },
      });

      await trackServerEvent({
        userId: user.id,
        eventName: 'upload_succeeded',
        idempotencyKey: `upload-succeeded:${data.id}`,
        properties: { fileType, extractionMethod: 'client' },
      });

      return NextResponse.json({ success: true, status: 'ready', resourceId: data.id }, { status: 200 });
    }

    const queuedPayload = {
      ...basePayload,
      content: '',
      processing_status: 'queued',
      processing_error: null,
      processing_started_at: new Date().toISOString(),
    };

    const queuedQuery = resourceId
      ? supabase.from('resources').update(queuedPayload).eq('id', resourceId).eq('user_id', user.id).select().single()
      : supabase.from('resources').insert(queuedPayload).select().single();

    const { data: resourceData, error: dbError } = await queuedQuery;
    if (dbError || !resourceData) {
      return NextResponse.json({ error: 'Failed to create resource record' }, { status: 500 });
    }

    await supabase.from('resource_processing_events').insert({
      resource_id: resourceData.id,
      user_id: user.id,
      event_type: 'resource_queued',
      status: 'queued',
      detail: { storage_path: filePath },
    });

    const { data: jobData, error: jobError } = await supabase
      .from('resource_processing_jobs')
      .insert({
        user_id: user.id,
        resource_id: resourceData.id,
        job_type: 'extract',
        status: 'queued',
        triggered_by: resourceId ? 'retry' : 'upload',
        diagnostics: {
          storage_path: filePath,
          file_type: fileType,
          file_size_bytes: fileSize ?? null,
        },
      })
      .select('id')
      .single();

    if (jobError || !jobData) {
      return NextResponse.json({ error: 'Failed to queue processing job' }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    after(async () => {
      await fetch(`${origin}/api/resources/process/worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          resourceId: resourceData.id,
          jobId: jobData.id,
          filePath,
          fileName,
          fileType,
          fileSize,
        }),
      });
    });

    return NextResponse.json(
      {
        success: true,
        status: 'queued',
        resourceId: resourceData.id,
        jobId: jobData.id,
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
