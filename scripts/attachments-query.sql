-- Query to find all transportation requests with document attachments
-- This query joins document_attachments with transportation_requests and profiles
-- to get complete order information including file details

SELECT 
    da.id as attachment_id,
    da.file_name,
    da.file_size,
    da.file_type,
    da.storage_path,
    da.created_at as attachment_uploaded_at,
    tr.id as request_id,
    tr.order_number,
    tr.status,
    tr.pickup_company_name,
    tr.delivery_company_name,
    tr.created_at as request_created_at,
    p.email as customer_email,
    p.full_name as customer_name,
    p.company_name as customer_company
FROM 
    document_attachments da
    INNER JOIN transportation_requests tr ON da.transportation_request_id = tr.id
    INNER JOIN profiles p ON tr.user_id = p.id
ORDER BY 
    da.created_at DESC;

-- Summary query: Count attachments per request
SELECT 
    tr.order_number,
    tr.status,
    p.email as customer_email,
    COUNT(da.id) as attachment_count,
    string_agg(da.file_name, ', ') as file_names
FROM 
    transportation_requests tr
    INNER JOIN document_attachments da ON tr.id = da.transportation_request_id
    INNER JOIN profiles p ON tr.user_id = p.id
GROUP BY 
    tr.id, tr.order_number, tr.status, p.email
ORDER BY 
    MAX(da.created_at) DESC;