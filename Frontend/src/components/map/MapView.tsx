import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/status-badge';
import { categoryIcons } from '@/data/mockData';

interface MapViewProps {
  onReportIssue?: () => void;
  onViewIssue?: (id: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'campus_sos_token';

// Fix leaflet icon path for bundlers
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconUrl: markerUrl,
  iconRetinaUrl: markerRetinaUrl,
  shadowUrl: markerShadowUrl,
});

// Create colored SVG pin
const createColoredIcon = (colorHex: string) => {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 34 40"><path d="M17 0C8 0 1 7 1 16c0 12 16 24 16 24s16-12 16-24C33 7 26 0 17 0z" fill="${colorHex}"/><circle cx="17" cy="16" r="6" fill="white"/></svg>`
  );
  return new Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
};

// Status color
const statusColor = (status?: string) => {
  if (!status) return '#10b981';
  const s = status.toLowerCase();
  if (s.includes('resolv')) return '#10b981';
  if (s.includes('progress') || s.includes('inprogress') || s.includes('in progress')) return '#f59e0b';
  return '#ef4444';
};

const DEFAULT_CENTER: [number, number] = [25.4358, 81.8496];
const DEFAULT_ZOOM = 16;

function FitBounds({ markers }: { markers: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (markers.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (markers.length === 1) {
      map.setView(markers[0], DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(markers);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, markers]);
  return null;
}

const MapView: React.FC<MapViewProps> = ({ onReportIssue, onViewIssue }) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchIssues = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const res = await fetch(`${API_BASE}/api/issues`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Failed to fetch issues');
        const items = Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : (json.items || []);
        if (mounted) setIssues(items);
      } catch (err: any) {
        console.error(err);
        if (mounted) setErrorMsg(err?.message || 'Error fetching issues');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIssues();
    return () => { mounted = false; };
  }, []);

  // derive tags from issues (unique)
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    issues.forEach((issue) => {
      (issue.tags || []).forEach((t: string) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [issues]);

  // filter issues by selected tag
  const filteredIssues = selectedTag
    ? issues.filter((i) => Array.isArray(i.tags) && i.tags.includes(selectedTag))
    : issues;

  const markerLatLngs: [number, number][] = filteredIssues
    .map((issue) => {
      const coords = issue.location?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        return [Number(coords[1]), Number(coords[0])] as [number, number];
      }
      if (issue.lat && issue.lng) return [Number(issue.lat), Number(issue.lng)];
      return null;
    })
    .filter(Boolean) as [number, number][];

  if (loading)
    return <div className="flex items-center justify-center h-96 text-muted-foreground">Loading map data...</div>;
  if (errorMsg)
    return <div className="flex items-center justify-center h-96 text-destructive">{errorMsg}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Campus Map</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setSelectedTag(null)}
          >
            <Filter className="h-4 w-4" /> Clear Filter
          </Button>
        </div>
      </div>

      {/* Tag Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={selectedTag === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedTag(null)}
        >
          All Issues
        </Badge>
        {allTags.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? 'default' : 'outline'}
            className="cursor-pointer flex items-center gap-1"
            onClick={() => setSelectedTag(tag)}
          >
            {categoryIcons[tag as keyof typeof categoryIcons] || '🏷️'} {tag}
          </Badge>
        ))}
      </div>

      {/* Interactive Map */}
      <Card className="relative h-96 rounded-lg overflow-hidden">
        <MapContainer
          center={markerLatLngs[0] ?? DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          <FitBounds markers={markerLatLngs} />

          {filteredIssues.map((issue: any, idx: number) => {
            const coords = issue.location?.coordinates;
            let latlng: [number, number] | null = null;
            if (Array.isArray(coords) && coords.length >= 2) latlng = [Number(coords[1]), Number(coords[0])];
            else if (issue.lat && issue.lng) latlng = [Number(issue.lat), Number(issue.lng)];
            if (!latlng) return null;

            const color = statusColor(issue.status);
            const icon = createColoredIcon(color);

            return (
              <Marker key={issue._id || issue.id || idx} position={latlng} icon={icon}>
                <Popup>
                  <div className="max-w-xs">
                    <h3 className="font-semibold">{issue.title}</h3>
                    <div className="text-sm text-muted-foreground mb-2">
                      {issue.description?.slice(0, 120)}
                    </div>
                    <div className="flex gap-2 items-center mb-2">
                      <StatusBadge
                        status={
                          issue.status?.toLowerCase()?.includes('resolv')
                            ? 'resolved'
                            : issue.status?.toLowerCase()?.includes('progress')
                            ? 'progress'
                            : 'open'
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {issue.tags?.join(', ')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewIssue?.(issue._id || issue.id)}
                      >
                        View
                      </Button>
                      <a
                        className="text-xs underline text-primary ml-auto"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Card>

      {/* Optional List View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.slice(0, 6).map((issue) => (
          <Card
            key={issue._id || issue.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <span>
                {categoryIcons[(issue.tags?.[0] || 'other') as keyof typeof categoryIcons]}
              </span>
              <StatusBadge
                status={
                  issue.status?.toLowerCase()?.includes('resolv')
                    ? 'resolved'
                    : issue.status?.toLowerCase()?.includes('progress')
                    ? 'progress'
                    : 'open'
                }
              />
            </div>
            <h3 className="font-medium mb-1">{issue.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {issue.location?.name ||
                (issue.location?.coordinates
                  ? `${issue.location.coordinates[1]?.toFixed?.(3)}, ${issue.location.coordinates[0]?.toFixed?.(3)}`
                  : '—')}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {(issue.upvotes?.length || 0)} upvotes
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MapView;
