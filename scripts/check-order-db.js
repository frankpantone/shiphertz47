const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrderAndAttachments() {
  const orderId = '7251dcc8-3449-4589-8777-12645f654bc2';
  const actualOrderId = '7251dcc6-34a9-4589-8777-12e45f654bc2'; // Found from the previous query
  const orderNumber = 'TRQ_1753749969067_k7w83w';
  
  console.log('=== Checking Transportation Request ===');
  
  // Query transportation_requests table
  const { data: orderData, error: orderError } = await supabase
    .from('transportation_requests')
    .select('*')
    .eq('id', orderId);
    
  if (orderError) {
    console.error('Error querying transportation_requests:', orderError);
  } else {
    console.log('Order found:', orderData.length > 0);
    if (orderData.length > 0) {
      const order = orderData[0];
      console.log('Order details:');
      console.log('- ID:', order.id);
      console.log('- Order Number:', order.order_number);
      console.log('- Status:', order.status);
      console.log('- Created:', order.created_at);
      console.log('- Customer ID:', order.customer_id);
    }
  }
  
  console.log('\n=== Checking by Order Number ===');
  
  // Also check by order number in case ID doesn't match
  const { data: orderByNumber, error: orderByNumberError } = await supabase
    .from('transportation_requests')
    .select('*')
    .eq('order_number', orderNumber);
    
  if (orderByNumberError) {
    console.error('Error querying by order number:', orderByNumberError);
  } else {
    console.log('Orders found by number:', orderByNumber.length);
    if (orderByNumber.length > 0) {
      orderByNumber.forEach((order, index) => {
        console.log(`Order ${index + 1}:`);
        console.log('- ID:', order.id);
        console.log('- Order Number:', order.order_number);
        console.log('- Status:', order.status);
        console.log('- Created:', order.created_at);
      });
    }
  }
  
  console.log('\n=== Checking Document Attachments ===');
  
  // Check document_attachments table for this order
  const { data: attachments, error: attachmentsError } = await supabase
    .from('document_attachments')
    .select('*')
    .eq('transportation_request_id', actualOrderId);
    
  if (attachmentsError) {
    console.error('Error querying document_attachments:', attachmentsError);
  } else {
    console.log('Attachments found:', attachments.length);
    attachments.forEach((attachment, index) => {
      console.log(`Attachment ${index + 1}:`);
      console.log('- ID:', attachment.id);
      console.log('- Filename:', attachment.file_name);
      console.log('- File Path:', attachment.file_path);
      console.log('- File Size:', attachment.file_size);
      console.log('- Content Type:', attachment.content_type);
      console.log('- Created:', attachment.created_at);
      console.log('- Uploaded by:', attachment.uploaded_by);
    });
  }
  
  console.log('\n=== Checking for HCL30609.pdf specifically ===');
  
  // Check for the specific file HCL30609.pdf
  const { data: specificFile, error: specificFileError } = await supabase
    .from('document_attachments')
    .select('*')
    .ilike('file_name', '%HCL30609.pdf%');
    
  if (specificFileError) {
    console.error('Error searching for HCL30609.pdf:', specificFileError);
  } else {
    console.log('HCL30609.pdf files found:', specificFile.length);
    specificFile.forEach((file, index) => {
      console.log(`File ${index + 1}:`);
      console.log('- ID:', file.id);
      console.log('- Transportation Request ID:', file.transportation_request_id);
      console.log('- Filename:', file.file_name);
      console.log('- File Path:', file.file_path);
      console.log('- Created:', file.created_at);
    });
  }
  
  console.log('\n=== Checking Recent Uploads (Last 4 Hours) ===');
  
  // Get recent document uploads
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data: recentUploads, error: recentError } = await supabase
    .from('document_attachments')
    .select('*')
    .gte('created_at', fourHoursAgo)
    .order('created_at', { ascending: false });
    
  if (recentError) {
    console.error('Error querying recent uploads:', recentError);
  } else {
    console.log('Recent uploads (last 4 hours):', recentUploads.length);
    recentUploads.forEach((upload, index) => {
      console.log(`Upload ${index + 1}:`);
      console.log('- Filename:', upload.file_name);
      console.log('- Transportation Request ID:', upload.transportation_request_id);
      console.log('- Created:', upload.created_at);
      console.log('- File Path:', upload.file_path);
    });
  }
  
  console.log('\n=== Checking Attachments Table Schema ===');
  
  // Check if we're using 'attachments' instead of 'document_attachments'
  const { data: attachmentsAlt, error: attachmentsAltError } = await supabase
    .from('attachments')
    .select('*')
    .eq('transportation_request_id', orderId);
    
  if (attachmentsAltError) {
    console.log('attachments table error (may not exist):', attachmentsAltError.message);
  } else {
    console.log('Attachments in "attachments" table:', attachmentsAlt.length);
    attachmentsAlt.forEach((attachment, index) => {
      console.log(`Attachment ${index + 1}:`);
      console.log('- ID:', attachment.id);
      console.log('- Filename:', attachment.filename || attachment.file_name);
      console.log('- File Path:', attachment.file_path);
      console.log('- Created:', attachment.created_at);
    });
  }
}

checkOrderAndAttachments().catch(console.error);