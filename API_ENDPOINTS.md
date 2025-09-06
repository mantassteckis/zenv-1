# API Endpoints

## User Profile Management

### Firestore Functions (lib/firebase/firestore.ts)

#### `createUserProfile(uid, email, username, photoURL?)`
- **Purpose**: Creates a new user profile in Firestore (only if it doesn't exist)
- **Parameters**: 
  - `uid`: User's unique identifier
  - `email`: User's email address
  - `username`: User's chosen username
  - `photoURL`: Optional profile photo URL
- **Returns**: Promise<UserProfile> - Returns the created or existing profile
- **Usage**: Called during user registration (signup/login)
- **Enhancement**: Now returns the profile data to ensure proper synchronization

#### `getUserProfile(uid)`
- **Purpose**: Fetches a user profile from Firestore
- **Parameters**: 
  - `uid`: User's unique identifier
- **Returns**: Promise<UserProfile | null>
- **Usage**: Used by AuthProvider to load user profile data

#### `updateUserProfile(uid, data)`
- **Purpose**: Updates specific fields in a user's profile
- **Parameters**: 
  - `uid`: User's unique identifier
  - `data`: Partial UserProfile object with fields to update
- **Returns**: Promise<void>
- **Usage**: Called from settings page to save user preferences

#### `deleteUserProfile(uid)`
- **Purpose**: Deletes a user's profile from Firestore
- **Parameters**: 
  - `uid`: User's unique identifier
- **Returns**: Promise<void>
- **Usage**: For account deletion functionality

#### `repairUserProfile(uid, email)`
- **Purpose**: Repairs/updates an existing profile to ensure it has all required fields
- **Parameters**: 
  - `uid`: User's unique identifier
  - `email`: User's email address
- **Returns**: Promise<void>
- **Usage**: Called automatically when user logs in to fix any missing profile data

## User Preferences System

### Custom Hooks

#### `useUserPreferences()`
- **Purpose**: Manages user preferences (theme, font, etc.)
- **Returns**: Object with themeId, fontId, and isLoading
- **Usage**: Automatically loads preferences from user profile and applies them

### Components

#### `UserPreferencesLoader`
- **Purpose**: Component that loads and applies user preferences from their profile
- **Usage**: Wraps the entire app in layout.tsx to ensure preferences are loaded on startup

## Data Management Functions

### Profile Statistics

#### `calculateUserStats(uid)`
- **Purpose**: Calculates user statistics from their test results
- **Parameters**: 
  - `uid`: User's unique identifier
- **Returns**: Promise<UserStats | null>
- **Usage**: Called by dashboard to display user performance metrics
- **Note**: Currently returns default values, will be enhanced when test results storage is implemented

## UI/UX Enhancements

### Dashboard Page
- **Real User Data**: Displays actual username from profile instead of "TypeMaster"
- **Empty State**: Shows encouraging message and "Start Typing" button when user has no tests completed
- **Authentication Guards**: Proper loading states and login prompts

### History Page
- **Empty State**: Shows "No typing history yet" message with "Start Typing" button
- **Authentication Guards**: Proper loading states and login prompts
- **Future-Ready**: Structure prepared for real test results data

### Settings Page
- **Profile Data**: Username and bio loaded from and saved to user profile
- **Persistent Settings**: All preferences (theme, font, keyboard sounds, visual feedback) saved to profile
- **Real-time Saving**: Theme, font, and general settings changes saved immediately
- **User Settings Structure**: Added settings object to UserProfile interface for keyboard sounds and visual feedback

### Test Page
- **Navigation Fix**: "Go to Dashboard" button now properly navigates to dashboard page

## Bug Fixes & Improvements

### Authentication Flow
- **Signup Redirect Fix**: New user creation now properly redirects to dashboard after profile creation
- **Profile Synchronization**: Improved timing to ensure profile data is available before redirecting
- **Header Loading States**: Added intermediate loading state for when user exists but profile is still loading

### User Experience
- **New User Dashboard**: Dashboard properly shows empty state for users with no test data
- **Profile Menu**: Header now shows "Loading..." when user is authenticated but profile is still loading
- **Consistent Data Display**: All pages now use real user data instead of dummy/placeholder content

## Critical Bug Fixes & New Architecture

### Profile Management Overhaul (Latest - New Approach)
- **Centralized Profile Management**: Moved all profile creation/loading logic to AuthProvider
- **Synchronous Profile Loading**: Profile data is fetched and set immediately when user authenticates
- **Eliminated Race Conditions**: No more timing issues between authentication and profile creation
- **SessionStorage Username**: Temporarily stores signup username for profile creation
- **Immediate Redirects**: Signup/login redirects happen immediately, profile creation is handled separately
- **Real-time Listeners**: Set up after initial profile load for live updates

### Authentication Flow Improvements
- **Simplified Signup**: Removed complex async profile creation from signup flow
- **Reliable Redirects**: All auth actions redirect immediately to dashboard
- **Loading States**: Added proper loading indicators during signup process
- **Error Handling**: Better error states and user feedback
- **Consistent Behavior**: Same flow for email/password and Google authentication

### Technical Architecture
- **Single Source of Truth**: AuthProvider is the only place that creates/manages profiles
- **Automatic Profile Creation**: Profiles are created automatically when user authenticates without one
- **Backward Compatibility**: Existing users get profiles created automatically on login
- **Clean Separation**: Auth logic separated from UI redirect logic

### Profile Loading Issues (Previous)
- **Login Profile Loading Fix**: Fixed issue where existing users' profiles weren't loading after login
- **Username Generation**: Added automatic username generation for users without usernames (email prefix or fallback)
- **Profile Repair System**: Implemented automatic profile repair for missing fields on login
- **AuthProvider Enhancement**: Improved listener cleanup and profile synchronization
- **Email/Password Login**: Added profile creation/repair for regular email/password login (previously only for Google)

### Data Integrity
- **Missing Field Detection**: Automatically detects and fixes missing profile fields (username, settings, preferences)
- **Backward Compatibility**: Ensures all existing users have complete profile data
- **Real-time Updates**: Profile changes are immediately reflected across all components