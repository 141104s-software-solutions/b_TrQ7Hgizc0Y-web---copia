import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { cache: 'no-store' }
    )
    if (!res.ok) throw new Error('API failed')
    const data = await res.json()
    return NextResponse.json({
      price: data.bitcoin?.usd ?? 0,
      change24h: data.bitcoin?.usd_24h_change ?? 0,
    })
  } catch {
    return NextResponse.json({ price: 0, change24h: 0 })
  }
}
