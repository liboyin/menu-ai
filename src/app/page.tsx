'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import MenuDisplay from '@/components/MenuDisplay'
import { ProcessedMenu } from '@/types/menu'

export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedMenu, setProcessedMenu] = useState<ProcessedMenu | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImagesSelected = async (files: File[]) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch('/api/process-menu', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process menu images')
      }

      const result = await response.json()
      if (!result.items || result.items.length === 0) {
        throw new Error('Could not identify any menu items in this image. Please upload a clear photo of a restaurant menu.')
      }
      setProcessedMenu(result)
    } catch (err) {
      console.error('Error in handleImagesSelected:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setProcessedMenu(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {!processedMenu ? (
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-soft">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">MenuAI</h1>
              <p className="text-slate-600 text-lg leading-relaxed">
                Upload any menu photo and instantly understand every dish with AI
              </p>
            </div>
            
            {/* Upload Component */}
            <ImageUpload 
              onImagesSelected={handleImagesSelected}
              isProcessing={isProcessing}
            />
            
            {/* Error Display */}
            {error && (
              <div className="mt-6">
                <div className="glass-effect rounded-2xl p-4 border-red-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-red-900 mb-1">Processing failed</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mt-12 space-y-4">
              <div className="flex items-center text-slate-600">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Instant ingredient analysis</span>
              </div>
              <div className="flex items-center text-slate-600">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Smart dietary filtering</span>
              </div>
              <div className="flex items-center text-slate-600">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Ask questions about dishes</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <MenuDisplay menu={processedMenu} onReset={handleReset} />
      )}
    </div>
  )
}