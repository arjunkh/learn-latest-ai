// app/a/[id]/route.ts
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  try {
    // Fetch items.json via HTTP (Railway can't read files in route handlers)
    const host = request.headers.get('host') || 'www.aibyte.co.in'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const response = await fetch(`${protocol}://${host}/data/items.json`)
    const data = await response.json()
    
    // Find article with matching share_id
    const article = data.articles.find((item: any) => item.share_id === id)
    
    if (article) {
      redirect(`/article/${article.id}`)
    } else {
      console.log(`Share ID not found: ${id}`)
      redirect('/')
    }
  } catch (error) {
    console.error('Error:', error)
    redirect('/')
  }
}
