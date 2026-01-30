'use client'

import React from "react"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
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
      // Set persistence to LOCAL before signing in
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

      toast.success('System Access Granted')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors({ form: 'Incorrect password. Access Denied.' })
      } else if (error.code === 'auth/user-not-found') {
        setErrors({ form: 'No account found. Please register first.' })
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({ form: 'Too many failed attempts. Try again later.' })
      } else {
        setErrors({ form: 'Login failed. Check your credentials.' })
      }
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

      await sendPasswordResetEmail(auth, email)
      toast.success('Reset link dispatched to inbox.')
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
        setResetError('Failed to send reset email.')
      }
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] font-sans selection:bg-[#F63049] selection:text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="grid lg:grid-cols-2 min-h-screen relative z-10">
        
        {/* Left Side - Visuals */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-[#F63049] border-r-4 border-black dark:border-white relative overflow-hidden text-white">
           <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#00000010_20px,#00000010_40px)]"></div>
           
           <div className="relative z-10">
             <Link href="/">
               <div className="h-16 w-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  <span className="text-black text-3xl font-black">K</span>
               </div>
             </Link>
           </div>

           <div className="relative z-10 space-y-6">
             <h1 className="text-8xl font-black tracking-tighter leading-[0.85] select-none">
               LOG<br/>IN.
             </h1>
             <p className="text-2xl font-bold font-mono border-l-4 border-black pl-6 py-2 bg-black/10 select-none">
               RESUME BREAKING.
             </p>
           </div>

           <div className="relative z-10 font-mono text-sm font-bold opacity-80 select-none">
             SYSTEM_STATUS: ONLINE<br/>
             ACTIVE_USERS: 100+
           </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col justify-center items-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            
            {/* Mobile Header */}
            <div className="lg:hidden flex justify-between items-center mb-8">
               <Link href="/" className="flex items-center gap-3 cursor-pointer">
                 <div className="h-10 w-10 bg-[#F63049] border-2 border-black flex items-center justify-center">
                    <span className="text-white font-black">K</span>
                 </div>
                 <span className="font-bold text-xl tracking-tighter">Login.</span>
               </Link>
               <ThemeToggle />
            </div>

            <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-8 relative">
              
              <div className="absolute -top-3 -right-3 bg-[#F63049] text-white text-xs font-bold px-3 py-1 border-2 border-black transform rotate-2">
                SECURE ACCESS
              </div>

              <div className="mb-8">
                 <h2 className="text-3xl font-black mb-2 uppercase">Welcome Back</h2>
                 <p className="text-gray-500 font-medium font-mono text-xs">PLEASE IDENTIFY YOURSELF</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="uid" className="font-bold uppercase text-xs tracking-wider">College UID</Label>
                  <Input
                    id="uid"
                    placeholder="23BCS12345"
                    value={formData.uid}
                    onChange={e => handleChange('uid', e.target.value.toLowerCase())}
                    className="h-12 border-2 border-black dark:border-zinc-600 rounded-none focus:ring-0 focus:border-[#F63049] transition-colors font-mono placeholder:uppercase"
                  />
                  {errors.uid && <p className="text-xs font-bold text-red-500 uppercase">! {errors.uid}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password" className="font-bold uppercase text-xs tracking-wider">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowResetDialog(true)}
                      className="text-xs font-bold text-gray-400 hover:text-[#F63049] uppercase transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      className="h-12 border-2 border-black dark:border-zinc-600 rounded-none pr-12 focus:ring-0 focus:border-[#F63049] transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-bold text-red-500 uppercase">! {errors.password}</p>}
                </div>

                {errors.form && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/20 border-2 border-red-500 text-red-600 dark:text-red-400 font-bold text-xs uppercase text-center">
                    {errors.form}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-[#F63049] hover:text-white dark:hover:bg-[#F63049] dark:hover:text-white border-2 border-black dark:border-transparent rounded-none font-black text-lg uppercase tracking-widest transition-all hover:translate-x-[2px] hover:translate-y-[2px] shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  {isLoading ? 'Authenticating...' : 'Enter System'}
                </Button>

                <div className="text-center pt-4 border-t-2 border-dashed border-gray-200 dark:border-zinc-800">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-2">New to the network?</p>
                  <Link href="/register" className="inline-block font-black text-lg border-b-4 border-[#F63049] hover:text-[#F63049] hover:border-black dark:hover:border-white transition-colors leading-[0.8]">
                    REGISTER NOW
                  </Link>
                </div>

              </form>
            </div>
            
            <div className="hidden lg:block absolute top-6 right-6">
              <ThemeToggle />
            </div>

          </div>
        </div>
      </div>

      {/* Password Reset Dialog - Brutalist Style */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#F63049] rounded-none bg-white dark:bg-[#0a0a0a]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Reset Password</DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase text-gray-500">
              Recover access to your account via Email or UID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold uppercase text-xs">College UID</Label>
              <Input
                placeholder="23BCS..."
                value={resetUid}
                onChange={(e) => {
                  setResetUid(e.target.value.toLowerCase())
                  setResetError('')
                }}
                className="rounded-none border-2 border-black dark:border-white focus:ring-0 font-mono"
              />
            </div>
            <div className="relative text-center">
              <span className="bg-white dark:bg-[#0a0a0a] px-2 text-xs font-bold uppercase text-gray-400 relative z-10">Or via Email</span>
              <div className="absolute top-1/2 w-full border-t border-dashed border-gray-300 -z-0"></div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold uppercase text-xs">Email Address</Label>
              <Input
                type="email"
                placeholder="USER@EXAMPLE.COM"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value)
                  setResetError('')
                }}
                className="rounded-none border-2 border-black dark:border-white focus:ring-0 font-mono"
              />
            </div>
            {resetError && (
              <p className="text-xs font-bold text-red-500 uppercase bg-red-100 p-2 border border-red-500">{resetError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
              className="rounded-none border-2 border-black hover:bg-gray-100 font-bold uppercase"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting || (!resetEmail && !resetUid)}
              className="rounded-none bg-[#F63049] text-white hover:bg-black border-2 border-transparent hover:border-black font-bold uppercase"
            >
              {isResetting ? 'Sending...' : 'Send Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}