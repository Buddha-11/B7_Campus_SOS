import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockIssues, categoryIcons } from '@/data/mockData';
import StatusBadge from '@/components/ui/status-badge';

interface MapViewProps {
  onReportIssue?: () => void;
}

const MapView = ({ onReportIssue }: MapViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(mockIssues.map(issue => issue.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Campus Map</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {/* Filter logic */}}
            className="flex items-center gap-2"
          >
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

      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All Issues
        </Badge>
        {categories.map(category => (
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
            <p className="text-sm text-muted-foreground">Click to drop pins and report issues</p>
          </div>
        </div>

        {/* Mock Map Pins */}
        <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-status-open rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform">
          3
        </div>
        <div className="absolute top-2/3 right-1/3 w-8 h-8 bg-status-progress rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform">
          2
        </div>
        <div className="absolute bottom-1/4 left-1/2 w-8 h-8 bg-status-resolved rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform">
          1
        </div>
      </Card>

      {/* Nearby Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockIssues.slice(0, 3).map(issue => (
          <Card key={issue.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span>{categoryIcons[issue.category]}</span>
              <StatusBadge status={issue.status} />
            </div>
            <h3 className="font-medium mb-1">{issue.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{issue.location.name}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{issue.upvotes} upvotes</span>
              <span className="text-muted-foreground">{issue.comments} comments</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MapView;