'use client'

import { useState } from 'react'
import { ProcessedMenu } from '@/types/menu'
import MenuCard from '@/components/MenuCard'
import MenuFilters from '@/components/MenuFilters'
import ChatInterface from '@/components/ChatInterface'

interface MenuDisplayProps {
  menu: ProcessedMenu
  onReset: () => void
}

export default function MenuDisplay({ menu, onReset }: MenuDisplayProps) {
  const [filteredItems, setFilteredItems] = useState(menu.items)
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="glass-effect border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Menu</h2>
                <p className="text-xs text-slate-600">{menu.items.length} dishes found</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-full transition-colors ${showChat ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'} lg:hidden`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5-1.314L3 21l1.314-4C2.782 15.314 3 13.674 3 12c0-4.418 4.418-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button
                onClick={onReset}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                New Menu
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6 space-y-6 lg:space-y-0">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <MenuFilters 
              items={menu.items} 
              onFilteredItemsChange={setFilteredItems}
            />
            
            <div className="grid grid-cols-1 gap-4">
              {filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="glass-effect rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No matches found</h3>
                <p className="text-slate-600 text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>

          {/* Chat Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <ChatInterface menu={menu} />
          </div>
        </div>
      </div>

      {/* Mobile Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowChat(false)} />
          <div className="absolute bottom-0 left-0 right-0 h-[80vh] glass-effect rounded-t-3xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-slate-900">Ask About Menu</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(80vh-5rem)]">
              <ChatInterface menu={menu} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}