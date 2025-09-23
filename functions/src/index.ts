import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { firebaseLogger, createFirebaseContext, createTimingContext } from './structured-logger';
// Import config to load environment variables
import './config';
// Import log drain function
export { vercelLogDrain } from './vercel-log-drain';
// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// Interface for test result data
interface TestResultData {
  wpm: number;
  accuracy: number;
  errors: number;
  timeTaken: number;
  textLength: number;
  userInput: string;
  testType: string;
  difficulty: string;
  testId?: string; // Optional for practice tests
}

// Interface for AI test generation data
interface AiTestRequestData {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  saveTest: boolean;
  timeLimit?: number; // Optional time limit in seconds (30, 60, 120, 300)
  userInterests?: string[]; // Optional user interests to personalize content
}

/**
 * Constructs system prompt for AI typing test generation
 * Based on TEST_GENERATION_GUIDE.md specifications
 * TODO: Uncomment and use when real AI integration is implemented
 */
/*
function buildSystemPrompt(difficulty: string): string {
  const basePrompt = `You are an expert typing coach creating engaging typing tests for users to practice their typing skills. Your goal is to generate professional, educational, and engaging content.

CRITICAL REQUIREMENTS:
- Generate EXACTLY ~100 words (90-110 words acceptable range)
- Content must be a single continuous paragraph with NO line breaks or special formatting
- Use proper punctuation, grammar, and natural sentence flow
- Content should be educational and informative about the given topic
- Avoid repetitive phrases or words
- Include varied sentence lengths for interesting typing practice`;

  let difficultyInstructions = "";
  
  switch (difficulty) {
    case 'Easy':
      difficultyInstructions = `
DIFFICULTY: EASY
- Use basic vocabulary and simple concepts
- Write in everyday language that's accessible to beginners
- Keep sentence structures straightforward
- Focus on fundamental ideas without overwhelming complexity
- Avoid technical jargon or advanced terminology`;
      break;
    
    case 'Medium':
      difficultyInstructions = `
DIFFICULTY: MEDIUM  
- Incorporate professional terminology and industry-specific language
- Use moderate technical complexity
- Include some specialized vocabulary while remaining comprehensible
- Balance accessibility with more sophisticated concepts
- Appropriate for intermediate-level practitioners`;
      break;
    
    case 'Hard':
      difficultyInstructions = `
DIFFICULTY: HARD
- Use advanced professional vocabulary and complex concepts
- Include specialized terminology and technical language
- Employ sophisticated sentence structures and complex ideas
- Require expert-level understanding of the topic
- Use cutting-edge or highly specialized concepts`;
      break;
  }

  return basePrompt + difficultyInstructions + `

Remember: Generate ONLY the typing test content as a single paragraph. Do not include any explanations, titles, or metadata - just the ~100-word paragraph for typing practice.`;
}
*/

/**
 * This function has been replaced by the Gemini AI implementation in genkit_functions.ts
 * Keeping this as a fallback in case the AI service is unavailable
 */
function generatePlaceholderContent(topic: string, difficulty: string): string {
  // Return a simple message indicating AI is being used
  return `This is a fallback message. The Gemini AI service should be generating content about ${topic} at ${difficulty} difficulty level. If you're seeing this message, there might be an issue with the AI service or API key configuration.`;
}

/**
 * Secure Cloud Function to submit test results
 * Validates data, saves to Firestore, and updates user stats
 */
export const submitTestResult = onCall({
  cors: [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000",
    "http://localhost:3001",
    "https://localhost:3001",
    "http://127.0.0.1:3001",
    "https://127.0.0.1:3001"
  ]
}, async (request) => {
  const { startTime } = createTimingContext();
  
  // Authentication Guard
  if (!request.auth) {
    const context = createFirebaseContext('submitTestResult');
    firebaseLogger.warn(context, "Unauthenticated request to submitTestResult");
    throw new HttpsError("unauthenticated", "User must be authenticated to submit test results");
  }

  const userId = request.auth.uid;
  const context = createFirebaseContext('submitTestResult', userId);
  firebaseLogger.info(context, "Test result submission request");

  // Data Extraction & Validation
  const testData = request.data as TestResultData;
  
  if (!testData) {
    firebaseLogger.warn(context, "No test data provided");
    throw new HttpsError("invalid-argument", "Test data is required");
  }
  
  firebaseLogger.info(context, "Test data received", {
    wpm: testData.wpm,
    accuracy: testData.accuracy,
    testType: testData.testType,
    difficulty: testData.difficulty
  });

  // Server-side validation
  const validationErrors: string[] = [];
  
  // Check for NaN values first
  if (isNaN(testData.wpm) || !isFinite(testData.wpm)) {
    validationErrors.push("WPM must be a valid number");
  } else if (testData.wpm < 0 || testData.wpm > 400) {
    validationErrors.push("WPM must be between 0 and 400");
  }
  
  if (isNaN(testData.accuracy) || !isFinite(testData.accuracy)) {
    validationErrors.push("Accuracy must be a valid number");
  } else if (testData.accuracy < 0 || testData.accuracy > 100) {
    validationErrors.push("Accuracy must be between 0 and 100");
  }
  
  if (isNaN(testData.errors) || !isFinite(testData.errors)) {
    validationErrors.push("Errors must be a valid number");
  } else if (testData.errors < 0) {
    validationErrors.push("Errors must be non-negative");
  }
  
  if (isNaN(testData.timeTaken) || !isFinite(testData.timeTaken)) {
    validationErrors.push("Time taken must be a valid number");
  } else if (testData.timeTaken <= 0) {
    validationErrors.push("Time taken must be positive");
  }
  
  if (isNaN(testData.textLength) || !isFinite(testData.textLength)) {
    validationErrors.push("Text length must be a valid number");
  } else if (testData.textLength <= 0) {
    validationErrors.push("Text length must be positive");
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

  if (validationErrors.length > 0) {
    firebaseLogger.warn(context, "Validation failed", { validationErrors });
    throw new HttpsError("invalid-argument", `Validation failed: ${validationErrors.join(", ")}`);
  }

  try {
    // Firestore Transaction
    await db.runTransaction(async (transaction) => {
      // Transaction Step A - Write New Test Result
      const testResultRef = db.collection("testResults").doc();
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
        testId: testData.testId || null,
        createdAt: new Date().toISOString(),
      };

      transaction.set(testResultRef, testResultData);
      firebaseLogger.info(context, "Test result document created", { testResultId: testResultRef.id });

      // Transaction Step B - Update User Profile Stats
      const userProfileRef = db.collection("profiles").doc(userId);
      const userProfileDoc = await transaction.get(userProfileRef);

      if (!userProfileDoc.exists) {
        firebaseLogger.warn(context, "User profile not found during stats update");
        throw new HttpsError("not-found", "User profile not found");
      }

      const userProfile = userProfileDoc.data();
      const currentStats = userProfile?.stats || {
        rank: "E",
        testsCompleted: 0,
        avgWpm: 0,
        avgAcc: 0,
      };

      // Calculate new aggregate stats
      const newTestsCompleted = currentStats.testsCompleted + 1;
      
      // Calculate new average WPM
      const totalWpm = (currentStats.avgWpm * currentStats.testsCompleted) + testData.wpm;
      const newAvgWpm = Math.round(totalWpm / newTestsCompleted);
      
      // Calculate new average accuracy
      const totalAcc = (currentStats.avgAcc * currentStats.testsCompleted) + testData.accuracy;
      const newAvgAcc = Math.round(totalAcc / newTestsCompleted);

      // Calculate rank based on average WPM
      let newRank = "E";
      if (newAvgWpm >= 80) newRank = "S";
      else if (newAvgWpm >= 60) newRank = "A";
      else if (newAvgWpm >= 40) newRank = "B";
      else if (newAvgWpm >= 20) newRank = "C";
      else if (newAvgWpm >= 10) newRank = "D";

      const updatedStats = {
        rank: newRank,
        testsCompleted: newTestsCompleted,
        avgWpm: newAvgWpm,
        avgAcc: newAvgAcc,
      };

      transaction.update(userProfileRef, { stats: updatedStats });
      logger.info("User stats updated", { userId, updatedStats });
    });

    firebaseLogger.logFunction(context, startTime, true);
    firebaseLogger.info(context, "Test result submitted successfully");
    return { success: true, message: "Test result saved successfully" };

  } catch (error) {
    firebaseLogger.logFunction(context, startTime, false);
    firebaseLogger.error(context, error as Error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError("internal", "Failed to save test result");
  }
});

/**
 * Secure Cloud Function to generate AI-powered typing tests
 * Uses Google AI through Genkit to create custom typing content
 */
export const generateAiTest = onCall({
  cors: [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000",
    "http://localhost:3001",
    "https://localhost:3001",
    "http://127.0.0.1:3001",
    "https://127.0.0.1:3001"
  ]
}, async (request) => {
  // Enhanced debug logging for Cloud Function entry
  logger.info("🔍 DEBUG: generateAiTest function called", {
    hasAuth: !!request.auth,
    hasData: !!request.data,
    requestKeys: request ? Object.keys(request) : [],
    timestamp: new Date().toISOString()
  });

  // Authentication Guard
  if (!request.auth) {
    logger.warn("🚨 DEBUG: Unauthenticated request to generateAiTest", {
      auth: request.auth,
      rawAuth: request.rawRequest?.headers?.authorization
    });
    throw new HttpsError("unauthenticated", "User must be authenticated to generate AI tests");
  }

  const userId = request.auth.uid;
  logger.info("✅ DEBUG: Authentication successful", { 
    userId,
    authProvider: (request.auth as any)?.firebase?.sign_in_provider || 'unknown',
    authTime: (request.auth as any)?.firebase?.auth_time || 'unknown'
  });

  // Data Extraction & Validation
  const requestData = request.data as AiTestRequestData;
  
  logger.debug("🔍 DEBUG: Request data received", {
    userId,
    dataType: typeof requestData,
    dataKeys: requestData ? Object.keys(requestData) : [],
    rawData: requestData,
    dataSize: JSON.stringify(requestData || {}).length,
    userInterests: requestData?.userInterests || 'none'
  });

  if (!requestData) {
    logger.warn("🚨 DEBUG: No request data provided", { 
      userId,
      requestDataType: typeof requestData,
      requestDataValue: requestData 
    });
    throw new HttpsError("invalid-argument", "Request data is required");
  }

  // Enhanced server-side validation with detailed logging
  const validationErrors: string[] = [];
  
  logger.debug("🔍 DEBUG: Starting input validation", {
    userId,
    topic: requestData.topic,
    topicType: typeof requestData.topic,
    difficulty: requestData.difficulty,
    difficultyType: typeof requestData.difficulty,
    saveTest: requestData.saveTest,
    saveTestType: typeof requestData.saveTest
  });

  if (!requestData.topic || typeof requestData.topic !== "string") {
    validationErrors.push("Topic is required and must be a string");
    logger.warn("🚨 DEBUG: Topic validation failed", {
      topic: requestData.topic,
      type: typeof requestData.topic,
      userId
    });
  } else if (requestData.topic.trim().length === 0) {
    validationErrors.push("Topic cannot be empty");
    logger.warn("🚨 DEBUG: Topic is empty", {
      topicLength: requestData.topic.length,
      topicTrimmedLength: requestData.topic.trim().length,
      userId
    });
  } else if (requestData.topic.trim().length > 200) {
    validationErrors.push("Topic must be 200 characters or less");
    logger.warn("🚨 DEBUG: Topic too long", {
      topicLength: requestData.topic.trim().length,
      userId
    });
  }
  
  if (!requestData.difficulty || typeof requestData.difficulty !== "string") {
    validationErrors.push("Difficulty is required and must be a string");
    logger.warn("🚨 DEBUG: Difficulty validation failed", {
      difficulty: requestData.difficulty,
      type: typeof requestData.difficulty,
      userId
    });
  } else if (!['Easy', 'Medium', 'Hard'].includes(requestData.difficulty)) {
    validationErrors.push("Difficulty must be one of: Easy, Medium, Hard");
    logger.warn("🚨 DEBUG: Invalid difficulty value", {
      difficulty: requestData.difficulty,
      validValues: ['Easy', 'Medium', 'Hard'],
      userId
    });
  }
  
  if (typeof requestData.saveTest !== "boolean") {
    validationErrors.push("SaveTest must be a boolean value");
    logger.warn("🚨 DEBUG: SaveTest validation failed", {
      saveTest: requestData.saveTest,
      type: typeof requestData.saveTest,
      userId
    });
  }

  if (validationErrors.length > 0) {
    logger.warn("🚨 DEBUG: Validation failed with errors", { 
      userId, 
      errors: validationErrors,
      requestData 
    });
    throw new HttpsError("invalid-argument", `Validation failed: ${validationErrors.join(", ")}`);
  }

  logger.info("✅ DEBUG: Input validation passed", {
    userId,
    topic: requestData.topic.trim(),
    difficulty: requestData.difficulty,
    saveTest: requestData.saveTest
  });

  try {
    logger.info("🚀 DEBUG: Starting AI test generation process", { 
      userId, 
      topic: requestData.topic, 
      difficulty: requestData.difficulty,
      saveTest: requestData.saveTest,
      step: "GENERATION_START"
    });

    // Generate content using Gemini AI
    logger.debug("🔍 DEBUG: Calling Gemini AI content generator", {
      userId,
      topic: requestData.topic.trim(),
      difficulty: requestData.difficulty,
      step: "CALLING_GENERATOR"
    });

    // Import the generateTypingText function from our genkit_functions
    const { generateTypingText } = require("./genkit_functions");
    
    // Calculate time limit based on difficulty
    let timeLimit = 60; // Default to 1 minute
    if (requestData.timeLimit) {
      timeLimit = requestData.timeLimit;
    } else {
      // If timeLimit not provided, estimate based on difficulty
      switch(requestData.difficulty) {
        case "Easy": timeLimit = 30; break;
        case "Medium": timeLimit = 60; break;
        case "Hard": timeLimit = 120; break;
        default: timeLimit = 60;
      }
    }
    
    let generatedText;
    try {
      // Try to generate text using Gemini AI
      logger.debug("🔍 DEBUG: Attempting to use Gemini AI", {
        userId,
        topic: requestData.topic.trim(),
        difficulty: requestData.difficulty,
        timeLimit,
        step: "GEMINI_ATTEMPT"
      });
      
      generatedText = await generateTypingText(
        requestData.topic.trim(),
        requestData.difficulty,
        timeLimit,
        requestData.userInterests || []
      );
      
      logger.info("✅ DEBUG: Successfully used Gemini AI", {
        userId,
        step: "GEMINI_SUCCESS",
        userInterestsIncluded: (requestData.userInterests && requestData.userInterests.length > 0) || false,
        userInterestsCount: requestData.userInterests?.length || 0
      });
    } catch (error) {
      // Fall back to placeholder content if Gemini fails
      logger.error("🚨 DEBUG: Gemini AI failed, falling back to placeholder", {
        userId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        step: "GEMINI_FAILED_FALLBACK"
      });
      
      generatedText = generatePlaceholderContent(requestData.topic, requestData.difficulty);
    }
    
    logger.debug("✅ DEBUG: Gemini AI content generated", {
      userId,
      hasGeneratedText: !!generatedText,
      textLength: generatedText?.length || 0,
      textType: typeof generatedText,
      step: "GENERATOR_COMPLETE"
    });

    if (!generatedText || generatedText.trim().length === 0) {
      logger.error("🚨 DEBUG: AI generated empty content", { 
        userId,
        generatedText,
        textLength: generatedText?.length || 0,
        step: "GENERATION_FAILED"
      });
      throw new HttpsError("internal", "Failed to generate test content");
    }

    const wordCount = generatedText.split(' ').length;
    
    logger.info("✅ DEBUG: Content processing complete", { 
      userId, 
      textLength: generatedText.length,
      wordCount: wordCount,
      firstWords: generatedText.substring(0, 50) + '...',
      step: "PROCESSING_COMPLETE",
      userInterestsIncluded: (requestData.userInterests && requestData.userInterests.length > 0) || false
    });

    let savedTestId: string | null = null;

    // Conditional Firestore saving with enhanced logging
    if (requestData.saveTest) {
      logger.debug("🔍 DEBUG: Starting Firestore save process", {
        userId,
        saveTest: true,
        step: "SAVE_START"
      });

      try {
        // Create AI-generated test document following PreMadeTest structure
        const aiTestData = {
          text: generatedText.trim(),
          difficulty: requestData.difficulty,
          category: 'ai_generated', // Special category for AI tests
          source: 'AI Generated', // Display name for AI tests
          wordCount: wordCount,
          timeLimit: Math.ceil(wordCount / 1.7), // Approximate reading time: ~100 WPM = 60s
          createdAt: new Date().toISOString(),
          generatedByAi: true,
          topic: requestData.topic.trim(),
          userId: userId, // Track who created this test
          userInterests: requestData.userInterests || [], // Store user interests used for generation
        };

        logger.debug("🔍 DEBUG: Firestore document prepared", {
          userId,
          documentKeys: Object.keys(aiTestData),
          documentSize: JSON.stringify(aiTestData).length,
          userInterestsIncluded: (requestData.userInterests && requestData.userInterests.length > 0) || false,
          userInterestsCount: requestData.userInterests?.length || 0,
          step: "DOCUMENT_PREPARED"
        });

        // Save to aiGeneratedTests collection
        const docRef = db.collection('aiGeneratedTests').doc();
        
        logger.debug("🔍 DEBUG: Attempting Firestore write", {
          userId,
          collectionName: 'aiGeneratedTests',
          docRefId: docRef.id,
          step: "FIRESTORE_WRITE_START"
        });

        await docRef.set(aiTestData);
        savedTestId = docRef.id;

        logger.info("✅ DEBUG: AI test saved to Firestore successfully", { 
          userId, 
          testId: savedTestId,
          topic: requestData.topic,
          step: "SAVE_COMPLETE"
        });

      } catch (saveError) {
        // Don't fail the entire request if saving fails - just log the error
        const saveErrorMessage = saveError instanceof Error ? saveError.message : String(saveError);
        logger.error("🚨 DEBUG: Failed to save AI test to Firestore", { 
          userId, 
          error: saveErrorMessage,
          errorStack: saveError instanceof Error ? saveError.stack : undefined,
          step: "SAVE_FAILED"
        });
        // Continue with response even if saving failed
      }
    } else {
      logger.debug("🔍 DEBUG: Skipping Firestore save (saveTest=false)", {
        userId,
        saveTest: false,
        step: "SAVE_SKIPPED"
      });
    }

    // Prepare response
    const response = { 
      success: true, 
      text: generatedText.trim(),
      testId: savedTestId,
      wordCount: wordCount,
      saved: requestData.saveTest && savedTestId !== null,
      userInterestsIncluded: (requestData.userInterests && requestData.userInterests.length > 0) || false,
      message: "AI test generated successfully" 
    };

    logger.info("✅ DEBUG: Response prepared successfully", {
      userId,
      responseKeys: Object.keys(response),
      hasText: !!response.text,
      textLength: response.text.length,
      saved: response.saved,
      step: "RESPONSE_READY"
    });

    // Return response with generated content and save status
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error("🚨 DEBUG: Critical error in generateAiTest", { 
      userId, 
      error: errorMessage,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorStack,
      step: "CRITICAL_ERROR"
    });
    
    if (error instanceof HttpsError) {
      logger.debug("🔍 DEBUG: Re-throwing HttpsError", {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
        step: "RETHROW_HTTPS_ERROR"
      });
      throw error;
    }
    
    logger.debug("🔍 DEBUG: Throwing internal error", {
      userId,
      originalError: errorMessage,
      step: "THROW_INTERNAL_ERROR"
    });
    
    throw new HttpsError("internal", "Failed to generate AI test");
  }
});
