import express, { Request, Response } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { db } from './server/store.js';
import { startDocumentPipeline } from './server/pipeline.js';
import { askDocumentQuestion } from './server/qa.js';
import { generateExport } from './server/export.js';
import { DocumentRecord } from './src/types.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  storage: multer.memoryStorage(),
});

// Helper for user authorization
const getUserId = (req: Request) => (req.headers['x-user-id'] as string) || 'default-user';

// ==========================================
// 1. PROJECTS API
// ==========================================
app.get('/api/projects', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const projects = db.getProjects(userId);
  res.json({ projects });
});

app.get('/api/projects/:projectId', (req: Request, res: Response) => {
  const project = db.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
  }
  res.json({ project });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: { code: 'INVALID_NAME', message: 'Project name is required' } });
  }
  const userId = getUserId(req);
  const project = db.createProject(name.trim(), description, userId);
  res.status(201).json({ project });
});

app.patch('/api/projects/:projectId', (req: Request, res: Response) => {
  const project = db.updateProject(req.params.projectId, req.body);
  if (!project) {
    return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
  }
  res.json({ project });
});

app.delete('/api/projects/:projectId', (req: Request, res: Response) => {
  const success = db.deleteProject(req.params.projectId);
  if (!success) {
    return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
  }
  res.json({ success: true });
});

// ==========================================
// 2. DOCUMENTS API
// ==========================================
app.get('/api/projects/:projectId/documents', (req: Request, res: Response) => {
  const docs = db.getDocumentsByProject(req.params.projectId);
  res.json({ documents: docs });
});

app.post('/api/projects/:projectId/documents', upload.single('file') as any, (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  let project = db.getProject(projectId);
  if (!project) {
    const allProjects = db.getProjects();
    project = allProjects.find(p => p.id === 'atlas-demo') || allProjects[0] || db.createProject('Default Project', 'Default document project');
  }

  const file = req.file;
  const filename = file ? file.originalname : req.body.filename || `${project.name.replace(/\s+/g, '_')}.pdf`;
  const fileSize = file ? file.size : req.body.file_size || 18400000;

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  let parsedFormat: DocumentRecord['parsed_format'] = 'pdf';
  if (['csv', 'tsv'].includes(ext) || file?.mimetype === 'text/csv') parsedFormat = 'csv';
  else if (['xlsx', 'xls'].includes(ext)) parsedFormat = 'spreadsheet';
  else if (ext === 'json' || file?.mimetype === 'application/json') parsedFormat = 'json';
  else if (['md', 'txt', 'markdown'].includes(ext) || file?.mimetype?.startsWith('text/')) parsedFormat = 'markdown';
  else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext) || file?.mimetype?.startsWith('image/')) parsedFormat = 'image';
  else if (['pptx', 'ppt'].includes(ext)) parsedFormat = 'presentation';
  else parsedFormat = 'pdf';

  let rawContent = '';
  if (file?.buffer) {
    try {
      rawContent = file.buffer.toString('utf-8');
    } catch {
      rawContent = '';
    }
  }

  let computedPageCount = req.body.pages ? parseInt(req.body.pages, 10) : 0;
  if (!computedPageCount) {
    if (file) {
      if (parsedFormat === 'image') {
        computedPageCount = 1;
      } else if (parsedFormat === 'csv') {
        const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);
        computedPageCount = Math.max(1, Math.min(10, Math.ceil(lines.length / 25)));
      } else if (parsedFormat === 'json') {
        try {
          const parsed = JSON.parse(rawContent);
          const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          computedPageCount = Math.max(1, Math.min(8, Math.ceil(count / 8)));
        } catch {
          computedPageCount = 1;
        }
      } else if (parsedFormat === 'markdown') {
        const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);
        computedPageCount = Math.max(1, Math.min(10, Math.ceil(lines.length / 25)));
      } else if (parsedFormat === 'pdf') {
        const pdfMatches = file.buffer.toString('latin1').match(/\/Type\s*\/Page\b/g);
        if (pdfMatches && pdfMatches.length > 0) {
          computedPageCount = pdfMatches.length;
        } else {
          computedPageCount = Math.max(1, Math.min(24, Math.ceil(file.size / 250000)));
        }
      } else {
        computedPageCount = Math.max(1, Math.min(8, Math.ceil(file.size / 150000)));
      }
    } else {
      computedPageCount = 24; // demo
    }
  }
  const pageCount = computedPageCount || 1;

  const docId = `doc-${Date.now()}`;
  const doc: DocumentRecord = {
    id: docId,
    project_id: projectId,
    filename,
    original_filename: filename,
    mime_type: file?.mimetype || 'application/pdf',
    file_size: fileSize,
    file_size_formatted: fileSize / (1024 * 1024) >= 0.05
      ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
      : `${(fileSize / 1024).toFixed(1)} KB`,
    page_count: pageCount,
    status: 'queued',
    progress: 0,
    stages: [],
    parsed_format: parsedFormat,
    raw_content: rawContent,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.setDocument(docId, doc);

  if (file?.buffer) {
    db.setDocumentFile(docId, {
      buffer: file.buffer,
      mimeType: file.mimetype || 'application/pdf',
      filename,
    });
  }

  // Trigger processing pipeline asynchronously
  startDocumentPipeline(docId, filename, pageCount, file?.buffer, file?.mimetype);

  // Update project document reference
  db.updateProject(projectId, {
    document: filename,
    pages: pageCount,
    size: `${(fileSize / (1024 * 1024)).toFixed(1)} MB`,
  });

  res.status(202).json({ document: doc });
});

app.get('/api/documents/:documentId/raw', (req: Request, res: Response) => {
  const fileData = db.getDocumentFile(req.params.documentId);
  const doc = db.getDocument(req.params.documentId);
  if (!doc) {
    return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } });
  }

  if (fileData) {
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Length', String(fileData.buffer.length));
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileData.filename)}"`);
    return res.send(fileData.buffer);
  }

  if (doc.raw_content) {
    let contentType = 'text/plain; charset=utf-8';
    if (doc.parsed_format === 'csv') contentType = 'text/csv; charset=utf-8';
    else if (doc.parsed_format === 'json') contentType = 'application/json; charset=utf-8';
    else if (doc.parsed_format === 'markdown') contentType = 'text/markdown; charset=utf-8';

    const buf = Buffer.from(doc.raw_content, 'utf-8');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.filename)}"`);
    return res.send(buf);
  }

  return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'File not available' } });
});

app.get('/api/documents/:documentId', (req: Request, res: Response) => {
  const doc = db.getDocument(req.params.documentId);
  if (!doc) {
    return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } });
  }
  res.json({ document: doc });
});

app.get('/api/documents/:documentId/status', (req: Request, res: Response) => {
  const doc = db.getDocument(req.params.documentId);
  if (!doc) {
    return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } });
  }
  res.json({
    status: doc.status,
    progress: doc.progress,
    current_stage: doc.current_stage,
    stages: doc.stages,
    filename: doc.filename,
    original_filename: doc.original_filename,
    file_size_formatted: doc.file_size_formatted,
    page_count: doc.page_count,
  });
});

app.delete('/api/documents/:documentId', (req: Request, res: Response) => {
  const doc = db.getDocument(req.params.documentId);
  if (!doc) {
    return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } });
  }
  db.documents.delete(req.params.documentId);
  res.json({ success: true });
});

// ==========================================
// 3. SEMANTIC BLOCKS & SEARCH
// ==========================================
app.get('/api/documents/:documentId/blocks', (req: Request, res: Response) => {
  let blocks = db.getBlocks(req.params.documentId);

  if (req.query.type) {
    blocks = blocks.filter(b => b.type === req.query.type);
  }
  if (req.query.page) {
    const page = parseInt(req.query.page as string, 10);
    blocks = blocks.filter(b => b.page === page);
  }
  if (req.query.needs_review === 'true') {
    blocks = blocks.filter(b => b.needs_review || b.status === 'review');
  }

  res.json({ blocks, total: blocks.length });
});

app.get('/api/documents/:documentId/blocks/:blockId', (req: Request, res: Response) => {
  const block = db.getBlock(req.params.documentId, req.params.blockId);
  if (!block) {
    return res.status(404).json({ error: { code: 'BLOCK_NOT_FOUND', message: 'Block not found' } });
  }
  res.json({ block });
});

app.patch('/api/documents/:documentId/blocks/:blockId', (req: Request, res: Response) => {
  const updated = db.updateBlock(req.params.documentId, req.params.blockId, req.body);
  if (!updated) {
    return res.status(404).json({ error: { code: 'BLOCK_NOT_FOUND', message: 'Block not found' } });
  }
  res.json({ block: updated });
});

app.get('/api/documents/:documentId/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const blocks = db.getBlocks(req.params.documentId);

  if (!query) {
    return res.json({ query: '', results: [] });
  }

  const results = blocks.filter(b =>
    b.content.toLowerCase().includes(query) ||
    b.id.toLowerCase().includes(query) ||
    b.type.toLowerCase().includes(query)
  );

  res.json({ query, results, count: results.length });
});

// ==========================================
// 4. VALIDATION CHECKS
// ==========================================
app.get('/api/documents/:documentId/validations', (req: Request, res: Response) => {
  const validations = db.getValidations(req.params.documentId);
  res.json({ validations });
});

app.post('/api/documents/:documentId/validations/run', (req: Request, res: Response) => {
  const validations = db.getValidations(req.params.documentId);
  // Recompute status timestamps
  const updated = validations.map(v => ({ ...v, created_at: new Date().toISOString() }));
  db.setValidations(req.params.documentId, updated);
  res.json({ success: true, count: updated.length, validations: updated });
});

// ==========================================
// 5. ASK / DOCUMENT Q&A
// ==========================================
app.post('/api/documents/:documentId/ask', async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: { code: 'INVALID_QUESTION', message: 'A question string is required.' } });
  }

  try {
    const answer = await askDocumentQuestion(req.params.documentId, question.trim());
    res.json(answer);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'QA_ERROR', message: err.message || 'Failed to process question' } });
  }
});

// ==========================================
// 6. HUMAN-IN-THE-LOOP REVIEW QUEUE
// ==========================================
app.get('/api/review', (req: Request, res: Response) => {
  const docId = req.query.document_id as string | undefined;
  const reviews = db.getReviews(docId);
  res.json({ reviews, count: reviews.length });
});

app.get('/api/review/:reviewId', (req: Request, res: Response) => {
  const review = db.getReview(req.params.reviewId);
  if (!review) {
    return res.status(404).json({ error: { code: 'REVIEW_NOT_FOUND', message: 'Review item not found' } });
  }
  res.json({ review });
});

app.patch('/api/review/:reviewId', (req: Request, res: Response) => {
  const { corrected_value } = req.body;
  const updated = db.updateReview(req.params.reviewId, {
    corrected_value,
    status: 'edited',
  });
  if (!updated) {
    return res.status(404).json({ error: { code: 'REVIEW_NOT_FOUND', message: 'Review item not found' } });
  }
  res.json({ review: updated });
});

app.post('/api/review/:reviewId/approve', (req: Request, res: Response) => {
  const { corrected_value } = req.body;
  const updated = db.updateReview(req.params.reviewId, {
    status: 'approved',
    corrected_value: corrected_value || undefined,
  });
  if (!updated) {
    return res.status(404).json({ error: { code: 'REVIEW_NOT_FOUND', message: 'Review item not found' } });
  }

  // Also update block content if corrected
  if (corrected_value) {
    db.updateBlock(updated.document_id, updated.block_id, {
      content: corrected_value,
      status: 'verified',
      needs_review: false,
    });
  }

  res.json({ review: updated });
});

app.post('/api/review/:reviewId/reject', (req: Request, res: Response) => {
  const updated = db.updateReview(req.params.reviewId, {
    status: 'rejected',
  });
  if (!updated) {
    return res.status(404).json({ error: { code: 'REVIEW_NOT_FOUND', message: 'Review item not found' } });
  }
  res.json({ review: updated });
});

// ==========================================
// 7. EXPORT API
// ==========================================
app.get('/api/documents/:documentId/export', (req: Request, res: Response) => {
  const format = (req.query.format as any) || 'json';
  const mask_sensitive = req.query.mask_sensitive === 'true';
  const scope = (req.query.scope as any) || 'document';

  try {
    const exported = generateExport(req.params.documentId, {
      format,
      mask_sensitive,
      scope,
    });

    if (req.query.download === 'true' || !req.accepts('json')) {
      res.setHeader('Content-Type', exported.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
      return res.send(exported.content);
    }

    res.json({
      filename: exported.filename,
      contentType: exported.contentType,
      preview: exported.content.slice(0, 3000),
      content: exported.content,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'EXPORT_ERROR', message: err.message || 'Export generation failed' } });
  }
});

app.post('/api/documents/:documentId/export', (req: Request, res: Response) => {
  const { format = 'json', mask_sensitive = false, scope = 'document' } = req.body;

  try {
    const exported = generateExport(req.params.documentId, {
      format,
      mask_sensitive: !!mask_sensitive,
      scope,
    });

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', exported.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
      return res.send(exported.content);
    }

    res.json({
      filename: exported.filename,
      contentType: exported.contentType,
      preview: exported.content.slice(0, 3000),
      content: exported.content,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'EXPORT_ERROR', message: err.message || 'Export generation failed' } });
  }
});

// ==========================================
// 8. SETTINGS API
// ==========================================
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(db.settings);
});

app.patch('/api/settings', (req: Request, res: Response) => {
  const { theme_preference } = req.body;
  if (theme_preference && ['system', 'light', 'dark'].includes(theme_preference)) {
    db.settings.theme_preference = theme_preference;
  }
  res.json(db.settings);
});

// ==========================================
// VITE INTEGRATION & SERVER START
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`ParseAnything Atlas server running at http://0.0.0.0:${port}`);
  });
}

startServer();
