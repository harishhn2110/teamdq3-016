import {
  Project,
  DocumentRecord,
  SemanticBlock,
  ValidationCheck,
  ReviewItem,
  AskResponse,
  ExportRequest,
} from './types.js';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  const data = await res.json();
  return data.projects || [];
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json();
  return data.project;
}

export async function uploadDocument(projectId: string, file?: File): Promise<DocumentRecord> {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  const res = await fetch(`/api/projects/${projectId}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Upload failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.document;
}

export async function fetchDocument(documentId: string): Promise<DocumentRecord> {
  const res = await fetch(`/api/documents/${documentId}`);
  const data = await res.json();
  return data.document;
}

export async function fetchDocumentStatus(documentId: string): Promise<{
  status: string;
  progress: number;
  current_stage?: string;
  stages: any[];
}> {
  const res = await fetch(`/api/documents/${documentId}/status`);
  return await res.json();
}

export async function fetchBlocks(documentId: string): Promise<SemanticBlock[]> {
  const res = await fetch(`/api/documents/${documentId}/blocks`);
  const data = await res.json();
  return data.blocks || [];
}

export async function fetchValidations(documentId: string): Promise<ValidationCheck[]> {
  const res = await fetch(`/api/documents/${documentId}/validations`);
  const data = await res.json();
  return data.validations || [];
}

export async function rerunValidations(documentId: string): Promise<ValidationCheck[]> {
  const res = await fetch(`/api/documents/${documentId}/validations/run`, {
    method: 'POST',
  });
  const data = await res.json();
  return data.validations || [];
}

export async function askQuestion(documentId: string, question: string): Promise<AskResponse> {
  const res = await fetch(`/api/documents/${documentId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  return await res.json();
}

export async function fetchReviews(documentId?: string): Promise<ReviewItem[]> {
  const url = documentId ? `/api/review?document_id=${documentId}` : '/api/review';
  const res = await fetch(url);
  const data = await res.json();
  return data.reviews || [];
}

export async function approveReview(reviewId: string, correctedValue?: string): Promise<ReviewItem> {
  const res = await fetch(`/api/review/${reviewId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ corrected_value: correctedValue }),
  });
  const data = await res.json();
  return data.review;
}

export async function rejectReview(reviewId: string): Promise<ReviewItem> {
  const res = await fetch(`/api/review/${reviewId}/reject`, {
    method: 'POST',
  });
  const data = await res.json();
  return data.review;
}

export async function exportDocument(documentId: string, options: ExportRequest): Promise<{
  filename: string;
  contentType: string;
  preview: string;
  content: string;
}> {
  const res = await fetch(`/api/documents/${documentId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return await res.json();
}

export async function searchDocument(documentId: string, query: string): Promise<SemanticBlock[]> {
  const res = await fetch(`/api/documents/${documentId}/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.results || [];
}

export async function updateThemePreference(theme: string): Promise<void> {
  await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme_preference: theme }),
  });
}
