"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { Header } from "@/components/header"
import { Keyboard, User, Mail, Lock, Chrome } from "lucide-react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { createUserProfile } from "@/lib/firebase/firestore"

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    console.log("🚀 SIGNUP STARTED - User inputs:", { username, email })
    
    try {
      // Create Firebase user first
      console.log("👤 Creating Firebase user...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log("✅ Firebase user created - UID:", user.uid)
      
      // Create profile immediately
      console.log("📝 Creating user profile...")
      const profileData = await createUserProfile(user.uid, user.email, username)
      console.log("✅ Profile creation completed:", profileData)
      
      if (!profileData || !profileData.username) {
        console.error("❌ Profile creation failed - no data returned")
        alert("Profile creation failed. Please try again.")
        setIsLoading(false)
        return
      }
      
      console.log("🎯 SUCCESS! Profile created with username:", profileData.username)
      
      // VERIFY profile exists by fetching it again
      console.log("🔍 Final verification - fetching profile again...")
      let verifiedProfile = null
      let attempts = 0
      
      while (!verifiedProfile && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        try {
          const { getUserProfile } = await import('@/lib/firebase/firestore')
          verifiedProfile = await getUserProfile(user.uid)
          console.log(`✅ Verification attempt ${attempts + 1}:`, verifiedProfile ? `Profile found with username: ${verifiedProfile.username}` : "No profile yet")
          attempts++
        } catch (error) {
          console.error("Verification error:", error)
          attempts++
        }
      }
      
      if (verifiedProfile) {
        console.log("🚀 VERIFIED! Profile exists, safe to redirect")
        console.log("📍 Navigating to dashboard...")
        router.push("/dashboard")
      } else {
        console.error("❌ Could not verify profile creation")
        alert("Profile creation issue. Please try logging in.")
        setIsLoading(false)
      }
      
    } catch (error) {
      console.error("💥 Signup error:", error)
      alert(`Signup failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      console.log("Google signup successful:", user.uid)
      
      // Create profile immediately with Google data
      console.log("Google signup - Creating profile directly...")
      const profileData = await createUserProfile(
        user.uid, 
        user.email, 
        user.displayName || user.email?.split('@')[0] || 'user',
        user.photoURL || undefined  // Convert null to undefined
      )
      console.log("Google signup - Profile created:", profileData)
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (error) {
      console.error("Error signing up with Google:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#FFFFFF]">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#00A3FF] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Keyboard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-2">Join ZenType</h1>
            <p className="text-gray-300 dark:text-gray-300 light:text-gray-600">
              Create your account and start improving your typing skills
            </p>
          </div>

          <GlassCard className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white dark:text-white light:text-black">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white dark:text-white light:text-black">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white dark:text-white light:text-black">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00A3FF] hover:bg-[#0088cc] text-white disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-gray-400">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignup}
                variant="outline"
                disabled={isLoading}
                className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>

              <Button
                onClick={() => console.log("Guest signup clicked - implement signInAnonymously later if needed")}
                variant="ghost"
                disabled={isLoading}
                className="w-full text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50"
              >
                Continue as Guest
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-400">Already have an account? </span>
              <Link href="/login" className="text-[#00A3FF] hover:underline">
                Sign in
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}