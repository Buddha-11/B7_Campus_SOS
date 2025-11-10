import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, IdCard, Edit, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/ui/status-badge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'campus_sos_token';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error('Not authenticated. Please log in.');

        // you can also decode token to get id if needed, but assuming backend allows /me/<id>
        const userId = localStorage.getItem('campus_sos_userId'); // store userId on login
        if (!userId) throw new Error('User ID not found in local storage.');

        const res = await fetch(`${API_BASE}/api/users/me/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to fetch profile');

        setUser(json.user || json); // in case backend wraps inside {user: {...}}
        setRecentReports(json.recentReports || []);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        {errorMsg}
      </div>
    );
  }

  if (!user) return null;

  const avatarEmoji = user.avatar || '👤';

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
                        {avatarEmoji}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      {user.name || 'Unnamed User'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {user.role === 'admin' ? 'Campus Admin' : 'Campus Reporter'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <IdCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">College ID</p>
                        <p className="text-sm font-medium">{user.collegeId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/profile/edit')}
                  >
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
                          {user.reportsSubmitted || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Reports</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-background">
                        <CheckCircle className="h-6 w-6 text-status-resolved mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {user.issuesResolved || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Resolved</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-background">
                        <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {user.pointsEarned || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Reports */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Your latest submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentReports.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent reports found.</p>
                      ) : (
                        recentReports.map((report) => (
                          <div
                            key={report._id}
                            className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-foreground text-sm">
                                {report.title}
                              </h4>
                              <StatusBadge status={report.status || 'open'} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="capitalize">
                                {Array.isArray(report.tags)
                                  ? report.tags.join(', ')
                                  : report.category || 'general'}
                              </span>
                              <span>
                                {new Date(report.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
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
