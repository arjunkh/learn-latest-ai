// app/a/[id]/route.ts - REPLACE ENTIRE FILE WITH THIS
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  console.log('=== SHARE REDIRECT DEBUG ===')
  console.log('1. Looking for share_id:', id)
  
  try {
    const host = request.headers.get('host') || 'www.aibyte.co.in'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const url = `${protocol}://${host}/data/items.json`
    console.log('2. Fetching from:', url)
    
    const response = await fetch(url, {
      cache: 'no-store' // Force fresh fetch
    })
    
    if (!response.ok) {
      console.log('3. Fetch failed:', response.status)
      redirect('/')
    }
    
    const data = await response.json()
    console.log('3. Data structure:', Object.keys(data))
    console.log('4. Articles found:', data.articles?.length || 0)
    
    // Log first few share_ids to debug
    if (data.articles && data.articles.length > 0) {
      console.log('5. Sample share_ids:', 
        data.articles.slice(0, 3).map((a: any) => ({
          id: a.id?.substring(0, 8),
          share_id: a.share_id
        }))
      )
    }
    
    // Find article - check both share_id and id (as fallback)
    const article = data.articles?.find((item: any) => {
      const matches = item.share_id === id || item.id === id
      if (item.share_id === id) {
        console.log('6. Found by share_id:', item.id)
      }
      return matches
    })
    
    if (article) {
      console.log('7. Redirecting to:', `/article/${article.id}`)
      redirect(`/article/${article.id}`)
    } else {
      console.log('7. No match found for:', id)
      console.log('8. Redirecting to home')
      redirect('/')
    }
  } catch (error) {
    console.error('ERROR in share redirect:', error)
    redirect('/')
  }
}
