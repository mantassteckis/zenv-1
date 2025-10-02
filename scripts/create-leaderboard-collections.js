// scripts/create-leaderboard-collections.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, writeBatch, doc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  projectId: 'solotype-23c1f'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Build and populate weekly and monthly leaderboard collections in Firestore from profiles that have completed tests.
 *
 * For each profile with stats.testsCompleted > 0, creates or overwrites documents in
 * `leaderboard_weekly` and `leaderboard_monthly` containing standardized leaderboard fields
 * and period boundaries for the current week and month. All writes are performed in a single batched commit.
 *
 * @throws {Error} If a Firestore operation fails; the original error is rethrown.
 */
async function createLeaderboardCollections() {
  try {
    console.log('🚀 Starting leaderboard collections creation...');
    
    // Get all profiles with stats
    const profilesQuery = query(
      collection(db, 'profiles'),
      where('stats.testsCompleted', '>', 0)
    );
    const profilesSnapshot = await getDocs(profilesQuery);
    
    if (profilesSnapshot.empty) {
      console.log('❌ No profiles found with completed tests');
      return;
    }
    
    console.log(`📊 Found ${profilesSnapshot.size} profiles with test data`);
    
    const batch = writeBatch(db);
    let weeklyCount = 0;
    let monthlyCount = 0;
    
    // Current date for weekly/monthly calculations
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const currentMonthStart = getMonthStart(now);
    
    profilesSnapshot.forEach((docSnapshot) => {
      const profile = docSnapshot.data();
      const userId = docSnapshot.id;
      
      // Create leaderboard entry structure
      const leaderboardEntry = {
        userId: userId,
        username: profile.username,
        email: profile.email,
        photoURL: profile.photoURL || null,
        rank: profile.stats.rank,
        testsCompleted: profile.stats.testsCompleted,
        avgWpm: profile.stats.avgWpm,
        avgAcc: profile.stats.avgAcc,
        bestWpm: profile.stats.bestWpm || profile.stats.avgWpm,
        lastUpdated: serverTimestamp(),
        createdAt: profile.createdAt
      };
      
      // Add to weekly leaderboard
      const weeklyRef = doc(db, 'leaderboard_weekly', userId);
      batch.set(weeklyRef, {
        ...leaderboardEntry,
        weekStart: currentWeekStart.toISOString(),
        weekEnd: getWeekEnd(currentWeekStart).toISOString()
      });
      weeklyCount++;
      
      // Add to monthly leaderboard  
      const monthlyRef = doc(db, 'leaderboard_monthly', userId);
      batch.set(monthlyRef, {
        ...leaderboardEntry,
        monthStart: currentMonthStart.toISOString(),
        monthEnd: getMonthEnd(currentMonthStart).toISOString()
      });
      monthlyCount++;
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log('✅ Successfully created leaderboard collections:');
    console.log(`   📅 Weekly leaderboard: ${weeklyCount} entries`);
    console.log(`   📅 Monthly leaderboard: ${monthlyCount} entries`);
    console.log('');
    console.log('📋 Collection structure:');
    console.log('   - leaderboard_weekly: Current week data');
    console.log('   - leaderboard_monthly: Current month data');
    console.log('');
    console.log('🔄 These collections will be automatically updated when users submit new test results');
    
  } catch (error) {
    console.error('❌ Error creating leaderboard collections:', error);
    throw error;
  }
}

/**
 * Compute the start of the week (Sunday) for the given date, preserving the input's time-of-day.
 * @param {Date|string|number} date - The input date (Date object, ISO string, or timestamp).
 * @returns {Date} A Date set to the Sunday of the same week with the same hour/minute/second/millisecond as the input.
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to get Monday as start of week
  return new Date(d.setDate(diff));
}

/**
 * Compute the last moment of the week that begins at the given date.
 * @param {Date} weekStart - The start of the week (date/time used as the week's first day).
 * @returns {Date} A Date representing the week's end (six days after `weekStart`) with time set to 23:59:59.999.
 */
function getWeekEnd(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Compute the first calendar day of the month for a given date at local midnight.
 * @param {Date|string|number} date - Date, ISO date string, or timestamp representing the target date.
 * @returns {Date} The first day of the same month with time set to 00:00:00.000 (local time).
 */
function getMonthStart(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Compute the last moment of the month corresponding to a given month start.
 *
 * @param {Date} monthStart - A Date representing the first day of the target month (time portion is ignored).
 * @returns {Date} A Date set to the last day of that month at 23:59:59.999.
 */
function getMonthEnd(monthStart) {
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthStart.getMonth() + 1);
  monthEnd.setDate(0);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd;
}

// Run the script
if (require.main === module) {
  createLeaderboardCollections()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createLeaderboardCollections };