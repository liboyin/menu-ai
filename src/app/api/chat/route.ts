import { NextRequest, NextResponse } from 'next/server'
import { ProcessedMenu } from '@/types/menu'

export async function POST(request: NextRequest) {
  try {
    const { message, menu }: { message: string; menu: ProcessedMenu } = await request.json()
    
    if (!message || !menu) {
      return NextResponse.json(
        { error: 'Message and menu are required' },
        { status: 400 }
      )
    }

    const response = await generateChatResponse(message, menu)
    
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

async function generateChatResponse(message: string, menu: ProcessedMenu): Promise<string> {
  const lowerMessage = message.toLowerCase()
  const menuItems = menu.items

  if (lowerMessage.includes('vegan') || lowerMessage.includes('plant-based')) {
    const veganItems = menuItems.filter(item => 
      !item.ingredients.some(ingredient => 
        ['beef', 'chicken', 'pork', 'fish', 'cheese', 'milk', 'egg', 'butter', 'cream'].some(animal => 
          ingredient.toLowerCase().includes(animal)
        )
      )
    )
    
    if (veganItems.length === 0) {
      return "I don't see any clearly vegan options on this menu. You might want to ask the restaurant about ingredients and preparation methods."
    }
    
    return `Here are the likely vegan options I found:\n\n${veganItems.map(item => 
      `• **${item.name}** (${item.price}) - Contains: ${item.ingredients.join(', ')}`
    ).join('\n')}\n\nNote: Please verify with the restaurant as ingredients may vary and dishes might be prepared with animal products.`
  }

  if (lowerMessage.includes('gluten-free') || lowerMessage.includes('gluten free')) {
    const glutenFreeItems = menuItems.filter(item => 
      !item.ingredients.some(ingredient => 
        ['wheat', 'bread', 'pasta', 'flour', 'noodles', 'dough'].some(gluten => 
          ingredient.toLowerCase().includes(gluten)
        )
      )
    )
    
    if (glutenFreeItems.length === 0) {
      return "I don't see any clearly gluten-free options on this menu. Please check with the restaurant about gluten-free preparations."
    }
    
    return `Here are the likely gluten-free options:\n\n${glutenFreeItems.map(item => 
      `• **${item.name}** (${item.price}) - Contains: ${item.ingredients.join(', ')}`
    ).join('\n')}\n\nNote: Please verify with the restaurant about cross-contamination and preparation methods.`
  }

  if (lowerMessage.includes('nut') || lowerMessage.includes('allerg')) {
    const nutFreeItems = menuItems.filter(item => 
      !item.ingredients.some(ingredient => 
        ['nut', 'almond', 'peanut', 'walnut', 'pecan', 'cashew', 'pistachio'].some(nut => 
          ingredient.toLowerCase().includes(nut)
        )
      )
    )
    
    return `Here are dishes that don't appear to contain nuts:\n\n${nutFreeItems.map(item => 
      `• **${item.name}** (${item.price})`
    ).join('\n')}\n\nImportant: Always inform the restaurant about allergies as ingredients can vary and cross-contamination may occur.`
  }

  const searchTerms = message.toLowerCase().split(' ').filter(word => word.length > 2)
  const matchingItems = menuItems.filter(item => 
    searchTerms.some(term => 
      item.name.toLowerCase().includes(term) || 
      item.ingredients.some(ingredient => ingredient.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))
    )
  )

  if (matchingItems.length > 0) {
    return `Here's what I found related to "${message}":\n\n${matchingItems.map(item => 
      `• **${item.name}** (${item.price})\n  Ingredients: ${item.ingredients.join(', ')}${item.description ? `\n  Description: ${item.description}` : ''}`
    ).join('\n\n')}`
  }

  return `I can help you find specific dishes or dietary options on this menu. Try asking about:\n• Dietary restrictions (vegan, gluten-free, nut allergies)\n• Specific ingredients (chicken, vegetables, etc.)\n• Types of dishes (salads, burgers, etc.)\n\nWhat would you like to know about?`
}