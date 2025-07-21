'use client'

import { useState, useCallback } from 'react'

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void
  isProcessing: boolean
}

export default function ImageUpload({ onImagesSelected, isProcessing }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    )
    
    if (files.length > 0) {
      onImagesSelected(files)
    }
  }, [onImagesSelected])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    )
    
    if (files.length > 0) {
      onImagesSelected(files)
    }
  }, [onImagesSelected])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 20 20" className="h-full w-full">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-medium text-gray-900">
              {isProcessing ? 'Processing your menu...' : 'Upload menu photos'}
            </p>
            <p className="text-gray-600 mt-2">
              {isProcessing 
                ? 'Please wait while we analyze your menu images'
                : 'Drag and drop your menu images here, or click to select files'
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports JPG, PNG, and WEBP files
            </p>
          </div>
          {!isProcessing && (
            <label className="cursor-pointer">
              <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Choose Files
              </span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}