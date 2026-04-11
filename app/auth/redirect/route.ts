import { NextRequest, NextResponse } from 'next/server'
import { getPublicSiteUrl } from '@/lib/env/public-site-url'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  
  const baseUrl = getPublicSiteUrl()

  if (code) {
    if (type === 'recovery') {
      return NextResponse.redirect(`${baseUrl}/auth/callback?code=${code}&type=recovery&next=/reset-password`)
    }
    return NextResponse.redirect(`${baseUrl}/auth/callback?code=${code}`)
  }

  return NextResponse.redirect(`${baseUrl}/login`)
}

