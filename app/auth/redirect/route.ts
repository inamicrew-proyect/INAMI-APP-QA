import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000'
  
  // Si hay código, redirigir al callback de producción
  if (code) {
    if (type === 'recovery') {
      return NextResponse.redirect(`${productionUrl}/auth/callback?code=${code}&type=recovery&next=/reset-password`)
    } else {
      return NextResponse.redirect(`${productionUrl}/auth/callback?code=${code}`)
    }
  }
  
  // Si no hay código, redirigir al login
  return NextResponse.redirect(`${productionUrl}/login`)
}

