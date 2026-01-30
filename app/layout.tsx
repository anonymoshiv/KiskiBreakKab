import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'KiskiBreakKab - Find Free Friends During College Breaks',
  description: 'Real-time college timetable app to find which friends are free during your lecture breaks. Connect with friends, sync schedules, and never miss a break together!',
  keywords: ['college timetable', 'friend availability', 'schedule sync', 'college breaks', 'free slots', 'student app', 'timetable sharing'],
  authors: [{ name: 'KiskiBreakKab Team' }],
  creator: 'KiskiBreakKab',
  publisher: 'KiskiBreakKab',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KiskiBreakKab',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'KiskiBreakKab',
    title: 'KiskiBreakKab - Find Free Friends During College Breaks',
    description: 'Real-time college timetable app to find which friends are free during your lecture breaks. Never miss hanging out with friends!',
    url: 'https://kiskibreakkab.vercel.app',
    images: [
      {
        url: '/icon-512.svg',
        width: 512,
        height: 512,
        alt: 'KiskiBreakKab Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KiskiBreakKab - Find Free Friends During Breaks',
    description: 'Real-time college timetable app. See which friends are free right now!',
    images: ['/icon-512.svg'],
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
    // Add your Google Search Console verification code here after setup
    // google: 'your-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#F63049" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
