# Backend API Endpoints

This document outlines the API endpoints that will be implemented in the backend phase of the ZenType project. Currently, all frontend interactions use placeholder functionality.

## Authentication Endpoints

### POST /api/auth/login
**Description:** User login with email and password
**Request Body:**
\`\`\`json
{
  "email": "string",
  "password": "string"
}
\`\`\`
**Response:**
\`\`\`json
{
  "success": boolean,
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
\`\`\`

### POST /api/auth/signup
**Description:** New user account creation
**Request Body:**
\`\`\`json
{
  "username": "string",
  "email": "string", 
  "password": "string"
}
\`\`\`
**Response:**
\`\`\`json
{
  "success": boolean,
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
\`\`\`

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
