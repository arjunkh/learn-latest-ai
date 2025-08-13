'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { trackArticleClick, trackLensSwitch } from '@/lib/analytics'

export type Lens = 'simple' | 'pm' | 'engineer'

function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'capabilities_and_how':
      return 'Breakthroughs'
    case 'in_action_real_world':
      return 'AI in Action'
    case 'trends_risks_outlook':
      return 'Industry Insights'
    default:
      return category.replace(/_/g, ' ')
  }
}

export default function Card({ item }: { item: any }) {
  const [lens, setLens] = useState<Lens>('simple')
  
  // YOUR ANALYTICS HANDLERS - UNCHANGED
  const handleArticleClick = () => {
    trackArticleClick({
      title: item.title,
      source: item.source,
      category: getCategoryDisplayName(item.category),
      url: item.url,
      hype_meter: item.hype_meter
    });
  }
  
  const handleLensChange = (newLens: Lens) => {
    setLens(newLens);
    trackLensSwitch(newLens, item.title);
  }
  
  return (
    {/* MINOR CHANGES: Removed mb-3, added h-full and flex flex-col for equal heights in grid */}
    <article className="card h-full flex flex-col">
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
      
      {/* Added responsive text size classes */}
      <h2 className="text-base md:text-lg font-semibold mb-2">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noreferrer"
          onClick={handleArticleClick}
        >
          {item.title}
        </a>
      </h2>
      
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{item.speedrun}</p>
      
      {/* Added flex-grow to push buttons to bottom */}
      <ul className="text-xs list-disc pl-5 space-y-1 mb-3 flex-grow">
        {item.why_it_matters?.map((b:string, i:number) => (<li key={i}>{b}</li>))}
      </ul>

      <div className="flex gap-2 mb-2">
        {(['simple','pm','engineer'] as Lens[]).map((l)=>(
          <button 
            key={l} 
            onClick={()=>handleLensChange(l)}
            className={clsx('btn', lens===l && 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900')}
          >
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
