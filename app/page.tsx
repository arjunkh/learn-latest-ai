import Card from '@/components/Card'
import fs from 'fs'
import path from 'path'
import Script from 'next/script'

async function getItems() {
  try {
    // Always read from filesystem during build/server-side
    const filePath = path.join(process.cwd(), 'public', 'data', 'items.json')
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(fileContent)
      
      // Handle both old format (array) and new format (object with articles)
      return data.articles || data || []
    }
    
    // Fallback - return empty array if file doesn't exist
    console.log('items.json not found, returning empty array')
    return []
  } catch (error) {
    console.error('Error reading items.json:', error)
    return []
  }
}

export default async function Page() {
  const items = await getItems()
  
  return (
    <>
      {/* YOUR ANALYTICS SCRIPT - UNCHANGED */}
      <Script id="page-analytics" strategy="afterInteractive">
        {`
          // Track feed load
          if (window.va) {
            window.va('track', 'feed_loaded', {
              article_count: ${items?.length || 0},
              timestamp: new Date().toISOString()
            });
          }
          
          // Track time on page
          const startTime = Date.now();
          window.addEventListener('beforeunload', function() {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            if (window.va) {
              window.va('track', 'time_on_feed', {
                seconds: timeSpent,
                articles_available: ${items?.length || 0}
              });
            }
          });
        `}
      </Script>
      
      <main>
        {/* Section header for better hierarchy */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Today's Intelligence
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {items?.length || 0} curated insights from the AI frontier
          </p>
        </div>
        
        {/* Category overview badges */}
        <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-full">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Breakthroughs</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">AI in Action</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Industry Insights</span>
          </div>
        </div>
        
        {/* Grid layout - clean and simple */}
        {items?.length ? (
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
            {/* All items with equal treatment */}
            {items.map((item: any) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </>
  )
}

function EmptyState() {
  return (
    <div className="card text-center py-12">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No stories yet</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Waiting for today's AI intelligence to arrive
      </p>
    </div>
  )
}
