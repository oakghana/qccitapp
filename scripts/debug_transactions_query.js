const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(path) {
  const content = fs.readFileSync(path, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([^=]+)=([\s\S]*)$/);
    if (m) {
      const key = m[1].trim();
      let val = m[2].trim();
      // strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

async function main() {
  loadEnv('.env.local');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const location = process.argv[2] || 'Central Stores';
  const likePattern = `%${location}%`;
  try {
    // Try filtering by location_name first
    let res = await supabase
      .from('stock_transactions')
      .select('*')
      .ilike('location_name', likePattern)
      .order('created_at', { ascending: false })
      .limit(5);

    if (res.error) {
      console.warn('Filter by location_name failed, error:', res.error)
      // Fallback to unfiltered fetch
      res = await supabase
        .from('stock_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
    }

    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Query error:', err);
  }
}

main();
