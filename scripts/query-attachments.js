#!/usr/bin/env node

// Query transportation requests with document attachments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function queryTransportationRequestsWithAttachments() {
  console.log('Querying transportation requests with document attachments...\n');

  try {
    // Query with join to get complete information
    const { data, error } = await supabase
      .from('document_attachments')
      .select(`
        id,
        file_name,
        file_size,
        file_type,
        storage_path,
        created_at,
        transportation_request_id,
        transportation_requests (
          id,
          order_number,
          status,
          pickup_company_name,
          delivery_company_name,
          created_at,
          user_id,
          profiles!transportation_requests_user_id_fkey (
            email,
            full_name,
            company_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying attachments:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No transportation requests with attachments found.');
      return;
    }

    console.log(`Found ${data.length} document attachments across transportation requests:\n`);

    // Group by transportation request
    const requestsMap = new Map();
    
    data.forEach(attachment => {
      const requestId = attachment.transportation_request_id;
      if (!requestsMap.has(requestId)) {
        requestsMap.set(requestId, {
          request: attachment.transportation_requests,
          attachments: []
        });
      }
      requestsMap.get(requestId).attachments.push({
        id: attachment.id,
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        file_type: attachment.file_type,
        storage_path: attachment.storage_path,
        created_at: attachment.created_at
      });
    });

    // Display results grouped by request
    let requestCount = 0;
    for (const [requestId, { request, attachments }] of requestsMap) {
      requestCount++;
      console.log(`=== Transportation Request #${requestCount} ===`);
      console.log(`Order Number: ${request.order_number}`);
      console.log(`Request ID: ${requestId}`);
      console.log(`Status: ${request.status}`);
      console.log(`Customer: ${request.profiles?.full_name} (${request.profiles?.email})`);
      console.log(`Pickup: ${request.pickup_company_name}`);
      console.log(`Delivery: ${request.delivery_company_name}`);
      console.log(`Request Created: ${request.created_at}`);
      console.log(`\nAttachments (${attachments.length}):`);
      
      attachments.forEach((attachment, index) => {
        console.log(`  ${index + 1}. ${attachment.file_name}`);
        console.log(`     - ID: ${attachment.id}`);
        console.log(`     - Type: ${attachment.file_type}`);
        console.log(`     - Size: ${attachment.file_size} bytes`);
        console.log(`     - Storage Path: ${attachment.storage_path}`);
        console.log(`     - Uploaded: ${attachment.created_at}`);
      });
      console.log('\n' + '='.repeat(50) + '\n');
    }

    console.log(`\nSummary:`);
    console.log(`- Total transportation requests with attachments: ${requestsMap.size}`);
    console.log(`- Total document attachments: ${data.length}`);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the query
queryTransportationRequestsWithAttachments()
  .then(() => {
    console.log('\nQuery completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Script error:', err);
    process.exit(1);
  });