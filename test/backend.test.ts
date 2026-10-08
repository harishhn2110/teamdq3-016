import { db } from '../server/store.js';
import { askDocumentQuestion } from '../server/qa.js';
import { generateExport, maskContent } from '../server/export.js';

async function runTests() {
  console.log('--- Starting ParseAnything Atlas Backend Tests ---');
  let failures = 0;

  function assert(condition: boolean, name: string) {
    if (!condition) {
      console.error(`❌ FAIL: ${name}`);
      failures++;
    } else {
      console.log(`✅ PASS: ${name}`);
    }
  }

  // 1. PROJECTS
  const initialProjects = db.getProjects('default-user');
  assert(initialProjects.length >= 4, 'List projects for default user');

  const newProject = db.createProject('Test M&A Due Diligence', 'Test project', 'user-123');
  assert(newProject.name === 'Test M&A Due Diligence', 'Create project');

  const user123Projects = db.getProjects('user-123');
  assert(user123Projects.length === 1 && user123Projects[0].id === newProject.id, 'Project ownership isolation');

  const otherUserProjects = db.getProjects('other-user');
  assert(otherUserProjects.length === 0, 'User isolation keeps other projects empty');

  // 2. DOCUMENTS & ASSOCIATIONS
  const demoDocs = db.getDocumentsByProject('atlas-demo');
  assert(demoDocs.length >= 1, 'Documents belong to project');
  const demoDoc = demoDocs[0];
  assert(demoDoc.filename === 'Annual_Report.pdf', 'Document retrieval');
  assert(demoDoc.page_count === 24, 'Document page count');

  // 3. BLOCKS & PROVENANCE
  const blocks = db.getBlocks(demoDoc.id);
  assert(blocks.length >= 8, 'Extracted semantic blocks stored');
  const a72 = db.getBlock(demoDoc.id, 'A72');
  assert(!!a72, 'Block A72 retrieved');
  assert(a72?.page === 7, 'Block A72 page provenance');
  assert(!!a72?.bbox && a72.bbox.x === 120, 'Block A72 coordinates provenance');
  assert(a72?.confidence === 0.98, 'Block confidence score');

  // 4. VALIDATION
  const validations = db.getValidations(demoDoc.id);
  assert(validations.length >= 4, 'Validation checks stored');
  const mismatchCheck = validations.find(v => v.status === 'mismatch');
  assert(!!mismatchCheck, 'Validation mismatch check detected');
  assert(mismatchCheck?.expected_value === '$7,850' && mismatchCheck?.actual_value === '$7,830', 'Expected vs Found values verified');

  // 5. ASK / GROUNDED Q&A
  const revenueAnswer = await askDocumentQuestion(demoDoc.id, 'What was the revenue for North America in 2024?');
  assert(revenueAnswer.confidence > 0.9, 'Ask returns high confidence for grounded question');
  assert(revenueAnswer.sources.length >= 1, 'Ask returns evidence citations');
  assert(revenueAnswer.sources[0].block_id === 'A72', 'Ask cites correct block A72');

  const unanswerable = await askDocumentQuestion(demoDoc.id, 'What is the CEO personal home address?');
  assert(unanswerable.confidence < 0.5, 'Unanswerable question gives low confidence');
  assert(unanswerable.sources.length === 0, 'No false citations generated for unanswerable question');

  // 6. HUMAN-IN-THE-LOOP REVIEW QUEUE
  const reviews = db.getReviews(demoDoc.id);
  assert(reviews.length >= 2, 'Review queue populated with low-confidence items');
  const revA91 = reviews.find(r => r.block_id === 'A91');
  assert(!!revA91 && revA91.status === 'pending', 'A91 pending human review');

  // Human correction
  db.updateReview(revA91!.id, {
    status: 'approved',
    corrected_value: 'Revenue: $8.3M',
  });
  const updatedRev = db.getReview(revA91!.id);
  assert(updatedRev?.status === 'approved', 'Review approved');
  assert(updatedRev?.extracted_value === 'Revenue: $8?3M', 'Original extraction preserved without deletion');
  assert(updatedRev?.corrected_value === 'Revenue: $8.3M', 'Human correction preserved');

  // 7. EXPORT & MASKING
  const rawEmail = 'Please contact mchen@acmeholdings.com or (555) 234-5678';
  const maskedEmail = maskContent(rawEmail);
  assert(maskedEmail.includes('••••••••••••••••'), 'Sensitive email masked');
  assert(!maskedEmail.includes('mchen@acmeholdings.com'), 'Raw email omitted when masked');

  const mdExport = generateExport(demoDoc.id, { format: 'markdown', mask_sensitive: true });
  assert(mdExport.content.includes('# Annual_Report.pdf'), 'Markdown export generated');
  assert(mdExport.content.includes('Total revenue'), 'Markdown export includes table data');

  const jsonExport = generateExport(demoDoc.id, { format: 'json', mask_sensitive: true });
  const parsedJson = JSON.parse(jsonExport.content);
  assert(parsedJson.blocks.length >= 8, 'JSON export preserves structured blocks');
  assert(parsedJson.meta.masked === true, 'JSON export records masking state');

  const csvExport = generateExport(demoDoc.id, { format: 'csv', mask_sensitive: false });
  assert(csvExport.content.includes('Block ID,Page,Type'), 'CSV export generated');

  const excelExport = generateExport(demoDoc.id, { format: 'excel', mask_sensitive: false });
  assert(excelExport.content.includes('BLOCK_ID\tPAGE'), 'Excel/TSV export generated');

  // 8. BROWSED JSON & MARKDOWN TABLE DATA INTEGRITY (NOT SAMPLE DOCUMENT)
  const browsedJsonDoc = {
    id: 'doc-browsed-custom-json',
    project_id: 'atlas-demo',
    filename: 'quarterly_metrics.json',
    original_filename: 'quarterly_metrics.json',
    mime_type: 'application/json',
    file_size: 1024,
    file_size_formatted: '1.0 KB',
    page_count: 1,
    status: 'ready' as const,
    progress: 100,
    stages: [],
    parsed_format: 'json' as const,
    raw_content: JSON.stringify([
      { quarter: 'Q1 2025', revenue: '$54.2M', growth: '+14%' },
      { quarter: 'Q2 2025', revenue: '$61.8M', growth: '+18%' },
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.setDocument(browsedJsonDoc.id, browsedJsonDoc);

  const jsonMdExport = generateExport(browsedJsonDoc.id, { format: 'markdown', mask_sensitive: false });
  assert(jsonMdExport.content.includes('Q1 2025') && jsonMdExport.content.includes('$54.2M'), 'Browsed JSON exports its own table data in Markdown');
  assert(!jsonMdExport.content.includes('North America') && !jsonMdExport.content.includes('Acme'), 'Browsed JSON does not use sample document table');

  const jsonStructExport = generateExport(browsedJsonDoc.id, { format: 'json', mask_sensitive: false });
  const parsedJsonExport = JSON.parse(jsonStructExport.content);
  assert(parsedJsonExport.tables.length === 1 && parsedJsonExport.tables[0].headers.includes('revenue'), 'Browsed JSON exports tables property with real headers');
  assert(parsedJsonExport.tables[0].rows[0].includes('$54.2M'), 'Browsed JSON exports real rows');

  const browsedMdDoc = {
    id: 'doc-browsed-custom-md',
    project_id: 'atlas-demo',
    filename: 'inventory_status.md',
    original_filename: 'inventory_status.md',
    mime_type: 'text/markdown',
    file_size: 2048,
    file_size_formatted: '2.0 KB',
    page_count: 1,
    status: 'ready' as const,
    progress: 100,
    stages: [],
    parsed_format: 'markdown' as const,
    raw_content: `# Warehouse Status Report\n\n| Item Code | Item Name | Stock Level | Warehouse |\n| :--- | :--- | :--- | :--- |\n| SKU-9901 | Titanium Bolt | 4,200 | Seattle Hub |\n| SKU-9902 | Carbon Gasket | 1,150 | Austin Depot |\n`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.setDocument(browsedMdDoc.id, browsedMdDoc);

  const mdTableExport = generateExport(browsedMdDoc.id, { format: 'markdown', mask_sensitive: false });
  assert(mdTableExport.content.includes('Titanium Bolt') && mdTableExport.content.includes('Seattle Hub'), 'Browsed Markdown exports its own table in Markdown');
  assert(!mdTableExport.content.includes('North America') && !mdTableExport.content.includes('7,850'), 'Browsed Markdown does not use sample document table');

  const mdJsonExport = generateExport(browsedMdDoc.id, { format: 'json', mask_sensitive: false });
  const parsedMdJson = JSON.parse(mdJsonExport.content);
  assert(parsedMdJson.tables.length === 1 && parsedMdJson.tables[0].headers.includes('Item Name'), 'Browsed Markdown exports tables in JSON with real headers');
  assert(parsedMdJson.tables[0].rows[0].includes('Titanium Bolt'), 'Browsed Markdown exports real table rows in JSON');

  // 9. THEME PREFERENCE
  assert(db.settings.theme_preference === 'system', 'Theme preference defaults to system');
  db.settings.theme_preference = 'dark';
  assert(db.settings.theme_preference === 'dark', 'Theme preference can be updated to dark');
  db.settings.theme_preference = 'light';
  assert(db.settings.theme_preference === 'light', 'Theme preference can be updated to light');

  console.log(`--- Finished. Failures: ${failures} ---`);
  process.exit(failures > 0 ? 1 : 0);
}

runTests();
