// src/components/map/MapView.tsx
import React, { useEffect, useState } from "react";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryIcons } from "@/data/mockData";
import StatusBadge from "@/components/ui/status-badge";

interface MapViewProps {
  onReportIssue?: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "campus_sos_token";

const MapView = ({ onReportIssue }: MapViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch issues from backend
  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const res = await fetch(`${API_BASE}/api/issues`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to fetch issues");
        setIssues(data.items || data || []);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Error fetching issues");
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  // derive categories dynamically
  const categories = Array.from(
    new Set(
      issues
        .map((issue) => (issue.category || issue.tags?.[0] || "other").toLowerCase())
        .filter(Boolean)
    )
  );

  // optionally filter issues by selected category
  const filteredIssues = selectedCategory
    ? issues.filter(
        (issue) =>
          (issue.category || issue.tags?.[0] || "other").toLowerCase() ===
          selectedCategory.toLowerCase()
      )
    : issues;

  if (loading)
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Loading map data...
      </div>
    );

  if (errorMsg)
    return (
      <div className="flex items-center justify-center h-96 text-destructive">
        {errorMsg}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Campus Map</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            onClick={onReportIssue}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All Issues
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer flex items-center gap-1"
            onClick={() => setSelectedCategory(category)}
          >
            <span>{categoryIcons[category as keyof typeof categoryIcons]}</span>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Badge>
        ))}
      </div>

      {/* Map Container */}
      <Card className="relative h-96 bg-muted/10 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-muted-foreground">Interactive Campus Map</p>
            <p className="text-sm text-muted-foreground">
              Click to drop pins and report issues
            </p>
          </div>
        </div>

        {/* Real Map Pins (basic demo positions based on index) */}
        {filteredIssues.slice(0, 5).map((issue, idx) => (
          <div
            key={issue._id}
            title={issue.title}
            className={`absolute w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform
              ${
                issue.status === "Resolved"
                  ? "bg-status-resolved"
                  : issue.status === "InProgress"
                  ? "bg-status-progress"
                  : "bg-status-open"
              }`}
            style={{
              top: `${20 + (idx * 15) % 60}%`,
              left: `${30 + (idx * 10) % 40}%`,
            }}
          >
            {idx + 1}
          </div>
        ))}
      </Card>

      {/* Nearby Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.slice(0, 6).map((issue) => (
          <Card
            key={issue._id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <span>
                {
                  categoryIcons[
                    (issue.category || issue.tags?.[0] || "other") as keyof typeof categoryIcons
                  ]
                }
              </span>
              <StatusBadge
                status={
                  (issue.status === "Resolved"
                    ? "resolved"
                    : issue.status === "InProgress"
                    ? "progress"
                    : "open") as "open" | "progress" | "resolved"
                }
              />
            </div>
            <h3 className="font-medium mb-1">{issue.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {(issue.location?.name as string) ||
                `(${issue.location?.coordinates?.[1]?.toFixed(3)}, ${issue.location?.coordinates?.[0]?.toFixed(3)})`}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {(issue.upvotes?.length || 0)} upvotes
              </span>
              <span className="text-muted-foreground">
                {(issue.comments?.length || 0)} comments
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MapView;
