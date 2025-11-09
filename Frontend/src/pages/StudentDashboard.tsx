import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MapView from '@/components/map/MapView';
import IssueCard from '@/components/issues/IssueCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockIssues, mockUsers } from '@/data/mockData';
import { Plus, Trophy, Medal, Award } from 'lucide-react';

const StudentDashboard = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [issues, setIssues] = useState(mockIssues);

  const handleUpvote = (issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, upvotes: issue.upvotes + 1 }
        : issue
    ));
  };

  const topUsers = mockUsers.sort((a, b) => b.points - a.points).slice(0, 3);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userType="student" />
      
      <div className="flex-1 p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <MapView onReportIssue={() => setShowReportModal(true)} />
            
            {/* Recent Issues */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Recent Issues</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Report Issue
                </Button>
              </div>
              
              <div className="space-y-4">
                {issues.map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onUpvote={handleUpvote}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Your Impact</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reports Submitted</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issues Resolved</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points Earned</span>
                  <span className="font-semibold text-primary">150</span>
                </div>
              </div>
            </Card>
            
            {/* Leaderboard */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Top Reporters
              </h3>
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {index === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                      {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                      {index > 2 && <span className="text-sm font-medium">{index + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{user.avatar}</span>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.points} points • {user.reportsCount} reports
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Report Issue Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
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
              <Button 
                variant="outline" 
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;