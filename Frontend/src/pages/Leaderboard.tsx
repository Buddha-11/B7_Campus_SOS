import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'campus_sos_token';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar?: string;
  points: number;
  reports: number;
}

const Leaderboard = () => {
  const [timeFrame, setTimeFrame] = useState('all-time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error('Not authenticated. Please log in.');

        const res = await fetch(`${API_BASE}/api/leaderboard?timeframe=${timeFrame}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message || json?.error || 'Failed to fetch leaderboard');
        }

        // Expect backend to return an array of ranked users
        const data = Array.isArray(json) ? json : json.leaderboard || [];
        const processed = data.map((u: any, idx: number) => ({
          rank: u.rank || idx + 1,
          name: u.name || u.username || 'Anonymous',
          avatar: u.avatar || '👤',
          points: u.pointsEarned || u.points || 0,
          reports: u.reportsSubmitted || u.reports || 0,
        }));

        setLeaderboard(processed);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFrame]);

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar userType="student" />
      <div className="flex-1 flex flex-col">
        <Header title="Leaderboard" subtitle="Top campus reporters" />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <Card className="shadow-md bg-gradient-to-br from-primary/10 to-background">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Trophy className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-3xl">Top Campus Reporters</CardTitle>
                <CardDescription className="text-base">
                  Recognizing students who actively improve our campus environment
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Filter */}
            <div className="flex justify-end">
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select time frame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Leaderboard Table */}
            <Card className="shadow-md">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading leaderboard...</div>
                ) : errorMsg ? (
                  <div className="p-6 text-center text-destructive">{errorMsg}</div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No data found for this timeframe.
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    {leaderboard.map((user, index) => (
                      <div
                        key={user.rank}
                        className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${
                          index !== leaderboard.length - 1 ? 'border-b border-border' : ''
                        } ${user.rank <= 3 ? 'bg-muted/30' : index % 2 === 0 ? 'bg-muted/10' : ''}`}
                      >
                        {/* Rank/Medal */}
                        <div className="flex items-center justify-center w-16">
                          {getMedalIcon(user.rank)}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-12 w-12 text-2xl">
                          <AvatarFallback className={`text-2xl ${getRankBadgeColor(user.rank)}`}>
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {user.reports} reports submitted
                          </p>
                        </div>

                        {/* Points Badge */}
                        <Badge variant="secondary" className="text-base font-bold px-4 py-2">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          {user.points} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Motivation Card */}
            <Card className="shadow-md bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-6 text-center">
                <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Want to climb the leaderboard?
                </h3>
                <p className="text-muted-foreground">
                  Start reporting issues and help make our campus better for everyone!
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Leaderboard;
