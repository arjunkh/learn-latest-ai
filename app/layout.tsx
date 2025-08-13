import './globals.css'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'AIByte',
  description: 'Bite-sized AI insights, daily — fast, mobile-first summaries.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
      {/* YOUR ANALYTICS SCRIPT - COMPLETELY UNCHANGED */}
      <Script id="analytics-setup" strategy="afterInteractive">
          {`
            // Track signup clicks
            document.addEventListener('click', function(e) {
              const target = e.target;
              if (target.href && target.href.includes('airtable.com')) {
                if (window.va) {
                  window.va('track', 'signup_clicked', {
                    location: 'footer',
                    cta_text: target.textContent,
                    destination: 'airtable_form'
                  });
                }
              }
            });
            
            // Track scroll depth
            let maxScroll = 0;
            document.addEventListener('scroll', function() {
              const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
              if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
                maxScroll = scrollPercent;
                if (window.va) {
                  window.va('track', 'scroll_depth', {
                    depth: scrollPercent,
                    page: window.location.pathname
                  });
                }
              }
            });
          `}
        </Script>
        
        <div className="container py-4 md:py-6 lg:py-8">
          <header className="mb-4 md:mb-6 text-center">
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
            
            {/* Product name - added responsive sizing */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">AIByte</h1>
            
            {/* Tagline - added responsive sizing */}
            <p className="text-sm md:text-base text-gray-500">Bite-sized AI insights, daily</p>
          </header>
          
          {children}
          
          {/* Footer with signup section - added responsive text */}
          <footer className="mt-10 mb-6">
            <div className="card text-center max-w-2xl mx-auto">
              <h3 className="text-lg md:text-xl font-semibold mb-2">📍 You just experienced AIByte v0.1</h3>
              
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3">
                If this daily AI digest helped you stay current, we want to build something bigger. 
                Think personalized feeds, deeper insights, AI tool recommendations, and community discussions.
              </p>
              
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3">
                This was our trailer. Want us to build the full product?
              </p>
              
              <p className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                We're building AIByte with you, not just for you.
              </p>
              
              <a 
                href="https://airtable.com/appkDsWtxghcCVm83/pagsVdQKVnZwe5YB8/form"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 md:px-8 md:py-2.5 rounded-lg text-sm md:text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Join the Journey
              </a>
              
              <p className="text-xs md:text-sm text-gray-500 mt-3">
                Built for curious minds. Don't miss the AI revolution - hop on!
              </p>
            </div>
          </footer>
        </div>
        
        {/* Vercel Analytics - UNCHANGED */}
        <Analytics />
      </body>
    </html>
  )
}
