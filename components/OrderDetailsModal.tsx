'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, TruckIcon, MapPinIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline'

interface TransportationRequest {
  id: string
  order_number: string
  pickup_company_name: string
  pickup_company_address: string
  pickup_contact_name: string
  pickup_contact_phone: string
  delivery_company_name: string
  delivery_company_address: string
  delivery_contact_name: string
  delivery_contact_phone: string
  vin_number: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  notes?: string
  status: string
  assigned_admin_id?: string
  created_at: string
  user_id: string
}

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: TransportationRequest
  assignedAdminName?: string
}

export default function OrderDetailsModal({ isOpen, onClose, order, assignedAdminName }: OrderDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Order Details - {order.order_number}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Order Number:</dt>
                          <dd className="text-sm font-medium text-gray-900">{order.order_number}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Status:</dt>
                          <dd>{getStatusBadge(order.status)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Created:</dt>
                          <dd className="text-sm text-gray-900">{formatDate(order.created_at)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Assigned to:</dt>
                          <dd className="text-sm text-gray-900">{assignedAdminName || 'Unassigned'}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2" />
                        Vehicle Information
                      </h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">VIN:</dt>
                          <dd className="text-sm font-mono text-gray-900">{order.vin_number}</dd>
                        </div>
                        {order.vehicle_make && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Make:</dt>
                            <dd className="text-sm text-gray-900">{order.vehicle_make}</dd>
                          </div>
                        )}
                        {order.vehicle_model && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Model:</dt>
                            <dd className="text-sm text-gray-900">{order.vehicle_model}</dd>
                          </div>
                        )}
                        {order.vehicle_year && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Year:</dt>
                            <dd className="text-sm text-gray-900">{order.vehicle_year}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Special Notes</h4>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Location Information */}
                  <div className="space-y-6">
                    {/* Pickup Location */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2 text-green-600" />
                        Pickup Location
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.pickup_company_name}</p>
                          <p className="text-sm text-gray-600">{order.pickup_company_address}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-600">{order.pickup_contact_name}</span>
                          </div>
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <a 
                              href={`tel:${order.pickup_contact_phone}`}
                              className="text-sm text-primary-600 hover:text-primary-800"
                            >
                              {order.pickup_contact_phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Location */}
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2 text-red-600" />
                        Delivery Location
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.delivery_company_name}</p>
                          <p className="text-sm text-gray-600">{order.delivery_company_address}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-600">{order.delivery_contact_name}</span>
                          </div>
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <a 
                              href={`tel:${order.delivery_contact_phone}`}
                              className="text-sm text-primary-600 hover:text-primary-800"
                            >
                              {order.delivery_contact_phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-primary-100 px-4 py-2 text-sm font-medium text-primary-900 hover:bg-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 