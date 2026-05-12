import { render, screen } from '@testing-library/react';
import MenuCard from './MenuCard';
import { MenuItem } from '@/types/menu';
import { sampleMenuItems, edgeCaseMenuItems } from '../test-helpers/menu-data';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;  // eslint-disable-line @next/next/no-img-element
  };
});

const mockItem: MenuItem = sampleMenuItems[0]; // Fatto Tiramisu

describe('MenuCard', () => {
  it('renders realistic menu item with all information', () => {
    render(<MenuCard item={mockItem} />);
    
    expect(screen.getByText('Fatto Tiramisu')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Coffee liqueur soaked sponge, mascarpone, chocolate')).toBeInTheDocument();
    expect(screen.getByText('AI-analyzed ingredients')).toBeInTheDocument();
  });

  it('displays the image when provided', () => {
    render(<MenuCard item={mockItem} />);
    
    const image = screen.getByAltText('Fatto Tiramisu');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/tiramisu.jpg');
  });

  it('shows placeholder when no image is provided', () => {
    const itemWithoutImage = edgeCaseMenuItems[3]; // No Image Item
    render(<MenuCard item={itemWithoutImage} />);
    
    // Should show the placeholder div with SVG icon (not an img element)
    const placeholder = document.querySelector('.flex.items-center.justify-center.h-full.text-slate-400');
    expect(placeholder).toBeInTheDocument();
    
    // Should not show the Next.js Image component
    expect(screen.queryByAltText('No Image Item')).not.toBeInTheDocument();
  });

  it('displays market price when no price is provided', () => {
    const itemWithoutPrice = edgeCaseMenuItems[2]; // No Price Item
    render(<MenuCard item={itemWithoutPrice} />);
    
    expect(screen.getByText('Market price')).toBeInTheDocument();
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    const itemWithoutDescription = edgeCaseMenuItems[1]; // Minimal Item
    render(<MenuCard item={itemWithoutDescription} />);
    
    expect(screen.getByText('Minimal Item')).toBeInTheDocument();
    expect(screen.queryByText('Coffee liqueur soaked sponge')).not.toBeInTheDocument();
  });

  it('displays first 4 ingredients from realistic menu item', () => {
    render(<MenuCard item={mockItem} />);
    
    // Fatto Tiramisu has 4 ingredients exactly
    expect(screen.getByText('coffee liqueur')).toBeInTheDocument();
    expect(screen.getByText('sponge')).toBeInTheDocument();
    expect(screen.getByText('mascarpone')).toBeInTheDocument();
    expect(screen.getByText('chocolate')).toBeInTheDocument();
    
    // Should not show "+X more" since there are exactly 4
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  it('displays first 4 ingredients and shows count for additional ones', () => {
    const itemWithManyIngredients = edgeCaseMenuItems[0]; // Has 8 ingredients
    render(<MenuCard item={itemWithManyIngredients} />);
    
    // Should show first 4 ingredients
    expect(screen.getByText('ingredient1')).toBeInTheDocument();
    expect(screen.getByText('ingredient2')).toBeInTheDocument();
    expect(screen.getByText('ingredient3')).toBeInTheDocument();
    expect(screen.getByText('ingredient4')).toBeInTheDocument();
    
    // Should show "+4 more" for remaining ingredients
    expect(screen.getByText('+4 more')).toBeInTheDocument();
    
    // Should not show the remaining ingredients
    expect(screen.queryByText('ingredient5')).not.toBeInTheDocument();
    expect(screen.queryByText('ingredient8')).not.toBeInTheDocument();
  });

  it('displays all ingredients when there are 4 or fewer', () => {
    const affogato = sampleMenuItems[2]; // Affogato has 2 ingredients
    render(<MenuCard item={affogato} />);
    
    expect(screen.getByText('vanilla gelato')).toBeInTheDocument();
    expect(screen.getByText('espresso')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  it('handles empty ingredients array', () => {
    const itemWithNoIngredients = { ...mockItem, ingredients: [] };
    render(<MenuCard item={itemWithNoIngredients} />);
    
    expect(screen.getByText('Fatto Tiramisu')).toBeInTheDocument();
    expect(screen.queryByText('coffee liqueur')).not.toBeInTheDocument();
  });

  it('truncates extremely long dish names appropriately', () => {
    const itemWithLongName = edgeCaseMenuItems[0]; // Very long name
    render(<MenuCard item={itemWithLongName} />);
    
    expect(screen.getByText('Item with Very Long Name That Should Be Truncated Properly in the UI Components')).toBeInTheDocument();
  });

  it('handles various price formats from real menu', () => {
    const espresso = sampleMenuItems[7]; // 2.5 price format
    render(<MenuCard item={espresso} />);
    
    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });

  it('displays single ingredient items correctly', () => {
    const minimalItem = edgeCaseMenuItems[1];
    render(<MenuCard item={minimalItem} />);
    
    expect(screen.getByText('single ingredient')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });
});