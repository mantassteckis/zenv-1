# API Endpoints Documentation

## Tests API

### GET /api/v1/tests

Retrieves pre-made typing tests with optional filtering and pagination support.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `difficulty` | string | No | Filter tests by difficulty level (`Easy`, `Medium`, `Hard`) |
| `timeLimit` | number | No | Filter tests by time limit in seconds |
| `category` | string | No | Filter tests by category |
| `limit` | number | No | Number of tests to return per page (default: 20, max: 50) |
| `cursor` | string | No | Cursor for pagination (document ID from previous page) |

#### Response Format

```json
{
  "data": [
    {
      "id": "test_id",
      "source": "Test Source",
      "difficulty": "Easy|Medium|Hard",
      "timeLimit": 60,
      "wordCount": 150,
      "text": "Test content...",
      "category": "general"
    }
  ],
  "pagination": {
    "nextCursor": "document_id_or_null",
    "hasNextPage": true,
    "currentPage": 1,
    "totalResults": 45
  }
}
```

#### Error Response

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

#### Examples

**Basic request:**
```
GET /api/v1/tests
```

**Filtered request:**
```
GET /api/v1/tests?difficulty=Easy&timeLimit=60
```

**Paginated request:**
```
GET /api/v1/tests?limit=10&cursor=test_doc_id_123
```

#### Implementation Notes

- Uses cursor-based pagination for consistent results
- Tests are ordered by creation date (newest first)
- Cursor is the document ID of the last item in the current page
- Maximum limit is enforced server-side to prevent performance issues
- All filters are applied before pagination

---

## Firebase Cloud Functions

### submitTestResult

**Endpoint:** Firebase Cloud Function  
**Method:** POST  
**Authentication:** Required  
**Rate Limit:** 100 requests per hour per user

Submits test results for both practice and AI-generated tests.

#### Request Body

```json
{
  "testData": {
    "testId": "string",
    "testType": "practice|ai",
    "source": "string",
    "difficulty": "Easy|Medium|Hard",
    "timeLimit": 60,
    "wordCount": 150,
    "text": "Test content..."
  },
  "results": {
    "wpm": 75,
    "accuracy": 95.5,
    "timeSpent": 58,
    "errors": 3,
    "completedAt": "2025-01-23T10:30:00Z"
  }
}
```

#### Response Format

```json
{
  "success": true,
  "testResultId": "document_id",
  "message": "Test result submitted successfully"
}
```

#### Error Responses

**Rate limit exceeded (429):**
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**Authentication required (401):**
```json
{
  "error": "Authentication required"
}
```

**Validation error (400):**
```json
{
  "error": "Invalid test data",
  "details": "Validation error details"
}
```

### generateAiTest

**Endpoint:** Firebase Cloud Function  
**Method:** POST  
**Authentication:** Required  
**Rate Limit:** 20 requests per hour per user

Generates AI-powered typing tests using Google Gemini.

#### Request Body

```json
{
  "difficulty": "Easy|Medium|Hard",
  "timeLimit": 60,
  "category": "general|programming|literature",
  "customPrompt": "Optional custom prompt for test generation"
}
```

#### Response Format

```json
{
  "success": true,
  "test": {
    "id": "generated_test_id",
    "source": "AI Generated",
    "difficulty": "Easy",
    "timeLimit": 60,
    "wordCount": 150,
    "text": "Generated test content...",
    "category": "general"
  }
}
```

#### Error Responses

**Rate limit exceeded (429):**
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**AI generation failed (500):**
```json
{
  "error": "Failed to generate test",
  "details": "AI service error details"
}
```

---

## Legacy Endpoints (Deprecated)

### POST /api/submit-test-result

**Status:** Deprecated - Use Firebase Cloud Function `submitTestResult` instead  
**Removal Date:** TBD

### GET /api/tests

**Status:** Deprecated - Use `/api/v1/tests` instead  
**Removal Date:** TBD

---

## Rate Limiting

All Firebase Cloud Functions implement rate limiting using `firebase-functions-rate-limiter` with Firestore backend:

- **submitTestResult:** 100 requests per hour per authenticated user
- **generateAiTest:** 20 requests per hour per authenticated user

Rate limits are enforced per user ID and reset every hour. When exceeded, endpoints return HTTP 429 with appropriate error messages.

---

**Last Updated:** January 2025  
**API Version:** v1  
**Status:** Production Ready