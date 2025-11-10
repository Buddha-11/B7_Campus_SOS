import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MapView from '@/components/map/MapView';
import IssueCard from '@/components/issues/IssueCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trophy, Medal, Award } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'campus_sos_token';
const USER_ID_KEY = 'campus_sos_userId';

const StudentDashboard = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Fetch Dashboard Data ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const userId = localStorage.getItem(USER_ID_KEY);
        if (!token || !userId) throw new Error('Not authenticated');

        const [issuesRes, statsRes, leaderboardRes] = await Promise.all([
          fetch(`${API_BASE}/api/issues?limit=10&page=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/users/me/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/leaderboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [issuesData, statsData, leaderboardData] = await Promise.all([
          issuesRes.json(),
          statsRes.json(),
          leaderboardRes.json(),
        ]);

        if (!issuesRes.ok) throw new Error(issuesData?.message || 'Failed to load issues');
        if (!statsRes.ok) throw new Error(statsData?.message || 'Failed to load stats');
        if (!leaderboardRes.ok)
          throw new Error(leaderboardData?.message || 'Failed to load leaderboard');

        // ✅ FIXED: Use items array from controller output
        const issuesArray = Array.isArray(issuesData.items)
          ? issuesData.items
          : Array.isArray(issuesData)
          ? issuesData
          : [];
        // Normalize backend data into IssueCard-friendly format
          const normalizedIssues = issuesArray.map((item: any) => ({
            id: item._id,
            title: item.title || 'Untitled Issue',
            description: item.description || 'No description provided.',
            // category was removed, use first tag or 'general'
            category: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags[0] : 'general',
            tags: item.tags || [],
            status: item.status || 'open',
            upvotes: item.upvotes || 0,
            comments: item.commentsCount || 0,
            image: item.imageUrl || null,
            // if location has coordinates, show approximate label
            location: item.location
              ? {
                  name:
                    item.location.name ||
                    `(${item.location.coordinates?.[1]?.toFixed(3)}, ${item.location.coordinates?.[0]?.toFixed(3)})`,
                }
              : { name: 'Unknown location' },
            reportedBy: item.reporter?.name || 'Anonymous',
            reportedAt: item.createdAt || new Date().toISOString(),
          }));

          setIssues(normalizedIssues);


        setUserStats(statsData.user || statsData || {});
        const lbArray = Array.isArray(leaderboardData)
          ? leaderboardData
          : leaderboardData.leaderboard || [];
        setTopUsers(lbArray.slice(0, 3));
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- Handle Upvote ---
  const handleUpvote = async (issueId: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/issues/${issueId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIssues((prev) =>
          prev.map((issue) =>
            issue._id === issueId ? { ...issue, upvotes: (issue.upvotes || 0) + 1 } : issue
          )
        );
      }
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const renderMedal = (index: number) => {
    if (index === 0) return <Medal className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Award className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-orange-600" />;
    return <span className="text-sm font-medium">{index + 1}</span>;
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );

  if (errorMsg)
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        {errorMsg}
      </div>
    );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userType="student" />
      <div className="flex-1 flex flex-col">
        <Header title="Student Dashboard" subtitle="Track issues and campus reports" />
        <main className="flex-1 p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* --- Left Column (Map + Issues) --- */}
            <div className="lg:col-span-2 space-y-8">
              <MapView onReportIssue={() => setShowReportModal(true)} />

              {/* Recent Issues */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Recent Issues</h2>
                  {/* <Button
                    variant="outline"
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Report Issue
                  </Button> */}
                </div>

                {Array.isArray(issues) && issues.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No issues reported yet.</p>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(issues) &&
                      issues.map((issue) => (
                        <IssueCard key={issue._id} issue={issue} onUpvote={handleUpvote} />
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- Right Sidebar --- */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Your Impact</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reports Submitted</span>
                    <span className="font-semibold">{userStats.reportsSubmitted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issues Resolved</span>
                    <span className="font-semibold">{userStats.issuesResolved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points Earned</span>
                    <span className="font-semibold text-primary">
                      {userStats.pointsEarned || 0}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Leaderboard */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top Reporters
                </h3>
                {topUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topUsers.map((user, index) => (
                      <div key={user._id || index} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          {renderMedal(index)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{user.avatar || '👤'}</span>
                            <span className="font-medium text-sm">{user.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.points || 0} points •{' '}
                            {user.reportsSubmitted || user.reports || 0} reports
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* --- Report Issue Modal --- */}
      {/* <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report New Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input id="title" placeholder="Brief description of the problem" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wifi">WiFi</SelectItem>
                  <SelectItem value="cleanliness">Cleanliness</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Upload Image (Optional)</Label>
              <Input id="image" type="file" accept="image/*" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-primary hover:bg-primary-hover"
                onClick={() => setShowReportModal(false)}
              >
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowReportModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default StudentDashboard;
