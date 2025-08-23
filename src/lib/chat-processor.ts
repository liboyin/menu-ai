
import { ProcessedMenu } from '@/types/menu';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateChatResponse(message: string, menu: ProcessedMenu): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not found in environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chatPrompt = `
      You are a helpful restaurant menu assistant. Your knowledge is strictly limited to the provided menu.
      The user is asking: "${message}"
      
      Here is the menu information in JSON format:
      ${JSON.stringify(menu.items, null, 2)}

      Based *only* on the menu provided, answer the user's question.
      - If the user asks for recommendations, you can provide them based on the menu items.
      - If the user asks a question that cannot be answered from the menu, say "I'm sorry, I can only answer questions about the items on this menu."
      - Be friendly and conversational.
      - Do not mention that you are an AI or that you are working from a JSON object.
      - Keep your answers concise and to the point.
      - Format your response in a clear and readable way. Use markdown for lists, bolding, etc. where appropriate.
    `;

    const result = await model.generateContent(chatPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating chat response with AI:', error);
    throw new Error(`Failed to generate chat response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
