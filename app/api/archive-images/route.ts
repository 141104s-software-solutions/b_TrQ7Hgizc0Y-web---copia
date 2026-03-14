import { NextResponse } from 'next/server'

// Wikimedia Commons categories for experimental/technical imagery
const CATEGORIES = [
  'NASA_images',
  'Computer_graphics',
  'Diagrams',
  'Technical_drawings',
  'Scientific_illustrations',
  'Vintage_photographs',
  'Black-and-white_photographs',
  'Cybernetics',
  'Systems_diagrams',
  'Circuit_diagrams',
  'Historical_images',
  'Space_exploration',
  'Astronomy',
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const count = parseInt(searchParams.get('count') || '12')
  
  try {
    // Use Wikimedia Commons API for random images
    // Query for random files from various categories
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=random&grnnamespace=6&grnlimit=${count}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json&origin=*`
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error('Wikimedia API failed')
    }
    
    const data = await response.json()
    const pages = data.query?.pages || {}
    
    const images = Object.values(pages)
      .filter((page: unknown) => {
        const p = page as { imageinfo?: Array<{ url: string }> }
        return p.imageinfo?.[0]?.url && 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(p.imageinfo[0].url)
      })
      .map((page: unknown) => {
        const p = page as { 
          title: string
          pageid: number
          imageinfo: Array<{ 
            url: string
            thumburl?: string
            extmetadata?: {
              ImageDescription?: { value: string }
              Artist?: { value: string }
              DateTimeOriginal?: { value: string }
            }
          }> 
        }
        const info = p.imageinfo[0]
        const meta = info.extmetadata || {}
        
        return {
          url: info.thumburl || info.url,
          fullUrl: info.url,
          title: p.title.replace('File:', '').replace(/_/g, ' '),
          identifier: String(p.pageid),
          description: meta.ImageDescription?.value?.replace(/<[^>]*>/g, '') || '',
          artist: meta.Artist?.value?.replace(/<[^>]*>/g, '') || 'Unknown',
          date: meta.DateTimeOriginal?.value || '',
        }
      })
    
    return NextResponse.json({ 
      images,
      category: randomCategory,
      total: images.length
    })
    
  } catch (error) {
    console.error('Wikimedia API error:', error)
    
    // Fallback: use picsum for reliable random images
    const fallbackImages = Array.from({ length: count }, (_, i) => ({
      url: `https://picsum.photos/seed/${Date.now() + i}/600/450`,
      fullUrl: `https://picsum.photos/seed/${Date.now() + i}/1200/900`,
      title: `Random Image ${i + 1}`,
      identifier: `picsum_${Date.now() + i}`,
      description: 'Random photograph from Lorem Picsum',
      artist: 'Various',
      date: new Date().toISOString().split('T')[0],
    }))
    
    return NextResponse.json({ 
      images: fallbackImages,
      category: 'random',
      total: fallbackImages.length,
      fallback: true
    })
  }
}
