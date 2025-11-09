import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import IssueCard from '@/components/issues/IssueCard';
import StatusBadge from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockIssues, categoryColors, categoryIcons } from '@/data/mockData';
import { Eye, CheckCircle, AlertTriangle, Clock, Filter } from 'lucide-react';

const AdminDashboard = () => {
  const [issues, setIssues] = useState(mockIssues);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const updateIssueStatus = (issueId: string, newStatus: 'open' | 'progress' | 'resolved') => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId ? { ...issue, status: newStatus } : issue
    ));
  };

  const filteredIssues = selectedCategory === 'all' 
    ? issues 
    : issues.filter(issue => issue.category === selectedCategory);

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userType="admin" />
      
      <div className="flex-1 p-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage and track campus issues</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-status-open/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-status-open" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.open}</p>
                  <p className="text-sm text-muted-foreground">Open Issues</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-status-progress/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-status-progress" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-status-resolved/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-status-resolved" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Heatmap */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Issue Heatmap</h2>
            <div className="relative h-64 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-muted-foreground">Campus Heatmap Visualization</p>
                <p className="text-sm text-muted-foreground">Red areas indicate high issue density</p>
              </div>
              
              {/* Mock heat spots */}
              <div className="absolute top-1/4 left-1/3 w-16 h-16 bg-red-500/30 rounded-full"></div>
              <div className="absolute top-2/3 right-1/4 w-12 h-12 bg-yellow-500/30 rounded-full"></div>
              <div className="absolute bottom-1/4 left-1/2 w-8 h-8 bg-green-500/30 rounded-full"></div>
            </div>
          </Card>

          {/* Issues Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">All Issues</h2>
              <div className="flex items-center gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="wifi">WiFi</SelectItem>
                    <SelectItem value="cleanliness">Cleanliness</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Upvotes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-mono text-sm">#{issue.id}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{issue.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          by {issue.reportedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${categoryColors[issue.category]} border`}>
                          <span className="mr-1">{categoryIcons[issue.category]}</span>
                          {issue.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {issue.location.name}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{issue.upvotes}</span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={issue.status}
                          onValueChange={(value) => 
                            updateIssueStatus(issue.id, value as 'open' | 'progress' | 'resolved')
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateIssueStatus(issue.id, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;