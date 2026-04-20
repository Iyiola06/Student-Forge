import type { ProcessingJobRow, ResourceRow } from '@/components/resources/types';

type ResourceTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function getEffectiveResourceStatus(resource: ResourceRow, job?: ProcessingJobRow | null) {
  return job?.status || resource.processing_status || 'queued';
}

export function getResourceStatusTone(status?: string | null): ResourceTone {
  switch (status) {
    case 'ready':
    case 'completed':
      return 'success';
    case 'failed':
    case 'error':
      return 'danger';
    case 'extracting':
    case 'processing':
    case 'queued':
    case 'retrying':
    case 'uploaded':
    case 'extracted':
    case 'generating':
      return 'info';
    default:
      return 'neutral';
  }
}

export function getResourceStatusLabel(status?: string | null) {
  switch (status) {
    case 'ready':
      return 'AI ready';
    case 'queued':
      return 'Queued';
    case 'extracting':
      return 'Extracting';
    case 'extracted':
      return 'Preparing';
    case 'retrying':
      return 'Retrying';
    case 'failed':
      return 'Needs review';
    case 'uploaded':
      return 'Uploaded';
    default:
      return status ? titleCase(status) : 'Queued';
  }
}

export function getResourceStatusCopy(status?: string | null) {
  switch (status) {
    case 'ready':
      return 'This material is ready for flashcards, quizzes, summaries, and AI tutoring.';
    case 'queued':
      return 'The file is safely in your library and waiting to enter extraction.';
    case 'extracting':
      return 'Sulva’s Studify is reading the file and pulling out study-ready text.';
    case 'extracted':
      return 'Readable text is present and the system is shaping the final preview.';
    case 'retrying':
      return 'A second pass is running to recover a stronger result.';
    case 'failed':
      return 'The file needs attention before it can become AI-ready.';
    default:
      return 'The file is moving through the study-readiness pipeline.';
  }
}

export function getSourceHealthCopy(value?: string | null) {
  switch (value) {
    case 'strong':
      return 'Strong source';
    case 'usable':
      return 'Usable source';
    case 'needs_review':
      return 'Needs review';
    default:
      return null;
  }
}

export function isResourceReady(resource: ResourceRow, job?: ProcessingJobRow | null) {
  return getEffectiveResourceStatus(resource, job) === 'ready';
}

export function formatFileType(type: string) {
  if (!type) return 'File';
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('presentation')) return 'Presentation';
  if (type.includes('wordprocessingml') || type.includes('docx')) return 'Document';
  if (type.startsWith('image/')) return 'Image';
  if (type === 'text/plain') return 'Text';
  return titleCase(type.split('/').pop() || type);
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function getResourcePreview(resource: ResourceRow, job?: ProcessingJobRow | null) {
  return (
    resource.processing_error ||
    job?.failure_message ||
    resource.processing_metadata?.diagnostics_summary ||
    resource.extracted_preview ||
    resource.content?.slice(0, 800) ||
    'Preview unavailable until extraction completes.'
  );
}

export function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
