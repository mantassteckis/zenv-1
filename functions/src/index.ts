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
