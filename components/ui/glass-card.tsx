import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-6",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-[#00BFFF]/20",
        className,
      )}
    >
      {children}
    </div>
  )
}
