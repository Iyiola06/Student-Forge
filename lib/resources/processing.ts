/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatCompletion, imagePart, isAIConfigured } from '@/lib/ai/openrouter';
import { extractPdfMarkdownOnServer } from '@/lib/pdf/server';
import { OCR_PAGE_PROMPT } from '@/lib/pdf/markdown';
import type { ResourceProcessingStatus } from '@/types/product';

export function buildPreview(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 240) || null;
}

export function buildConfidence(text: string) {
  if (text.length > 600) return 0.94;
  if (text.length > 250) return 0.86;
  if (text.length > 100) return 0.74;
  return 0.58;
}

export function buildSourceHealth(text: string, confidence: number) {
  if (text.length > 1200 && confidence >= 0.9) return 'strong';
  if (text.length > 300 && confidence >= 0.75) return 'usable';
  return 'needs_review';
}

export async function updateProcessingState(
  supabase: any,
  resourceId: string,
  userId: string,
  status: ResourceProcessingStatus,
  patch: Record<string, unknown> = {},
  eventType = 'status_change'
) {
  await supabase
    .from('resources')
    .update({
      processing_status: status,
      ...patch,
    })
    .eq('id', resourceId);

  await supabase.from('resource_processing_events').insert({
    resource_id: resourceId,
    user_id: userId,
    event_type: eventType,
    status,
    detail: patch,
  });
}

export async function updateProcessingJob(
  supabase: any,
  jobId: string,
  patch: Record<string, unknown>
) {
  await supabase
    .from('resource_processing_jobs')
    .update(patch)
    .eq('id', jobId);
}

export async function processQueuedResourceJob(params: {
  supabase: any;
  resourceId: string;
  jobId: string;
  userId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
}) {
  const { supabase, resourceId, jobId, userId, filePath, fileName, fileType, fileSize } = params;
  const startedAt = new Date().toISOString();

  await updateProcessingJob(supabase, jobId, {
    status: 'processing',
    attempt_count: 1,
    started_at: startedAt,
    diagnostics: {
      storage_path: filePath,
      file_type: fileType,
      size_band:
        fileSize && fileSize > 15_000_000
          ? 'oversized'
          : fileSize && fileSize > 5_000_000
            ? 'large'
            : 'standard',
    },
  });

  await updateProcessingState(
    supabase,
    resourceId,
    userId,
    'extracting',
    {
      processing_started_at: startedAt,
      processing_metadata: { storage_path: filePath, phase: 'extracting', file_type: fileType },
    },
    'extraction_started'
  );

  try {
    const { data: fileData, error: downloadError } = await supabase.storage.from('resources').download(filePath);
    if (downloadError || !fileData) throw new Error('Failed to download file for processing');

    let extractedText = '';
    let extractionMethod = 'server';

    if (fileType === 'application/pdf') {
      const result = await extractPdfMarkdownOnServer(await fileData.arrayBuffer());
      extractedText = result.markdown;
      extractionMethod = result.method;
      if (extractedText.length < 50 && result.scannedPages > 0) {
        throw new Error(
          'This PDF is scanned and could not be read on the server. Re-upload it from the app so pages are read in your browser, or upload the pages as photos.'
        );
      }
    } else if (fileType.startsWith('image/')) {
      extractionMethod = 'ocr_image';
      if (!isAIConfigured()) throw new Error('OCR not configured');
      const arrayBuffer = await fileData.arrayBuffer();
      const { text } = await chatCompletion({
        vision: true,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: OCR_PAGE_PROMPT },
            imagePart(Buffer.from(arrayBuffer).toString('base64'), fileType),
          ],
        }],
      });
      extractedText = text.trim();
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      extractionMethod = 'docx';
      const mammoth = await import('mammoth');
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      extractedText = result.value.trim();
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fileName.endsWith('.pptx')
    ) {
      extractionMethod = 'pptx';
      const JSZip = (await import('jszip')).default;
      const arrayBuffer = await fileData.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const slideFiles = Object.keys(zip.files)
        .filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
        .sort();
      for (const slidePath of slideFiles) {
        const xmlContent = await zip.files[slidePath].async('text');
        const textMatches = xmlContent.match(/<a:t>([^<]*)<\/a:t>/g);
        if (textMatches) {
          extractedText += textMatches.map((match: string) => match.replace(/<\/?a:t>/g, '')).join(' ') + '\n';
        }
      }
      extractedText = extractedText.trim();
    } else if (fileType === 'text/plain' || fileType === 'application/json') {
      extractionMethod = 'plain_text';
      extractedText = await fileData.text();
    }

    if (extractedText.trim().length < 50) {
      throw new Error('Insufficient readable text found. Please try a clearer file or paste the material directly.');
    }

    const extractionConfidence = buildConfidence(extractedText);
    const completedAt = new Date().toISOString();
    const diagnostics = {
      storage_path: filePath,
      file_type: fileType,
      extraction_path: extractionMethod,
      latency_bucket: 'lt_3m',
      character_count: extractedText.length,
    };

    await updateProcessingState(
      supabase,
      resourceId,
      userId,
      'ready',
      {
        content: extractedText,
        processing_error: null,
        extraction_method: extractionMethod,
        extraction_confidence: extractionConfidence,
        extracted_preview: buildPreview(extractedText),
        processing_completed_at: completedAt,
        processing_metadata: {
          ...diagnostics,
          phase: 'ready',
          source_health: buildSourceHealth(extractedText, extractionConfidence),
          diagnostics_summary: `${extractionMethod} extracted ${extractedText.length} characters`,
        },
      },
      'resource_ready'
    );

    await updateProcessingJob(supabase, jobId, {
      status: 'completed',
      completed_at: completedAt,
      diagnostics,
    });
  } catch (error: any) {
    const completedAt = new Date().toISOString();
    const supportCode = `RES-${resourceId.slice(0, 8).toUpperCase()}`;
    const diagnostics = {
      storage_path: filePath,
      file_type: fileType,
      failure_code: 'EXTRACTION_FAILED',
      error: error.message,
    };

    await updateProcessingState(
      supabase,
      resourceId,
      userId,
      'failed',
      {
        content: '',
        processing_error: error.message,
        processing_completed_at: completedAt,
        processing_metadata: {
          ...diagnostics,
          phase: 'failed',
          retry_allowed: true,
          support_code: supportCode,
          user_action: 'retry_or_contact_support',
          recommended_next_step: 'Try retrying extraction. If it fails again, contact support with the support code.',
        },
      },
      'extraction_failed'
    );

    await updateProcessingJob(supabase, jobId, {
      status: 'failed',
      completed_at: completedAt,
      failure_code: 'EXTRACTION_FAILED',
      failure_message: error.message,
      diagnostics,
    });
  }
}
