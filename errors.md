# ZenType Error Solutions & Fixes

This document records critical errors encountered during development and their solutions to prevent time waste in future debugging sessions.

## 🚨 CRITICAL: Typing Test Keystroke & Timer Issues

### **Problem Description**
- **Date**: Current session
- **Severity**: Critical - Complete typing test functionality broken
- **Symptoms**:
  - Keystrokes not registering in typing test
  - Timer not starting or running properly
  - Spacebar validation not working
  - Stale closure issues in event handlers
  - State management race conditions

### **Root Causes Identified**
1. **Missing `currentIndex` state** - Code was using `userInput.length` as currentIndex but no `currentIndex` state existed
2. **Stale closure issues in `handleKeyDown`** - Function wasn't using `useCallback` and had stale closures with `errors` and `userInput`
3. **Missing `preventDefault()` on key events** - No preventDefault meant default browser behavior interfered with typing
4. **Timer logic dependency issues** - Timer useEffect had incorrect dependencies and cleanup logic
5. **Incorrect error counting logic** - Using stale `errors` value instead of functional update
6. **Missing proper state reset in `startTest`** - Not resetting `currentIndex` when starting new test

### **Solution Applied**
**Key Principle**: Simple, reliable approach with ENTER key to start timer

#### **1. Fixed State Management**
```typescript
// Added missing currentIndex state
const [currentIndex, setCurrentIndex] = useState(0);

// Proper state reset in startTest
const startTest = useCallback(() => {
  setUserInput("");
  setCurrentIndex(0);  // ← CRITICAL: Reset currentIndex
  setErrors(0);
  setTimeLeft(selectedTime);
  setStatus('waiting');
  setView('active');
  setTimeout(() => {
    inputRef.current?.focus();
  }, 100);
}, [selectedTime]);
```

#### **2. Fixed Keystroke Handling**
```typescript
// Wrapped in useCallback with proper dependencies
const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
  event.preventDefault(); // ← CRITICAL: Prevent browser interference
  
  const key = event.key;

  // ENTER KEY STARTS THE TIMER
  if (key === 'Enter' && status === 'waiting') {
    setStatus('running');
    return;
  }

  // Don't process other keys if not running
  if (status !== 'running') {
    return;
  }

  // Handle character input with functional updates
  if (key.length === 1) {
    const targetChar = textToType[currentIndex];
    const isCorrect = key === targetChar;
    
    if (!isCorrect) {
      setErrors(prev => prev + 1); // ← CRITICAL: Functional update
    }
    
    setUserInput(prev => prev + key); // ← CRITICAL: Functional update
    setCurrentIndex(prev => prev + 1); // ← CRITICAL: Functional update
    
    // Check if test is complete
    if (currentIndex + 1 >= textToType.length) {
      endTest();
    }
  }
  
  // Handle backspace
  else if (key === 'Backspace') {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setUserInput(prev => prev.slice(0, -1));
    }
  }
}, [status, textToType, currentIndex, endTest]); // ← CRITICAL: Proper dependencies
```

#### **3. Fixed Timer Logic**
```typescript
// Simplified timer logic - starts when status is 'running', stops when not
useEffect(() => {
  if (status === 'running') {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [status]); // ← CRITICAL: Only depend on status, not timeLeft
```

#### **4. User Experience Flow**
1. **Click "Start Typing"** → Goes to active view, shows "Press ENTER to start"
2. **Press ENTER** → Timer starts counting down, status becomes 'running'
3. **Start typing** → Keystrokes are captured, real-time validation, green/red highlighting
4. **Timer runs continuously** → Until you press "Finish Test" or time runs out
5. **Pause/Resume** → Stops/starts timer without losing progress

### **Key Lessons Learned**
1. **Always use `useCallback` for event handlers** to prevent stale closures
2. **Always use functional state updates** (`prev => prev + 1`) instead of direct values
3. **Always add `event.preventDefault()`** for custom keyboard handling
4. **Keep timer logic simple** - only depend on status, not timeLeft
5. **Reset ALL relevant state** when starting new test (including currentIndex)
6. **Use ENTER key to start timer** - more reliable than first keystroke approach
7. **Proper dependency arrays** in useEffect and useCallback are critical

### **Prevention Checklist**
- [ ] Event handlers wrapped in `useCallback` with proper dependencies
- [ ] All state updates use functional form (`prev => newValue`)
- [ ] `event.preventDefault()` called in custom keyboard handlers
- [ ] Timer logic has minimal dependencies (only status)
- [ ] All state variables reset when starting new test
- [ ] No stale closure issues in event handlers
- [ ] Proper cleanup in useEffect return functions

---

## 🚨 CRITICAL: Auto-Save Timer Completion Issues

### **Problem Description**
- **Date**: January 2025 session
- **Severity**: Critical - Auto-save functionality completely broken
- **Symptoms**:
  - Timer completion not triggering auto-save
  - 400 validation errors with invalid data (wpm: 0, accuracy: 0, userInput: '')
  - Duplicate submissions when timer ends
  - Auto-save using stale state values instead of current typing data
  - Manual "Finish Test" button working perfectly, but auto-save failing

### **Root Causes Identified**
1. **Stale closure in timer** - Timer was calling `endTest()` with old state values
2. **Dependency array issues** - Adding `endTest` to timer dependencies caused restarts
3. **Race conditions** - Multiple calls to `endTest()` from different sources
4. **Status check timing** - `endTest()` status check preventing execution when called from timer
5. **Button click approach failed** - Programmatic button clicks had timing issues

### **Solution Applied**
**Key Principle**: Use ref-based function calls to avoid dependency issues while ensuring fresh state

#### **1. Added endTestRef for Stable Function Reference**
```typescript
const endTestRef = useRef<() => Promise<void>>();

// Update the ref whenever endTest changes
useEffect(() => {
  endTestRef.current = endTest;
}, [endTest]);
```

#### **2. Fixed Timer Logic with Ref-Based Call**
```typescript
// Simple timer logic - starts when status is 'running', stops when not
useEffect(() => {
  if (status === 'running') {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Call endTest via ref when timer ends - this ensures proper state without dependency issues
          if (endTestRef.current) {
            endTestRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [status]); // ← CRITICAL: Only depend on status, use ref for endTest
```

#### **3. Prevented Duplicate Calls with Status Check**
```typescript
const endTest = useCallback(async () => {
  // Prevent multiple calls to endTest
  if (status !== 'running') {
    console.log('endTest called but status is not running, ignoring');
    return;
  }
  
  // Immediately set status to prevent race conditions
  setStatus('finished');
  // ... rest of endTest logic
}, [user, selectedTime, timeLeft, userInput, textToType, errors, selectedDifficulty, currentTestId, status]);
```

### **Key Lessons Learned**
1. **Use refs for function calls in timers** - Avoids dependency array issues
2. **Status checks prevent race conditions** - Always check status before executing
3. **Fresh state is critical** - Timer must use current state, not stale closures
4. **Button click approach can fail** - Direct function calls via refs are more reliable
5. **Timer dependencies must be minimal** - Only depend on what actually affects timer behavior

### **Prevention Checklist**
- [ ] Use refs for function calls in useEffect timers
- [ ] Keep timer dependencies minimal (only status)
- [ ] Add status checks to prevent duplicate calls
- [ ] Test both manual and auto-save paths
- [ ] Ensure fresh state values in timer callbacks
- [ ] Avoid adding functions to timer dependency arrays

---

## 🔧 Minor Issues & Fixes

### **Linter Error: GlassCard onClick**
- **Problem**: `onClick` prop not supported on GlassCard component
- **Solution**: Replace GlassCard with div and apply glass-card classes manually
```typescript
// Before (causes linter error)
<GlassCard onClick={() => inputRef.current?.focus()}>

// After (fixed)
<div className="glass-card rounded-lg border border-border/50 backdrop-blur-sm" onClick={() => inputRef.current?.focus()}>
```

---

## 🚨 CRITICAL: Firestore Undefined Field Value Error

### **Problem Description**
- **Date**: January 2025 session
- **Severity**: Critical - Complete profile creation failure
- **Symptoms**:
  - User signup fails with Firestore error
  - Error: "Function setDoc() called with invalid data. Unsupported field value: undefined (found in field photoURL in document profiles/...)"
  - Dashboard stuck on "Setting up your profile..." loading state
  - Settings page shows empty username
  - Profile creation completely broken

### **Root Causes Identified**
1. **Undefined photoURL value** - Passing `user.photoURL || undefined` to Firestore
2. **Firestore doesn't accept undefined** - Only accepts valid values or field omission
3. **TypeScript interface mismatch** - Optional fields still being passed as undefined
4. **Multiple call sites** - Both signup and AuthProvider had this issue

### **Solution Applied**
**Key Principle**: Never pass undefined to Firestore - either pass a value or omit the field entirely

#### **1. Fixed createUserProfile Function**
```typescript
// Before (BROKEN)
const profileData: UserProfile = {
  uid, email, username: finalUsername, photoURL, // photoURL could be undefined
  // ... other fields
};

// After (FIXED)
const profileData: UserProfile = {
  uid, email, username: finalUsername,
  // ... other fields but NO photoURL initially
};

// Only add photoURL if it exists (Firestore doesn't accept undefined)
if (photoURL) {
  profileData.photoURL = photoURL;
}
```

#### **2. Fixed All Calling Functions**
```typescript
// Before (BROKEN)
createUserProfile(uid, email, username, user.photoURL || undefined)

// After (FIXED)  
createUserProfile(uid, email, username, user.photoURL) // Don't pass || undefined
```

#### **3. Enhanced Error Detection**
```typescript
// Added detailed logging to catch undefined values
console.log('🔍 Profile data values that might be undefined:', {
  photoURL: profileData.photoURL,
  bio: profileData.bio,
  preferredThemeId: profileData.preferredThemeId
});

try {
  await setDoc(doc(db, COLLECTIONS.PROFILES, uid), profileData);
} catch (setDocError) {
  console.error('💥 setDoc failed with error:', setDocError);
  console.error('💥 Failed profile data:', JSON.stringify(profileData, null, 2));
  throw setDocError;
}
```

### **Files Modified**
1. **lib/firebase/firestore.ts** - Fixed createUserProfile function
2. **app/signup/page.tsx** - Removed || undefined from calls
3. **context/AuthProvider.tsx** - Removed || undefined from emergency profile creation

### **Key Lessons Learned**
1. **Firestore is strict about undefined** - Use conditional field addition instead
2. **TypeScript optional (?) doesn't mean undefined is acceptable** - It means field can be omitted
3. **Always test profile creation end-to-end** - Firestore errors break entire flow
4. **Use detailed error logging** - Console should show exact field causing issues
5. **Guard against undefined in all optional fields** - Check bio, photoURL, etc.

### **Prevention Checklist**
- [ ] Never pass `|| undefined` to Firestore functions
- [ ] Use conditional field addition: `if (value) obj.field = value`
- [ ] Test profile creation with new users immediately
- [ ] Add logging before all setDoc calls to inspect data
- [ ] Verify TypeScript interfaces match Firestore expectations

---

## 🔄 REPEATED ISSUE: Debug Panel Not Hidden Properly

### **Problem Description**
- **Date**: January 2025 session
- **Severity**: Low - UI/UX issue
- **Symptoms**:
  - Debug panel showing sensitive user data (UID, profile JSON) on dashboard
  - User requested hiding 3 times before resolution
  - Multiple debug panels in different code sections
  - Simple task took multiple attempts

### **Root Causes Identified**
1. **Multiple debug panels** - Debug code existed in multiple locations
2. **Incomplete removal** - Only removed one instance, missed others
3. **Poor code organization** - Debug code scattered throughout component
4. **Not thorough enough** - Didn't check entire file for all debug instances

### **Solution Applied**
**Key Principle**: Remove ALL debug panels completely, not just hide them

#### **1. Found Multiple Debug Panels**
```typescript
// First debug panel (lines 79-86) - REMOVED
<div className="mb-4 p-4 bg-gray-800 rounded text-white text-xs">
  <h3>DEBUG - Profile Data (Empty State):</h3>
  <pre>{JSON.stringify(profile, null, 2)}</pre>
  // ... more debug info
</div>

// Second debug panel (lines 124-131) - ALREADY REMOVED
{process.env.NODE_ENV === 'development' && false && (
  <div className="mb-4 p-4 bg-gray-800 rounded text-white text-xs">
    // ... debug info
  </div>
)}
```

#### **2. Complete Removal Strategy**
- Search entire file for "DEBUG" comments
- Remove all debug divs completely
- Don't just hide with conditions - DELETE them
- Check both empty state and main dashboard sections

### **Files Modified**
1. **app/dashboard/page.tsx** - Removed both debug panels completely

### **Key Lessons Learned**
1. **Search entire file** - Don't assume only one debug panel exists
2. **Complete removal** - Don't just hide, DELETE debug code
3. **Be thorough** - Check all code sections, not just one
4. **Simple tasks need attention** - Don't rush simple fixes
5. **User frustration** - Repeated requests indicate incomplete solution

### **Prevention Checklist**
- [ ] Search entire file for "DEBUG" before making changes
- [ ] Remove debug code completely, don't just hide it
- [ ] Test the actual UI after changes
- [ ] Be thorough on simple tasks
- [ ] Check all code sections, not just one

---

## 🚨 CRITICAL: Pre-made Test System Implementation Issues

### **Problem Description**
- **Date**: January 2025 session
- **Severity**: Critical - Pre-made test system completely non-functional
- **Symptoms**:
  - "No tests available" message in Practice Test tab
  - API returning 0 pre-made tests despite filtering attempts
  - System falling back to dummy text instead of selected tests
  - Wrong collection name and data structure mismatch

### **Root Causes Identified**
1. **Wrong Collection Reference** - API was querying `preMadeTests` but Firestore had `test_contents`
2. **Empty Collection** - No actual test data in the collection being queried
3. **Data Structure Mismatch** - Interface used `timeLimit` but actual data had `wordCount`
4. **Missing Sample Data** - No diverse test content for users to select from

### **Solution Applied**
**Key Principle**: Align codebase with actual Firestore structure and populate with real data

#### **1. Fixed Collection Reference**
```typescript
// Before (BROKEN)
let baseQuery = collection(db, COLLECTIONS.PRE_MADE_TESTS); // 'preMadeTests'

// After (FIXED)
let baseQuery = collection(db, COLLECTIONS.TEST_CONTENTS); // 'test_contents'
```

#### **2. Updated Data Interface**
```typescript
// Before (BROKEN) - timeLimit based
export interface PreMadeTest {
  timeLimit: '30s' | '1m' | '2m' | '5m';
}

// After (FIXED) - wordCount based
export interface PreMadeTest {
  wordCount: number;
  source: string;
  category: string;
  createdAt: string;
}
```

#### **3. Created Sample Test Data**
```javascript
// Created 19 diverse tests across difficulties with script
const sampleTests = [
  // Easy: 8 tests (basic typing, simple vocabulary)
  // Medium: 6 tests (moderate complexity, punctuation)  
  // Hard: 5 tests (technical content, complex vocabulary)
];
```

#### **4. Enhanced API Route**
```typescript
// Fixed filtering and data processing
const results: PreMadeTest[] = [];
querySnapshot.forEach((doc) => {
  const testData: PreMadeTest = {
    id: doc.id,
    text: data.text || '',
    difficulty: data.difficulty || 'Medium',
    category: data.category || 'general_practice',
    source: data.source || 'Practice',
    wordCount: data.wordCount || 0,
    createdAt: data.createdAt || new Date().toISOString(),
  };
  results.push(testData);
});
```

#### **5. Fixed Frontend Integration**
```typescript
// Updated data fetching to remove timeLimit filtering
const queryParams = new URLSearchParams();
if (selectedDifficulty) {
  queryParams.append('difficulty', selectedDifficulty);
}
// Note: Removed timeLimit filtering since tests are now wordCount-based

// Enhanced test selection with proper state updates
const handleTestSelection = useCallback((test: PreMadeTest) => {
  setSelectedTestId(test.id);
  setTextToType(test.text); // CRITICAL: This ensures real test content is used
  setCurrentTestId(test.id); // CRITICAL: For proper result saving
}, [selectedTime]);
```

### **Files Modified**
1. **app/api/tests/route.ts** - Fixed collection reference and data processing
2. **lib/types/database.ts** - Updated PreMadeTest interface to match real data
3. **app/test/page.tsx** - Enhanced test selection and removed timeLimit filtering
4. **Created test data** - Script to populate Firestore with 19 diverse tests

### **Key Lessons Learned**
1. **Always verify actual Firestore structure** - Don't assume collection names or data structure
2. **Populate with real data first** - Empty collections will always return "No tests available"
3. **Align interface with reality** - TypeScript interfaces must match actual Firestore documents
4. **Test end-to-end flow** - Verify that selected tests actually populate the typing interface
5. **Use descriptive logging** - Console logs help debug data flow issues

### **Prevention Checklist**
- [ ] Verify collection names match Firestore exactly
- [ ] Check that collections contain actual test data
- [ ] Ensure TypeScript interfaces match Firestore document structure
- [ ] Test that selected content populates textToType correctly
- [ ] Verify API filtering works with actual data fields
- [ ] Create diverse sample data for different difficulty levels

### **Result**
✅ **System now fully functional**: Users can select from 19 real tests across Easy/Medium/Hard difficulties with actual content instead of dummy text fallback.

---

## 📝 Future Error Records

*This section will be updated as new errors are encountered and resolved.*

### Template for New Error Records:
```
### **Problem Description**
- **Date**: [Date]
- **Severity**: [Critical/High/Medium/Low]
- **Symptoms**: [What was broken]

### **Root Causes Identified**
1. [Cause 1]
2. [Cause 2]

### **Solution Applied**
[Detailed solution with code examples]

### **Key Lessons Learned**
1. [Lesson 1]
2. [Lesson 2]

### **Prevention Checklist**
- [ ] [Prevention item 1]
- [ ] [Prevention item 2]
```
