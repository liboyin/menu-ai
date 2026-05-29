import { MenuItem } from '@/types/menu';
import { menuItemsWithVariedPrices, emptyMenu } from '../test-helpers/menu-data';
import * as testee from './menu-filters';

describe('extractPrice', () => {
  it('parses prices regardless of currency symbol or formatting', () => {
    // The model emits prices with assorted symbols; filtering must still work.
    expect(testee.extractPrice('$5.00')).toBe(5);
    expect(testee.extractPrice('£15.50')).toBe(15.5);
    expect(testee.extractPrice('€8.75')).toBe(8.75);
    expect(testee.extractPrice('12')).toBe(12);
  });

  it('returns null for a null price so market-priced items are not coerced to 0', () => {
    expect(testee.extractPrice(null)).toBeNull();
  });

  it('returns null when the string contains no parseable number', () => {
    // "Market Price" must not become a number that skews price bounds/filters.
    expect(testee.extractPrice('Market Price')).toBeNull();
  });
});

describe('getPriceBounds', () => {
  it('returns the min and max of all parseable prices, ignoring null prices', () => {
    // Bounds drive the slider; null-priced items must not pull the range to 0.
    expect(testee.getPriceBounds(menuItemsWithVariedPrices)).toEqual({ min: 5, max: 15.5 });
  });

  it('falls back to 0–100 when no item has a parseable price', () => {
    // The filter UI still needs a sensible default range to render.
    expect(testee.getPriceBounds(emptyMenu.items)).toEqual({ min: 0, max: 100 });
  });
});

describe('filterMenuItems', () => {
  const items: MenuItem[] = [
    { id: '1', name: 'Cheap Chicken', price: '5', ingredients: ['Chicken', 'salt'] },
    { id: '2', name: 'Pricey Beef', price: '20', ingredients: ['beef'] },
    { id: '3', name: 'Market Fish', price: null, ingredients: ['fish'] },
  ];

  it('keeps items within the price range and always keeps null-priced items', () => {
    // A diner filtering by price should still see market-priced dishes.
    const result = testee.filterMenuItems(items, [0, 10], '');
    expect(result.map((i) => i.id)).toEqual(['1', '3']);
  });

  it('matches ingredients case-insensitively as a substring', () => {
    // Diners type lowercase; the model's ingredient casing is inconsistent.
    const result = testee.filterMenuItems(items, [0, 100], 'chicken');
    expect(result.map((i) => i.id)).toEqual(['1']);
  });

  it('ignores a whitespace-only ingredient term', () => {
    // An empty/blank search box must not hide every dish.
    const result = testee.filterMenuItems(items, [0, 100], '   ');
    expect(result.map((i) => i.id)).toEqual(['1', '2', '3']);
  });
});
