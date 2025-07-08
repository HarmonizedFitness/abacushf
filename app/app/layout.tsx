
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from '@/components/providers/session-provider'
import { RoleBasedRedirect } from '@/components/navigation/role-based-redirect'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Harmonized Fitness - Premium Personal Training Platform',
  description: 'Track your fitness journey, book sessions, and achieve your goals with our comprehensive personal training platform.',
  keywords: ['fitness', 'personal training', 'workout tracking', 'gym', 'health'],
  authors: [{ name: 'Harmonized Fitness' }],
  creator: 'Harmonized Fitness',
  publisher: 'Harmonized Fitness',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://harmonized-fitness.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://harmonized-fitness.vercel.app',
    title: 'Harmonized Fitness - Premium Personal Training Platform',
    description: 'Track your fitness journey, book sessions, and achieve your goals with our comprehensive personal training platform.',
    siteName: 'Harmonized Fitness',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harmonized Fitness - Premium Personal Training Platform',
    description: 'Track your fitness journey, book sessions, and achieve your goals with our comprehensive personal training platform.',
    creator: '@harmonizedfitness',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <RoleBasedRedirect>
              {children}
            </RoleBasedRedirect>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
