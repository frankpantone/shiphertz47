const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryTransportationRequests() {
  try {
    const { data, error } = await supabase
      .from('transportation_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error querying transportation_requests:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No transportation requests found');
      return;
    }

    console.log('\n=== First 5 Transportation Requests ===\n');
    
    data.forEach((request, index) => {
      console.log(`${index + 1}. Order #${request.order_number}`);
      console.log(`   Status: ${request.status.toUpperCase()}`);
      console.log(`   Created: ${new Date(request.created_at).toLocaleString()}`);
      console.log(`   Pickup:`);
      console.log(`     - Company: ${request.pickup_company_name}`);
      console.log(`     - Address: ${request.pickup_company_address}`);
      console.log(`     - Contact: ${request.pickup_contact_name} (${request.pickup_contact_phone})`);
      console.log(`   Delivery:`);
      console.log(`     - Company: ${request.delivery_company_name}`);
      console.log(`     - Address: ${request.delivery_company_address}`);
      console.log(`     - Contact: ${request.delivery_contact_name} (${request.delivery_contact_phone})`);
      console.log(`   Vehicle:`);
      console.log(`     - VIN: ${request.vin_number}`);
      if (request.vehicle_make || request.vehicle_model || request.vehicle_year) {
        console.log(`     - Details: ${request.vehicle_year || ''} ${request.vehicle_make || ''} ${request.vehicle_model || ''}`);
      }
      if (request.notes) {
        console.log(`   Notes: ${request.notes}`);
      }
      console.log('   ' + '='.repeat(60));
    });
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

queryTransportationRequests();