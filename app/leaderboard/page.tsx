import { GlassCard } from "@/components/ui/glass-card"
import { Header } from "@/components/header"
import { Trophy, Crown, Medal, Award, Zap, Target } from "lucide-react"
import { LEADERBOARD_DATA } from "@/lib/dummy-data"

export default function LeaderboardPage() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-semibold">#{rank}</span>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Global Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">See how you stack up against the world's fastest typists</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {LEADERBOARD_DATA.slice(0, 3).map((user, index) => (
            <GlassCard
              key={user.rank}
              className={`text-center space-y-4 ${user.rank === 1 ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex justify-center">{getRankIcon(user.rank)}</div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">{user.username}</h3>
                <div className="text-3xl font-bold text-primary mb-2">{user.bestWpm} WPM</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{user.testsCompleted} tests completed</div>
                  <div>{user.accuracy}% accuracy</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-2 text-foreground font-semibold">Rank</th>
                  <th className="text-left py-4 px-2 text-foreground font-semibold">Username</th>
                  <th className="text-left py-4 px-2 text-foreground font-semibold">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Best WPM</span>
                    </div>
                  </th>
                  <th className="text-left py-4 px-2 text-foreground font-semibold">Tests Completed</th>
                  <th className="text-left py-4 px-2 text-foreground font-semibold">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Accuracy</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD_DATA.map((user, index) => (
                  <tr
                    key={user.rank}
                    className={`border-b border-border hover:bg-accent/50 transition-colors ${
                      user.username === "TypeMaster" ? "bg-primary/10" : ""
                    }`}
                  >
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-2">{getRankIcon(user.rank)}</div>
                    </td>
                    <td className="py-4 px-2">
                      <span
                        className={`font-semibold ${
                          user.username === "TypeMaster" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {user.username}
                        {user.username === "TypeMaster" && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">You</span>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-primary font-bold text-lg">{user.bestWpm}</span>
                    </td>
                    <td className="py-4 px-2 text-muted-foreground">{user.testsCompleted}</td>
                    <td className="py-4 px-2">
                      <span
                        className={`font-semibold ${
                          user.accuracy >= 98
                            ? "text-green-500"
                            : user.accuracy >= 95
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
                      >
                        {user.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    </div>
  )
}
