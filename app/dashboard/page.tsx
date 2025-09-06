"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Clock, TrendingUp, Calendar, Zap, Play } from "lucide-react"
import { useAuth } from "@/context/AuthProvider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { calculateUserStats } from "@/lib/firebase/firestore"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/client"

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [userStats, setUserStats] = useState<{
    rank: string;
    avgWpm: number;
    avgAcc: number;
    testsCompleted: number;
    bestWpm: number;
    bestAccuracy: number;
  } | null>(null);
  
  const [recentTests, setRecentTests] = useState<Array<{
    id: string;
    wpm: number;
    accuracy: number;
    testType: string;
    difficulty: string;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    console.log("📊 Dashboard - useEffect triggered");
    console.log("👤 Dashboard - User:", user ? user.uid : "null");
    console.log("📋 Dashboard - Profile:", profile);
    console.log("🏷️  Dashboard - Username:", profile?.username || "undefined");
    console.log("⏳ Dashboard - IsLoading:", isLoading);
    
    if (user && profile) {
      console.log("✅ Dashboard - Both user and profile available, calculating stats...");
      calculateUserStats(user.uid).then(setUserStats);
      
      // Fetch recent test results
      fetchRecentTests();
    } else if (user && !profile) {
      console.log("⚠️ Dashboard - User exists but no profile yet");
    } else if (!user) {
      console.log("🚫 Dashboard - No user authenticated");
    }
  }, [user, profile, isLoading]);

  const fetchRecentTests = async () => {
    if (!user) return;
    
    try {
      console.log("🔍 Dashboard - Fetching recent test results...");
      const testResultsRef = collection(db, "testResults");
      const q = query(
        testResultsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const recentTestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        wpm: doc.data().wpm,
        accuracy: doc.data().accuracy,
        testType: doc.data().testType,
        difficulty: doc.data().difficulty,
        createdAt: doc.data().createdAt,
      }));
      
      console.log("✅ Dashboard - Recent tests fetched:", recentTestsData.length);
      setRecentTests(recentTestsData);
    } catch (error) {
      console.error("❌ Dashboard - Error fetching recent tests:", error);
    }
  };

  // Show loading state OR if user exists but no profile yet
  if (isLoading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              {isLoading ? "Loading your account..." : "Setting up your profile..."}
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show login prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Please log in to view your dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  // Show empty state if user has no typing data (null userStats or 0 tests)
  if (!userStats || userStats.testsCompleted === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome, {profile?.username || 'Typer'}!
              </h1>
              <p className="text-muted-foreground">
                You don't have any typing data yet. Start your typing journey!
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <GlassCard className="text-center space-y-6 p-8">
                <div className="w-16 h-16 bg-[#00BFFF] rounded-full flex items-center justify-center mx-auto">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Ready to start typing?</h2>
                  <p className="text-muted-foreground text-sm">
                    Take your first typing test to see your stats here!
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/test')}
                  className="bg-[#00BFFF] hover:bg-[#0099CC] text-white px-6 py-3"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Typing
                </Button>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome, {profile?.username || 'Typer'}!
          </h1>
          <p className="text-muted-foreground">Track your progress and continue improving your typing skills</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard className="text-center space-y-3">
            <div className="w-12 h-12 bg-[#00BFFF] rounded-lg flex items-center justify-center mx-auto">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00BFFF]">{userStats?.avgWpm || 0}</div>
              <div className="text-foreground text-sm">Avg WPM</div>
            </div>
          </GlassCard>

          <GlassCard className="text-center space-y-3">
            <div className="w-12 h-12 bg-[#00BFFF] rounded-lg flex items-center justify-center mx-auto">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00BFFF]">{userStats?.avgAcc || 0}%</div>
              <div className="text-foreground text-sm">Avg Accuracy</div>
            </div>
          </GlassCard>

          <GlassCard className="text-center space-y-3">
            <div className="w-12 h-12 bg-[#00BFFF] rounded-lg flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00BFFF]">{userStats?.testsCompleted || 0}</div>
              <div className="text-foreground text-sm">Tests Completed</div>
            </div>
          </GlassCard>

          <GlassCard className="text-center space-y-3">
            <div className="w-12 h-12 bg-[#00BFFF] rounded-lg flex items-center justify-center mx-auto">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00BFFF]">{userStats?.rank || 'E'}</div>
              <div className="text-foreground text-sm">Current Rank</div>
            </div>
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <GlassCard>
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-[#00BFFF]" />
              <h2 className="text-xl font-semibold text-foreground">Progress Chart</h2>
            </div>
            <div className="h-64 bg-muted/20 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-muted/40 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">No progress data yet</p>
                  <p className="text-muted-foreground text-xs">
                    Take more tests to see your progress chart
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="h-5 w-5 text-[#00BFFF]" />
              <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="h-64">
              {recentTests.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#00BFFF] rounded-full flex items-center justify-center">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {test.testType === 'practice' ? 'Practice Test' : test.testType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {test.difficulty} • {new Date(test.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#00BFFF]">{test.wpm} WPM</p>
                        <p className="text-xs text-muted-foreground">{test.accuracy}% accuracy</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-muted/40 rounded-lg flex items-center justify-center mx-auto">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">No recent activity</p>
                      <p className="text-muted-foreground text-xs">
                        Your recent test results will appear here
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}
