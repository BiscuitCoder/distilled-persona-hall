import type { Metadata } from 'next'
import { Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

/** 用于 OG / Twitter 等需要绝对地址的 meta；本地为 localhost，线上优先自定义域名 */
function getMetadataBase(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL)
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`)
  }
  return new URL('http://localhost:3000')
}

const siteTitle = '蒸人堂 — AI 名人人格对话'
const siteDescription = '与各路名人、虚构角色直接对话，或让他们围坐圆桌展开讨论'

/** 全站宋体风格：思源宋体 + 系统宋体回退，偏纸面阅读 */
const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-impl',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: '/logo.png',
    apple: [{ url: '/logo.png', type: 'image/png' }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: '蒸人堂',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 500,
        height: 685,
        alt: '蒸人堂',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSerif.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
