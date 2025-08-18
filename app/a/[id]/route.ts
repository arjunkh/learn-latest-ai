// app/a/[id]/route.ts
// This handles short URL redirects like aibyte.co.in/a/gpt5

import { redirect } from 'next/navigation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  // For now, just redirect to home
  // Later, you'll map these to actual articles
  redirect('/')
}
