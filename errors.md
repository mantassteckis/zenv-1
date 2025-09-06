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
