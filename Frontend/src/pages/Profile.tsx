import React from 'react';
import { User, Mail, IdCard, Edit, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/ui/status-badge';

const Profile = () => {
  const userStats = {
    name: 'Sarah Chen',
    email: 'sarah.chen@college.edu',
    collegeId: 'STU-2024-001',
    avatar: '👩‍🎓',
    reportsSubmitted: 8,
    issuesResolved: 3,
    pointsEarned: 150,
  };

  const recentReports = [
    {
      id: '1',
      title: 'WiFi not working in Library Level 3',
      category: 'wifi',
      status: 'open' as const,
      date: '2024-01-15',
    },
    {
      id: '2',
      title: 'Broken chair in Room 204',
      category: 'maintenance',
      status: 'progress' as const,
      date: '2024-01-14',
    },
    {
      id: '3',
      title: 'Poor lighting in parking lot',
      category: 'safety',
      status: 'resolved' as const,
      date: '2024-01-13',
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar userType="student" />
      <div className="flex-1 flex flex-col">
        <Header title="My Profile" subtitle="View your account and activity" />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 text-4xl">
                      <AvatarFallback className="text-4xl bg-primary/10">
                        {userStats.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      {userStats.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Campus Reporter
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{userStats.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <IdCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">College ID</p>
                        <p className="text-sm font-medium">{userStats.collegeId}</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Stats & Activity */}
              <div className="space-y-6">
                {/* User Impact Card */}
                <Card className="shadow-md bg-gradient-to-br from-primary/5 to-background">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Your Impact
                    </CardTitle>
                    <CardDescription>Making campus better, one report at a time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-background">
                        <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {userStats.reportsSubmitted}
                        </p>
                        <p className="text-xs text-muted-foreground">Reports</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-background">
                        <CheckCircle className="h-6 w-6 text-status-resolved mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {userStats.issuesResolved}
                        </p>
                        <p className="text-xs text-muted-foreground">Resolved</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-background">
                        <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {userStats.pointsEarned}
                        </p>
                        <p className="text-xs text-muted-foreground">Points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Reports Card */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Your latest submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground text-sm">
                              {report.title}
                            </h4>
                            <StatusBadge status={report.status} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="capitalize">{report.category}</span>
                            <span>{new Date(report.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
