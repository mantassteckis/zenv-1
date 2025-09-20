"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// Debug log levels
export type DebugLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Debug log entry structure
export interface DebugLogEntry {
  id: string;
  timestamp: number;
  level: DebugLevel;
  category: string;
  message: string;
  data?: any;
  location?: string;
  userId?: string;
  sessionId?: string;
}

// Debug context interface
interface DebugContextType {
  isDebugEnabled: boolean;
  toggleDebug: () => void;
  logs: DebugLogEntry[];
  addLog: (level: DebugLevel, category: string, message: string, data?: any, location?: string) => void;
  clearLogs: () => void;
  exportLogs: () => string;
  getLogsByCategory: (category: string) => DebugLogEntry[];
  getLogsByLevel: (level: DebugLevel) => DebugLogEntry[];
  sessionId: string;
  // Selective logging features
  selectiveMode: boolean;
  toggleSelectiveMode: () => void;
  targetedFunctions: Set<string>;
  addTargetFunction: (functionName: string) => void;
  removeTargetFunction: (functionName: string) => void;
  clearTargetFunctions: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

interface DebugProviderProps {
  children: React.ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [targetedFunctions, setTargetedFunctions] = useState<Set<string>>(new Set());
  const [selectiveMode, setSelectiveMode] = useState(false);
  const sessionId = useRef(generateSessionId());
  const logIdCounter = useRef(0);
  const recentMessages = useRef(new Map<string, { count: number; lastSeen: number }>());

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  


  // Generate unique session ID
  function generateSessionId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }



  // Load debug state from localStorage (only after mount)
  useEffect(() => {
    if (!isMounted) return;
    
    const savedDebugState = localStorage.getItem('zentype-debug-enabled');
    if (savedDebugState === 'true') {
      setIsDebugEnabled(true);
    }
  }, [isMounted]);

  // Smart filtering for noise reduction
  const shouldFilterMessage = useCallback((message: string, category: string): boolean => {
    // Filter out common React/Next.js noise
    const noisePatterns = [
      /Failed to fetch user preferences/,
      /Rendered more hooks than during the previous render/,
      /React has detected a change in the order of Hooks/,
      /Warning: validateDOMNesting/,
      /Warning: Each child in a list should have a unique "key" prop/,
      /Hydration failed because the initial UI/,
      /There was an error while hydrating/,
      /Text content does not match server-rendered HTML/,
      // Middleware and system noise patterns
      /"timestamp".*"correlationId".*"serviceName":"nextjs-api"/,
      /"functionName":"middleware"/,
      /GET \/?\?ide_webview_request_time=/,
      /Fast Refresh had to perform a full reload/,
      /Compiled in \d+ms \(\d+ modules\)/,
      /✓ Compiled/,
      /⚠ Fast Refresh/,
      // Additional Next.js development noise
      /webpack-hmr/,
      /hot-reload/,
      /\[HMR\]/,
      /\[webpack\]/,
      // IDE and development server noise
      /ide_webview_request_time/,
      /localhost:\d+.*404/,
      /GET.*404 in \d+ms/,
      /GET.*200 in \d+ms/,
    ];

    // Allow our custom categories through
    const importantCategories = ['AI_GENERATION', 'UI', 'PERFORMANCE', 'AUTH', 'API', 'SYSTEM', 'DEBUG_SYSTEM', 'USER_ACTION', 'BUSINESS_LOGIC'];
    if (importantCategories.includes(category)) {
      return false; // Don't filter important categories
    }

    // Filter noise patterns
    return noisePatterns.some(pattern => pattern.test(message));
  }, []);

  // Deduplication logic
  const isDuplicateMessage = useCallback((message: string): boolean => {
    const now = Date.now();
    const messageKey = message.substring(0, 100); // Use first 100 chars as key
    const recent = recentMessages.current.get(messageKey);
    
    if (recent) {
      // If same message within 5 seconds, increment count
      if (now - recent.lastSeen < 5000) {
        recent.count++;
        recent.lastSeen = now;
        // Suppress if more than 3 occurrences in 5 seconds
        return recent.count > 3;
      } else {
        // Reset if more than 5 seconds passed
        recentMessages.current.set(messageKey, { count: 1, lastSeen: now });
      }
    } else {
      recentMessages.current.set(messageKey, { count: 1, lastSeen: now });
    }
    
    return false;
  }, []);

  // Add log entry (internal function)
  const addLogEntry = useCallback((
    level: DebugLevel,
    category: string,
    message: string,
    data?: any,
    location?: string
  ) => {
    if (!isDebugEnabled) return;

    // Apply selective mode filtering
    if (selectiveMode && targetedFunctions.size > 0) {
      const functionName = data?.functionName || location;
      if (functionName && !targetedFunctions.has(functionName)) {
        return; // Skip if not in targeted functions
      }
    }

    // Apply smart filtering
    if (shouldFilterMessage(message, category) || isDuplicateMessage(message)) {
      return;
    }

    const logEntry: DebugLogEntry = {
      id: `log_${logIdCounter.current++}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      location,
      sessionId: sessionId.current,
    };

    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Keep only last 500 logs to prevent memory issues
      return newLogs.slice(-500);
    });

    // Also log to browser console if debug is enabled
    const consoleMethod = level === 'critical' || level === 'error' ? 'error' 
                        : level === 'warn' ? 'warn'
                        : level === 'debug' ? 'debug'
                        : 'log';
    
    console[consoleMethod](
      `🔍 [${category}] ${message}`,
      data ? data : '',
      location ? `@ ${location}` : ''
    );
  }, [isDebugEnabled, shouldFilterMessage, isDuplicateMessage]);

  // Toggle debug mode
  const toggleDebug = useCallback(() => {
    setIsDebugEnabled(prev => {
      const newState = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('zentype-debug-enabled', newState.toString());
      }
      
      // Clear logs when disabling debug mode
      if (!newState) {
        setLogs([]);
      }
      
      // Log the toggle action
      if (newState) {
        addLogEntry('info', 'DEBUG_SYSTEM', 'Debug mode enabled', { sessionId: sessionId.current });
      }
      
      return newState;
    });
  }, [addLogEntry]);

  // Intercept console errors to filter noise (separate effect)
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      // Only add to our debug logs if it's not filtered noise
      if (isDebugEnabled && !shouldFilterMessage(message, 'CONSOLE_ERROR')) {
        addLogEntry('error', 'CONSOLE_ERROR', message, { args });
      }
      
      // Still call original console.error for development
      originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Only add to our debug logs if it's not filtered noise
      if (isDebugEnabled && !shouldFilterMessage(message, 'CONSOLE_WARN')) {
        addLogEntry('warn', 'CONSOLE_WARN', message, { args });
      }
      
      // Still call original console.warn for development
      originalConsoleWarn.apply(console, args);
    };
    
    // Cleanup function to restore original console methods
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [isMounted, isDebugEnabled, shouldFilterMessage, addLogEntry]);

  // Public add log function
  const addLog = useCallback((
    level: DebugLevel,
    category: string,
    message: string,
    data?: any,
    location?: string
  ) => {
    addLogEntry(level, category, message, data, location);
  }, [addLogEntry]);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    addLogEntry('info', 'DEBUG_SYSTEM', 'Logs cleared', { clearedAt: new Date().toISOString() });
  }, [addLogEntry]);

  // Export logs as JSON string
  const exportLogs = useCallback(() => {
    const exportData = {
      sessionId: sessionId.current,
      exportedAt: new Date().toISOString(),
      debugEnabled: isDebugEnabled,
      totalLogs: logs.length,
      logs: logs
    };
    return JSON.stringify(exportData, null, 2);
  }, [logs, isDebugEnabled]);

  // Get logs by category
  const getLogsByCategory = useCallback((category: string) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  // Get logs by level
  const getLogsByLevel = useCallback((level: DebugLevel) => {
    return logs.filter(log => log.level === level);
  }, [logs]);

  // Selective logging controls
  const toggleSelectiveMode = useCallback(() => {
    setSelectiveMode(prev => {
      const newMode = !prev;
      addLogEntry('info', 'DEBUG_SYSTEM', `Selective mode ${newMode ? 'enabled' : 'disabled'}`, {
        targetedFunctions: Array.from(targetedFunctions),
        functionsCount: targetedFunctions.size
      });
      return newMode;
    });
  }, [targetedFunctions, addLogEntry]);

  const addTargetFunction = useCallback((functionName: string) => {
    setTargetedFunctions(prev => {
      const newSet = new Set(prev);
      newSet.add(functionName);
      addLogEntry('info', 'DEBUG_SYSTEM', `Added target function: ${functionName}`, {
        totalTargets: newSet.size,
        allTargets: Array.from(newSet)
      });
      return newSet;
    });
  }, [addLogEntry]);

  const removeTargetFunction = useCallback((functionName: string) => {
    setTargetedFunctions(prev => {
      const newSet = new Set(prev);
      newSet.delete(functionName);
      addLogEntry('info', 'DEBUG_SYSTEM', `Removed target function: ${functionName}`, {
        totalTargets: newSet.size,
        allTargets: Array.from(newSet)
      });
      return newSet;
    });
  }, [addLogEntry]);

  const clearTargetFunctions = useCallback(() => {
    const count = targetedFunctions.size;
    setTargetedFunctions(new Set());
    addLogEntry('info', 'DEBUG_SYSTEM', `Cleared all target functions`, {
      clearedCount: count
    });
  }, [targetedFunctions.size, addLogEntry]);

  const contextValue: DebugContextType = {
    isDebugEnabled,
    toggleDebug,
    logs,
    addLog,
    clearLogs,
    exportLogs,
    getLogsByCategory,
    getLogsByLevel,
    sessionId: sessionId.current,
    selectiveMode,
    toggleSelectiveMode,
    targetedFunctions,
    addTargetFunction,
    removeTargetFunction,
    clearTargetFunctions,
  };

  return (
    <DebugContext.Provider value={contextValue}>
      {children}
    </DebugContext.Provider>
  );
}

// Hook to use debug context
export function useDebug(): DebugContextType {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}

// Convenience hooks for different log levels
export function useDebugLogger() {
  const { addLog, isDebugEnabled } = useDebug();
  
  return {
    isDebugEnabled,
    debug: (category: string, message: string, data?: any, location?: string) => 
      addLog('debug', category, message, data, location),
    info: (category: string, message: string, data?: any, location?: string) => 
      addLog('info', category, message, data, location),
    warn: (category: string, message: string, data?: any, location?: string) => 
      addLog('warn', category, message, data, location),
    error: (category: string, message: string, data?: any, location?: string) => 
      addLog('error', category, message, data, location),
    critical: (category: string, message: string, data?: any, location?: string) => 
      addLog('critical', category, message, data, location),
    
    // Enhanced debugging helpers
    stateChange: (category: string, stateName: string, oldValue: any, newValue: any, location?: string) => {
      addLog('debug', category, `State Change: ${stateName}`, {
        stateName,
        oldValue: typeof oldValue === 'string' && oldValue.length > 100 
          ? `${oldValue.substring(0, 100)}... [truncated ${oldValue.length} chars]`
          : oldValue,
        newValue: typeof newValue === 'string' && newValue.length > 100 
          ? `${newValue.substring(0, 100)}... [truncated ${newValue.length} chars]`
          : newValue,
        oldType: typeof oldValue,
        newType: typeof newValue,
        changed: oldValue !== newValue
      }, location);
    },
    
    textContent: (category: string, name: string, text: string, location?: string) => {
      addLog('debug', category, `Text Content: ${name}`, {
        contentName: name,
        textLength: text?.length || 0,
        wordCount: text ? text.split(' ').length : 0,
        firstWords: text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : '',
        lastWords: text && text.length > 100 ? '...' + text.substring(text.length - 50) : '',
        isEmpty: !text || text.trim().length === 0
      }, location);
    },
    
    functionFlow: (category: string, functionName: string, action: 'enter' | 'exit' | 'checkpoint', data?: any, location?: string) => {
      addLog('debug', category, `Function ${action.toUpperCase()}: ${functionName}`, {
        functionName,
        action,
        timestamp: Date.now(),
        ...data
      }, location);
    }
  };
}
