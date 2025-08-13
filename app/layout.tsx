import './globals.css'
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'AIByte',
  description: 'Bite-sized AI insights, daily — fast, mobile-first summaries.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container py-4">
          <header className="mb-4 text-center">
            {/* Logo at the top - responsive sizing */}
            <div className="mb-3">
              {/* Mobile logo (32px) - shows on small screens */}
              <Image
                src="/images/logo-32.svg"
                alt="AIByte Logo"
                width={32}
                height={32}
                className="sm:hidden mx-auto"
                priority
              />
              
              {/* Desktop logo (40px) - shows on larger screens */}
              <Image
                src="/images/logo-40.svg"
                alt="AIByte Logo"
                width={40}
                height={40}
                className="hidden sm:block mx-auto"
                priority
              />
            </div>
            
            {/* Product name */}
            <h1 className="text-xl font-semibold">AIByte</h1>
            
            {/* Tagline */}
            <p className="text-sm text-gray-500">Bite-sized AI insights, daily</p>
          </header>
          
          {children}
          
          {/* Footer with signup section */}
          <footer className="mt-10 mb-6">
            <div className="card text-center">
              <h3 className="text-lg font-semibold mb-2">📍 You just experienced AIByte v0.1</h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                If this daily AI digest helped you stay current, we want to build something bigger. 
                Think personalized feeds, deeper insights, AI tool recommendations, and community discussions.
              </p>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                This was our trailer. Want us to build the full product?
              </p>
              
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                We're building AIByte with you, not just for you.
              </p>
              
              <a 
                href="https://airtable.com/appkDsWtxghcCVm83/pagsVdQKVnZwe5YB8/form"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Join the Journey
              </a>
              
              <p className="text-xs text-gray-500 mt-3">
                Built for curious minds. Don't miss the AI revolution - hop on!
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
