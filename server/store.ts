import {
  Project,
  DocumentRecord,
  SemanticBlock,
  ValidationCheck,
  ReviewItem,
  UserSettings,
  ProcessingStage,
} from '../src/types.js';

function buildDemoPdfBuffer(): Buffer {
  const pageSpecs = [
    { title: 'ACME HOLDINGS, INC.', sub: 'ANNUAL REPORT 2024 - FISCAL YEAR PERFORMANCE', p: 1 },
    { title: 'TO OUR SHAREHOLDERS', sub: 'Strategic execution and market expansion overview', p: 2 },
    { title: 'BUSINESS OVERVIEW & SEGMENTS', sub: 'Product portfolio, cloud transformation and key verticals', p: 3 },
    { title: 'MANAGEMENT DISCUSSION & ANALYSIS', sub: 'Comprehensive financial condition and results of operations', p: 4 },
    { title: 'CONSOLIDATED FINANCIAL HIGHLIGHTS', sub: 'Historical trends, revenue expansion, and key unit metrics', p: 5 },
    { title: 'REPORT OF INDEPENDENT AUDITORS', sub: 'Audit report on consolidated financial statements', p: 6 },
    { title: 'CONSOLIDATED STATEMENTS OF OPERATIONS', sub: 'Consolidated statements of operations - Year ended Dec 31, 2024', p: 7 },
    { title: 'CONSOLIDATED BALANCE SHEETS', sub: 'Assets, liabilities, and stockholders equity as of Dec 31, 2024', p: 8 },
    { title: 'CONSOLIDATED STATEMENTS OF CASH FLOWS', sub: 'Operating cash flow $1,840M, investing and financing activities', p: 9 },
    { title: 'NOTES TO CONSOLIDATED FINANCIAL STATEMENTS', sub: 'Note 1 - Summary of Significant Accounting Policies', p: 10 },
    { title: 'SEGMENT REPORTING & REGIONAL DISCLOSURES', sub: 'Geographic revenue breakdown and regional margins', p: 11 },
    { title: 'DEBT, FINANCING & LIQUIDITY', sub: 'Credit facilities, debt maturities and covenants', p: 12 },
    { title: 'STOCKHOLDERS EQUITY & CAPITAL RETURN', sub: 'Share repurchase authorizations and dividend schedule', p: 13 },
    { title: 'INCOME TAXES & DEFERRED LIABILITIES', sub: 'Effective tax rate reconciliation and credits', p: 14 },
    { title: 'COMMITMENTS & CONTINGENCIES', sub: 'Legal proceedings, lease obligations and guarantees', p: 15 },
    { title: 'SUBSEQUENT EVENTS & SEC CERTIFICATIONS', sub: 'Item 9A Controls and Procedures - Form 10-K Certifications', p: 16 },
    { title: 'CORPORATE GOVERNANCE & ESG METRICS', sub: 'Board oversight, carbon reduction milestones and governance', p: 17 },
    { title: 'RISK FACTORS & SENSITIVITY ANALYSIS', sub: 'Foreign exchange volatility, supply chain risks and inflation', p: 18 },
    { title: 'RESEARCH & DEVELOPMENT ROADMAP', sub: 'Next-gen enterprise software and AI pipeline investments', p: 19 },
    { title: 'HUMAN CAPITAL & WORKFORCE DATA', sub: 'Global headcount, retention benchmarks and talent development', p: 20 },
    { title: 'SUPPLY CHAIN & MANUFACTURING NETWORK', sub: 'Facility footprint, procurement diversification and logistics', p: 21 },
    { title: 'SUBSIDIARIES & JOINT VENTURES', sub: 'Schedule of international operating subsidiaries', p: 22 },
    { title: 'SHAREHOLDER INFORMATION & INVESTOR RELATIONS', sub: 'Transfer agent, annual meeting details and investor contacts', p: 23 },
    { title: 'GLOSSARY OF TERMS & FORWARD-LOOKING STATEMENTS', sub: 'Non-GAAP reconciliation disclosures and Safe Harbor provisions', p: 24 },
  ];

  let objIdx = 1;
  const objects: string[] = [];
  const pageObjIds: number[] = [];

  const catalogId = objIdx++;
  const pagesId = objIdx++;
  const fontId = objIdx++;

  for (let i = 0; i < pageSpecs.length; i++) {
    const pageNum = pageSpecs[i].p;
    const title = pageSpecs[i].title;
    const sub = pageSpecs[i].sub;

    const streamContent =
      'BT\n' +
      '/F1 18 Tf\n' +
      '50 720 Td\n' +
      '(' + title + ') Tj\n' +
      '/F1 12 Tf\n' +
      '0 -28 Td\n' +
      '(' + sub + ') Tj\n' +
      '0 -25 Td\n' +
      '(Page ' + pageNum + ' of 24 - Acme Holdings, Inc. Annual Report 2024) Tj\n' +
      (pageNum === 7 ?
        '0 -32 Td\n' +
        '(Revenue increased 12% YoY, led by strong North American demand.) Tj\n' +
        '0 -24 Td\n' +
        '(Total Revenue: $7,850M  |  Adjusted EBITDA Margin: 24.8% (+180 bps)) Tj\n' +
        '0 -24 Td\n' +
        '(North America: $4,620M (+10.5%)  |  EMEA: $2,140M (+8.1%)  |  APAC: $1,090M (+21.1%)) Tj\n' +
        '0 -24 Td\n' +
        '(Latin America: $510M (+6.2%)  |  Operating Income: $1,420M) Tj\n'
        : '') +
      'ET\n';

    const contentId = objIdx++;
    const contentObj = contentId + ' 0 obj\n<</Length ' + Buffer.byteLength(streamContent) + '>>\nstream\n' + streamContent + 'endstream\nendobj';
    objects.push(contentObj);

    const pageId = objIdx++;
    pageObjIds.push(pageId);
    const pageObj = pageId + ' 0 obj\n<</Type/Page/Parent ' + pagesId + ' 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 ' + fontId + ' 0 R>>>>/Contents ' + contentId + ' 0 R>>\nendobj';
    objects.push(pageObj);
  }

  const catalogObj = catalogId + ' 0 obj\n<</Type/Catalog/Pages ' + pagesId + ' 0 R>>\nendobj';
  const pagesObj = pagesId + ' 0 obj\n<</Type/Pages/Kids[' + pageObjIds.map(id => id + ' 0 R').join(' ') + ']/Count ' + pageObjIds.length + '>>\nendobj';
  const fontObj = fontId + ' 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj';

  const allObjs = [catalogObj, pagesObj, fontObj, ...objects];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of allObjs) {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += obj + '\n';
  }

  const xrefOffset = Buffer.byteLength(body, 'latin1');
  let xref = 'xref\n0 ' + (allObjs.length + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= allObjs.length; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = 'trailer\n<</Size ' + (allObjs.length + 1) + '/Root ' + catalogId + ' 0 R>>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
  return Buffer.from(body + xref + trailer, 'latin1');
}

class DataStore {
  projects: Map<string, Project> = new Map();
  documents: Map<string, DocumentRecord> = new Map();
  blocks: Map<string, SemanticBlock[]> = new Map();
  validations: Map<string, ValidationCheck[]> = new Map();
  reviews: Map<string, ReviewItem[]> = new Map();
  documentFiles: Map<string, { buffer: Buffer; mimeType: string; filename: string }> = new Map();
  settings: UserSettings = {
    theme_preference: 'system',
  };

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoProjectId = 'atlas-demo';
    const demoDocId = 'doc-annual-report-2024';

    // Seed clean renderable 24-page PDF for Annual Report demo
    const demoPdfBuffer = buildDemoPdfBuffer();
    this.documentFiles.set(demoDocId, {
      buffer: demoPdfBuffer,
      mimeType: 'application/pdf',
      filename: 'Annual_Report.pdf',
    });

    const p1: Project = {
      id: demoProjectId,
      owner_id: 'default-user',
      name: 'ParseAnything Demo',
      description: 'Universal document ingestion and verification demo',
      document: 'Annual_Report.pdf',
      pages: 24,
      size: '18.4 MB',
      confidence: '96%',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const p2: Project = {
      id: 'annual-reports',
      owner_id: 'default-user',
      name: 'Annual Reports',
      description: 'Quarterly and annual financial statements',
      document: 'Q3_Reports.pdf',
      pages: 18,
      size: '12.1 MB',
      confidence: '94%',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const p3: Project = {
      id: 'legal-documents',
      owner_id: 'default-user',
      name: 'Legal Documents',
      description: 'M&A agreements and contracts',
      document: 'Merger_Agreement.pdf',
      pages: 86,
      size: '28.6 MB',
      confidence: '98%',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const p4: Project = {
      id: 'invoices',
      owner_id: 'default-user',
      name: 'Invoices',
      description: 'Vendor invoices and reconciliation sheets',
      document: 'Vendor_Invoices.pdf',
      pages: 42,
      size: '9.8 MB',
      confidence: '91%',
      created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      updated_at: new Date().toISOString(),
    };

    [p1, p2, p3, p4].forEach(p => this.projects.set(p.id, p));

    const defaultStages: ProcessingStage[] = [
      { id: '1', name: 'Document detected', stage: 'document_detection', status: 'completed', progress: 100, detail: 'Annual_Report.pdf · 24 pages' },
      { id: '2', name: 'Layout understood', stage: 'layout_reconstruction', status: 'completed', progress: 100, detail: 'Multi-column · 7 tables · 4 figures' },
      { id: '3', name: 'Text extracted', stage: 'ocr', status: 'completed', progress: 100, detail: '42 blocks · 99.1% coverage' },
      { id: '4', name: 'Tables reconciled', stage: 'table_reconciliation', status: 'completed', progress: 100, detail: '3 tables · 12 checks' },
      { id: '5', name: 'Evidence indexed', stage: 'evidence_indexing', status: 'completed', progress: 100, detail: 'Citations ready to trace' },
      { id: '6', name: 'Confidence scored', stage: 'confidence_scoring', status: 'completed', progress: 100, detail: '2 blocks routed to review' },
      { id: '7', name: 'Structured output ready', stage: 'structured_generation', status: 'completed', progress: 100, detail: 'Markdown · JSON · CSV · XLSX' },
    ];

    const docRecord: DocumentRecord = {
      id: demoDocId,
      project_id: demoProjectId,
      filename: 'Annual_Report.pdf',
      original_filename: 'Annual_Report.pdf',
      mime_type: 'application/pdf',
      file_size: 18400000,
      file_size_formatted: '18.4 MB',
      page_count: 24,
      status: 'ready',
      progress: 100,
      current_stage: 'structured_generation',
      detected_language: 'English',
      languages: ['English'],
      stages: defaultStages,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.documents.set(demoDocId, docRecord);

    const docBlocks: SemanticBlock[] = [
      {
        id: 'A01',
        document_id: demoDocId,
        page: 1,
        type: 'heading',
        label: 'Section Header',
        content: 'Consolidated statements of operations',
        confidence: 0.99,
        language: 'English',
        bbox: { x: 80, y: 110, width: 620, height: 42 },
        bbox_formatted: 'x 80 · y 110 · w 620 · h 42',
        reading_order: '01.01',
        status: 'verified',
        color: 'cyan',
      },
      {
        id: 'A03',
        document_id: demoDocId,
        page: 1,
        type: 'paragraph',
        label: 'Financial Narrative',
        content: 'Revenue increased 12% year-over-year driven by strong demand across North America and disciplined pricing actions.',
        confidence: 0.97,
        language: 'English',
        bbox: { x: 80, y: 170, width: 420, height: 55 },
        bbox_formatted: 'x 80 · y 170 · w 420 · h 55',
        reading_order: '01.02',
        status: 'verified',
        color: 'green',
      },
      {
        id: 'A06',
        document_id: demoDocId,
        page: 1,
        type: 'table',
        label: 'Geographic Breakdown Table',
        content: 'Revenue by geography summary table with YoY percentage change.',
        confidence: 0.98,
        language: 'English',
        bbox: { x: 80, y: 260, width: 600, height: 180 },
        bbox_formatted: 'x 80 · y 260 · w 600 · h 180',
        reading_order: '01.04',
        status: 'verified',
        color: 'cyan',
      },
      {
        id: 'A10',
        document_id: demoDocId,
        page: 1,
        type: 'figure',
        label: 'Performance Chart',
        content: 'Net revenue and adjusted EBITDA historical bridge 2021-2024.',
        confidence: 0.91,
        language: 'English',
        bbox: { x: 520, y: 170, width: 220, height: 140 },
        bbox_formatted: 'x 520 · y 170 · w 220 · h 140',
        reading_order: '01.08',
        status: 'verified',
        color: 'violet',
      },
      {
        id: 'A17',
        document_id: demoDocId,
        page: 2,
        type: 'equation',
        label: 'Formula Definition',
        content: 'Net income = operating income − interest − tax provision',
        confidence: 0.88,
        language: 'English',
        bbox: { x: 100, y: 220, width: 440, height: 35 },
        bbox_formatted: 'x 100 · y 220 · w 440 · h 35',
        reading_order: '02.03',
        status: 'verified',
        color: 'amber',
      },
      {
        id: 'A28',
        document_id: demoDocId,
        page: 4,
        type: 'list',
        label: 'Strategic Bullet Points',
        content: 'Key assumptions and outlook for FY2025 and long-term targets.',
        confidence: 0.96,
        language: 'English',
        bbox: { x: 90, y: 310, width: 510, height: 95 },
        bbox_formatted: 'x 90 · y 310 · w 510 · h 95',
        reading_order: '04.02',
        status: 'verified',
        color: 'cyan',
      },
      {
        id: 'A72',
        document_id: demoDocId,
        page: 7,
        type: 'table_cell',
        label: 'Table cell',
        content: 'North America · 2024 revenue: $4,620M (+10.5% YoY)',
        confidence: 0.98,
        language: 'English',
        bbox: { x: 120, y: 340, width: 330, height: 50 },
        bbox_formatted: 'x 120 · y 340 · w 330 · h 50',
        reading_order: '07.12',
        status: 'verified',
        color: 'cyan',
      },
      {
        id: 'A68',
        document_id: demoDocId,
        page: 7,
        type: 'table_row',
        label: 'Table row',
        content: 'Revenue by geography: North America ($4,620M), EMEA ($2,140M), APAC ($1,090M)',
        confidence: 0.97,
        language: 'English',
        bbox: { x: 98, y: 292, width: 448, height: 116 },
        bbox_formatted: 'x 98 · y 292 · w 448 · h 116',
        reading_order: '07.11',
        status: 'verified',
        color: 'green',
      },
      {
        id: 'A74',
        document_id: demoDocId,
        page: 7,
        type: 'figure',
        label: 'Figure caption',
        content: 'Adjusted EBITDA margin expanded 180 bps to 24.8%',
        confidence: 0.68,
        language: 'English',
        bbox: { x: 594, y: 330, width: 212, height: 118 },
        bbox_formatted: 'x 594 · y 330 · w 212 · h 118',
        reading_order: '07.15',
        status: 'review',
        color: 'violet',
        needs_review: true,
        review_reason: 'Figure text separated from chart boundary; human confirmation advised',
      },
      {
        id: 'A91',
        document_id: demoDocId,
        page: 7,
        type: 'paragraph',
        label: 'Low-confidence text',
        content: 'Revenue: $8?3M',
        confidence: 0.42,
        language: 'English',
        bbox: { x: 112, y: 504, width: 312, height: 32 },
        bbox_formatted: 'x 112 · y 504 · w 312 · h 32',
        reading_order: '07.18',
        status: 'review',
        color: 'amber',
        needs_review: true,
        review_reason: 'OCR ambiguity between 8.3M and 8?3M. Context suggests decimal.',
      },
    ];

    this.blocks.set(demoDocId, docBlocks);

    const checks: ValidationCheck[] = [
      {
        id: 'v1',
        document_id: demoDocId,
        type: 'sum_reconciliation',
        title: 'North America + EMEA + APAC',
        expected_value: '$7,850',
        actual_value: '$7,850',
        status: 'passed',
        explanation: 'Sum of segment revenues ($4,620 + $2,140 + $1,090) equals $7,850M.',
        confidence: 0.99,
        related_block_ids: ['A68', 'A72'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'v2',
        document_id: demoDocId,
        type: 'reported_vs_found',
        title: 'Reported total revenue',
        expected_value: '$7,850',
        actual_value: '$7,830',
        status: 'mismatch',
        explanation: 'Footnote summary states $7,830M while table total reports $7,850M ($20M variance).',
        confidence: 0.85,
        related_block_ids: ['A68', 'A91'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'v3',
        document_id: demoDocId,
        type: 'percentage_consistency',
        title: 'Year-over-year change',
        expected_value: '+11.2%',
        actual_value: '+11.2%',
        status: 'passed',
        explanation: 'Calculated YoY change (($7,850 - $7,060) / $7,060) equals +11.19% (rounds to +11.2%).',
        confidence: 0.98,
        related_block_ids: ['A68'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'v4',
        document_id: demoDocId,
        type: 'currency_units',
        title: 'Currency consistency',
        expected_value: 'USD Millions',
        actual_value: 'USD Millions',
        status: 'passed',
        explanation: 'All regional headers and rows use USD Millions without unit drift.',
        confidence: 0.99,
        related_block_ids: ['A01', 'A68'],
        created_at: new Date().toISOString(),
      },
    ];

    this.validations.set(demoDocId, checks);

    const revItems: ReviewItem[] = [
      {
        id: 'rev-A91',
        document_id: demoDocId,
        block_id: 'A91',
        reason: 'OCR ambiguity between “8.3M” and “8?3M”. Nearby source text suggests a decimal point.',
        confidence: 0.42,
        extracted_value: 'Revenue: $8?3M',
        corrected_value: 'Revenue: $8.3M',
        status: 'pending',
        source_page: 7,
        bbox_formatted: 'x 112 · y 504 · w 312 · h 32',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rev-A74',
        document_id: demoDocId,
        block_id: 'A74',
        reason: 'Figure text is separated from its caption, so Atlas wants a human to confirm the relationship.',
        confidence: 0.68,
        extracted_value: 'Adjusted EBITDA margin expanded 180 bps to 24.8%',
        corrected_value: 'Adjusted EBITDA margin: 24.8%',
        status: 'pending',
        source_page: 7,
        bbox_formatted: 'x 594 · y 330 · w 212 · h 118',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.reviews.set(demoDocId, revItems);
  }

  getProjects(ownerId = 'default-user'): Project[] {
    return Array.from(this.projects.values()).filter(p => p.owner_id === ownerId);
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  createProject(name: string, description?: string, ownerId = 'default-user'): Project {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `proj-${Date.now()}`;
    const project: Project = {
      id,
      owner_id: ownerId,
      name,
      description: description || '',
      document: `${name.replace(/\s+/g, '_')}.pdf`,
      pages: 1,
      size: 'New project',
      confidence: '—',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.projects.set(id, project);
    return project;
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const p = this.projects.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...updates, updated_at: new Date().toISOString() };
    this.projects.set(id, updated);
    return updated;
  }

  deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  getDocumentsByProject(projectId: string): DocumentRecord[] {
    return Array.from(this.documents.values()).filter(d => d.project_id === projectId);
  }

  getDocument(id: string): DocumentRecord | undefined {
    return this.documents.get(id);
  }

  setDocument(id: string, doc: DocumentRecord) {
    this.documents.set(id, doc);
  }

  getBlocks(documentId: string): SemanticBlock[] {
    return this.blocks.get(documentId) || [];
  }

  setBlocks(documentId: string, blocks: SemanticBlock[]) {
    this.blocks.set(documentId, blocks);
  }

  getBlock(documentId: string, blockId: string): SemanticBlock | undefined {
    return (this.blocks.get(documentId) || []).find(b => b.id === blockId);
  }

  updateBlock(documentId: string, blockId: string, updates: Partial<SemanticBlock>): SemanticBlock | undefined {
    const list = this.blocks.get(documentId) || [];
    const idx = list.findIndex(b => b.id === blockId);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates };
    this.blocks.set(documentId, list);
    return list[idx];
  }

  getValidations(documentId: string): ValidationCheck[] {
    return this.validations.get(documentId) || [];
  }

  setValidations(documentId: string, checks: ValidationCheck[]) {
    this.validations.set(documentId, checks);
  }

  getReviews(documentId?: string): ReviewItem[] {
    if (documentId) {
      return this.reviews.get(documentId) || [];
    }
    const all: ReviewItem[] = [];
    for (const list of this.reviews.values()) {
      all.push(...list);
    }
    return all;
  }

  getReview(reviewId: string): ReviewItem | undefined {
    for (const list of this.reviews.values()) {
      const match = list.find(r => r.id === reviewId);
      if (match) return match;
    }
    return undefined;
  }

  updateReview(reviewId: string, updates: Partial<ReviewItem>): ReviewItem | undefined {
    for (const [docId, list] of this.reviews.entries()) {
      const idx = list.findIndex(r => r.id === reviewId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        this.reviews.set(docId, list);
        return list[idx];
      }
    }
    return undefined;
  }

  setDocumentFile(id: string, file: { buffer: Buffer; mimeType: string; filename: string }) {
    this.documentFiles.set(id, file);
  }

  getDocumentFile(id: string): { buffer: Buffer; mimeType: string; filename: string } | undefined {
    return this.documentFiles.get(id);
  }
}

export const db = new DataStore();
