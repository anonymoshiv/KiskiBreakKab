'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-16 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-16 h-8 rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 hover:scale-105"
      style={{
        backgroundColor: isDark ? '#334155' : '#e2e8f0',
        boxShadow: isDark 
          ? '0 4px 14px 0 rgba(59, 130, 246, 0.3)'
          : '0 4px 14px 0 rgba(251, 191, 36, 0.3)'
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div 
          className="absolute inset-0 transition-all duration-500 ease-in-out"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)'
              : 'linear-gradient(135deg, #60a5fa 0%, #fbbf24 100%)',
            opacity: isDark ? 0.4 : 0.5
          }}
        />
      </div>

      {/* Sliding toggle circle with smooth spring animation */}
      <div
        className="absolute top-0.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          left: isDark ? 'calc(100% - 30px)' : '2px'
        }}
      >
        <div 
          className="w-7 h-7 rounded-full shadow-lg flex items-center justify-center transition-all duration-500"
          style={{
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            boxShadow: isDark
              ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
          }}
        >
          <div className="transform transition-all duration-500 ease-in-out" style={{
            transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-30deg) scale(1)'
          }}>
            {isDark ? (
              <Moon className="h-4 w-4 text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
            )}
          </div>
        </div>
      </div>

      {/* Background indicator icons with improved visibility */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <div className="transition-all duration-500" style={{
          opacity: isDark ? 0.25 : 0.7,
          transform: isDark ? 'scale(0.8)' : 'scale(1)'
        }}>
          <Sun 
            className="h-3.5 w-3.5 drop-shadow-sm" 
            style={{
              color: isDark ? '#64748b' : '#f59e0b',
              filter: isDark ? 'none' : 'drop-shadow(0 0 2px rgba(245, 158, 11, 0.5))'
            }}
          />
        </div>
        <div className="transition-all duration-500" style={{
          opacity: isDark ? 0.7 : 0.25,
          transform: isDark ? 'scale(1)' : 'scale(0.8)'
        }}>
          <Moon 
            className="h-3.5 w-3.5 drop-shadow-sm" 
            style={{
              color: isDark ? '#60a5fa' : '#64748b',
              filter: isDark ? 'drop-shadow(0 0 2px rgba(96, 165, 250, 0.5))' : 'none'
            }}
          />
        </div>
      </div>
    </button>
  )
}
