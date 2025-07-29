import { ProcessedMenu, MenuItem } from '@/types/menu'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not found in environment variables')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
      Analyze this restaurant menu image and extract all menu items in a structured format.
      
      For each menu item, provide:
      1. name: The dish name exactly as written
      2. price: The price exactly as shown (include currency symbol if present), OR null if no price is available
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
      
      Rules for pricing:
      - If a specific price is shown (e.g., "$12.99", "€15.50"), include it exactly as displayed
      - If the price says "market price", "MP", "seasonal", or similar, set price to null
      - If you can infer a consistent pricing pattern (e.g., "all sandwiches $6", "all entrees $15"), apply that pattern to matching items
      - If no price information is available at all for an item, set price to null
      
      Other rules:
      - Skip trivial ingredients like salt, water, pepper, sugar, oil
      - If no description is provided, leave the description field as an empty string
      - Generate reasonable ingredient lists based on common preparations of the dish
      - Use sequential IDs starting from "1"
      - Only include actual food items, skip drinks, headers, or non-food text
      - Return only valid JSON, no additional text or formatting
    `

    const imageParts = base64Images.map((base64Image) => {
      const [mimeData, data] = base64Image.split(',')
      const mimeType = mimeData.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
      
      return {
        inlineData: {
          data: data,
          mimeType: mimeType
        }
      }
    })

    const result = await model.generateContent([prompt, ...imageParts])
    const response = result.response
    const text = response.text()

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response')
    }

    const menuItems = JSON.parse(jsonMatch[0])
    
    // Validate the response structure
    if (!Array.isArray(menuItems)) {
      throw new Error('AI response is not an array')
    }

    return menuItems.filter(item => 
      item && 
      typeof item === 'object' && 
      item.name
    )

  } catch (error) {
    console.error('Error analyzing menu with AI:', error)
    throw new Error(`Failed to analyze menu with AI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function searchDishImage(dishName: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  const searchEngineId = process.env.GOOGLE_IMAGE_SEARCH_API_KEY
  
  if (!apiKey || !searchEngineId) {
    throw new Error('Google API credentials (GOOGLE_GEMINI_API_KEY and GOOGLE_IMAGE_SEARCH_API_KEY) not found in environment variables')
  }

  try {
    const searchQuery = `${dishName} food dish restaurant`
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=1&imgSize=medium&safe=active`

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Google Search API request failed with status ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`No images found for dish: "${dishName}"`)
    }
    
    return data.items[0].link
    
  } catch (error) {
    console.error(`Error searching for image of "${dishName}":`, error)
    throw new Error(`Failed to search for dish image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}