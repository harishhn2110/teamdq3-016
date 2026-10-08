import { GoogleGenAI } from '@google/genai';
import { db } from './store.js';
import { AskResponse, EvidenceSource } from '../src/types.js';

export async function askDocumentQuestion(documentId: string, question: string): Promise<AskResponse> {
  const doc = db.getDocument(documentId);
  const blocks = db.getBlocks(documentId);
  const qLower = question.toLowerCase();

  // If Gemini API Key is available, use real LLM grounded on blocks
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are ParseAnything Atlas, an evidence-first document intelligence platform.
Answer the following question about the document based ONLY on the provided extracted semantic blocks.
Every statement must be grounded in the provided blocks.
If the blocks do not contain sufficient evidence to answer, state clearly that reliable evidence was not found.

Semantic Blocks:
${JSON.stringify(blocks.map(b => ({
  id: b.id,
  page: b.page,
  type: b.type,
  content: b.content,
  confidence: b.confidence,
  bbox: b.bbox_formatted,
})), null, 2)}

User Question: "${question}"

Respond with JSON adhering to this schema:
{
  "answer": "clear, concise factual answer grounded in the blocks",
  "confidence": 0.95, // 0.0 to 1.0 based on clarity of proof
  "citedBlockIds": ["A72", "A68"], // array of block IDs providing evidence
  "explanation": "brief note on evidence path"
}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      const sources: EvidenceSource[] = (parsed.citedBlockIds || [])
        .map((bid: string) => blocks.find(b => b.id === bid))
        .filter(Boolean)
        .map((b: any) => ({
          block_id: b.id,
          document_id: documentId,
          page: b.page,
          type: b.type,
          content: b.content,
          confidence: b.confidence,
          bbox: b.bbox,
          bbox_formatted: b.bbox_formatted,
        }));

      return {
        question,
        answer: parsed.answer || 'No direct evidence found in the document.',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
        sources,
        explanation: parsed.explanation,
      };
    } catch (err) {
      console.warn('Gemini query error, falling back to deterministic evidence matcher:', err);
    }
  }

  const isDemo = !doc || doc.id === 'doc-annual-report-2024' || doc.filename === 'Annual_Report.pdf';

  // Demo Document Specific Handlers
  if (isDemo) {
    if (qLower.includes('north america') || (qLower.includes('revenue') && !qLower.includes('margin'))) {
      const a72 = blocks.find(b => b.id === 'A72');
      const a68 = blocks.find(b => b.id === 'A68');
      const sources: EvidenceSource[] = [a72, a68].filter(Boolean).map(b => ({
        block_id: b!.id,
        document_id: documentId,
        page: b!.page,
        type: b!.type,
        content: b!.content,
        confidence: b!.confidence,
        bbox: b!.bbox,
        bbox_formatted: b!.bbox_formatted,
      }));

      return {
        question,
        answer: 'The total is $4.62M for North America in 2024. That represents a 10.5% increase over 2023.',
        confidence: 0.98,
        sources,
        explanation: 'Extracted from regional revenue table cell A72 and summarized row A68 on page 7.',
      };
    }

    if (qLower.includes('margin') || qLower.includes('ebitda')) {
      const a74 = blocks.find(b => b.id === 'A74');
      const a10 = blocks.find(b => b.id === 'A10');
      const sources: EvidenceSource[] = [a74, a10].filter(Boolean).map(b => ({
        block_id: b!.id,
        document_id: documentId,
        page: b!.page,
        type: b!.type,
        content: b!.content,
        confidence: b!.confidence,
        bbox: b!.bbox,
        bbox_formatted: b!.bbox_formatted,
      }));

      return {
        question,
        answer: 'Adjusted EBITDA margin expanded 180 bps to 24.8%, supported by the figure caption and margin bridge.',
        confidence: 0.91,
        sources,
        explanation: 'Sourced from Figure caption A74 and historical chart A10 on pages 1 and 7.',
      };
    }

    if (qLower.includes('human') || qLower.includes('review') || qLower.includes('attention')) {
      const a91 = blocks.find(b => b.id === 'A91');
      const a74 = blocks.find(b => b.id === 'A74');
      const sources: EvidenceSource[] = [a91, a74].filter(Boolean).map(b => ({
        block_id: b!.id,
        document_id: documentId,
        page: b!.page,
        type: b!.type,
        content: b!.content,
        confidence: b!.confidence,
        bbox: b!.bbox,
        bbox_formatted: b!.bbox_formatted,
      }));

      return {
        question,
        answer: 'Two items require human attention: paragraph block A91 due to OCR symbol ambiguity (Revenue: $8?3M) and figure A74 where caption alignment warrants confirmation.',
        confidence: 0.88,
        sources,
        explanation: 'Identified via human-in-the-loop review queue thresholds (<0.70 confidence).',
      };
    }
  }

  // Grounded search across the browsed document's actual blocks
  const meaningfulWords = qLower
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'from', 'with', 'about', 'does', 'have', 'been'].includes(w));

  const scoredBlocks = blocks.map(b => {
    const text = b.content.toLowerCase();
    let score = 0;
    meaningfulWords.forEach(w => {
      if (text.includes(w)) score += 1;
    });
    return { block: b, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  if (scoredBlocks.length > 0) {
    const topBlocks = scoredBlocks.slice(0, 3).map(s => s.block);
    const sources: EvidenceSource[] = topBlocks.map(b => ({
      block_id: b.id,
      document_id: documentId,
      page: b.page,
      type: b.type,
      content: b.content,
      confidence: b.confidence,
      bbox: b.bbox,
      bbox_formatted: b.bbox_formatted,
    }));

    return {
      question,
      answer: `Found in ${doc?.filename || 'document'} (Page ${topBlocks[0].page}): ${topBlocks[0].content}`,
      confidence: Math.min(0.95, 0.75 + topBlocks[0].confidence * 0.2),
      sources,
      explanation: `Matched ${meaningfulWords.length} terms across block ${topBlocks[0].id} (Page ${topBlocks[0].page}).`,
    };
  }

  return {
    question,
    answer: 'Atlas could not find reliable evidence in the indexed document blocks to answer this question accurately.',
    confidence: 0.15,
    sources: [],
    explanation: 'No supporting source regions found in document index.',
  };
}
