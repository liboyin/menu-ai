# MenuAI

A stateless web application that helps diners instantly understand restaurant menus using AI-powered analysis.

## Features

- **Image Upload**: Drag-and-drop or file selector for menu photos (JPG, PNG, WEBP)
- **AI Menu Processing**: Multi-modal AI extracts menu items, prices, and ingredients
- **Interactive Display**: Clean card-based menu visualization with dish images
- **Smart Filtering**: Filter by price range and ingredients
- **Conversational AI**: Chat interface for dietary questions and menu queries
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js)
- **AI Integration**: Ready for OpenAI GPT-4 Vision, Google Gemini, or Anthropic Claude
- **Image Search**: Placeholder implementation (ready for Google Custom Search API)

## Getting Started

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for GPT-4 Vision
- `GOOGLE_API_KEY`: Google API key for Gemini and Custom Search
- `GOOGLE_SEARCH_ENGINE_ID`: Custom Search Engine ID for dish images
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude

## Current Implementation Status

This MVP includes:
- ✅ Complete frontend with upload, display, filtering, and chat
- ✅ Backend API structure
- ⚠️ Mock AI responses (replace with real API calls)
- ⚠️ Placeholder dish images (integrate with image search)

To complete the implementation:
1. Add your preferred AI API integration in `src/lib/menu-processor.ts`
2. Implement image search in the same file
3. Deploy to your preferred platform (Vercel, AWS, etc.)

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
├── lib/               # Utility functions
└── types/             # TypeScript type definitions
```

## Deployment

This app is designed for serverless deployment:

- **Vercel**: Deploy with `npm run build` (recommended)
- **AWS Lambda**: Use Serverless Framework or AWS CDK
- **Google Cloud Functions**: Deploy with Firebase or Google Cloud
- **Azure Functions**: Use Azure Static Web Apps

## License

MIT License - see LICENSE file for details