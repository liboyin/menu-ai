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
  const [showFilters, setShowFilters] = useState(false)
  
  const extractPrice = (priceStr: string | null): number | null => {
    if (!priceStr) return null
    const cleaned = priceStr.replace(/[^0-9.]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  const priceRangeValues = items.map(item => extractPrice(item.price)).filter((price): price is number => price !== null)
  const minPrice = priceRangeValues.length > 0 ? Math.min(...priceRangeValues) : 0
  const maxPrice = priceRangeValues.length > 0 ? Math.max(...priceRangeValues) : 100

  useEffect(() => {
    setPriceRange([minPrice, maxPrice])
  }, [minPrice, maxPrice])

  useEffect(() => {
    let filtered = items

    filtered = filtered.filter(item => {
      const price = extractPrice(item.price)
      if (price === null) return true // Include items without prices
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

  const hasActiveFilters = ingredientFilter.trim() !== '' || priceRange[0] !== minPrice || priceRange[1] !== maxPrice

  const clearFilters = () => {
    setIngredientFilter('')
    setPriceRange([minPrice, maxPrice])
  }

  return (
    <div className="glass-effect rounded-3xl overflow-hidden">
      {/* Filter Header - Mobile */}
      <div className="p-4 sm:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900">Filters</span>
            {hasActiveFilters && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <svg 
            className={`w-5 h-5 text-slate-500 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Filters</h3>
            {hasActiveFilters && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-600 hover:text-blue-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      
      {/* Filter Content */}
      <div className={`p-4 space-y-6 ${!showFilters ? 'hidden sm:block' : ''}`}>
        {/* Price Range */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Price Range
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 flex-1 border border-slate-200">
                <span className="text-sm text-slate-500 mr-1">$</span>
                <input
                  type="number"
                  min={minPrice}
                  max={maxPrice}
                  step="0.50"
                  value={priceRange[0]}
                  onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
              <span className="text-slate-400">to</span>
              <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 flex-1 border border-slate-200">
                <span className="text-sm text-slate-500 mr-1">$</span>
                <input
                  type="number"
                  min={minPrice}
                  max={maxPrice}
                  step="0.50"
                  value={priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>${minPrice.toFixed(2)}</span>
              <span>${maxPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Ingredient Filter */}
        <div>
          <label htmlFor="ingredient-filter" className="block text-sm font-semibold text-slate-900 mb-3">
            Contains Ingredient
          </label>
          <div className="relative">
            <input
              type="text"
              id="ingredient-filter"
              placeholder="Search for chicken, tomato, etc."
              value={ingredientFilter}
              onChange={(e) => setIngredientFilter(e.target.value)}
              className="w-full px-3 py-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {ingredientFilter && (
              <button
                onClick={() => setIngredientFilter('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Common ingredients like salt, pepper, and oil are filtered out
          </p>
        </div>

        {/* Mobile Clear Button */}
        {hasActiveFilters && (
          <div className="sm:hidden pt-2">
            <button
              onClick={clearFilters}
              className="w-full py-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}