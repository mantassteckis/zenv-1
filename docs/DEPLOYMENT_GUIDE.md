# 🚀 ZenType Live Deployment Guide

Complete step-by-step guide to deploy ZenType from any device with all necessary requirements, accounts, and configurations.

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
- `submitTestResult` - Saves typing test results
- `getTests` - Retrieves pre-made typing tests
- `generateAiTest` - Creates AI-generated typing tests
- `populateTestData` - Seeds database with sample tests

---

## 🌐 Production Deployment Steps

### **Full Deployment Process**
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
- **Live Site**: https://solotype-23c1f.web.app
- **Function Region**: us-central1

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
- [ ] Firebase CLI authenticated
- [ ] Local testing completed successfully
- [ ] Code committed to Git

### **Deployment**
- [ ] `npm run build` succeeds
- [ ] `firebase deploy --only functions` succeeds  
- [ ] `firebase deploy --only hosting` succeeds
- [ ] Production site loads correctly

### **Post-Deployment**
- [ ] Test user registration/login
- [ ] Verify test result saving works
- [ ] Check all pages load correctly
- [ ] Monitor function logs for errors
- [ ] Confirm no CORS errors in browser console

---

**🎉 Deployment Complete!** Your ZenType application should now be live and fully functional.

For any issues, refer to the troubleshooting section or check the `docs/errors.md` file for known solutions.
