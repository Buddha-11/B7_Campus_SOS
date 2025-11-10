// src/components/issues/IssueCard.tsx
import React, { useState, useEffect } from "react";
import { ArrowUp, MessageCircle, MapPin } from "lucide-react";
import { Issue, categoryColors, categoryIcons } from "@/data/mockData";
import StatusBadge from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: Issue;
  onUpvote?: (id: string, upvotes: number, upvoted: boolean) => void;
  showActions?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "campus_sos_token";

const IssueCard = ({ issue, onUpvote, showActions = true }: IssueCardProps) => {
  const issueId = (issue as any).id || (issue as any)._id;

  const initialUpvotes =
    (issue as any).upvotes ?? (issue as any).upvoteCount ?? 0;
  const initiallyUpvoted = !!(issue as any).upvoted;

  const [upvotes, setUpvotes] = useState<number>(initialUpvotes);
  const [upvoted, setUpvoted] = useState<boolean>(initiallyUpvoted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUpvotes((issue as any).upvotes ?? (issue as any).upvoteCount ?? 0);
    setUpvoted(!!(issue as any).upvoted);
  }, [issue]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString || "";
    }
  };

  const handleToggleUpvote = async () => {
    if (!issueId) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      console.warn("Not authenticated - cannot upvote");
      return;
    }

    const prevUpvoted = upvoted;
    const prevUpvotes = upvotes;
    setUpvoted(!prevUpvoted);
    setUpvotes(prevUpvoted ? Math.max(0, prevUpvotes - 1) : prevUpvotes + 1);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/issues/${issueId}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Upvote failed");

      const serverUpvoted =
        typeof json.upvoted === "boolean" ? json.upvoted : !prevUpvoted;
      const serverUpvotes =
        typeof json.upvotes === "number"
          ? json.upvotes
          : serverUpvoted
          ? prevUpvotes + 1
          : Math.max(0, prevUpvotes - 1);

      setUpvoted(serverUpvoted);
      setUpvotes(serverUpvotes);
      onUpvote?.(issueId, serverUpvotes, serverUpvoted);
    } catch (err) {
      console.error("Toggle upvote error:", err);
      setUpvoted(prevUpvoted);
      setUpvotes(prevUpvotes);
    } finally {
      setLoading(false);
    }
  };

  // --- Category handling ---
  const rawCategory =
    (issue as any).category ??
    (Array.isArray((issue as any).tags) && (issue as any).tags[0]) ??
    "other";
  const category = String(rawCategory);

  // --- Safe location label (handles both backend + mock formats) ---
  let locationLabel = "Unknown location";
  const loc = (issue as any).location;
  if (loc) {
    if (typeof loc.name === "string") {
      locationLabel = loc.name;
    } else if (Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
      const [lng, lat] = loc.coordinates;
      locationLabel = `(${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    } else if ("lat" in loc && "lng" in loc) {
      locationLabel = `(${Number(loc.lat).toFixed(3)}, ${Number(
        loc.lng
      ).toFixed(3)})`;
    }
  }

  const reportedBy =
    (issue as any).reportedBy || (issue as any).reporter?.name || "Anonymous";
  const reportedAt =
    (issue as any).reportedAt ||
    (issue as any).createdAt ||
    (issue as any).created_at ||
    new Date().toISOString();

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{categoryIcons[category]}</span>
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium border",
                categoryColors[category] ??
                  "border-gray-200 text-gray-700 bg-gray-50"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
            <StatusBadge status={(issue as any).status ?? "open"} />
          </div>

          <h3 className="font-semibold text-lg mb-2 text-foreground">
            {issue.title}
          </h3>

          <p className="text-muted-foreground mb-3 line-clamp-2">
            {issue.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {locationLabel}
            </div>
            <span>•</span>
            <span>by {reportedBy}</span>
            <span>•</span>
            <span>{formatDate(reportedAt)}</span>
          </div>

          {showActions && (
            <div className="flex items-center gap-4">
              <Button
                variant={upvoted ? "default" : "outline"}
                size="sm"
                onClick={handleToggleUpvote}
                className="flex items-center gap-2"
                disabled={loading}
                aria-pressed={upvoted}
                title={upvoted ? "Remove upvote" : "Upvote"}
              >
                <ArrowUp className="h-4 w-4" />
                {upvotes}
              </Button>

              {/* <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {(issue as any).comments ?? (issue as any).commentsCount ?? 0}
              </Button> */}
            </div>
          )}
        </div>

        {issue.image && (
          <img
            src={issue.image}
            alt="Issue"
            className="w-20 h-20 rounded-lg object-cover"
          />
        )}
      </div>
    </Card>
  );
};

export default IssueCard;
