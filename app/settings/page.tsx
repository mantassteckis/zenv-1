"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, SettingsIcon, AlertTriangle, Trash2, Palette, Type } from "lucide-react"
import { useAuth } from "@/context/AuthProvider"
import { updateUserProfile } from "@/lib/firebase/firestore"
import { useUserPreferences } from "@/hooks/useUserPreferences"

/**
 * Render the Settings page where an authenticated user can view and modify profile information,
 * choose typing-area theme and font, toggle general preferences, save changes, and manage account deletion.
 *
 * Displays a loading state while auth is resolving and a sign-in prompt when no user is authenticated.
 * Includes a guarded delete flow requiring an explicit confirmation token before allowing account deletion.
 *
 * @returns The Settings page React element
 */
export default function SettingsPage() {
  const { user, profile, isLoading } = useAuth()
  const { 
    preferences, 
    currentTheme, 
    currentFont, 
    availableThemes, 
    availableFonts,
    setTheme,
    setFont,
    setKeyboardSounds,
    setVisualFeedback,
    setAutoSaveAiTests
  } = useUserPreferences()
  
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Load profile data
  useEffect(() => {
    if (profile) {
      console.log("Settings - Loading profile data:", profile);
      console.log("Settings - Username from profile:", profile.username);
      setUsername(profile.username || "")
      setBio(profile.bio || "")
    }
  }, [profile])

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  const handleCancelDeletion = () => {
    setShowDeleteModal(false)
    setDeleteConfirmation("")
  }

  const handleConfirmDeletion = () => {
    if (deleteConfirmation === "DELETE") {
      console.log("Account deletion confirmed")
      // TODO: Implement account deletion logic
      setShowDeleteModal(false)
      setDeleteConfirmation("")
    }
  }

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <GlassCard className="p-8">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
              <p className="text-muted-foreground mb-6">
                Please sign in to access your settings and customize your typing experience.
              </p>
              <Button
                onClick={() => window.location.href = '/login'}
                className="bg-[#00BFFF] hover:bg-[#0099CC] text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign In
              </Button>
            </GlassCard>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Settings</h1>
            <p className="text-muted-foreground">
              Customize your typing experience and manage your account preferences
            </p>
          </div>

          {/* Profile Information Section */}
          <GlassCard className="space-y-6">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-[#00BFFF]" />
              <h2 className="text-2xl font-semibold text-foreground">Profile Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="glass-card border-border bg-background/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="glass-card border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="glass-card border-border bg-background/50 text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
          </GlassCard>

          {/* Typing Area Themes Section */}
          <GlassCard className="space-y-6">
            <div className="flex items-center space-x-3">
              <Palette className="h-6 w-6 text-[#00BFFF]" />
              <h2 className="text-2xl font-semibold text-foreground">Typing Area Themes</h2>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">Choose a visual theme for your typing practice area</p>
              <div className={`p-6 rounded-lg bg-gradient-to-br ${currentTheme.gradient} border border-border`}>
                <p className="text-sm text-muted-foreground mb-2">Live Preview:</p>
                <p className={`text-lg ${currentFont.className} ${currentTheme.textColor} leading-relaxed`}>
                  The quick brown fox jumps over the lazy dog. This is how your typing area will look.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      preferences.theme === theme.id
                        ? "border-[#00BFFF] shadow-lg shadow-[#00BFFF]/20"
                        : "border-border hover:border-[#00BFFF]/50"
                    }`}
                  >
                    <div
                      className={`h-16 rounded-md bg-gradient-to-br ${theme.gradient} mb-3 flex items-center justify-center`}
                    >
                      <span className={`text-sm font-mono ${theme.textColor}`}>Sample Text</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{theme.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Typing Font Selection Section */}
          <GlassCard className="space-y-6">
            <div className="flex items-center space-x-3">
              <Type className="h-6 w-6 text-[#00BFFF]" />
              <h2 className="text-2xl font-semibold text-foreground">Typing Font</h2>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">Select your preferred monospaced font for typing practice</p>
              <Select value={preferences.font} onValueChange={setFont}>
                <SelectTrigger className="w-full glass-card border-border bg-background/50">
                  <SelectValue placeholder="Choose a font" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border">
                  {availableFonts.map((font) => (
                    <SelectItem key={font.id} value={font.id} className={font.className}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className={`p-6 glass-card border-border rounded-lg bg-gradient-to-br ${currentTheme.gradient}`}>
                <p className="text-sm text-muted-foreground mb-2">Font Preview:</p>
                <p className={`text-lg ${currentFont.className} ${currentTheme.textColor} leading-relaxed`}>
                  The quick brown fox jumps over the lazy dog. 1234567890
                  <br />
                  <span className="text-green-500">Correct characters</span>{" "}
                  <span className="text-red-500">Incorrect characters</span>
                </p>
              </div>
            </div>
          </GlassCard>

          {/* General Settings Section */}
          <GlassCard className="space-y-6">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-6 w-6 text-[#00BFFF]" />
              <h2 className="text-2xl font-semibold text-foreground">General Settings</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="keyboard-sounds" className="text-foreground font-medium">
                    Keyboard Sounds
                  </Label>
                  <p className="text-sm text-muted-foreground">Play sound effects when typing</p>
                </div>
                <Switch 
                  id="keyboard-sounds" 
                  checked={preferences.keyboardSounds} 
                  onCheckedChange={setKeyboardSounds}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="visual-feedback" className="text-foreground font-medium">
                    Visual Feedback
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show visual indicators for correct/incorrect keystrokes
                  </p>
                </div>
                <Switch 
                  id="visual-feedback" 
                  checked={preferences.visualFeedback} 
                  onCheckedChange={setVisualFeedback}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-save-ai-tests" className="text-foreground font-medium">
                    Auto-save AI-Generated Tests
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save tests you generate to the public library
                  </p>
                </div>
                <Switch 
                  id="auto-save-ai-tests" 
                  checked={preferences.autoSaveAiTests} 
                  onCheckedChange={setAutoSaveAiTests}
                />
              </div>
            </div>
          </GlassCard>

          {/* Account Management Section */}
          <GlassCard className="space-y-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h2 className="text-2xl font-semibold text-foreground">Account Management</h2>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Manage your account settings and data. These actions cannot be undone.
              </p>

              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </GlassCard>

          {/* Save Changes Button */}
          <div className="flex justify-center">
            <Button
              onClick={async () => {
                if (!user || !profile) {
                  console.log("User not logged in, cannot save profile changes")
                  return
                }

                setIsSaving(true)
                try {
                  await updateUserProfile(user.uid, {
                    username,
                    bio,
                    preferredThemeId: preferences.theme,
                    preferredFontId: preferences.font,
                    settings: {
                      keyboardSounds: preferences.keyboardSounds,
                      visualFeedback: preferences.visualFeedback,
                      autoSaveAiTests: preferences.autoSaveAiTests,
                    },
                  })
                  console.log("Profile updated successfully")
                } catch (error) {
                  console.error("Error updating profile:", error)
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving || !user}
              className="bg-[#00BFFF] hover:bg-[#0099CC] text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="max-w-md w-full space-y-6 border-destructive/20">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <h3 className="text-xl font-semibold text-foreground">Confirm Account Deletion</h3>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  This action cannot be undone. All your typing data, progress, and account information will be
                  permanently deleted.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation" className="text-foreground font-medium">
                    Type "DELETE" to confirm:
                  </Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="glass-card border-border bg-background/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleCancelDeletion}
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-accent bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDeletion}
                  disabled={deleteConfirmation !== "DELETE"}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Deletion
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  )
}
