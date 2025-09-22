# ZenType Debug System Guide

## 🔧 **Overview**

This guide documents the comprehensive debug system implemented for ZenType, focusing on AI generation troubleshooting and general platform debugging capabilities.

**Current Status:** Debug system is fully operational with AI generation debugging capabilities. All major bugs in AI test generation have been resolved.

---

## 🚀 **Debug System Architecture**

### **Core Components**
1. **DebugProvider** (`context/DebugProvider.tsx`) - Global debug state management
2. **DebugToggle** (`components/debug/DebugToggle.tsx`) - Floating debug UI
3. **Debug Logging Integration** - Frontend and backend comprehensive logging
4. **Export/Import System** - Debug log sharing and analysis

### **AI Generation Debug Status** ✅
- **Status**: All critical bugs resolved
- **Fixed Issues**: Timeout handling, error propagation, state management
- **Current State**: AI test generation working reliably
- **Debug Coverage**: Full logging for AI generation workflow

---

## 📊 **How to Use the Debug System**

### **Step 1: Enable Debug Mode**
1. Look for the **"Debug"** button in bottom-right corner
2. Click to enable (button turns green: "Debug ON")
3. Click green button to open debug panel

### **Step 2: Reproduce Issues**
- Navigate to problem area
- Perform actions that cause errors
- **Watch debug panel** for real-time logs

### **Step 3: Analyze Logs**
- Logs are categorized by component/feature
- Color-coded by severity level:
  - 🔵 **DEBUG** (Gray) - Detailed execution steps
  - 🟢 **INFO** (Blue) - General information
  - 🟡 **WARN** (Yellow) - Warnings and non-critical issues
  - 🔴 **ERROR** (Red) - Errors that don't break flow
  - 🟣 **CRITICAL** (Purple) - System-breaking errors

### **Step 4: Export Debug Data**
- Click **download icon** in debug panel
- Exports JSON file with timestamp
- Share with developers for analysis

### **Step 5: Use Selective Logging (Advanced)**
- Toggle **"Selective Mode"** in debug panel
- Add specific function names to monitor
- Only logs from targeted functions will be shown
- Useful for focused debugging of specific features

---

## 🔇 **Noise Filtering & Selective Logging**

### **Automatic Noise Filtering**
The debug system automatically filters out common noise patterns to provide cleaner debugging:

- **Middleware Logs** - HTTP request/response logs from Next.js middleware
- **IDE Requests** - WebView and development tool requests
- **Compilation Messages** - Next.js build and compilation status
- **Static Asset Requests** - CSS, JS, and image file requests
- **Health Check Requests** - System monitoring and status checks

### **Smart Deduplication**
- Prevents repetitive log spam from recurring operations
- Groups similar messages to reduce visual clutter
- Maintains log integrity while improving readability

### **Selective Logging Mode**
When enabled, only logs from specified functions are displayed:

```typescript
// Example: Monitor only authentication functions
Targeted Functions: ['loginUser', 'signupUser', 'validateToken']

// Result: Only logs from these functions appear in debug panel
```

**Use Cases:**
- Debugging specific feature flows
- Isolating problematic functions
- Reducing noise during focused development
- Performance analysis of targeted code paths

**How to Use:**
1. Enable "Selective Mode" toggle in debug panel
2. Add function names to monitor (one per line)
3. Click "Add" to include function in monitoring
4. Remove functions using the "×" button
5. Clear all with "Clear All" button

---

## 🤖 **AI Generation Debugging**

### **Debug Categories for AI Features**
- **AI_GENERATION** - Overall AI test generation flow
- **AI_TEST_SELECTION** - AI test selection and state management
- **CLOUD_FUNCTION** - Backend AI generation processing

### **Common AI Generation Issues**

#### **Issue 1: "functions/internal" Error**
**Symptoms:**
```json
{
  "errorMessage": "internal",
  "errorCode": "functions/internal",
  "stack": "FirebaseError: internal"
}
```

**Root Causes:**
1. Cloud Function not deployed
2. Firebase-admin import errors
3. Missing dependencies in functions/package.json
4. Compilation errors in Cloud Function

**Debug Steps:**
1. Check if backend logs appear (if not, function isn't executing)
2. Verify Cloud Function deployment status
3. Check Firebase Functions console for errors
4. Verify dependencies in functions/package.json

#### **Issue 2: Authentication Errors**
**Symptoms:**
```json
{
  "errorCode": "functions/unauthenticated",
  "errorMessage": "User must be authenticated"
}
```

**Root Causes:**
1. User not properly signed in
2. Auth token expired/invalid
3. Cloud Function auth check failing

#### **Issue 3: Validation Errors**
**Symptoms:**
```json
{
  "errorCode": "functions/invalid-argument",
  "errorMessage": "Validation failed: ..."
}
```

**Root Causes:**
1. Topic empty or too long
2. Invalid difficulty value
3. SaveTest not boolean

---

## 🔍 **Debug Log Analysis Examples**

### **Successful AI Generation Flow**
```json
[
  {"level": "info", "message": "Starting AI test generation process"},
  {"level": "info", "message": "Input validation passed"},
  {"level": "info", "message": "Retrieved user preferences"},
  {"level": "info", "message": "Cloud Function call completed"},
  {"level": "info", "message": "Generated test object created"},
  {"level": "info", "message": "AI test generation completed successfully"}
]
```

### **Failed AI Generation Flow (Your Issue)**
```json
[
  {"level": "info", "message": "Starting AI test generation process"}, ✅
  {"level": "info", "message": "Input validation passed"}, ✅
  {"level": "info", "message": "Retrieved user preferences"}, ✅
  {"level": "info", "message": "Preparing Cloud Function call"}, ✅
  {"level": "debug", "message": "Calling generateAiTest Cloud Function"}, ✅
  {"level": "critical", "message": "AI test generation failed", "errorCode": "functions/internal"} ❌
]
```

**Analysis:** Frontend works perfectly. Cloud Function fails immediately with internal error. **No backend logs = function not executing.**

---

## 🛠️ **Troubleshooting Checklist**

### **AI Generation Issues**
- [ ] Debug logs show frontend validation passing
- [ ] Backend debug logs appear (if not, deployment issue)
- [ ] User is authenticated (`hasUser: true`)
- [ ] Topic is non-empty (`topicLength > 0`)
- [ ] Cloud Function deployed to Firebase
- [ ] Firebase Functions console shows no errors

### **General Platform Issues**
- [ ] Debug system loads (debug button appears)
- [ ] Debug panel opens and displays logs
- [ ] Logs export successfully
- [ ] No existing functionality broken

---

## 📱 **Debug System Features**

### **Real-Time Logging**
- **Automatic categorization** by component
- **Structured data** with context and location
- **Persistent across sessions** (localStorage)
- **Performance optimized** (max 500 logs)
- **Intelligent noise filtering** - Reduces middleware and system log clutter
- **Selective function monitoring** - Target specific functions for focused debugging

### **Advanced Filtering**
- **By Category** - Focus on specific features
- **By Level** - Filter by severity
- **By Location** - Find specific code areas
- **Search functionality** - Find specific messages
- **Noise Filtering** - Automatically filters middleware logs, IDE requests, and compilation messages
- **Smart Deduplication** - Prevents repetitive log spam
- **Selective Logging Mode** - Monitor only specific functions when enabled

### **Export System**
- **JSON format** with metadata
- **Session tracking** with unique IDs  
- **Timestamp precision** for correlation
- **Data compression** for large log sets

### **Integration Points**
- **Frontend flows** - UI interactions, API calls
- **Backend flows** - Cloud Functions, database ops
- **Error boundaries** - Graceful error handling
- **Network monitoring** - Request/response tracking

---

## 🔄 **Debug System Maintenance**

### **Adding New Debug Categories**
```typescript
// In your component
const debugLogger = useDebugLogger();

debugLogger.info('NEW_CATEGORY', 'Description of what happened', {
  relevantData: value,
  context: additionalInfo
}, 'path/to/file.tsx:functionName');
```

### **Debug Log Levels Guide**
- **debug()** - Detailed execution steps, variable states
- **info()** - General flow information, successful operations  
- **warn()** - Non-critical issues, fallback behaviors
- **error()** - Errors that don't break the flow
- **critical()** - System-breaking errors, failed operations

### **Performance Considerations**
- Logs automatically limited to 500 entries
- Debug mode can be disabled in production
- Structured logging for efficient processing
- Local storage for persistence without server load

---

## 📊 **Current Debug Status**

### **Implemented Features** ✅
- ✅ Global debug state management
- ✅ Floating debug UI toggle
- ✅ Real-time log viewer with filtering
- ✅ Frontend AI generation logging
- ✅ Backend Cloud Function logging
- ✅ Export/import functionality
- ✅ Error boundary integration

### **Platform Coverage** ✅  
- ✅ AI generation flow (comprehensive)
- ✅ User authentication flow
- ✅ Test selection and state management
- ✅ Cloud Function interactions
- ✅ Error handling and recovery

---

## 🚨 **Known Issues & Solutions**

### **Issue: Debug Panel Not Opening**
**Solution:** Check if DebugProvider wraps the app in layout.tsx

### **Issue: No Debug Logs Appearing**  
**Solution:** Verify debug mode is enabled and debugLogger is imported

### **Issue: Export File Empty**
**Solution:** Generate some logs first, then export

### **Issue: Performance Impact**
**Solution:** Debug system automatically limits logs and can be disabled

---

## 📞 **Getting Help**

### **When Reporting Issues:**
1. **Enable debug mode** before reproducing issue
2. **Export debug logs** as JSON file
3. **Include error description** and steps to reproduce
4. **Share exported JSON** with developers

### **Debug Log Format:**
```json
{
  "sessionId": "debug_[timestamp]_[random]",
  "exportedAt": "ISO_TIMESTAMP",
  "debugEnabled": true,
  "totalLogs": 123,
  "logs": [
    {
      "id": "log_0",
      "timestamp": 1234567890,
      "level": "info|warn|error|critical|debug",
      "category": "AI_GENERATION|AUTH|UI|etc",
      "message": "Human readable description",
      "data": { "contextual": "data" },
      "location": "path/file.tsx:functionName",
      "sessionId": "session_id"
    }
  ]
}
```

---

## 🎯 **Future Enhancements**

### **Planned Features**
- Remote log aggregation
- Performance metrics integration
- Advanced filtering and search
- Debug session replay
- Automated error detection

---

## 📝 **Changelog**

### **v1.1 (January 2025)**
- Enhanced debug system with noise filtering
- Comprehensive noise pattern filtering for middleware logs, IDE requests, and compilation messages
- Implemented selective logging mode to monitor specific functions only
- Enhanced DebugProvider with targeted function monitoring capabilities
- Updated DebugToggle UI with selective logging controls and function management
- Added smart deduplication to prevent repetitive log spam
- Improved filtering for cleaner debugging experience

### **v1.0 (January 2025)**
- Initial debug system implementation
- AI generation comprehensive logging
- Export/import functionality
- Real-time debug panel
- Error boundary integration

---

*Last Updated: January 2025*
*ZenType Development Team*
