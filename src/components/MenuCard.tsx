'use client'

import Image from 'next/image'
import { MenuItem } from '@/types/menu'

interface MenuCardProps {
  item: MenuItem
}

export default function MenuCard({ item }: MenuCardProps) {
  return (
    <div className="glass-effect rounded-3xl overflow-hidden hover:shadow-soft transition-all duration-300 hover:transform hover:scale-105">
      <div className="flex">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 m-4 rounded-2xl overflow-hidden bg-slate-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 pl-0 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 flex-1 pr-2">
              {item.name}
            </h3>
            <span className="text-lg font-bold text-blue-600 whitespace-nowrap ml-2">
              {item.price}
            </span>
          </div>
          
          {item.description && (
            <p className="text-slate-600 text-sm mb-3 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
          
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {item.ingredients.slice(0, 4).map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full font-medium"
                >
                  {ingredient}
                </span>
              ))}
              {item.ingredients.length > 4 && (
                <span className="inline-block text-slate-500 text-xs px-2 py-1">
                  +{item.ingredients.length - 4} more
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2"></div>
            <p className="text-xs text-slate-500">
              AI-analyzed ingredients
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}