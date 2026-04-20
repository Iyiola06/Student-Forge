export type ResourceRow = {
  id: string;
  title: string;
  subject: string | null;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  content?: string | null;
  extracted_preview?: string | null;
  extraction_confidence?: number | null;
  extraction_method?: string | null;
  processing_status?: string | null;
  processing_error?: string | null;
  processing_metadata?: Record<string, any> | null;
};

export type ProcessingJobRow = {
  id: string;
  resource_id: string;
  status: string;
  attempt_count: number;
  failure_code: string | null;
  failure_message: string | null;
  started_at: string | null;
  completed_at: string | null;
};
