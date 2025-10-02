import { generateCorrelationId } from './correlation-id';

export interface LogEntry {
  timestamp: string; // ISO 8601 format
  correlationId: string;
  serviceName: string;
  userId?: string;
  functionName: string;
  requestMethod?: string;
  requestPath?: string;
  responseStatusCode?: number;
  executionTimeMs?: number;
  errorDetails?: {
    message: string;
    stack?: string;
    code?: string;
    details?: any;
  };
  additionalContext?: Record<string, any>;
}

export interface LogContext {
  serviceName: string;
  functionName: string;
  userId?: string;
  correlationId?: string;
  requestMethod?: string;
  requestPath?: string;
  additionalContext?: Record<string, any>;
}

export class StructuredLogger {
  private static instance: StructuredLogger;
  
  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  private createBaseLogEntry(context: LogContext): Omit<LogEntry, 'executionTimeMs' | 'responseStatusCode' | 'errorDetails'> {
    return {
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId || generateCorrelationId(),
      serviceName: context.serviceName,
      userId: context.userId,
      functionName: context.functionName,
      requestMethod: context.requestMethod,
      requestPath: context.requestPath,
      additionalContext: context.additionalContext
    };
  }

  info(context: LogContext, message: string, additionalData?: Record<string, any>): void {
    const logEntry: LogEntry = {
      ...this.createBaseLogEntry(context),
      additionalContext: {
        ...context.additionalContext,
        message,
        level: 'info',
        ...additionalData
      }
    };
    
    console.log(JSON.stringify(logEntry));
  }

  warn(context: LogContext, message: string, additionalData?: Record<string, any>): void {
    const logEntry: LogEntry = {
      ...this.createBaseLogEntry(context),
      additionalContext: {
        ...context.additionalContext,
        message,
        level: 'warn',
        ...additionalData
      }
    };
    
    console.warn(JSON.stringify(logEntry));
  }

  error(context: LogContext, error: Error | string, additionalData?: Record<string, any>): void {
    const errorDetails = typeof error === 'string' 
      ? { message: error }
      : {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
          details: (error as any).details
        };

    const logEntry: LogEntry = {
      ...this.createBaseLogEntry(context),
      errorDetails,
      additionalContext: {
        ...context.additionalContext,
        level: 'error',
        ...additionalData
      }
    };
    
    console.error(JSON.stringify(logEntry));
  }

  logRequest(context: LogContext, startTime: number, responseStatusCode: number, additionalData?: Record<string, any>): void {
    const executionTimeMs = Date.now() - startTime;
    
    const logEntry: LogEntry = {
      ...this.createBaseLogEntry(context),
      responseStatusCode,
      executionTimeMs,
      additionalContext: {
        ...context.additionalContext,
        level: 'request',
        ...additionalData
      }
    };
    
    console.log(JSON.stringify(logEntry));
  }
}

// Convenience functions for common use cases
export const logger = StructuredLogger.getInstance();

// Helper function to create timing context
export function createTimingContext(): { startTime: number } {
  return { startTime: Date.now() };
}

/**
 * Builds a LogContext for a Next.js API route.
 *
 * @param req - The incoming request object; if present this function reads `x-correlation-id` from headers (supports both `headers.get` and legacy header access), and uses `req.method` and `req.url` or `req.nextUrl?.pathname` for request metadata.
 * @param userId - Optional user identifier to include in the context
 * @returns A LogContext prefilled for API logging: `serviceName` set to `"nextjs-api"`, the provided `functionName`, optional `userId`, a `correlationId` taken from the `x-correlation-id` header or newly generated, `requestMethod`, and `requestPath`.
 */
export function createApiContext(req: any, functionName: string, userId?: string): LogContext {
  const correlationId = req.headers?.get ? req.headers.get('x-correlation-id') : req.headers?.['x-correlation-id'];
  
  return {
    serviceName: 'nextjs-api',
    functionName,
    userId,
    correlationId: correlationId || generateCorrelationId(),
    requestMethod: req.method,
    requestPath: req.url || req.nextUrl?.pathname
  };
}

// Helper function for Firebase function logging
export function createFirebaseContext(functionName: string, userId?: string): LogContext {
  return {
    serviceName: `firebase-function-${functionName}`,
    functionName,
    userId
  };
}

// Helper function for AI service logging
export function createAiContext(functionName: string, userId?: string): LogContext {
  return {
    serviceName: 'ai-service',
    functionName,
    userId
  };
}