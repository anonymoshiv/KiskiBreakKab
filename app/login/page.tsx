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
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, sendPasswordResetEmail } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    uid: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetUid, setResetUid] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [resetError, setResetError] = useState('')

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newErrors: Record<string, string> = {}
    if (!formData.uid) newErrors.uid = 'College UID is required'
    if (!formData.password) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // Set persistence to LOCAL before signing in (ensures user stays logged in)
      await setPersistence(auth, browserLocalPersistence)
      
      // Find user by UID in Firestore
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('uid', '==', formData.uid.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setErrors({ form: 'No account found with this UID. Please check your UID or register.' })
        setIsLoading(false)
        return
      }

      // Get the user's email
      const userDoc = querySnapshot.docs[0]
      const userEmail = userDoc.data().email

      // Sign in with email and password
      await signInWithEmailAndPassword(auth, userEmail, formData.password)

      toast.success('Login successful!')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle Firebase errors
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors({ form: 'Incorrect password. Please try again.' })
      } else if (error.code === 'auth/user-not-found') {
        setErrors({ form: 'No account found. Please register first.' })
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({ form: 'Too many failed attempts. Please try again later.' })
      } else {
        setErrors({ form: 'Login failed. Please try again.' })
      }
      setErrors({ form: 'Login failed. Please check your credentials.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setIsResetting(true)
    setResetError('')

    try {
      let email = resetEmail

      // If UID is provided instead of email, look up the email
      if (resetUid && !resetEmail) {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('uid', '==', resetUid.toLowerCase()))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          setResetError('No account found with this UID')
          setIsResetting(false)
          return
        }

        email = querySnapshot.docs[0].data().email
      }

      if (!email) {
        setResetError('Please enter your email or UID')
        setIsResetting(false)
        return
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Check your inbox.')
      setShowResetDialog(false)
      setResetEmail('')
      setResetUid('')
    } catch (error: any) {
      console.error('Password reset error:', error)
      if (error.code === 'auth/user-not-found') {
        setResetError('No account found with this email')
      } else if (error.code === 'auth/invalid-email') {
        setResetError('Invalid email address')
      } else {
        setResetError('Failed to send reset email. Please try again.')
      }
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-[#F63049] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="relative z-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-2xl">
              <span className="text-[#F63049] text-4xl font-black">K</span>
            </div>
            <h1 className="text-5xl font-black text-white">KiskiBreakKab</h1>
            <p className="text-xl text-blue-100 max-w-md">Find your free friends during lecture breaks and never miss a hangout opportunity</p>
            <div className="flex gap-8 justify-center pt-8">
              <div className="text-center">
                <div className="text-4xl font-black text-white">100+</div>
                <div className="text-blue-200 text-sm">Students</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white">50+</div>
                <div className="text-blue-200 text-sm">Groups</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center items-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Logo for mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="absolute top-6 right-6">
                <ThemeToggle />
              </div>
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#F63049] flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">K</span>
                </div>
                <h1 className="text-2xl font-black text-[#F63049]">
                  KiskiBreakKab
                </h1>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-black dark:text-white">Welcome back</h2>
              <p className="text-gray-600 dark:text-gray-400">Enter your credentials to access your account</p>
            </div>
            {/* Form */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* College UID */}
                <div className="space-y-2">
                  <Label htmlFor="uid" className="text-sm font-semibold text-gray-700 dark:text-gray-300">College UID</Label>
                  <Input
                    id="uid"
                    placeholder="e.g., 23bcs12345"
                    value={formData.uid}
                    onChange={e => handleChange('uid', e.target.value.toLowerCase())}
                    className={`h-12 rounded-xl border-2 ${errors.uid ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-[#F63049]'}`}
                  />
                  {errors.uid && <p className="text-sm text-red-500 font-medium">{errors.uid}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      className={`h-12 rounded-xl border-2 pr-12 ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-[#F63049]'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password}</p>}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowResetDialog(true)}
                    className="text-sm font-semibold text-[#F63049] hover:text-[#d42a3f] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {errors.form && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">{errors.form}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 rounded-xl bg-[#F63049] hover:bg-[#d42a3f] text-white font-bold text-base shadow-lg transition-all duration-300"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
              <Link href="/register" className="font-bold text-[#F63049] hover:text-[#d42a3f]">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#F63049]">Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email or college UID to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-uid" className="text-sm font-semibold">College UID</Label>
              <Input
                id="reset-uid"
                placeholder="e.g., 23bcs12345"
                value={resetUid}
                onChange={(e) => {
                  setResetUid(e.target.value.toLowerCase())
                  setResetError('')
                }}
                className="h-11 rounded-xl border-2"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-semibold">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your.email@example.com"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value)
                  setResetError('')
                }}
                className="h-11 rounded-xl border-2"
              />
            </div>
            {resetError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{resetError}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowResetDialog(false)
                setResetEmail('')
                setResetUid('')
                setResetError('')
              }}
              disabled={isResetting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting || (!resetEmail && !resetUid)}
              className="rounded-xl bg-[#F63049] hover:bg-[#d42a3f] text-white"
            >
              {isResetting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
