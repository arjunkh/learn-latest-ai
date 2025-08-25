// components/PatternHeroBanner.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Pattern {
  headline: string
  article_count: number
  week_start: string
  week_end: string
  generated_at: string
}

// Format date range nicely
function formatWeekRange(weekStart: string, weekEnd: string) {
  try {
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
    
    return `${startStr} - ${endStr}`
  } catch {
    return 'This Week'
  }
}

export default function PatternHeroBanner() {
  const [pattern, setPattern] = useState<Pattern | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Load pattern data
  useEffect(() => {
    async function loadPattern() {
      try {
        const response = await fetch('/data/pattern-latest.json')
        if (!response.ok) throw new Error('Pattern not found')
        
        const data = await response.json()
        setPattern(data)
      } catch (error) {
        console.error('Error loading pattern:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    
    loadPattern()
  }, [])

  // Don't render if loading, error, or no pattern
  if (loading || error || !pattern) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Main banner content */}
      <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header row with logo and week indicator */}
        <div className="flex items-center justify-between mb-8">
          {/* AIByte Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-40.svg"
              alt="AIByte Logo"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
            <span className="text-xl font-bold">AIByte</span>
          </div>
          
          {/* Week indicator */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div 
                    key={i} 
                    className={`w-1 rounded-full ${
                      i <= 3 ? 'bg-red-400 h-6' : 
                      i === 4 ? 'bg-yellow-400 h-4' : 
                      'bg-green-400 h-2'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-gray-300">
                Week {formatWeekRange(pattern.week_start, pattern.week_end)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Main content - CLICKABLE */}
        <Link href="/pattern/latest" className="block">
          <div className="text-center max-w-4xl mx-auto cursor-pointer group">
            {/* Pattern indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 group-hover:bg-white/15 transition-all duration-200">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              The Pattern • This Week
            </div>
            
            {/* Main headline - from pattern data */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white group-hover:text-gray-100 transition-colors duration-200">
              {pattern.headline}
            </h1>
            
            {/* Subtitle with dynamic article count */}
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed group-hover:text-gray-200 transition-colors duration-200">
              <span className="font-semibold text-indigo-400">{pattern.article_count}</span> AI stories revealed something everyone missed this week...
            </p>
            
            {/* Stats and CTA */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    {pattern.article_count}
                  </div>
                  <div className="text-gray-400">Articles</div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">1</div>
                  <div className="text-gray-400">Pattern</div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">3</div>
                  <div className="text-gray-400">Min Read</div>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center gap-2 group-hover:scale-105">
                Read the Diagnosis
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            {/* Visual connection to articles below */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                <span>From today's intelligence</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Bottom fade to connect to articles */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900"></div>
    </div>
  )
}
