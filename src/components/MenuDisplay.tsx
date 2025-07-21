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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Menu</h2>
          <p className="text-gray-600 mt-1">
            Found {menu.items.length} items • Ask questions or use filters below
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Upload New Menu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <MenuFilters 
            items={menu.items} 
            onFilteredItemsChange={setFilteredItems}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No items match your filters</div>
              <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <ChatInterface menu={menu} />
        </div>
      </div>
    </div>
  )
}