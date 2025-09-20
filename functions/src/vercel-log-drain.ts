import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { Logging } from '@google-cloud/logging';
import * as crypto from 'crypto';

// Initialize Google Cloud Logging
const logging = new Logging({
  projectId: process.env.GCLOUD_PROJECT || 'solotype-23c1f',
});

const log = logging.log('vercel-logs');

interface VercelLogEntry {
  id: string;
  message: string;
  timestamp: number;
  source: 'build' | 'static' | 'lambda' | 'edge';
  projectId: string;
  deploymentId: string;
  buildId?: string;
  level?: 'info' | 'warn' | 'error';
  requestId?: string;
  statusCode?: number;
  method?: string;
  path?: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
  region?: string;
  duration?: number;
  proxy?: {
    timestamp: number;
    method: string;
    scheme: string;
    host: string;
    path: string;
    userAgent: string;
    referer: string;
    statusCode: number;
    clientIp: string;
    region: string;
    cacheId?: string;
    cacheStatus?: string;
  };
}

interface VercelLogPayload {
  logs: VercelLogEntry[];
}

/**
 * Vercel Log Drain endpoint that forwards logs to Google Cloud Logging
 * This function receives logs from Vercel and forwards them to GCP Cloud Logging
 * with proper formatting and correlation ID preservation
 */
export const vercelLogDrain = onRequest(
  {
    cors: true,
    maxInstances: 10,
    concurrency: 10,
    cpu: 1,
    memory: '256MiB',
  },
  async (request, response) => {
    try {
      // Verify the request method
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Verify Vercel signature if secret is configured
      const vercelSecret = process.env.VERCEL_LOG_DRAIN_SECRET;
      if (vercelSecret) {
        const signature = request.headers['x-vercel-signature'] as string;
        if (!signature) {
          logger.warn('Missing Vercel signature header');
          response.status(401).json({ error: 'Missing signature' });
          return;
        }

        const expectedSignature = crypto
          .createHmac('sha1', vercelSecret)
          .update(JSON.stringify(request.body))
          .digest('hex');

        if (signature !== `sha1=${expectedSignature}`) {
          logger.warn('Invalid Vercel signature');
          response.status(401).json({ error: 'Invalid signature' });
          return;
        }
      }

      // Handle Vercel verification challenge
      const vercelChallenge = request.query.challenge as string;
      if (vercelChallenge) {
        const verificationKey = process.env.VERCEL_VERIFICATION_KEY;
        if (!verificationKey) {
          logger.error('VERCEL_VERIFICATION_KEY not configured');
          response.status(500).json({ error: 'Verification key not configured' });
          return;
        }

        const expectedResponse = crypto
          .createHmac('sha1', verificationKey)
          .update(vercelChallenge)
          .digest('hex');

        response.status(200).send(expectedResponse);
        return;
      }

      const payload = request.body as VercelLogPayload;
      
      if (!payload.logs || !Array.isArray(payload.logs)) {
        logger.warn('Invalid log payload received from Vercel');
        response.status(400).json({ error: 'Invalid payload' });
        return;
      }

      // Process each log entry
      const logEntries = payload.logs.map((vercelLog) => {
        // Extract correlation ID from message if present
        const correlationIdMatch = vercelLog.message.match(/\[([^\]]+)\]/);
        const correlationId = correlationIdMatch ? correlationIdMatch[1] : null;

        // Map Vercel log level to Cloud Logging severity
        let severity = 'INFO';
        if (vercelLog.level === 'error' || (vercelLog.statusCode && vercelLog.statusCode >= 500)) {
          severity = 'ERROR';
        } else if (vercelLog.level === 'warn' || (vercelLog.statusCode && vercelLog.statusCode >= 400)) {
          severity = 'WARNING';
        }

        // Create structured log entry for Cloud Logging
        const logEntry = {
          timestamp: new Date(vercelLog.timestamp),
          severity,
          jsonPayload: {
            message: vercelLog.message,
            correlationId,
            source: 'vercel',
            service: 'nextjs-vercel',
            environment: process.env.NODE_ENV || 'production',
            vercel: {
              id: vercelLog.id,
              source: vercelLog.source,
              projectId: vercelLog.projectId,
              deploymentId: vercelLog.deploymentId,
              buildId: vercelLog.buildId,
              requestId: vercelLog.requestId,
              statusCode: vercelLog.statusCode,
              method: vercelLog.method,
              path: vercelLog.path,
              userAgent: vercelLog.userAgent,
              referer: vercelLog.referer,
              ip: vercelLog.ip,
              region: vercelLog.region,
              duration: vercelLog.duration,
              proxy: vercelLog.proxy,
            },
          },
          resource: {
            type: 'cloud_function',
            labels: {
              function_name: 'vercel-log-drain',
              project_id: process.env.GCLOUD_PROJECT || 'solotype-23c1f',
              region: process.env.FUNCTION_REGION || 'us-central1',
            },
          },
          labels: {
            correlationId: correlationId || 'unknown',
            source: 'vercel',
            service: 'nextjs-vercel',
          },
        };

        return log.entry(logEntry);
      });

      // Write all log entries to Cloud Logging
      await log.write(logEntries);

      logger.info(`Successfully forwarded ${logEntries.length} log entries to Cloud Logging`);
      response.status(200).json({ 
        success: true, 
        processed: logEntries.length,
        message: 'Logs forwarded to Cloud Logging'
      });

    } catch (error) {
      logger.error('Error processing Vercel logs:', error);
      response.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);