import { db } from './store.js';
import { ExportRequest } from '../src/types.js';

export function maskContent(text: string): string {
  let masked = text;
  // Mask emails
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '••••••••••••••••');
  // Mask phone numbers
  masked = masked.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '••••-•••-••••');
  // Mask internal IDs / account keys
  masked = masked.replace(/\b(ID:\s*|Acc:\s*)\w+\b/gi, '$1••••••');
  return masked;
}

function extractDocumentTable(doc: any, blocks: any[]): {
  name: string;
  headers: string[];
  rows: string[][];
  records: Record<string, any>[];
} {
  const isDemo = !doc || doc.id === 'doc-annual-report-2024' || doc.filename === 'Annual_Report.pdf';

  // 1. CSV / TSV Documents
  if (!isDemo && (doc?.parsed_format === 'csv' || doc?.filename?.endsWith('.csv') || doc?.filename?.endsWith('.tsv'))) {
    if (doc?.page_contents?.[1]?.headers && doc?.page_contents?.[1]?.rows) {
      // Gather all rows from all pages if available
      const headers: string[] = doc.page_contents[1].headers;
      const allRows: string[][] = [];
      const totalPages = doc.page_count || 1;
      for (let p = 1; p <= totalPages; p++) {
        const pageRows = doc.page_contents[p]?.rows || [];
        allRows.push(...pageRows);
      }
      const rows = allRows.length > 0 ? allRows : doc.page_contents[1].rows;
      const records = rows.map((r: string[]) => {
        const rec: Record<string, any> = {};
        headers.forEach((h, i) => { rec[h || `col_${i + 1}`] = r[i] || ''; });
        return rec;
      });
      return {
        name: doc.filename.replace(/\.[^/.]+$/, ''),
        headers,
        rows,
        records,
      };
    }
    if (doc?.raw_content) {
      const delimiter = doc.filename.endsWith('.tsv') ? '\t' : ',';
      const lines = doc.raw_content.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      if (lines.length > 0) {
        const parseLine = (line: string): string[] => {
          const res: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') inQuotes = !inQuotes;
            else if (ch === delimiter && !inQuotes) { res.push(cur.trim()); cur = ''; }
            else cur += ch;
          }
          res.push(cur.trim());
          return res;
        };
        const headers = parseLine(lines[0]);
        const rows = lines.slice(1).map(parseLine);
        const records = rows.map((r: string[]) => {
          const rec: Record<string, any> = {};
          headers.forEach((h, i) => { rec[h || `col_${i + 1}`] = r[i] || ''; });
          return rec;
        });
        return { name: doc.filename.replace(/\.[^/.]+$/, ''), headers, rows, records };
      }
    }
  }

  // 2. JSON Documents
  if (!isDemo && (doc?.parsed_format === 'json' || doc?.filename?.endsWith('.json'))) {
    // If pipeline already prepared structured tableData, use it directly
    if (doc?.page_contents?.[1]?.tableData) {
      const td = doc.page_contents[1].tableData;
      if (td.headers?.length > 0 && td.rows?.length > 0) {
        const records = td.rows.map((row: string[]) => {
          const rec: Record<string, any> = {};
          td.headers.forEach((h: string, i: number) => { rec[h || `col_${i + 1}`] = row[i] || ''; });
          return rec;
        });
        return {
          name: td.name || doc.filename.replace(/\.[^/.]+$/, ''),
          headers: td.headers,
          rows: td.rows,
          records,
        };
      }
    }

    try {
      const parsed = doc?.page_contents?.[1]?.parsedData || (doc?.raw_content ? JSON.parse(doc.raw_content) : null);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const keySet = new Set<string>();
        parsed.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(k => keySet.add(k));
          }
        });
        const headers = keySet.size > 0 ? Array.from(keySet) : ['Item'];
        const rows = parsed.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return headers.map(h => typeof item[h] === 'object' ? JSON.stringify(item[h]) : String(item[h] ?? ''));
          }
          return [String(item)];
        });
        return {
          name: doc.filename.replace(/\.[^/.]+$/, ''),
          headers,
          rows,
          records: parsed,
        };
      }
      if (typeof parsed === 'object' && parsed !== null) {
        // Check for array property inside object
        const arrayPropKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]) && parsed[k].length > 0 && typeof parsed[k][0] === 'object');
        if (arrayPropKey) {
          const arr = parsed[arrayPropKey];
          const keySet = new Set<string>();
          arr.forEach((item: any) => {
            if (typeof item === 'object' && item !== null) {
              Object.keys(item).forEach(k => keySet.add(k));
            }
          });
          const headers = Array.from(keySet);
          const rows = arr.map((item: any) => {
            return headers.map(h => {
              const val = item[h];
              return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            });
          });
          return {
            name: `${doc.filename.replace(/\.[^/.]+$/, '')} (${arrayPropKey})`,
            headers,
            rows,
            records: arr,
          };
        }

        const headers = ['Property', 'Value', 'Type'];
        const entries = Object.entries(parsed);
        const rows = entries.map(([k, v]) => [
          k,
          typeof v === 'object' ? JSON.stringify(v) : String(v),
          typeof v,
        ]);
        const records = entries.map(([k, v]) => ({ property: k, value: v, type: typeof v }));
        return {
          name: doc.filename.replace(/\.[^/.]+$/, ''),
          headers,
          rows,
          records,
        };
      }
    } catch {
      // Fall through
    }
  }

  // 3. Markdown with tables
  if (!isDemo && (doc?.parsed_format === 'markdown' || doc?.filename?.endsWith('.md') || doc?.filename?.endsWith('.txt'))) {
    // If pipeline parsed tables from browsed markdown file, use them directly
    if (doc?.page_contents?.[1]?.tables && doc.page_contents[1].tables.length > 0) {
      const firstTable = doc.page_contents[1].tables[0];
      const records = firstTable.rows.map((row: string[]) => {
        const rec: Record<string, any> = {};
        firstTable.headers.forEach((h: string, i: number) => { rec[h || `col_${i + 1}`] = row[i] || ''; });
        return rec;
      });
      return {
        name: firstTable.name || doc.filename.replace(/\.[^/.]+$/, ''),
        headers: firstTable.headers,
        rows: firstTable.rows,
        records,
      };
    }

    if (doc?.raw_content) {
      const lines = doc.raw_content.split(/\r?\n/);
      const tableLines = lines.filter((l: string) => l.trim().includes('|') && (l.trim().startsWith('|') || l.trim().endsWith('|') || (l.match(/\|/g) || []).length >= 2));
      if (tableLines.length >= 2) {
        const splitRow = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        const headers = splitRow(tableLines[0]);
        const dataLines = tableLines.slice(1).filter((l: string) => l.replace(/[\s|:-]/g, '').length > 0);
        const rows = dataLines.map(splitRow);
        if (headers.length > 0 && rows.length > 0) {
          const records = rows.map((r: string[]) => {
            const rec: Record<string, any> = {};
            headers.forEach((h, i) => { rec[h || `col_${i + 1}`] = r[i] || ''; });
            return rec;
          });
          return { name: doc.filename.replace(/\.[^/.]+$/, ''), headers, rows, records };
        }
      }

      // If no pipe table, extract key-values or list items from the browsed markdown file
      const kvLines = lines.filter((l: string) => /^\s*[-*]?\s*[\w\s]+:\s*.+/.test(l));
      if (kvLines.length > 0) {
        const headers = ['Field / Key', 'Extracted Value'];
        const rows = kvLines.slice(0, 50).map((l: string) => {
          const clean = l.replace(/^\s*[-*]\s*/, '');
          const colonIdx = clean.indexOf(':');
          return [clean.slice(0, colonIdx).trim(), clean.slice(colonIdx + 1).trim()];
        });
        const records = rows.map(([k, v]: string[]) => ({ key: k, value: v }));
        return { name: `${doc.filename.replace(/\.[^/.]+$/, '')} Key-Value Data`, headers, rows, records };
      }
    }
  }

  // 4. Default / Demo / PDF Extracted Table
  const tableBlocks = blocks.filter(b => b.type === 'table' || b.type === 'table_row' || b.type === 'table_cell');
  if (isDemo || tableBlocks.length > 0) {
    if (isDemo) {
      const headers = ['Region / Item', '2024', '2023', 'Change'];
      const rows = [
        ['North America', '$4,620', '$4,180', '+10.5%'],
        ['EMEA', '$2,140', '$1,980', '+8.1%'],
        ['APAC', '$1,090', '$900', '+21.1%'],
        ['Total revenue', '$7,850', '$7,060', '+11.2%'],
      ];
      const records = [
        { region: 'North America', '2024': '$4,620', '2023': '$4,180', change: '+10.5%' },
        { region: 'EMEA', '2024': '$2,140', '2023': '$1,980', change: '+8.1%' },
        { region: 'APAC', '2024': '$1,090', '2023': '$900', change: '+21.1%' },
        { region: 'Total revenue', '2024': '$7,850', '2023': '$7,060', change: '+11.2%' },
      ];
      return { name: 'Revenue by geography', headers, rows, records };
    }

    // For non-demo PDF/documents with extracted blocks
    const headers = ['Block ID', 'Classification', 'Extracted Value', 'Confidence'];
    const rows = tableBlocks.map(t => [
      t.id,
      t.label || t.type,
      t.content,
      `${Math.round(t.confidence * 100)}%`,
    ]);
    const records = tableBlocks.map(t => ({
      block_id: t.id,
      type: t.label || t.type,
      content: t.content,
      confidence: t.confidence,
    }));
    return { name: `${doc?.filename?.replace(/\.[^/.]+$/, '') || 'Document'} Tabular Extract`, headers, rows, records };
  }

  // Fallback for any other non-demo file: create table from document blocks, NOT sample data
  const contentBlocks = blocks.slice(0, 20);
  if (contentBlocks.length > 0) {
    const headers = ['Block ID', 'Type', 'Extracted Content'];
    const rows = contentBlocks.map(b => [b.id, b.label || b.type, b.content]);
    const records = contentBlocks.map(b => ({ block_id: b.id, type: b.label || b.type, content: b.content }));
    return { name: `${doc?.filename?.replace(/\.[^/.]+$/, '') || 'Document'} Structured Data`, headers, rows, records };
  }

  return { name: 'Extracted Data', headers: ['Property', 'Value'], rows: [], records: [] };
}

export function generateExport(documentId: string, options: ExportRequest) {
  const doc = db.getDocument(documentId);
  const blocks = db.getBlocks(documentId);
  const validations = db.getValidations(documentId);

  const mask = options.mask_sensitive;
  const processedBlocks = blocks.map(b => ({
    ...b,
    content: mask ? maskContent(b.content) : b.content,
  }));

  const isDemo = !doc || doc.id === 'doc-annual-report-2024' || doc.filename === 'Annual_Report.pdf';
  const tableData = extractDocumentTable(doc, processedBlocks);

  switch (options.format) {
    case 'markdown': {
      let md = `# ${doc?.filename || 'Document'}\n\n`;
      md += `> Converted via ParseAnything Atlas · Source: \`${doc?.filename}\` (${doc?.page_count || 1} pages) · ${processedBlocks.length} structured blocks\n\n`;

      const paragraphs = processedBlocks.filter(b => b.type === 'paragraph');

      md += `## Executive Summary\n\n`;
      if (paragraphs.length > 0) {
        md += `${paragraphs[0].content}\n\n`;
      } else {
        md += `Structured document extraction complete for \`${doc?.filename}\`.\n\n`;
      }

      if (isDemo) {
        md += `Contact: ${mask ? '••••••••••••••••' : 'mchen@acmeholdings.com'}\n\n`;
      }

      // Output real table data from the browsed file
      if (tableData.headers.length > 0 && tableData.rows.length > 0) {
        md += `### ${tableData.name || 'Extracted Tabular Data'}\n\n`;
        md += `| ${tableData.headers.join(' | ')} |\n`;
        md += `| ${tableData.headers.map(() => ':---').join(' | ')} |\n`;
        for (const row of tableData.rows) {
          const cells = row.map(cell => mask ? maskContent(String(cell)) : String(cell));
          md += `| ${cells.join(' | ')} |\n`;
        }
        md += `\n`;
      }

      md += `## Extracted Semantic Blocks (Reading Order Preserved)\n\n`;
      for (const b of processedBlocks) {
        md += `### [${b.id}] ${b.label || b.type.toUpperCase()} (Page ${b.page})\n`;
        md += `- **Confidence**: ${Math.round(b.confidence * 100)}%\n`;
        md += `- **Source Geometry**: ${b.bbox_formatted || 'x 0 · y 0 · w 100 · h 100'}\n`;
        md += `- **Reading Order**: ${b.reading_order}\n\n`;
        md += `${b.content}\n\n`;
      }

      if (validations.length > 0) {
        md += `## Validation & Reconciliation Report\n\n`;
        for (const v of validations) {
          md += `- **${v.title}**: ${v.status.toUpperCase()} (Expected: ${v.expected_value}, Found: ${v.actual_value}) - ${v.explanation}\n`;
        }
      }

      return {
        filename: `${(doc?.filename || 'document').replace(/\.[^/.]+$/, '')}-converted.md`,
        contentType: 'text/markdown; charset=utf-8',
        content: md,
      };
    }

    case 'json': {
      const cleanTitle = (doc?.filename || 'Document').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      
      // Build markdown preview that includes the actual browsed table data
      let mdPreview = `# ${cleanTitle}\n\n`;
      if (tableData.headers.length > 0 && tableData.rows.length > 0) {
        mdPreview += `### ${tableData.name}\n\n`;
        mdPreview += `| ${tableData.headers.join(' | ')} |\n`;
        mdPreview += `| ${tableData.headers.map(() => ':---').join(' | ')} |\n`;
        for (const row of tableData.rows.slice(0, 10)) {
          mdPreview += `| ${row.map(c => mask ? maskContent(String(c)) : String(c)).join(' | ')} |\n`;
        }
        mdPreview += `\n`;
      }
      mdPreview += processedBlocks.slice(0, 15).map(b => b.content).join('\n\n');

      const payload = {
        meta: {
          app: 'ParseAnything Atlas',
          version: '1.0.0',
          document_id: documentId,
          filename: doc?.filename,
          original_filename: doc?.original_filename,
          file_size: doc?.file_size_formatted,
          page_count: doc?.page_count,
          format: doc?.parsed_format || 'pdf',
          masked: mask,
          exported_at: new Date().toISOString(),
        },
        summary: {
          title: cleanTitle,
          block_count: processedBlocks.length,
          avg_confidence: Math.round(
            (processedBlocks.reduce((acc, b) => acc + b.confidence, 0) / (processedBlocks.length || 1)) * 100
          ) / 100,
          table_count: tableData.rows.length > 0 ? 1 : 0,
          record_count: tableData.records.length,
          validation_summary: {
            total: validations.length,
            passed: validations.filter(v => v.status === 'passed').length,
            warnings: validations.filter(v => v.status !== 'passed').length,
          },
        },
        tables: tableData.rows.length > 0 ? [
          {
            name: tableData.name,
            headers: tableData.headers,
            rows: mask ? tableData.rows.map(r => r.map(c => maskContent(String(c)))) : tableData.rows,
            total_rows: tableData.rows.length,
            total_columns: tableData.headers.length,
          }
        ] : [],
        data: mask ? tableData.records.map(rec => {
          const mRec: Record<string, any> = {};
          Object.entries(rec).forEach(([k, v]) => {
            mRec[k] = typeof v === 'string' ? maskContent(v) : v;
          });
          return mRec;
        }) : tableData.records,
        markdown_preview: mdPreview,
        blocks: processedBlocks.map(b => ({
          id: b.id,
          page: b.page,
          type: b.type,
          label: b.label,
          content: b.content,
          confidence: b.confidence,
          language: b.language,
          reading_order: b.reading_order,
          bbox: b.bbox,
          bbox_formatted: b.bbox_formatted,
          status: b.status,
        })),
        validations: validations.map(v => ({
          id: v.id,
          title: v.title,
          expected_value: v.expected_value,
          actual_value: v.actual_value,
          status: v.status,
          explanation: v.explanation,
          confidence: v.confidence,
          related_blocks: v.related_block_ids,
        })),
      };

      return {
        filename: `${(doc?.filename || 'document').replace(/\.[^/.]+$/, '')}-converted.json`,
        contentType: 'application/json; charset=utf-8',
        content: JSON.stringify(payload, null, 2),
      };
    }

    case 'csv': {
      // If browsed document is a spreadsheet/csv document, export the actual table CSV!
      if (!isDemo && (doc?.parsed_format === 'csv' || doc?.filename?.endsWith('.csv') || doc?.filename?.endsWith('.tsv')) && tableData.headers.length > 0 && tableData.rows.length > 0) {
        let csv = `${tableData.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')}\n`;
        for (const row of tableData.rows) {
          const cells = row.map(cell => {
            const val = mask ? maskContent(String(cell)) : String(cell);
            return `"${val.replace(/"/g, '""')}"`;
          });
          csv += `${cells.join(',')}\n`;
        }
        return {
          filename: `${(doc?.filename || 'document').replace(/\.[^/.]+$/, '')}-data.csv`,
          contentType: 'text/csv; charset=utf-8',
          content: csv,
        };
      }

      let csv = `Block ID,Page,Type,Reading Order,Confidence,Language,Bounding Box,Content\n`;
      for (const b of processedBlocks) {
        const safeContent = `"${b.content.replace(/"/g, '""')}"`;
        const safeBBox = `"${b.bbox_formatted || ''}"`;
        csv += `${b.id},${b.page},${b.type},${b.reading_order},${b.confidence},${b.language},${safeBBox},${safeContent}\n`;
      }

      return {
        filename: `${doc?.filename.replace(/\.pdf$/i, '') || 'document'}-blocks.csv`,
        contentType: 'text/csv; charset=utf-8',
        content: csv,
      };
    }

    case 'excel':
    default: {
      if (!isDemo && (doc?.parsed_format === 'csv' || doc?.filename?.endsWith('.csv') || doc?.filename?.endsWith('.tsv')) && tableData.headers.length > 0 && tableData.rows.length > 0) {
        let tsv = `${tableData.headers.join('\t')}\n`;
        for (const row of tableData.rows) {
          const cells = row.map(cell => {
            const val = mask ? maskContent(String(cell)) : String(cell);
            return val.replace(/[\t\n\r]/g, ' ');
          });
          tsv += `${cells.join('\t')}\n`;
        }
        return {
          filename: `${(doc?.filename || 'document').replace(/\.[^/.]+$/, '')}-table.xls`,
          contentType: 'application/vnd.ms-excel; charset=utf-8',
          content: tsv,
        };
      }

      // Return structured XML/TSV compatible with Excel
      let tsv = `BLOCK_ID\tPAGE\tTYPE\tREADING_ORDER\tCONFIDENCE\tBOUNDING_BOX\tEXTRACTED_CONTENT\n`;
      for (const b of processedBlocks) {
        tsv += `${b.id}\t${b.page}\t${b.type}\t${b.reading_order}\t${b.confidence}\t${b.bbox_formatted || ''}\t${b.content.replace(/\t/g, ' ')}\n`;
      }
      return {
        filename: `${doc?.filename.replace(/\.pdf$/i, '') || 'document'}-table.xls`,
        contentType: 'application/vnd.ms-excel; charset=utf-8',
        content: tsv,
      };
    }
  }
}
