import { MenuItem } from '@/types/menu';

/**
 * Parses a numeric price out of a free-form price string.
 *
 * Menu prices arrive as model-extracted strings (e.g. "$12.50", "12,50 USD")
 * or as null for market-priced items. Stripping all non-numeric characters
 * lets price filtering work regardless of currency symbols or formatting.
 *
 * Args:
 *   priceStr: The raw price string, or null when no price is set.
 *
 * Returns:
 *   The parsed price as a number, or null when the input is null/empty or
 *   contains no parseable number.
 */
export function extractPrice(priceStr: string | null): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Computes the price slider bounds for a set of menu items.
 *
 * Falls back to a 0–100 range when no item has a parseable price, so the
 * filter UI still renders a sensible default range.
 *
 * Args:
 *   items: The menu items to derive bounds from.
 *
 * Returns:
 *   The minimum and maximum parseable prices, or { min: 0, max: 100 } when
 *   no item has a price.
 */
export function getPriceBounds(items: MenuItem[]): { min: number; max: number } {
  const prices = items
    .map((item) => extractPrice(item.price))
    .filter((price): price is number => price !== null);
  if (prices.length === 0) return { min: 0, max: 100 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * Filters menu items by price range and ingredient search term.
 *
 * Items without a parseable price are always kept (a diner filtering by price
 * should still see market-priced dishes). The ingredient term is matched
 * case-insensitively as a substring against each item's ingredients.
 *
 * Args:
 *   items: The menu items to filter.
 *   priceRange: Inclusive [min, max] price bounds.
 *   ingredientFilter: A search term; whitespace-only or empty disables the
 *     ingredient filter.
 *
 * Returns:
 *   The subset of items matching both the price range and ingredient term.
 */
export function filterMenuItems(
  items: MenuItem[],
  priceRange: [number, number],
  ingredientFilter: string
): MenuItem[] {
  let filtered = items.filter((item) => {
    const price = extractPrice(item.price);
    if (price === null) return true; // Include items without prices
    return price >= priceRange[0] && price <= priceRange[1];
  });

  if (ingredientFilter.trim()) {
    const filterTerm = ingredientFilter.toLowerCase().trim();
    filtered = filtered.filter((item) =>
      item.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(filterTerm)
      )
    );
  }

  return filtered;
}
