# API Endpoints

## API Versioning

All API endpoints are now versioned under `/api/v1/` to ensure backward compatibility and future extensibility. The current version is v1.

## Firebase Cloud Functions

### generateAiTest
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
  mode: 'immediate' | 'job';       // Response mode
  text?: string;                   // Present when mode === 'immediate'
  testId?: string;                 // ID if saved to Firestore
  wordCount?: number;              // Present when mode === 'immediate'
  saved?: boolean;                 // Present when mode === 'immediate'
  userInterestsIncluded?: boolean; // Present when mode === 'immediate'
  jobId?: string;                  // Present when mode === 'job'
  status?: 'queued' | 'processing' | 'succeeded' | 'failed';
  pollAfterMs?: number;           // Client polling hint
  message: string;
}
```

**Error Handling:**
- Returns HttpsError for authentication failures
- Falls back to placeholder content if AI generation fails
- Validates all input parameters server-side

### submitTestResult
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

### GET /api/v1/tests
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

### POST /api/v1/submit-test-result
**Purpose:** Proxy endpoint for submitTestResult Cloud Function  
**Authentication:** Required (Authorization header)  
**Note:** This endpoint validates auth and forwards to the Cloud Function Documentation

This document tracks all API routes and Cloud Functions created for the ZenType project.

## Next.js API Routes

### Admin Logs Search
**Endpoint:** `GET /api/v1/admin/logs/search`

**Purpose:** Search and retrieve performance logs for admin dashboard monitoring

**Query Parameters:**
- `startTime` (optional): ISO 8601 timestamp for filtering logs from this time
- `endTime` (optional): ISO 8601 timestamp for filtering logs until this time  
- `searchText` (optional): Text to search within log messages and endpoints
- `pageSize` (optional): Number of logs to return (default: 100)

**Response Format:**
```json
{
  "success": true,
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "message": "GET /api/tests completed",
      "performanceMetrics": {
        "responseTime": 45,
        "memoryUsage": 128.5,
        "cpuUsage": 0
      },
      "correlationId": "req-123456789",
      "endpoint": "/api/tests",
      "method": "GET",
      "statusCode": 200,
      "userId": "user123"
    }
  ],
  "totalCount": 1,
  "message": "Performance logs retrieved successfully"
}
```

**Status Codes:**
- `200 OK`: Logs retrieved successfully
- `500 Internal Server Error`: Server error occurred

**Implementation Status:** ✅ Completed - Connected to real performance logging system

**Notes:** 
- Returns real performance data from file-based logging system
- Supports time-based filtering and endpoint search
- Used by admin performance dashboard for real-time monitoring
- Performance middleware automatically logs all API requests

### Admin Performance Stats
**Endpoint:** `GET /api/v1/admin/performance/stats`

**Purpose:** Get aggregated performance statistics for admin dashboard

**Query Parameters:**
- `timeRange` (optional): Time range for statistics (default: '1h')
  - Supported values: '15m', '1h', '6h', '24h', '7d'

**Response Format:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "avgResponseTime": 45,
    "errorRate": 2.5,
    "slowestEndpoints": [
      {
        "endpoint": "GET /api/tests",
        "avgTime": 234.5,
        "count": 25
      }
    ],
    "errorsByEndpoint": [
      {
        "endpoint": "POST /api/submit-test-result",
        "errorCount": 3,
        "errorRate": 12.5
      }
    ]
  },
  "message": "Performance statistics retrieved successfully"
}
```

**Status Codes:**
- `200 OK`: Statistics retrieved successfully
- `500 Internal Server Error`: Server error occurred

**Implementation Status:** ✅ Completed - Real-time performance analytics

**Notes:** 
- Calculates statistics from performance log files
- Provides aggregated metrics for dashboard overview
- Identifies slowest endpoints and error patterns
- Updates in real-time as new requests are processed

---

## Firebase Cloud Functions

*No Cloud Functions implemented yet*

---

## Implementation Notes

- All API routes follow RESTful conventions and are versioned under `/api/v1/`
- Error responses include correlation IDs for debugging
- Performance monitoring is built into all endpoints
- Authentication will be added in future iterations
- Legacy endpoints without `/v1/` prefix are deprecated and should not be used