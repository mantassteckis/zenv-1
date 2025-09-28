Leaderboard Implementation Plan
Objective: To build a real-time, filterable leaderboard system by creating optimized data models in Firestore, processing data with Cloud Functions, exposing it through secure and performant Next.js API endpoints, and integrating it into the UI.

Phase 1: Firestore Data Model & Indexing (The Foundation)
Goal: Create dedicated, optimized Firestore collections for leaderboard data, specifically designed to handle timeframes and filters efficiently. This avoids slow and expensive queries on the main testResults collection.
Action Items for AI Agent:

1. 
Create New Firestore Collections:
Your agent must establish three new top-level collections in Firestore. This multi-collection approach is superior for managing different timeframes efficiently and optimizing read costs.


leaderboard_all_time:

Purpose: Stores the single best score for each unique combination of user, test type, difficulty, and duration. This collection is designed to be relatively small, containing only current personal bests, making "All-Time" queries extremely fast.
Document ID: A composite key to ensure uniqueness per user and filter combination. For example, use a string like {userId}_{testType}_{difficulty}_{duration}.
Schema (document fields):
jsonDownloadCopy code Wrap{
  "userId": "string",
  "username": "string",
  "wpm": "number",
  "accuracy": "number",
  "createdAt": "Firebase.Timestamp", // Timestamp of when the record was achieved
  "testType": "string",            // For filtering: 'pre-made', 'ai-generated'
  "difficulty": "string",          // For filtering: 'easy', 'medium', 'hard'
  "testDuration": "number"         // For filtering: 30, 60, 120 (seconds)
}




leaderboard_daily:

Purpose: Stores all scores that qualify for the daily leaderboard within the current 24-hour period. This collection will be cleared daily by a scheduled function.
Document ID: A standard auto-generated Firestore ID.
Schema: Same as leaderboard_all_time.



leaderboard_weekly:

Purpose: Stores all scores that qualify for the weekly leaderboard within the current 7-day period. This collection will be cleared weekly by a scheduled function.
Document ID: A standard auto-generated Firestore ID.
Schema: Same as leaderboard_all_time.




2. 
Define Firestore Composite Indexes:
For each of the three new leaderboard collections (leaderboard_all_time, leaderboard_daily, leaderboard_weekly), your agent must define the following composite indexes. These are crucial for efficient querying with multiple filters and sorting by WPM.


General Index for Filtering and Sorting:
For each combination of filterable fields (testType, difficulty, testDuration), create an index that ends with wpm (desc). For example:

testType (asc), difficulty (asc), testDuration (asc), wpm (desc)
testType (asc), difficulty (asc), wpm (desc) (for when testDuration filter is not applied)
testType (asc), testDuration (asc), wpm (desc) (for when difficulty filter is not applied)
difficulty (asc), testDuration (asc), wpm (desc)
testType (asc), wpm (desc)
difficulty (asc), wpm (desc)
testDuration (asc), wpm (desc)
wpm (desc) (for general sorting when no filters are applied)



Index for createdAt based queries (less common for these collections, but good for diagnostics):

createdAt (desc)



Self-correction note for AI Agent: Firestore will automatically infer and suggest some indexes based on your queries, but explicitly defining these ensures optimal performance and prevents "index not found" errors when developing. Define them in firestore.indexes.json or through the Firebase console.



Phase 2: Real-time Data Aggregation (The Engine)
Goal: Implement the "Real-time Duplication" strategy using Firebase Cloud Functions to automatically populate and maintain the new leaderboard collections.
Action Items for AI Agent:

1. 
Create a New Cloud Function: onNewTestResultLeaderboardUpdate

Trigger: Firestore onCreate event on documents in the /testResults collection.
Logic (Conceptual Flow):

Retrieve Test Result: The function receives the new testResult document data.
Fetch Username: If the testResult document does not include username, fetch it from the /profiles/{userId} collection using result.userId. If the user has a changeable username, this ensures the leaderboard reflects their current name.
Construct Leaderboard Entry: Create a clean, minimal object for the leaderboard, including userId, username, wpm, accuracy, createdAt, testType, difficulty, testDuration.
Update leaderboard_all_time:

Generate the unique composite Document ID for leaderboard_all_time using the userId, testType, difficulty, and testDuration from the new result.
Perform a get() operation on leaderboard_all_time with this Document ID.
Conditional Update: If the document doesn't exist, or if the newTestResult.wpm is greater than the existingScore.wpm, then set() the new leaderboard entry in leaderboard_all_time (using merge: true is crucial here to prevent overwriting other fields if they existed, though in this case, the schema is fixed).


Add to leaderboard_daily:

Add the new leaderboard entry as a new document to the leaderboard_daily collection (Firestore will auto-generate the document ID).


Add to leaderboard_weekly:

Add the new leaderboard entry as a new document to the leaderboard_weekly collection (Firestore will auto-generate the document ID).




Error Handling: Implement robust error logging using your structured logger from Phase 1, including correlationId if applicable to the Cloud Function context.


2. 
Create Scheduled Cleanup Cloud Functions:
These functions manage the ephemeral daily and weekly collections, ensuring they don't grow indefinitely and accurately reflect the current period.

cleanupDailyLeaderboard:

Trigger: Cloud Scheduler (e.g., 0 0 * * * for daily at midnight UTC).
Logic:

Query all documents in the leaderboard_daily collection.
Perform a batch delete on these documents. Be mindful of Firestore's batch delete limits (500 operations per batch) and implement a loop if necessary for large collections.




cleanupWeeklyLeaderboard:

Trigger: Cloud Scheduler (e.g., 0 0 * * 0 for weekly on Sunday at midnight UTC).
Logic:

Query all documents in the leaderboard_weekly collection.
Perform a batch delete on these documents, similar to the daily cleanup.








Phase 3: API Endpoint Development (The Interface)
Goal: Create the Next.js API Routes to securely and efficiently expose the leaderboard data, following the project's API design guide.
Action Items for AI Agent:

1. 
Create the Main Leaderboard Endpoint (GET /api/v1/leaderboard):

Location: app/api/v1/leaderboard/route.ts
Logic:

Parse and Validate Query Parameters:

Extract timeframe, testType, difficulty, duration, limit from request.nextUrl.searchParams.
Validate timeframe against ['all-time', 'daily', 'weekly']. Default to 'all-time'.
Validate other filter parameters against expected values or all.
Parse limit (default to 50, enforce a maximum like 100).


Select Target Firestore Collection:

Based on the timeframe parameter, select the appropriate Firestore collection reference:

'daily' -> db.collection('leaderboard_daily')
'weekly' -> db.collection('leaderboard_weekly')
'all-time' (or default) -> db.collection('leaderboard_all_time')




Construct Dynamic Firestore Query:

Start with the selected collection.
Apply .where() clauses conditionally for testType, difficulty, and duration if they are provided and not 'all'.
Apply .orderBy('wpm', 'desc').
Apply .limit(parsedLimit).


Execute Query and Format Response:

Execute the constructed Firestore query.
Map the document snapshots to the desired response payload structure (add rank field client-side or during mapping if needed, though simple iteration in the UI can handle this).
Return a NextResponse.json() object with the specified structure:
jsonDownloadCopy code Wrap{
  "leaderboard": [/* array of leaderboard entries */],
  "total": "number", // Total results found (could be estimated or omitted if not critical)
  "page": "number",
  "limit": "number"
}
Self-correction note: total and page might be difficult to implement efficiently with Firestore's query limits for true pagination. Consider cursor-based pagination if total is too complex, or remove total if not strictly required.


Caching: Include Cache-Control headers in the NextResponse for this public endpoint. For example, headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }.




2. 
Create the User's Rank Endpoint (GET /api/v1/leaderboard/my-rank):

Location: app/api/v1/leaderboard/my-rank/route.ts
Authentication: This route must be protected by your existing authentication middleware to ensure only the authenticated user can request their own rank. Obtain the userId from the authenticated session.
Logic:

Get Authenticated userId: Retrieve the userId from the request context (e.g., from JWT payload).
Parse Query Parameters: Similar to the main leaderboard, parse timeframe, testType, difficulty, duration.
Select Target Firestore Collection: Choose the relevant leaderboard collection based on timeframe.
Fetch User's Best Score:

For leaderboard_all_time, query the collection for the document with the composite ID matching the user's ID and filter parameters.
For leaderboard_daily/weekly, query for the user's highest wpm within that collection and timeframe.
If no score is found for the user, return a response indicating no rank (e.g., { rank: null, message: "No scores found" }).


Calculate Rank:

If the user's best wpm (userWPM) is found, construct a Firestore query on the same selected leaderboard collection to count documents where wpm is greater than userWPM, applying the same filters (testType, difficulty, duration).
Use the .count() aggregation feature provided by Firestore (or perform a get() and count locally if .count() is not sufficient for your specific query combination).
The rank will be (count_of_higher_scores) + 1.


Return Response: Return a NextResponse.json() with the specified structure:
jsonDownloadCopy code Wrap{
  "rank": "number | null",
  "username": "string",
  "wpm": "number",
  "accuracy": "number",
  "percentile": "number" // Optional: Calculate if feasible
}
Self-correction note: Calculating percentile reliably on a large, dynamic dataset in Firestore is very complex and might be omitted initially to simplify. The rank and wpm are most critical.






Phase 4: Frontend Integration (The UI)
Goal: Update the existing leaderboard UI (/app/leaderboard/page.tsx) to dynamically fetch and display live data from the new API endpoints, including filter options and the user's personal rank.
Action Items for AI Agent:

1. 
Update Leaderboard Page (/app/leaderboard/page.tsx):

Client Component: Ensure the file starts with 'use client' as it will involve client-side state and data fetching.
State Management: Use React's useState hook to manage the active timeframe, testType, difficulty, and duration filters.
Data Fetching: Integrate a robust data-fetching library like SWR or React Query. These libraries simplify caching, revalidation, loading states, and error handling for API calls.

The hook (e.g., useSWR) will call the /api/v1/leaderboard endpoint.
Construct the API URL dynamically based on the current filter states.
Handle loading states (display a skeleton UI) and error states gracefully.


Filter UI: Implement UI elements (tabs, dropdowns, buttons) that update the filter states. When a filter state changes, the data-fetching hook will automatically re-fetch data from the API.
Render Leaderboard: Iterate over the leaderboard array from the API response to render the table or list of top scores.


2. 
Implement "Your Rank" Component:

Conditional Rendering: This component should only render if the user is authenticated.
Data Fetching: Use a separate SWR/React Query hook to call the /api/v1/leaderboard/my-rank endpoint.
Authentication Token: Ensure the API call includes the user's authentication token (e.g., JWT in an Authorization header) as required by the backend.
Display: Prominently display the rank, wpm, and accuracy returned by the endpoint. Provide a message if the user has no scores or is unranked for the current filters.