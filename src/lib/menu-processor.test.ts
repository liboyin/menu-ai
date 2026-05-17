import * as testee from './menu-processor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('@google/generative-ai');
jest.mock('https');

const mockGenerateContent = jest.fn();

type GenerativeAIInstance = { getGenerativeModel: jest.Mock };

beforeAll(() => {
  jest.mocked(GoogleGenerativeAI).mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  }) as unknown as GenerativeAIInstance);
});

describe('processMenuImages', () => {
  const imageFile = (() => {
    const imagePath = path.resolve(__dirname, '../../assets/sample_menu.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    return {
      type: 'image/jpeg',
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer),
    } as File;
  })();

  beforeEach(() => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
    process.env.RAPIDAPI_KEY = 'test-key';

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify([
          {
            id: '1',
            name: 'Fatto Tiramisu',
            price: '7',
            description: 'Coffee liqueur soaked sponge, mascarpone, chocolate',
            ingredients: ['coffee liqueur', 'sponge', 'mascarpone', 'chocolate'],
          },
          {
            id: '2',
            name: 'Affogato',
            price: '6',
            description: 'Vanilla gelato, espresso',
            ingredients: ['vanilla gelato', 'espresso'],
          },
        ]),
      },
    });
  });

  it('should process a menu image and return a processed menu', async () => {
    const processedMenu = await testee.processMenuImages([imageFile]);

    expect(processedMenu).toBeDefined();
    expect(processedMenu.items).toHaveLength(2);

    expect(processedMenu.items[0].name).toBe('Fatto Tiramisu');
    expect(processedMenu.items[0].price).toBe('7');
    expect(processedMenu.items[0].description).toBe('Coffee liqueur soaked sponge, mascarpone, chocolate');
    expect(processedMenu.items[0].ingredients).toEqual(['coffee liqueur', 'sponge', 'mascarpone', 'chocolate']);
    expect(processedMenu.items[0].image).toBe('https://example.com/test-image.jpg');

    expect(processedMenu.items[1].name).toBe('Affogato');
    expect(processedMenu.items[1].price).toBe('6');
    expect(processedMenu.items[1].description).toBe('Vanilla gelato, espresso');
    expect(processedMenu.items[1].ingredients).toEqual(['vanilla gelato', 'espresso']);
  });

  it('should throw when GOOGLE_GEMINI_API_KEY is missing', async () => {
    delete process.env.GOOGLE_GEMINI_API_KEY;

    await expect(testee.processMenuImages([imageFile])).rejects.toThrow(
      'GOOGLE_GEMINI_API_KEY not found in environment variables'
    );

    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
  });

  it('should throw when AI response contains no JSON array', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'Sorry, I cannot read this menu.' },
    });

    await expect(testee.processMenuImages([imageFile])).rejects.toThrow(
      'No valid JSON found in AI response'
    );
  });

  it('should throw when AI response is not an array', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '{"error": "not an array"}' },
    });

    await expect(testee.processMenuImages([imageFile])).rejects.toThrow(
      'Failed to analyze menu with AI'
    );
  });

  it('should fall back to image/jpeg when file type is empty', async () => {
    const emptyTypeFile = {
      type: '',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as File;

    const result = await testee.processMenuImages([emptyTypeFile]);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].image).toBe('https://example.com/test-image.jpg');
  });

  it('should filter out invalid items from AI response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify([
          { id: '1', name: 'Valid Item', price: '10', ingredients: ['cheese'] },
          null,
          { id: '3' },
        ]),
      },
    });

    const result = await testee.processMenuImages([imageFile]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Valid Item');
  });

  it('should return placeholder image when RAPIDAPI_KEY is missing', async () => {
    delete process.env.RAPIDAPI_KEY;

    const result = await testee.processMenuImages([imageFile]);

    expect(result.items[0].image).toBe('https://placehold.co/600x400?text=Image+Not+Found');

    process.env.RAPIDAPI_KEY = 'test-key';
  });

  it('should return placeholder image when image search returns empty data', async () => {
    const httpsModule = jest.requireMock('https') as { request: jest.Mock };

    httpsModule.request.mockImplementationOnce((_options: unknown, callback: (res: unknown) => void) => {
      const mockRes = {
        on: (event: string, cb: (...args: unknown[]) => void) => {
          if (event === 'data') cb(Buffer.from(JSON.stringify({ status: 'OK', data: [] })));
          if (event === 'end') cb();
        },
      };
      return {
        on: jest.fn(),
        setTimeout: jest.fn(),
        destroy: jest.fn(),
        end: jest.fn(() => callback(mockRes)),
      };
    });

    const result = await testee.processMenuImages([imageFile]);

    expect(result.items[0].image).toBe('https://placehold.co/600x400?text=Image+Not+Found');
  });

  it('should return placeholder image when image search returns invalid JSON', async () => {
    const httpsModule = jest.requireMock('https') as { request: jest.Mock };

    httpsModule.request.mockImplementationOnce((options: unknown, callback: (res: unknown) => void) => {
      const mockRes = {
        on: (event: string, cb: (...args: unknown[]) => void) => {
          if (event === 'data') cb(Buffer.from('not-valid-json{{{'));
          if (event === 'end') cb();
        },
      };
      return {
        on: jest.fn(),
        setTimeout: jest.fn(),
        destroy: jest.fn(),
        end: jest.fn(() => callback(mockRes)),
      };
    });

    const result = await testee.processMenuImages([imageFile]);

    expect(result.items[0].image).toBe('https://placehold.co/600x400?text=Image+Not+Found');
  });

  it('should return placeholder image when image search request errors', async () => {
    const httpsModule = jest.requireMock('https') as { request: jest.Mock };

    httpsModule.request.mockImplementationOnce(() => {
      return {
        on: jest.fn((event: string, cb: (err: Error) => void) => {
          if (event === 'error') cb(new Error('Network failure'));
        }),
        setTimeout: jest.fn(),
        destroy: jest.fn(),
        end: jest.fn(),
      };
    });

    const result = await testee.processMenuImages([imageFile]);

    expect(result.items[0].image).toBe('https://placehold.co/600x400?text=Image+Not+Found');
  });

  it('should return placeholder image when image search hangs past the request timeout', async () => {
    const httpsModule = jest.requireMock('https') as { request: jest.Mock };

    httpsModule.request.mockImplementationOnce(() => {
      let errorHandler: ((err: Error) => void) | null = null;
      let timeoutCb: (() => void) | null = null;
      const req = {
        on: jest.fn((event: string, cb: (err: Error) => void) => {
          if (event === 'error') errorHandler = cb;
        }),
        setTimeout: jest.fn((_ms: number, cb: () => void) => {
          timeoutCb = cb;
        }),
        destroy: jest.fn((err: Error) => {
          if (errorHandler) errorHandler(err);
        }),
        end: jest.fn(() => {
          if (timeoutCb) timeoutCb();
        }),
      };
      return req;
    });

    const result = await testee.processMenuImages([imageFile]);

    expect(result.items[0].image).toBe('https://placehold.co/600x400?text=Image+Not+Found');
  });
});
