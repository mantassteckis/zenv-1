# API Endpoints

## Pre-made Test Management

### Test Fetching

#### `GET /api/tests` (Next.js API Route)
- **Purpose**: Fetch pre-made typing tests from Firestore with optional filtering
- **Authentication**: None required (public endpoint)
- **Query Parameters**:
  - `difficulty`: Optional - Filter by difficulty ('Easy', 'Medium', 'Hard')
  - `timeLimit`: Optional - Filter by time limit ('30s', '1m', '2m', '5m')
  - `category`: Optional - Filter by test category (e.g., 'Technology', 'Nature', 'History')
- **Response**: 
  ```typescript
  {
    tests: PreMadeTest[];
    total: number;
  }
  ```
- **PreMadeTest Structure**:
  ```typescript
  {
    id: string;
    text: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    timeLimit: '30s' | '1m' | '2m' | '5m';
    category: string;
  }
  ```
- **Error Handling**: Returns appropriate HTTP status codes and detailed error messages
- **Usage**: Called by test page to populate practice test options

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

## API Routes

### Test Result Submission

#### `POST /api/submit-test-result` (Next.js API Route)
- **Purpose**: Secure endpoint for submitting test results with validation
- **Authentication**: Required - Bearer token in Authorization header
- **Request Body**:
  ```typescript
  {
    wpm: number;           // 0-400
    accuracy: number;      // 0-100
    errors: number;        // >= 0
    timeTaken: number;     // > 0 (seconds)
    textLength: number;    // > 0
    userInput: string;     // Required
    testType: string;      // Required (e.g., 'practice', 'ai-generated')
    difficulty: string;    // Required (e.g., 'Easy', 'Medium', 'Hard')
    testId: string;        // Required - links to test content
  }
  ```
- **Response**: `{ success: true, message: string }`
- **Validation**: Server-side validation of all data fields
- **Actions**:
  1. Validates JWT token from Authorization header
  2. Validates all test data fields
  3. Saves test result to `testResults` collection in Firestore
- **Error Handling**: Returns appropriate HTTP status codes and error messages

## Cloud Functions

### Test Result Submission (Alternative)

#### `submitTestResult` (Cloud Function)
- **Purpose**: Secure endpoint for submitting test results with validation and stats updates
- **Authentication**: Required - throws unauthenticated error if no user
- **Request Body**:
  ```typescript
  {
    wpm: number;           // 0-400
    accuracy: number;      // 0-100
    errors: number;        // >= 0
    timeTaken: number;     // > 0 (seconds)
    textLength: number;    // > 0
    userInput: string;     // Required
    testType: string;      // Required (e.g., 'practice', 'ai-generated')
    difficulty: string;    // Required (e.g., 'Easy', 'Medium', 'Hard')
    testId?: string;       // Optional - links to test content
  }
  ```
- **Response**: `{ success: true, message: string }`
- **Validation**: Server-side validation of all data fields
- **Transaction**: Uses Firestore transaction to ensure data consistency
- **Actions**:
  1. Creates new document in `testResults` collection
  2. Updates user profile stats (rank, testsCompleted, avgWpm, avgAcc)
- **Error Handling**: Throws HttpsError for validation failures or server errors

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

## Test Result Data Flow (Fixed)

### Complete Data Persistence System
- **Test Submission**: Fixed API route `/api/submit-test-result` with proper error handling
- **Data Storage**: Test results saved to `testResults` collection in Firestore
- **Stats Calculation**: Real-time calculation of user statistics from test results
- **Dashboard Display**: Live display of user stats and recent test results
- **History View**: Paginated display of all user test results

### Key Fixes Applied
1. **API Route Fix**: Fixed incorrect Firestore syntax in `/api/submit-test-result/route.ts`
2. **Stats Calculation**: Updated `calculateUserStats` to query test results directly
3. **Data Structure**: Ensured consistent data structure across all components
4. **Error Handling**: Added proper validation and error handling for all data operations
5. **Auto-Save Timer Fix**: Implemented ref-based endTest calls to prevent stale state issues
6. **Timer Logic**: Fixed timer dependencies and race conditions for reliable auto-save

### Data Flow
1. **Test Completion** → Test page calculates WPM, accuracy, errors
2. **Data Submission** → POST to `/api/submit-test-result` with JWT token
3. **Server Validation** → API route validates all data fields
4. **Firestore Storage** → Test result saved to `testResults` collection
5. **Dashboard Update** → Dashboard queries test results and calculates stats
6. **History Display** → History page shows paginated test results

### Auto-Save Implementation
- **Timer Completion**: When timer reaches 0, calls `endTest` via ref to ensure fresh state
- **Manual Finish**: "Finish Test" button calls `endTest` directly with current state
- **Consistent Behavior**: Both auto-save and manual finish use identical logic and data
- **Validation**: All test data properly validated before submission (no more 400 errors)
- **Single Submission**: Each test completion saves exactly once, no duplicates

---

## 📊 **Current System Status**

### **Test Database Overview**
- **Total Categories**: 4 professional domains
- **Total Tests**: 48 high-quality tests 
- **Time Durations**: 30s(~50w), 1m(~100w), 2m(~200w), 5m(~500w)
- **Difficulty Levels**: Easy, Medium, Hard
- **Categories Available**:
  1. **Technology** - Programming, software development, AI concepts
  2. **Customer Support - VPN** - Technical support, troubleshooting scenarios  
  3. **Business & Finance** - Corporate communications, financial analysis
  4. **Health & Medical** - Healthcare terminology, medical procedures

### **System Architecture Status**
- **✅ Authentication**: Complete Firebase Auth integration
- **✅ Profile Management**: Full CRUD operations with Firestore
- **✅ Typing Engine**: Advanced character-by-character validation with real-time feedback
- **✅ Test Selection**: Dynamic filtering by difficulty and time duration
- **✅ Result Persistence**: Secure API routes with comprehensive validation
- **✅ Dashboard**: Real-time statistics with live data integration
- **✅ History**: Paginated test results with detailed information
- **✅ Settings**: Complete user preference management
- **✅ Test Generation**: Comprehensive guide for adding new categories

### **Next Development Phase**
- **🔄 AI-Generated Tests**: Integration with Google Genkit for dynamic test creation
- **📅 Global Leaderboard**: Planned for future release

### **Documentation Files**
- **TEST_GENERATION_GUIDE.md**: Complete handbook for creating new test categories
- **API_ENDPOINTS.md**: This file - comprehensive API documentation
- **AGENT_LOG.md**: Updated development roadmap with current progress
- **errors.md**: Critical error solutions and troubleshooting guides