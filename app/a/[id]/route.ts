// app/a/[id]/route.ts - REPLACE ENTIRE FILE WITH THIS
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  try {
    const host = request.headers.get('host') || 'www.aibyte.co.in'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const response = await fetch(`${protocol}://${host}/data/items.json`, {
      cache: 'no-store'
    })
    
    const data = await response.json()
    
    // Find article with matching share_id
    const article = data.articles?.find((item: any) => item.share_id === id)
    
    if (article) {
      redirect(`/article/${article.id}`)
    } else {
      console.log(`Share ID not found: ${id}`)
      redirect('/')
    }
  } catch (error: any) {
    // Don't catch NEXT_REDIRECT - let it through!
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    // Only catch real errors
    console.error('Error in share redirect:', error)
    redirect('/')
  }
}
