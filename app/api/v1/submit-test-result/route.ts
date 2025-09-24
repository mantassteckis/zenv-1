import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { collection, addDoc } from 'firebase-admin/firestore';
import { logger, createApiContext, createTimingContext } from '@/lib/structured-logger';
import { CORRELATION_ID_HEADER } from '@/lib/correlation-id';
import { withPerformanceMonitoring } from '@/src/lib/performance-middleware';
import { getAuth } from 'firebase-admin/auth';

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

async function handlePOST(request: NextRequest) {
  const { startTime } = createTimingContext();
  const context = createApiContext(request, 'POST /api/v1/submit-test-result');
  const correlationId = request.headers.get(CORRELATION_ID_HEADER) || `v1-submit-${Date.now()}`;
  
  try {
    logger.info(context, 'V1 API Route: submit-test-result called', { 
      correlationId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });

    // Enhanced Firebase Admin SDK validation
    if (!db) {
      logger.error(context, new Error('Firebase Admin SDK not initialized'), { 
        correlationId,
        step: 'FIREBASE_VALIDATION'
      });
      throw new Error('Firebase Admin SDK not initialized');
    }

    logger.info(context, 'Firebase Admin SDK validated successfully', { 
      correlationId,
      step: 'FIREBASE_VALIDATED'
    });

    // Enhanced authentication with detailed logging
    const authHeader = request.headers.get('authorization');
    logger.info(context, 'Authentication validation started', { 
      correlationId,
      authHeaderPresent: !!authHeader,
      authHeaderFormat: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer format' : 'Invalid format') : 'Missing',
      step: 'AUTH_VALIDATION_START'
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(context, 'Invalid or missing authorization header', { 
        correlationId,
        authHeader: authHeader ? 'Present but invalid format' : 'Missing',
        step: 'AUTH_VALIDATION_FAILED'
      });
      
      const errorResponse = NextResponse.json(
        { 
          error: 'Authentication required', 
          details: 'Valid Bearer token required',
          correlationId
        },
        { status: 401 }
      );
      errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
      logger.logRequest(context, startTime, 401, { reason: 'Missing auth header' });
      return errorResponse;
    }

    const idToken = authHeader.split('Bearer ')[1];
    logger.info(context, 'ID token extracted', { 
      correlationId,
      tokenLength: idToken.length,
      tokenPrefix: idToken.substring(0, 20) + '...',
      step: 'TOKEN_EXTRACTED'
    });

    let decodedToken;
    let userId: string;

    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(idToken);
      userId = decodedToken.uid;
      
      logger.info(context, 'Token verification successful', { 
        correlationId,
        userId: userId,
        userEmail: decodedToken.email || 'No email',
        tokenIssuer: decodedToken.iss,
        tokenAudience: decodedToken.aud,
        step: 'TOKEN_VERIFIED'
      });
    } catch (authError) {
      logger.error(context, authError instanceof Error ? authError : new Error(String(authError)), {
        correlationId,
        errorCode: (authError as any)?.code,
        errorMessage: (authError as any)?.message,
        step: 'TOKEN_VERIFICATION_FAILED'
      });
      
      const errorResponse = NextResponse.json(
        { 
          error: 'Invalid authentication token', 
          details: authError instanceof Error ? authError.message : 'Token verification failed',
          correlationId
        },
        { status: 401 }
      );
      errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
      logger.logRequest(context, startTime, 401, { reason: 'Token verification failed' });
      return errorResponse;
    }

    // Enhanced request body parsing with validation
    let testData: TestResultData;
    try {
      testData = await request.json();
      logger.info(context, 'Request body parsed successfully', { 
        correlationId,
        userId,
        dataKeys: Object.keys(testData),
        wpm: testData.wpm,
        accuracy: testData.accuracy,
        testType: testData.testType,
        difficulty: testData.difficulty,
        step: 'REQUEST_PARSED'
      });
    } catch (parseError) {
      logger.error(context, parseError instanceof Error ? parseError : new Error(String(parseError)), {
        correlationId,
        userId,
        step: 'REQUEST_PARSE_FAILED'
      });
      
      const errorResponse = NextResponse.json(
        { 
          error: 'Invalid request body', 
          details: 'Request body must be valid JSON',
          correlationId
        },
        { status: 400 }
      );
      errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
      logger.logRequest(context, startTime, 400, { reason: 'JSON parse failed' });
      return errorResponse;
    }

    // Enhanced data validation with detailed error reporting
    const validationErrors: string[] = [];
    
    if (typeof testData.wpm !== 'number' || testData.wpm < 0 || testData.wpm > 400) {
      validationErrors.push('WPM must be a number between 0 and 400');
    }
    if (typeof testData.accuracy !== 'number' || testData.accuracy < 0 || testData.accuracy > 100) {
      validationErrors.push('Accuracy must be a number between 0 and 100');
    }
    if (typeof testData.errors !== 'number' || testData.errors < 0) {
      validationErrors.push('Errors must be a non-negative number');
    }
    if (typeof testData.timeTaken !== 'number' || testData.timeTaken <= 0) {
      validationErrors.push('Time taken must be a positive number');
    }
    if (typeof testData.textLength !== 'number' || testData.textLength <= 0) {
      validationErrors.push('Text length must be a positive number');
    }
    if (!testData.userInput || typeof testData.userInput !== 'string') {
      validationErrors.push('User input is required and must be a string');
    }
    if (!testData.testType || typeof testData.testType !== 'string') {
      validationErrors.push('Test type is required and must be a string');
    }
    if (!testData.difficulty || typeof testData.difficulty !== 'string') {
      validationErrors.push('Difficulty is required and must be a string');
    }
    if (!testData.testId || typeof testData.testId !== 'string') {
      validationErrors.push('Test ID is required and must be a string');
    }

    if (validationErrors.length > 0) {
      logger.warn(context, 'Data validation failed', { 
        correlationId,
        userId,
        validationErrors,
        receivedData: {
          wpm: testData.wpm,
          accuracy: testData.accuracy,
          errors: testData.errors,
          timeTaken: testData.timeTaken,
          textLength: testData.textLength,
          testType: testData.testType,
          difficulty: testData.difficulty,
          testId: testData.testId
        },
        step: 'VALIDATION_FAILED'
      });
      
      const errorResponse = NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationErrors,
          correlationId
        },
        { status: 400 }
      );
      errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
      logger.logRequest(context, startTime, 400, { validationErrors });
      return errorResponse;
    }

    logger.info(context, 'Data validation passed', { 
      correlationId,
      userId,
      step: 'VALIDATION_PASSED'
    });

    // Enhanced Firestore write with Admin SDK pattern
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
      correlationId: correlationId, // Add correlation ID for debugging
    };
    
    logger.info(context, 'Preparing Firestore write operation', { 
      correlationId,
      userId,
      collection: 'testResults',
      documentSize: JSON.stringify(testResultData).length,
      step: 'FIRESTORE_WRITE_PREP'
    });

    try {
      // Use Firebase Admin SDK for direct Firestore write (following leaderboard pattern)
      const testResultsRef = db.collection('testResults');
      const docRef = await testResultsRef.add(testResultData);
      
      logger.info(context, 'Test result saved successfully to Firestore', { 
        correlationId,
        userId,
        documentId: docRef.id,
        collection: 'testResults',
        step: 'FIRESTORE_WRITE_SUCCESS'
      });

      // Enhanced success response
      const successResponse = NextResponse.json({ 
        success: true, 
        message: 'Test result saved successfully',
        documentId: docRef.id,
        correlationId,
        timestamp: new Date().toISOString()
      });
      successResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
      
      logger.logRequest(context, startTime, 200, { 
        documentId: docRef.id,
        firestoreSuccess: true
      });
      return successResponse;

    } catch (firestoreError) {
      logger.error(context, firestoreError instanceof Error ? firestoreError : new Error(String(firestoreError)), {
        correlationId,
        userId,
        errorCode: (firestoreError as any)?.code,
        errorMessage: (firestoreError as any)?.message,
        step: 'FIRESTORE_WRITE_FAILED'
      });
      
      const errorResponse = NextResponse.json(
        { 
          error: 'Database operation failed', 
          details: firestoreError instanceof Error ? firestoreError.message : 'Unknown database error',
          correlationId
        },
        { status: 500 }
      );
      errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
      logger.logRequest(context, startTime, 500, { 
        firestoreError: firestoreError instanceof Error ? firestoreError.message : String(firestoreError)
      });
      return errorResponse;
    }

  } catch (error) {
    logger.error(context, error instanceof Error ? error : new Error(String(error)), {
      correlationId,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      step: 'CRITICAL_ERROR'
    });
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    );
    errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
    
    logger.logRequest(context, startTime, 500, { 
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return errorResponse;
  }
}

// Export the performance-monitored version with enhanced configuration
export const POST = withPerformanceMonitoring(handlePOST, {
  enablePayloadTracking: true,
  slowRequestThreshold: 3000, // 3 seconds for database operations
  maxPayloadSizeToLog: 10000 // Increased for detailed logging
});