# 🚀 ZenType Live Deployment Guide

Complete step-by-step guide to deploy ZenType from any device with all necessary requirements, accounts, and configurations.

**Last Updated:** January 2025  
**Status:** ✅ PRODUCTION READY - DEPLOYED TO FIREBASE APP HOSTING  
**Current Version:** v2.1.0 with Rate Limiting & Enhanced Debug System  
**Production URL:** Available via Firebase Console App Hosting section

## 📋 Prerequisites & System Requirements

### **System Requirements**
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (or pnpm 8.0+)
- **Git**: Latest version for version control
- **Terminal/Command Line**: Access to bash, PowerShell, or equivalent

### **Check Your System**
```bash
# Verify Node.js version
node --version    # Should be 18.0+

# Verify npm version  
npm --version     # Should be 9.0+

# Verify Git
git --version     # Any recent version
```

---

## 🔑 Required Accounts & API Keys

### **1. Google/Firebase Account**
- **Google Account**: Personal or business account with admin privileges
- **Firebase Project ID**: `solotype-23c1f`
- **Firebase Authentication**: Enable Email/Password and Google Sign-in
- **Firestore Database**: Set up in production mode

### **2. Firebase Service Account (for AI Features)**
```bash
# Firebase project configuration
PROJECT_ID="solotype-23c1f"
REGION="us-central1"
```

### **3. Required API Keys & Environment Variables**
Create a `.env.local` file in the project root:
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyAipHBANeyyXgq1n9h2G33PAwtuXkMRu-w"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="solotype-23c1f.firebaseapp.com" 
NEXT_PUBLIC_FIREBASE_PROJECT_ID="solotype-23c1f"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="solotype-23c1f.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="39439361072"
NEXT_PUBLIC_FIREBASE_APP_ID="1:39439361072:web:27661c0d7e4e341a02b9f5"

# Google AI API (for AI test generation)
GOOGLE_AI_API_KEY="your-google-ai-api-key"
GENKIT_ENV="prod"
```

---

## 🛠️ Installation & Setup Steps

### **Step 1: Clone & Install**
```bash
# Clone the repository
git clone [repository-url] zentype
cd zentype

# Install dependencies
npm install
# OR if using pnpm
pnpm install

# Install Firebase CLI globally
npm install -g firebase-tools
```

### **Step 2: Firebase Authentication**
```bash
# Login to Firebase (opens browser)
firebase login

# Verify you're logged into correct account
firebase projects:list

# Set active project
firebase use solotype-23c1f

# Verify configuration
firebase use --debug
```

### **Step 3: Environment Setup**
```bash
# Create environment file
touch .env.local
# Add all environment variables listed above

# Verify Firebase config
firebase functions:config:get
```

### **Step 4: Local Development Test**
```bash
# Test local development server
npm run dev
# Should start on http://localhost:3000

# Test build process
npm run build
# Should complete without errors
```

---

## 🔥 Firebase Setup & Configuration

### **1. Firebase Project Setup**
- **Project ID**: `solotype-23c1f`
- **Region**: `us-central1` (critical for Cloud Functions)
- **Billing**: Blaze Plan required for Cloud Functions

### **2. Firebase Services Configuration**

#### **Authentication**
```bash
# Enable Authentication providers
firebase auth:providers:enable password
firebase auth:providers:enable google.com
```

#### **Firestore Database**
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Required collections:
# - profiles (user profiles)
# - test_results (typing test results)  
# - test_contents (pre-made tests)
```

#### **Cloud Functions**
```bash
# Navigate to functions directory
cd functions

# Install function dependencies
npm install

# Build functions
npm run build

# Deploy functions
firebase deploy --only functions
```

### **3. Required Cloud Functions**
- `submitTestResult` - Saves typing test results (✅ DEPLOYED with rate limiting: 100 req/hour)
- `generateAiTest` - Creates AI-generated typing tests (✅ DEPLOYED with rate limiting: 20 req/hour)
- `vercelLogDrain` - Processes Vercel log drains for centralized logging (✅ DEPLOYED)

### **4. Rate Limiting Implementation** ✅
- **Backend**: `firebase-functions-rate-limiter` with Firestore backend
- **AI Generation**: 20 requests per hour per authenticated user
- **Test Submission**: 100 requests per hour per authenticated user
- **Monitoring**: Integrated with enhanced debug system (RATE_LIMITING category)

---

## 🌐 Firebase App Hosting Deployment (RECOMMENDED)

### **What is Firebase App Hosting?**
Firebase App Hosting is the modern, integrated deployment solution for Next.js applications that provides:
- **Unified Deployment**: Single command deploys your entire Next.js app with all Firebase services
- **Source Control Integration**: Direct integration with your Git repository
- **Server-Side Rendering**: Full support for Next.js App Router and SSR
- **Environment Management**: Seamless environment variable handling
- **Firebase Extensions**: Built-in integration with all Firebase services
- **Automatic Scaling**: Handles traffic spikes automatically

### **Firebase App Hosting vs Traditional Hosting**
- **Traditional Firebase Hosting**: Static files only, requires separate function deployment
- **Firebase App Hosting**: Full-stack Next.js deployment with integrated backend

### **Configuration Files**

#### **firebase.json**
```json
{
  "functions": {
    "source": "functions",
    "predeploy": ["npm run build"]
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "apphosting": {
    "source": {
      "backendId": "zentype-v0",
      "rootDirectory": "/",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ]
    }
  }
}
```

#### **apphosting.yaml**
```yaml
# Firebase App Hosting configuration
runConfig:
  cpu: 1
  memoryMiB: 512
  maxInstances: 10
  minInstances: 0
  concurrency: 100

env:
  - variable: NODE_ENV
    value: production
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: solotype-23c1f
```

### **Deployment Process**

#### **Step 1: Prepare for Deployment**
```bash
# Ensure you're in the project root
cd /path/to/zentype

# Verify Firebase authentication
firebase login
firebase use solotype-23c1f

# Test local build (important!)
npm run build
```

#### **Step 2: Handle ESLint Issues (if needed)**
If you encounter ESLint errors during build:
```javascript
// next.config.mjs - Temporarily disable ESLint during builds
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Allows deployment while keeping dev warnings
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // ... other config
};
```

#### **Step 3: Deploy to Firebase App Hosting**
```bash
# Single command deployment
firebase deploy

# What happens during deployment:
# 1. Authentication check
# 2. Project selection confirmation
# 3. Source code upload to Firebase App Hosting
# 4. Firestore rules deployment
# 5. Cloud Functions deployment
# 6. App Hosting rollout
# 7. Production URL generation
```

#### **Step 4: Monitor Deployment**
```bash
# Check deployment status
firebase apphosting:backends:list

# View deployment logs
firebase apphosting:backends:describe zentype-v0

# Access Firebase Console
open https://console.firebase.google.com/project/solotype-23c1f/apphosting
```

### **Deployment Output Example**
```
✔ apphosting: Source code uploaded at gs://firebaseapphosting-sources-39439361072-europe-west4/zentype-v0--94387-Itvxok3nIteO-.zip
✔ firestore: released rules firestore.rules to cloud.firestore
✔ functions[generateAiTest(us-central1)] Successful update operation.
✔ functions[submitTestResult(us-central1)] Successful update operation.
✔ functions[vercelLogDrain(us-central1)] Successful update operation.
✔ apphosting: Rollout for backend zentype-v0 complete!
✔ Deploy complete!
```

### **Post-Deployment Verification**

#### **Get Your Production URL**
1. Open Firebase Console: https://console.firebase.google.com/project/solotype-23c1f/apphosting
2. Navigate to App Hosting section
3. Find your `zentype-v0` backend
4. Copy the production URL (typically ends in `.web.app` or `.firebaseapp.com`)

#### **Test Production Features**
```bash
# Test key functionality:
# ✅ Application loads correctly
# ✅ User authentication works
# ✅ Typing tests function properly
# ✅ AI test generation works
# ✅ Data persistence to Firestore
# ✅ Debug panel functionality
# ✅ API endpoints respond correctly
```

### **Firebase App Hosting Benefits**
- **Integrated Deployment**: No separate hosting and function deployments
- **Automatic SSL**: HTTPS enabled by default
- **Global CDN**: Fast loading worldwide
- **Version Management**: Easy rollbacks and version control
- **Environment Variables**: Secure handling of secrets
- **Monitoring**: Built-in performance and error tracking

---

## 🌐 Alternative Deployment Methods

### **Traditional Firebase Hosting (Legacy)**
```bash
# 1. Build the application
npm run build

# 2. Deploy everything (functions + hosting)
firebase deploy

# OR deploy individually:
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

### **Docker + Google Cloud Run Alternative**
For advanced users who prefer containerized deployments:
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Google App Engine Alternative**
```yaml
# app.yaml
runtime: nodejs18
env: standard
automatic_scaling:
  min_instances: 0
  max_instances: 10
```

### **Deployment Verification**
```bash
# Check deployment status
firebase hosting:sites:list

# View live site
open https://solotype-23c1f.web.app

# Check function logs
firebase functions:log

# Test specific function
firebase functions:shell
```

---

## 🧪 Testing & Validation

### **Local Testing Checklist**
- [ ] `npm run dev` starts without errors
- [ ] User registration/login works
- [ ] Pre-made tests load correctly
- [ ] AI test generation works
- [ ] Test results save and appear in dashboard
- [ ] History page shows saved results

### **Production Testing Checklist**
- [ ] Website loads at https://solotype-23c1f.web.app
- [ ] Authentication works in production
- [ ] Test result saving functions properly
- [ ] AI features work with production API keys
- [ ] All pages navigate correctly
- [ ] No CORS errors in browser console

---

## 🔧 Common Deployment Issues & Solutions

### **Issue 1: CORS Policy Errors**
```bash
# Solution: Ensure using onCall functions, not onRequest
# Check functions/src/index.ts - should use onCall()
export const submitTestResult = onCall(async (request) => {
  // Function logic
});
```

### **Issue 2: Authentication Failures**
```bash
# Verify Firebase project configuration
firebase use --debug

# Check environment variables
cat .env.local

# Test authentication locally first
npm run dev
```

### **Issue 3: Function Deployment Failures**
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build functions
npm run build

# Deploy with verbose logging
firebase deploy --only functions --debug
```

### **Issue 4: Next.js Static Export Issues**
```bash
# Verify next.config.mjs has correct export settings
output: 'export'
trailingSlash: true
distDir: 'out'
```

---

## 📱 Multi-Device Deployment

### **From Windows**
```powershell
# PowerShell commands
npm install
firebase login
firebase deploy
```

### **From Mac/Linux**
```bash
# Terminal commands  
npm install
firebase login
firebase deploy
```

### **From Cloud Shell/Remote Server**
```bash
# Install Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Continue with standard deployment
npm install
firebase login --no-localhost
firebase deploy
```

---

## 🛡️ Security & Best Practices

### **Environment Variables Security**
- Never commit `.env.local` to Git
- Use Firebase secrets for production API keys
- Rotate API keys regularly

### **Firebase Security Rules**
```javascript
// Firestore rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /test_results/{documentId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📞 Support & Troubleshooting

### **Useful Commands**
```bash
# Check Firebase project status
firebase projects:list

# View function logs
firebase functions:log --only submitTestResult

# Test functions locally
firebase emulators:start

# Reset local Firebase config  
firebase use --clear
firebase use solotype-23c1f
```

### **Debug Information**
- **Project Console**: https://console.firebase.google.com/project/solotype-23c1f
- **App Hosting Console**: https://console.firebase.google.com/project/solotype-23c1f/apphosting
- **Live Site**: Available via Firebase Console App Hosting section
- **Function Region**: us-central1
- **Backend ID**: zentype-v0

### **Firebase App Hosting Specific Commands**
```bash
# List all App Hosting backends
firebase apphosting:backends:list

# Get detailed backend information
firebase apphosting:backends:describe zentype-v0

# View rollout history
firebase apphosting:rollouts:list --backend zentype-v0

# Create a new rollout (redeploy)
firebase deploy
```

### **Emergency Rollback**
```bash
# Revert to previous working commit
git log --oneline -10
git reset --hard [commit-hash]
firebase deploy
```

---

## 📊 Deployment Checklist

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Firebase CLI authenticated (`firebase login`)
- [ ] Correct project selected (`firebase use solotype-23c1f`)
- [ ] Local testing completed successfully (`npm run dev`)
- [ ] Build process works (`npm run build`)
- [ ] Code committed to Git
- [ ] ESLint issues resolved or temporarily disabled

### **Firebase App Hosting Deployment**
- [ ] `firebase deploy` command executed successfully
- [ ] Source code uploaded to Firebase App Hosting
- [ ] Firestore rules deployed
- [ ] Cloud Functions updated (generateAiTest, submitTestResult, vercelLogDrain)
- [ ] App Hosting rollout completed
- [ ] Production URL obtained from Firebase Console

### **Post-Deployment Verification**
- [ ] Production site loads correctly
- [ ] Test user registration/login functionality
- [ ] Verify typing test functionality works
- [ ] Test AI generation functionality (rate limiting: 20 req/hour)
- [ ] Verify test result saving works (rate limiting: 100 req/hour)
- [ ] Check all pages navigate correctly
- [ ] Monitor function logs for errors
- [ ] Confirm no CORS errors in browser console
- [ ] Verify rate limiting is working correctly
- [ ] Test debug system and RATE_LIMITING category logging
- [ ] Verify Firebase Authentication integration
- [ ] Test Firestore data persistence

---

**🎉 Deployment Complete!** Your ZenType application is now live on Firebase App Hosting with full Next.js App Router support, integrated Firebase services, and production-ready performance.

**Key Achievement:** Successfully deployed using Firebase App Hosting with unified deployment, automatic scaling, and integrated Firebase services including Firestore, Authentication, and Cloud Functions.

For any issues, refer to the troubleshooting section or check the `docs/errors.md` file for known solutions.
