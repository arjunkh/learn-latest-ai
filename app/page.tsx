import Card from '@/components/Card'
import fs from 'fs'
import path from 'path'

async function getItems() {
  try {
    // Always read from filesystem during build/server-side
    const filePath = path.join(process.cwd(), 'public', 'data', 'items.json')
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(fileContent)
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
    <main>
      <Filters />
      <div className="mt-3" id="feed">
        {items?.length ? items.map((it:any)=>(<Card key={it.id} item={it} />)) : <EmptyState />}
      </div>
    </main>
  )
}

function Filters() {
  return (
    <div className="flex flex-wrap gap-2">
      {['AI Capabilities & How','AI in Action','Trends, Risks & Outlook'].map((t)=>(
        <span key={t} className="badge">{t}</span>
      ))}
    </div>
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
