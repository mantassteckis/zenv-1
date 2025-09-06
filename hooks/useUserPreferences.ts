// hooks/useUserPreferences.ts

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';

/**
 * Custom hook to manage user preferences (theme, font, etc.)
 * Automatically loads preferences from user profile and applies them
 */
export const useUserPreferences = () => {
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (profile && !isLoading) {
      // Apply theme preference
      if (profile.preferredThemeId) {
        localStorage.setItem('zentype-typing-theme', profile.preferredThemeId);
        console.log('Loaded theme preference from profile:', profile.preferredThemeId);
      }

      // Apply font preference
      if (profile.preferredFontId) {
        localStorage.setItem('zentype-typing-font', profile.preferredFontId);
        console.log('Loaded font preference from profile:', profile.preferredFontId);
      }
    }
  }, [profile, isLoading]);

  return {
    themeId: profile?.preferredThemeId || 'default',
    fontId: profile?.preferredFontId || 'fira-code',
    isLoading,
  };
};
