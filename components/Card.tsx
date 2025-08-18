'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { trackArticleClick, trackLensSwitch, trackShare } from '@/lib/analytics'

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

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768
      )
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

export default function Card({ item }: { item: any }) {
  const [lens, setLens] = useState<Lens>('simple')
  const [showShareToast, setShowShareToast] = useState(false)
  const isMobile = useIsMobile()
  
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
  
  const handleShare = async () => {
    // Track the share attempt
    trackShare({
      title: item.title,
      source: item.source,
      category: getCategoryDisplayName(item.category),
      url: item.url,
      hype_meter: item.hype_meter,
      lens: lens
    });
    
    // Create share data
    const shareData = {
      title: `${item.title}`,
      text: `${item.speedrun}\n\nCheck it out on AIByte:`,
      url: `https://aibyte.co.in/a/${item.share_id || item.id}` // Short URL format
    };
    
    try {
      if (navigator.share) {
        // Use native share on mobile
        await navigator.share(shareData);
        
        // Show success toast
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      } else {
        // Fallback for browsers that don't support native share
        // Copy to clipboard as fallback
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n${shareData.url}`
        );
        
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    } catch (error) {
      // User cancelled share or error occurred
      console.log('Share cancelled or failed');
    }
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
    <article className="card h-full flex flex-col group relative">
      {/* Share Success Toast */}
      {showShareToast && (
       <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-10 toast-slide-in">
          ✓ Ready to share!
        </div>
      )}
      
      {/* Header section with better spacing */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className={clsx('badge', getBadgeClass(item.category))}>
          {getCategoryDisplayName(item.category)}
        </span>
        <div className="flex items-center gap-2">
          <time className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            {new Date(item.published_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </time>
          
          {/* Mobile-only share button */}
          {isMobile && (
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Share article"
            >
              <svg 
                className="w-4 h-4 text-gray-500 dark:text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.024a3 3 0 004.243 4.243m0 0a3 3 0 10-4.243-4.243m4.243 4.243L12 12"
                />
              </svg>
            </button>
          )}
        </div>
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
