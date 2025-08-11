import Card from '@/components/Card'

async function getItems() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/items.json`, { next: { revalidate: 60 } })
  try { return await res.json() } catch { return [] }
}

export default async function Page() {
  const items = await getItems()
  const categories = [
    { id: 'capabilities_and_how', label: 'AI Capabilities & How' },
    { id: 'in_action_real_world', label: 'AI in Action' },
    { id: 'trends_risks_outlook', label: 'Trends, Risks & Outlook' }
  ]
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
      <p className="text-sm text-gray-600 dark:text-gray-300">Run the ingestion job to populate today’s feed.</p>
    </div>
  )
}
