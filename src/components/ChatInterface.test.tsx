import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from './ChatInterface';
import { ProcessedMenu } from '@/types/menu';
import { sampleProcessedMenu, menuItemsWithDietaryInfo } from '../test-helpers/menu-data';

// Mock fetch
global.fetch = jest.fn();

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: jest.fn(),
});

const mockMenu: ProcessedMenu = sampleProcessedMenu;

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the chat interface with initial message', () => {
    render(<ChatInterface menu={mockMenu} />);
    
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Ask questions about this menu')).toBeInTheDocument();
    expect(screen.getByText('Hi! I can help you find dishes on this menu. Ask about dietary restrictions, ingredients, or specific dishes.')).toBeInTheDocument();
  });

  it('displays quick questions when only initial message exists', () => {
    render(<ChatInterface menu={mockMenu} />);
    
    expect(screen.getByText('Quick questions:')).toBeInTheDocument();
    expect(screen.getByText('What are the vegan options?')).toBeInTheDocument();
    expect(screen.getByText('Which dishes are gluten-free?')).toBeInTheDocument();
    expect(screen.getByText('Show me chicken dishes')).toBeInTheDocument();
    expect(screen.getByText('Any nut-free options?')).toBeInTheDocument();
  });

  it('handles quick question selection', () => {
    render(<ChatInterface menu={mockMenu} />);
    
    const quickQuestion = screen.getByText('What are the vegan options?');
    fireEvent.click(quickQuestion);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    expect(input).toHaveValue('What are the vegan options?');
  });

  it('submits a message and displays it', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Here are the vegan options...' }),
    });

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'What are the vegan options?' } });
    fireEvent.click(submitButton);
    
    // Check that user message appears
    expect(screen.getByText('What are the vegan options?')).toBeInTheDocument();
    
    // Check that loading indicator appears
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    
    // Wait for API response
    await waitFor(() => {
      expect(screen.getByText('Here are the vegan options...')).toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Test response' }),
    });

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form!);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables input and button while loading', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('prevents submission of empty messages', () => {
    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    // Button should be disabled when input is empty
    expect(submitButton).toBeDisabled();
    
    // Add whitespace only - should still be disabled
    fireEvent.change(input, { target: { value: '   ' } });
    expect(submitButton).toBeDisabled();
    
    // Add actual text - should be enabled
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('clears input after successful submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Test response' }),
    });

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);
    
    // Input should be cleared immediately
    expect(input).toHaveValue('');
  });

  it('displays message timestamps', () => {
    render(<ChatInterface menu={mockMenu} />);
    
    // Should show timestamp for initial message
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('hides quick questions after first user message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Test response' }),
    });

    render(<ChatInterface menu={mockMenu} />);
    
    // Quick questions should be visible initially
    expect(screen.getByText('Quick questions:')).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);
    
    // Quick questions should be hidden after user sends a message
    await waitFor(() => {
      expect(screen.queryByText('Quick questions:')).not.toBeInTheDocument();
    });
  });

  it('handles realistic dessert menu questions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'We have several gelato options including Affogato and gelato sandwiches!' }),
    });

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'What gelato options do you have?' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('What gelato options do you have?')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('We have several gelato options including Affogato and gelato sandwiches!')).toBeInTheDocument();
    });
  });

  it('handles dietary restriction questions with realistic menu', async () => {
    const dietaryMenu: ProcessedMenu = { items: menuItemsWithDietaryInfo };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Yes, we have vegan chocolate cake and gluten-free tiramisu!' }),
    });

    render(<ChatInterface menu={dietaryMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    const submitButton = screen.getByRole('button', { name: '' });
    
    fireEvent.change(input, { target: { value: 'Do you have any vegan or gluten-free options?' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Yes, we have vegan chocolate cake and gluten-free tiramisu!')).toBeInTheDocument();
    });
  });

  it('handles coffee and liqueur questions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'We serve espresso, macchiato, and limoncello digestivo!' }),
    });

    render(<ChatInterface menu={mockMenu} />);
    
    const input = screen.getByPlaceholderText('Ask about dietary options...');
    fireEvent.change(input, { target: { value: 'What drinks do you have?' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByText('We serve espresso, macchiato, and limoncello digestivo!')).toBeInTheDocument();
    });
  });
});