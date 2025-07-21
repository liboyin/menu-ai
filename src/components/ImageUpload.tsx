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
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-400 bg-blue-50 transform scale-105' 
            : 'border-slate-200 hover:border-blue-300'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : 'hover:bg-white'} glass-effect`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {isProcessing ? 'Analyzing menu...' : 'Upload menu photos'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
              {isProcessing 
                ? 'AI is reading your menu and extracting dish information'
                : 'Drop images here or tap to select from your device'
              }
            </p>
          </div>
          
          {!isProcessing && (
            <label className="cursor-pointer">
              <span className="btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Choose Photos
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
          
          <div className="flex items-center justify-center space-x-6 text-xs text-slate-400">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              JPG
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              PNG
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              WEBP
            </span>
          </div>
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center glass-effect rounded-3xl">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">Processing...</p>
          </div>
        )}
      </div>
    </div>
  )
}