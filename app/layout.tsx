import type { Metadata } from 'next'
import { IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'TRANSDISCIPLINARY_SYSTEMS // POST-COMPUTATION',
  description: 'Experimental portfolio exploring cybernetics, systems theory, and post-computational practices',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} font-mono antialiased scanlines crt-flicker`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
