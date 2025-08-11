import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AIByte',
  description: 'Bite-sized AI insights, daily — fast, mobile-first summaries.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container py-4">
          <header className="mb-4">
            <h1 className="text-xl font-semibold">AIByte</h1>
            <p className="text-sm text-gray-500">Bite-sized AI insights, daily</p>
          </header>
          {children}
          <footer className="mt-10 mb-6 text-xs text-gray-500">
            Built fast. Sources: OpenAI, DeepMind, The Verge.
          </footer>
        </div>
      </body>
    </html>
  )
}
