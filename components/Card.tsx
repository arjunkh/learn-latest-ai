'use client'
import { useState } from 'react'
import clsx from 'clsx'

export type Lens = 'simple' | 'pm' | 'engineer'

// TASK 2: Updated category labels - "Industry Insights" instead of "Trends, Risks & Outlook"
function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'capabilities_and_how':
      return 'Breakthroughs'
    case 'in_action_real_world':
      return 'AI in Action'
    case 'trends_risks_outlook':
      return 'Industry Insights'  // Changed from "Trends, Risks & Outlook"
    default:
      return category.replace(/_/g, ' ')
  }
}

export default function Card({ item }: { item: any }) {
  const [lens, setLens] = useState<Lens>('simple')
  
  return (
    <article className="card mb-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={clsx('badge', {
          'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200': item.category==='capabilities_and_how',
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200': item.category==='in_action_real_world',
          'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200': item.category==='trends_risks_outlook',
        })}>
          {getCategoryDisplayName(item.category)}
        </span>
        <span className="text-xs text-gray-500">{new Date(item.published_at).toLocaleDateString()}</span>
      </div>
      <h2 className="text-base font-semibold mb-1">
        <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{item.speedrun}</p>
      <ul className="text-xs list-disc pl-5 space-y-1 mb-3">
        {item.why_it_matters?.map((b:string, i:number) => (<li key={i}>{b}</li>))}
      </ul>

      <div className="flex gap-2 mb-2">
        {(['simple','pm','engineer'] as Lens[]).map((l)=>(
          <button key={l} onClick={()=>setLens(l)}
            className={clsx('btn', lens===l && 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900')}>
            {l === 'simple' ? 'Simple' : l.toUpperCase()}
          </button>
        ))}
      </div>

      <p className="text-sm">{item.lenses?.[lens] || item.lenses?.['eli12']}</p>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{item.source}</span>
        <span>Hype meter: {item.hype_meter ?? 3}/5</span>
      </div>
    </article>
  )
}
