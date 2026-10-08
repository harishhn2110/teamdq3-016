// Universal Multilingual Document Parser & Table Detector
// Extracts real content in all languages without hallucinating data.

export interface ExtractedTable {
  name: string;
  headers: string[];
  rows: string[][];
  page?: number;
}

export interface ExtractedPage {
  pageNum: number;
  text: string;
  lines: string[];
  tables: ExtractedTable[];
  headings: string[];
  paragraphs: string[];
  lists: string[];
}

export interface ParseResult {
  pages: ExtractedPage[];
  totalPages: number;
  detectedLanguage: string;
  hasTables: boolean;
}

/**
 * Detects the language/script of the extracted text.
 * Covers Asian (CJK, Korean, Thai, Hindi/Indic), Middle Eastern (Arabic, Hebrew),
 * Slavic/Cyrillic, Greek, European Latin (German, French, Spanish, Portuguese, Italian, Polish, Swedish, etc.),
 * and English.
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'English';

  // East Asian / CJK
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'Japanese';
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'Korean';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';

  // Indic / South Asian
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi / Devanagari';
  if (/[\u0980-\u09FF]/.test(text)) return 'Bengali';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'Punjabi';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';

  // Middle Eastern / Semitic
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) {
    if (/[پچژگ]/.test(text)) return 'Persian / Urdu';
    return 'Arabic';
  }
  if (/[\u0590-\u05FF]/.test(text)) return 'Hebrew';

  // Cyrillic & Slavic
  if (/[\u0400-\u04FF]/.test(text)) {
    if (/[іїєґ]/i.test(text)) return 'Ukrainian';
    return 'Russian / Cyrillic';
  }

  // Greek
  if (/[\u0370-\u03FF]/.test(text)) return 'Greek';

  // Southeast Asian
  if (/[\u0E00-\u0E7F]/.test(text)) return 'Thai';
  if (/[\u1000-\u109F]/.test(text)) return 'Burmese';

  // Vietnamese distinct characters
  if (/[đƯưƠơĂăÂâÊêÔôàảãạằắẳẵặầấẩẫậèẻẽẹềếểễệìỉĩịòỏõọồốổỗộờớởỡợùủũụừứửữựỳỷỹỵ]/i.test(text)) {
    return 'Vietnamese';
  }

  // Latin language scoring using high-frequency stop words and accents
  const lower = text.toLowerCase();
  const clean = lower.replace(/[^\p{L}\s]/gu, ' ');
  const words = clean.split(/\s+/).filter(w => w.length >= 1);

  const langVocab: Record<string, Set<string>> = {
    Spanish: new Set(['el','la','los','las','un','una','unos','unas','y','de','del','en','que','por','para','con','es','son','se','su','sus','como','pero','mas','más','este','esta','estos','estas','al','o','si','también','tambien','fue','hay','todo','todos','informe','empresa','financiero','cuenta','año','años','ano','anos','fecha','número','numero','hola','gracias','mundo','sobre','entre','cuando','después','despues','muy','sin','bien','resultados','ventas','ingresos','balance','primer','trimestre']),
    French: new Set(['le','la','les','un','une','des','et','de','du','en','que','pour','avec','est','sont','ce','cette','ces','dans','par','sur','pas','plus','au','aux','qui','se','sa','son','ses','mais','ou','si','nous','vous','ils','elles','tout','tous','rapport','annuel','entreprise','merci','bonjour','beaucoup','très','tres','sans','sous','fait','société','societe','chiffre','affaires','exercice','croissance']),
    German: new Set(['der','die','das','des','dem','den','ein','eine','einer','eines','einem','einen','und','in','zu','von','mit','auf','für','fur','ist','sind','im','nicht','als','auch','es','an','werden','wird','aus','hat','haben','nach','bei','um','wie','über','uber','aber','vor','jahr','jahresbericht','unternehmen','rechnung','datum','guten','tag','hallo','danke','bitte','umsatz','ergebnis','entwicklung']),
    Italian: new Set(['il','lo','la','i','gli','le','un','uno','una','e','ed','di','a','da','in','con','su','per','tra','fra','che','non','si','sono','è','del','dello','della','dei','degli','delle','al','allo','alla','ai','agli','alle','dal','nel','nella','nei','nelle','questo','questa','questi','queste','ma','anche','come','più','piu','anno','bilancio','azienda','ciao','grazie','tutti','molto','ricavi','utile','gestione']),
    Portuguese: new Set(['o','a','os','as','um','uma','uns','umas','e','de','do','da','dos','das','em','no','na','nos','nas','por','para','com','que','não','nao','se','mais','mas','como','foi','são','sao','este','esta','estes','estas','seu','sua','seus','suas','relatório','relatorio','ano','empresa','olá','ola','obrigado','obrigada','tudo','bem','muito','receita','desempenho','resultados']),
    Dutch: new Set(['de','het','een','en','van','in','is','op','te','dat','die','voor','zijn','niet','met','om','als','aan','maar','er','ook','naar','bij','uit','nog','je','we','ze','jaar','verslag','hallo','dank','omzet']),
    Swedish: new Set(['och','i','att','det','som','en','ett','på','pa','är','ar','av','för','for','med','till','den','de','har','inte','om','så','men','vad','vi','rapport','hej','tack','omsättning']),
    Polish: new Set(['i','w','na','z','do','że','ze','się','sie','to','o','po','nie','za','jak','od','dla','jest','tak','ale','co','roku','raport','cześć','czesc','dzień','dzieki','przychody']),
    Turkish: new Set(['bir','ve','bu','da','de','için','icin','ile','çok','cok','o','daha','en','mi','gibi','var','yok','ne','her','gün','gun','raport','rapor','merhaba','tesekkur','teşekkür']),
    English: new Set(['the','of','and','to','a','in','is','that','for','it','as','was','with','on','be','at','by','this','have','from','or','one','had','not','but','all','were','when','we','you','can','their','an','report','company','revenue','hello','thanks','year','total','growth','financial','operations','quarter','margin'])
  };

  const scores: Record<string, number> = {};
  for (const [lang, vocab] of Object.entries(langVocab)) {
    let score = 0;
    for (const w of words) {
      if (vocab.has(w)) score += 3;
    }
    scores[lang] = score;
  }

  // Accent and morphological bonuses
  if (/[áíóúñ¿¡]/.test(text) || /\b(del|las|los|año|años|ventas|informe)\b/i.test(text)) scores.Spanish = (scores.Spanish || 0) + 4;
  if (/[çèêëîïôûùœæ]/.test(text) || /\b(le|la|les|des|du|dans|rapport|société)\b/i.test(text)) scores.French = (scores.French || 0) + 4;
  if (/[äöüß]/.test(text) || /\b(der|die|das|und|ein|eine|jahresbericht|umsatz)\b/i.test(text)) scores.German = (scores.German || 0) + 4;
  if (/[ãõ]/.test(text) || /\b(não|relatório|obrigado|você|desempenho)\b/i.test(text)) scores.Portuguese = (scores.Portuguese || 0) + 5;
  if (/[ąęćłńóśźż]/.test(text)) scores.Polish = (scores.Polish || 0) + 5;
  if (/[åäö]/.test(text) && /\b(och|att|som)\b/i.test(text)) scores.Swedish = (scores.Swedish || 0) + 4;
  if (/[ğış]/.test(text)) scores.Turkish = (scores.Turkish || 0) + 5;

  let bestLang = 'English';
  let maxScore = scores.English || 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  }

  if (maxScore === 0) {
    if (/[áéíóú]/.test(text)) return 'Spanish';
    if (/[äöü]/.test(text)) return 'German';
    if (/[ãõ]/.test(text)) return 'Portuguese';
    if (/[ç]/.test(text)) return 'French';
  }

  return bestLang;

  return bestLang;
}

/**
 * Universal table detector for raw lines of text.
 * Detects:
 * 1. Markdown / pipe delimited tables
 * 2. Whitespace-aligned tables (multi-column tables with >= 2 spaces or tabs)
 * 3. Delimiter tables (CSV, TSV, semicolon)
 * 4. Box/Grid tables (+---+, | |, ┌┬┐, etc.)
 */
export function detectTablesFromLines(rawLines: string[], pageNum = 1, defaultTitle = 'Table'): ExtractedTable[] {
  const tables: ExtractedTable[] = [];
  const lines = rawLines.map(l => l.trimEnd());

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // A. Pipe / Markdown table detection
    if (line.includes('|') && (line.startsWith('|') || line.endsWith('|') || (line.match(/\|/g) || []).length >= 2)) {
      const tableLines: string[] = [];
      let tableTitle = lines[i - 1]?.replace(/^[#*\s-]+/, '').trim() || `${defaultTitle} (Page ${pageNum})`;
      if (tableTitle.includes('|') || tableTitle.length > 80) tableTitle = `${defaultTitle} (Page ${pageNum})`;

      while (i < lines.length && lines[i].trim().includes('|') && (lines[i].trim().match(/\|/g) || []).length >= 2) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const splitRow = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        const headers = splitRow(tableLines[0]);
        const dataLines = tableLines.slice(1).filter(l => l.replace(/[\s|:-]/g, '').length > 0);
        const rows = dataLines.map(splitRow);

        if (headers.length >= 2 && rows.length > 0) {
          tables.push({
            name: tableTitle,
            headers,
            rows,
            page: pageNum,
          });
          continue;
        }
      }
    }

    // B. Whitespace-aligned columns table detection
    // Look for lines that have 2 or more columns separated by 2+ spaces or \t
    const splitWhitespace = (l: string): string[] => {
      return l.trim().split(/\s{2,}|\t/).map(c => c.trim()).filter(Boolean);
    };

    const firstCols = splitWhitespace(lines[i]);
    if (firstCols.length >= 2 && !lines[i].startsWith('#') && lines[i].length < 250) {
      const tableLines: string[] = [lines[i]];
      let j = i + 1;
      let targetColCount = firstCols.length;

      while (j < lines.length) {
        const nextLine = lines[j];
        if (!nextLine.trim()) break;
        if (nextLine.trim().startsWith('#')) break;

        // Skip divider lines like "----  ----  ----" or "====  ===="
        if (/^[-=\s_]+$/.test(nextLine.trim())) {
          j++;
          continue;
        }

        const cols = splitWhitespace(nextLine);
        // If row has similar number of columns (+-1) and >= 2 columns
        if (cols.length >= 2 && Math.abs(cols.length - targetColCount) <= 1) {
          tableLines.push(nextLine);
          j++;
        } else {
          break;
        }
      }

      // If we found at least 2 consecutive rows with multi-column alignment
      if (tableLines.length >= 2) {
        let tableTitle = lines[i - 1]?.replace(/^[#*\s-]+/, '').trim() || `${defaultTitle} (Page ${pageNum})`;
        if (tableTitle.length > 80 || splitWhitespace(tableTitle).length >= 2) {
          tableTitle = `${defaultTitle} ${tables.length + 1} (Page ${pageNum})`;
        }

        const headers = splitWhitespace(tableLines[0]);
        const rows = tableLines.slice(1).map(l => {
          const cells = splitWhitespace(l);
          // Pad or normalize cell count to headers.length
          while (cells.length < headers.length) cells.push('');
          return cells.slice(0, Math.max(headers.length, cells.length));
        });

        if (headers.length >= 2 && rows.length > 0) {
          tables.push({
            name: tableTitle,
            headers,
            rows,
            page: pageNum,
          });
          i = j;
          continue;
        }
      }
    }

    // C. Delimited lines (comma or semicolon)
    const delimiter = line.includes(';') ? ';' : line.includes(',') ? ',' : null;
    if (delimiter) {
      const splitDelim = (l: string) => l.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      const initialCols = splitDelim(lines[i]);
      if (initialCols.length >= 2 && initialCols.every(c => c.length < 60)) {
        const tableLines = [lines[i]];
        let k = i + 1;
        while (k < lines.length) {
          const nextCols = splitDelim(lines[k]);
          if (nextCols.length === initialCols.length) {
            tableLines.push(lines[k]);
            k++;
          } else {
            break;
          }
        }
        if (tableLines.length >= 3) {
          const headers = splitDelim(tableLines[0]);
          const rows = tableLines.slice(1).map(splitDelim);
          tables.push({
            name: `${defaultTitle} (Page ${pageNum})`,
            headers,
            rows,
            page: pageNum,
          });
          i = k;
          continue;
        }
      }
    }

    i++;
  }

  return tables;
}

/**
 * Parses a PDF buffer using pdf-parse with fallback to stream decoding.
 * Extracts genuine page text and detects genuine tables across all languages.
 */
export async function parsePdfDocument(fileBuffer: Buffer, filename: string): Promise<ParseResult> {
  let rawPagesText: Array<{ pageNum: number; text: string }> = [];

  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    if (result && Array.isArray(result.pages) && result.pages.length > 0) {
      rawPagesText = result.pages.map((p: any) => ({
        pageNum: p.num || 1,
        text: typeof p.text === 'string' ? p.text : '',
      })).filter(p => p.text.trim().length > 0);
    }
  } catch {
    rawPagesText = [];
  }

  // Fallback direct stream extraction if pdf-parse returned no pages
  if (rawPagesText.length === 0) {
    try {
      const latin1 = fileBuffer.toString('latin1');
      // Match PDF text operators (Tj, TJ, ')
      const strings: string[] = [];
      const tjRegex = /\((?:[^()\\]|\\.)*\)\s*Tj/g;
      let m: RegExpExecArray | null;
      while ((m = tjRegex.exec(latin1)) !== null) {
        const raw = m[0].replace(/\)\s*Tj$/, '').replace(/^\(/, '');
        const decoded = raw.replace(/\\([()\\])/g, '$1').replace(/\\r/g, ' ').replace(/\\n/g, ' ').trim();
        if (decoded.length > 0) strings.push(decoded);
      }

      if (strings.length > 0) {
        rawPagesText = [{ pageNum: 1, text: strings.join('\n') }];
      }
    } catch {
      rawPagesText = [];
    }
  }

  const cleanTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const totalPages = Math.max(1, rawPagesText.length);
  const pages: ExtractedPage[] = [];
  let fullDocText = '';

  for (let p = 1; p <= totalPages; p++) {
    const pageEntry = rawPagesText.find(pt => pt.pageNum === p) || rawPagesText[p - 1];
    const pageText = pageEntry ? pageEntry.text : '';
    fullDocText += ' ' + pageText;

    const lines = pageText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const tables = detectTablesFromLines(lines, p, cleanTitle);

    const headings: string[] = [];
    const paragraphs: string[] = [];
    const lists: string[] = [];

    // Filter out lines that belong to detected tables so we don't duplicate them
    const tableLineSnippets = new Set<string>();
    tables.forEach(t => {
      t.headers.forEach(h => tableLineSnippets.add(h));
      t.rows.forEach(r => r.forEach(c => tableLineSnippets.add(c)));
    });

    lines.forEach(line => {
      if (line.startsWith('#') || (line.length < 60 && /^[A-Z0-9\s]{3,}$/.test(line))) {
        headings.push(line.replace(/^#+\s*/, ''));
      } else if (line.startsWith('-') || line.startsWith('*') || /^\d+\.\s/.test(line)) {
        lists.push(line.replace(/^[-*]|\d+\.\s*/, '').trim());
      } else if (line.length > 0) {
        paragraphs.push(line);
      }
    });

    pages.push({
      pageNum: p,
      text: pageText,
      lines,
      tables,
      headings,
      paragraphs,
      lists,
    });
  }

  const detectedLanguage = detectLanguage(fullDocText);
  const hasTables = pages.some(p => p.tables.length > 0);

  return {
    pages,
    totalPages,
    detectedLanguage,
    hasTables,
  };
}

/**
 * Universal text/markdown/code/log parser with genuine multi-page distribution
 * and table detection.
 */
export function parseTextDocument(rawContent: string, filename: string, targetPages = 1): ParseResult {
  const lines = rawContent.split(/\r?\n/).map(l => l.trimEnd());
  const cleanTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const detectedLanguage = detectLanguage(rawContent);

  // Detect tables across the whole document
  const allTables = detectTablesFromLines(lines, 1, cleanTitle);

  const linesPerPage = Math.max(15, Math.ceil(lines.length / (targetPages || 1)));
  const totalPages = Math.max(1, Math.min(targetPages || 1, Math.ceil(lines.length / linesPerPage)));
  const pages: ExtractedPage[] = [];

  for (let p = 1; p <= totalPages; p++) {
    const pageLines = lines.slice((p - 1) * linesPerPage, p * linesPerPage).filter(l => l.trim().length > 0);
    const pageTables = detectTablesFromLines(pageLines, p, cleanTitle);

    const headings: string[] = [];
    const paragraphs: string[] = [];
    const lists: string[] = [];

    pageLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        headings.push(trimmed.replace(/^#+\s*/, ''));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
        lists.push(trimmed.replace(/^[-*]|\d+\.\s*/, '').trim());
      } else if (trimmed.length > 0 && !trimmed.includes('|')) {
        paragraphs.push(trimmed);
      }
    });

    pages.push({
      pageNum: p,
      text: pageLines.join('\n'),
      lines: pageLines,
      tables: pageTables.length > 0 ? pageTables : (p === 1 ? allTables : []),
      headings,
      paragraphs,
      lists,
    });
  }

  return {
    pages,
    totalPages,
    detectedLanguage,
    hasTables: pages.some(p => p.tables.length > 0) || allTables.length > 0,
  };
}
