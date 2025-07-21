import { ProcessedMenu, MenuItem } from '@/types/menu'

export async function processMenuImages(images: File[]): Promise<ProcessedMenu> {
  try {
    const base64Images = await Promise.all(
      images.map(async (image) => {
        const buffer = await image.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        return `data:${image.type};base64,${base64}`
      })
    )

    const menuItems = await analyzeMenuWithAI(base64Images)
    
    const enrichedItems = await Promise.all(
      menuItems.map(async (item) => ({
        ...item,
        image: await searchDishImage(item.name)
      }))
    )

    return { items: enrichedItems }
  } catch (error) {
    console.error('Error processing menu images:', error)
    throw new Error('Failed to process menu images')
  }
}

async function analyzeMenuWithAI(base64Images: string[]): Promise<MenuItem[]> {
  const prompt = `
    Analyze this restaurant menu image and extract all menu items in a structured format.
    
    For each menu item, provide:
    1. name: The dish name exactly as written
    2. price: The price exactly as shown (include currency symbol if present)
    3. description: Any description or ingredients listed (if available)
    4. ingredients: A list of probable main ingredients based on the dish name and any listed ingredients
    
    Return the data as a JSON array of objects with this exact structure:
    [
      {
        "id": "unique_id",
        "name": "Dish Name",
        "price": "$12.99",
        "description": "Description if available",
        "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
      }
    ]
    
    Rules:
    - Skip trivial ingredients like salt, water, pepper, sugar, oil
    - If no description is provided, leave the description field as an empty string
    - Generate reasonable ingredient lists based on common preparations of the dish
    - Use sequential IDs starting from "1"
    - Only include actual food items, skip drinks, headers, or non-food text
  `

  // For now, return mock data since we need API keys for actual LLM integration
  // In production, this would call OpenAI GPT-4 Vision or Google Gemini
  return [
    {
      id: '1',
      name: 'Classic Burger',
      price: '$14.99',
      description: 'Beef patty with lettuce, tomato, onion, and our special sauce',
      ingredients: ['beef', 'lettuce', 'tomato', 'onion', 'cheese', 'bun']
    },
    {
      id: '2', 
      name: 'Caesar Salad',
      price: '$12.99',
      description: 'Romaine lettuce with parmesan cheese and croutons',
      ingredients: ['romaine lettuce', 'parmesan cheese', 'croutons', 'caesar dressing']
    },
    {
      id: '3',
      name: 'Margherita Pizza',
      price: '$16.99',
      description: 'Fresh mozzarella, tomato sauce, and basil',
      ingredients: ['mozzarella', 'tomato sauce', 'basil', 'pizza dough']
    }
  ]
}

async function searchDishImage(dishName: string): Promise<string> {
  // For now, return a placeholder image
  // In production, this would use Google Custom Search API or similar
  return `https://via.placeholder.com/300x200/f3f4f6/6b7280?text=${encodeURIComponent(dishName)}`
}