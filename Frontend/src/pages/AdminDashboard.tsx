// src/pages/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, AlertTriangle, Clock, Filter, Tag } from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'campus_sos_token';

// Full list of tags from tags.json (kept in sync with server)
const PREDEFINED_TAGS = [
  "Wifi","Network","Cleanliness","Plumbing","Electrical","Lighting",
  "Safety","Security","Maintenance","Sanitation","Structural",
  "Accessibility","HVAC","Pest Control","Gardening","Transport",
  "Signage","Fire Safety","Other"
];

// helpers to map backend <-> frontend status values
const backendToUiStatus = (s?: string | null) => {
  if (!s) return 'open';
  const lower = s.toLowerCase();
  if (lower === 'open') return 'open';
  if (lower === 'inprogress' || lower === 'in progress' || lower === 'in_progress') return 'progress';
  if (lower === 'resolved') return 'resolved';
  // fallback for capitalized enum from Mongoose ('Open','InProgress','Resolved')
  if (s === 'Open') return 'open';
  if (s === 'InProgress') return 'progress';
  if (s === 'Resolved') return 'resolved';
  return 'open';
};

const uiToBackendStatus = (ui: 'open' | 'progress' | 'resolved') => {
  if (ui === 'open') return 'Open';
  if (ui === 'progress') return 'InProgress';
  return 'Resolved';
};

// severity -> chip style mapping
const severityChipClass = (severity?: string) => {
  const sev = (severity || 'Low').toLowerCase();
  if (sev === 'critical') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (sev === 'high') return 'bg-red-100 text-red-800 border-red-200';
  if (sev === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
  // low / default
  return 'bg-green-100 text-green-800 border-green-200';
};

// create a simple SVG marker as a data URL, colored by status
const makeSvgIcon = (color = '#ef4444') => {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 34 40"><path d="M17 0C8 0 1 7 1 16c0 12 16 24 16 24s16-12 16-24C33 7 26 0 17 0z" fill="${color}"/><circle cx="17" cy="16" r="6" fill="white"/></svg>`
  );
  return new Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
};

const statusColor = (status?: string) => {
  if (!status) return '#ef4444';
  const s = status.toLowerCase();
  if (s.includes('resolv')) return '#10b981';
  if (s.includes('progress')) return '#f59e0b';
  return '#ef4444';
};

// Fit map bounds to provided points
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (!map) return;
    if (!points || points.length === 0) {
      // campus default center (change to your campus if desired)
      map.setView([25.4358, 81.8496], 16);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 17);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, points]);
  return null;
}

const AdminDashboard: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedCategoryOrTag, setSelectedCategoryOrTag] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // which issue's tags panel is open (id)
  const [openTagIssueId, setOpenTagIssueId] = useState<string | null>(null);

  // fetch issues from backend
  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/issues`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Failed to fetch issues');

      const items = Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : (json.items || []);
      const normalized = items.map((it: any) => ({
        ...it,
        id: it._id || it.id,
        status_ui: backendToUiStatus(it.status),
        // ensure tags is an array
        tags: Array.isArray(it.tags) ? it.tags : (it.tags ? [it.tags] : []),
      }));
      setIssues(normalized);
    } catch (err: any) {
      console.error('Fetch issues error:', err);
      setError(err?.message || 'Error loading issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // update status handler — optimistic update
  const updateIssueStatus = async (issueId: string, newStatusUi: 'open' | 'progress' | 'resolved') => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated. Please login as admin.');
      return;
    }

    setError(null);
    setUpdatingId(issueId);

    const prev = issues;
    const updated = issues.map((iss) =>
      (iss.id === issueId || iss._id === issueId) ? { ...iss, status_ui: newStatusUi } : iss
    );
    setIssues(updated);

    try {
      const backendStatus = uiToBackendStatus(newStatusUi);
      const res = await fetch(`${API_BASE}/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: backendStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Status update failed');

      const serverIssue = json;
      const reconciled = issues.map((iss) =>
        (iss.id === issueId || iss._id === issueId)
          ? { ...iss, ...serverIssue, status_ui: backendToUiStatus(serverIssue.status), tags: Array.isArray(serverIssue.tags) ? serverIssue.tags : (serverIssue.tags ? [serverIssue.tags] : []) }
          : iss
      );
      setIssues(reconciled);
    } catch (err: any) {
      console.error('Status update failed:', err);
      setError(err?.message || 'Status update failed');
      setIssues(prev);
    } finally {
      setUpdatingId(null);
    }
  };

  // compute filtered view: selectedCategoryOrTag can be 'all' or a category or a tag
  const filteredIssues = selectedCategoryOrTag === 'all'
    ? issues
    : issues.filter((issue) => {
        const category = (issue.category || (issue.tags && issue.tags[0]) || '').toString();
        const tags = issue.tags || [];
        return category === selectedCategoryOrTag || tags.includes(selectedCategoryOrTag);
      });

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status_ui === 'open').length,
    inProgress: issues.filter(i => i.status_ui === 'progress').length,
    resolved: issues.filter(i => i.status_ui === 'resolved').length,
  };

  // derive categories from issues (keeps in sync)
  const derivedCategories = Array.from(new Set(issues.map(i => (i.category || (i.tags && i.tags[0]) || 'other').toString()))).sort();

  // --- Map integration: prepare marker points + density bins ---
  // markerPoints derived from filteredIssues — only issues that have coordinates
  const markerPoints = useMemo(() => {
    return filteredIssues.map((it) => {
      const coords = it.location?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        // GeoJSON stored as [lng, lat]
        return { id: it.id || it._id, latlng: [Number(coords[1]), Number(coords[0])] as [number, number], issue: it };
      }
      if (it.lat !== undefined && it.lng !== undefined) {
        return { id: it.id || it._id, latlng: [Number(it.lat), Number(it.lng)] as [number, number], issue: it };
      }
      return null;
    }).filter(Boolean) as { id: string; latlng: [number, number]; issue: any }[];
  }, [filteredIssues]);

  // density binning (simple grid) — tweak precision for campus scale
  const densityBins = useMemo(() => {
    const bins = new Map<string, { lat: number; lng: number; count: number }>();
    const precision = 0.0015; // ~100-200m; adjust to taste
    markerPoints.forEach((p) => {
      const latKey = Math.round(p.latlng[0] / precision) * precision;
      const lngKey = Math.round(p.latlng[1] / precision) * precision;
      const key = `${latKey.toFixed(6)}|${lngKey.toFixed(6)}`;
      if (!bins.has(key)) bins.set(key, { lat: latKey, lng: lngKey, count: 0 });
      bins.get(key)!.count += 1;
    });
    return Array.from(bins.values());
  }, [markerPoints]);

  const MAP_DEFAULT_CENTER: [number, number] = markerPoints.length ? markerPoints[0].latlng : [25.4358, 81.8496];
  const radiusForCount = (count: number) => 30 + Math.pow(count, 0.8) * 30; // meters, tweak as required

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userType="admin" />

      {/* Make content a column so Header sits above and doesn't overlap */}
      <div className="flex-1 flex flex-col">
        {/* Header remains in the document flow (not absolutely positioned) */}
        <Header title="Admin Dashboard" subtitle="Manage and track campus issues" />

        {/* Main content area with top padding so header + controls have breathing room */}
        <main className="flex-1 p-8 pt-6">
          <div className="space-y-8">
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

            {/* Map Card (Pins + Heat) - uses filteredIssues so it respects your selectedCategoryOrTag */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Map: Pins & Heat</h2>
                <div className="flex items-center gap-4">
                  <Select value={selectedCategoryOrTag} onValueChange={setSelectedCategoryOrTag}>
                    <SelectTrigger className="w-56">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories / Tags</SelectItem>

                      {derivedCategories.map(cat => (
                        <SelectItem key={`cat-${cat}`} value={cat}>Category: {cat}</SelectItem>
                      ))}

                      <SelectItem value="__tags_header" disabled>— Tags —</SelectItem>

                      {PREDEFINED_TAGS.map(tag => (
                        <SelectItem key={`tag-${tag}`} value={tag}>Tag: {tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-[520px] rounded-lg overflow-hidden">
                <MapContainer center={MAP_DEFAULT_CENTER} zoom={16} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                  <FitBounds points={markerPoints.map(m => m.latlng)} />

                  {/* heat circles (aggregated) */}
                  {densityBins.map((bin, idx) => (
                    <Circle
                      key={`heat-${idx}`}
                      center={[bin.lat, bin.lng]}
                      radius={radiusForCount(bin.count)}
                      pathOptions={{
                        color: bin.count > 4 ? '#dc2626' : '#f97316',
                        fillColor: bin.count > 4 ? '#dc2626' : '#f97316',
                        fillOpacity: Math.min(0.35 + bin.count * 0.05, 0.6),
                        weight: 0,
                      }}
                    />
                  ))}

                  {/* exact markers */}
                  {markerPoints.map((p, idx) => {
                    const color = statusColor(p.issue.status || p.issue.status_ui);
                    const icon = makeSvgIcon(color);
                    return (
                      <Marker key={p.id || idx} position={p.latlng} icon={icon}>
                        <Popup>
                          <div className="max-w-xs">
                            <h3 className="font-semibold">{p.issue.title}</h3>
                            <div className="text-sm text-muted-foreground mb-2">{p.issue.description?.slice?.(0, 120)}</div>
                            <div className="text-xs mb-2">Status: {p.issue.status || p.issue.status_ui}</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => { /* open issue details */ }}>View</Button>
                              <Button size="sm" onClick={() => updateIssueStatus(p.id, 'resolved')}>Resolve</Button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </Card>

            {/* Issues Management */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">All Issues</h2>
                <div className="flex items-center gap-4">
                  <Select value={selectedCategoryOrTag} onValueChange={setSelectedCategoryOrTag}>
                    <SelectTrigger className="w-56">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories / Tags</SelectItem>

                      {/* categories derived from current issues */}
                      {derivedCategories.map(cat => (
                        <SelectItem key={`cat2-${cat}`} value={cat}>
                          Category: {cat}
                        </SelectItem>
                      ))}

                      {/* divider-like visual separation (just keep as labels) */}
                      <SelectItem value="__tags_header" disabled>
                        — Tags —
                      </SelectItem>

                      {/* all predefined tags */}
                      {PREDEFINED_TAGS.map(tag => (
                        <SelectItem key={`tag2-${tag}`} value={tag}>
                          Tag: {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-6 text-muted-foreground">Loading issues...</div>
              ) : error ? (
                <div className="text-center py-6 text-destructive">{error}</div>
              ) : (
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
                        <TableHead className="text-right">Tags</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIssues.map((issue) => (
                        <TableRow key={issue.id || issue._id}>
                          <TableCell className="font-mono text-sm">#{issue.id || issue._id}</TableCell>

                          <TableCell className="max-w-xs">
                            <div className="truncate font-medium">{issue.title}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              by {issue.reporter?.name || issue.reportedBy || 'Anonymous'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge className="capitalize">
                              {issue.category || (issue.tags && issue.tags[0]) || 'other'}
                            </Badge>
                          </TableCell>

                          <TableCell className="max-w-32 truncate">
                            {issue.location?.name || (issue.location?.coordinates ? `${issue.location.coordinates[1]?.toFixed?.(3)}, ${issue.location.coordinates[0]?.toFixed?.(3)}` : '—')}
                          </TableCell>

                          <TableCell>
                            <span className="font-medium">{Array.isArray(issue.upvotes) ? issue.upvotes.length : issue.upvotes ?? 0}</span>
                          </TableCell>

                          <TableCell>
                            <Select
                              value={issue.status_ui}
                              onValueChange={(value) => updateIssueStatus(issue.id || issue._id, value as 'open' | 'progress' | 'resolved')}
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

                          {/* Tags column: show a compact pill with count and a toggle to view all tags */}
                          <TableCell className="text-right align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground mr-1">{(issue.tags || []).length} tag(s)</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenTagIssueId(openTagIssueId === (issue.id || issue._id) ? null : (issue.id || issue._id))}
                                title="View tags"
                                className="px-2 py-1"
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* tags panel (inline, right aligned) */}
                            {openTagIssueId === (issue.id || issue._id) && (
                              <div className="mt-2 w-full flex justify-end">
                                <div className="max-w-xs w-full bg-white border border-border rounded-lg shadow-sm p-2 flex flex-wrap gap-2">
                                  { (issue.tags && issue.tags.length > 0) ? (
                                    issue.tags.map((t: string) => (
                                      <span
                                        key={t}
                                        className={`text-xs px-2 py-1 rounded-full border ${severityChipClass(issue.severity)} flex items-center gap-2`}
                                      >
                                        {t}
                                      </span>
                                    ))
                                  ) : (
                                    <div className="text-xs text-muted-foreground px-2">No tags</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => { /* view details - hook into modal/route */ }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateIssueStatus(issue.id || issue._id, 'resolved')}
                                disabled={updatingId === (issue.id || issue._id)}
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
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
