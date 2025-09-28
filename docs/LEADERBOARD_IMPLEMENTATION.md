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
1. **Data Retrieval from Multiple Collections**
   - Queries `profiles` collection for all-time rankings (ordered by `stats.avgWpm` descending)
   - Queries `leaderboard_weekly` collection for weekly rankings
   - Queries `leaderboard_monthly` collection for monthly rankings
   - Filters out users with no meaningful stats (avgWpm > 0, testsCompleted > 0)
   - Maintains proper ranking system across all timeframes

2. **Real-time Updates via Cloud Functions**
   - Test submissions automatically trigger `updateLeaderboardOnTestResult` Cloud Function
   - Function updates user profiles and populates weekly/monthly leaderboard collections
   - Transaction-based updates ensure data consistency
   - Automatic calculation of week/month periods and proper data aggregation

3. **Complete Filtering System**
   - Timeframe filters: All-time (default), Weekly, Monthly
   - Limit parameter (default: 100, max: 100)
   - Visual indicators showing active filter and data source
   - Proper API parameter handling with fallback support

4. **Fallback Mechanism**
   - Falls back to `leaderboard` collection if primary collections fail
   - Maintains service availability during data issues
   - Comprehensive error logging and monitoring

### 🔄 Current Behavior
- **Multi-timeframe Support**: All-time (profiles), Weekly (leaderboard_weekly), Monthly (leaderboard_monthly)
- **Data Fields**: rank, username, bestWpm, testsCompleted, averageAccuracy, avgWpm, dataSource
- **Sorting**: Descending by avgWpm across all collections
- **User Identification**: Uses Firebase Auth UID
- **Visual Feedback**: Active filter indicators and data source display

## API Documentation

### Request Parameters
```
GET /api/leaderboard?limit=5&testType=all&timeframe=all-time
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 100 | Maximum entries to return (max: 100) |
| testType | string | "all" | Test type filter (currently not implemented) |
| timeframe | string | "all-time" | Time period filter: "all-time", "weekly", "monthly" |

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

### 🚧 Medium Priority
1. **Test Type Filters**
   - AI-generated tests vs Pre-made tests separation
   - Custom difficulty levels
   - Requires test type tracking in profiles

2. **User Consent System**
   - Opt-in/opt-out for leaderboard participation
   - Privacy settings in user profile
   - Default to opt-out for new users

3. **Enhanced Statistics**
   - Consistency metrics
   - Improvement trends
   - Streak tracking

### 🚧 Low Priority
1. **Performance Optimizations**
   - Caching for frequently accessed data
   - Pagination for large datasets
   - Real-time updates via WebSocket

2. **Cleanup Functions**
   - Scheduled cleanup of expired weekly/monthly data
   - Automatic archival of old leaderboard entries

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
1. **Test Type Separation**: Profiles don't separate stats by test type yet
2. **Real-time Updates**: UI doesn't auto-refresh, requires manual refresh for new data
3. **Cleanup Automation**: Weekly/monthly collections don't have automated cleanup yet

## Testing Status

### ✅ Verified Functionality
- Test submissions correctly update user profiles and leaderboard collections
- Leaderboard rankings update based on new test results via Cloud Functions
- API returns correct data structure and rankings for all timeframes
- Fallback mechanism works when primary data source fails
- Visual indicators properly show active filters and data sources
- Weekly and monthly collections are populated automatically
- Timeframe switching works correctly in the UI

### Test Results
```bash
# API Tests
GET /api/leaderboard?limit=5&timeframe=all-time
Status: 200 OK, Response Time: ~150ms, Data Source: profiles

GET /api/leaderboard?limit=5&timeframe=weekly  
Status: 200 OK, Response Time: ~120ms, Data Source: leaderboard_weekly

GET /api/leaderboard?limit=5&timeframe=monthly
Status: 200 OK, Response Time: ~130ms, Data Source: leaderboard_monthly
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

The leaderboard system is now **fully functional** with comprehensive multi-timeframe filtering capabilities. The implementation includes:

- **Complete timeframe support** with dedicated Firestore collections for optimal performance
- **Real-time updates** via Cloud Functions that automatically populate leaderboard collections
- **Visual feedback** showing users which filter is active and the data source
- **Robust error handling** with fallback mechanisms and comprehensive logging
- **Performance optimization** using dedicated collections instead of expensive aggregations

The system provides a solid foundation for future enhancements like test type filtering and user consent mechanisms. All core leaderboard functionality is complete and working as designed.