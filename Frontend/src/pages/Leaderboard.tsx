import React, { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Leaderboard = () => {
  const [timeFrame, setTimeFrame] = useState('all-time');

  const leaderboardData = [
    { rank: 1, name: 'Emma Davis', avatar: '👩‍💼', points: 200, reports: 12 },
    { rank: 2, name: 'Jordan Smith', avatar: '👩‍🔬', points: 180, reports: 10 },
    { rank: 3, name: 'Sarah Chen', avatar: '👩‍🎓', points: 150, reports: 8 },
    { rank: 4, name: 'Mike Johnson', avatar: '👨‍🎓', points: 120, reports: 6 },
    { rank: 5, name: 'Alex Kim', avatar: '👨‍💻', points: 95, reports: 4 },
    { rank: 6, name: 'Taylor Brown', avatar: '👨‍🏫', points: 85, reports: 5 },
    { rank: 7, name: 'Jamie Wilson', avatar: '👩‍⚕️', points: 70, reports: 3 },
    { rank: 8, name: 'Casey Martinez', avatar: '👨‍🔧', points: 60, reports: 4 },
  ];

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
                <div className="overflow-hidden">
                  {leaderboardData.map((user, index) => (
                    <div
                      key={user.rank}
                      className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${
                        index !== leaderboardData.length - 1 ? 'border-b border-border' : ''
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
