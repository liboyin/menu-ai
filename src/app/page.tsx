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
      setProcessedMenu(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setProcessedMenu(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">MenuAI</h1>
            <p className="text-gray-600 mt-2">Understand any menu instantly with AI</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!processedMenu ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Get started by uploading your menu photos
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Take photos of restaurant menus and we&apos;ll instantly digitize them, 
                identify ingredients, and help you find exactly what you&apos;re looking for.
              </p>
            </div>
            
            <ImageUpload 
              onImagesSelected={handleImagesSelected}
              isProcessing={isProcessing}
            />
            
            {error && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error processing menu
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <MenuDisplay menu={processedMenu} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}