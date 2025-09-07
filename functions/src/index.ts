import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
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
 * Generates placeholder content for testing purposes
 * TODO: Replace with actual AI generation
 */
function generatePlaceholderContent(topic: string, difficulty: string): string {
  const templates = {
    Easy: `Learning about ${topic} can be both fun and educational. This subject offers many opportunities to explore new concepts and develop useful skills. Whether you're just starting out or looking to refresh your knowledge, understanding the basics is always important. The fundamentals provide a solid foundation for more advanced learning. Practice and patience are key to mastering any new area of study. With time and effort, anyone can become proficient in topics that interest them. Remember that every expert was once a beginner who kept trying.`,
    
    Medium: `The field of ${topic} encompasses a broad range of specialized concepts and methodologies that professionals use in their daily practice. Understanding the underlying principles requires careful study and practical application. Modern approaches to ${topic} often involve complex systems, advanced techniques, and industry-standard protocols that have evolved over time. Practitioners must stay current with emerging trends and technological developments while maintaining a solid grasp of fundamental concepts. This balance between traditional knowledge and innovative practices defines successful professional work in this domain.`,
    
    Hard: `Advanced ${topic} implementation requires sophisticated understanding of complex theoretical frameworks, cutting-edge methodologies, and specialized technical expertise. Contemporary research in this field demonstrates intricate relationships between multiple variables, demanding comprehensive analytical capabilities and profound domain knowledge. Practitioners must navigate challenging paradigms, leverage state-of-the-art technologies, and synthesize multifaceted information from diverse sources. The convergence of traditional approaches with revolutionary innovations necessitates exceptional proficiency, strategic thinking, and adaptability to rapidly evolving industry standards and regulatory requirements.`
  };

  return templates[difficulty as keyof typeof templates] || templates.Medium;
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
    "https://127.0.0.1:3000"
  ]
}, async (request) => {
  // Authentication Guard
  if (!request.auth) {
    logger.warn("Unauthenticated request to submitTestResult");
    throw new HttpsError("unauthenticated", "User must be authenticated to submit test results");
  }

  const userId = request.auth.uid;
  logger.info("Test result submission request", { userId });

  // Data Extraction & Validation
  const testData = request.data as TestResultData;
  
  if (!testData) {
    logger.warn("No test data provided", { userId });
    throw new HttpsError("invalid-argument", "Test data is required");
  }

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
    logger.warn("Validation failed", { userId, errors: validationErrors });
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
      logger.info("Test result document created", { userId, testResultId: testResultRef.id });

      // Transaction Step B - Update User Profile Stats
      const userProfileRef = db.collection("profiles").doc(userId);
      const userProfileDoc = await transaction.get(userProfileRef);

      if (!userProfileDoc.exists) {
        logger.warn("User profile not found during stats update", { userId });
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

    logger.info("Test result submitted successfully", { userId });
    return { success: true, message: "Test result saved successfully" };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error submitting test result", { userId, error: errorMessage });
    
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
    "https://127.0.0.1:3000"
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
    dataSize: JSON.stringify(requestData || {}).length
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

    // Generate content using AI (placeholder implementation)
    logger.debug("🔍 DEBUG: Calling placeholder content generator", {
      userId,
      topic: requestData.topic.trim(),
      difficulty: requestData.difficulty,
      step: "CALLING_GENERATOR"
    });

    const generatedText = generatePlaceholderContent(requestData.topic, requestData.difficulty);
    
    logger.debug("✅ DEBUG: Placeholder content generated", {
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
      step: "PROCESSING_COMPLETE"
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
        };

        logger.debug("🔍 DEBUG: Firestore document prepared", {
          userId,
          documentKeys: Object.keys(aiTestData),
          documentSize: JSON.stringify(aiTestData).length,
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
