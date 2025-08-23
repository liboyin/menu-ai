import { generateChatResponse } from './chat-processor';
import { ProcessedMenu } from '@/types/menu';

jest.mock('@google/generative-ai');

describe('generateChatResponse', () => {
  beforeAll(() => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
  });

  it('should return a response from the AI about dessert menu', async () => {
    const message = 'What gelato options do you have?';
    const menu: ProcessedMenu = {
      items: [
        {
          id: '1',
          name: 'Affogato',
          price: '6',
          description: 'Vanilla gelato, espresso',
          ingredients: ['vanilla gelato', 'espresso'],
          image: 'https://example.com/affogato.jpg',
        },
        {
          id: '2',
          name: 'Lemon Meringue Gelato Sandwich',
          price: '7',
          description: 'Vanilla biscuit filled with vanilla gelato, lemon curd & meringue',
          ingredients: ['vanilla biscuit', 'vanilla gelato', 'lemon curd', 'meringue'],
          image: 'https://example.com/lemon-meringue.jpg',
        },
      ],
    };

    const response = await generateChatResponse(message, menu);

    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  it('should handle coffee and liqueur questions', async () => {
    const message = 'Do you serve espresso?';
    const menu: ProcessedMenu = {
      items: [
        {
          id: '1',
          name: 'Espresso',
          price: '2.5',
          description: 'Traditional Italian espresso',
          ingredients: ['coffee beans'],
        },
        {
          id: '2',
          name: 'Limoncello',
          price: '4',
          description: 'Traditional Italian lemon liqueur (35ml)',
          ingredients: ['lemons', 'sugar', 'alcohol'],
        },
      ],
    };

    const response = await generateChatResponse(message, menu);

    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });
});
