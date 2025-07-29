/**
 * 🔍 SUPABASE FILE UPLOAD DEBUGGER
 * Comprehensive debugging function for Supabase file uploads
 * Tests authentication, file validation, storage upload, and database insertion
 */

import { supabase } from './supabase'

interface UploadResult {
  success: boolean
  data?: {
    storageData: any
    dbRecord: any
    filePath: string
    fileUrl: string
  }
  error?: string
  debugLogs: string[]
}

interface UploadOptions {
  bucketName?: string // Default: 'documents' (your current setup) or 'attachments' (your preference)
  pathPrefix?: string // Default: '${userId}/${requestId}' or 'requests' 
  tableName?: string // Default: 'document_attachments'
  requestId?: string // Required for database record
}

/**
 * 🚀 Debug Upload Function
 * Step-by-step file upload with comprehensive logging
 */
export async function debugSupabaseUpload(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const logs: string[] = []
  const log = (message: string, data?: any) => {
    const logMessage = data ? `${message}: ${JSON.stringify(data, null, 2)}` : message
    console.log(`🔍 ${logMessage}`)
    logs.push(logMessage)
  }

  try {
    log('=== STARTING SUPABASE UPLOAD DEBUG ===')
    
    // STEP 1: Validate file
    log('📁 STEP 1: File Validation')
    if (!file) {
      throw new Error('No file provided')
    }
    
    log('File details', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    })

    if (file.size === 0) {
      throw new Error('File is empty')
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File too large (>50MB)')
    }

    // STEP 2: Check authentication
    log('🔐 STEP 2: Authentication Check')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      log('Session error', sessionError)
      throw new Error(`Authentication error: ${sessionError.message}`)
    }

    if (!sessionData.session) {
      throw new Error('No active session found')
    }

    if (!sessionData.session.user) {
      throw new Error('No user in session')
    }

    const user = sessionData.session.user
    log('Session details', {
      userId: user.id,
      email: user.email,
      hasAccessToken: !!sessionData.session.access_token,
      expiresAt: sessionData.session.expires_at
    })

    // STEP 3: Setup bucket and path configuration
    log('🏗️ STEP 3: Upload Configuration')
    const bucketName = options.bucketName || 'documents' // Your current bucket
    
    // Generate a proper UUID for requestId if not provided
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    const requestId = options.requestId || generateUUID()
    
    // Two path options:
    // Option A: Your current setup (userId/requestId/filename)
    // Option B: Your preferred setup (requests/filename)
    const useCurrentSetup = !options.pathPrefix || options.pathPrefix.includes('userId')
    
    let filePath: string
    if (useCurrentSetup) {
      // Current setup: user-scoped paths for RLS
      const fileExt = file.name.split('.').pop()
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      filePath = `${user.id}/${requestId}/${uniqueFileName}`
    } else {
      // Your preferred setup: requests/ prefix
      filePath = `${options.pathPrefix}/${file.name}`
    }

    log('Upload configuration', {
      bucketName,
      filePath,
      setupType: useCurrentSetup ? 'current (user-scoped)' : 'preferred (requests/)',
      userId: user.id
    })

    // STEP 4: Test bucket existence
    log('🪣 STEP 4: Bucket Validation')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      log('Bucket list error (trying upload anyway)', bucketsError)
      log('⚠️ Cannot list buckets due to permissions, but bucket may exist')
    } else {
      const targetBucket = buckets?.find((b: any) => b.name === bucketName)
      if (!targetBucket) {
        log('Available buckets', buckets?.map((b: any) => b.name))
        log('⚠️ Bucket not found in list, but may exist due to permissions')
      } else {
        log('Bucket found', targetBucket)
      }
    }

    // STEP 5: Attempt file upload
    log('⬆️ STEP 5: File Upload to Storage')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true  // Allow overwriting existing files for testing
      })

    if (uploadError) {
      log('Upload error', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    log('Upload successful', uploadData)

    // STEP 6: Get file URL
    log('🔗 STEP 6: Generate File URL')
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    log('File URL generated', urlData)

    // STEP 7: Test database insertion (if requestId provided)
    let dbRecord = null
    if (options.requestId) {
      log('💾 STEP 7: Database Record Creation')
      
      // First, create a test transportation request to satisfy RLS policy
      log('📋 Creating test transportation request for RLS compliance')
      const testRequestData = {
        id: requestId,
        order_number: `TRQ_TEST_${Date.now()}`, // Unique order number
        user_id: user.id,
        pickup_company_name: 'Test Pickup Company',
        pickup_company_address: '123 Test Street, Test City, TC 12345',
        pickup_contact_name: 'Test Contact',
        pickup_contact_phone: '555-0123',
        delivery_company_name: 'Test Delivery Company', 
        delivery_company_address: '456 Test Avenue, Test Town, TT 67890',
        delivery_contact_name: 'Test Delivery Contact',
        delivery_contact_phone: '555-0456',
        vin_number: '1HGBH41JXMN109186',
        vehicle_make: 'Test',
        vehicle_model: 'Vehicle',
        vehicle_year: 2023,
        status: 'pending',
        notes: 'Test request for file upload debugging'
      }

      const { data: requestRecord, error: requestError } = await supabase
        .from('transportation_requests')
        .upsert(testRequestData, { onConflict: 'id' })
        .select()

      if (requestError) {
        log('Test request creation error', requestError)
        // Log but continue - we'll try the attachment anyway
        log('⚠️ Continuing with attachment creation despite request error')
      } else {
        log('Test transportation request created/updated', requestRecord?.[0]?.id)
      }

      // Now create the attachment record
      const tableName = options.tableName || 'document_attachments'
      
      const attachmentData = {
        transportation_request_id: requestId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: uploadData.path,
        uploaded_by: user.id
      }

      log('Database record data', attachmentData)

      const { data: insertData, error: insertError } = await supabase
        .from(tableName)
        .insert(attachmentData)
        .select()

      if (insertError) {
        log('Database insert error', insertError)
        throw new Error(`Database insertion failed: ${insertError.message}`)
      }

      dbRecord = insertData?.[0]
      log('Database record created', dbRecord)
    }

    // SUCCESS!
    log('✅ UPLOAD COMPLETED SUCCESSFULLY')
    
    return {
      success: true,
      data: {
        storageData: uploadData,
        dbRecord,
        filePath,
        fileUrl: urlData.publicUrl
      },
      debugLogs: logs
    }

  } catch (error: any) {
    log('❌ UPLOAD FAILED', error.message)
    return {
      success: false,
      error: error.message,
      debugLogs: logs
    }
  }
}

/**
 * 🧪 Quick Test Function
 * Use this to test file upload with your exact file
 */
export async function testFileUpload(file: File, requestId?: string) {
  console.log('🧪 === TESTING FILE UPLOAD ===')
  
  // Test with current setup
  console.log('\n📝 Testing with CURRENT setup (documents bucket, user-scoped paths):')
  const currentResult = await debugSupabaseUpload(file, {
    bucketName: 'documents',
    requestId
  })
  
  console.log('Current setup result:', currentResult.success ? '✅ SUCCESS' : '❌ FAILED')
  if (!currentResult.success) {
    console.error('Current setup error:', currentResult.error)
  }

  // Test with preferred setup (if you want to try)
  console.log('\n📝 Testing with PREFERRED setup (attachments bucket, requests/ paths):')
  const preferredResult = await debugSupabaseUpload(file, {
    bucketName: 'attachments',
    pathPrefix: 'requests',
    requestId
  })
  
  console.log('Preferred setup result:', preferredResult.success ? '✅ SUCCESS' : '❌ FAILED')
  if (!preferredResult.success) {
    console.error('Preferred setup error:', preferredResult.error)
  }

  return { currentResult, preferredResult }
}

/**
 * 📝 How to use this debugger:
 * 
 * 1. In your component:
 *    import { debugSupabaseUpload, testFileUpload } from '@/lib/supabase-upload-debug'
 * 
 * 2. Test with your PDF file:
 *    const result = await testFileUpload(yourPdfFile, 'your-request-id')
 * 
 * 3. Or use the detailed debugger:
 *    const result = await debugSupabaseUpload(yourPdfFile, {
 *      bucketName: 'documents', // or 'attachments'
 *      requestId: 'your-request-id'
 *    })
 */ 