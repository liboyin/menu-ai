'use client'

import Image from 'next/image'
import { MenuItem } from '@/types/menu'

interface MenuCardProps {
  item: MenuItem
}

export default function MenuCard({ item }: MenuCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
            {item.name}
          </h3>
          <span className="text-lg font-bold text-green-600 whitespace-nowrap">
            {item.price}
          </span>
        </div>
        
        {item.description && (
          <p className="text-gray-600 text-sm mb-3">
            {item.description}
          </p>
        )}
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Main Ingredients:</h4>
          <div className="flex flex-wrap gap-1">
            {item.ingredients.map((ingredient, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
            Ingredients inferred by AI - may not be complete
          </p>
        </div>
      </div>
    </div>
  )
}