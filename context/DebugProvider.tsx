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
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

interface DebugProviderProps {
  children: React.ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const sessionId = useRef(generateSessionId());
  const logIdCounter = useRef(0);

  // Load debug state from localStorage
  useEffect(() => {
    const savedDebugState = localStorage.getItem('zentype-debug-enabled');
    if (savedDebugState === 'true') {
      setIsDebugEnabled(true);
    }
  }, []);

  // Generate unique session ID
  function generateSessionId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Toggle debug mode
  const toggleDebug = useCallback(() => {
    setIsDebugEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('zentype-debug-enabled', newState.toString());
      
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
  }, [isDebugEnabled]);

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
