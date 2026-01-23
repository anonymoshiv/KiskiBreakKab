'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-[#F63049] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is logged in, don't show homepage (redirect is happening)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-f63049 dark:bg-black">
      {/* Header */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#F63049] flex items-center justify-center">
              <span className="text-white text-base sm:text-lg font-bold">K</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-black dark:text-white">
              KiskiBreakKab
            </h1>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline-block">
              <Button variant="outline" size="sm" className="font-semibold border-2 border-black dark:border-white hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-black transition-colors">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-[#F63049] text-white 
              border-2 border-[#F63049]
              dark:border-[#F63049]
              dark:hover:border-white
              hover:bg-white hover:text-[#F63049] font-medium text-xs sm:text-sm px-3 sm:px-4 transition-colors">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        {/* <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#F63049]/10 border border-[#F63049]/30">
          <span className="text-xs sm:text-sm font-semibold text-[#F63049]">
            ✨ Find Free Friends Instantly
          </span>
        </div> */}
        
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black dark:text-white mb-4 sm:mb-6 leading-tight px-2">
          Never Miss a<br />
          <span className="text-[#F63049]">
            Break Together
          </span>
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl text-black dark:text-white max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
          Know exactly which friends are free during lecture breaks. Set your timetable once, and let <b className="text-[#F63049]">KiskiBreakKab</b> do the rest.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 md:mb-20 px-4">
          <Link href="/register">
            <Button size="lg" className="px-8 py-6 text-base font-semibold bg-[#F63049] text-white hover:bg-white hover:text-[#F63049] border-2 border-[#F63049] dark:border-[#F63049] dark:hover:border-white transition-colors">
              Get Started →
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-8 py-6 text-base font-semibold border-2 border-black dark:border-white hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white transition-colors">
              Login
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="p-8 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out hover:scale-[1.03] shadow-md hover:shadow-[0_0_15px_rgba(246,48,73,0.65)]">
            <div className="w-14 h-14 rounded-lg bg-[#F63049]/10 flex items-center justify-center mb-6">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-[#F63049] mb-3">Real-Time Updates</h3>
            <p className="text-black dark:text-white leading-relaxed">
              See who's free right now. Updates automatically based on everyone's timetable.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out hover:scale-[1.03] shadow-md hover:shadow-[0_0_15px_rgba(246,48,73,0.65)]">
            <div className="w-14 h-14 rounded-lg bg-[#F63049]/10 flex items-center justify-center mb-6">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-[#F63049] mb-3">Smart Groups</h3>
            <p className="text-black dark:text-white leading-relaxed">
              Create groups and instantly see which members are available for hangouts.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out hover:scale-[1.03] shadow-md hover:shadow-[0_0_15px_rgba(246,48,73,0.65)]">
            <div className="w-14 h-14 rounded-lg bg-[#F63049]/10 flex items-center justify-center mb-6">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-[#F63049] mb-3">Set & Forget</h3>
            <p className="text-black dark:text-white leading-relaxed">
              Set your timetable once. We'll automatically match your breaks with friends.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Made for college students who value their break time ❤️
          </p>
        </div>
      </div>
    </div>
  )
}
