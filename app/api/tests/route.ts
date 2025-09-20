import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import { PreMadeTest, COLLECTIONS } from '@/lib/types/database';
import { CORRELATION_ID_HEADER } from '@/lib/correlation-id';
import { logger, createApiContext, createTimingContext } from '@/lib/structured-logger';
import { withPerformanceMonitoring } from '@/src/lib/performance-middleware';

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

async function handleGET(request: NextRequest) {
  const { startTime } = createTimingContext();
  const context = createApiContext(request, 'GET /api/tests');
  
  try {
    logger.info(context, 'API Route: tests called');
    
    // Extract query parameters
    const { searchParams } = request.nextUrl;
    const difficulty = searchParams.get('difficulty');
    const timeLimit = searchParams.get('timeLimit');
    const category = searchParams.get('category');
    
    logger.info(context, 'Query parameters extracted', { difficulty, timeLimit, category });

    // Create base query - using test_contents collection as per user's Firestore structure
    let baseQuery = collection(db, COLLECTIONS.TEST_CONTENTS);
    const constraints: QueryConstraint[] = [];

    // Add difficulty filter if provided and valid
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      constraints.push(where('difficulty', '==', difficulty));
      logger.info(context, 'Applied difficulty filter', { difficulty });
    }

    // Add time limit filter if provided (convert seconds to match database)
    if (timeLimit) {
      const timeLimitSeconds = parseInt(timeLimit);
      constraints.push(where('timeLimit', '==', timeLimitSeconds));
      logger.info(context, 'Applied time limit filter', { timeLimitSeconds });
    }

    // Add category filter if provided
    if (category) {
      constraints.push(where('category', '==', category));
      logger.info(context, 'Applied category filter', { category });
    }

    // Create final query with constraints
    const finalQuery = constraints.length > 0 ? query(baseQuery, ...constraints) : baseQuery;

    // Execute the query
    logger.info(context, 'Executing Firestore query', { constraintsCount: constraints.length });
    const querySnapshot = await getDocs(finalQuery);
    
    // Process the results
    const results: PreMadeTest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Create formatted object matching PreMadeTest interface
      const testData: PreMadeTest = {
        id: doc.id,
        text: data.text || '',
        difficulty: data.difficulty || 'Medium',
        category: data.category || 'general_practice',
        source: data.source || 'Practice',
        wordCount: data.wordCount || 0,
        timeLimit: data.timeLimit || 60,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      
      results.push(testData);
    });

    logger.info(context, 'Successfully fetched tests', { testsFound: results.length });

    // Return formatted response with correlation ID in headers
    const response = NextResponse.json({
      tests: results,
      total: results.length
    });
    
    const correlationId = request.headers.get(CORRELATION_ID_HEADER) || 'unknown';
    response.headers.set(CORRELATION_ID_HEADER, correlationId);
    
    // Log the successful request
    logger.logRequest(context, startTime, 200, { testsReturned: results.length });
    
    return response;

  } catch (error) {
    logger.error(context, error instanceof Error ? error : new Error(String(error)));
    
    // Return detailed error information for debugging
    const correlationId = request.headers.get(CORRELATION_ID_HEADER) || 'unknown';
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to fetch tests',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        correlationId
      },
      { status: 500 }
    );
    
    errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
    
    // Log the failed request
    logger.logRequest(context, startTime, 500, { errorMessage: error instanceof Error ? error.message : String(error) });
    
    return errorResponse;
  }
}

// Export the performance-monitored version
export const GET = withPerformanceMonitoring(handleGET, {
  enablePayloadTracking: false, // GET requests don't have request payloads
  slowRequestThreshold: 1500, // 1.5 seconds for database queries
  maxPayloadSizeToLog: 10000
});
