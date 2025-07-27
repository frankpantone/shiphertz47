'use client'

/**
 * 🧪 UPLOAD TESTER COMPONENT
 * Use this component to test file uploads and debug issues
 */

import { useState } from 'react'
import { debugSupabaseUpload, testFileUpload } from '@/lib/supabase-upload-debug'

export default function UploadTester() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)
  // Generate a proper UUID for testing
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  const [requestId, setRequestId] = useState(generateUUID())

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
    setResults(null)
  }

  const runTest = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    setTesting(true)
    setResults(null)

    try {
      console.clear() // Clear console for clean debugging
      console.log('🧪 === STARTING UPLOAD TEST ===')
      
      // Run comprehensive test
      const testResults = await testFileUpload(selectedFile, requestId)
      setResults(testResults)
      
    } catch (error: any) {
      console.error('Test failed:', error)
      setResults({ error: error.message })
    } finally {
      setTesting(false)
    }
  }

  const runSingleTest = async (bucketName: string, pathPrefix?: string) => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    setTesting(true)
    console.clear()

    try {
      const result = await debugSupabaseUpload(selectedFile, {
        bucketName,
        pathPrefix,
        requestId
      })
      
      setResults({ singleTest: result })
    } catch (error: any) {
      setResults({ error: error.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Supabase Upload Debugger
      </h2>
      
      <div className="space-y-6">
        {/* File Selection */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">1. Select File to Test</h3>
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Request ID */}
        <div>
          <h3 className="text-lg font-semibold mb-3">2. Request ID (Optional)</h3>
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="test-request-id"
          />
        </div>

        {/* Test Buttons */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">3. Run Tests</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={runTest}
              disabled={!selectedFile || testing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {testing ? 'Testing...' : '🧪 Run Full Test'}
            </button>
            
            <button
              onClick={() => runSingleTest('documents')}
              disabled={!selectedFile || testing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              📁 Test Current (documents)
            </button>
            
            <button
              onClick={() => runSingleTest('attachments', 'requests')}
              disabled={!selectedFile || testing}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              📎 Test Preferred (attachments)
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">📊 Test Results</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-4">
                {results.currentResult && (
                  <div>
                    <h4 className="font-medium text-green-700">Current Setup (documents bucket):</h4>
                    <div className={`mt-1 p-2 rounded ${results.currentResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {results.currentResult.success ? '✅ SUCCESS' : `❌ FAILED: ${results.currentResult.error}`}
                    </div>
                  </div>
                )}
                
                {results.preferredResult && (
                  <div>
                    <h4 className="font-medium text-purple-700">Preferred Setup (attachments bucket):</h4>
                    <div className={`mt-1 p-2 rounded ${results.preferredResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {results.preferredResult.success ? '✅ SUCCESS' : `❌ FAILED: ${results.preferredResult.error}`}
                    </div>
                  </div>
                )}

                {results.singleTest && (
                  <div>
                    <h4 className="font-medium text-blue-700">Single Test Result:</h4>
                    <div className={`mt-1 p-2 rounded ${results.singleTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {results.singleTest.success ? '✅ SUCCESS' : `❌ FAILED: ${results.singleTest.error}`}
                    </div>
                  </div>
                )}

                {results.error && (
                  <div className="bg-red-100 text-red-800 p-2 rounded">
                    ❌ Test Error: {results.error}
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                💡 Check the browser console for detailed step-by-step debugging logs
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📝 Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Select your PDF file (HCL30609.pdf)</li>
            <li>Click "Run Full Test" to test both setups</li>
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Review which test succeeds/fails and why</li>
            <li>Use the specific error messages to fix your setup</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 