'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import MenuDisplay from '@/components/MenuDisplay'
import { ProcessedMenu } from '@/types/menu'
import { processMenuRequest } from '@/lib/menu-client'

/**
 * Top-level page: lets the user upload menu photos, processes them via the
 * API, and swaps in the interactive MenuDisplay once a menu is returned.
 *
 * Owns the processing/error/result UI state; the network call itself is
 * delegated to processMenuRequest in lib/menu-client.
 */
export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedMenu, setProcessedMenu] = useState<ProcessedMenu | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImagesSelected = async (files: File[]) => {
    setIsProcessing(true)
    setError(null)

    try {
      setProcessedMenu(await processMenuRequest(files))
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

          </div>
        </div>
      ) : (
        <MenuDisplay menu={processedMenu} onReset={handleReset} />
      )}
    </div>
  )
}