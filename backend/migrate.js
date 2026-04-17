const { client } = require('./config/db');

async function migrate() {
  console.log('Starting migration...');
  try {
    await client.execute("ALTER TABLE questions ADD COLUMN sample_input TEXT");
    await client.execute("ALTER TABLE questions ADD COLUMN sample_output TEXT");
    await client.execute("ALTER TABLE questions ADD COLUMN constraints TEXT");
    console.log('Migration successful: Added coding-specific fields to questions table.');
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
        console.log('Migration skipped: Columns already exist.');
    } else {
        console.error('Migration failed:', e.message);
    }
  }
}

migrate().then(() => process.exit());
