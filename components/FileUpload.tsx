'use client'

import { useState, useRef } from 'react'
import { DocumentArrowUpIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline'

interface UploadedFile {
  file: File
  id: string
  preview?: string
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  maxSizePerFile?: number // in MB
  acceptedTypes?: string[]
  label?: string
  error?: string
}

export default function FileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSizePerFile = 10,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  label = 'Upload Documents',
  error
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = []
    const errors: string[] = []

    // Check if adding these files would exceed the limit
    if (uploadedFiles.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check file size
      if (file.size > maxSizePerFile * 1024 * 1024) {
        errors.push(`${file.name} is too large (max ${maxSizePerFile}MB)`)
        continue
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('/*')) {
          return file.type.startsWith(type.replace('/*', ''))
        }
        return file.name.toLowerCase().endsWith(type.toLowerCase()) || file.type === type
      })

      if (!isValidType) {
        errors.push(`${file.name} is not a supported file type`)
        continue
      }

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      newFiles.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        preview
      })
    }

    if (errors.length > 0) {
      setUploadError(errors.join(', '))
    } else {
      setUploadError(null)
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(updatedFiles)
      onFilesChange(updatedFiles.map(f => f.file))
    }
  }

  const removeFile = (id: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === id)
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }

    const updatedFiles = uploadedFiles.filter(f => f.id !== id)
    setUploadedFiles(updatedFiles)
    onFilesChange(updatedFiles.map(f => f.file))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <label className="label">{label}</label>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${error || uploadError ? 'border-red-300' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-lg text-gray-600">
            Drop files here or <span className="text-primary-600 font-medium">browse</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Up to {maxFiles} files, max {maxSizePerFile}MB each
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supported: {acceptedTypes.join(', ')}
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {(error || uploadError) && (
        <p className="text-sm text-red-600">{error || uploadError}</p>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <DocumentIcon className="w-10 h-10 text-gray-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(uploadedFile.id)
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 