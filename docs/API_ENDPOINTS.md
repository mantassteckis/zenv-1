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