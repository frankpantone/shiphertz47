const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDocuments() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking for transportation request...');
  console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  // First, check the transportation_requests table
  const { data: request, error: requestError } = await supabase
    .from('transportation_requests')
    .select('*')
    .or('order_number.eq.TRQ_1753675674200_pvign6,id.eq.c4ceb33b-7a33-4944-b38e-ad23eedb38ce')
    .single();

  if (requestError) {
    console.error('Error fetching transportation request:', requestError);
    return;
  }

  if (!request) {
    console.log('No transportation request found with the specified order number or ID');
    return;
  }

  console.log('Found transportation request:');
  console.log('- ID:', request.id);
  console.log('- Order Number:', request.order_number);
  console.log('- User ID:', request.user_id);
  console.log('- Status:', request.status);
  console.log('- Created At:', request.created_at);
  console.log('');

  // Now check for document attachments
  console.log('Checking for document attachments...');
  
  const { data: attachments, error: attachmentError } = await supabase
    .from('document_attachments')
    .select('*')
    .eq('transportation_request_id', request.id);

  if (attachmentError) {
    console.error('Error fetching document attachments:', attachmentError);
    return;
  }

  if (!attachments || attachments.length === 0) {
    console.log('No document attachments found for this transportation request.');
    
    // Also check for a generic 'attachments' table just in case
    console.log('\\nChecking for generic attachments table...');
    const { data: genericAttachments, error: genericError } = await supabase
      .from('attachments')
      .select('*')
      .eq('transportation_request_id', request.id);
    
    if (genericError) {
      console.log('No generic attachments table found or no access.');
    } else if (!genericAttachments || genericAttachments.length === 0) {
      console.log('No generic attachments found either.');
    } else {
      console.log(`Found ${genericAttachments.length} generic attachment(s):`);
      genericAttachments.forEach((attachment, index) => {
        console.log(`\\nGeneric Attachment ${index + 1}:`);
        console.log('- ID:', attachment.id);
        console.log('- File Name:', attachment.file_name || 'N/A');
        console.log('- Created At:', attachment.created_at);
      });
    }
  } else {
    console.log(`Found ${attachments.length} document attachment(s):`);
    attachments.forEach((attachment, index) => {
      console.log(`\nAttachment ${index + 1}:`);
      console.log('- ID:', attachment.id);
      console.log('- File Name:', attachment.file_name);
      console.log('- File Size:', attachment.file_size, 'bytes');
      console.log('- File Type:', attachment.file_type);
      console.log('- Storage Path:', attachment.storage_path);
      console.log('- Uploaded By:', attachment.uploaded_by);
      console.log('- Created At:', attachment.created_at);
    });
  }
}

checkDocuments().catch(console.error);
