'use client'

import React from "react"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth'
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
    
    // UID validation (format: 23bcsxxxxx or 23icsxxxxx or 24bcs...)
    // Allowing wider range but keeping format check somewhat strict to avoid junk
    if (!formData.uid) {
      newErrors.uid = 'College UID is required'
    } else if (!/^\d{2}(bcs|ics)\d{3,5}$/i.test(formData.uid)) {
      newErrors.uid = 'Invaild Format (e.g. 23BCS10001)'
    }
    
    if (!formData.name) newErrors.name = 'Full Name is required'
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Min 6 characters required'
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation required'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // Set persistence to LOCAL before creating account
      await setPersistence(auth, browserLocalPersistence)
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Store user data in Firestore using college UID as document ID
      await setDoc(doc(db, 'users', formData.uid.toLowerCase()), {
        firebaseUid: userCredential.user.uid,
        uid: formData.uid.toLowerCase(),
        name: formData.name,
        email: formData.email,
        createdAt: new Date().toISOString(),
      })

      toast.success('Registration Complete. Welcome aboard.')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error: any) {
      console.error('Registration error:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Email already registered' })
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Password is too weak' })
      } else {
        setErrors({ form: 'Registration failed. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] font-sans selection:bg-[#F63049] selection:text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="grid lg:grid-cols-2 min-h-screen relative z-10">
        
        {/* Left Side - Visuals (Sticky) */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-black text-white border-r-4 border-[#F63049] relative overflow-hidden sticky top-0 h-screen">
           {/* Abstract lines */}
           <div className="absolute top-0 right-0 w-[200%] h-[200%] bg-[repeating-linear-gradient(135deg,transparent,transparent_20px,#333_20px,#333_40px)] opacity-20 transform -translate-y-1/2 translate-x-1/2"></div>
           
           <div className="relative z-10">
             <Link href="/" className="inline-block hover:-translate-x-2 transition-transform">
               <div className="flex items-center gap-2 group cursor-pointer">
                  <ArrowLeft className="h-6 w-6 group-hover:text-[#F63049]" />
                  <span className="font-mono text-sm font-bold uppercase">Back to Base</span>
               </div>
             </Link>
           </div>

           <div className="relative z-10 space-y-6">
             <h1 className="text-8xl font-black tracking-tighter leading-[0.85] text-white">
               JOIN<br />
               THE<br />
               <span className="text-[#F63049]">CLUB.</span>
             </h1>
             <p className="text-xl font-medium max-w-md text-gray-400">
               Where "Free RN?" actually gets a reply. <br/>
               Create your student profile to start syncing.
             </p>
           </div>

           <div className="relative z-10">
             <div className="inline-block px-4 py-2 border-2 border-white transform rotate-2">
                <span className="font-mono text-xs font-bold uppercase">Membership: Free Forever</span>
             </div>
           </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex flex-col justify-center items-center p-6 lg:p-12 min-h-screen">
          <div className="w-full max-w-md my-auto">
            
            {/* Mobile Header */}
            <div className="lg:hidden flex justify-between items-center mb-8">
               <Link href="/" className="flex items-center gap-2">
                 <div className="h-8 w-8 bg-[#F63049] flex items-center justify-center border border-black">
                   <span className="text-white font-bold text-xs">K</span>
                 </div>
                 <span className="font-bold text-lg">Register</span>
               </Link>
               <ThemeToggle />
            </div>

            <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-[8px_8px_0px_0px_#F63049] p-8 relative">
              
              <div className="mb-6 pb-6 border-b-2 border-dashed border-gray-200 dark:border-zinc-800">
                 <h2 className="text-3xl font-black mb-1 uppercase">New Profile</h2>
                 <p className="text-gray-500 font-medium font-mono text-xs uppercase">FILL ALL FIELDS TO PROCEED</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* UID Field */}
                <div className="space-y-1">
                  <Label htmlFor="uid" className="font-bold uppercase text-xs">College UID</Label>
                  <Input
                    id="uid"
                    placeholder="23BCS15099"
                    value={formData.uid}
                    onChange={e => handleChange('uid', e.target.value.toLowerCase())}
                    className={`h-12 border-2 rounded-none font-mono placeholder:uppercase transition-all ${errors.uid ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-black dark:border-zinc-600 focus:border-[#F63049]'}`}
                  />
                  {errors.uid && <p className="text-xs font-bold text-red-500 uppercase mt-1">! {errors.uid}</p>}
                </div>

                {/* Name Field */}
                <div className="space-y-1">
                  <Label htmlFor="name" className="font-bold uppercase text-xs">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Rahul Sharma"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="h-12 border-2 border-black dark:border-zinc-600 rounded-none focus:border-[#F63049] transition-all"
                  />
                  {errors.name && <p className="text-xs font-bold text-red-500 uppercase mt-1">! {errors.name}</p>}
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="font-bold uppercase text-xs">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className={`h-12 border-2 rounded-none font-mono transition-all ${errors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-black dark:border-zinc-600 focus:border-[#F63049]'}`}
                  />
                  {errors.email && <p className="text-xs font-bold text-red-500 uppercase mt-1">! {errors.email}</p>}
                </div>

                {/* Password Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <Label htmlFor="password" className="font-bold uppercase text-xs">Password</Label>
                     <div className="relative">
                       <Input
                         id="password"
                         type={showPassword ? 'text' : 'password'}
                         placeholder="••••••"
                         value={formData.password}
                         onChange={e => handleChange('password', e.target.value)}
                         className={`h-12 border-2 rounded-none pr-10 font-mono ${errors.password ? 'border-red-500' : 'border-black dark:border-zinc-600 focus:border-[#F63049]'}`}
                       />
                       <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                       >
                         {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                     </div>
                     {errors.password && <p className="text-xs font-bold text-red-500 uppercase mt-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-1">
                     <Label htmlFor="confirmPassword" className="font-bold uppercase text-xs">Confirm</Label>
                     <div className="relative">
                       <Input
                         id="confirmPassword"
                         type={showConfirmPassword ? 'text' : 'password'}
                         placeholder="••••••"
                         value={formData.confirmPassword}
                         onChange={e => handleChange('confirmPassword', e.target.value)}
                         className={`h-12 border-2 rounded-none pr-10 font-mono ${errors.confirmPassword ? 'border-red-500' : 'border-black dark:border-zinc-600 focus:border-[#F63049]'}`}
                       />
                       <button
                         type="button"
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                       >
                         {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                     </div>
                     {errors.confirmPassword && <p className="text-xs font-bold text-red-500 uppercase mt-1">Mismatch</p>}
                  </div>
                </div>

                {errors.form && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 border-2 border-red-500 text-red-600 dark:text-red-400 font-bold text-xs uppercase text-center">
                    {errors.form}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-14 mt-4 bg-[#F63049] text-white hover:bg-black hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white rounded-none font-black text-lg uppercase tracking-widest transition-all hover:-translate-y-1 shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_#fff]"
                >
                  {isLoading ? 'Processing...' : 'Create Account'}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-2">Already in the system?</p>
                  <Link href="/login" className="inline-block font-black text-sm border-b-2 border-black dark:border-white hover:text-[#F63049] hover:border-[#F63049] transition-colors">
                    LOGIN HERE
                  </Link>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Theme Toggle */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>

    </div>
  )
}