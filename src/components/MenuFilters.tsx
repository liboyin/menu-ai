'use client'

import { useState, useEffect } from 'react'
import { MenuItem } from '@/types/menu'

interface MenuFiltersProps {
  items: MenuItem[]
  onFilteredItemsChange: (items: MenuItem[]) => void
}

export default function MenuFilters({ items, onFilteredItemsChange }: MenuFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [ingredientFilter, setIngredientFilter] = useState('')
  
  const extractPrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
  }

  const priceRangeValues = items.map(item => extractPrice(item.price))
  const minPrice = Math.min(...priceRangeValues)
  const maxPrice = Math.max(...priceRangeValues)

  useEffect(() => {
    setPriceRange([minPrice, maxPrice])
  }, [minPrice, maxPrice])

  useEffect(() => {
    let filtered = items

    filtered = filtered.filter(item => {
      const price = extractPrice(item.price)
      return price >= priceRange[0] && price <= priceRange[1]
    })

    if (ingredientFilter.trim()) {
      const filterTerm = ingredientFilter.toLowerCase().trim()
      filtered = filtered.filter(item =>
        item.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(filterTerm)
        )
      )
    }

    onFilteredItemsChange(filtered)
  }, [priceRange, ingredientFilter, items, onFilteredItemsChange])

  const handlePriceRangeChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0
    const newRange: [number, number] = [...priceRange]
    newRange[index] = numValue
    
    if (index === 0 && numValue <= priceRange[1]) {
      setPriceRange(newRange)
    } else if (index === 1 && numValue >= priceRange[0]) {
      setPriceRange(newRange)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                step="0.50"
                value={priceRange[0]}
                onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500">to</span>
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                step="0.50"
                value={priceRange[1]}
                onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>${minPrice.toFixed(2)}</span>
              <span>${maxPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="ingredient-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Contains Ingredient
          </label>
          <input
            type="text"
            id="ingredient-filter"
            placeholder="e.g., chicken, tomato, cheese"
            value={ingredientFilter}
            onChange={(e) => setIngredientFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Search filters out common ingredients like salt, pepper, oil
          </p>
        </div>
      </div>
    </div>
  )
}