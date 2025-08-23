# MenuAI

A stateless web application that helps diners instantly understand restaurant menus using AI-powered analysis. Features a modern, mobile-first design optimized for on-the-go menu scanning.

## Features

- **🖼️ Image Upload**: Intuitive drag-and-drop or file selector for menu photos (JPG, PNG, WEBP)
- **🤖 AI Menu Processing**: Multi-modal AI extracts menu items, prices (including market pricing), and ingredients
- **📱 Mobile-Optimized Display**: Modern card-based menu visualization with horizontal layout for mobile
- **🔍 Smart Filtering**: Collapsible filter system with price range and ingredient search (items without prices automatically included)
- **💬 Conversational AI**: Modal chat interface on mobile, sidebar on desktop for dietary questions
- **✨ Modern Design**: Glass-effect components, gradient styling, and smooth animations
- **📲 Mobile-First**: Responsive design optimized for smartphone usage with touch-friendly interactions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js)
- **AI Integration**: Google Gemini for menu analysis and chat
- **Image Search**: Real-time Image Search on Rapid API

## Getting Started

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root of the project and add your API keys.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `GOOGLE_GEMINI_API_KEY`: Google Gemini API key for menu interpretation and conversation.
- `RAPIDAPI_KEY`: Your RapidAPI key for the Real-time Image Search API.

## Current Implementation Status

This MVP includes:
- ✅ Complete mobile-first frontend with modern UI/UX
- ✅ Responsive image upload with glass-effect styling
- ✅ Horizontal menu cards optimized for mobile viewing with market price support
- ✅ Collapsible filtering system with visual indicators (handles missing prices)
- ✅ Modal chat interface for mobile, sidebar for desktop
- ✅ Backend API structure with TypeScript
- ✅ AI integration with Google Gemini for menu analysis
- ✅ Conversational AI chat with Google Gemini
- ✅ Real-time Image Search on Rapid API for dish images
- ✅ Support for missing prices and price inference patterns

To complete the implementation:
1. Add your API keys to `.env.local`
2. Deploy to your preferred platform (Vercel, AWS, etc.)

## Design Features

- **Modern Aesthetic**: Glass-morphism effects with backdrop blur
- **Mobile-First**: Optimized layouts for smartphone usage
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Visual Hierarchy**: Clean typography with Inter font family
- **Smooth Animations**: Micro-interactions and hover effects
- **Gradient Styling**: Professional blue/slate color scheme

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