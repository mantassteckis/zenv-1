# Vercel Log Drain Setup Guide

This guide explains how to configure Vercel Log Drains to forward Next.js application logs to Google Cloud Logging through our Firebase Cloud Function.

## Overview

The centralized logging system consists of:
1. **Vercel Log Drains** - Forwards Vercel deployment and runtime logs
2. **Firebase Cloud Function** (`vercelLogDrain`) - Receives and processes logs from Vercel
3. **Google Cloud Logging** - Stores and indexes all logs with correlation IDs
4. **Structured Logging** - Maintains consistent log format across all sources

## Prerequisites

- Firebase project: `solotype-23c1f`
- Vercel project connected to this repository
- Google Cloud Logging API enabled (automatically enabled with Firebase)

## Step 1: Deploy the Log Drain Function

### 1.1 Set Environment Variables

Add these environment variables to your Firebase Functions configuration:

```bash
# Set Vercel log drain secret (generate a secure random string)
firebase functions:config:set vercel.log_drain_secret="your-secure-secret-here"

# Set Vercel verification key (generate another secure random string)
firebase functions:config:set vercel.verification_key="your-verification-key-here"
```

### 1.2 Deploy the Function

```bash
# From the project root
firebase deploy --only functions:vercelLogDrain
```

### 1.3 Get the Function URL

After deployment, you'll get a URL like:
```
https://us-central1-solotype-23c1f.cloudfunctions.net/vercelLogDrain
```

## Step 2: Configure Vercel Log Drain

### 2.1 Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add the log drain
vercel env add VERCEL_LOG_DRAIN_SECRET
# Enter the same secret you used in Firebase Functions config

vercel env add VERCEL_VERIFICATION_KEY  
# Enter the same verification key you used in Firebase Functions config

# Create the log drain
vercel integration add log-drains
# Follow the prompts and enter your Cloud Function URL
```

### 2.2 Using Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Integrations**
3. Find **Log Drains** and click **Add**
4. Enter the Cloud Function URL:
   ```
   https://us-central1-solotype-23c1f.cloudfunctions.net/vercelLogDrain
   ```
5. Add the secret headers:
   - `X-Vercel-Signature`: Use the same secret from Firebase config

## Step 3: Verify the Setup

### 3.1 Check Function Logs

```bash
# View Firebase Function logs
firebase functions:log --only vercelLogDrain
```

### 3.2 Check Google Cloud Logging

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project `solotype-23c1f`
3. Navigate to **Logging** → **Logs Explorer**
4. Use this filter to see Vercel logs:
   ```
   resource.type="cloud_function"
   resource.labels.function_name="vercel-log-drain"
   jsonPayload.source="vercel"
   ```

### 3.3 Test Log Flow

1. Deploy a change to trigger Vercel build logs
2. Make some requests to your Next.js app to generate runtime logs
3. Check both Firebase Function logs and Google Cloud Logging

## Log Structure

Logs forwarded to Google Cloud Logging will have this structure:

```json
{
  "timestamp": "2024-01-20T10:30:00.000Z",
  "severity": "INFO",
  "jsonPayload": {
    "message": "[abc123] GET /api/users - 200 - 45ms",
    "correlationId": "abc123",
    "source": "vercel",
    "service": "nextjs-vercel",
    "environment": "production",
    "vercel": {
      "id": "log-entry-id",
      "source": "lambda",
      "projectId": "prj_xxx",
      "deploymentId": "dpl_xxx",
      "requestId": "req_xxx",
      "statusCode": 200,
      "method": "GET",
      "path": "/api/users",
      "duration": 45,
      "region": "iad1"
    }
  },
  "resource": {
    "type": "cloud_function",
    "labels": {
      "function_name": "vercel-log-drain",
      "project_id": "solotype-23c1f",
      "region": "us-central1"
    }
  },
  "labels": {
    "correlationId": "abc123",
    "source": "vercel",
    "service": "nextjs-vercel"
  }
}
```

## Troubleshooting

### Common Issues

1. **Function not receiving logs**
   - Check Vercel log drain configuration
   - Verify the Cloud Function URL is correct
   - Check Firebase Function logs for errors

2. **Authentication errors**
   - Verify `VERCEL_LOG_DRAIN_SECRET` matches in both Vercel and Firebase
   - Check `VERCEL_VERIFICATION_KEY` is set correctly

3. **Logs not appearing in Cloud Logging**
   - Check Google Cloud Logging API is enabled
   - Verify Firebase project permissions
   - Check for quota limits

### Debug Commands

```bash
# Check Firebase Function status
firebase functions:log --only vercelLogDrain --limit 50

# Test the function directly
curl -X POST https://us-central1-solotype-23c1f.cloudfunctions.net/vercelLogDrain \
  -H "Content-Type: application/json" \
  -d '{"logs":[{"id":"test","message":"Test log","timestamp":1642680600000,"source":"lambda","projectId":"test","deploymentId":"test"}]}'

# Check Vercel project settings
vercel project ls
vercel env ls
```

## Security Considerations

1. **Secrets Management**
   - Use strong, randomly generated secrets
   - Rotate secrets periodically
   - Never commit secrets to version control

2. **Access Control**
   - The Cloud Function validates Vercel signatures
   - Only authenticated Vercel requests are processed
   - Logs are stored in your private Google Cloud project

3. **Data Privacy**
   - Logs may contain sensitive information
   - Configure appropriate retention policies
   - Monitor access to Cloud Logging

## Next Steps

After setting up the log drain:

1. **Configure Log Retention** - Set up automatic log deletion policies
2. **Set Up Alerting** - Create alerts for error rates and critical issues
3. **Build Debug Dashboard** - Create a UI for searching logs by correlation ID
4. **Monitor Costs** - Set up billing alerts for Cloud Logging usage

## Cost Optimization

- **Log Sampling**: Consider sampling non-critical logs in high-traffic scenarios
- **Retention Policies**: Set appropriate retention periods (30 days general, 90 days errors)
- **Filtering**: Filter out noisy logs that don't provide value
- **Monitoring**: Set up billing alerts to track Cloud Logging costs

---

**Last Updated**: January 2024  
**Status**: Ready for deployment  
**Next Phase**: Debug dashboard and alerting setup