import { MenuItem, ProcessedMenu } from '@/types/menu';

// Realistic menu data based on the sample menu from Fatto A Mano Pizzeria
export const sampleMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Fatto Tiramisu',
    price: '7',
    description: 'Coffee liqueur soaked sponge, mascarpone, chocolate',
    ingredients: ['coffee liqueur', 'sponge', 'mascarpone', 'chocolate'],
    image: 'https://example.com/tiramisu.jpg',
  },
  {
    id: '2',
    name: 'Scugnizielli Nutella & Gelato',
    price: '7.5',
    description: 'Fried mini pizza doughnuts, Nutella, vanilla gelato',
    ingredients: ['pizza dough', 'nutella', 'vanilla gelato', 'oil'],
    image: 'https://example.com/scugnizielli.jpg',
  },
  {
    id: '3',
    name: 'Affogato',
    price: '6',
    description: 'Vanilla gelato, espresso',
    ingredients: ['vanilla gelato', 'espresso'],
    image: 'https://example.com/affogato.jpg',
  },
  {
    id: '4',
    name: 'Affogato Limoncello',
    price: '7.5',
    description: 'Lemon sorbet, limoncello',
    ingredients: ['lemon sorbet', 'limoncello'],
    image: 'https://example.com/affogato-limoncello.jpg',
  },
  {
    id: '5',
    name: 'Lemon Meringue Gelato Sandwich',
    price: '7',
    description: 'Vanilla biscuit filled with vanilla gelato, lemon curd & meringue',
    ingredients: ['vanilla biscuit', 'vanilla gelato', 'lemon curd', 'meringue'],
    image: 'https://example.com/lemon-meringue.jpg',
  },
  {
    id: '6',
    name: 'Chocolate Salted Caramel Gelato Sandwich',
    price: '7',
    description: 'Chocolate dipped biscuit filled with salted caramel gelato',
    ingredients: ['chocolate biscuit', 'salted caramel gelato', 'chocolate'],
    image: 'https://example.com/chocolate-caramel.jpg',
  },
  {
    id: '7',
    name: 'Chocolate Orange Gelato Sandwich',
    price: '7',
    description: 'Chocolate biscuit filled with chocolate orange gelato',
    ingredients: ['chocolate biscuit', 'chocolate orange gelato'],
    image: 'https://example.com/chocolate-orange.jpg',
  },
  {
    id: '8',
    name: 'Espresso',
    price: '2.5',
    description: 'Traditional Italian espresso',
    ingredients: ['coffee beans'],
    image: 'https://example.com/espresso.jpg',
  },
  {
    id: '9',
    name: 'Macchiato',
    price: '2.5',
    description: 'Espresso with a spot of steamed milk',
    ingredients: ['coffee beans', 'milk'],
    image: 'https://example.com/macchiato.jpg',
  },
  {
    id: '10',
    name: 'Limoncello',
    price: '4',
    description: 'Traditional Italian lemon liqueur (35ml)',
    ingredients: ['lemons', 'sugar', 'alcohol'],
    image: 'https://example.com/limoncello.jpg',
  }
];

export const sampleProcessedMenu: ProcessedMenu = {
  items: sampleMenuItems
};

// Menu items with various price formats for testing
export const menuItemsWithVariedPrices: MenuItem[] = [
  {
    id: '1',
    name: 'Budget Dessert',
    price: '$5.00',
    ingredients: ['sugar', 'flour'],
  },
  {
    id: '2',
    name: 'Premium Dessert',
    price: '£15.50',
    ingredients: ['premium chocolate', 'gold leaf'],
  },
  {
    id: '3',
    name: 'Euro Dessert',
    price: '€8.75',
    ingredients: ['vanilla', 'cream'],
  },
  {
    id: '4',
    name: 'Market Price Item',
    price: null,
    ingredients: ['seasonal fruit'],
  },
  {
    id: '5',
    name: 'Simple Price',
    price: '12',
    ingredients: ['chocolate'],
  }
];

// Menu items for dietary restriction testing
export const menuItemsWithDietaryInfo: MenuItem[] = [
  {
    id: '1',
    name: 'Vegan Chocolate Cake',
    price: '8',
    description: 'Rich chocolate cake made with plant-based ingredients',
    ingredients: ['cocoa powder', 'almond milk', 'coconut oil', 'flour', 'sugar'],
  },
  {
    id: '2',
    name: 'Gluten-Free Tiramisu',
    price: '9',
    description: 'Classic tiramisu with gluten-free ladyfingers',
    ingredients: ['mascarpone', 'coffee', 'eggs', 'gluten-free ladyfingers'],
  },
  {
    id: '3',
    name: 'Nut-Free Ice Cream',
    price: '6',
    description: 'Vanilla ice cream made in nut-free facility',
    ingredients: ['milk', 'cream', 'vanilla', 'sugar'],
  },
  {
    id: '4',
    name: 'Regular Pizza',
    price: '14',
    description: 'Traditional pizza with cheese and tomato',
    ingredients: ['wheat flour', 'tomato', 'mozzarella', 'basil'],
  }
];

// Edge case items for testing
export const edgeCaseMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Item with Very Long Name That Should Be Truncated Properly in the UI Components',
    price: '10',
    description: 'This is a very long description that might be truncated in the UI. It contains multiple sentences to test how the component handles lengthy text. The description goes on and on to test the line clamping functionality.',
    ingredients: ['ingredient1', 'ingredient2', 'ingredient3', 'ingredient4', 'ingredient5', 'ingredient6', 'ingredient7', 'ingredient8'],
  },
  {
    id: '2',
    name: 'Minimal Item',
    price: '5',
    ingredients: ['single ingredient'],
  },
  {
    id: '3',
    name: 'No Price Item',
    price: null,
    description: 'Item without a fixed price',
    ingredients: ['market ingredients'],
  },
  {
    id: '4',
    name: 'No Image Item',
    price: '7.50',
    description: 'Item without an image',
    ingredients: ['regular ingredients'],
    // image property omitted intentionally
  }
];

export const emptyMenu: ProcessedMenu = {
  items: []
};