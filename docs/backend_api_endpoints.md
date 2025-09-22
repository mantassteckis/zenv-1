# Backend API Endpoints

This document outlines the API endpoints implemented in the ZenType project.

## ✅ IMPLEMENTED ENDPOINTS

## Firebase Cloud Functions

### generateAiTest
**Status:** ✅ FULLY IMPLEMENTED  
**Type:** Firebase Cloud Function (Callable)  
**Purpose:** Generate AI-powered typing tests using Google Gemini AI  
**Authentication:** Required  

**Request Body:**
```typescript
{
  topic: string;           // Topic for test generation
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit?: number;      // Optional: 30, 60, 120, 300 seconds
  saveTest: boolean;       // Whether to save to aiGeneratedTests collection
  userInterests?: string[]; // Optional: user interests for personalization
}
```

**Response:**
```typescript
{
  success: boolean;
  text: string;           // Generated typing test content
  testId?: string;        // ID if saved to Firestore
  wordCount: number;      // Word count of generated text
  saved: boolean;         // Whether test was saved
  userInterestsIncluded: boolean;
  message: string;
}
```

### submitTestResult
**Status:** ✅ FULLY IMPLEMENTED  
**Type:** Firebase Cloud Function (Callable)  
**Purpose:** Save typing test results and update user statistics  
**Authentication:** Required  

**Request Body:**
```typescript
{
  wpm: number;
  accuracy: number;
  errors: number;
  timeTaken: number;      // in seconds
  textLength: number;
  userInput: string;
  testType: string;       // 'practice', 'ai-generated', etc.
  difficulty: string;     // 'Easy', 'Medium', 'Hard'
  testId?: string;        // Optional for practice tests
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

## Next.js API Routes

### GET /api/tests
**Status:** ✅ FULLY IMPLEMENTED  
**Purpose:** Fetch pre-made typing tests with filtering  
**Authentication:** Not required  

**Query Parameters:**
- `difficulty`: 'Easy' | 'Medium' | 'Hard' (optional)
- `timeLimit`: number (optional) - filter by time limit
- `category`: string (optional) - filter by test category

**Response:**
```typescript
{
  tests: PreMadeTest[];
}

interface PreMadeTest {
  id: string;
  text: string;
  difficulty: string;
  category: string;
  source: string;
  wordCount: number;
  timeLimit: number;
}
```

### POST /api/submit-test-result
**Status:** ✅ FULLY IMPLEMENTED  
**Purpose:** Proxy endpoint for submitTestResult Cloud Function  
**Authentication:** Required (Authorization header)  
**Note:** This endpoint validates auth and forwards to the Cloud Function

## 📋 PLANNED ENDPOINTS (Not Yet Implemented)

### GET /api/leaderboard
**Status:** 📅 PLANNED  
**Purpose:** Fetch global leaderboard data  
**Authentication:** Not required  

**Response:**
```typescript
{
  leaderboard: Array<{
    rank: number;
    username: string;
    bestWpm: number;
    testsCompleted: number;
    averageAccuracy: number;
  }>;
}
```

### POST /api/auth/google
**Description:** Google OAuth authentication
**Request Body:**
\`\`\`json
{
  "googleToken": "string"
}
\`\`\`

## User Endpoints

### GET /api/user/profile
**Description:** Fetch user profile information for the dashboard
**Headers:** Authorization: Bearer {token}
**Response:**
\`\`\`json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "stats": {
      "averageWpm": number,
      "averageAccuracy": number,
      "testsCompleted": number,
      "rank": number
    }
  }
}
\`\`\`

## Typing Test Endpoints

### POST /api/test/results
**Description:** Save a completed typing test result
**Headers:** Authorization: Bearer {token}
**Request Body:**
\`\`\`json
{
  "wpm": number,
  "accuracy": number,
  "errors": number,
  "timeSpent": number,
  "mode": "practice" | "ai-generated",
  "difficulty": "easy" | "medium" | "hard",
  "textUsed": "string"
}
\`\`\`

### GET /api/test/history
**Description:** Retrieve a user's past test history
**Headers:** Authorization: Bearer {token}
**Query Parameters:**
- limit: number (optional, default: 50)
- offset: number (optional, default: 0)
**Response:**
\`\`\`json
{
  "tests": [
    {
      "id": "string",
      "date": "string",
      "wpm": number,
      "accuracy": number,
      "mode": "string",
      "difficulty": "string",
      "timeSpent": number
    }
  ],
  "total": number
}
\`\`\`

### GET /api/leaderboard
**Description:** Fetch global leaderboard data
**Query Parameters:**
- limit: number (optional, default: 100)
**Response:**
\`\`\`json
{
  "leaderboard": [
    {
      "rank": number,
      "username": "string",
      "bestWpm": number,
      "testsCompleted": number,
      "averageAccuracy": number
    }
  ]
}
\`\`\`

## AI-Powered Content Generation

### POST /api/test/ai_text
**Description:** Generate AI-powered typing test text based on a given topic using Genkit
**Headers:** Authorization: Bearer {token}
**Request Body:**
\`\`\`json
{
  "topic": "string",
  "difficulty": "easy" | "medium" | "hard",
  "length": "short" | "medium" | "long"
}
\`\`\`
**Response:**
\`\`\`json
{
  "text": "string",
  "wordCount": number,
  "estimatedTime": number
}
\`\`\`

## Implementation Notes

- **Firebase Integration:** All user authentication and data storage will be handled through Firebase
- **Genkit Integration:** AI text generation will use Google's Genkit framework
- **Security:** All endpoints (except auth) require valid JWT tokens
- **Rate Limiting:** API endpoints will implement rate limiting to prevent abuse
- **Validation:** All inputs will be validated and sanitized on the backend
- **Error Handling:** Consistent error response format across all endpoints

## Future Enhancements

- Real-time multiplayer typing races
- Custom text upload and sharing
- Advanced analytics and progress tracking
- Social features (friends, challenges)
- Mobile app API support
