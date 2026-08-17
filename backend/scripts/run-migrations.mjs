import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const migrationFiles = [
  'torren-schema-migration.sql',
  'products-schema-migration.sql',
  'products-image-migration.sql',
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const migrationResults = [];

try {
  const client = await pool.connect();

  try {
    for (const file of migrationFiles) {
      const sql = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
      console.log(`\n--- Applying migration: ${file} ---`);
      await client.query(sql);
      console.log(`Migration applied: ${file}`);
      migrationResults.push({ file, status: 'applied' });
    }

    const { rows: tableRows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('landing_content', 'services', 'products', 'subscriptions')
      ORDER BY table_name
    `);

    const { rows: columnRows } = await client.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name IN ('plan_id', 'product_id')
      ORDER BY column_name
    `);

    const { rows: productCountRows } = await client.query(`SELECT COUNT(*)::int AS count FROM products`);

    const { rows: imageColumnRows } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'image_url'
    `);

    const { rows: bucketRows } = await client.query(`
      SELECT id FROM storage.buckets WHERE id = 'product-images'
    `);

    console.log('\nMigration summary:');
    console.log('Tables present:', tableRows.map(r => r.table_name).join(', ') || 'none');
    console.log('Subscriptions columns:', columnRows.map(r => `${r.column_name} nullable=${r.is_nullable}`).join(', ') || 'none');
    console.log('Products seeded:', productCountRows[0]?.count ?? 0);
    console.log('products.image_url present:', imageColumnRows.length > 0);
    console.log('product-images bucket present:', bucketRows.length > 0);
    console.log('\nResult payload:');
    console.log(JSON.stringify({
      migrations: migrationResults,
      tables: tableRows.map(r => r.table_name),
      subscriptionsColumns: columnRows.map(r => ({ column: r.column_name, nullable: r.is_nullable })),
      productCount: productCountRows[0]?.count ?? 0,
      productImageColumn: imageColumnRows.length > 0,
      productImagesBucket: bucketRows.length > 0,
    }, null, 2));
  } finally {
    client.release();
  }
} catch (error) {
  console.error('Migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
