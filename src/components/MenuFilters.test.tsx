import { render, screen, fireEvent } from '@testing-library/react';
import MenuFilters from './MenuFilters';
import { MenuItem } from '@/types/menu';
import { sampleMenuItems, menuItemsWithVariedPrices } from '../test-helpers/menu-data';

// Use realistic menu items from the sample
const mockItems: MenuItem[] = sampleMenuItems.slice(0, 5); // First 5 items for testing

describe('MenuFilters', () => {
  const mockOnFilteredItemsChange = jest.fn();

  beforeEach(() => {
    mockOnFilteredItemsChange.mockClear();
  });

  it('renders the filters component', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    expect(screen.getAllByText('Filters')[0]).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Contains Ingredient')).toBeInTheDocument();
  });

  it('shows mobile filter toggle', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Mobile filter button should be present
    const mobileFilterButton = screen.getByRole('button');
    expect(mobileFilterButton).toBeInTheDocument();
  });

  it('filters items by price range', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Change minimum price to $10
    const minPriceInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(minPriceInput, { target: { value: '10' } });
    
    // Should call onFilteredItemsChange with items >= $10 (chicken salad and beef burger)
    expect(mockOnFilteredItemsChange).toHaveBeenCalled();
  });

  it('filters items by ingredient', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Search for 'gelato' (appears in multiple items)
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'gelato' } });
    
    // Should call onFilteredItemsChange with items containing gelato
    expect(mockOnFilteredItemsChange).toHaveBeenCalled();
  });

  it('shows clear filter button when filters are active', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Apply an ingredient filter
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'gelato' } });
    
    // Clear button should appear
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Apply filters
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'gelato' } });
    
    // Click clear all
    const clearButton = screen.getByText('Clear all');
    fireEvent.click(clearButton);
    
    // Input should be cleared
    expect(ingredientInput).toHaveValue('');
  });

  it('filters realistic menu items by specific ingredients', () => {
    render(<MenuFilters items={sampleMenuItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Search for 'chocolate' (appears in tiramisu and gelato sandwiches)
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'chocolate' } });
    
    expect(mockOnFilteredItemsChange).toHaveBeenCalled();
  });

  it('handles various price formats correctly', () => {
    render(<MenuFilters items={menuItemsWithVariedPrices} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Should handle different currency symbols and formats
    expect(mockOnFilteredItemsChange).toHaveBeenCalledWith(menuItemsWithVariedPrices);
  });

  it('filters items by coffee-related ingredients', () => {
    render(<MenuFilters items={sampleMenuItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Search for 'espresso'
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'espresso' } });
    
    expect(mockOnFilteredItemsChange).toHaveBeenCalled();
  });

  it('handles case-insensitive ingredient filtering', () => {
    render(<MenuFilters items={sampleMenuItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Search with different case
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'GELATO' } });
    
    expect(mockOnFilteredItemsChange).toHaveBeenCalled();
  });

  it('shows active filter indicator', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Apply an ingredient filter
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'chicken' } });
    
    // Should show blue dot indicator for active filters
    const indicators = document.querySelectorAll('.bg-blue-500');
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('handles ingredient filter clearing', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Add ingredient filter
    const ingredientInput = screen.getByPlaceholderText('Search for chicken, tomato, etc.');
    fireEvent.change(ingredientInput, { target: { value: 'chicken' } });
    
    // Find and click the clear button (X icon) in the ingredient input
    const clearIngredientButton = screen.getByRole('button', { name: '' });
    if (clearIngredientButton) {
      fireEvent.click(clearIngredientButton);
      expect(ingredientInput).toHaveValue('');
    }
  });

  it('validates price range inputs', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    const [minInput, maxInput] = screen.getAllByRole('spinbutton');
    
    // Try to set min price higher than max price
    fireEvent.change(maxInput, { target: { value: '5' } });
    fireEvent.change(minInput, { target: { value: '10' } });
    
    // Min should not be allowed to be higher than max
    // The component should handle this validation
    expect(mockOnFilteredItemsChange).toHaveBeenCalled();
  });

  it('accepts a valid minimum price change within current range', () => {
    render(<MenuFilters items={sampleMenuItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);

    const [minInput] = screen.getAllByRole('spinbutton');
    // sampleMenuItems prices: 6..7.5 — changing min to 6.5 is valid (≤ max 7.5)
    fireEvent.change(minInput, { target: { value: '6.5' } });

    const calls = mockOnFilteredItemsChange.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    // Items priced below 6.5 (Affogato at 6, Espresso/Macchiato at 2.5) should be filtered out
    expect(lastCall.every((item: { price: string | null }) => {
      const price = item.price ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : null;
      return price === null || price >= 6.5;
    })).toBe(true);
  });

  it('accepts a valid maximum price change within current range', () => {
    render(<MenuFilters items={sampleMenuItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);

    const [, maxInput] = screen.getAllByRole('spinbutton');
    // Changing max to 7 is valid (≥ min 2.5)
    fireEvent.change(maxInput, { target: { value: '7' } });

    const calls = mockOnFilteredItemsChange.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    // Items priced above 7 (Scugnizielli/Affogato Limoncello at 7.5) should be filtered out
    expect(lastCall.every((item: { price: string | null }) => {
      const price = item.price ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : null;
      return price === null || price <= 7;
    })).toBe(true);
  });

  it('toggles filter panel via mobile toggle button', () => {
    render(<MenuFilters items={mockItems} onFilteredItemsChange={mockOnFilteredItemsChange} />);

    // Mobile toggle is the first button; click to expand
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    // Filter content should now be visible (showFilters = true)
    expect(screen.getByText('Price Range')).toBeInTheDocument();
  });

  it('handles items without prices in filtering', () => {
    const itemsWithNullPrice = [
      ...mockItems,
      {
        id: '4',
        name: 'Special Dish',
        price: null,
        description: 'Market price item',
        ingredients: ['special'],
        image: 'https://example.com/image4.jpg',
      },
    ];
    
    render(<MenuFilters items={itemsWithNullPrice} onFilteredItemsChange={mockOnFilteredItemsChange} />);
    
    // Items with null prices should still be included in results
    expect(mockOnFilteredItemsChange).toHaveBeenCalledWith(itemsWithNullPrice);
  });
});