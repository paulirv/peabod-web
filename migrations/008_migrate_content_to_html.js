/**
 * Migration: Convert plain text content to HTML paragraphs
 *
 * This script migrates article and page content from newline-separated
 * plain text to properly formatted HTML with <p> tags.
 *
 * Usage:
 *   node migrations/008_migrate_content_to_html.js [--remote]
 *
 * Options:
 *   --remote  Apply migration to remote database (default: local)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execFileSync } = require('child_process');

const isRemote = process.argv.includes('--remote');
const remoteFlag = isRemote ? '--remote' : '--local';

console.log(`\nMigrating content to HTML format (${isRemote ? 'REMOTE' : 'LOCAL'} database)...\n`);

/**
 * Convert plain text to HTML paragraphs
 * @param {string} text - Plain text with newlines
 * @returns {string} HTML with <p> tags
 */
function textToHtml(text) {
  if (!text) return '';

  // Check if content already looks like HTML
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return null; // Signal to skip
  }

  // Split by newlines, filter empty lines, wrap in <p> tags
  const paragraphs = text
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p}</p>`)
    .join('\n');

  return paragraphs;
}

/**
 * Execute a D1 command using execFileSync (safer than exec)
 */
function executeD1(command) {
  const args = ['d1', 'execute', 'peabod-db', remoteFlag, `--command=${command}`, '--json'];
  const result = execFileSync('wrangler', args, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  return JSON.parse(result);
}

/**
 * Migrate a table's body content
 */
function migrateTable(tableName) {
  console.log(`\nMigrating ${tableName}...`);

  // Get all records
  const selectResult = executeD1(`SELECT id, body FROM ${tableName}`);
  const records = selectResult[0].results;

  console.log(`Found ${records.length} records`);

  let migrated = 0;
  let skipped = 0;

  for (const record of records) {
    const { id, body } = record;

    const htmlContent = textToHtml(body);

    // Skip if already HTML
    if (htmlContent === null) {
      console.log(`  Record ${id}: Already HTML, skipping`);
      skipped++;
      continue;
    }

    // Escape single quotes for SQL
    const escapedContent = htmlContent.replace(/'/g, "''");

    // Update the record
    const updateCommand = `UPDATE ${tableName} SET body = '${escapedContent}' WHERE id = ${id}`;
    executeD1(updateCommand);

    console.log(`  Record ${id}: Migrated`);
    migrated++;
  }

  console.log(`\n${tableName} migration complete: ${migrated} migrated, ${skipped} skipped`);
}

// Main migration
function main() {
  try {
    migrateTable('articles');
    migrateTable('pages');

    console.log('\n✅ Migration complete!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
