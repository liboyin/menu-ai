import { processMenuImages } from './menu-processor';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('@google/generative-ai');
jest.mock('https');

describe('processMenuImages', () => {
  beforeAll(() => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
    process.env.RAPIDAPI_KEY = 'test-key';
  });

  it('should process a menu image and return a processed menu', async () => {
    const imagePath = path.resolve(__dirname, '../../sample_menu.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageFile = {
      type: 'image/jpeg',
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer),
    } as File;

    const processedMenu = await processMenuImages([imageFile]);

    expect(processedMenu).toBeDefined();
    expect(processedMenu.items).toHaveLength(2);
    
    // Check first item (Fatto Tiramisu)
    expect(processedMenu.items[0].name).toBe('Fatto Tiramisu');
    expect(processedMenu.items[0].price).toBe('7');
    expect(processedMenu.items[0].description).toBe('Coffee liqueur soaked sponge, mascarpone, chocolate');
    expect(processedMenu.items[0].ingredients).toEqual(['coffee liqueur', 'sponge', 'mascarpone', 'chocolate']);
    expect(processedMenu.items[0].image).toBe('https://example.com/test-image.jpg');
    
    // Check second item (Affogato)
    expect(processedMenu.items[1].name).toBe('Affogato');
    expect(processedMenu.items[1].price).toBe('6');
    expect(processedMenu.items[1].description).toBe('Vanilla gelato, espresso');
    expect(processedMenu.items[1].ingredients).toEqual(['vanilla gelato', 'espresso']);
  });
});
