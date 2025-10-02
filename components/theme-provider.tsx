"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import type { ReactNode } from "react"

interface CustomThemeProviderProps extends Omit<ThemeProviderProps, 'children'> {
  children: ReactNode;
}

/**
 * Wraps `children` with a NextThemesProvider configured by the provided props.
 *
 * @param children - React nodes to render inside the theme provider
 * @param props - Remaining ThemeProvider props that are forwarded to NextThemesProvider
 * @returns The React element that provides theme context to its descendants
 */
export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
