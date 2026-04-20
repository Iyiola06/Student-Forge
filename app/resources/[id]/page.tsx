import { notFound, redirect } from 'next/navigation';
import ResourceDetailClient from '@/components/resources/ResourceDetailClient';
import type { ProcessingJobRow, ResourceRow } from '@/components/resources/types';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: resource } = await supabase
    .from('resources')
    .select(
      'id,title,subject,file_type,file_size_bytes,created_at,content,extracted_preview,extraction_confidence,extraction_method,processing_status,processing_error,processing_metadata'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!resource) notFound();

  const { data: jobs } = await supabase
    .from('resource_processing_jobs')
    .select('id,resource_id,status,attempt_count,failure_code,failure_message,started_at,completed_at,created_at')
    .eq('resource_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  return <ResourceDetailClient initialResource={resource as ResourceRow} initialJob={((jobs?.[0] as ProcessingJobRow | undefined) ?? null)} />;
}
