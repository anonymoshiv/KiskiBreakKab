'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRight, Clock, Users, Calendar, ArrowUpRight } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#F63049] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold font-mono">K</span>
          </div>
          <p className="text-black dark:text-white font-mono uppercase tracking-widest text-sm">Loading System...</p>
        </div>
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white selection:bg-[#F63049] selection:text-white font-sans overflow-x-hidden">
      
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808040_1px,transparent_1px),linear-gradient(to_bottom,#80808040_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b-2 border-black dark:border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F63049] flex items-center justify-center border-2 border-black dark:border-transparent transform hover:rotate-12 transition-transform duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_#404040]">
              <span className="text-white font-black text-xl select-none">K</span>
            </div>
            <span className="font-bold text-2xl tracking-tighter hidden sm:block select-none">
              KiskiBreakKab<span className="text-[#F63049]">.</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-sm">
              <span className="w-2 h-2 bg-green-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">SYSTEM ONLINE</span>
            </div>
            <ThemeToggle />
            <Link href="/login">
              <span className="font-bold hover:text-[#F63049] transition-colors cursor-pointer text-sm tracking-wide">LOGIN</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Main Hero Section */}
          <div className="grid lg:grid-cols-12 gap-12 items-center min-h-[65vh]">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 relative">
              <div className="inline-block border-2 border-black dark:border-white px-4 py-2 bg-white dark:bg-black shadow-[4px_4px_0px_0px_#F63049] transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                  Student Made • For Students
                </span>
              </div>
              
              <h1 className="text-7xl sm:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.85] select-none">
                WHO IS <br/>
                <span className="relative inline-block text-[#F63049]">
                  FREE
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-black dark:text-white fill-current opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5 L 100 0 Q 50 5 0 0 Z" />
                  </svg>
                </span> <br/>
                RN?
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-lg font-medium leading-relaxed border-l-4 border-gray-200 dark:border-zinc-800 pl-6">
                Sync timetables. Find friends. <br/>
                Make every campus break count.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <Link href="/register" className="group">
                  <div className="bg-[#F63049] text-white px-10 py-5 font-black text-lg border-2 border-black dark:border-white flex items-center gap-3 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#404040] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#404040] transition-all active:translate-x-[6px] active:translate-y-[6px] active:shadow-none">
                    GET STARTED <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </div>
                </Link>
                <Link href="/login">
                  <div className="px-10 py-5 font-black text-lg border-2 border-black dark:border-white flex items-center gap-3 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                    LOGIN
                  </div>
                </Link>
              </div>
            </div>

            {/* Right Visual - "The Stack" */}
            <div className="hidden lg:block lg:col-span-5 relative h-[600px] w-full mt-10 lg:mt-0">
               {/* Behind decoration */}
               <div className="absolute right-10 top-10 w-64 h-80 border-4 border-dashed border-gray-300 dark:border-zinc-700 rounded-3xl transform rotate-6"></div>

               {/* Card 1: Status */}
               <div className="absolute right-20 top-20 w-72 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#404040] transform -rotate-3 hover:rotate-0 hover:z-20 hover:scale-105 transition-all duration-300 z-10">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
                    <span className="px-2 py-1 bg-[#F63049] text-white text-xs font-bold font-mono">BUSY</span>
                  </div>
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-700 mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-700"></div>
                  <div className="mt-6 pt-4 border-t-2 border-black/10 dark:border-white/10 flex justify-between text-xs font-mono">
                    <span>@RAHUL</span>
                    <span>LECTURE HALL 4</span>
                  </div>
               </div>

               {/* Card 2: Free */}
               <div className="absolute right-0 top-60 w-80 bg-[#F63049] text-white border-2 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#404040] transform rotate-3 hover:rotate-0 hover:z-20 hover:scale-105 transition-all duration-300 z-20">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-2xl">😎</div>
                    <span className="px-3 py-1 bg-white text-[#F63049] text-xs font-black font-mono border border-black">FREE RN</span>
                  </div>
                  <h3 className="text-2xl font-black mb-1">CHILLING?</h3>
                  <p className="font-medium opacity-90">Simran & 4 others are free right now.</p>
                  
                  <Link href="/register" className="block mt-6 w-full">
                    <button className="w-full py-3 bg-black text-white font-bold text-sm hover:bg-white hover:text-black transition-colors border border-black cursor-pointer">
                      JOIN THEM
                    </button>
                  </Link>
               </div>
            </div>
          </div>

          {/* Features Strip */}
          <div className="mt-32 border-y-2 border-black dark:border-white/20">
            <div className="grid md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black dark:divide-white/20">
              
              <div className="p-10 group hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                <Clock className="w-10 h-10 mb-6 group-hover:text-[#F63049] transition-colors" strokeWidth={1.5} />
                <h3 className="text-2xl font-black mb-3">Unknown Variable? No.</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  Real-time status updates so you never have to text "kahan hai?" again.
                </p>
              </div>

              <div className="p-10 group hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                <Calendar className="w-10 h-10 mb-6 group-hover:text-[#F63049] transition-colors" strokeWidth={1.5} />
                <h3 className="text-2xl font-black mb-3">Sync & Forget.</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  One-time timetable setup. We handle the conflicting slots logic automatically.
                </p>
              </div>

              <div className="p-10 group hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                <Users className="w-10 h-10 mb-6 group-hover:text-[#F63049] transition-colors" strokeWidth={1.5} />
                <h3 className="text-2xl font-black mb-3">Squad Goals.</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  Create groups. See availability heatmaps. Plan that mass bunk (jk... unless?).
                </p>
              </div>

            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 py-20 text-center bg-black dark:bg-zinc-900 text-white relative overflow-hidden rounded-3xl border-2 border-black dark:border-zinc-700">
             <div className="relative z-10">
               <h2 className="text-4xl sm:text-6xl font-black mb-8">READY TO BREAK?</h2>
               <Link href="/register">
                 <button className="bg-[#F63049] text-white px-12 py-4 font-bold text-xl rounded-full hover:scale-105 transition-transform">
                   LAUNCH APP
                 </button>
               </Link>
             </div>
             {/* Abstract BG */}
             <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#fff_20px,#fff_40px)]"></div>
             </div>
          </div>

          {/* Footer */}
          <div className="mt-20 flex flex-col md:flex-row justify-between items-center pt-8 border-t-2 border-black dark:border-white/20">
             <div className="flex items-center gap-2 mb-4 md:mb-0">
               <div className="w-6 h-6 bg-black dark:bg-white"></div>
               <span className="font-bold text-lg">KISKIBREAKKAB</span>
             </div>
             <div className="flex gap-8 text-sm font-bold font-mono">
               <a href="#" className="hover:text-[#F63049] hover:underline decoration-2 underline-offset-4">GITHUB</a>
               <a href="#" className="hover:text-[#F63049] hover:underline decoration-2 underline-offset-4">IG</a>
               <a href="#" className="hover:text-[#F63049] hover:underline decoration-2 underline-offset-4">TWITTER</a>
             </div>
          </div>
          <div className="text-center mt-8 text-xs font-mono text-gray-500 uppercase tracking-widest">
            © 2026 Student Project • v1.0.0
          </div>

        </div>
      </main>
    </div>
  )
}
