# Technical API Inventory: ZenType Project

This document provides a detailed technical catalog of the ZenType project's APIs, their functionalities, data models, and architectural dependencies.

## Section 1: High-Level API Landscape & Architecture

This section maps out the entire ecosystem of services that constitute the ZenType application.

### 1. Service Inventory
The project is architected as a modern web application rather than a distributed microservices system. However, we can identify three distinct logical services based on their roles and technologies:

1.  **ZenType Next.js Frontend/API**: The primary client-facing application, built with Next.js and React.
2.  **ZenType Firebase Backend**: A collection of backend services provided by Google Firebase, including Cloud Functions, Firestore, and Authentication.
3.  **ZenType AI Service**: A specialized service built with Google Genkit for handling AI-powered test generation.

### 2. Service Purpose
*   **ZenType Next.js Frontend/API**: Its primary responsibility is to serve the user interface and handle all user interactions. It includes a set of API Routes for retrieving non-sensitive data and proxying requests to the secure backend.
*   **ZenType Firebase Backend**: This service is the core of the backend, responsible for managing user authentication, securely storing all application data (profiles, test results), and executing trusted business logic via Cloud Functions.
*   **ZenType AI Service**: Its sole purpose is to generate unique, topic-based typing tests on-demand by interfacing with the Gemini large language model.

### 3. Inter-Service Communication
Communication between services is handled via direct, synchronous HTTPS calls:
*   The **Next.js Frontend** communicates with the **Firebase Backend** (Cloud Functions) using the Firebase client SDK, which makes secure HTTPS `POST` requests.
*   The **Next.js Frontend** communicates with its own internal **API Routes** using standard `fetch` calls.
*   The **AI Service (Genkit)** is invoked exclusively from the backend (either a Next.js API Route or a Cloud Function) via a secure HTTPS call. The client never interacts with the AI service directly.

### 4. API Consumers
*   The single primary consumer of all APIs is the **ZenType web frontend**.
*   There are currently no other consumers, such as mobile applications or third-party partners.

### 5. API Gateway
There is no single, dedicated API Gateway product in use. Instead, two platforms serve this function for their respective services:
*   **Vercel**: Acts as the gateway for the Next.js application and its API Routes. It manages request routing, SSL termination, caching, and serving of static assets.
*   **Firebase Cloud Functions**: The Firebase infrastructure itself acts as the gateway for all callable functions. It handles the invocation, authenticates the user's token on every call, and manages scaling.

---

## Section 2: Detailed Analysis for a Specific API Service

### API Service Name: ZenType Firebase Backend

This service comprises Firestore and the callable Cloud Functions that contain the core business logic.

#### A. Core Functionality & Endpoints

**1. Critical Endpoints (Callable Functions):**
These are not traditional REST endpoints but are invoked via HTTPS calls from the client SDK.

*   `POST generateAiTest`
    *   **Description**: Triggers the Genkit AI service to generate a new typing test based on a user-provided topic.
    *   **Rate Limiting**: 20 requests per hour per authenticated user
    *   **Authentication**: Required (Firebase ID Token)
    *   **Status**: ✅ FULLY IMPLEMENTED
    *   **Implementation**: Firebase Cloud Function using Google Gemini AI
    *   **Request**: `{ topic: string, difficulty: 'Easy'|'Medium'|'Hard', timeLimit?: number, saveTest: boolean, userInterests?: string[] }`
    *   **Response**: `{ success: boolean, text: string, testId?: string, wordCount: number, saved: boolean, userInterestsIncluded: boolean, message: string }`
    *   **Features**: Topic-based generation, difficulty customization, automatic Firestore saving, fallback content system

*   `POST submitTestResult`
    *   **Description**: Securely saves typing test results and updates user statistics.
    *   **Rate Limiting**: 100 requests per hour per authenticated user
    *   **Authentication**: Required (Firebase ID Token)
    *   **Status**: ✅ FULLY IMPLEMENTED  
    *   **Implementation**: Firebase Cloud Function with Firestore transactions
    *   **Request**: `{ wpm: number, accuracy: number, errors: number, timeTaken: number, textLength: number, userInput: string, testType: string, difficulty: string, testId?: string }`
    *   **Response**: `{ success: boolean, message: string }`
    *   **Features**: Server-side validation, user stats updates, secure data persistence

**2. Next.js API Routes:**
*   `GET /api/tests`
    *   **Description**: Fetches pre-made typing tests with filtering capabilities.
    *   **Status**: ✅ FULLY IMPLEMENTED
    *   **Query Parameters**: `difficulty`, `timeLimit`, `category`
    *   **Response**: `{ tests: PreMadeTest[] }`
    *   **Features**: Smart Firestore filtering, category-based organization, 48+ professional tests

*   `POST /api/submit-test-result`
    *   **Description**: Proxy endpoint for submitTestResult Cloud Function with authentication validation.
    *   **Status**: ✅ FULLY IMPLEMENTED
    *   **Features**: Auth token validation, secure forwarding to Cloud Function

**3. Complex Business Logic:**
*   **`submitTestResult`**: ✅ FULLY IMPLEMENTED - This function executes significant business logic beyond a simple database write. It processes test results, calculates metrics (WPM, accuracy), validates data server-side, and performs atomic Firestore transactions to save results and update user statistics.
*   **`generateAiTest`**: ✅ FULLY IMPLEMENTED - This function orchestrates calls to Google Gemini AI service. It involves prompt engineering, difficulty-based content generation, Zod schema validation, error handling with fallback content, and automatic saving to the `aiGeneratedTests` collection.

**4. Asynchronous Operations:**
*   All current endpoints operate synchronously with immediate responses. The `generateAiTest` function includes proper timeout handling and fallback mechanisms for reliable operation.

#### B. Data Models & Payloads

**1. Primary Data Objects:**
*   `Profile`: Stores user-specific information and preferences.
*   `TestResult`: Stores the detailed results and metrics of a single completed test.
*   `PreMadeTest`: Represents a static, pre-written typing test.
*   `AIGeneratedTest`: Represents a typing test created by the AI service.

**2. Sample Payload (for a `TestResult` response):**
```json
{
  "id": "tr_a8s7d9f0a7s9d8f",
  "userId": "uf_b3k4j5b3k4j5",
  "testId": "pmt_c1l2a3s4s5i6c",
  "wpm": 85.4,
  "rawWpm": 90.1,
  "accuracy": 98.7,
  "consistency": 92.5,
  "charHistory": [
    { "char": "T", "time": 120, "correct": true },
    { "char": "h", "time": 110, "correct": true },
    { "char": "e", "time": 95, "correct": true },
    { "char": "e", "time": 150, "correct": false }
  ],
  "createdAt": "2023-10-27T10:00:00.000Z",
  "testType": "pre-made",
  "difficulty": "Medium",
  "timeLimit": 60
}
```

**3. Data Relationships:**
*   Relationships are represented by **storing foreign keys (IDs)**. For example, a `TestResult` object contains a `userId` and a `testId`. This normalized approach requires the client to make separate requests to fetch the full `Profile` or `PreMadeTest` objects if needed, which is efficient for a NoSQL database like Firestore.

**4. Large Payloads:**
*   The `submitTestResult` endpoint handles a potentially large request payload. The `charHistory` array, which contains an object for every single keystroke, can become very large for longer tests (e.g., 3-5 minutes), increasing the size of the inbound request.

---

### API Service Name: ZenType Next.js Frontend/API

This service comprises the Next.js API Routes that act as a backend-for-frontend (BFF).

#### A. Core Functionality & Endpoints

**1. Critical Endpoints (API Routes):**

*   `GET /api/tests`
    *   **Description**: Fetches a list of pre-made typing tests. Supports filtering via query parameters like `difficulty`, `timeLimit`, and `category`.
*   `POST /api/submit-test-result`
    *   **Description**: Acts as a secure proxy. It receives the test result from the client, validates the user's authentication token from the `Authorization` header, and then calls the `submitTestResult` Firebase Cloud Function.
*   `POST /api/test/ai_text`
    *   **Description**: A secure proxy for AI test generation. It authenticates the user and then calls the `generateAiTest` Firebase Cloud Function, passing along the topic.
*   `GET /api/leaderboard`
    *   **Description**: Fetches and returns formatted data for the public leaderboard. This endpoint is read-only and may have different caching rules than user-specific data.

**2. Complex Business Logic:**
*   The primary logic within these API routes is **authentication, validation, and proxying**. They serve as a crucial security layer, ensuring that only authenticated users can access the backend Cloud Functions. The `GET /api/tests` endpoint also contains logic to dynamically construct a Firestore query based on the provided URL filter parameters.

**3. Asynchronous Operations:**
*   None of the documented API routes are designed to be long-running. They all follow a standard synchronous request-response pattern.

#### B. Data Models & Payloads

**1. Primary Data Objects:**
*   `PreMadeTest`: A static typing test object.
*   `LeaderboardEntry`: A formatted object containing a user's rank, name, and score.

**2. Sample Payload (for a `PreMadeTest` object from `GET /api/tests`):**
```json
{
  "id": "pmt_g3n3r4l_34sy",
  "text": "The quick brown fox jumps over the lazy dog. This is a sample text for a typing test that is easy to type.",
  "source": "Classic Phrases",
  "difficulty": "Easy",
  "timeLimit": 30,
  "category": "General"
}
```

**3. Data Relationships:**
*   The API routes return self-contained data objects. They do not use hypermedia (HATEOAS) or other methods for linking between resources. The client relies on the documentation to know which endpoints to call.

**4. Large Payloads:**
*   The response from `GET /api/tests` could potentially be large if the number of pre-made tests grows significantly and pagination is not implemented on this specific endpoint.

#### C. Dependencies & Integrations

**1. Internal Dependencies:**
*   The **Next.js API Routes** are tightly coupled with the **Firebase Backend**. Specifically, the proxy endpoints (`/api/submit-test-result`, `/api/test/ai_text`) directly call their corresponding Firebase Cloud Functions (`submitTestResult`, `generateAiTest`) to perform their operations.

**2. External Dependencies:**
*   **Google Genkit (via Gemini API)**: The `generateAiTest` function depends on the Google AI Platform to generate dynamic typing test content. This is a critical external dependency for the AI features.

**3. Data Stores:**
*   The Next.js API routes primarily connect to **Cloud Firestore** to retrieve data for read-only operations, such as fetching the list of `preMadeTests` for the `GET /api/tests` endpoint.

#### D. Unique Configurations & Logic

**1. Specialized Authentication:**
*   The API routes use the project's standard authentication method. They expect a **Firebase ID Token** to be passed in the `Authorization: Bearer <token>` header. The routes validate this token to authenticate the user before proxying requests to the secure backend.
*   The `GET /api/leaderboard` and `GET /api/tests` endpoints are public and do not require authentication.

**2. Complex Authorization:**
*   Authorization logic is straightforward and based on standard ownership rules enforced by Firestore Security Rules. For example, a user can only update their own profile or submit a test result linked to their own `userId`. There are no complex, multi-tenant, or ACL-based authorization schemes at this time.

**3. Configuration & Secrets:**
*   The service is configured using **environment variables** managed by Vercel.
*   Secrets, such as the Firebase service account credentials (`FIREBASE_SERVICE_ACCOUNT_KEY`) required to initialize the Firebase Admin SDK, are stored as secure environment variables in the Vercel project settings.

---

## Section 3: Operational Concerns

This section covers how the API is managed in production.

**1. Monitoring & Alerting:**
*   **Vercel Analytics**: The health and performance of the Next.js API Routes are monitored through Vercel's built-in analytics. This tracks key metrics like **request volume, latency (p50, p95, p99), and error rates (4xx, 5xx)**.
*   **Firebase Monitoring**: The Firebase Cloud Functions are monitored within the Google Cloud Console. This provides insights into **function invocations, execution time, and memory usage**.
*   **Alerting**: Basic alerting is configured through Vercel to notify the team of significant spikes in the 5xx error rate. More advanced, custom alerting (e.g., for high latency on a specific function) would require integration with a third-party tool like Datadog or setting up custom Google Cloud Monitoring alerts.

**2. Logging:**
*   **Vercel Logs**: Logs for the Next.js API Routes are sent to the Vercel Log Drains. By default, they are simple text-based logs from `console.log` or `console.error`.
*   **Firebase Logs (Cloud Logging)**: Logs for all Firebase Cloud Functions are automatically sent to Google Cloud Logging.
*   **Enhanced Debug System**: ✅ IMPLEMENTED - A comprehensive debug logging system with categories including AI_GENERATION, FIREBASE, USER_INTERACTION, API_CALLS, ERROR_HANDLING, PERFORMANCE, SECURITY, and RATE_LIMITING. Features correlation IDs, structured logging, and real-time monitoring through the EnhancedDebugPanel.
*   **Standardization**: Implemented standardized logging format with structured JSON entries including `correlationId`, `userId`, `functionName`, `category`, and `metadata` for improved observability and debugging.

---

## Section 4: Security & Rate Limiting Implementation

**1. Rate Limiting Architecture:**
*   **Implementation**: ✅ FULLY IMPLEMENTED using `firebase-functions-rate-limiter` with Firestore backend
*   **Storage**: Rate limit counters stored in Firestore collection `rateLimitCounters`
*   **Enforcement**: Per-user limits with automatic reset every hour
*   **Monitoring**: Integrated with debug system using RATE_LIMITING category

**2. Rate Limit Configuration:**
*   **generateAiTest**: 20 requests per hour per authenticated user
*   **submitTestResult**: 100 requests per hour per authenticated user
*   **Error Response**: HTTP 429 with descriptive error messages when limits exceeded

**3. Security Enhancements:**
*   **Authentication**: All critical endpoints require Firebase ID Token validation
*   **Authorization**: Firestore Security Rules enforce user data isolation
*   **Input Validation**: Zod schema validation on all Cloud Function inputs
*   **Error Handling**: Secure error responses without sensitive information exposure

---

## Section 5: Current Implementation Status

**Last Updated**: January 2025  
**Architecture Phase**: Phase 4 Complete - Security & Reliability Hardening  
**Production Status**: ✅ PRODUCTION READY

**Completed Features:**
- ✅ Core API endpoints (Next.js API Routes + Firebase Cloud Functions)
- ✅ AI-powered test generation with Google Gemini
- ✅ Comprehensive rate limiting system
- ✅ Enhanced debug and monitoring system
- ✅ Secure authentication and authorization
- ✅ Structured logging with correlation IDs
- ✅ Error handling and fallback mechanisms
- ✅ API versioning and pagination support

**Next Phase**: Ongoing maintenance and feature enhancements based on user feedback.