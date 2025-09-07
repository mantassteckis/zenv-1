import type React from "react"
import { Inter, Fira_Code } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/AuthProvider"
import { DebugProvider } from "@/context/DebugProvider"
import { UserPreferencesLoader } from "@/components/user-preferences-loader"
import { DebugToggle } from "@/components/debug/DebugToggle"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira-code",
})

export const metadata = {
  title: "ZenType - Find Your Flow. Master Your Typing.",
  description: "A modern, AI-powered typing platform designed for focus, improvement, and seamless practice.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <DebugProvider>
            <AuthProvider>
              <UserPreferencesLoader>
                {children}
                <DebugToggle />
              </UserPreferencesLoader>
            </AuthProvider>
          </DebugProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
