// app/a/[id]/route.ts
// This handles short URL redirects like aibyte.co.in/a/abc123

import { redirect } from 'next/navigation'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  try {
    // Read items.json to find the article
    const filePath = path.join(process.cwd(), 'public/data/items.json')
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    
    // Find article with matching share_id
    const article = data.articles.find((item: any) => item.share_id === id)
    
    if (article) {
      // Redirect to the article page on YOUR site
      redirect(`/article/${article.id}`)
    } else {
      // If not found, redirect to home
      console.log(`Share ID not found: ${id}`)
      redirect('/')
    }
  } catch (error) {
    console.error('Error finding article:', error)
    // On error, redirect to home
    redirect('/')
  }
}
