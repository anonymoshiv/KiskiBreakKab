'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-base sm:text-lg font-bold">K</span>
            </div>
            <h1 className="text-base sm:text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              KiskiBreakKab
            </h1>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm" className="rounded-full font-medium">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 font-medium text-xs sm:text-sm px-3 sm:px-4">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800">
          <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ✨ Find Free Friends Instantly
          </span>
        </div>
        
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight px-2">
          Never Miss a<br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Break Together
          </span>
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
          Know exactly which friends are free during lecture breaks. Set your timetable once, and let KiskiBreakKab do the rest.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 md:mb-20 px-4">
          <Link href="/register">
            <Button size="lg" className="rounded-full px-8 py-6 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105">
              Start for Free →
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-base font-bold border-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Real-Time Updates</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              See who's free right now. Updates automatically based on everyone's timetable.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Smart Groups</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Create groups and instantly see which members are available for hangouts.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 hover:scale-105 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/50 transition-all">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Set & Forget</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Set your timetable once. We'll automatically match your breaks with friends.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Made for college students who value their break time 💙
          </p>
        </div>
      </div>
    </div>
  )
}
