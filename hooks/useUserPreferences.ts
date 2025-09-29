// hooks/useUserPreferences.ts

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { updateUserProfile } from '@/lib/firebase/firestore';

// Types for typing preferences
export interface TypingTheme {
  id: string
  name: string
  gradient: string
  textColor: string
}

export interface TypingFont {
  id: string
  name: string
  className: string
}

export interface UserPreferences {
  theme: string
  font: string
  keyboardSounds: boolean
  visualFeedback: boolean
  autoSaveAiTests: boolean
}

// Available themes and fonts
export const TYPING_THEMES: TypingTheme[] = [
  { id: "default", name: "Default", gradient: "from-background to-background", textColor: "text-foreground" },
  { id: "neon-wave", name: "Neon Wave", gradient: "from-purple-900/20 to-cyan-900/20", textColor: "text-cyan-300" },
  { id: "sunset", name: "Sunset", gradient: "from-orange-900/20 to-pink-900/20", textColor: "text-orange-200" },
  { id: "forest", name: "Forest", gradient: "from-green-900/20 to-emerald-900/20", textColor: "text-green-200" },
  { id: "ocean", name: "Ocean", gradient: "from-blue-900/20 to-teal-900/20", textColor: "text-blue-200" },
  { id: "midnight", name: "Midnight", gradient: "from-slate-900/40 to-indigo-900/40", textColor: "text-slate-200" },
]

export const TYPING_FONTS: TypingFont[] = [
  { id: "fira-code", name: "Fira Code", className: "font-mono" },
  { id: "jetbrains-mono", name: "JetBrains Mono", className: "font-mono" },
  { id: "source-code-pro", name: "Source Code Pro", className: "font-mono" },
  { id: "roboto-mono", name: "Roboto Mono", className: "font-mono" },
  { id: "ubuntu-mono", name: "Ubuntu Mono", className: "font-mono" },
]

// External store for user preferences with real-time sync
class UserPreferencesStore {
  private preferences: UserPreferences = {
    theme: 'default',
    font: 'fira-code',
    keyboardSounds: true,
    visualFeedback: true,
    autoSaveAiTests: false
  }
  private listeners = new Set<() => void>()

  constructor() {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('zenTypeTheme') || localStorage.getItem('zentype-typing-theme')
      const savedFont = localStorage.getItem('zenTypeFont') || localStorage.getItem('zentype-typing-font')
      const savedKeyboardSounds = localStorage.getItem('zentype-keyboard-sounds')
      const savedVisualFeedback = localStorage.getItem('zentype-visual-feedback')
      const savedAutoSaveAiTests = localStorage.getItem('zentype-auto-save-ai-tests')
      
      this.preferences = {
        theme: savedTheme || 'default',
        font: savedFont || 'fira-code',
        keyboardSounds: savedKeyboardSounds ? JSON.parse(savedKeyboardSounds) : true,
        visualFeedback: savedVisualFeedback ? JSON.parse(savedVisualFeedback) : true,
        autoSaveAiTests: savedAutoSaveAiTests ? JSON.parse(savedAutoSaveAiTests) : false
      }

      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange)
    }
  }

  private handleStorageChange = (event: StorageEvent) => {
    let updated = false
    
    if (event.key === 'zenTypeTheme' || event.key === 'zentype-typing-theme') {
      this.preferences.theme = event.newValue || 'default'
      updated = true
    } else if (event.key === 'zenTypeFont' || event.key === 'zentype-typing-font') {
      this.preferences.font = event.newValue || 'fira-code'
      updated = true
    } else if (event.key === 'zentype-keyboard-sounds') {
      this.preferences.keyboardSounds = event.newValue ? JSON.parse(event.newValue) : true
      updated = true
    } else if (event.key === 'zentype-visual-feedback') {
      this.preferences.visualFeedback = event.newValue ? JSON.parse(event.newValue) : true
      updated = true
    } else if (event.key === 'zentype-auto-save-ai-tests') {
      this.preferences.autoSaveAiTests = event.newValue ? JSON.parse(event.newValue) : false
      updated = true
    }
    
    if (updated) {
      this.notifyListeners()
    }
  }

  getSnapshot = (): UserPreferences => {
    return this.preferences
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setTheme = (theme: string) => {
    this.preferences = { ...this.preferences, theme }
    localStorage.setItem('zenTypeTheme', theme)
    localStorage.setItem('zentype-typing-theme', theme) // Legacy support
    
    // Dispatch storage event for cross-tab sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'zenTypeTheme', newValue: theme })
      )
    }
    
    this.notifyListeners()
  }

  setFont = (font: string) => {
    this.preferences = { ...this.preferences, font }
    localStorage.setItem('zenTypeFont', font)
    localStorage.setItem('zentype-typing-font', font) // Legacy support
    
    // Dispatch storage event for cross-tab sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'zenTypeFont', newValue: font })
      )
    }
    
    this.notifyListeners()
  }

  setKeyboardSounds = (enabled: boolean) => {
    this.preferences = { ...this.preferences, keyboardSounds: enabled }
    localStorage.setItem('zentype-keyboard-sounds', JSON.stringify(enabled))
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'zentype-keyboard-sounds', newValue: JSON.stringify(enabled) })
      )
    }
    
    this.notifyListeners()
  }

  setVisualFeedback = (enabled: boolean) => {
    this.preferences = { ...this.preferences, visualFeedback: enabled }
    localStorage.setItem('zentype-visual-feedback', JSON.stringify(enabled))
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'zentype-visual-feedback', newValue: JSON.stringify(enabled) })
      )
    }
    
    this.notifyListeners()
  }

  setAutoSaveAiTests = (enabled: boolean) => {
    this.preferences = { ...this.preferences, autoSaveAiTests: enabled }
    localStorage.setItem('zentype-auto-save-ai-tests', JSON.stringify(enabled))
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'zentype-auto-save-ai-tests', newValue: JSON.stringify(enabled) })
      )
    }
    
    this.notifyListeners()
  }

  updateFromProfile = (profile: any) => {
    let updated = false
    
    if (profile.preferredThemeId && profile.preferredThemeId !== this.preferences.theme) {
      this.preferences.theme = profile.preferredThemeId
      localStorage.setItem('zenTypeTheme', profile.preferredThemeId)
      localStorage.setItem('zentype-typing-theme', profile.preferredThemeId)
      updated = true
    }
    
    if (profile.preferredFontId && profile.preferredFontId !== this.preferences.font) {
      this.preferences.font = profile.preferredFontId
      localStorage.setItem('zenTypeFont', profile.preferredFontId)
      localStorage.setItem('zentype-typing-font', profile.preferredFontId)
      updated = true
    }

    if (profile.settings) {
      if (profile.settings.keyboardSounds !== undefined && profile.settings.keyboardSounds !== this.preferences.keyboardSounds) {
        this.preferences.keyboardSounds = profile.settings.keyboardSounds
        localStorage.setItem('zentype-keyboard-sounds', JSON.stringify(profile.settings.keyboardSounds))
        updated = true
      }
      
      if (profile.settings.visualFeedback !== undefined && profile.settings.visualFeedback !== this.preferences.visualFeedback) {
        this.preferences.visualFeedback = profile.settings.visualFeedback
        localStorage.setItem('zentype-visual-feedback', JSON.stringify(profile.settings.visualFeedback))
        updated = true
      }
      
      if (profile.settings.autoSaveAiTests !== undefined && profile.settings.autoSaveAiTests !== this.preferences.autoSaveAiTests) {
        this.preferences.autoSaveAiTests = profile.settings.autoSaveAiTests
        localStorage.setItem('zentype-auto-save-ai-tests', JSON.stringify(profile.settings.autoSaveAiTests))
        updated = true
      }
    }
    
    if (updated) {
      this.notifyListeners()
    }
  }

  private notifyListeners = () => {
    this.listeners.forEach(listener => listener())
  }
}

// Create singleton store instance
const userPreferencesStore = new UserPreferencesStore()

// Cached server snapshot to avoid infinite loop
const SERVER_SNAPSHOT = { theme: 'default', font: 'fira-code', keyboardSounds: true, visualFeedback: true, autoSaveAiTests: false };

/**
 * Enhanced hook to manage all user preferences with real-time synchronization
 * Automatically loads preferences from user profile and applies them
 * Provides setters that sync with both localStorage and user profile
 */
export const useUserPreferences = () => {
  const { profile, user, isLoading } = useAuth();
  
  // Use useSyncExternalStore for real-time synchronization across components and tabs
  const preferences = useSyncExternalStore(
    userPreferencesStore.subscribe,
    userPreferencesStore.getSnapshot,
    () => SERVER_SNAPSHOT // Use cached server snapshot
  )

  // Update store when profile changes
  useEffect(() => {
    if (profile) {
      userPreferencesStore.updateFromProfile(profile)
    }
  }, [profile]);

  // Get current theme and font objects
  const currentTheme = TYPING_THEMES.find(t => t.id === preferences.theme) || TYPING_THEMES[0]
  const currentFont = TYPING_FONTS.find(f => f.id === preferences.font) || TYPING_FONTS[0]

  // Theme setter with profile sync
  const setTheme = async (theme: string) => {
    userPreferencesStore.setTheme(theme)
    
    // Save to user profile if authenticated
    if (user && profile) {
      try {
        await updateUserProfile(user.uid, { preferredThemeId: theme })
        console.log('Theme preference saved to profile:', theme)
      } catch (error) {
        console.error('Error saving theme preference:', error)
      }
    }
  }

  // Font setter with profile sync
  const setFont = async (font: string) => {
    userPreferencesStore.setFont(font)
    
    // Save to user profile if authenticated
    if (user && profile) {
      try {
        await updateUserProfile(user.uid, { preferredFontId: font })
        console.log('Font preference saved to profile:', font)
      } catch (error) {
        console.error('Error saving font preference:', error)
      }
    }
  }

  // Settings setters with profile sync
  const setKeyboardSounds = async (enabled: boolean) => {
    userPreferencesStore.setKeyboardSounds(enabled)
    
    if (user && profile) {
      try {
        await updateUserProfile(user.uid, { 
          settings: { 
            ...profile.settings, 
            keyboardSounds: enabled 
          } 
        })
        console.log('Keyboard sounds preference saved:', enabled)
      } catch (error) {
        console.error('Error saving keyboard sounds preference:', error)
      }
    }
  }

  const setVisualFeedback = async (enabled: boolean) => {
    userPreferencesStore.setVisualFeedback(enabled)
    
    if (user && profile) {
      try {
        await updateUserProfile(user.uid, { 
          settings: { 
            ...profile.settings, 
            visualFeedback: enabled 
          } 
        })
        console.log('Visual feedback preference saved:', enabled)
      } catch (error) {
        console.error('Error saving visual feedback preference:', error)
      }
    }
  }

  const setAutoSaveAiTests = async (enabled: boolean) => {
    userPreferencesStore.setAutoSaveAiTests(enabled)
    
    if (user && profile) {
      try {
        await updateUserProfile(user.uid, { 
          settings: { 
            ...profile.settings, 
            autoSaveAiTests: enabled 
          } 
        })
        console.log('Auto save AI tests preference saved:', enabled)
      } catch (error) {
        console.error('Error saving auto save AI tests preference:', error)
      }
    }
  }

  return {
    // Preferences state
    preferences,
    currentTheme,
    currentFont,
    
    // Legacy compatibility
    themeId: preferences.theme,
    fontId: preferences.font,
    
    // Setters
    setTheme,
    setFont,
    setKeyboardSounds,
    setVisualFeedback,
    setAutoSaveAiTests,
    
    // Loading state
    isLoading,
    
    // Available options
    availableThemes: TYPING_THEMES,
    availableFonts: TYPING_FONTS
  };
};
