import { MenuItem, ProcessedMenu } from './menu';

describe('Menu Types', () => {
  it('should create a valid MenuItem', () => {
    const menuItem: MenuItem = {
      id: '1',
      name: 'Test Dish',
      price: '$12.99',
      description: 'A delicious test dish',
      ingredients: ['ingredient1', 'ingredient2'],
      image: 'https://example.com/image.jpg',
    };

    expect(menuItem.id).toBe('1');
    expect(menuItem.name).toBe('Test Dish');
    expect(menuItem.price).toBe('$12.99');
    expect(menuItem.ingredients).toEqual(['ingredient1', 'ingredient2']);
  });

  it('should handle MenuItem with null price', () => {
    const menuItem: MenuItem = {
      id: '1',
      name: 'Market Price Dish',
      price: null,
      ingredients: ['ingredient1'],
    };

    expect(menuItem.price).toBeNull();
  });

  it('should handle MenuItem without optional fields', () => {
    const menuItem: MenuItem = {
      id: '1',
      name: 'Simple Dish',
      price: '$10.99',
      ingredients: ['ingredient1'],
    };

    expect(menuItem.description).toBeUndefined();
    expect(menuItem.image).toBeUndefined();
  });

  it('should create a valid ProcessedMenu', () => {
    const processedMenu: ProcessedMenu = {
      items: [
        {
          id: '1',
          name: 'Dish 1',
          price: '$10.99',
          ingredients: ['ingredient1'],
        },
        {
          id: '2',
          name: 'Dish 2',
          price: null,
          ingredients: ['ingredient2'],
          description: 'Optional description',
          image: 'https://example.com/image.jpg',
        },
      ],
    };

    expect(processedMenu.items).toHaveLength(2);
    expect(processedMenu.items[0].name).toBe('Dish 1');
    expect(processedMenu.items[1].price).toBeNull();
  });

  it('should handle empty ProcessedMenu', () => {
    const processedMenu: ProcessedMenu = {
      items: [],
    };

    expect(processedMenu.items).toHaveLength(0);
  });
});