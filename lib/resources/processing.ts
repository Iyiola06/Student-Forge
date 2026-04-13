/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResourceProcessingStatus } from '@/types/product';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const arrayBuffer = await fileData.arrayBuffer();
      let nativeText = '';

      try {
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer), useSystemFonts: true });
        const pdfDoc = await loadingTask.promise;
        for (let i = 1; i <= Math.min(pdfDoc.numPages, 100); i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          nativeText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
      } catch {
        nativeText = '';
      }

      extractedText = nativeText.trim();
      if (extractedText.length < 50) {
        extractionMethod = 'ocr_pdf';
        if (!process.env.GEMINI_API_KEY) throw new Error('AI extraction not configured');
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const result = await model.generateContent([
          'Extract and transcribe all readable text from this PDF document. Preserve headings and important structure. Output only the extracted text.',
          { inlineData: { data: Buffer.from(arrayBuffer).toString('base64'), mimeType: 'application/pdf' } },
        ]);
        extractedText = result.response.text().trim();
      }
    } else if (fileType.startsWith('image/')) {
      extractionMethod = 'ocr_image';
      if (!process.env.GEMINI_API_KEY) throw new Error('OCR not configured');
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await model.generateContent([
        'Transcribe all readable text from this study material image. Format it cleanly and briefly describe any diagram labels if needed.',
        { inlineData: { data: Buffer.from(arrayBuffer).toString('base64'), mimeType: fileType } },
      ]);
      extractedText = result.response.text().trim();
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
