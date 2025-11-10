// src/pages/AllIssues.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Eye, CheckCircle } from 'lucide-react';
import StatusBadge from '@/components/ui/status-badge';
import { categoryIcons } from '@/data/mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'campus_sos_token';

const backendStatusToUI = (s: string | undefined | null) => {
  if (!s) return 'open';
  const lower = String(s).toLowerCase();
  if (lower === 'open') return 'open';
  if (lower === 'inprogress' || lower === 'in progress') return 'progress';
  if (lower === 'resolved') return 'resolved';
  return lower;
};

const uiToBackendStatus = (ui: string) => {
  // ui: 'open' | 'progress' | 'resolved' -> backend expects 'Open'|'InProgress'|'Resolved'
  switch (ui) {
    case 'open': return 'Open';
    case 'progress': return 'InProgress';
    case 'resolved': return 'Resolved';
    default: return ui;
  }
};

const AllIssues: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // values: all | open | progress | resolved
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [issues, setIssues] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchIssues = async (page = 1) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(itemsPerPage));
      if (searchQuery) params.set('q', searchQuery);
      if (categoryFilter && categoryFilter !== 'all') params.set('tag', categoryFilter);
      if (statusFilter && statusFilter !== 'all') {
        // send backend status (Open/InProgress/Resolved)
        params.set('status', uiToBackendStatus(statusFilter));
      }

      const res = await fetch(`${API_BASE}/api/issues?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'Failed to load issues');
      }

      // support response shapes:
      // { items: [...], total, page, pages } OR direct array
      if (Array.isArray(json)) {
        setIssues(json);
        setTotalItems(json.length);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        const items = json.items ?? json.issues ?? [];
        setIssues(items);
        setTotalItems(json.total ?? items.length);
        setTotalPages(json.pages ?? 1);
        setCurrentPage(json.page ?? page);
      }
    } catch (err: any) {
      console.error('Load issues error:', err);
      setErrorMsg(err?.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // refetch when filters, search or page changes
    fetchIssues(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, searchQuery, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString || '';
    }
  };

  const getUpvoteCount = (issue: any) => {
    if (Array.isArray(issue.upvotes)) return issue.upvotes.length;
    if (typeof issue.upvotes === 'number') return issue.upvotes;
    if (typeof issue.upvoteCount === 'number') return issue.upvoteCount;
    return 0;
  };

  const handleChangeStatus = async (issueId: string, newUiStatus: string) => {
    const backendStatus = uiToBackendStatus(newUiStatus);
    // optimistic update
    const prev = issues.slice();
    const idx = issues.findIndex((it) => (it._id ?? it.id) === issueId);
    if (idx === -1) return;
    const updated = [...issues];
    updated[idx] = { ...updated[idx], status: backendStatus };
    setIssues(updated);

    try {
      const res = await fetch(`${API_BASE}/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status: backendStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'Status update failed');
      }
      // Replace with server response if it returns the issue
      if (json && (json._id || json.id)) {
        // try to update the single item from server
        updated[idx] = { ...updated[idx], ...json };
        setIssues(updated);
      } else {
        // success - keep optimistic
      }
    } catch (err: any) {
      console.error('Status update failed:', err);
      setErrorMsg(err?.message || 'Status update failed');
      // rollback
      setIssues(prev);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar userType="admin" />

      <div className="flex-1 flex flex-col">
        <Header title="All Issues" subtitle="Manage all reported issues" />

        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Reported Issues</h1>
            <p className="text-muted-foreground mt-2">Manage and track all campus issues</p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
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

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Issues Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-muted-foreground">Loading issues...</div>
              ) : errorMsg ? (
                <div className="p-6 text-center text-destructive">{errorMsg}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Upvotes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => {
                      const id = issue._id ?? issue.id;
                      const category = issue.tags?.[0] ?? issue.category ?? 'other';
                      const reporter = issue.reporter?.name ?? issue.reportedBy ?? 'Anonymous';
                      const upvotes = getUpvoteCount(issue);
                      const uiStatus = backendStatusToUI(issue.status);
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-medium">#{String(id).slice(-6)}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{issue.title}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize flex items-center gap-2">
                              <span>{categoryIcons[category] ?? '🏷️'}</span>
                              {String(category).charAt(0).toUpperCase() + String(category).slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{reporter}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">👍</span>
                              <span>{upvotes}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={uiStatus === 'open' ? 'open' : uiStatus === 'progress' ? 'progress' : 'resolved'} />
                              {/* Status select for admin actions */}
                              <select
                                value={uiStatus}
                                onChange={(e) => handleChangeStatus(id, e.target.value)}
                                className="ml-2 rounded border px-2 py-1 text-sm"
                              >
                                <option value="open">Open</option>
                                <option value="progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(issue.createdAt ?? issue.reportedAt ?? issue.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => window.open(`/admin/issues/${id}`, '_blank')}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {uiStatus !== 'resolved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleChangeStatus(id, 'resolved')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Results Summary */}
          <div className="text-center text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} issues
          </div>
        </main>
      </div>
    </div>
  );
};

export default AllIssues;
