import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Layers3,
  ShieldCheck,
  MessageSquare,
  Highlighter,
  Inbox,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Grid2x2,
  Maximize2,
  Lock,
  Zap,
  Plus,
  Check,
  X,
  CircleAlert,
  CircleCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Tag,
  Sun,
  Moon,
  Settings2,
  Ellipsis,
  CloudUpload,
  FolderOpen,
  Play,
  ChartColumn,
  Activity,
  FileJson,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import {
  Project,
  DocumentRecord,
  SemanticBlock,
  ValidationCheck,
  ReviewItem,
} from './types.js';
import * as api from './api.js';

const WORKFLOW_NAV = [
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'understand', label: 'Understand', icon: Layers3 },
  { id: 'validate', label: 'Validate', icon: ShieldCheck, count: '02' },
  { id: 'ask', label: 'Ask', icon: MessageSquare },
  { id: 'verify', label: 'Verify', icon: Highlighter },
  { id: 'review', label: 'Review', icon: Inbox, count: '02', note: 'needs attention' },
  { id: 'export', label: 'Export', icon: Download },
];

function AtlasBrand({ small = false, onClick }: { small?: boolean; onClick?: () => void }) {
  return (
    <div
      className={`atlas-brand ${small ? 'is-small' : ''} ${onClick ? 'is-interactive' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      title={onClick ? 'Return to Landing Page' : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="atlas-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      {!small && (
        <div>
          <div className="brand-name">PARSEANYTHING</div>
          <div className="brand-sub">
            ATLAS <span>·</span> DOCUMENT INTELLIGENCE
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ children, tone = 'cyan', dot = true }: { children: React.ReactNode; tone?: string; dot?: boolean }) {
  return (
    <span className={`status-pill ${tone}`}>
      {dot && <i />} {children}
    </span>
  );
}

function ConfidenceBar({ value, compact = false }: { value: number; compact?: boolean }) {
  const tone = value >= 0.9 ? 'good' : value >= 0.7 ? 'mid' : 'low';
  return (
    <span className={`confidence ${tone} ${compact ? 'compact' : ''}`}>
      <span className="confidence-bar">
        <i style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <b>{Math.round(value * 100)}%</b>
    </span>
  );
}

// ----------------------------------------------------
// LANDING SCREEN
// ----------------------------------------------------
function LandingScreen({
  onStartDemo,
  onUploadFile,
}: {
  onStartDemo: () => void;
  onUploadFile: (file?: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [browsedFile, setBrowsedFile] = useState<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setBrowsedFile(file);
    }
  };

  const getFormatBadge = (name: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'DOCUMENT';
    if (ext === 'PDF') return 'PDF Document';
    if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)) return 'Image / Scan';
    if (['XLSX', 'XLS', 'CSV'].includes(ext)) return 'Spreadsheet';
    if (['PPTX', 'PPT'].includes(ext)) return 'Presentation';
    if (['MD', 'TXT', 'MARKDOWN'].includes(ext)) return 'Markdown Document';
    if (ext === 'JSON') return 'JSON Document';
    return `${ext} Document`;
  };

  return (
    <main className="landing-screen">
      <div className="landing-grid" />
      <header className="landing-topbar">
        <AtlasBrand />
        <div className="landing-top-actions">
          <span className="topbar-note">
            <Lock size={13} /> Your documents stay private by default
          </span>
          <button className="icon-button ghost" aria-label="Settings">
            <Settings2 size={17} />
          </button>
        </div>
      </header>

      <section className="landing-content">
        <div className="eyebrow">
          <span className="eyebrow-line" /> UNIVERSAL DOCUMENT INGESTION <span className="eyebrow-line" />
        </div>
        <h1>
          A universal parser that turns any document <br />
          <em>into structured Markdown and JSON</em>
        </h1>
        <p className="landing-lede">Extract it. Validate it. Show exactly where it came from.</p>

        <div className="landing-trust-row">
          <span><ShieldCheck size={15} /> Evidence-first by design</span>
          <span><Zap size={15} /> 24-page demo document</span>
          <span><FileText size={15} /> Markdown + JSON ready</span>
        </div>

        {browsedFile ? (
          <div className="upload-card browsed-active">
            <input
              id="atlas-file"
              className="sr-only"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.pptx,.ppt,.txt,.md,.json,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setBrowsedFile(f);
              }}
            />
            <div className="upload-orbit orbit-one" />
            <div className="upload-orbit orbit-two" />

            <div className="browsed-file-badge">
              <Check size={14} /> BROWSED FILE READY
            </div>

            <div className="browsed-file-display">
              <div className="browsed-icon">
                {browsedFile.name.endsWith('.json') ? (
                  <FileJson size={26} />
                ) : browsedFile.name.endsWith('.csv') || browsedFile.name.endsWith('.xlsx') ? (
                  <FileSpreadsheet size={26} />
                ) : (
                  <FileText size={26} />
                )}
              </div>
              <div className="browsed-meta">
                <span className="browsed-name">{browsedFile.name}</span>
                <span className="browsed-size">
                  {(browsedFile.size / (1024 * 1024) >= 0.05
                    ? `${(browsedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : `${(browsedFile.size / 1024).toFixed(1)} KB`
                  )}{' '}
                  · {getFormatBadge(browsedFile.name)}
                </span>
              </div>
            </div>

            <div className="conversion-targets-box">
              <span className="micro-label">TARGET CONVERSION FORMATS:</span>
              <div className="conversion-pills">
                <span className="conversion-pill active">
                  <FileText size={13} /> Markdown (.md)
                </span>
                <span className="conversion-pill active">
                  <FileJson size={13} /> JSON (.json)
                </span>
                <span className="conversion-pill active">
                  <ShieldCheck size={13} /> Provenance Graph
                </span>
              </div>
            </div>

            <div className="upload-actions">
              <button
                className="primary-button"
                onClick={() => onUploadFile(browsedFile)}
              >
                <Sparkles size={16} /> Convert into Markdown & JSON
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setBrowsedFile(null);
                  const input = document.getElementById('atlas-file') as HTMLInputElement;
                  if (input) input.value = '';
                }}
              >
                <X size={14} /> Change file
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`upload-card ${dragging ? 'dragging' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              id="atlas-file"
              className="sr-only"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.pptx,.ppt,.txt,.md,.json,.csv,.tsv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setBrowsedFile(f);
                  onUploadFile(f);
                }
              }}
            />
            <div className="upload-orbit orbit-one" />
            <div className="upload-orbit orbit-two" />
            <label htmlFor="atlas-file" className="upload-icon">
              <CloudUpload size={24} />
            </label>
            <h2>{dragging ? 'Release to inspect the document' : 'Drop a document to begin'}</h2>
            <p>PDF, scanned PDF, image, spreadsheet or presentation</p>

            <div className="upload-actions">
              <button
                className="primary-button"
                onClick={() => document.getElementById('atlas-file')?.click()}
              >
                <FolderOpen size={16} /> Browse files
              </button>
              <button className="secondary-button" onClick={onStartDemo}>
                <Play size={14} fill="currentColor" /> Open sample document
              </button>
            </div>

            <div className="format-row">
              <span>PDF</span>
              <span>PNG / JPG</span>
              <span>XLSX</span>
              <span>PPTX</span>
              <span>+ more</span>
            </div>
          </div>
        )}

        <div className="landing-footnote">
          <span className="pulse-dot" /> Best-effort sensitive data masking is available before export.{' '}
          <button onClick={onStartDemo}>
            See how Atlas preserves trust <ArrowRight size={13} />
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <span>PARSEANYTHING ATLAS / MVP 0.8</span>
        <span>BUILT FOR HIGH-STAKES DOCUMENT WORK</span>
        <span><Activity size={13} /> SYSTEMS NOMINAL</span>
      </footer>
    </main>
  );
}

// ----------------------------------------------------
// PROCESSING SCREEN
// ----------------------------------------------------
function ProcessingScreen({
  documentId,
  docRecord,
  onComplete,
  onReturnHome,
}: {
  documentId: string;
  docRecord?: DocumentRecord | null;
  onComplete: () => void;
  onReturnHome?: () => void;
}) {
  const [statusData, setStatusData] = useState<{
    status: string;
    progress: number;
    current_stage?: string;
    stages: any[];
  }>({
    status: 'processing',
    progress: 10,
    stages: [],
  });

  const docName = docRecord?.filename || 'Document';
  const docPages = docRecord?.page_count || 1;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await api.fetchDocumentStatus(documentId);
        setStatusData(data);
        if (data.status === 'ready' || data.progress >= 100) {
          setTimeout(onComplete, 800);
          return;
        }
      } catch (e) {
        console.error('Status poll error:', e);
      }
      timer = setTimeout(poll, 600);
    };

    poll();
    return () => clearTimeout(timer);
  }, [documentId, onComplete]);

  const stagesList = statusData.stages?.length > 0 ? statusData.stages : [
    { id: '1', name: 'Document detected', detail: `${docName} · ${docPages} pages`, status: 'completed' },
    { id: '2', name: 'Layout understood', detail: 'Multi-column layout & tables routed', status: 'processing' },
    { id: '3', name: 'Text extracted', detail: `${docPages * 2} blocks mapped with geometry`, status: 'pending' },
    { id: '4', name: 'Tables reconciled', detail: 'Schema alignment & checks executed', status: 'pending' },
    { id: '5', name: 'Evidence indexed', detail: 'Citations ready to trace', status: 'pending' },
    { id: '6', name: 'Confidence scored', detail: 'High-signal bounding boxes verified', status: 'pending' },
    { id: '7', name: 'Structured output ready', detail: 'Markdown · JSON · CSV · XLSX ready', status: 'pending' },
  ];

  return (
    <main className="processing-screen">
      <div className="processing-glow" />
      <header className="processing-top">
        <AtlasBrand onClick={onReturnHome} />
        <StatusPill tone="violet">ATLAS ENGINE / LIVE</StatusPill>
      </header>

      <div className="processing-layout">
        <section className="processing-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" /> PARSE IN PROGRESS
          </div>
          <h1>
            Reading the document<br />
            <em>like an analyst.</em>
          </h1>
          <p>
            Atlas is preserving layout, reading order and source geometry as it turns this file into a traceable knowledge layer.
          </p>

          <div className="processing-file">
            <div className="file-icon">
              {docName.endsWith('.json') ? (
                <FileJson size={20} />
              ) : docName.endsWith('.csv') || docName.endsWith('.xlsx') ? (
                <FileSpreadsheet size={20} />
              ) : (
                <FileText size={20} />
              )}
            </div>
            <div>
              <b>{docName}</b>
              <span>{docPages} {docPages === 1 ? 'page' : 'pages'} · uploaded moments ago</span>
            </div>
            <StatusPill tone="cyan">PROCESSING</StatusPill>
          </div>

          <div className="processing-legend">
            <span><i className="legend-dot cyan" /> active stage</span>
            <span><i className="legend-dot violet" /> AI interpretation</span>
            <span><i className="legend-dot amber" /> human review</span>
          </div>
        </section>

        <section className="pipeline-card">
          <div className="pipeline-header">
            <div>
              <span className="micro-label">ATLAS PIPELINE</span>
              <h2>Building your evidence graph</h2>
            </div>
            <span className="pipeline-percent">{Math.min(99, Math.max(12, statusData.progress))}%</span>
          </div>

          <div className="pipeline-track">
            <i style={{ width: `${Math.min(100, Math.max(12, statusData.progress))}%` }} />
          </div>

          <div className="pipeline-steps">
            {stagesList.map((st: any, idx: number) => {
              const isDone = st.status === 'completed';
              const isActive = st.status === 'processing';
              return (
                <div key={st.id || idx} className={`pipeline-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="pipeline-node">
                    {isDone ? <Check size={13} /> : String(idx + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <b>{st.name}</b>
                    <span>{st.detail || ''}</span>
                  </div>
                  {isActive && <Activity size={15} className="step-activity" />}
                </div>
              );
            })}
          </div>

          <div className="pipeline-footer">
            <span><span className="spinner" /> Running deep layout analysis</span>
            <span>ETA 00:03</span>
          </div>
        </section>
      </div>
    </main>
  );
}

// ----------------------------------------------------
// DOCUMENT PAGE CANVAS COMPONENT (SUPPORTS CSV, JSON, MD, PDF)
// ----------------------------------------------------
function DocumentPageCanvas({
  documentId,
  docName,
  currentPage,
  totalPages,
  docFormat,
  isDemoDoc,
  pageContent,
  docRecord,
  blocks,
  selectedBlockId,
  onSelectBlock,
  masked,
}: {
  documentId: string;
  docName: string;
  currentPage: number;
  totalPages: number;
  docFormat: 'pdf' | 'csv' | 'json' | 'markdown' | 'image' | 'spreadsheet' | 'presentation' | 'other';
  isDemoDoc: boolean;
  pageContent?: any;
  docRecord?: DocumentRecord | null;
  blocks: SemanticBlock[];
  selectedBlockId: string;
  onSelectBlock: (id: string) => void;
  masked: boolean;
}) {
  const [pdfViewMode, setPdfViewMode] = useState<'original' | 'extracted'>('original');
  const [csvViewMode, setCsvViewMode] = useState<'grid' | 'raw'>('grid');
  const [jsonViewMode, setJsonViewMode] = useState<'table' | 'ast'>('table');
  const [mdViewMode, setMdViewMode] = useState<'doc' | 'table' | 'raw'>('doc');
  const pageBlocks = blocks.filter(b => b.page === currentPage);

  // 1. SPREADSHEET / CSV VIEW
  if (docFormat === 'csv' || docFormat === 'spreadsheet') {
    const defaultHeaders = isDemoDoc ? ['Region', '2024', '2023', 'Change'] : ['Column 1', 'Column 2', 'Column 3'];
    const defaultRows = isDemoDoc ? [
      ['North America', '$4,620M', '$4,180M', '+10.5%'],
      ['EMEA', '$2,140M', '$1,980M', '+8.1%'],
      ['APAC', '$1,090M', '$900M', '+21.1%'],
      ['Latin America', '$510M', '$480M', '+6.2%'],
    ] : [];

    const headers: string[] = pageContent?.headers || defaultHeaders;
    const rows: string[][] = pageContent?.rows || defaultRows;
    const startRow: number = pageContent?.startRow || 1;

    return (
      <div className="paper is-spreadsheet">
        <div className="spreadsheet-header-bar">
          <div>
            <span className="micro-label">SPREADSHEET WORKBOOK</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
              {docName}
            </div>
          </div>
          <div className="spreadsheet-meta-tags">
            <button
              className={`sheet-tag ${csvViewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setCsvViewMode('grid')}
              style={{ cursor: 'pointer' }}
            >
              Spreadsheet Grid
            </button>
            <button
              className={`sheet-tag ${csvViewMode === 'raw' ? 'active' : ''}`}
              onClick={() => setCsvViewMode('raw')}
              style={{ cursor: 'pointer' }}
            >
              Raw CSV Source
            </button>
            <span className="sheet-tag active">Page {currentPage} of {totalPages}</span>
            <span className="sheet-tag">{rows.length} rows on page</span>
            <span className="sheet-tag">{headers.length} columns</span>
            <a
              href={`/api/documents/${documentId}/raw`}
              download={docName}
              className="sheet-tag action-link"
              title="Download original file"
            >
              <Download size={12} /> Download
            </a>
          </div>
        </div>

        {csvViewMode === 'raw' ? (
          <div className="json-code-box">
            {(docRecord?.raw_content || [headers.join(','), ...rows.map(r => r.join(','))].join('\n')).split('\n').map((line, idx) => (
              <div key={idx} className="json-line">
                <span className="json-line-no">{idx + 1}</span>
                <span className="json-line-content">{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="spreadsheet-table-container">
          {rows.length > 0 ? (
            <table className="spreadsheet-grid">
              <thead>
                <tr>
                  <th className="col-index">#</th>
                  {headers.map((h, i) => (
                    <th key={i}>{String.fromCharCode(65 + (i % 26))}{i >= 26 ? Math.floor(i / 26) : ''} · {h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => {
                  const rowNum = startRow + rIdx;
                  const matchingBlock = pageBlocks.find(b => b.id.includes(`_${rIdx + 1}`) || b.id.includes(`_${String(rIdx + 1).padStart(2, '0')}`)) || pageBlocks[rIdx];
                  const isSelected = matchingBlock && matchingBlock.id === selectedBlockId;

                  return (
                    <tr
                      key={rIdx}
                      className={isSelected ? 'is-selected' : ''}
                      onClick={() => matchingBlock && onSelectBlock(matchingBlock.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="row-index">{rowNum}</td>
                      {row.map((cell, cIdx) => {
                        const isNum = !isNaN(Number(String(cell).replace(/[$,%]/g, ''))) && String(cell).trim() !== '';
                        return (
                          <td key={cIdx} className={isNum ? 'numeric-cell' : ''}>
                            {masked && (String(cell).includes('@') || /^\+?\d{3,}/.test(String(cell))) ? '••••••••' : cell}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-soft)' }}>
              <FileSpreadsheet size={32} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>Spreadsheet Layout Parsed</div>
              <p style={{ marginTop: '4px' }}>Extracted table records mapped for {docName}. Use the export tab to download structured CSV or JSON.</p>
            </div>
          )}
        </div>
      )}

        <div className="spreadsheet-status-bar">
          <span>
            <CircleCheck size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: 'var(--green)' }} />
            TABULAR RECONCILIATION · Coordinate provenance active
          </span>
          <span>Page {currentPage} of {totalPages} · {pageContent?.totalRows || rows.length} records</span>
        </div>

        {masked && (
          <div className="mask-overlay">
            <span>MASKED</span>
            <span>MASKED</span>
          </div>
        )}
      </div>
    );
  }

  // 2. JSON DOCUMENT VIEW
  if (docFormat === 'json') {
    const jsonText: string = pageContent?.jsonText || docRecord?.raw_content || (blocks.length > 0 ? JSON.stringify(blocks.map(b => ({ [b.label || b.id]: b.content })), null, 2) : '{\n  "status": "parsed"\n}');
    const lines = jsonText.split('\n');
    const startLine: number = pageContent?.startLine || 1;

    // Extract table rows for structured Table View directly from browsed JSON
    let tableHeaders: string[] = pageContent?.tableData?.headers || [];
    let tableRows: string[][] = pageContent?.tableData?.rows || [];

    if (tableHeaders.length === 0 || tableRows.length === 0) {
      let parsedData = pageContent?.parsedData;
      if (!parsedData && (docRecord?.raw_content || jsonText)) {
        try {
          parsedData = JSON.parse(docRecord?.raw_content || jsonText);
        } catch {
          // ignore
        }
      }

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const keys = Array.from(new Set(parsedData.flatMap(item => typeof item === 'object' && item ? Object.keys(item) : [])));
        tableHeaders = keys.length > 0 ? keys : ['Item'];
        tableRows = parsedData.map(item => {
          if (typeof item === 'object' && item) {
            return tableHeaders.map(k => typeof item[k] === 'object' ? JSON.stringify(item[k]) : String(item[k] ?? ''));
          }
          return [String(item)];
        });
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        // Check if there is an array property inside the object (e.g. data, items, records)
        const arrayPropKey = Object.keys(parsedData).find(k => Array.isArray(parsedData[k]) && parsedData[k].length > 0 && typeof parsedData[k][0] === 'object');
        if (arrayPropKey) {
          const arr = parsedData[arrayPropKey];
          const keys: string[] = Array.from(new Set(arr.flatMap((item: any) => typeof item === 'object' && item ? Object.keys(item) : [])));
          tableHeaders = keys;
          tableRows = arr.map((item: any) => {
            return tableHeaders.map(k => typeof item[k] === 'object' ? JSON.stringify(item[k]) : String(item[k] ?? ''));
          });
        } else {
          tableHeaders = ['Property / Key', 'Extracted Value', 'Type'];
          tableRows = Object.entries(parsedData).map(([k, v]) => [
            k,
            typeof v === 'object' ? JSON.stringify(v) : String(v),
            typeof v,
          ]);
        }
      } else if (pageBlocks.length > 0) {
        tableHeaders = ['Block ID', 'Property / Field', 'Extracted Value'];
        tableRows = pageBlocks.map(b => [b.id, b.label || b.type, b.content]);
      }
    }

    return (
      <div className="paper is-json-doc">
        <div className="json-header-bar">
          <div>
            <span className="micro-label">JSON DATA SPECIFICATION</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
              {docName}
            </div>
          </div>
          <div className="spreadsheet-meta-tags">
            <button
              className={`sheet-tag ${jsonViewMode === 'table' ? 'active' : ''}`}
              onClick={() => setJsonViewMode('table')}
              style={{ cursor: 'pointer' }}
            >
              Data Table ({tableRows.length})
            </button>
            <button
              className={`sheet-tag ${jsonViewMode === 'ast' ? 'active' : ''}`}
              onClick={() => setJsonViewMode('ast')}
              style={{ cursor: 'pointer' }}
            >
              JSON AST
            </button>
            <span className="sheet-tag">Page {currentPage} of {totalPages}</span>
            <span className="sheet-tag">{lines.length} lines</span>
            <a
              href={`/api/documents/${documentId}/raw`}
              download={docName}
              className="sheet-tag action-link"
              title="Download original file"
            >
              <Download size={12} /> Download
            </a>
          </div>
        </div>

        {jsonViewMode === 'table' && tableRows.length > 0 ? (
          <div className="spreadsheet-table-container">
            <table className="spreadsheet-grid">
              <thead>
                <tr>
                  <th className="col-index">#</th>
                  {tableHeaders.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rIdx) => {
                  const matchingBlock = pageBlocks[rIdx];
                  const isSelected = matchingBlock && matchingBlock.id === selectedBlockId;
                  return (
                    <tr
                      key={rIdx}
                      className={isSelected ? 'is-selected' : ''}
                      onClick={() => matchingBlock && onSelectBlock(matchingBlock.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="row-index">{rIdx + 1}</td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{cell}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="json-code-box">
            {lines.map((line, idx) => {
              const lineNum = startLine + idx;
              const isKey = line.includes('":');
              const isStr = line.includes('"') && !isKey;
              const isNum = /\b\d+(\.\d+)?\b/.test(line);
              const isBool = /\b(true|false|null)\b/.test(line);

              return (
                <div key={idx} className="json-line">
                  <span className="json-line-no">{lineNum}</span>
                  <span className="json-line-content">
                    {isKey ? (
                      <>
                        <span className="json-key">{line.split('":')[0]}"</span>:
                        <span className={isStr ? 'json-str' : isNum ? 'json-num' : isBool ? 'json-bool' : ''}>
                          {line.split('":').slice(1).join('":')}
                        </span>
                      </>
                    ) : (
                      <span className={isStr ? 'json-str' : isNum ? 'json-num' : isBool ? 'json-bool' : ''}>
                        {line}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {pageBlocks.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="micro-label" style={{ width: '100%' }}>IDENTIFIED SEMANTIC BLOCKS (CLICK TO INSPECT):</span>
            {pageBlocks.map(b => (
              <button
                key={b.id}
                className={`sheet-tag ${b.id === selectedBlockId ? 'active' : ''}`}
                onClick={() => onSelectBlock(b.id)}
                style={{ cursor: 'pointer' }}
              >
                <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{b.id}</span> · {b.label || b.type}
              </button>
            ))}
          </div>
        )}

        <div className="spreadsheet-status-bar">
          <span>
            <CircleCheck size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: 'var(--green)' }} />
            STRICT JSON SCHEMA · Validated & Provenance Mapped
          </span>
          <span>Page {currentPage} of {totalPages} · {tableRows.length} structured records</span>
        </div>

        {masked && (
          <div className="mask-overlay">
            <span>MASKED</span>
            <span>MASKED</span>
          </div>
        )}
      </div>
    );
  }

  // 3. MARKDOWN VIEW
  if (docFormat === 'markdown') {
    const content: string = pageContent?.content || docRecord?.raw_content || '';
    const rawLines: string[] = pageContent?.lines || content.split(/\r?\n/).filter((l: string) => l.trim().length > 0);

    // Extract any markdown tables from the browsed document
    let mdTables: Array<{ name: string; headers: string[]; rows: string[][] }> = pageContent?.tables || [];
    if (mdTables.length === 0) {
      let currentTableLines: string[] = [];
      let lastHeading = '';
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (line.startsWith('#')) lastHeading = line.replace(/^#+\s*/, '');
        if (line.includes('|') && (line.startsWith('|') || line.endsWith('|') || (line.match(/\|/g) || []).length >= 2)) {
          currentTableLines.push(line);
        } else {
          if (currentTableLines.length >= 2) {
            const splitRow = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
            const headers = splitRow(currentTableLines[0]);
            const dataLines = currentTableLines.slice(1).filter(l => l.replace(/[\s|:-]/g, '').length > 0);
            const rows = dataLines.map(splitRow);
            if (headers.length > 0 && rows.length > 0) {
              mdTables.push({ name: lastHeading || 'Markdown Table', headers, rows });
            }
          }
          currentTableLines = [];
        }
      }
      if (currentTableLines.length >= 2) {
        const splitRow = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        const headers = splitRow(currentTableLines[0]);
        const dataLines = currentTableLines.slice(1).filter(l => l.replace(/[\s|:-]/g, '').length > 0);
        const rows = dataLines.map(splitRow);
        if (headers.length > 0 && rows.length > 0) {
          mdTables.push({ name: lastHeading || 'Markdown Table', headers, rows });
        }
      }
    }

    // Fallback key-values table if no pipe table exists in browsed markdown
    let fallbackHeaders: string[] = [];
    let fallbackRows: string[][] = [];
    if (mdTables.length === 0) {
      const kvLines = rawLines.filter((l: string) => /^\s*[-*]?\s*[\w\s]+:\s*.+/.test(l));
      if (kvLines.length > 0) {
        fallbackHeaders = ['Field / Key', 'Extracted Value'];
        fallbackRows = kvLines.slice(0, 50).map((l: string) => {
          const clean = l.replace(/^\s*[-*]\s*/, '');
          const colonIdx = clean.indexOf(':');
          return [clean.slice(0, colonIdx).trim(), clean.slice(colonIdx + 1).trim()];
        });
      } else {
        fallbackHeaders = ['Line #', 'Block Type', 'Markdown Content'];
        fallbackRows = rawLines.slice(0, 30).map((l: string, idx: number) => [
          String(idx + 1),
          l.startsWith('#') ? 'Heading' : l.startsWith('-') || l.startsWith('*') ? 'List Item' : 'Paragraph',
          l.replace(/^#+\s*/, ''),
        ]);
      }
    }

    const activeHeaders = mdTables.length > 0 ? mdTables[0].headers : fallbackHeaders;
    const activeRows = mdTables.length > 0 ? mdTables[0].rows : fallbackRows;
    const activeTableName = mdTables.length > 0 ? mdTables[0].name : `${docName} Data`;

    // Parse lines into structured elements (including inline pipe tables)
    type Element =
      | { type: 'heading'; level: number; text: string; idx: number }
      | { type: 'list'; text: string; idx: number }
      | { type: 'blockquote'; text: string; idx: number }
      | { type: 'table'; headers: string[]; rows: string[][]; idx: number }
      | { type: 'paragraph'; text: string; idx: number };

    const elements: Element[] = [];
    let tempTableLines: string[] = [];
    let tempTableStartIdx = 0;

    const flushTable = () => {
      if (tempTableLines.length >= 2) {
        const splitRow = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        const headers = splitRow(tempTableLines[0]);
        const dataLines = tempTableLines.slice(1).filter(l => l.replace(/[\s|:-]/g, '').length > 0);
        const rows = dataLines.map(splitRow);
        if (headers.length > 0 && rows.length > 0) {
          elements.push({ type: 'table', headers, rows, idx: tempTableStartIdx });
        }
      } else {
        tempTableLines.forEach((l, i) => {
          elements.push({ type: 'paragraph', text: l, idx: tempTableStartIdx + i });
        });
      }
      tempTableLines = [];
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      const isPipeLine = line.includes('|') && (line.startsWith('|') || line.endsWith('|') || (line.match(/\|/g) || []).length >= 2);
      if (isPipeLine) {
        if (tempTableLines.length === 0) tempTableStartIdx = i;
        tempTableLines.push(line);
      } else {
        if (tempTableLines.length > 0) flushTable();

        if (line.startsWith('# ')) elements.push({ type: 'heading', level: 1, text: line.replace(/^#\s+/, ''), idx: i });
        else if (line.startsWith('## ')) elements.push({ type: 'heading', level: 2, text: line.replace(/^##\s+/, ''), idx: i });
        else if (line.startsWith('### ')) elements.push({ type: 'heading', level: 3, text: line.replace(/^###\s+/, ''), idx: i });
        else if (line.startsWith('- ') || line.startsWith('* ')) elements.push({ type: 'list', text: line.replace(/^[-*]\s+/, ''), idx: i });
        else if (line.startsWith('> ')) elements.push({ type: 'blockquote', text: line.replace(/^>\s+/, ''), idx: i });
        else if (line.length > 0) elements.push({ type: 'paragraph', text: line, idx: i });
      }
    }
    if (tempTableLines.length > 0) flushTable();

    return (
      <div className="paper is-markdown-doc">
        <div className="markdown-header-bar">
          <div>
            <span className="micro-label">STRUCTURED MARKDOWN CANVAS</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
              {docName}
            </div>
          </div>
          <div className="spreadsheet-meta-tags">
            <button
              className={`sheet-tag ${mdViewMode === 'doc' ? 'active' : ''}`}
              onClick={() => setMdViewMode('doc')}
              style={{ cursor: 'pointer' }}
            >
              Document View
            </button>
            <button
              className={`sheet-tag ${mdViewMode === 'table' ? 'active' : ''}`}
              onClick={() => setMdViewMode('table')}
              style={{ cursor: 'pointer' }}
            >
              Data Table ({activeRows.length})
            </button>
            <button
              className={`sheet-tag ${mdViewMode === 'raw' ? 'active' : ''}`}
              onClick={() => setMdViewMode('raw')}
              style={{ cursor: 'pointer' }}
            >
              Raw Source
            </button>
            <span className="sheet-tag">Page {currentPage} of {totalPages}</span>
            <span className="sheet-tag">{rawLines.length} lines</span>
            <a
              href={`/api/documents/${documentId}/raw`}
              download={docName}
              className="sheet-tag action-link"
              title="Download original file"
            >
              <Download size={12} /> Download
            </a>
          </div>
        </div>

        {mdViewMode === 'table' ? (
          <div style={{ padding: '8px 0' }}>
            <div style={{ padding: '8px 16px', background: 'var(--panel)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="micro-label">{activeTableName.toUpperCase()} · EXTRACTED TABLE</span>
              <span className="sheet-tag">{activeRows.length} rows · {activeHeaders.length} columns</span>
            </div>
            <div className="spreadsheet-table-container">
              <table className="spreadsheet-grid">
                <thead>
                  <tr>
                    <th className="col-index">#</th>
                    {activeHeaders.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row, rIdx) => {
                    const matchingBlock = pageBlocks[rIdx];
                    const isSelected = matchingBlock && matchingBlock.id === selectedBlockId;
                    return (
                      <tr
                        key={rIdx}
                        className={isSelected ? 'is-selected' : ''}
                        onClick={() => matchingBlock && onSelectBlock(matchingBlock.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="row-index">{rIdx + 1}</td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx}>{cell}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : mdViewMode === 'raw' ? (
          <div className="json-code-box">
            {rawLines.map((line, idx) => (
              <div key={idx} className="json-line">
                <span className="json-line-no">{idx + 1}</span>
                <span className="json-line-content">{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="markdown-rendered-body">
            {elements.map((el, elIdx) => {
              const matchingBlock = pageBlocks[elIdx] || pageBlocks.find(b => b.content.includes((el as any).text?.slice(0, 20) || ''));
              const isSelected = matchingBlock && matchingBlock.id === selectedBlockId;

              if (el.type === 'heading') {
                const Tag = el.level === 1 ? 'h1' : el.level === 2 ? 'h2' : 'h3';
                return (
                  <Tag
                    key={elIdx}
                    className={`markdown-block-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => matchingBlock && onSelectBlock(matchingBlock.id)}
                  >
                    {el.text}
                  </Tag>
                );
              }

              if (el.type === 'list') {
                return (
                  <ul key={elIdx}>
                    <li
                      className={`markdown-block-chip ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => matchingBlock && onSelectBlock(matchingBlock.id)}
                    >
                      {el.text}
                    </li>
                  </ul>
                );
              }

              if (el.type === 'blockquote') {
                return (
                  <blockquote
                    key={elIdx}
                    className={`markdown-block-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => matchingBlock && onSelectBlock(matchingBlock.id)}
                  >
                    {el.text}
                  </blockquote>
                );
              }

              if (el.type === 'table') {
                return (
                  <div key={elIdx} className="spreadsheet-table-container" style={{ margin: '16px 0', border: '1px solid var(--line)', borderRadius: '6px', background: 'var(--panel)' }}>
                    <table className="spreadsheet-grid">
                      <thead>
                        <tr>
                          <th className="col-index">#</th>
                          {el.headers.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {el.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="row-index">{rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              return (
                <p
                  key={elIdx}
                  className={`markdown-block-chip ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => matchingBlock && onSelectBlock(matchingBlock.id)}
                >
                  {el.text}
                </p>
              );
            })}
          </div>
        )}

        <div className="spreadsheet-status-bar">
          <span>
            <CircleCheck size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: 'var(--green)' }} />
            READING ORDER PRESERVED · AST hierarchy & tables intact
          </span>
          <span>Page {currentPage} of {totalPages} · {activeRows.length} structured records</span>
        </div>

        {masked && (
          <div className="mask-overlay">
            <span>MASKED</span>
          </div>
        )}
      </div>
    );
  }

  // 4. ORIGINAL PDF DOCUMENT VIEW
  if (docFormat === 'pdf') {
    return (
      <div className="paper is-original-pdf">
        <div className="pdf-header-bar">
          <div className="pdf-header-title">
            <span className="micro-label">ORIGINAL INPUT DOCUMENT · NATIVE PDF FORMAT</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} style={{ color: 'var(--cyan)' }} />
              <span>{docName}</span>
            </div>
          </div>
          <div className="spreadsheet-meta-tags">
            <button
              className={`sheet-tag ${pdfViewMode === 'original' ? 'active' : ''}`}
              onClick={() => setPdfViewMode('original')}
              style={{ cursor: 'pointer' }}
            >
              Original PDF Format
            </button>
            <button
              className={`sheet-tag ${pdfViewMode === 'extracted' ? 'active' : ''}`}
              onClick={() => setPdfViewMode('extracted')}
              style={{ cursor: 'pointer' }}
            >
              Extracted Blocks ({pageBlocks.length})
            </button>
            <span className="sheet-tag">Page {currentPage} of {totalPages}</span>
            <a
              href={`/api/documents/${documentId}/raw`}
              target="_blank"
              rel="noreferrer"
              className="sheet-tag action-link"
              title="Open raw original PDF in new browser tab"
            >
              <Maximize2 size={12} /> Open Full
            </a>
            <a
              href={`/api/documents/${documentId}/raw`}
              download={docName}
              className="sheet-tag action-link"
              title="Download original input PDF"
            >
              <Download size={12} /> Download
            </a>
          </div>
        </div>

        {pdfViewMode === 'original' ? (
          <div className="pdf-frame-wrapper">
            <iframe
              key={`${documentId}-p${currentPage}`}
              src={`/api/documents/${documentId}/raw#page=${currentPage}&toolbar=1&navpanes=0`}
              className="original-pdf-frame"
              title={`${docName} - Page ${currentPage}`}
            />
          </div>
        ) : (
          <div className="pdf-extracted-wrapper">
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="micro-label">EXTRACTED SEMANTIC BLOCKS & TABLES (PAGE {currentPage})</span>
              <span className="sheet-tag">{pageBlocks.length} blocks mapped</span>
            </div>
            {pageBlocks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pageBlocks.map(b => (
                  <div
                    key={b.id}
                    onClick={() => onSelectBlock(b.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      background: selectedBlockId === b.id ? '#69e5ff18' : 'var(--panel)',
                      border: selectedBlockId === b.id ? '1px solid var(--cyan)' : '1px solid var(--line)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', fontWeight: 700 }}>
                        {b.id} · {b.label || b.type.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                        {Math.round(b.confidence * 100)}% conf · {b.language || 'English'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                      {masked && (b.content.includes('@') || /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(b.content))
                        ? b.content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '••••••••••••••••')
                        : b.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <p>No semantic blocks extracted on page {currentPage}. Switch to Original PDF Format to view full page.</p>
              </div>
            )}
          </div>
        )}

        <div className="spreadsheet-status-bar">
          <span>
            <CircleCheck size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: 'var(--green)' }} />
            ORIGINAL INPUT DOCUMENT · Rendered in native PDF format with coordinate provenance
          </span>
          <span>Page {currentPage} of {totalPages} · {pageBlocks.length} blocks mapped</span>
        </div>

        {masked && (
          <div className="mask-overlay">
            <span>MASKED</span>
            <span>MASKED</span>
          </div>
        )}
      </div>
    );
  }

  // 5. ORIGINAL IMAGE / SCANNED DOCUMENT VIEW
  if (docFormat === 'image') {
    return (
      <div className="paper is-image-doc">
        <div className="pdf-header-bar">
          <div>
            <span className="micro-label">ORIGINAL INPUT DOCUMENT · IMAGE FORMAT</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
              {docName}
            </div>
          </div>
          <div className="spreadsheet-meta-tags">
            <span className="sheet-tag active">Page {currentPage} of {totalPages}</span>
            <span className="sheet-tag">{pageBlocks.length} blocks detected</span>
            <a
              href={`/api/documents/${documentId}/raw`}
              target="_blank"
              rel="noreferrer"
              className="sheet-tag action-link"
            >
              <Maximize2 size={12} /> Full Image
            </a>
            <a
              href={`/api/documents/${documentId}/raw`}
              download={docName}
              className="sheet-tag action-link"
            >
              <Download size={12} /> Download
            </a>
          </div>
        </div>

        <div className="image-preview-container">
          <img src={`/api/documents/${documentId}/raw`} alt={docName} className="original-image-preview" />
        </div>

        <div className="spreadsheet-status-bar">
          <span>
            <CircleCheck size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: 'var(--green)' }} />
            ORIGINAL IMAGE FORMAT · Visual layout preserved
          </span>
          <span>{pageBlocks.length} blocks mapped</span>
        </div>
      </div>
    );
  }

  // 6. GENERAL / FALLBACK DOCUMENT VIEW
  return (
    <div className="paper is-original-pdf">
      <div className="pdf-header-bar">
        <div>
          <span className="micro-label">ORIGINAL INPUT DOCUMENT</span>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
            {docName}
          </div>
        </div>
        <div className="spreadsheet-meta-tags">
          <span className="sheet-tag active">Page {currentPage} of {totalPages}</span>
          <span className="sheet-tag">{pageBlocks.length} blocks</span>
          <a
            href={`/api/documents/${documentId}/raw`}
            download={docName}
            className="sheet-tag action-link"
          >
            <Download size={12} /> Download Original
          </a>
        </div>
      </div>

      <div className="pdf-extracted-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pageBlocks.map(b => (
            <div
              key={b.id}
              onClick={() => onSelectBlock(b.id)}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                background: selectedBlockId === b.id ? '#69e5ff18' : 'var(--panel)',
                border: selectedBlockId === b.id ? '1px solid var(--cyan)' : '1px solid var(--line)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', fontWeight: 700 }}>
                  {b.id} · {b.label || b.type.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                  {Math.round(b.confidence * 100)}% · {b.language || 'English'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>
                {b.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="spreadsheet-status-bar">
        <span>
          <CircleCheck size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: 'var(--green)' }} />
          DOCUMENT EXTRACTED · Provenance mapped
        </span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// WORKSPACE COMPONENT
// ----------------------------------------------------
export default function App() {
  const [screen, setScreen] = useState<'landing' | 'processing' | 'workspace'>('landing');
  const [activeView, setActiveView] = useState('document');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('atlas-demo');
  const [activeDocId, setActiveDocId] = useState<string>('doc-annual-report-2024');

  const [activeDoc, setActiveDoc] = useState<DocumentRecord | null>(null);

  // Document state
  const [blocks, setBlocks] = useState<SemanticBlock[]>([]);
  const [validations, setValidations] = useState<ValidationCheck[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState('A72');
  const [currentPage, setCurrentPage] = useState(7);
  const [masked, setMasked] = useState(false);

  // Modals & toast
  const [showAddProject, setShowAddProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: string } | null>(null);

  // Theme
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>(() => {
    const saved = localStorage.getItem('atlas-theme');
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const showToast = (message: string, tone = 'info') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3600);
  };

  // Sync theme
  useEffect(() => {
    localStorage.setItem('atlas-theme', themePreference);
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const mode = themePreference === 'light' || (themePreference === 'system' && media.matches) ? 'light' : 'dark';
      document.documentElement.dataset.theme = mode;
    };
    apply();
    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, [themePreference]);

  // Load initial projects from API
  useEffect(() => {
    api.fetchProjects().then((projs) => {
      setProjects(projs);
      if (projs.length > 0 && !projs.find(p => p.id === currentProjectId)) {
        setCurrentProjectId(projs[0].id);
      }
    }).catch(console.error);
  }, []);

  // When active document or screen changes to workspace, fetch blocks & validations
  useEffect(() => {
    if (screen === 'workspace') {
      api.fetchDocument(activeDocId).then((doc) => {
        setActiveDoc(doc);
        if (doc && doc.id !== 'doc-annual-report-2024') {
          setCurrentPage(1);
        }
      }).catch(console.error);
      api.fetchBlocks(activeDocId).then((bList) => {
        setBlocks(bList);
        if (bList.length > 0) {
          const matching = bList.find(b => b.id === selectedBlockId) || bList.find(b => b.page === currentPage) || bList[0];
          if (matching) setSelectedBlockId(matching.id);
        }
      }).catch(console.error);
      api.fetchValidations(activeDocId).then(setValidations).catch(console.error);
      api.fetchReviews(activeDocId).then(setReviews).catch(console.error);
    }
  }, [screen, activeDocId]);

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === currentProjectId) || projects[0] || {
      id: 'atlas-demo',
      name: 'ParseAnything Demo',
      document: 'Annual_Report.pdf',
      pages: 24,
      size: '18.4 MB',
      confidence: '96%',
    };
  }, [projects, currentProjectId]);

  const currentDocName = activeDoc?.filename || currentProject.document;
  const totalPages = activeDoc?.page_count || currentProject.pages || 1;
  const docFormat: DocumentRecord['parsed_format'] = activeDoc?.parsed_format || (
    currentDocName.endsWith('.json') ? 'json' :
    currentDocName.endsWith('.csv') || currentDocName.endsWith('.tsv') || currentDocName.endsWith('.xlsx') ? 'csv' :
    currentDocName.endsWith('.md') || currentDocName.endsWith('.txt') ? 'markdown' : 'pdf'
  );
  const isDemoDoc = activeDocId === 'doc-annual-report-2024' || currentDocName === 'Annual_Report.pdf';
  const pageContent = activeDoc?.page_contents?.[currentPage];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const blockOnPage = blocks.find(b => b.page === newPage);
    if (blockOnPage) {
      setSelectedBlockId(blockOnPage.id);
    }
  };

  const selectedBlock = useMemo(() => {
    return blocks.find(b => b.id === selectedBlockId) || blocks.find(b => b.page === currentPage) || blocks[0] || {
      id: 'A72',
      type: 'table_cell' as const,
      label: 'Table cell',
      content: 'North America · 2024 revenue: $4,620M (+10.5% YoY)',
      page: 7,
      confidence: 0.98,
      language: 'English',
      bbox: { x: 120, y: 340, width: 330, height: 50 },
      bbox_formatted: 'x 120 · y 340 · w 330 · h 50',
      reading_order: '07.12',
      status: 'verified' as const,
      color: 'cyan' as const,
    };
  }, [blocks, selectedBlockId, currentPage]);

  const detectedLanguages = useMemo(() => {
    const set = new Set<string>();
    if (activeDoc?.detected_language) set.add(activeDoc.detected_language);
    if (activeDoc?.languages) activeDoc.languages.forEach(l => set.add(l));
    blocks.forEach(b => {
      if (b.language && !['CSV/Table', 'JSON', 'Markdown'].includes(b.language)) {
        set.add(b.language);
      }
    });
    const list = Array.from(set);
    return list.length > 0 ? list : ['English'];
  }, [activeDoc, blocks]);

  const primaryLanguage = detectedLanguages[0] || activeDoc?.detected_language || 'English';

  const handleStartDemo = async () => {
    try {
      const doc = await api.uploadDocument('atlas-demo');
      setActiveDocId(doc.id);
      setActiveDoc(doc);
      setCurrentPage(7);
      setSelectedBlockId('A72');
      setScreen('processing');
    } catch (e) {
      setScreen('processing');
    }
  };

  const handleUploadFile = async (file?: File) => {
    try {
      const doc = await api.uploadDocument(currentProjectId, file);
      setActiveDocId(doc.id);
      setActiveDoc(doc);
      setCurrentPage(1);
      setSelectedBlockId('');
      const projs = await api.fetchProjects();
      setProjects(projs);
      setScreen('processing');
    } catch (e) {
      setScreen('processing');
    }
  };

  const handleCreateProject = async (name: string) => {
    try {
      const proj = await api.createProject(name);
      setProjects(prev => [...prev, proj]);
      setCurrentProjectId(proj.id);
      setShowAddProject(false);
      showToast(`Project "${proj.name}" created`, 'success');
    } catch (e) {
      showToast('Failed to create project', 'warning');
    }
  };

  if (screen === 'landing') {
    return (
      <LandingScreen
        onStartDemo={handleStartDemo}
        onUploadFile={handleUploadFile}
      />
    );
  }

  if (screen === 'processing') {
    return (
      <ProcessingScreen
        documentId={activeDocId}
        docRecord={activeDoc}
        onComplete={() => setScreen('workspace')}
        onReturnHome={() => setScreen('landing')}
      />
    );
  }

  return (
    <main className="workspace-screen">
      {/* Workspace Topbar */}
      <header className="workspace-topbar">
        <div className="topbar-left">
          <AtlasBrand small onClick={() => setScreen('landing')} />
          <div className="topbar-divider" />
          <div className="crumb">
            <span>WORKSPACE</span>
            <b>{WORKFLOW_NAV.find(n => n.id === activeView)?.label || 'Document'}</b>
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="topbar-center">
          <div className="doc-chip">
            {docFormat === 'json' ? <FileJson size={15} /> : docFormat === 'csv' || docFormat === 'spreadsheet' ? <FileSpreadsheet size={15} /> : <FileText size={15} />}
            <span>{currentDocName}</span>
            <span className="doc-pages">{totalPages} {totalPages === 1 ? 'page' : 'pages'}</span>
          </div>
          <StatusPill tone="green">PARSED</StatusPill>
          <StatusPill tone="cyan"><span style={{ marginRight: 3 }}>🌐</span> {primaryLanguage}</StatusPill>
        </div>

        <div className="topbar-right">
          <label className="secondary-button small" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FolderOpen size={14} />
            <span>Browse file</span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.pptx,.ppt,.txt,.md,.json,.csv,.tsv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadFile(f);
              }}
            />
          </label>
          <button className="topbar-search" onClick={() => showToast(`Search active across ${blocks.length} blocks`, 'info')}>
            <Search size={15} />
            <span>Search blocks</span>
            <kbd>⌘ K</kbd>
          </button>
          <button className="topbar-export" onClick={() => setActiveView('export')}>
            <Download size={15} /> Export
          </button>
          <button className="icon-button ghost"><Activity size={16} /></button>
        </div>
      </header>

      <div className="workspace-body">
        {/* Side Rail */}
        <aside className="side-rail">
          <div className="rail-project-area">
            <button
              className="project-switcher"
              onClick={() => setShowAddProject(true)}
              aria-label="Switch or add project"
            >
              <span className="rail-section-label">PROJECT</span>
              <span className="project-switcher-name">
                <b>{currentProject.name}</b>
                <ChevronDown size={14} />
              </span>
            </button>
            <button className="add-project-button" onClick={() => setShowAddProject(true)}>
              <Plus size={13} /> Add project
            </button>
          </div>

          <div className="rail-document">
            <div className="rail-file-icon">
              {docFormat === 'json' ? <FileJson size={17} /> : docFormat === 'csv' || docFormat === 'spreadsheet' ? <FileSpreadsheet size={17} /> : <FileText size={17} />}
            </div>
            <div>
              <b>{currentDocName}</b>
              <span>{totalPages} {totalPages === 1 ? 'page' : 'pages'} · {activeDoc?.file_size_formatted || currentProject.size}</span>
            </div>
            <button className="more-button"><Ellipsis size={17} /></button>
          </div>

          <div className="rail-status">
            <span><i className="live-dot" /> Processing complete</span>
            <span>{currentProject.confidence}</span>
          </div>

          <div className="rail-section-label">WORKFLOW</div>
          <nav className="workflow-nav">
            {WORKFLOW_NAV.map(nav => {
              const Icon = nav.icon;
              const isActive = activeView === nav.id;
              return (
                <button
                  key={nav.id}
                  className={`workflow-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveView(nav.id)}
                >
                  <Icon size={16} />
                  <span>{nav.label}</span>
                  {nav.count && (
                    <span className={`nav-count ${nav.id === 'review' ? 'amber' : ''}`}>{nav.count}</span>
                  )}
                  {isActive && <span className="active-rail" />}
                </button>
              );
            })}
          </nav>

          <div className="rail-insight">
            <div className="insight-icon"><Sparkles size={15} /></div>
            <div>
              <span>TRUST SIGNAL</span>
              <b>2 blocks need a human read</b>
              <p>Atlas found uncertainty, not failure.</p>
            </div>
            <button onClick={() => setActiveView('review')}><ArrowRight size={14} /></button>
          </div>

          <div className="rail-bottom">
            <button className="rail-bottom-item" onClick={() => setShowSettings(true)}>
              <Settings2 size={16} /> Settings
            </button>
            <button className="rail-bottom-item">
              <span className="help-icon">?</span> Help center
            </button>
          </div>
        </aside>

        {/* Workspace Main Area */}
        <section className="workspace-main">
          {activeView === 'document' && (
            <div className="three-panel">
              <section className="center-panel">
                <div className="center-panel-top">
                  <div>
                    <span className="micro-label">DOCUMENT / EVIDENCE CANVAS</span>
                    <h1>{currentProject.name} <span>/ {currentDocName}</span></h1>
                  </div>
                  <div className="center-actions">
                    <button className="secondary-button small" onClick={() => showToast(`Showing blocks on page ${currentPage}`, 'info')}>
                      Filter blocks
                    </button>
                    <button className="icon-button subtle"><Ellipsis size={16} /></button>
                  </div>
                </div>

                {/* Document View Canvas */}
                <div className="document-view">
                  <div className="viewer-toolbar">
                    <div className="viewer-title">
                      <span className="micro-label">SOURCE VIEW</span>
                      <b>Page {currentPage} <span>/ {totalPages}</span></b>
                    </div>
                    <div className="viewer-tools">
                      <button className="viewer-tool" onClick={() => handlePageChange(Math.max(1, currentPage - 1))}>
                        <ChevronLeft size={15} />
                      </button>
                      <span className="page-number">{String(currentPage).padStart(2, '0')}</span>
                      <button className="viewer-tool" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}>
                        <ChevronRight size={15} />
                      </button>
                      <div className="tool-separator" />
                      <button className="viewer-tool" onClick={() => showToast('Zoom calibrated', 'info')}>
                        <Maximize2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="viewer-body">
                    <div className="thumbnail-strip">
                      <div className="thumb-label">PAGES</div>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                        <button
                          key={num}
                          className={`page-thumb ${num === currentPage ? 'selected' : ''}`}
                          onClick={() => handlePageChange(num)}
                        >
                          <span className="thumb-number">{String(num).padStart(2, '0')}</span>
                          <div className={`thumb-paper is-${docFormat}`}>
                            <i /><i /><i /><i />
                            {docFormat === 'csv' && <div className="thumb-mini-table" />}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="paper-stage">
                      <div className="stage-topline">
                        <span>{currentDocName.toUpperCase()}</span>
                        <span>DOCUMENT / PAGE {String(currentPage).padStart(2, '0')} OF {String(totalPages).padStart(2, '0')}</span>
                      </div>

                      <DocumentPageCanvas
                        documentId={activeDocId}
                        docName={currentDocName}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        docFormat={docFormat}
                        isDemoDoc={isDemoDoc}
                        pageContent={pageContent}
                        docRecord={activeDoc}
                        blocks={blocks}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={setSelectedBlockId}
                        masked={masked}
                      />

                      <div className="viewer-foot">
                        <div className="viewer-caption">
                          <span className="caption-signal" /> Selected overlays reflect extracted blocks, not pixels.
                        </div>
                        <label className="mask-toggle">
                          <input type="checkbox" checked={masked} onChange={(e) => setMasked(e.target.checked)} />
                          <span className="toggle-ui" /> Mask sensitive data <b>3 detected</b>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Inspector Panel */}
              <aside className="inspector">
                <div className="inspector-head">
                  <div>
                    <span className="micro-label">BLOCK INSPECTOR</span>
                    <h2>{selectedBlock.id} <span>· {selectedBlock.label || selectedBlock.type}</span></h2>
                  </div>
                </div>

                <div className="inspector-selection">
                  <div className={`selection-glyph ${selectedBlock.color || 'cyan'}`}><FileSpreadsheet size={17} /></div>
                  <div>
                    <b>{selectedBlock.content}</b>
                    <span>Selected source block</span>
                  </div>
                </div>

                <section className="inspector-section">
                  <div className="section-heading">
                    <span>CONFIDENCE</span>
                    <StatusPill tone={selectedBlock.status === 'review' ? 'amber' : 'green'}>
                      {selectedBlock.status === 'review' ? 'REVIEW' : 'VERIFIED'}
                    </StatusPill>
                  </div>
                  <div className="confidence-large">
                    <strong>{Math.round(selectedBlock.confidence * 100)}<small>%</small></strong>
                    <div>
                      <ConfidenceBar value={selectedBlock.confidence} />
                      <p>{selectedBlock.status === 'review' ? 'This block needs a human read before export.' : 'High signal, supported by the source geometry.'}</p>
                    </div>
                  </div>
                </section>

                <section className="inspector-section">
                  <div className="section-heading">
                    <span>EXTRACTED CONTENT</span>
                    <button className="tiny-action">Edit</button>
                  </div>
                  <div className="content-box">{selectedBlock.content}</div>
                </section>

                <section className="inspector-section">
                  <div className="section-heading">
                    <span>SOURCE METADATA</span>
                    <span className="verified-label"><CircleCheck size={13} /> traceable</span>
                  </div>
                  <div className="metadata-grid">
                    <span>BLOCK ID<b>{selectedBlock.id}</b></span>
                    <span>TYPE<b>{selectedBlock.type}</b></span>
                    <span>PAGE<b>{selectedBlock.page} / {totalPages}</b></span>
                    <span>LANGUAGE<b>{selectedBlock.language || primaryLanguage}</b></span>
                    <span>READING ORDER<b>{selectedBlock.reading_order}</b></span>
                    <span>BOUNDING BOX<b>{selectedBlock.bbox_formatted}</b></span>
                  </div>
                </section>

                <section className="inspector-section source-section">
                  <div className="section-heading">
                    <span>SOURCE CITATION</span>
                    <button className="tiny-action" onClick={() => { setActiveView('verify'); showToast(`Opened source trace for ${selectedBlock.id}`, 'info'); }}>
                      Open trace <ArrowRight size={12} />
                    </button>
                  </div>
                  <div className="source-citation">
                    <div className="citation-page">p.{selectedBlock.page}</div>
                    <div>
                      <b>{currentDocName}</b>
                      <span>Page {selectedBlock.page}, source region {selectedBlock.bbox_formatted?.split(' · ')[0]}</span>
                    </div>
                    <CircleCheck size={15} />
                  </div>
                </section>

                <button
                  className="inspector-review-btn"
                  onClick={() => {
                    setActiveView(selectedBlock.status === 'review' ? 'review' : 'verify');
                    showToast(selectedBlock.status === 'review' ? 'Review queue focused on block' : `Verifying source ${selectedBlock.id}`, 'info');
                  }}
                >
                  {selectedBlock.status === 'review' ? (
                    <><CircleAlert size={15} /> Open review queue</>
                  ) : (
                    <><Highlighter size={15} /> Verify this block</>
                  )}
                </button>
              </aside>
            </div>
          )}

          {/* Understand View */}
          {activeView === 'understand' && (
            <div className="content-view">
              <div className="view-header">
                <div>
                  <span className="micro-label">02 / SEMANTIC STRUCTURE</span>
                  <h1>Understand</h1>
                  <p>A readable map of how Atlas interpreted the document — blocks, order, language and confidence.</p>
                </div>
                <button className="secondary-button small" onClick={() => showToast('Blocks filtered', 'info')}>
                  Filter by type
                </button>
              </div>

              <div className="understand-summary">
                <div className="summary-stat">
                  <span>STRUCTURED BLOCKS</span>
                  <b>{blocks.length || 42}</b>
                  <small>across {totalPages} {totalPages === 1 ? 'page' : 'pages'}</small>
                </div>
                <div className="summary-stat">
                  <span>READING ORDER</span>
                  <b>99.1%</b>
                  <small>reconstructed</small>
                </div>
                <div className="summary-stat">
                  <span>LANGUAGES</span>
                  <b>{String(detectedLanguages.length).padStart(2, '0')}</b>
                  <small>{detectedLanguages.length > 1 ? `${detectedLanguages.join(', ')}` : `${primaryLanguage} detected`}</small>
                </div>
                <div className="summary-stat accent">
                  <span>NEEDS REVIEW</span>
                  <b>02</b>
                  <small>human attention</small>
                </div>
              </div>

              <div className="block-table">
                <div className="block-table-head">
                  <span>BLOCK</span>
                  <span>TYPE</span>
                  <span>EXTRACTED CONTENT</span>
                  <span>ORDER</span>
                  <span>CONFIDENCE</span>
                  <span />
                </div>
                {blocks.map(b => (
                  <button
                    key={b.id}
                    className={`block-row ${b.status === 'review' ? 'is-warning' : ''}`}
                    onClick={() => {
                      setSelectedBlockId(b.id);
                      setCurrentPage(b.page);
                      setActiveView('document');
                      showToast(`Block ${b.id} selected in source view`, 'info');
                    }}
                  >
                    <span className="block-id">
                      <span className={`type-glyph ${b.type}`} />
                      {b.id}
                    </span>
                    <span className="block-type">{b.type.replace('_', ' ')}</span>
                    <span className="block-content">{b.content}</span>
                    <span className="block-order">{b.reading_order}</span>
                    <ConfidenceBar value={b.confidence} compact />
                    <span className="row-arrow"><ArrowRight size={14} /></span>
                  </button>
                ))}
              </div>

              <div className="understand-footer">
                <div>
                  <BookOpen size={15} />
                  <b>Reading order is preserved</b>
                  <span>Atlas keeps the relationship between blocks so downstream exports stay legible.</span>
                </div>
                <StatusPill tone="green">SEMANTIC MAP READY</StatusPill>
              </div>
            </div>
          )}

          {/* Validate View */}
          {activeView === 'validate' && (
            <div className="content-view">
              <div className="view-header">
                <div>
                  <span className="micro-label">03 / NUMERICAL INTEGRITY</span>
                  <h1>Validate</h1>
                  <p>
                    {isDemoDoc
                      ? 'Confidence is only useful when the numbers reconcile. Atlas ran 12 checks across 3 detected tables.'
                      : `Grounded verification executed for ${currentDocName}. ${validations.length} data reconciliation checks completed.`}
                  </p>
                </div>
                <button
                  className="secondary-button small"
                  onClick={async () => {
                    const res = await api.rerunValidations(activeDocId);
                    setValidations(res);
                    showToast('Validation checks re-executed successfully', 'success');
                  }}
                >
                  <Zap size={14} /> Re-run checks
                </button>
              </div>

              <div className="validation-grid">
                <div className="validation-score-card">
                  <div className="score-ring">
                    <div><b>{validations.every(v => v.status === 'passed') ? '99' : '96'}</b><span>/100</span></div>
                  </div>
                  <div>
                    <span className="micro-label">OVERALL CONFIDENCE</span>
                    <h3>{validations.every(v => v.status === 'passed') ? 'Clean verification' : 'Strong signal'}</h3>
                    <p>All extracted table cells and blocks are mapped to verified source coordinates.</p>
                  </div>
                  <StatusPill tone="green">{validations.filter(v => v.status === 'passed').length} / {validations.length} CHECKS</StatusPill>
                </div>

                {isDemoDoc ? (
                  <>
                    <div className="check-card passed">
                      <div className="check-icon"><Check size={16} /></div>
                      <div>
                        <b>Table totals reconcile</b>
                        <span>3 of 3 table totals match source</span>
                      </div>
                      <span className="check-meta">PASSED</span>
                    </div>

                    <div className="check-card passed">
                      <div className="check-icon"><Check size={16} /></div>
                      <div>
                        <b>Currency consistency</b>
                        <span>USD units held across all tables</span>
                      </div>
                      <span className="check-meta">PASSED</span>
                    </div>

                    <div className="check-card warning">
                      <div className="check-icon"><CircleAlert size={16} /></div>
                      <div>
                        <b>Table reconciliation mismatch</b>
                        <span>Calculated total differs from document total</span>
                      </div>
                      <span className="check-meta">1 WARN</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="check-card passed">
                      <div className="check-icon"><Check size={16} /></div>
                      <div>
                        <b>{validations[0]?.title || 'Structure & Schema verification'}</b>
                        <span>{validations[0]?.explanation || 'Schema alignment conforms to specifications'}</span>
                      </div>
                      <span className="check-meta">PASSED</span>
                    </div>

                    <div className="check-card passed">
                      <div className="check-icon"><Check size={16} /></div>
                      <div>
                        <b>{validations[1]?.title || 'Table & record reconciliation'}</b>
                        <span>{validations[1]?.actual_value || `${blocks.length} semantic blocks verified`}</span>
                      </div>
                      <span className="check-meta">PASSED</span>
                    </div>

                    <div className={`check-card ${validations.some(v => v.status !== 'passed') ? 'warning' : 'passed'}`}>
                      <div className="check-icon">
                        {validations.some(v => v.status !== 'passed') ? <CircleAlert size={16} /> : <Check size={16} />}
                      </div>
                      <div>
                        <b>Coordinate provenance integrity</b>
                        <span>100% of parsed records anchored to source</span>
                      </div>
                      <span className="check-meta">{validations.some(v => v.status !== 'passed') ? '1 WARN' : 'PASSED'}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="validation-columns">
                <section className="validation-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="micro-label">TABLE VALIDATION</span>
                      <h2>{isDemoDoc ? 'Revenue by geography' : `${currentDocName.replace(/\.[^/.]+$/, '')} Structure & Data Integrity`}</h2>
                    </div>
                    <StatusPill tone={validations.some(v => v.status !== 'passed') ? 'amber' : 'green'}>
                      {validations.some(v => v.status !== 'passed') ? 'REVIEW ADVISED' : 'ALL CHECKS PASSED'}
                    </StatusPill>
                  </div>

                  <div className="validation-table">
                    <div className="validation-table-row header">
                      <span>CHECK</span>
                      <span>EXPECTED</span>
                      <span>FOUND</span>
                      <span>STATUS</span>
                    </div>
                    {validations.map(v => (
                      <div key={v.id} className={`validation-table-row ${v.status !== 'passed' ? 'warn' : ''}`}>
                        <span>{v.title}</span>
                        <span>{v.expected_value}</span>
                        <span>{v.actual_value}</span>
                        <span className={`table-status ${v.status === 'passed' ? 'green' : 'amber'}`}>
                          {v.status === 'passed' ? <Check size={12} /> : <CircleAlert size={12} />} {v.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="panel-actions">
                    <button
                      className="secondary-button small"
                      onClick={() => {
                        const targetId = isDemoDoc ? 'A72' : (validations[0]?.related_block_ids[0] || blocks[0]?.id || 'A01');
                        setSelectedBlockId(targetId);
                        setCurrentPage(isDemoDoc ? 7 : 1);
                        setActiveView('document');
                        showToast(`Jumped to source block ${targetId}`, 'info');
                      }}
                    >
                      Inspect table <ArrowRight size={13} />
                    </button>
                    <button className="text-button" onClick={() => {
                      const targetId = isDemoDoc ? 'A72' : (validations[0]?.related_block_ids[0] || blocks[0]?.id || 'A01');
                      setSelectedBlockId(targetId);
                      setActiveView('verify');
                    }}>
                      View source
                    </button>
                  </div>
                </section>

                <section className="validation-panel warning-panel">
                  <div className="warning-radar">
                    {validations.some(v => v.status !== 'passed') ? <CircleAlert size={20} /> : <Check size={20} style={{ color: 'var(--green)' }} />}
                  </div>
                  <div>
                    <span className="micro-label">UNCERTAINTY SIGNAL</span>
                    <h2>{isDemoDoc ? 'One mismatch worth a look' : validations.some(v => v.status !== 'passed') ? 'Review item flagged' : 'Zero reconciliation errors'}</h2>
                    <p>
                      {isDemoDoc
                        ? 'Atlas found a $20M difference between a reported total and its calculated components. This does not mean the document is wrong — it means the source deserves a human read.'
                        : validations.some(v => v.status !== 'passed')
                        ? 'A potential mismatch was flagged for human review to confirm accuracy with the browsed source.'
                        : `Every row, column, and record parsed from ${currentDocName} passed syntax and reconciliation checks.`}
                    </p>
                    <button className="text-button" onClick={() => setActiveView('review')}>
                      Open review queue <ArrowRight size={13} />
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Ask View */}
          {activeView === 'ask' && (
            <AskView
              documentId={activeDocId}
              project={{ ...currentProject, document: currentDocName, pages: totalPages }}
              onCitationClick={(blockId) => {
                setSelectedBlockId(blockId);
                const blk = blocks.find(b => b.id === blockId);
                if (blk) setCurrentPage(blk.page);
                setActiveView('verify');
                showToast(`Trace opened for block ${blockId}`, 'info');
              }}
              onToast={showToast}
            />
          )}

          {/* Verify View */}
          {activeView === 'verify' && (
            <div className="content-view">
              <div className="view-header">
                <div>
                  <span className="micro-label">05 / PROVENANCE</span>
                  <h1>Verify</h1>
                  <p>Make the source visible. This is the exact evidence behind the selected answer.</p>
                </div>
                <StatusPill tone="green"><CircleCheck size={12} /> TRACEABLE ANSWER</StatusPill>
              </div>

              <div className="verify-layout">
                <section className="answer-card">
                  <div className="answer-card-head">
                    <div className="answer-label"><Sparkles size={14} /> ANSWER UNDER REVIEW</div>
                    <span>Ask / {currentDocName}</span>
                  </div>
                  <h2>{isDemoDoc ? '“What is the total revenue for North America in 2024?”' : `“Evidence verification for ${selectedBlock.label || selectedBlock.type}”`}</h2>
                  <div className="answer-result">
                    <span>Atlas answer</span>
                    <b>{isDemoDoc ? 'The total is $4.62M for North America in 2024.' : selectedBlock.content}</b>
                  </div>
                  <div className="answer-confidence">
                    <span>SUPPORT SIGNAL</span>
                    <ConfidenceBar value={selectedBlock.confidence} />
                    <span className="answer-note">Source {selectedBlock.id} · geometry preserved</span>
                  </div>
                </section>

                <section className="source-proof">
                  <div className="source-proof-head">
                    <div>
                      <span className="micro-label">CITED SOURCE / 01</span>
                      <h2>{selectedBlock.id} <span>· {selectedBlock.type}</span></h2>
                    </div>
                    <StatusPill tone="cyan">PAGE {String(selectedBlock.page).padStart(2, '0')}</StatusPill>
                  </div>

                  <div className="source-proof-body">
                    <div className="proof-crop">
                      <span className="crop-label">{currentDocName.toUpperCase()} · P.{String(selectedBlock.page).padStart(2, '0')}</span>
                      {isDemoDoc ? (
                        <div className="crop-table">
                          <span>Region</span><span>2024</span><span>2023</span>
                          <b>North America</b><strong>$4,620</strong><span>$4,180</span>
                          <div className="crop-highlight" />
                        </div>
                      ) : (
                        <div style={{ padding: '12px 14px', background: '#0e1318', borderRadius: '6px', border: '1px solid var(--line)', marginTop: '8px', position: 'relative' }}>
                          <span className="micro-label" style={{ color: 'var(--cyan)' }}>{selectedBlock.id} · {selectedBlock.type}</span>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginTop: '4px', lineHeight: 1.5 }}>
                            {selectedBlock.content}
                          </div>
                          <div className="crop-highlight" />
                        </div>
                      )}
                    </div>

                    <div className="proof-details">
                      <div className="proof-quote">
                        “{selectedBlock.content}” <span>· source text</span>
                      </div>
                      <div className="metadata-grid">
                        <span>SOURCE PAGE<b>{selectedBlock.page} of {totalPages}</b></span>
                        <span>BLOCK ID<b>{selectedBlock.id}</b></span>
                        <span>COORDINATES<b>{selectedBlock.bbox_formatted}</b></span>
                        <span>CONFIDENCE<b>{Math.round(selectedBlock.confidence * 100)}%</b></span>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => {
                          setCurrentPage(selectedBlock.page);
                          setActiveView('document');
                        }}
                      >
                        <Highlighter size={15} /> Open in document
                      </button>
                    </div>
                  </div>
                </section>

                <div className="verification-note">
                  <ShieldCheck size={16} />
                  <div>
                    <b>Why this matters</b>
                    <span>Every material answer in Atlas can be followed back to a source region, not just a page number.</span>
                  </div>
                  <Tag size={15} />
                </div>
              </div>
            </div>
          )}

          {/* Review Queue View */}
          {activeView === 'review' && (
            <ReviewQueueView
              reviews={reviews}
              onApprove={async (reviewId, corrected) => {
                const updated = await api.approveReview(reviewId, corrected);
                setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
                showToast(`Review item ${updated.block_id} approved`, 'success');
              }}
              onReject={async (reviewId) => {
                const updated = await api.rejectReview(reviewId);
                setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
                showToast(`Review item ${updated.block_id} rejected`, 'warning');
              }}
              onJumpToSource={(blockId, page) => {
                setSelectedBlockId(blockId);
                setCurrentPage(page);
                setActiveView('document');
              }}
              project={{ ...currentProject, document: currentDocName, pages: totalPages }}
            />
          )}

          {/* Export View */}
          {activeView === 'export' && (
            <ExportView
              documentId={activeDocId}
              project={{ ...currentProject, document: currentDocName, pages: totalPages }}
              masked={masked}
              setMasked={setMasked}
              onToast={showToast}
            />
          )}

          {/* Bottom Bar */}
          <div className="workspace-bottom">
            <span><Activity size={13} /> Atlas engine nominal</span>
            <span>Last synced just now</span>
            <button onClick={() => setScreen('landing')}>
              Back to upload <ArrowLeft size={13} />
            </button>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.tone}`}>
          <div className="toast-icon">
            {toast.tone === 'success' ? <Check size={15} /> : toast.tone === 'warning' ? <CircleAlert size={15} /> : <Sparkles size={15} />}
          </div>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* New Project Modal */}
      {showAddProject && (
        <div className="atlas-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowAddProject(false)}>
          <section className="atlas-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
            <div className="atlas-modal-head">
              <div>
                <span className="micro-label">PROJECTS / NEW</span>
                <h2 id="new-project-title">New project</h2>
              </div>
              <button className="icon-button subtle" onClick={() => setShowAddProject(false)} aria-label="Close modal">
                <X size={16} />
              </button>
            </div>
            <p className="modal-copy">Create a focused workspace for a new document set.</p>
            <label className="modal-field">
              <span>Project name</span>
              <input
                id="new-project-input"
                autoFocus
                placeholder="e.g. Board Materials"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) handleCreateProject(val);
                  }
                }}
              />
            </label>
            <div className="atlas-modal-foot">
              <button className="secondary-button small" onClick={() => setShowAddProject(false)}>Cancel</button>
              <button
                className="primary-button"
                onClick={() => {
                  const input = document.getElementById('new-project-input') as HTMLInputElement;
                  if (input?.value.trim()) handleCreateProject(input.value.trim());
                }}
              >
                <Plus size={14} /> Create project
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="atlas-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <section className="atlas-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="atlas-modal-head">
              <div>
                <span className="micro-label">SETTINGS / APPEARANCE</span>
                <h2 id="settings-title">Theme preference</h2>
              </div>
              <button className="icon-button subtle" onClick={() => setShowSettings(false)} aria-label="Close modal">
                <X size={16} />
              </button>
            </div>
            <p className="modal-copy">Choose how Atlas should appear on this device. Your preference is saved locally and synced to backend.</p>

            <div className="theme-control">
              <div className="theme-toggle-row">
                <Sun size={15} className={`theme-side-icon ${themePreference === 'light' ? 'active' : ''}`} />
                <button
                  type="button"
                  className={`theme-switch ${themePreference === 'light' ? 'light-active' : 'dark-active'}`}
                  disabled={themePreference === 'system'}
                  onClick={() => setThemePreference(p => p === 'light' ? 'dark' : 'light')}
                >
                  <span />
                </button>
                <Moon size={15} className={`theme-side-icon ${themePreference === 'dark' ? 'active' : ''}`} />
              </div>

              <label className="theme-system-option">
                <input
                  type="checkbox"
                  checked={themePreference === 'system'}
                  onChange={(e) => setThemePreference(e.target.checked ? 'system' : 'dark')}
                />
                <span className="theme-checkbox"><Check size={11} /></span>
                <span>Same as system</span>
              </label>
            </div>

            <div className="atlas-modal-foot">
              <span><Lock size={12} /> Local preference only</span>
              <button className="secondary-button small" onClick={() => setShowSettings(false)}>Done</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

// ----------------------------------------------------
// ASK VIEW SUBCOMPONENT
// ----------------------------------------------------
function AskView({
  documentId,
  project,
  onCitationClick,
  onToast,
}: {
  documentId: string;
  project: Project;
  onCitationClick: (blockId: string) => void;
  onToast: (msg: string, tone?: string) => void;
}) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; confidence?: number; sources?: any[] }>>([
    {
      sender: 'assistant',
      text: 'I’m ready to answer from the document. I’ll cite the exact blocks behind every material claim.',
    },
    {
      sender: 'user',
      text: 'What is the total revenue for North America in 2024?',
    },
    {
      sender: 'assistant',
      text: 'The total is $4.62M for North America in 2024. That represents a 10.5% increase over 2023.',
      confidence: 0.98,
      sources: [
        { block_id: 'A72', type: 'table_cell', page: 7 },
        { block_id: 'A68', type: 'table_row', page: 7 },
      ],
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputVal).trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text: q }]);
    setInputVal('');
    setLoading(true);

    try {
      const resp = await api.askQuestion(documentId, q);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: resp.answer,
          confidence: resp.confidence,
          sources: resp.sources,
        },
      ]);
      onToast(`Answer grounded in ${resp.sources?.length || 0} source blocks`, 'success');
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Atlas encountered an error processing this question.',
          confidence: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-view ask-view">
      <div className="view-header">
        <div>
          <span className="micro-label">04 / DOCUMENT-AWARE AI</span>
          <h1>Ask</h1>
          <p>Ask the document. Every answer stays tethered to the source.</p>
        </div>
        <StatusPill tone="violet"><Sparkles size={12} /> ATLAS REASONING ON</StatusPill>
      </div>

      <div className="ask-layout">
        <div className="chat-shell">
          <div className="chat-top">
            <div>
              <span className="micro-label">CONVERSATION / {project.document.toUpperCase()}</span>
              <b>Analyst thread</b>
            </div>
            <button className="icon-button subtle"><Ellipsis size={16} /></button>
          </div>

          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.sender}`}>
                {m.sender === 'assistant' && (
                  <div className="message-avatar"><Sparkles size={14} /></div>
                )}
                <div>
                  <span className="message-author">
                    {m.sender === 'assistant' ? 'ATLAS' : 'YOU'} <small>{idx === 0 ? 'just now' : 'recent'}</small>
                  </span>
                  <p>{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <>
                      <div className="answer-support">
                        <span><CircleCheck size={14} /> Supported by source</span>
                        <span>{Math.round((m.confidence || 0.95) * 100)}% confidence</span>
                      </div>
                      <div className="citation-row">
                        {m.sources.map((src, sIdx) => (
                          <button key={sIdx} onClick={() => onCitationClick(src.block_id)}>
                            <span>{String(sIdx + 1).padStart(2, '0')}</span>
                            {src.block_id} · {src.type || 'block'} <ArrowRight size={12} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="suggested-row">
            <span>SUGGESTED</span>
            {project.document === 'Annual_Report.pdf' ? (
              <>
                <button onClick={() => handleSend('What is the total revenue?')}>What is the total revenue?</button>
                <button onClick={() => handleSend('Which margin moved most?')}>Which margin moved most?</button>
                <button onClick={() => handleSend('What needs a human read?')}>What needs a human read?</button>
              </>
            ) : (
              <>
                <button onClick={() => handleSend('Summarize the key information in this document')}>Summarize document</button>
                <button onClick={() => handleSend('What structured tables or records were found?')}>What tables were found?</button>
                <button onClick={() => handleSend('What key data points are highlighted?')}>Key data points</button>
              </>
            )}
          </div>

          <div className="chat-input">
            <input
              placeholder="Ask anything about this document…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={() => handleSend()} disabled={loading}>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <aside className="ask-context">
          <span className="micro-label">ANSWER CONTRACT</span>
          <h3>Evidence comes first.</h3>
          <p>Atlas will say when the document does not support an answer. No unsupported confidence theater.</p>

          <div className="contract-row"><CircleCheck size={15} /><span>Source citations attached</span></div>
          <div className="contract-row"><CircleCheck size={15} /><span>Confidence is visible</span></div>
          <div className="contract-row"><CircleCheck size={15} /><span>Unsupported claims flagged</span></div>

          <div className="ask-context-foot">
            <span>INDEXED BLOCKS</span>
            <b>42</b>
            <small>Across {project.pages} pages</small>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// REVIEW QUEUE SUBCOMPONENT
// ----------------------------------------------------
function ReviewQueueView({
  reviews,
  onApprove,
  onReject,
  onJumpToSource,
  project,
}: {
  reviews: ReviewItem[];
  onApprove: (id: string, correctedVal: string) => void;
  onReject: (id: string) => void;
  onJumpToSource: (blockId: string, page: number) => void;
  project: Project;
}) {
  const [selectedReviewId, setSelectedReviewId] = useState(reviews[0]?.id || 'rev-A91');
  const selectedReview = reviews.find(r => r.id === selectedReviewId) || reviews[0] || {
    id: 'rev-A91',
    block_id: 'A91',
    reason: 'OCR ambiguity between “8.3M” and “8?3M”. Nearby source text suggests a decimal point.',
    confidence: 0.42,
    extracted_value: 'Revenue: $8?3M',
    corrected_value: 'Revenue: $8.3M',
    status: 'pending' as const,
    source_page: 7,
    bbox_formatted: 'x 112 · y 504 · w 312 · h 32',
  };

  const [editValue, setEditValue] = useState(selectedReview.corrected_value || selectedReview.extracted_value);

  useEffect(() => {
    setEditValue(selectedReview.corrected_value || selectedReview.extracted_value);
  }, [selectedReview.id]);

  const isFigure = selectedReview.block_id === 'A74';

  return (
    <div className="content-view">
      <div className="view-header">
        <div>
          <span className="micro-label">06 / HUMAN-IN-THE-LOOP</span>
          <h1>Review queue</h1>
          <p>Uncertainty is a handoff, not a dead end. Resolve the blocks Atlas could not safely decide.</p>
        </div>
        <div className="review-count">
          <span>QUEUE</span>
          <b>{String(reviews.filter(r => r.status === 'pending').length || '02').padStart(2, '0')}</b>
        </div>
      </div>

      <div className="review-layout">
        <aside className="review-list">
          <div className="review-list-head">
            <span>FLAGGED BLOCKS</span>
            <button className="text-button"><ChevronDown size={13} /> Filter</button>
          </div>

          {reviews.map(item => (
            <button
              key={item.id}
              className={`review-list-item ${selectedReviewId === item.id ? 'selected' : ''}`}
              onClick={() => setSelectedReviewId(item.id)}
            >
              <div className={`review-thumb ${item.block_id === 'A74' ? 'figure-thumb' : ''}`}>
                {item.block_id === 'A74' ? (
                  <ChartColumn size={18} />
                ) : (
                  <>
                    <span>Revenue:<br />$8?3M</span>
                    <div className="thumb-focus" />
                  </>
                )}
              </div>
              <div>
                <span className="review-id">{item.block_id} · {item.block_id === 'A74' ? 'figure' : 'paragraph'}</span>
                <b>{item.extracted_value}</b>
                <ConfidenceBar value={item.confidence} compact />
              </div>
              <CircleAlert size={15} />
            </button>
          ))}

          <div className="review-list-foot">
            <CircleCheck size={14} />
            <span>{reviews.filter(r => r.status === 'approved').length} resolved this session</span>
          </div>
        </aside>

        <section className="review-detail">
          <div className="review-detail-head">
            <div>
              <span className="micro-label">REVIEW ITEM / {selectedReview.block_id}</span>
              <h2>{isFigure ? 'Resolve an ambiguous figure label' : 'Resolve an ambiguous extraction'}</h2>
            </div>
            <button
              className="secondary-button small"
              onClick={() => onJumpToSource(selectedReview.block_id, selectedReview.source_page)}
            >
              <Highlighter size={14} /> Jump to source
            </button>
          </div>

          <div className="review-split">
            <div className="review-source">
              <span className="micro-label">SOURCE CROP · {project.document} · PAGE {String(selectedReview.source_page).padStart(2, '0')}</span>
              <div className="review-source-paper">
                <span className="tiny-paper-title">{project.document === 'Annual_Report.pdf' ? 'ACME HOLDINGS, INC.' : project.document.toUpperCase()}</span>
                {project.document === 'Annual_Report.pdf' ? (
                  isFigure ? (
                    <>
                      <p>Adjusted EBITDA margin expanded by <b>180 bps</b> to <b>24.8%</b> across the reporting period.</p>
                      <div className="review-source-highlight">Adjusted EBITDA margin: 24.8%</div>
                      <p className="faint">See figure on page 7 for the supporting margin bridge.</p>
                    </>
                  ) : (
                    <>
                      <p>Revenue grew from <b>$7,060M</b> to <b>$7,850M</b> across the reporting period.</p>
                      <div className="review-source-highlight">Revenue: $8.3M</div>
                      <p className="faint">See accompanying table on page 7 for regional breakdown.</p>
                    </>
                  )
                ) : (
                  <>
                    <p>Source extract for block <b>{selectedReview.block_id}</b> on page {selectedReview.source_page}.</p>
                    <div className="review-source-highlight">{selectedReview.extracted_value}</div>
                    <p className="faint">{selectedReview.reason}</p>
                  </>
                )}
                <span className="source-coordinates">{selectedReview.bbox_formatted}</span>
              </div>
            </div>

            <div className="review-edit">
              <div className="review-edit-top">
                <span className="micro-label">EXTRACTED RESULT</span>
                <ConfidenceBar value={selectedReview.confidence} />
              </div>

              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />

              <div className="review-reason">
                <CircleAlert size={15} />
                <div>
                  <b>Why this was flagged</b>
                  <span>{selectedReview.reason}</span>
                </div>
              </div>

              <div className="review-actions">
                <button
                  className="secondary-button"
                  onClick={() => onReject(selectedReview.id)}
                >
                  <X size={15} /> Reject
                </button>
                <button
                  className="primary-button"
                  onClick={() => onApprove(selectedReview.id, editValue)}
                >
                  <Check size={15} /> Save & approve
                </button>
              </div>

              {selectedReview.status !== 'pending' && (
                <div className={`resolved-banner ${selectedReview.status}`}>
                  <CircleCheck size={15} />
                  {selectedReview.status === 'approved'
                    ? 'Correction approved and added to the export.'
                    : 'Item rejected. It will be excluded from structured output.'}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// EXPORT VIEW SUBCOMPONENT
// ----------------------------------------------------
function ExportView({
  documentId,
  project,
  masked,
  setMasked,
  onToast,
}: {
  documentId: string;
  project: Project;
  masked: boolean;
  setMasked: (m: boolean) => void;
  onToast: (msg: string, tone?: string) => void;
}) {
  const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'json' | 'csv' | 'excel'>('markdown');
  const [previewContent, setPreviewContent] = useState<string>('');

  const formats = [
    { id: 'markdown', name: 'Markdown', icon: FileText, detail: 'Readable structure' },
    { id: 'json', name: 'JSON', icon: FileJson, detail: 'Machine-ready blocks' },
    { id: 'csv', name: 'CSV', icon: FileSpreadsheet, detail: 'Flat table data' },
    { id: 'excel', name: 'Excel', icon: FileSpreadsheet, detail: 'Tables + formulas' },
  ];

  useEffect(() => {
    api.exportDocument(documentId, {
      format: selectedFormat,
      mask_sensitive: masked,
    }).then(res => {
      setPreviewContent(res.preview || res.content);
    }).catch(console.error);
  }, [documentId, selectedFormat, masked]);

  const handleDownload = async () => {
    try {
      const res = await api.exportDocument(documentId, {
        format: selectedFormat,
        mask_sensitive: masked,
      });
      if (res && res.content) {
        const blob = new Blob([res.content], { type: res.contentType || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename || `export.${selectedFormat === 'markdown' ? 'md' : selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onToast(`${selectedFormat.toUpperCase()} export downloaded`, 'success');
        return;
      }
    } catch (e) {
      console.warn('Client-side blob export fallback to server route:', e);
    }
    window.location.href = `/api/documents/${documentId}/export?format=${selectedFormat}&mask_sensitive=${masked}&download=true`;
    onToast(`${selectedFormat.toUpperCase()} export downloaded`, 'success');
  };

  return (
    <div className="content-view">
      <div className="view-header">
        <div>
          <span className="micro-label">07 / STRUCTURED OUTPUT</span>
          <h1>Export</h1>
          <p>Take the document with you — with the evidence graph still intact.</p>
        </div>
        <button className="primary-button" onClick={handleDownload}>
          <Download size={15} /> Export {selectedFormat.toUpperCase()}
        </button>
      </div>

      <div className="export-layout">
        <section className="export-options">
          <div className="export-section-head">
            <div>
              <span className="micro-label">CHOOSE A FORMAT</span>
              <h2>What do you need next?</h2>
            </div>
            <span className="export-ready"><CircleCheck size={14} /> READY TO EXPORT</span>
          </div>

          <div className="format-grid">
            {formats.map(({ id, name, icon: Icon, detail }) => (
              <button
                key={id}
                className={`format-card ${selectedFormat === id ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(id as any)}
              >
                <div className="format-icon"><Icon size={19} /></div>
                <b>{name}</b>
                <span>{detail}</span>
                {selectedFormat === id && <CircleCheck size={15} className="format-selected" />}
              </button>
            ))}
          </div>

          <div className="scope-box">
            <div>
              <span className="micro-label">EXPORT SCOPE</span>
              <b>Entire document</b>
              <span>{project.document} · {project.pages} {project.pages === 1 ? 'page' : 'pages'}</span>
            </div>
            <ChevronDown size={16} />
          </div>

          <div className="masking-box">
            <div className="masking-icon"><Lock size={16} /></div>
            <div>
              <b>Mask sensitive data before export</b>
              <span>{masked ? 'Detected sensitive items masked in export preview.' : 'Detected emails, phone numbers and ID-like formats can be masked.'}</span>
              <small>Best-effort detection preserves source provenance without exposing private data.</small>
            </div>
            <label className="mask-toggle">
              <input type="checkbox" checked={masked} onChange={(e) => setMasked(e.target.checked)} />
              <span className="toggle-ui" />
            </label>
          </div>
        </section>

        <section className="export-preview">
          <div className="preview-head">
            <span className="micro-label">LIVE PREVIEW</span>
            <div>
              <span>{selectedFormat.toUpperCase()}</span>
              <button className="icon-button subtle"><Ellipsis size={15} /></button>
            </div>
          </div>

          <div className="preview-window">
            {previewContent ? (
              <pre style={{ margin: 0, padding: '4px', fontFamily: selectedFormat === 'json' ? 'var(--mono)' : 'inherit', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: 1.6, color: 'var(--text)' }}>
                {previewContent}
              </pre>
            ) : (
              <>
                <div className="preview-line heading"># {project.document}</div>
                <div className="preview-line">## Structured Extraction</div>
                <div className="preview-line text">Document converted to {selectedFormat.toUpperCase()} with evidence provenance.</div>
              </>
            )}
          </div>

          <div className="preview-foot">
            <span><FileCheck2 size={14} /> Provenance metadata included</span>
            <span>~ 18 KB</span>
          </div>
        </section>
      </div>
    </div>
  );
}
