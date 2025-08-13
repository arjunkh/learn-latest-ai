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
        {/* Category filter badges commented out - UNCHANGED */}
        {/* <div className="flex flex-wrap gap-2 mb-3">
          {['AI Capabilities & How','AI in Action','Trends, Risks & Outlook'].map((t)=>(
            <span key={t} className="badge">{t}</span>
          ))}
        </div> */}
        
        {/* MAIN CHANGE: Added responsive grid classes */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6" id="feed">
          {items?.length ? items.map((it:any)=>(<Card key={it.id} item={it} />)) : <EmptyState />}
        </div>
      </main>
    </>
  )
}

function EmptyState() {
  return (
    <div className="card">
      <h2 className="font-semibold mb-2">No stories yet</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">Run the ingestion job to populate today's feed.</p>
    </div>
  )
}
