import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');
    await client.query('BEGIN');
    
    // 1. Add new columns
    console.log('Adding new columns...');
    await client.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS base_price numeric(10, 2)`);
    await client.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS billing_type varchar(50) DEFAULT 'monthly' NOT NULL`);
    await client.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_family varchar(50) DEFAULT 'care' NOT NULL`);
    await client.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_product_id varchar(100)`);
    await client.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_price_id varchar(100)`);
    
    // 2. Migrate priceMonthly to basePrice if basePrice is null
    console.log('Migrating priceMonthly to basePrice...');
    await client.query(`UPDATE plans SET base_price = price_monthly WHERE base_price IS NULL AND price_monthly IS NOT NULL`);
    
    // 3. Make basePrice NOT NULL
    console.log('Making base_price NOT NULL...');
    await client.query(`ALTER TABLE plans ALTER COLUMN base_price SET NOT NULL`);
    
    // 4. Modify dev_hours_monthly to be nullable
    console.log('Modifying dev_hours_monthly to be nullable and default 0...');
    await client.query(`ALTER TABLE plans ALTER COLUMN dev_hours_monthly DROP NOT NULL`);
    await client.query(`ALTER TABLE plans ALTER COLUMN dev_hours_monthly SET DEFAULT 0`);
    
    // 5. Drop old column
    console.log('Dropping price_monthly...');
    await client.query(`ALTER TABLE plans DROP COLUMN IF NOT EXISTS price_monthly`);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
