# ZenType Leaderboard Implementation

## Overview
The ZenType leaderboard system displays global rankings of users based on their typing performance. The system pulls data from the `profiles` collection in Firestore and provides real-time rankings based on average WPM (Words Per Minute).

## Architecture

### Data Source
- **Primary**: `profiles` collection - Contains comprehensive user statistics
- **Fallback**: `leaderboard` collection - Legacy collection for backup data
- **Rationale**: Using profiles collection ensures data consistency since it's updated during test submissions

### API Endpoint
- **Route**: `/api/leaderboard`
- **Method**: GET
- **Response Format**: JSON with leaderboard entries, filters, and metadata

## Current Implementation Status

### ✅ Completed Features
1. **Data Retrieval from Profiles Collection**
   - Queries `profiles` collection ordered by `stats.avgWpm` descending
   - Filters out users with no meaningful stats (avgWpm > 0, testsCompleted > 0)
   - Maintains proper ranking system

2. **Real-time Updates**
   - Test submissions automatically update user profiles
   - Leaderboard reflects changes immediately
   - Transaction-based updates ensure data consistency

3. **Basic Filtering**
   - Limit parameter (default: 100, max: 100)
   - All-time rankings (default behavior)

4. **Fallback Mechanism**
   - Falls back to `leaderboard` collection if profiles query fails
   - Maintains service availability

### 🔄 Current Behavior
- **Default View**: All-time rankings
- **Data Fields**: rank, username, bestWpm, testsCompleted, averageAccuracy, avgWpm
- **Sorting**: Descending by avgWpm
- **User Identification**: Uses Firebase Auth UID

## API Documentation

### Request Parameters
```
GET /api/leaderboard?limit=5&testType=all&timeframe=all-time
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 100 | Maximum entries to return (max: 100) |
| testType | string | "all" | Test type filter (currently not implemented) |
| timeframe | string | "all-time" | Time period filter (currently not implemented) |

### Response Format
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "TypeMaster2024",
      "bestWpm": 127,
      "testsCompleted": 2847,
      "averageAccuracy": 98.9,
      "userId": "user_001",
      "email": "typemaster@example.com",
      "avgWpm": 127,
      "testType": "all",
      "lastTestDate": "2024-01-01T00:00:00.000Z"
    }
  ],
  "filters": {
    "testType": "all",
    "timeframe": "all-time",
    "limit": 5
  },
  "count": 5,
  "dataSource": "profiles",
  "correlationId": "req-1758758649917-7f3748vth36"
}
```

## Database Schema

### Profiles Collection Structure
```typescript
interface UserProfile {
  uid: string;
  username: string;
  email: string;
  stats: {
    avgWpm: number;
    bestWpm: number;
    avgAcc: number;
    testsCompleted: number;
    rank: string; // "S", "A", "B", "C", "D"
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    keyboardSounds: boolean;
    visualFeedback: boolean;
    preferredFontId: string;
    preferredThemeId: string;
  };
}
```

### Test Result Integration
When users complete tests, the system:
1. Saves test result to `testResults` collection
2. Updates user profile stats in `profiles` collection
3. Leaderboard automatically reflects updated rankings

## Frontend Integration

### React Hook
```typescript
// hooks/useLeaderboard.ts
const { data: leaderboard, isLoading, error } = useLeaderboard({
  limit: 100,
  testType: 'all',
  timeframe: 'all-time'
});
```

### UI Components
- **Leaderboard Page**: `/leaderboard` - Full leaderboard view
- **Top Performers Cards**: Dashboard highlights
- **Ranking Table**: Sortable table with user statistics

## Pending Improvements

### 🚧 High Priority
1. **Timeframe Filters**
   - Weekly rankings (last 7 days)
   - Monthly rankings (last 30 days)
   - All-time rankings (current default)
   - Requires adding `lastTestDate` tracking to profiles

2. **Test Type Filters**
   - AI-generated tests
   - Pre-made tests
   - Custom difficulty levels
   - Requires test type tracking in profiles

### 🚧 Medium Priority
1. **User Consent System**
   - Opt-in/opt-out for leaderboard participation
   - Privacy settings in user profile
   - Default to opt-out for new users

2. **Enhanced Statistics**
   - Consistency metrics
   - Improvement trends
   - Streak tracking

### 🚧 Low Priority
1. **Performance Optimizations**
   - Caching for frequently accessed data
   - Pagination for large datasets
   - Real-time updates via WebSocket

## Technical Considerations

### Performance
- Current implementation handles up to 100 entries efficiently
- Firestore queries are optimized with proper indexing
- Response times typically under 200ms

### Security
- Firestore security rules govern data access
- User emails are included but can be filtered client-side
- No sensitive data exposed in leaderboard

### Error Handling
- Graceful fallback to backup collection
- Comprehensive logging for debugging
- User-friendly error messages

## Known Issues

### Non-Critical Errors
- **Firestore Listen Channel Errors**: 
  ```
  net::ERR_ABORTED https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel
  ```
  - These are client-side connection errors
  - Do not affect leaderboard functionality
  - Related to real-time listeners, not API calls

### Limitations
1. **Timeframe Filtering**: Currently client-side only, not optimized for large datasets
2. **Test Type Separation**: Profiles don't separate stats by test type
3. **Real-time Updates**: UI doesn't auto-refresh, requires manual refresh

## Testing Status

### ✅ Verified Functionality
- Test submissions correctly update user profiles
- Leaderboard rankings update based on new test results
- API returns correct data structure and rankings
- Fallback mechanism works when primary data source fails

### Test Results
```bash
# API Test
GET /api/leaderboard?limit=5
Status: 200 OK
Response Time: ~150ms
Data Source: profiles
Entries: 5 users with proper rankings
```

## Future Enhancements

### Phase 1: Core Filters
- Implement timeframe filters with proper database queries
- Add test type separation in user profiles
- Create user consent mechanism

### Phase 2: Advanced Features
- Real-time leaderboard updates
- Achievement system integration
- Social features (following, challenges)

### Phase 3: Analytics
- Performance analytics dashboard
- Trend analysis
- Competitive insights

## Conclusion

The leaderboard system is currently functional with basic ranking capabilities. The foundation is solid with proper data architecture and API design. The next phase should focus on implementing timeframe filters and user consent mechanisms to provide a complete leaderboard experience.