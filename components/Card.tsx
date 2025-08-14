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

// Visual hype meter component
function HypeMeter({ value }: { value: number }) {
  return (
    <div className="hype-meter">
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Hype</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={clsx('hype-dot', i <= value ? 'hype-dot-filled' : 'hype-dot-empty')}
        />
      ))}
    </div>
  )
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
  
  // Get badge class based on category
  const getBadgeClass = (category: string) => {
    switch(category) {
      case 'capabilities_and_how':
        return 'badge-breakthrough'
      case 'in_action_real_world':
        return 'badge-action'
      case 'trends_risks_outlook':
        return 'badge-insights'
      default:
        return 'badge'
    }
  }
  
  return (
    <article className="card h-full flex flex-col group">
      {/* Header section with better spacing */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className={clsx('badge', getBadgeClass(item.category))}>
          {getCategoryDisplayName(item.category)}
        </span>
        <time className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          {new Date(item.published_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </time>
      </div>
      
      {/* Title with better typography */}
      <h2 className="text-lg md:text-xl lg:text-[22px] font-semibold leading-tight mb-3 text-gray-900 dark:text-white">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noreferrer"
          onClick={handleArticleClick}
          className="article-link"
        >
          {item.title}
        </a>
      </h2>
      
      {/* Speedrun with better contrast */}
      <p className="text-sm md:text-[15px] text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
        {item.speedrun}
      </p>
      
      {/* Why it matters - improved styling */}
      <ul className="bullet-list text-sm list-disc pl-5 mb-4 flex-grow">
        {item.why_it_matters?.map((b:string, i:number) => (
          <li key={i} className="text-gray-600 dark:text-gray-400">
            {b}
          </li>
        ))}
      </ul>

      {/* Lens selector - pill shaped buttons */}
      <div className="flex gap-2 mb-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        {(['simple','pm','engineer'] as Lens[]).map((l)=>(
          <button 
            key={l} 
            onClick={()=>handleLensChange(l)}
            className={clsx(
              'btn',
              lens === l && 'btn-active'
            )}
          >
            {l === 'simple' ? 'Simple' : l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Lens content with better typography */}
      <p className="text-sm md:text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        {item.lenses?.[lens] || item.lenses?.['eli12']}
      </p>

      {/* Footer with source and hype meter */}
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {item.source}
        </span>
        <HypeMeter value={item.hype_meter ?? 3} />
      </div>
    </article>
  )
}
