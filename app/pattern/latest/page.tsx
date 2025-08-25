// app/pattern/latest/page.tsx
import fs from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SimpleHeader from '@/components/SimpleHeader'

// Get the latest pattern
async function getLatestPattern() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'pattern-latest.json')
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error loading pattern:', error)
    return null
  }
}

// Format date nicely
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
      day: 'numeric',
      year: 'numeric'
    })
    
    return `${startStr} - ${endStr}`
  } catch {
    return 'This Week'
  }
}

export default async function PatternLatestPage() {
  const pattern = await getLatestPattern()
  
  if (!pattern || pattern.error) {
    notFound()
  }
  
  return (
    <main className="max-w-4xl mx-auto">
      {/* Add header for pattern page */}
      <SimpleHeader />
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all articles
        </Link>
      </div>
      
      {/* Pattern Article */}
      <article className="card mb-8">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-4">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            The Pattern
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {pattern.headline}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6">
            {formatWeekRange(pattern.week_start, pattern.week_end)}
          </p>
        </div>

        {/* 💡 The Hidden Signal */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            💡 The Hidden Signal
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            {pattern.hook}
          </p>
        </section>

        {/* 🔎 The Big Story */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            🔎 The Big Story
          </h2>
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            {pattern.story}
          </div>
        </section>

        {/* ⚡ How We Got Here */}
        {pattern.timeline && pattern.timeline.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              ⚡ How We Got Here
            </h2>
            <div className="space-y-4">
              {pattern.timeline.map((event: any, index: number) => (
                <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-12 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded">
                      {event.day}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {event.event}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {event.context}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🌀 The Twist */}
        {pattern.twist && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🌀 The Twist
            </h2>
            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 dark:border-amber-500">
              <p className="text-lg text-amber-800 dark:text-amber-200 leading-relaxed italic">
                {pattern.twist}
              </p>
            </div>
          </section>
        )}

        {/* 📈 Who's Up, Who's Down */}
        {(pattern.winners || pattern.losers || pattern.dark_horse) && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              📈 Who's Up, Who's Down
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {pattern.winners && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                    🏆 Winners
                  </h4>
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                    {pattern.winners}
                  </p>
                </div>
              )}
              
              {pattern.losers && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    📉 Struggling
                  </h4>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    {pattern.losers}
                  </p>
                </div>
              )}
              
              {pattern.dark_horse && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    🐴 Dark Horse
                  </h4>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    {pattern.dark_horse}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 🚀 Your Monday Game Plan */}
        {pattern.actions && pattern.actions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🚀 Your Monday Game Plan
            </h2>
            <div className="space-y-3">
              {pattern.actions.map((action: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-blue-800 dark:text-blue-200">
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 👀 What Happens Next */}
        {pattern.prediction && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              👀 What Happens Next
            </h2>
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border-l-4 border-gray-400 dark:border-gray-500">
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                {pattern.prediction}
              </p>
            </div>
          </section>
        )}

        {/* 💬 Quote of the Week */}
        {pattern.quote && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              💬 Quote of the Week
            </h2>
            <blockquote className="text-center">
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 italic leading-relaxed mb-4">
                "{pattern.quote}"
              </p>
              <footer className="text-gray-500 dark:text-gray-400 text-sm">
                — The AIByte Intelligence Team
              </footer>
            </blockquote>
          </section>
        )}

        {/* 📊 Weekly Stats */}
        <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Weekly Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {pattern.week_id}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Week ID</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {pattern.article_count}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Articles Analyzed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatWeekRange(pattern.week_start, pattern.week_end)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Coverage</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Date(pattern.generated_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Generated</div>
            </div>
          </div>
        </section>
      </article>
      
      {/* Navigation */}
      <div className="text-center">
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Explore More AI Stories
        </Link>
      </div>
    </main>
  )
}
