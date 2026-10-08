export type ProcessingStatus =
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'parsed'
  | 'ready'
  | 'needs_review'
  | 'failed';

export interface ProcessingStage {
  id: string;
  name: string;
  stage: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  detail?: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  raw?: string;
}

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'list_item'
  | 'table'
  | 'table_row'
  | 'table_cell'
  | 'figure'
  | 'image'
  | 'equation'
  | 'header'
  | 'footer'
  | 'caption'
  | 'handwritten_text'
  | 'other';

export interface SemanticBlock {
  id: string;
  document_id: string;
  page: number;
  type: BlockType;
  label?: string;
  content: string;
  confidence: number;
  language: string;
  bbox: BoundingBox;
  bbox_formatted?: string;
  reading_order: string | number;
  status: 'verified' | 'review' | 'flagged';
  color?: 'cyan' | 'green' | 'amber' | 'violet';
  needs_review?: boolean;
  review_reason?: string;
  parent_id?: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  document: string;
  pages: number;
  size: string;
  confidence: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  project_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_size_formatted: string;
  page_count: number;
  status: ProcessingStatus;
  progress: number;
  current_stage?: string;
  stages: ProcessingStage[];
  parsed_format?: 'pdf' | 'csv' | 'json' | 'markdown' | 'image' | 'spreadsheet' | 'presentation' | 'other';
  raw_content?: string;
  detected_language?: string;
  languages?: string[];
  page_contents?: Record<number, any>;
  created_at: string;
  updated_at: string;
}

export interface ValidationCheck {
  id: string;
  document_id: string;
  type: string;
  title: string;
  expected_value: string;
  actual_value: string;
  status: 'passed' | 'mismatch' | 'warning' | 'needs_review';
  explanation: string;
  confidence: number;
  related_block_ids: string[];
  created_at: string;
}

export interface EvidenceSource {
  block_id: string;
  document_id: string;
  page: number;
  type: BlockType;
  content: string;
  confidence: number;
  bbox: BoundingBox;
  bbox_formatted?: string;
}

export interface AskResponse {
  question: string;
  answer: string;
  confidence: number;
  sources: EvidenceSource[];
  explanation?: string;
}

export interface ReviewItem {
  id: string;
  document_id: string;
  block_id: string;
  reason: string;
  confidence: number;
  extracted_value: string;
  corrected_value?: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  source_page: number;
  bbox_formatted?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportRequest {
  format: 'markdown' | 'json' | 'csv' | 'excel';
  mask_sensitive: boolean;
  scope?: 'document' | 'page' | 'selection';
}

export interface UserSettings {
  theme_preference: 'system' | 'light' | 'dark';
}
