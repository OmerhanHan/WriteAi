import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'WriteAI — İngilizce Yazı Sınavı Hazırlık',
  description: 'AI destekli İngilizce yazı pratiği ve sınav hazırlık uygulaması. IELTS/TOEFL için akıllı geribildirim alın.',
  keywords: 'IELTS, TOEFL, İngilizce yazı, sınav hazırlık, AI feedback',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
