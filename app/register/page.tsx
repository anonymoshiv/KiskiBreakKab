'use client'

import React from "react"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Eye, EyeOff } from 'lucide-react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    const newErrors: Record<string, string> = {}
    
    // UID validation (format: 23bcsxxxxx or 23icsxxxxx)
    if (!formData.uid) {
      newErrors.uid = 'College UID is required'
    } else if (!/^23(bcs|ics)\d{5}$/i.test(formData.uid)) {
      newErrors.uid = 'UID must be in format: 23bcsxxxxx or 23icsxxxxx (e.g., 23bcs12345, 23ics12345)'
    }
    
    if (!formData.name) newErrors.name = 'Full Name is required'
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Store user data in Firestore using college UID as document ID
      await setDoc(doc(db, 'users', formData.uid.toLowerCase()), {
        firebaseUid: userCredential.user.uid, // Store Firebase UID for reference
        uid: formData.uid.toLowerCase(),
        name: formData.name,
        email: formData.email,
        createdAt: new Date().toISOString(),
      })

      toast.success('Account created successfully!')
      
      // Clear form and redirect to login page
      setFormData({
        uid: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ form: 'This email is already registered. Please login instead.' })
      } else if (error.code === 'auth/weak-password') {
        setErrors({ form: 'Password is too weak. Please use a stronger password.' })
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ form: 'Invalid email address format.' })
      } else {
        setErrors({ form: 'Registration failed. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="relative z-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-2xl">
              <span className="text-white text-4xl font-black">K</span>
            </div>
            <h1 className="text-5xl font-black text-white">Join KiskiBreakKab</h1>
            <p className="text-xl text-blue-100 max-w-md">Start finding your free friends and make the most of your break time</p>
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-4 text-left bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-4xl">⚡</div>
                <div>
                  <div className="text-white font-bold">Instant Sync</div>
                  <div className="text-blue-200 text-sm">Real-time timetable matching</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-left bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-4xl">👥</div>
                <div>
                  <div className="text-white font-bold">Smart Groups</div>
                  <div className="text-blue-200 text-sm">Organize and find available friends</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md space-y-8">
            {/* Logo for mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="absolute top-6 right-6">
                <ThemeToggle />
              </div>
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white text-xl font-bold">K</span>
                </div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  KiskiBreakKab
                </h1>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Create Account</h2>
              <p className="text-slate-600 dark:text-slate-400">Sign up to start finding your free friends</p>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* College UID */}
                <div className="space-y-2">
                  <Label htmlFor="uid" className="text-sm font-semibold text-slate-700 dark:text-slate-300">College UID</Label>
                  <Input
                    id="uid"
                    placeholder="e.g., 23bcs12345 or 23ics12345"
                    value={formData.uid}
                    onChange={e => handleChange('uid', e.target.value.toLowerCase())}
                    className={`h-12 rounded-xl border-2 ${errors.uid ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                  />
                  {errors.uid && <p className="text-sm text-red-500 font-medium">{errors.uid}</p>}
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className={`h-12 rounded-xl border-2 ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                  />
                  {errors.name && <p className="text-sm text-red-500 font-medium">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className={`h-12 rounded-xl border-2 ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                  />
                  {errors.email && <p className="text-sm text-red-500 font-medium">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password (min 6 characters)"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      className={`h-12 rounded-xl border-2 pr-12 ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={e => handleChange('confirmPassword', e.target.value)}
                      className={`h-12 rounded-xl border-2 pr-12 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500 font-medium">{errors.confirmPassword}</p>}
                </div>

                {errors.form && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">{errors.form}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
                >
                  {isLoading ? 'Creating account...' : 'Register'}
                </Button>
              </form>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-slate-600 dark:text-slate-400">Already have an account? </span>
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
