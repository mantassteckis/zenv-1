// lib/types/database.ts

import { Timestamp } from 'firebase/firestore';

// Collection Names
export const COLLECTIONS = {
  PROFILES: 'profiles',
  PRE_MADE_TESTS: 'preMadeTests', // Legacy name - actual collection is test_contents
  TEST_CONTENTS: 'test_contents', // Actual collection name in Firestore
  AI_GENERATED_TESTS: 'aiGeneratedTests',
  TEST_RESULTS: 'testResults', // This will be a subcollection under profiles
};

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  photoURL?: string;
  createdAt: string; // ISO String
  bio?: string; // User's short biography
  preferredThemeId?: string; // e.g., "neon-wave"
  preferredFontId?: string; // e.g., "fira-code"
  settings?: {
    keyboardSounds?: boolean;
    visualFeedback?: boolean;
  };
  stats: {
    rank: string;
    testsCompleted: number;
    avgWpm: number;
    avgAcc: number;
  };
}

export interface PreMadeTest {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string; // e.g., 'basic_typing', 'general_practice', 'technical_typing'
  source: string; // e.g., 'Technology', 'Nature', 'History', 'Practice'
  wordCount: number; // Number of words in the test
  createdAt: string; // ISO string timestamp
}

export interface TestResult {
  id: string; // Document ID for the test result
  textLength: number; // Length of the text that was typed
  userInput: string; // What the user actually typed
  wpm: number;
  accuracy: number;
  errors: number;
  timeTaken: number; // in seconds (renamed from duration)
  testType: string; // 'practice', 'ai-generated', etc.
  difficulty: string; // 'Easy', 'Medium', 'Hard'
  completedAt: string; // ISO string (renamed from timestamp)
}

export interface AiGeneratedTest extends PreMadeTest {
  // AI-specific fields, if any, can extend PreMadeTest
  generatedByAi: boolean;
}
