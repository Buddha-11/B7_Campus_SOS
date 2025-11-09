import React from 'react';
import { ArrowUp, MessageCircle, MapPin } from 'lucide-react';
import { Issue, categoryColors, categoryIcons } from '@/data/mockData';
import StatusBadge from '@/components/ui/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  onUpvote?: (id: string) => void;
  showActions?: boolean;
}

const IssueCard = ({ issue, onUpvote, showActions = true }: IssueCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{categoryIcons[issue.category]}</span>
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium border',
              categoryColors[issue.category]
            )}>
              {issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}
            </span>
            <StatusBadge status={issue.status} />
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
              {issue.location.name}
            </div>
            <span>•</span>
            <span>by {issue.reportedBy}</span>
            <span>•</span>
            <span>{formatDate(issue.reportedAt)}</span>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpvote?.(issue.id)}
                className="flex items-center gap-2"
              >
                <ArrowUp className="h-4 w-4" />
                {issue.upvotes}
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {issue.comments}
              </Button>
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