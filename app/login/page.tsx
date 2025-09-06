"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { Header } from "@/components/header"
import { Keyboard, Mail, Lock, Chrome } from "lucide-react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "firebase/auth"
import { auth } from "@/lib/firebase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error logging in with email and password:", error)
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      console.log("Google login successful:", result.user.uid)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error logging in with Google:", error)
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await signInAnonymously(auth)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in anonymously:", error)
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
            <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-2">Welcome Back</h1>
            <p className="text-gray-300 dark:text-gray-300 light:text-gray-600">
              Sign in to continue your typing journey
            </p>
          </div>

          <GlassCard className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
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
                    placeholder="Enter your password"
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
                {isLoading ? "Signing In..." : "Login"}
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
                onClick={handleGoogleLogin}
                variant="outline"
                disabled={isLoading}
                className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>

              <Button
                onClick={handleGuestLogin}
                variant="ghost"
                disabled={isLoading}
                className="w-full text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50"
              >
                Continue as Guest
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-400">Don't have an account? </span>
              <Link href="/signup" className="text-[#00A3FF] hover:underline">
                Sign up
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}