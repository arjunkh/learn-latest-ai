'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/Card'
import Script from 'next/script'

const ARTICLES_PER_PAGE = 9

function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void 
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-700 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Previous
      </button>
      
      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {/* Show first page */}
        {currentPage > 3 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-8 h-8 text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              1
            </button>
            {currentPage > 4 && <span className="px-1">...</span>}
          </>
        )}
        
        {/* Show nearby pages */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => {
            return page === currentPage || 
                   page === currentPage - 1 || 
                   page === currentPage + 1 ||
                   (page === currentPage - 2 && currentPage > 2) ||
                   (page === currentPage + 2 && currentPage < totalPages - 1)
          })
          .map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 text-sm rounded-full transition-colors ${
                page === currentPage
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {page}
            </button>
          ))}
        
        {/* Show last page */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && <span className="px-1">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
      
      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-700 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Next
      </button>
    </div>
  )
}

export default function Page() {
  const [items, setItems] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  
  // Load data on client side
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/items.json')
        const data = await response.json()
        setItems(data.articles || data || [])
      } catch (error) {
        console.error('Error loading items:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  
  // Calculate pagination
  const totalPages = Math.ceil(items.length / ARTICLES_PER_PAGE)
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE
  const endIndex = startIndex + ARTICLES_PER_PAGE
  const currentItems = items.slice(startIndex, endIndex)
  
  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])
  
  // Scroll to top when page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  if (loading) {
    return (
      <main>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </main>
    )
  }
  
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
          
          // Track pagination
          let lastPage = 1;
          setInterval(() => {
            const pageText = document.querySelector('.page-indicator')?.textContent;
            if (pageText) {
              const match = pageText.match(/Page (\\d+)/);
              if (match) {
                const currentPage = parseInt(match[1]);
                if (currentPage !== lastPage) {
                  lastPage = currentPage;
                  if (window.va) {
                    window.va('track', 'page_changed', {
                      page: currentPage,
                      total_pages: ${totalPages}
                    });
                  }
                }
              }
            }
          }, 1000);
          
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
            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            {' • '}
            {items?.length || 0} total insights from the AI frontier
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
        
        {/* Grid layout - now always 3x3 on larger screens */}
        {currentItems?.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Show current page items */}
              {currentItems.map((item: any) => (
                <Card key={item.id} item={item} />
              ))}
              
              {/* Add empty cells if last page has fewer than 9 items (optional for consistent grid) */}
              {currentItems.length < ARTICLES_PER_PAGE && currentPage === totalPages && (
                <>
                  {Array.from({ length: ARTICLES_PER_PAGE - currentItems.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="hidden xl:block"></div>
                  ))}
                </>
              )}
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <PaginationControls 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
            
            {/* Page info at bottom */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Showing {startIndex + 1}-{Math.min(endIndex, items.length)} of {items.length} articles
            </div>
          </>
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
