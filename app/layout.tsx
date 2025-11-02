import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Drug Development Research Explorer',
  description: 'Search and explore drug development research papers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
