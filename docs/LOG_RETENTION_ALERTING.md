# Log Retention and Alerting Configuration

This document outlines the configuration for log retention policies and automated alerting for the ZenType centralized logging system.

## Log Retention Policies

### Overview

Log retention policies help manage storage costs while ensuring critical logs are available for debugging and compliance.

### Retention Configuration

#### 1. General Application Logs
- **Retention Period**: 30 days
- **Log Types**: INFO, DEBUG logs from Next.js and Firebase Functions
- **Storage Class**: Standard
- **Auto-deletion**: Enabled

#### 2. Error and Warning Logs
- **Retention Period**: 90 days
- **Log Types**: ERROR, WARNING severity logs
- **Storage Class**: Standard (first 30 days), then Coldline
- **Auto-deletion**: Enabled after 90 days

#### 3. Critical System Events
- **Retention Period**: 1 year
- **Log Types**: Authentication failures, security events, system crashes
- **Storage Class**: Standard (first 30 days), Coldline (30-365 days)
- **Auto-deletion**: Manual review required

### Implementation Steps

#### Step 1: Create Log Sinks with Retention

```bash
# Create sink for general logs (30 days)
gcloud logging sinks create general-logs-30d \
  "storage.googleapis.com/zentype-logs-general" \
  --log-filter='severity<="INFO" AND NOT (severity="ERROR" OR severity="WARNING")' \
  --project=solotype-23c1f

# Create sink for error logs (90 days)
gcloud logging sinks create error-logs-90d \
  "storage.googleapis.com/zentype-logs-errors" \
  --log-filter='severity>="WARNING"' \
  --project=solotype-23c1f

# Create sink for critical events (1 year)
gcloud logging sinks create critical-logs-1y \
  "storage.googleapis.com/zentype-logs-critical" \
  --log-filter='jsonPayload.event_type="security" OR jsonPayload.event_type="auth_failure" OR severity="CRITICAL"' \
  --project=solotype-23c1f
```

#### Step 2: Configure Cloud Storage Buckets

```bash
# Create buckets with lifecycle policies
gsutil mb -p solotype-23c1f -c STANDARD -l us-central1 gs://zentype-logs-general
gsutil mb -p solotype-23c1f -c STANDARD -l us-central1 gs://zentype-logs-errors
gsutil mb -p solotype-23c1f -c STANDARD -l us-central1 gs://zentype-logs-critical

# Set lifecycle policies
gsutil lifecycle set lifecycle-general.json gs://zentype-logs-general
gsutil lifecycle set lifecycle-errors.json gs://zentype-logs-errors
gsutil lifecycle set lifecycle-critical.json gs://zentype-logs-critical
```

#### Step 3: Lifecycle Policy Files

**lifecycle-general.json** (30 days retention):
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 30
        }
      }
    ]
  }
}
```

**lifecycle-errors.json** (90 days retention with storage class transition):
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "COLDLINE"
        },
        "condition": {
          "age": 30
        }
      },
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90
        }
      }
    ]
  }
}
```

**lifecycle-critical.json** (1 year retention):
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "COLDLINE"
        },
        "condition": {
          "age": 30
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "ARCHIVE"
        },
        "condition": {
          "age": 365
        }
      }
    ]
  }
}
```

## Automated Alerting Configuration

### Alert Policies

#### 1. High Error Rate Alert

**Purpose**: Detect when error rate exceeds normal thresholds

**Configuration**:
- **Metric**: `logging.googleapis.com/log_entry_count`
- **Filter**: `severity="ERROR"`
- **Threshold**: > 10 errors per minute
- **Duration**: 5 minutes
- **Notification**: Email, Slack

```yaml
# error-rate-alert.yaml
displayName: "High Error Rate Alert"
combiner: OR
conditions:
  - displayName: "Error rate > 10/min"
    conditionThreshold:
      filter: 'resource.type="cloud_function" AND severity="ERROR"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 10
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
notificationChannels:
  - projects/solotype-23c1f/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/solotype-23c1f/notificationChannels/[SLACK_CHANNEL_ID]
```

#### 2. 5xx Server Error Spike Alert

**Purpose**: Detect sudden increases in server errors

**Configuration**:
- **Metric**: HTTP 5xx status codes
- **Threshold**: > 5 errors in 2 minutes
- **Notification**: Immediate email + SMS

```yaml
# server-error-spike.yaml
displayName: "5xx Server Error Spike"
combiner: OR
conditions:
  - displayName: "5xx errors > 5 in 2min"
    conditionThreshold:
      filter: 'jsonPayload.statusCode>=500 AND jsonPayload.statusCode<600'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 5
      duration: 120s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
notificationChannels:
  - projects/solotype-23c1f/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/solotype-23c1f/notificationChannels/[SMS_CHANNEL_ID]
```

#### 3. Authentication Failure Alert

**Purpose**: Detect potential security threats

**Configuration**:
- **Metric**: Authentication failure events
- **Threshold**: > 20 failures in 5 minutes from same IP
- **Notification**: Security team email

```yaml
# auth-failure-alert.yaml
displayName: "Authentication Failure Alert"
combiner: OR
conditions:
  - displayName: "Auth failures > 20 in 5min"
    conditionThreshold:
      filter: 'jsonPayload.event_type="auth_failure"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 20
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
          groupByFields:
            - "jsonPayload.client_ip"
notificationChannels:
  - projects/solotype-23c1f/notificationChannels/[SECURITY_EMAIL_CHANNEL_ID]
```

### Notification Channels Setup

#### Email Notifications

```bash
# Create email notification channel
gcloud alpha monitoring channels create \
  --display-name="ZenType Alerts Email" \
  --type=email \
  --channel-labels=email_address=alerts@zentype.com \
  --project=solotype-23c1f
```

#### Slack Integration

```bash
# Create Slack notification channel
gcloud alpha monitoring channels create \
  --display-name="ZenType Alerts Slack" \
  --type=slack \
  --channel-labels=channel_name=#alerts,url=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  --project=solotype-23c1f
```

#### SMS Notifications (Critical Only)

```bash
# Create SMS notification channel
gcloud alpha monitoring channels create \
  --display-name="ZenType Critical SMS" \
  --type=sms \
  --channel-labels=number=+1234567890 \
  --project=solotype-23c1f
```

### Alert Policy Deployment

```bash
# Deploy alert policies
gcloud alpha monitoring policies create --policy-from-file=error-rate-alert.yaml --project=solotype-23c1f
gcloud alpha monitoring policies create --policy-from-file=server-error-spike.yaml --project=solotype-23c1f
gcloud alpha monitoring policies create --policy-from-file=auth-failure-alert.yaml --project=solotype-23c1f
```

## Error Tracking and Grouping

### Google Cloud Error Reporting Integration

#### Automatic Error Detection

Error Reporting automatically detects and groups errors from:
- Cloud Functions
- App Engine
- Compute Engine
- Kubernetes Engine
- Cloud Run

#### Custom Error Reporting

For Next.js application errors, integrate with Error Reporting:

```typescript
// lib/error-reporting.ts
import { ErrorReporting } from '@google-cloud/error-reporting';

const errors = new ErrorReporting({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export function reportError(error: Error, request?: any) {
  errors.report(error, {
    httpRequest: request ? {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      referrer: request.headers.referer,
      responseStatusCode: 500,
    } : undefined,
  });
}
```

### Error Grouping Strategy

1. **By Error Type**: Group similar errors together
2. **By Service**: Separate errors by source service
3. **By Severity**: Prioritize critical errors
4. **By Frequency**: Focus on most common issues

## Monitoring Dashboard

### Key Metrics to Track

1. **Error Rate**: Errors per minute/hour
2. **Response Time**: P50, P95, P99 latencies
3. **Throughput**: Requests per second
4. **Availability**: Uptime percentage
5. **Log Volume**: Logs ingested per day
6. **Storage Usage**: Log storage consumption

### Custom Dashboard Creation

```bash
# Create custom monitoring dashboard
gcloud monitoring dashboards create --config-from-file=zentype-dashboard.json --project=solotype-23c1f
```

## Cost Optimization

### Log Sampling

Implement log sampling for high-volume, low-value logs:

```typescript
// Implement sampling in structured logger
const shouldLog = (level: string, sampleRate: number = 1.0): boolean => {
  if (level === 'ERROR' || level === 'WARNING') {
    return true; // Always log errors and warnings
  }
  return Math.random() < sampleRate;
};
```

### Billing Alerts

```bash
# Create billing alert for Cloud Logging
gcloud alpha billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Cloud Logging Budget" \
  --budget-amount=100USD \
  --threshold-rules-percent=50,90 \
  --threshold-rules-spend-basis=CURRENT_SPEND \
  --all-updates-rule-pubsub-topic=projects/solotype-23c1f/topics/billing-alerts
```

## Security Considerations

1. **Access Control**: Limit log access to authorized personnel
2. **Data Encryption**: Ensure logs are encrypted at rest and in transit
3. **Audit Logging**: Log access to sensitive log data
4. **Data Retention**: Follow compliance requirements for log retention
5. **PII Scrubbing**: Remove or mask personally identifiable information

## Testing and Validation

### Test Alert Policies

```bash
# Generate test errors to validate alerting
curl -X POST https://your-app.vercel.app/api/test/error

# Check alert policy status
gcloud alpha monitoring policies list --project=solotype-23c1f

# View recent alerts
gcloud alpha monitoring incidents list --project=solotype-23c1f
```

### Validate Log Retention

```bash
# Check log retention settings
gsutil lifecycle get gs://zentype-logs-general
gsutil lifecycle get gs://zentype-logs-errors
gsutil lifecycle get gs://zentype-logs-critical
```

---

**Last Updated**: January 2024  
**Status**: Configuration ready for deployment  
**Next Steps**: Deploy policies and test alerting system