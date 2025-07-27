'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { getRawSession } from '@/lib/auth-raw'
import AddressInput from '@/components/AddressInput'
import MultiVinInput, { Vehicle } from '@/components/MultiVinInput'
import FileUpload from '@/components/FileUpload'
import { AddressResult } from '@/lib/google-maps-fixed'
import { VehicleInfo } from '@/lib/nhtsa'
import { TruckIcon } from '@heroicons/react/24/outline'


interface FormData {
  // Pickup Information
  pickupCompanyName: string
  pickupCompanyAddress: string
  pickupCompanyLat?: number
  pickupCompanyLng?: number
  pickupContactName: string
  pickupContactPhone: string

  // Delivery Information
  deliveryCompanyName: string
  deliveryCompanyAddress: string
  deliveryCompanyLat?: number
  deliveryCompanyLng?: number
  deliveryContactName: string
  deliveryContactPhone: string

  // Vehicle Information
  vehicles: Vehicle[]

  // Additional Information
  notes?: string
}

interface FormErrors {
  pickupCompanyName?: string
  pickupCompanyAddress?: string
  pickupContactName?: string
  pickupContactPhone?: string
  deliveryCompanyName?: string
  deliveryCompanyAddress?: string
  deliveryContactName?: string
  deliveryContactPhone?: string
  vehicles?: string
  notes?: string
}

export default function TransportationRequestPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])


  const [formData, setFormData] = useState<FormData>({
    pickupCompanyName: '',
    pickupCompanyAddress: '',
    pickupContactName: '',
    pickupContactPhone: '',
    deliveryCompanyName: '',
    deliveryCompanyAddress: '',
    deliveryContactName: '',
    deliveryContactPhone: '',
    vehicles: [],
    notes: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing (only for fields that have corresponding errors)
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }))
    }
  }

  const handlePickupAddressSelected = (result: AddressResult) => {
    updateFormData('pickupCompanyAddress', result.formattedAddress)
    updateFormData('pickupCompanyLat', result.lat)
    updateFormData('pickupCompanyLng', result.lng)
  }

  const handleDeliveryAddressSelected = (result: AddressResult) => {
    updateFormData('deliveryCompanyAddress', result.formattedAddress)
    updateFormData('deliveryCompanyLat', result.lat)
    updateFormData('deliveryCompanyLng', result.lng)
  }

  const handleVehiclesChange = (vehicles: Vehicle[]) => {
    updateFormData('vehicles', vehicles)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}

    if (step === 1) {
      // Pickup Information Validation
      if (!formData.pickupCompanyName.trim()) {
        newErrors.pickupCompanyName = 'Pickup company name is required'
      }
      if (!formData.pickupCompanyAddress.trim()) {
        newErrors.pickupCompanyAddress = 'Pickup address is required'
      }
      if (!formData.pickupContactName.trim()) {
        newErrors.pickupContactName = 'Pickup contact name is required'
      }
      if (!formData.pickupContactPhone.trim()) {
        newErrors.pickupContactPhone = 'Pickup contact phone is required'
      }
    } else if (step === 2) {
      // Delivery Information Validation
      if (!formData.deliveryCompanyName.trim()) {
        newErrors.deliveryCompanyName = 'Delivery company name is required'
      }
      if (!formData.deliveryCompanyAddress.trim()) {
        newErrors.deliveryCompanyAddress = 'Delivery address is required'
      }
      if (!formData.deliveryContactName.trim()) {
        newErrors.deliveryContactName = 'Delivery contact name is required'
      }
      if (!formData.deliveryContactPhone.trim()) {
        newErrors.deliveryContactPhone = 'Delivery contact phone is required'
      }
    } else if (step === 3) {
      // Vehicle Information Validation
      if (!formData.vehicles || formData.vehicles.length === 0) {
        newErrors.vehicles = 'At least one vehicle is required'
      } else {
        const invalidVehicles = formData.vehicles.filter(vehicle => 
          !vehicle.vin || vehicle.vin.length !== 17 || !vehicle.isValid
        )
        if (invalidVehicles.length > 0) {
          newErrors.vehicles = 'All vehicles must have valid VIN numbers'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const uploadFiles = async (requestId: string, files: File[]) => {
    console.log('📁 Starting file upload for request:', requestId)
    const uploadedAttachments = []

    // Check if user is logged in at all
    if (!user?.id) {
      throw new Error('User must be logged in to upload files')
    }

    // Use the same successful authentication approach as the debugger
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required. Please log in and try again.')
    }

    const authenticatedUserId = sessionData.session.user.id
    console.log('🔐 Using authenticated user:', authenticatedUserId)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📎 Uploading file ${i + 1}/${files.length}:`, file.name)

      try {
        // Create unique file path that matches storage policies (userId/requestId/filename)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${authenticatedUserId}/${requestId}/${fileName}`
        
        console.log('📁 File path:', filePath, 'for user:', authenticatedUserId)

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error('❌ File upload error:', uploadError)
          throw uploadError
        }

        console.log('✅ File uploaded to storage:', uploadData.path)

        // Create database record using Supabase client (same as successful debugger)
        const attachmentData = {
          transportation_request_id: requestId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          uploaded_by: authenticatedUserId
        }

        console.log('💾 Creating database record:', attachmentData)

        const { data: insertData, error: insertError } = await supabase
          .from('document_attachments')
          .insert(attachmentData)
          .select()

        if (insertError) {
          console.error('❌ Database insert failed:', insertError)
          throw new Error(`Failed to save attachment record: ${insertError.message}`)
        }

        const attachmentRecord = insertData?.[0]
        uploadedAttachments.push(attachmentRecord)
        console.log('✅ Attachment record created:', attachmentRecord?.id)

      } catch (error) {
        console.error(`❌ Failed to upload file ${file.name}:`, error)
        toast.error(`Failed to upload ${file.name}`)
        throw error
      }
    }

    console.log('🎉 All files uploaded successfully:', uploadedAttachments.length)
    toast.success(`${uploadedAttachments.length} file(s) uploaded successfully!`)
    return uploadedAttachments
  }

  const handleSubmit = async () => {
    console.log('🚀 Starting form submission...')
    console.log('Current step:', currentStep)
    console.log('User:', user)
    console.log('Form data:', formData)
    console.log('Uploaded files:', uploadedFiles)

    if (!validateStep(currentStep)) {
      console.error('❌ Form validation failed')
      toast.error('Please fix form errors before submitting')
      return
    }

    if (!user) {
      console.error('❌ No user found')
      toast.error('You must be logged in to submit a request')
      router.push('/auth/login')
      return
    }

    setLoading(true)

    try {
      console.log('📝 Creating transportation request...')
      
      // Generate order number manually (temporary workaround)
      const orderNumber = `TRQ_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      // Use first vehicle's info for the old required fields (backwards compatibility)
      const primaryVehicle = formData.vehicles[0]
      
      // Create transportation request
      const requestPayload = {
        user_id: user.id,
        order_number: orderNumber,
        pickup_company_name: formData.pickupCompanyName,
        pickup_company_address: formData.pickupCompanyAddress,
        pickup_company_lat: formData.pickupCompanyLat,
        pickup_company_lng: formData.pickupCompanyLng,
        pickup_contact_name: formData.pickupContactName,
        pickup_contact_phone: formData.pickupContactPhone,
        delivery_company_name: formData.deliveryCompanyName,
        delivery_company_address: formData.deliveryCompanyAddress,
        delivery_company_lat: formData.deliveryCompanyLat,
        delivery_company_lng: formData.deliveryCompanyLng,
        delivery_contact_name: formData.deliveryContactName,
        delivery_contact_phone: formData.deliveryContactPhone,
        // Old required fields - use first vehicle for backwards compatibility
        vin_number: primaryVehicle?.vin || '',
        vehicle_make: primaryVehicle?.info?.make || '',
        vehicle_model: primaryVehicle?.info?.model || '',
        vehicle_year: primaryVehicle?.info?.year ? Number(primaryVehicle.info.year) : null,
        notes: formData.notes
      }

      console.log('📤 Request payload:', requestPayload)

      // Validate required fields and data types before sending
      const missingFields = []
      if (!requestPayload.user_id) missingFields.push('user_id')
      if (!requestPayload.pickup_company_name) missingFields.push('pickup_company_name')
      if (!requestPayload.delivery_company_name) missingFields.push('delivery_company_name')

      
      // Check for invalid lat/lng values (common issue)
      if (requestPayload.pickup_company_lat && (requestPayload.pickup_company_lat < -90 || requestPayload.pickup_company_lat > 90)) {
        missingFields.push('invalid pickup latitude (should be -90 to 90)')
      }
      if (requestPayload.pickup_company_lng && (requestPayload.pickup_company_lng < -180 || requestPayload.pickup_company_lng > 180)) {
        missingFields.push('invalid pickup longitude (should be -180 to 180)')
      }
      if (requestPayload.delivery_company_lat && (requestPayload.delivery_company_lat < -90 || requestPayload.delivery_company_lat > 90)) {
        missingFields.push('invalid delivery latitude (should be -90 to 90)')
      }
      if (requestPayload.delivery_company_lng && (requestPayload.delivery_company_lng < -180 || requestPayload.delivery_company_lng > 180)) {
        missingFields.push('invalid delivery longitude (should be -180 to 180)')
      }
      
      console.log('📍 Coordinates validation:', {
        pickupLat: requestPayload.pickup_company_lat,
        pickupLng: requestPayload.pickup_company_lng,
        deliveryLat: requestPayload.delivery_company_lat,
        deliveryLng: requestPayload.delivery_company_lng
      })
      
      if (missingFields.length > 0) {
        throw new Error(`Validation failed: ${missingFields.join(', ')}`)
      }

      console.log('✅ Validation passed, starting insert...')

      // Use raw fetch approach (same as working test)
      console.log('🔄 Using raw fetch insert (proven working approach)...')
      
      const response = await fetch('https://sxhuqsrnxfunoasutezm.supabase.co/rest/v1/transportation_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHVxc3JueGZ1bm9hc3V0ZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzQzMjMsImV4cCI6MjA2ODQ1MDMyM30.acV66qx3m1AgGZxPnqVWDbwODhqcAM_y8cTGNfc3hk0',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(requestPayload)
      })

      console.log('📋 Raw fetch response:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Raw fetch error:', errorText)
        throw new Error(`Database error: ${response.status} ${errorText}`)
      }

      const requestResult = await response.json()
      const requestData = requestResult[0] // First item from array result
      
      console.log('✅ Insert successful:', requestData)
      
      if (!requestData) {
        throw new Error('No data returned from insert')
      }

      console.log('✅ Transportation request created:', requestData.order_number)

      // Upload files if any were selected
      if (uploadedFiles.length > 0) {
        console.log('📁 Uploading files...', uploadedFiles.length)
        await uploadFiles(requestData.id, uploadedFiles)
      }

      // Save vehicles to vehicles table
      if (formData.vehicles.length > 0) {
        console.log('🚗 Saving vehicles...', formData.vehicles.length)
        
        const vehicleData = formData.vehicles.map(vehicle => ({
          transportation_request_id: requestData.id,
          vin_number: vehicle.vin,
          vehicle_make: vehicle.info?.make || '',
          vehicle_model: vehicle.info?.model || '',
          vehicle_year: vehicle.info?.year ? Number(vehicle.info.year) : null,
          vehicle_type: vehicle.info?.vehicleType || '',
          vehicle_trim: '', // NHTSA doesn't provide trim directly
          vehicle_engine: vehicle.info?.engineInfo || '',
          nhtsa_data: vehicle.info ? JSON.stringify(vehicle.info) : null
        }))

        const { error: vehicleError } = await supabase
          .from('vehicles')
          .insert(vehicleData)

        if (vehicleError) {
          console.error('❌ Failed to save vehicles:', vehicleError)
          // Don't fail the whole request for vehicle save issues
          toast.error('Warning: Vehicle details may not be fully saved')
        } else {
          console.log('✅ Vehicles saved successfully')
        }
      }

      // Skip activity logging for now to simplify
      console.log('📊 Skipping activity log for now')

      console.log('🎉 Submission completed successfully!')
      toast.success(`Transportation request ${requestData.order_number} submitted successfully!`)
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)

    } catch (error: any) {
      console.error('💥 Submission error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // More specific error messages
      if (error.message?.includes('storage')) {
        toast.error('File upload failed. Please try again or contact support.')
      } else if (error.message?.includes('RLS') || error.message?.includes('policy')) {
        toast.error('Permission denied. Please make sure you are logged in.')
      } else if (error.message?.includes('violates')) {
        toast.error('Data validation error. Please check your input and try again.')
      } else {
        toast.error(`Failed to submit request: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const steps = [
    { id: 1, name: 'Pickup Information', icon: '📍' },
    { id: 2, name: 'Delivery Information', icon: '🎯' },
    { id: 3, name: 'Vehicle Information', icon: '🚗' },
    { id: 4, name: 'Review & Submit', icon: '📋' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <TruckIcon className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Transportation Request</h1>
        </div>
        <p className="text-lg text-gray-600">
          Submit a new vehicle transportation request
        </p>
      </div>



      {/* Progress Steps */}
      <div className="flex justify-center">
        <nav className="flex space-x-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                step.id === currentStep
                  ? 'bg-primary-600 text-white'
                  : step.id < currentStep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              <span>{step.icon}</span>
              <span className="hidden sm:inline">{step.name}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <div className="card">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pickup Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Company Name *</label>
                <input
                  type="text"
                  value={formData.pickupCompanyName}
                  onChange={(e) => updateFormData('pickupCompanyName', e.target.value)}
                  className={`input-field ${errors.pickupCompanyName ? 'border-red-500' : ''}`}
                  placeholder="Enter pickup company name"
                />
                {errors.pickupCompanyName && (
                  <p className="text-sm text-red-600 mt-1">{errors.pickupCompanyName}</p>
                )}
              </div>

              <div>
                <label className="label">Contact Name *</label>
                <input
                  type="text"
                  value={formData.pickupContactName}
                  onChange={(e) => updateFormData('pickupContactName', e.target.value)}
                  className={`input-field ${errors.pickupContactName ? 'border-red-500' : ''}`}
                  placeholder="Enter contact person name"
                />
                {errors.pickupContactName && (
                  <p className="text-sm text-red-600 mt-1">{errors.pickupContactName}</p>
                )}
              </div>
            </div>

            <AddressInput
              label="Company Address"
              placeholder="Enter pickup address"
              value={formData.pickupCompanyAddress}
              onChange={(address) => updateFormData('pickupCompanyAddress', address)}
              onAddressSelected={handlePickupAddressSelected}
              required
              error={errors.pickupCompanyAddress}
            />

            <div>
              <label className="label">Contact Phone *</label>
              <input
                type="tel"
                value={formData.pickupContactPhone}
                onChange={(e) => updateFormData('pickupContactPhone', e.target.value)}
                className={`input-field ${errors.pickupContactPhone ? 'border-red-500' : ''}`}
                placeholder="Enter contact phone number"
              />
              {errors.pickupContactPhone && (
                <p className="text-sm text-red-600 mt-1">{errors.pickupContactPhone}</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Company Name *</label>
                <input
                  type="text"
                  value={formData.deliveryCompanyName}
                  onChange={(e) => updateFormData('deliveryCompanyName', e.target.value)}
                  className={`input-field ${errors.deliveryCompanyName ? 'border-red-500' : ''}`}
                  placeholder="Enter delivery company name"
                />
                {errors.deliveryCompanyName && (
                  <p className="text-sm text-red-600 mt-1">{errors.deliveryCompanyName}</p>
                )}
              </div>

              <div>
                <label className="label">Contact Name *</label>
                <input
                  type="text"
                  value={formData.deliveryContactName}
                  onChange={(e) => updateFormData('deliveryContactName', e.target.value)}
                  className={`input-field ${errors.deliveryContactName ? 'border-red-500' : ''}`}
                  placeholder="Enter contact person name"
                />
                {errors.deliveryContactName && (
                  <p className="text-sm text-red-600 mt-1">{errors.deliveryContactName}</p>
                )}
              </div>
            </div>

            <AddressInput
              label="Company Address"
              placeholder="Enter delivery address"
              value={formData.deliveryCompanyAddress}
              onChange={(address) => updateFormData('deliveryCompanyAddress', address)}
              onAddressSelected={handleDeliveryAddressSelected}
              required
              error={errors.deliveryCompanyAddress}
            />

            <div>
              <label className="label">Contact Phone *</label>
              <input
                type="tel"
                value={formData.deliveryContactPhone}
                onChange={(e) => updateFormData('deliveryContactPhone', e.target.value)}
                className={`input-field ${errors.deliveryContactPhone ? 'border-red-500' : ''}`}
                placeholder="Enter contact phone number"
              />
              {errors.deliveryContactPhone && (
                <p className="text-sm text-red-600 mt-1">{errors.deliveryContactPhone}</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h2>
            
            <MultiVinInput
              vehicles={formData.vehicles}
              onChange={handleVehiclesChange}
              required
            />

            <div>
              <label className="label">Additional Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateFormData('notes', e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Any additional information about the vehicle or special requirements..."
              />
            </div>

            <FileUpload
              onFilesChange={setUploadedFiles}
              label="Upload Documents (Optional)"
              maxFiles={5}
              maxSizePerFile={10}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Submit</h2>
            
            {/* Review Summary */}
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Pickup Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Company:</strong> {formData.pickupCompanyName}</p>
                  <p><strong>Address:</strong> {formData.pickupCompanyAddress}</p>
                  <p><strong>Contact:</strong> {formData.pickupContactName}</p>
                  <p><strong>Phone:</strong> {formData.pickupContactPhone}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Delivery Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Company:</strong> {formData.deliveryCompanyName}</p>
                  <p><strong>Address:</strong> {formData.deliveryCompanyAddress}</p>
                  <p><strong>Contact:</strong> {formData.deliveryContactName}</p>
                  <p><strong>Phone:</strong> {formData.deliveryContactPhone}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Vehicle Information</h3>
                <div className="text-sm text-gray-600 space-y-3">
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={vehicle.id} className="border-l-2 border-blue-200 pl-3">
                      <p><strong>Vehicle {index + 1}:</strong></p>
                      <p><strong>VIN:</strong> {vehicle.vin}</p>
                      {vehicle.info?.valid && (
                        <>
                          <p><strong>Make:</strong> {vehicle.info.make}</p>
                          <p><strong>Model:</strong> {vehicle.info.model}</p>
                          <p><strong>Year:</strong> {vehicle.info.year}</p>
                        </>
                      )}
                    </div>
                  ))}
                  {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Documents</h3>
                  <div className="text-sm text-gray-600">
                    <p>{uploadedFiles.length} file(s) to be uploaded</p>
                    <ul className="list-disc list-inside mt-1">
                      {uploadedFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 