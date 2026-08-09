import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase
      .from('plans')
      .select('id, name, slug, base_price, billing_type, plan_family, dev_hours_monthly, features, stripe_product_id, stripe_price_id')
      .eq('active', true)
      .order('sort_order', { ascending: true });
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data.length);
  }
}
run();
