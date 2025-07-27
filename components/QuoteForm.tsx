'use client'

import { useState } from 'react'
import { CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface QuoteFormProps {
  onSubmit: (quoteData: {
    base_price: number
    fuel_surcharge: number
    additional_fees: number
    estimated_pickup_date?: string
    estimated_delivery_date?: string
    terms_and_conditions?: string
    notes?: string
    expires_at?: string
  }) => void
  onCancel: () => void
  submitting: boolean
}

export default function QuoteForm({ onSubmit, onCancel, submitting }: QuoteFormProps) {
  const [formData, setFormData] = useState({
    base_price: '',
    fuel_surcharge: '',
    additional_fees: '',
    estimated_pickup_date: '',
    estimated_delivery_date: '',
    terms_and_conditions: '',
    notes: '',
    expires_at: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Base price is required and must be greater than 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Convert string values to appropriate types
    const quoteData = {
      base_price: parseFloat(formData.base_price),
      fuel_surcharge: parseFloat(formData.fuel_surcharge) || 0,
      additional_fees: parseFloat(formData.additional_fees) || 0,
      estimated_pickup_date: formData.estimated_pickup_date || undefined,
      estimated_delivery_date: formData.estimated_delivery_date || undefined,
      terms_and_conditions: formData.terms_and_conditions || undefined,
      notes: formData.notes || undefined,
      expires_at: formData.expires_at || undefined
    }

    onSubmit(quoteData)
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const totalAmount = (parseFloat(formData.base_price) || 0) + 
                     (parseFloat(formData.fuel_surcharge) || 0) + 
                     (parseFloat(formData.additional_fees) || 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pricing Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="base_price" className="block text-sm font-medium text-gray-700">
            Base Price *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              id="base_price"
              value={formData.base_price}
              onChange={(e) => updateField('base_price', e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.base_price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.base_price && <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>}
        </div>

        <div>
          <label htmlFor="fuel_surcharge" className="block text-sm font-medium text-gray-700">
            Fuel Surcharge
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              id="fuel_surcharge"
              value={formData.fuel_surcharge}
              onChange={(e) => updateField('fuel_surcharge', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="additional_fees" className="block text-sm font-medium text-gray-700">
            Additional Fees
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              id="additional_fees"
              value={formData.additional_fees}
              onChange={(e) => updateField('additional_fees', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Total Amount Display */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-green-800">Total Quote Amount:</span>
          <span className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Date Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estimated_pickup_date" className="block text-sm font-medium text-gray-700">
            Estimated Pickup Date
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="estimated_pickup_date"
              value={formData.estimated_pickup_date}
              onChange={(e) => updateField('estimated_pickup_date', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="estimated_delivery_date" className="block text-sm font-medium text-gray-700">
            Estimated Delivery Date
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="estimated_delivery_date"
              value={formData.estimated_delivery_date}
              onChange={(e) => updateField('estimated_delivery_date', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Quote Expiration */}
      <div>
        <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
          Quote Expires On
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="datetime-local"
            id="expires_at"
            value={formData.expires_at}
            onChange={(e) => updateField('expires_at', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Leave blank for no expiration</p>
      </div>

      {/* Terms and Conditions */}
      <div>
        <label htmlFor="terms_and_conditions" className="block text-sm font-medium text-gray-700">
          Terms and Conditions
        </label>
        <textarea
          id="terms_and_conditions"
          rows={3}
          value={formData.terms_and_conditions}
          onChange={(e) => updateField('terms_and_conditions', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Enter any specific terms and conditions for this quote..."
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Internal Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Internal notes about this quote (not visible to customer)..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Quote'}
        </button>
      </div>
    </form>
  )
} 