// app/article/[id]/page.tsx
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/Card'
import SimpleHeader from '@/components/SimpleHeader'

// Get article by ID (either regular ID or share_id)
async function getArticle(id: string) {
  try {
    // Fetch via HTTP instead of filesystem
    const response = await fetch(`https://www.aibyte.co.in/data/items.json`)
    const data = await response.json()
    
    const article = data.articles.find((item: any) => 
      item.id === id || item.share_id === id
    )
    
    return article
  } catch (error) {
    console.error('Error loading article:', error)
    return null
  }
}

export default async function ArticlePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const article = await getArticle(params.id)
  
  if (!article) {
    notFound()
  }
  
  return (
    <main className="max-w-3xl mx-auto">
      {/* Add header for article page */}
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
      
      {/* Article content in a card */}
      <div className="mb-8">
        <Card item={article} />
      </div>
      
      {/* Additional actions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Article Details</h3>
        
        <div className="space-y-3">
          {/* Source link */}
          <div className="flex items-start gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">Source:</span>
            <a 
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Read original article at {article.source} →
            </a>
          </div>
          
          {/* Published date */}
          <div className="flex items-start gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">Published:</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {new Date(article.published_at).toLocaleDateString('en-US', { 
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          {/* Share URL */}
          {article.share_id && (
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">Share URL:</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                aibyte.co.in/a/{article.share_id}
              </code>
            </div>
          )}
        </div>
      </div>
      
      {/* Related articles section (optional for future) */}
      <div className="mt-8 text-center">
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Explore More Articles
        </Link>
      </div>
    </main>
  )
}
