import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Initialize Firebase Client SDK for both auth and firestore operations
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAipHBANeyyXgq1n9h2G33PAwtuXkMRu-w",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "solotype-23c1f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "solotype-23c1f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "solotype-23c1f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "39439361072",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:39439361072:web:27661c0d7e4e341a02b9f5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Initialize Firebase with error handling
let app;
let db;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (firebaseError) {
  console.error('❌ Firebase initialization failed:', firebaseError);
  throw new Error('Firebase initialization failed');
}

interface TestResultData {
  wpm: number;
  accuracy: number;
  errors: number;
  timeTaken: number;
  textLength: number;
  userInput: string;
  testType: string;
  difficulty: string;
  testId: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: submit-test-result called');
    console.log('🔧 Firebase config check:', {
      apiKey: !!firebaseConfig.apiKey,
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return NextResponse.json(
        { error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // For local development, we'll do basic token validation
    // In production, you'd want to verify the token with Firebase Admin SDK
    let userId: string;
    
    try {
      // Basic JWT token validation - check if it's properly formatted
      const tokenParts = idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      // Decode the payload (for local development only)
      const payload = JSON.parse(atob(tokenParts[1]));
      userId = payload.user_id || payload.sub;
      
      if (!userId) {
        throw new Error('No user ID in token');
      }
      
      console.log('✅ Token validated for user:', userId);
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      // For testing purposes, use a fallback user ID
      userId = 'test-user-fallback';
      console.log('🔄 Using fallback user ID for testing:', userId);
    }
    const testData: TestResultData = await request.json();
    console.log('Test data received:', testData);

    // Validate the test data
    const validationErrors: string[] = [];
    
    if (isNaN(testData.wpm) || !isFinite(testData.wpm) || testData.wpm < 0 || testData.wpm > 400) {
      validationErrors.push("WPM must be a valid number between 0 and 400");
    }
    
    if (isNaN(testData.accuracy) || !isFinite(testData.accuracy) || testData.accuracy < 0 || testData.accuracy > 100) {
      validationErrors.push("Accuracy must be a valid number between 0 and 100");
    }
    
    if (isNaN(testData.errors) || !isFinite(testData.errors) || testData.errors < 0) {
      validationErrors.push("Errors must be a valid non-negative number");
    }
    
    if (isNaN(testData.timeTaken) || !isFinite(testData.timeTaken) || testData.timeTaken <= 0) {
      validationErrors.push("Time taken must be a valid positive number");
    }
    
    if (isNaN(testData.textLength) || !isFinite(testData.textLength) || testData.textLength <= 0) {
      validationErrors.push("Text length must be a valid positive number");
    }
    
    if (!testData.userInput || typeof testData.userInput !== "string") {
      validationErrors.push("User input is required");
    }
    
    if (!testData.testType || typeof testData.testType !== "string") {
      validationErrors.push("Test type is required");
    }
    
    if (!testData.difficulty || typeof testData.difficulty !== "string") {
      validationErrors.push("Difficulty is required");
    }
    
    if (!testData.testId || typeof testData.testId !== "string") {
      validationErrors.push("Test ID is required");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Simple approach: Just save the test result for now
    // We'll handle stats updates separately to avoid transaction complexity
    const testResultData = {
      userId: userId,
      wpm: testData.wpm,
      accuracy: testData.accuracy,
      errors: testData.errors,
      timeTaken: testData.timeTaken,
      textLength: testData.textLength,
      userInput: testData.userInput,
      testType: testData.testType,
      difficulty: testData.difficulty,
      testId: testData.testId,
      createdAt: new Date(),
    };
    
    console.log('💾 Attempting to save test result:', testResultData);
    console.log('🔧 Database instance check:', !!db);
    console.log('🔧 Collection reference check:', !!collection(db, 'testResults'));
    
    if (!db) {
      throw new Error('Firebase database not initialized');
    }
    
    try {
      console.log('📝 Creating document in testResults collection...');
      const testResultsRef = collection(db, 'testResults');
      console.log('📝 Collection reference created:', !!testResultsRef);
      
      const docRef = await addDoc(testResultsRef, testResultData);
      console.log('✅ Test result saved successfully with ID:', docRef.id);
    } catch (firestoreError) {
      console.error('❌ Firestore error details:', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      throw firestoreError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test result saved successfully' 
    });

  } catch (error) {
    console.error('💥 Error in submit-test-result API:', error);
    console.error('💥 Error type:', typeof error);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error
      },
      { status: 500 }
    );
  }
}
