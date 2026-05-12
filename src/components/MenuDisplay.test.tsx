import { render, screen, fireEvent } from '@testing-library/react';
import MenuDisplay from './MenuDisplay';
import { MenuItem, ProcessedMenu } from '@/types/menu';
import { sampleProcessedMenu, emptyMenu } from '../test-helpers/menu-data';

// Mock the child components
jest.mock('./MenuCard', () => {
  return function MockMenuCard({ item }: { item: MenuItem }) {
    return <div data-testid={`menu-card-${item.id}`}>{item.name}</div>;
  };
});

jest.mock('./MenuFilters', () => {
  return function MockMenuFilters({
    items,
    onFilteredItemsChange,
  }: {
    items: MenuItem[];
    onFilteredItemsChange: (items: MenuItem[]) => void;
  }) {
    return (
      <div data-testid="menu-filters">
        <button onClick={() => onFilteredItemsChange(items.slice(0, 1))}>
          Filter
        </button>
      </div>
    );
  };
});

jest.mock('./ChatInterface', () => {
  return function MockChatInterface({ menu }: { menu: ProcessedMenu }) {
    return <div data-testid="chat-interface">Chat for {menu.items.length} items</div>;
  };
});

const mockMenu: ProcessedMenu = sampleProcessedMenu;

describe('MenuDisplay', () => {
  const mockOnReset = jest.fn();

  beforeEach(() => {
    mockOnReset.mockClear();
  });

  it('renders the component with realistic dessert menu items', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);
    
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('10 dishes found')).toBeInTheDocument();
    expect(screen.getByTestId('menu-card-1')).toBeInTheDocument(); // Fatto Tiramisu
    expect(screen.getByTestId('menu-card-2')).toBeInTheDocument(); // Scugnizielli
    expect(screen.getByText('Fatto Tiramisu')).toBeInTheDocument();
    expect(screen.getByText('Scugnizielli Nutella & Gelato')).toBeInTheDocument();
  });

  it('calls onReset when New Menu button is clicked', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);
    
    const newMenuButton = screen.getByText('New Menu');
    fireEvent.click(newMenuButton);
    
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('toggles chat interface on mobile', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);
    
    // Chat should not be visible initially
    expect(screen.queryByText('Ask About Menu')).not.toBeInTheDocument();
    
    // Find and click the chat toggle button (the one with the chat icon)
    const chatToggleButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg path[d*="M8 12h.01M12 12h.01M16 12h.01"]')
    );
    
    if (chatToggleButton) {
      fireEvent.click(chatToggleButton);
      expect(screen.getByText('Ask About Menu')).toBeInTheDocument();
    }
  });

  it('shows desktop chat interface', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);
    
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
  });

  it('renders MenuFilters component', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);
    
    expect(screen.getByTestId('menu-filters')).toBeInTheDocument();
  });

  it('updates filtered items when MenuFilters triggers change', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);
    
    // Initially both items should be visible
    expect(screen.getByTestId('menu-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('menu-card-2')).toBeInTheDocument();
    
    // Click the filter button to trigger filtering
    fireEvent.click(screen.getByText('Filter'));
    
    // After filtering, only first item should be visible
    expect(screen.getByTestId('menu-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('menu-card-2')).not.toBeInTheDocument();
  });

  it('shows no matches message when no items are filtered', () => {
    // Test with empty menu to trigger the no matches state
    render(<MenuDisplay menu={emptyMenu} onReset={mockOnReset} />);
    
    expect(screen.getByText('No matches found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search terms')).toBeInTheDocument();
  });

  it('displays correct item count for realistic menu', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);
    
    expect(screen.getByText('10 dishes found')).toBeInTheDocument();
  });

  it('shows chat interface with realistic menu context', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);

    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    expect(screen.getByText('Chat for 10 items')).toBeInTheDocument();
  });

  it('closes mobile chat modal when overlay backdrop is clicked', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);

    const chatToggleButton = screen.getAllByRole('button').find(button =>
      button.querySelector('svg path[d*="M8 12h.01M12 12h.01M16 12h.01"]')
    );
    expect(chatToggleButton).toBeDefined();

    fireEvent.click(chatToggleButton!);
    expect(screen.getByText('Ask About Menu')).toBeInTheDocument();

    const backdrop = document.querySelector('.bg-black.bg-opacity-50') as HTMLElement;
    fireEvent.click(backdrop);

    expect(screen.queryByText('Ask About Menu')).not.toBeInTheDocument();
  });

  it('closes mobile chat modal when X button is clicked', () => {
    render(<MenuDisplay menu={mockMenu} onReset={mockOnReset} />);

    const chatToggleButton = screen.getAllByRole('button').find(button =>
      button.querySelector('svg path[d*="M8 12h.01M12 12h.01M16 12h.01"]')
    );
    expect(chatToggleButton).toBeDefined();

    fireEvent.click(chatToggleButton!);
    expect(screen.getByText('Ask About Menu')).toBeInTheDocument();

    const closeButton = document.querySelector(
      'svg path[d*="M6 18L18 6M6 6l12 12"]'
    )?.closest('button') as HTMLElement;
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton);

    expect(screen.queryByText('Ask About Menu')).not.toBeInTheDocument();
  });
});