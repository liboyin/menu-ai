import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MenuAI - Understand Any Menu Instantly',
  description: 'Upload a photo of any restaurant menu and get instant understanding with AI-powered analysis, ingredient information, and dietary filtering.',
}

/**
 * Root App Router layout that wraps every page in the base HTML document.
 *
 * Args:
 *   children: The page content rendered inside <body>.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}