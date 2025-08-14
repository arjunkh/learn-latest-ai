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
        <Script
  src="https://www.googletagmanager.com/gtag/js?id=G-EESKG35GJD"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-EESKG35GJD');
  `}
</Script>        
        <div className="container">
          {/* Header with special background treatment */}
          <header className="header-zone text-center">
            {/* Logo with more breathing room */}
            <div className="mb-4">
              {/* Mobile logo (32px) - shows on small screens */}
              <Image
                src="/images/logo-32.svg"
                alt="AIByte Logo"
                width={32}
                height={32}
                className="sm:hidden mx-auto"
                priority
              />
              
              {/* Desktop logo (48px) - larger for desktop */}
              <Image
                src="/images/logo-40.svg"
                alt="AIByte Logo"
                width={48}
                height={48}
                className="hidden sm:block mx-auto"
                priority
              />
            </div>
            
            {/* Product name - better typography */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              AIByte
            </h1>
            
            {/* Tagline - more subtle */}
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
              Bite-sized AI insights, daily
            </p>
          </header>
          
          {/* Main content area */}
          <div className="animate-fade-in">
            {children}
          </div>
          
          {/* Redesigned footer */}
          <footer className="mt-16 mb-8">
            <div className="footer-card max-w-2xl mx-auto">
              {/* Version badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                AIByte v0.1 - Live Preview
              </div>
              
              {/* Main message - cleaner structure */}
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready for the full experience?
              </h3>
              
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-lg mx-auto">
                If this daily digest helped you stay current, imagine what we could build together — 
                personalized feeds, deeper insights, AI tool recommendations, and community discussions.
              </p>
              
              {/* Features preview */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                  🎯 Personalized
                </span>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                  🚀 Real-time
                </span>
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">
                  💬 Community
                </span>
              </div>
              
              {/* CTA Section */}
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  We're building with you, not just for you
                </p>
                
                <a 
                  href="https://airtable.com/appkDsWtxghcCVm83/pagsVdQKVnZwe5YB8/form"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-button"
                >
                  Join the Journey →
                </a>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                  Built for curious minds • Don't miss the AI revolution
                </p>
              </div>
            </div>
          </footer>
        </div>
        
        {/* Vercel Analytics - UNCHANGED */}
        <Analytics />
      </body>
    </html>
  )
}
