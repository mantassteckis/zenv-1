// scripts/create-missing-profiles.js
// Script to create profiles for existing Firebase Auth users who don't have profiles in Firestore

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK using the same logic as firebase-admin.ts
if (admin.apps.length === 0) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let serviceAccount = null;
    
    if (serviceAccountKey) {
      if (serviceAccountKey.startsWith('{')) {
        // It's JSON content
        try {
          serviceAccount = JSON.parse(serviceAccountKey);
        } catch (error) {
          console.warn('⚠️ Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY');
        }
      } else {
        // It's a file path
        const serviceAccountPath = path.isAbsolute(serviceAccountKey) 
          ? serviceAccountKey 
          : path.join(process.cwd(), serviceAccountKey);
        
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        }
      }
    }
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'solotype-23c1f',
      });
    } else {
      // Fallback to default credentials (Firebase CLI or Google Cloud SDK)
      console.warn('⚠️ Service account not found, using default credentials');
      admin.initializeApp({
        projectId: 'solotype-23c1f',
      });
    }
    
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    process.exit(1);
  }
}

const auth = admin.auth();
const firestore = admin.firestore();

/**
 * Creates Firestore profile documents for Firebase Auth users that are missing profiles.
 *
 * For each Auth user, checks profiles/{uid} and creates a profile with default fields (username derived from displayName or email, createdAt, bio, preferredThemeId, preferredFontId, settings, stats, and photoURL when available) if no profile exists. Logs progress and deletes the initialized Admin app when finished.
 */
async function createMissingProfiles() {
  console.log('🔍 Fetching all Firebase Auth users...');
  
  try {
    // Get all users from Firebase Auth
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;
    
    console.log(`📊 Found ${authUsers.length} Firebase Auth users`);
    
    for (const authUser of authUsers) {
      const { uid, email, displayName, photoURL } = authUser;
      
      console.log(`\n🔍 Checking user: ${uid} (${email})`);
      
      // Check if profile exists in Firestore
      const profileRef = firestore.collection('profiles').doc(uid);
      const profileDoc = await profileRef.get();
      
      if (profileDoc.exists) {
        console.log(`✅ Profile already exists for ${email}`);
        continue;
      }
      
      // Create profile for user
      console.log(`📝 Creating profile for ${email}...`);
      
      const username = displayName || email?.split('@')[0] || `user_${uid.slice(0, 8)}`;
      
      const profileData = {
        uid,
        email: email || null,
        username,
        createdAt: new Date().toISOString(),
        bio: '',
        preferredThemeId: 'default',
        preferredFontId: 'fira-code',
        settings: {
          keyboardSounds: true,
          visualFeedback: true,
        },
        stats: {
          rank: 'E',
          testsCompleted: 0,
          avgWpm: 0,
          avgAcc: 0,
          bestWpm: 0,
        },
      };
      
      // Only add photoURL if it exists
      if (photoURL) {
        profileData.photoURL = photoURL;
      }
      
      try {
        await profileRef.set(profileData);
        console.log(`✅ Profile created successfully for ${email}`);
      } catch (error) {
        console.error(`❌ Failed to create profile for ${email}:`, error);
      }
    }
    
    console.log('\n🎉 Profile creation process completed!');
    
  } catch (error) {
    console.error('💥 Error in createMissingProfiles:', error);
  } finally {
    // Clean up
    admin.app().delete();
  }
}

// Run the script
createMissingProfiles();