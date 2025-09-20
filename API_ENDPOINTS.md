# API Endpoints Documentation

This document tracks all API routes and Cloud Functions created for the ZenType project.

## Next.js API Routes

### Admin Logs Search
**Endpoint:** `GET /api/admin/logs/search`

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
**Endpoint:** `GET /api/admin/performance/stats`

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

- All API routes follow RESTful conventions
- Error responses include correlation IDs for debugging
- Performance monitoring is built into all endpoints
- Authentication will be added in future iterations