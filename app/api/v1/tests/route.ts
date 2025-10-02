import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, QueryConstraint, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
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
let app: any;
let db: any;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (firebaseError) {
  console.error('❌ Firebase initialization failed:', firebaseError);
  throw new Error('Firebase initialization failed');
}

/**
 * Handle GET requests to list pre-made tests with optional filters and cursor-based pagination.
 *
 * Supports query parameters: `difficulty`, `timeLimit`, `category`, `limit` (default 20, max 50), and `cursor`.
 *
 * @returns A JSON HTTP response. On success the body contains `data` (array of `PreMadeTest`) and `pagination` (with `nextCursor`, `hasNextPage`, `limit`, and `count`). On failure the body contains an error payload with `error`, `message`, and `correlationId`, and the response status is 500.
 */
async function handleGET(request: NextRequest) {
  const { startTime } = createTimingContext();
  const context = createApiContext(request, 'GET /api/v1/tests');
  
  try {
    logger.info(context, 'API Route: v1/tests called');
    
    // Extract query parameters
    const { searchParams } = request.nextUrl;
    const difficulty = searchParams.get('difficulty');
    const timeLimit = searchParams.get('timeLimit');
    const category = searchParams.get('category');
    
    // Pagination parameters
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor');
    const pageLimit = limitParam ? Math.min(parseInt(limitParam), 50) : 20; // Default 20, max 50
    
    logger.info(context, 'Query parameters extracted', { 
      difficulty, 
      timeLimit, 
      category, 
      limit: pageLimit, 
      cursor: cursor ? 'provided' : 'none' 
    });

    // Create base query - using test_contents collection as per user's Firestore structure
    let baseQuery = collection(db, COLLECTIONS.TEST_CONTENTS);
    const constraints: QueryConstraint[] = [];

    // Add filters based on query parameters
    if (difficulty) {
      constraints.push(where('difficulty', '==', difficulty));
      logger.info(context, 'Added difficulty filter', { difficulty });
    }

    if (timeLimit) {
      const timeLimitNum = parseInt(timeLimit);
      if (!isNaN(timeLimitNum)) {
        constraints.push(where('timeLimit', '==', timeLimitNum));
        logger.info(context, 'Added timeLimit filter', { timeLimit: timeLimitNum });
      }
    }

    if (category) {
      constraints.push(where('category', '==', category));
      logger.info(context, 'Added category filter', { category });
    }

    // Add ordering for consistent pagination
    constraints.push(orderBy('__name__')); // Order by document ID for consistent pagination
    
    // Add pagination limit
    constraints.push(limit(pageLimit + 1)); // Fetch one extra to check if there's a next page

    // Handle cursor-based pagination
    if (cursor) {
      try {
        const cursorDoc = await getDoc(doc(db, COLLECTIONS.TEST_CONTENTS, cursor));
        if (cursorDoc.exists()) {
          constraints.push(startAfter(cursorDoc));
          logger.info(context, 'Added cursor pagination', { cursor });
        } else {
          logger.warn(context, 'Invalid cursor provided', { cursor });
        }
      } catch (cursorError) {
        logger.warn(context, 'Error processing cursor', { cursor, error: cursorError });
      }
    }

    // Execute query
    const finalQuery = query(baseQuery, ...constraints);
    const querySnapshot = await getDocs(finalQuery);
    
    logger.info(context, 'Firestore query executed', { 
      constraintsCount: constraints.length,
      resultsCount: querySnapshot.size 
    });

    // Transform documents to PreMadeTest format
    const allTests: PreMadeTest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allTests.push({
        id: doc.id,
        text: data.text || '',
        difficulty: data.difficulty || 'Medium',
        category: data.category || 'General',
        source: data.source || 'Unknown',
        wordCount: data.wordCount || 0,
        timeLimit: data.timeLimit || 60,
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    // Determine if there's a next page and prepare response
    const hasNextPage = allTests.length > pageLimit;
    const tests = hasNextPage ? allTests.slice(0, pageLimit) : allTests;
    const nextCursor = hasNextPage ? tests[tests.length - 1].id : null;

    logger.info(context, 'Tests transformed successfully', { 
      testsCount: tests.length,
      hasNextPage,
      nextCursor: nextCursor ? 'provided' : 'none'
    });

    // Create paginated response format
    const responseData = {
      data: tests,
      pagination: {
        nextCursor,
        hasNextPage,
        limit: pageLimit,
        count: tests.length
      }
    };

    const response = NextResponse.json(responseData);
    response.headers.set(CORRELATION_ID_HEADER, context.correlationId || 'unknown');
    
    logger.info(context, 'API Route: v1/tests completed successfully', { 
      testsReturned: tests.length,
      responseTime: Date.now() - startTime 
    });
    
    return response;

  } catch (error) {
    logger.error(context, 'Error in v1/tests API route', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: Date.now() - startTime 
    });

    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to fetch tests',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        correlationId: context.correlationId || 'unknown'
      },
      { status: 500 }
    );
    errorResponse.headers.set(CORRELATION_ID_HEADER, context.correlationId || 'unknown');
    return errorResponse;
  }
}

// Export the handler with performance monitoring
export const GET = withPerformanceMonitoring(handleGET);