Looking at your current codebase and the AGENT_LOG.md progress, I can see you're ready to implement the pre-made test management system. Here's the detailed implementation logic:

[1 tool called]

## Part 1: Backend Logic - API Route Creation

### File: `app/api/tests/route.ts`

**Step 1: Import Dependencies**
- Import Firebase client configuration from `lib/firebase/client.ts`
- Import Firestore functions: `collection`, `query`, `where`, `getDocs`
- Import `NextRequest` and `NextResponse` from Next.js
- Import `PreMadeTest` interface from `lib/types/database.ts`

**Step 2: GET Handler Function**
- Export an async function named `GET` that accepts `request: NextRequest`
- Extract query parameters using `request.nextUrl.searchParams.get()`
- Parameters to extract: `difficulty`, `timeLimit`, `category` (optional)

**Step 3: Query Construction Logic**
```
1. Create base query: query(collection(db, 'preMadeTests'))
2. Initialize empty constraints array
3. If difficulty parameter exists and is valid ('Easy', 'Medium', 'Hard'):
   - Add where('difficulty', '==', difficulty) to constraints
4. If timeLimit parameter exists:
   - Add where('recommendedTime', '==', parseInt(timeLimit)) to constraints
5. If category parameter exists:
   - Add where('category', '==', category) to constraints
6. Apply constraints to query if any exist
```

**Step 4: Data Fetching and Processing**
```
1. Execute getDocs(finalQuery)
2. Initialize empty results array
3. Iterate through snapshot.docs:
   - For each doc, extract data with doc.data()
   - Create formatted object with doc.id and spread data
   - Ensure object matches PreMadeTest interface structure
   - Push to results array
```

**Step 5: Response Formatting**
- Return `NextResponse.json(results)` for successful queries
- Include total count in response: `{ tests: results, total: results.length }`

**Step 6: Error Handling**
- Wrap entire logic in try-catch block
- Log detailed error information for debugging
- Return `NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })`

## Part 2: Frontend Logic - Test Page Integration

### File: `app/test/page.tsx`

**Step 1: New State Variables**
```
- preMadeTests: PreMadeTest[] = []
- selectedTestId: string | null = null
- testsLoading: boolean = false
- testsError: string | null = null
```

**Step 2: Data Fetching Logic (useEffect)**
```
Trigger conditions:
- Component mount
- selectedDifficulty changes
- selectedTime changes

Fetch process:
1. Set testsLoading = true, testsError = null
2. Construct query string with current filters:
   - difficulty=${selectedDifficulty}
   - timeLimit=${selectedTime}
3. Call fetch('/api/tests?' + queryString)
4. Parse JSON response
5. Update preMadeTests state with response.tests
6. Set testsLoading = false
7. Handle errors by setting testsError state
```

**Step 3: Test Selection UI Logic**
```
In Practice Test tab section:
1. Show loading spinner when testsLoading is true
2. Show error message if testsError exists
3. If preMadeTests has data:
   - Map over preMadeTests array
   - For each test, render a selectable card/button containing:
     * Test category and title
     * Difficulty badge
     * First 100 characters of text as preview
     * Visual indicator if this test is selected (selectedTestId matches)
```

**Step 4: Test Selection Handler**
```
Function: handleTestSelection(test: PreMadeTest)
1. Update selectedTestId = test.id
2. Update textToType = test.text
3. Update currentTestId = test.id (critical for result saving)
4. Store test metadata for later use:
   - testCategory = test.category
   - testDifficulty = test.difficulty
5. Clear any existing user input and reset typing state
6. Optionally auto-focus the typing input area
```

**Step 5: UI State Management**
```
Conditional rendering logic:
- If no test selected: Show "Select a test to begin" message
- If test selected but not started: Show "Press Start Typing" button
- During test: Show selected test title and category above typing area
- After test: Include test information in results display
```

**Step 6: Integration with Existing Logic**
```
Ensure compatibility with current code:
- textToType state already exists - just populate it with selected test text
- currentTestId already used in endTest function - populate with test.id
- selectedDifficulty should default to test's difficulty when selected
- All existing timer, typing, and result saving logic remains unchanged
```

**Step 7: Error Handling and Edge Cases**
```
- Handle empty test results (show "No tests available" message)
- Handle network errors (show retry button)
- Validate test data structure before using
- Provide fallback if API fails (could show static text as backup)
- Clear selection when filters change to avoid mismatched test/difficulty
```

## Data Flow Summary

1. **Page Load** → Fetch tests from API with current difficulty filter
2. **User Changes Filter** → Refetch tests with new parameters
3. **User Selects Test** → Update textToType, currentTestId, and UI state
4. **User Starts Typing** → Existing typing engine handles everything normally
5. **Test Completion** → Existing endTest function saves result with correct testId

## Key Integration Points

- **API Route**: Use same error handling patterns as existing `/api/submit-test-result`
- **Firestore Query**: Follow same connection pattern as profile functions
- **State Management**: Integrate with existing test page state without conflicts
- **Result Saving**: No changes needed - currentTestId is already passed to API

This architecture maintains your existing test flow while adding the dynamic test selection capability. The critical insight is that once a test is selected and `textToType` + `currentTestId` are set, all your existing typing logic continues to work normally.