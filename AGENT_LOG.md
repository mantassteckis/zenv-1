## ZenType Development Roadmap

### Phase 1: Foundational Backend & Logic Layer

#### Part A: Codebase Analysis
- [x] Map the Component Structure: List all the major UI components in the /components directory and the pages in the /app directory. For each, write a one-sentence description of its visual purpose.
- [x] Identify Key Interactive Elements: Go through the page files (/app/login/page.tsx, /app/test/page.tsx, etc.) and identify the key UI elements that will require backend logic. Create a list.
- [x] Confirm Understanding: State that you have completed the analysis and are ready to begin implementation.

#### Part B: Foundational Setup
- [x] Create Project Documentation: Create a file named AGENT_LOG.md in the project root. Paste our multi-part development roadmap into this file to serve as your master checklist.
- [x] Create Project Documentation: Create API_ENDPOINTS.md. For now, leave it with just a title.
- [x] Install Dependencies & Configure Environment: Run pnpm install firebase.
- [x] Install Dependencies & Configure Environment: Create a .env.local file. Add placeholders for the standard Firebase client-side API keys.
- [x] Define Data Models (The "Source of Truth"): Create the directory /lib/types.
- [x] Define Data Models (The "Source of Truth"): Inside, create database.ts. Populate this file with the TypeScript interfaces for UserProfile, PreMadeTest, and TestResult.
- [x] Implement Firebase Core: Create the directory /lib/firebase.
- [x] Implement Firebase Core: Inside, create client.ts. Implement the standard Firebase initialization logic in this file to configure and export auth, db, and functions.
- [x] Implement the Core Authentication Context: Create the directory /context.
- [x] Implement the Core Authentication Context: Inside, create AuthProvider.tsx. Implement the AuthProvider component and a useAuth hook.
- [x] Update AGENT_LOG.md by checking off the completed tasks for Phase 1.
- [x] Confirm completion of Phase 1 and readiness for Phase 2.

### Phase 2: User Authentication and Profile Management

#### Part A: Firebase Authentication Integration
- [x] Implemented email/password signup (app/signup/page.tsx)
- [x] Implemented Google sign-in/signup (app/signup/page.tsx, app/login/page.tsx)
- [x] Implemented email/password login (app/login/page.tsx)
- [x] Implemented anonymous guest sign-in (app/login/page.tsx)
- [x] Updated Header component for dynamic auth display and sign-out (components/header.tsx)

#### Part B: Profile Data Management
- [x] Implement Profile CRUD Operations: Create /lib/firebase/firestore.ts. Implement functions for fetching, updating, and deleting user profiles.
- [x] Connect Profile to UI: Integrate profile data into the Header (user menu) and Dashboard/Settings pages.

#### Part C: Core Typing Game Logic
- [x] Created useTypingGame hook (hooks/useTypingGame.ts)
- [x] Connected Test Page to useTypingGame hook (app/test/page.tsx)
- [x] **COMPREHENSIVE REFACTOR COMPLETED**: Implemented complete self-contained typing engine in app/test/page.tsx with:
  - [x] Clean foundational state management (view control, test config, typing engine state)
  - [x] Complete test lifecycle functions (startTest, endTest, tryAgain)
  - [x] Robust character-by-character typing engine with handleKeyDown function
  - [x] Accurate timer logic with pause/resume functionality
  - [x] Real-time WPM and accuracy calculations
  - [x] Proper error counting and visual feedback
  - [x] Full UI state flow (config → active → results)
  - [x] Timer starts with ENTER key press (reliable approach)
  - [x] Character-by-character validation with real-time feedback
  - [x] Backspace handling with proper state management
  - [x] Extended text content for proper testing (800+ characters)
  - [x] All keystroke input working perfectly
  - [x] Timer functionality working correctly
  - [x] Pause/Resume functionality working properly

#### Part D: UI Customization (Client-Side Persistence)
- [x] Implemented saving theme and font choices to local storage
- [x] Implemented loading theme and font choices from local storage
- [x] **PROFILE-BASED PERSISTENCE COMPLETED**: Implemented persistent theme/font preferences in user profiles with automatic loading on app startup

### Phase 3: Typing Test Core Logic

#### Part A: Pre-made Test Management
- [x] Implement PreMadeTest Fetching: Create API routes (Next.js API Route Handlers) to fetch pre-made typing tests from Firestore.
- [x] Integrate PreMadeTests with UI: Populate the 'Practice Test' tab in /app/test/page.tsx with pre-made test options.
- [x] **COMPREHENSIVE PRE-MADE TEST SYSTEM COMPLETED**: Implemented complete dynamic test selection system with:
  - [x] API Route `/api/tests` with smart Firestore filtering by difficulty, timeLimit, and category
  - [x] Frontend integration with loading states, error handling, and test selection UI
  - [x] Test selection interface with visual previews and difficulty badges
  - [x] Dynamic "Start Typing" button that requires test selection in practice mode
  - [x] Seamless integration with existing typing engine and result saving
  - [x] Proper state management preventing conflicts between practice and AI-generated tabs
  - [x] Real-time test loading based on user's difficulty and time preferences
  - [x] Complete error handling with retry functionality and user feedback

#### Part B: AI-Generated Test Logic
- [ ] Implement AI Test Generation Function: Create a Firebase Cloud Function for generating typing tests using Google Genkit based on user-provided topics.
- [ ] Integrate AI Test Generation with UI: Connect the 'AI-Generated Test' tab in /app/test/page.tsx to the Cloud Function.

#### Part C: Test Result Storage
- [x] Implement Test Result Saving: Create a Firebase Cloud Function to save user test results to Firestore (testResults collection).
- [x] Integrate Test Result Saving with UI: After a test is completed, send the results to the Cloud Function.
- [x] **COMPREHENSIVE DATA PERSISTENCE LAYER COMPLETED**: Implemented complete secure backend for test result submission with:
  - [x] Secure Cloud Function with authentication guards and server-side validation
  - [x] Firestore transaction-based data consistency (test result + user stats update)
  - [x] Frontend integration using httpsCallable for secure test submission
  - [x] Real-time dashboard display of recent test results from Firestore
  - [x] Paginated history page with live data from testResults collection
  - [x] Complete data flow from test completion to dashboard/history display

### Phase 4: Dashboard and History

#### Part A: Dashboard Display
- [ ] Implement Dashboard Data Fetching: Create API routes to fetch aggregated user performance data and recent test results from Firestore.
- [ ] Integrate Dashboard Data with UI: Populate /app/dashboard/page.tsx with the fetched data.

#### Part B: History View
- [ ] Implement Test History Fetching: Create API routes to fetch a list of all past test results for the logged-in user.
- [ ] Integrate Test History with UI: Display the history in /app/history/page.tsx.

### Phase 5: Leaderboard and Settings

#### Part A: Leaderboard
- [ ] Implement Leaderboard Data Fetching: Create API routes to fetch global top typing performances from Firestore.
- [ ] Integrate Leaderboard with UI: Display the leaderboard in /app/leaderboard/page.tsx.

#### Part B: Settings Management
- [ ] Implement User Settings Update: Create Firebase Cloud Functions to update user settings (e.g., username, typing preferences).
- [ ] Integrate Settings Update with UI: Connect /app/settings/page.tsx to the Cloud Functions.
