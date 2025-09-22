import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/AuthProvider"
import { DebugProvider } from "@/context/DebugProvider"
import { EnhancedDebugPanel } from "@/components/debug/EnhancedDebugPanel"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ZenType - Find Your Flow. Master Your Typing.",
  description: "A modern, AI-powered typing platform designed for focus, improvement, and seamless practice.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DebugProvider>
            <AuthProvider>
              {children}
              <EnhancedDebugPanel />
            </AuthProvider>
          </DebugProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
