# 🔍 Supabase File Upload Debugging Guide

This guide will help you debug and fix the 500 error when uploading PDF attachments to Supabase.

## 🚨 Current Issue Analysis

**Error:** `❌ Failed to submit request: Failed to save attachment record: 500`

**Root Cause:** Your current setup vs requested setup mismatch:
- **Current:** `documents` bucket with `userId/requestId/filename` paths
- **Requested:** `attachments` bucket with `requests/filename` paths

## 🧪 Quick Test Setup

### 1. Test Your Current Upload System

Visit: `http://localhost:3000/test-upload`

This page will:
- ✅ Validate your authentication session
- ✅ Test file selection and validation  
- ✅ Attempt upload to both bucket configurations
- ✅ Show detailed step-by-step console logs
- ✅ Test database record insertion

### 2. Import the Debug Functions

In any component where you want to test uploads:

```typescript
import { debugSupabaseUpload, testFileUpload } from '@/lib/supabase-upload-debug'

// Quick test
const result = await testFileUpload(yourPdfFile, 'request-id')

// Detailed test with options
const result = await debugSupabaseUpload(yourPdfFile, {
  bucketName: 'documents', // or 'attachments'
  pathPrefix: 'requests',  // optional
  requestId: 'your-request-id'
})
```

## 🏗️ Setup Your Preferred Configuration

### Option A: Use Current Setup (Recommended)

Your current setup is working and secure with RLS. Just fix the authentication:

```typescript
// In your upload function, replace the problematic session call:
const { data: sessionData } = await supabase.auth.getSession()
const userId = sessionData.session?.user.id
```

### Option B: Create New Attachments Bucket

If you want to use `attachments` bucket with `requests/` prefix:

#### 1. Run This SQL in Supabase Dashboard

```sql
-- Create the 'attachments' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow authenticated users to upload to requests/ folder
CREATE POLICY "Users can upload to requests folder" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'attachments' 
  AND starts_with(name, 'requests/')
);

-- Policy 2: Allow authenticated users to view files in requests/ folder  
CREATE POLICY "Users can view requests folder files"
ON storage.objects FOR SELECT
TO authenticated 
USING (
  bucket_id = 'attachments' 
  AND starts_with(name, 'requests/')
);
```

#### 2. Update Your Upload Code

```typescript
// Change your upload configuration to:
const filePath = `requests/${Date.now()}-${file.name}`
const { data, error } = await supabase.storage
  .from('attachments')
  .upload(filePath, file)
```

## 🔧 Fix Current Authentication Issues

The 500 error is likely due to authentication problems. Here's the fix:

### 1. Replace Problematic Session Calls

In your `app/request/page.tsx`, replace:

```typescript
// ❌ PROBLEMATIC (can hang)
const { data: { session } } = await supabase.auth.getSession()

// ✅ RELIABLE (with fallbacks)
import { getRawSession } from '@/lib/auth-raw'

const rawSession = await getRawSession()
const accessToken = rawSession.user ? 
  JSON.parse(localStorage.getItem('sb-sxhuqsrnxfunoasutezm-auth-token') || '{}').access_token 
  : null
```

### 2. Ensure Consistent User IDs

Make sure the `uploaded_by` field matches the JWT token user:

```typescript
const attachmentData = {
  transportation_request_id: requestId,
  file_name: file.name,
  file_size: file.size,
  file_type: file.type,
  storage_path: uploadData.path,
  uploaded_by: rawSession.user?.id // Must match auth.uid() from JWT
}
```

## 📊 Debug Console Logs

When testing, look for these logs in browser console:

### ✅ Successful Upload Logs
```
🔍 === STARTING SUPABASE UPLOAD DEBUG ===
🔍 📁 STEP 1: File Validation: {"name":"HCL30609.pdf","size":1234567,...}
🔍 🔐 STEP 2: Authentication Check: {"userId":"abc123...","hasAccessToken":true,...}
🔍 🏗️ STEP 3: Upload Configuration: {"bucketName":"documents","filePath":"abc123.../request-id/filename.pdf",...}
🔍 🪣 STEP 4: Bucket Validation: {"id":"documents","name":"documents",...}
🔍 ⬆️ STEP 5: File Upload to Storage: {"path":"abc123.../request-id/filename.pdf",...}
🔍 🔗 STEP 6: Generate File URL: {"publicUrl":"https://..."}
🔍 💾 STEP 7: Database Record Creation: {"transportation_request_id":"...","uploaded_by":"abc123...",...}
🔍 ✅ UPLOAD COMPLETED SUCCESSFULLY
```

### ❌ Failed Upload Logs
```
🔍 🔐 STEP 2: Authentication Check: No active session found
🔍 ❌ UPLOAD FAILED: Authentication error
```

## 🛠️ Common Issues & Solutions

### Issue 1: "No active session found"
**Solution:** User needs to log in again or session expired
```typescript
// Check if user is authenticated before upload
if (!user?.id) {
  throw new Error('Please log in to upload files')
}
```

### Issue 2: "Bucket not found"  
**Solution:** Create the bucket or use correct bucket name
```sql
INSERT INTO storage.buckets (id, name) VALUES ('attachments', 'attachments');
```

### Issue 3: "Upload failed: new row violates row-level security"
**Solution:** User ID in file path must match authenticated user
```typescript
const filePath = `${authenticatedUserId}/${requestId}/${filename}`
```

### Issue 4: "Database insertion failed: 500"
**Solution:** Check RLS policies and ensure `uploaded_by` matches `auth.uid()`

## 🔍 Step-by-Step Debugging Process

1. **Visit Test Page:** Go to `/test-upload`
2. **Select Your PDF:** Choose the HCL30609.pdf file
3. **Run Full Test:** Click "🧪 Run Full Test" button
4. **Check Console:** Open browser DevTools (F12) → Console tab
5. **Review Logs:** Look for which step fails and why
6. **Fix Issues:** Use the error messages to identify and fix problems
7. **Re-test:** Run test again until it succeeds

## 📝 Integration with Your App

Once debugging is complete, integrate the working upload logic into your main app:

```typescript
// In your form submission:
import { debugSupabaseUpload } from '@/lib/supabase-upload-debug'

const uploadResult = await debugSupabaseUpload(file, {
  bucketName: 'documents', // Use what works from testing
  requestId: yourRequestId
})

if (uploadResult.success) {
  console.log('File uploaded:', uploadResult.data?.fileUrl)
} else {
  console.error('Upload failed:', uploadResult.error)
}
```

## 🎯 Next Steps

1. **Test Current Setup:** Visit `/test-upload` and test with your PDF
2. **Review Console Logs:** Identify exactly where it fails
3. **Fix Authentication:** Ensure consistent user session handling
4. **Choose Bucket Strategy:** Stick with current or create new setup
5. **Update Main App:** Apply working configuration to your request form

---

**💡 Pro Tip:** The debugging functions provide the exact same functionality as your main app but with detailed logging, so if the debugger works, your main app will work with the same configuration! 