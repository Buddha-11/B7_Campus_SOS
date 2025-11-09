import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, FileText, User, BarChart3, Users, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userType: 'student' | 'admin';
  className?: string;
}

const Sidebar = ({ userType, className }: SidebarProps) => {
  const studentItems = [
    { icon: Map, label: 'Map', href: '/dashboard' },
    { icon: FileText, label: 'Report Issue', href: '/dashboard/report' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
    { icon: Users, label: 'Leaderboard', href: '/dashboard/leaderboard' },
  ];

  const adminItems = [
    { icon: BarChart3, label: 'Overview', href: '/admin' },
    { icon: Map, label: 'Heatmap', href: '/admin/heatmap' },
    { icon: Grid3X3, label: 'Categories', href: '/admin/categories' },
    { icon: FileText, label: 'All Issues', href: '/admin/issues' },
  ];

  const items = userType === 'student' ? studentItems : adminItems;

  return (
    <div className={cn("w-64 bg-card border-r border-border flex flex-col", className)}>
      <div className="p-6 border-b border-border">
        <a href="/" className="text-xl font-bold text-primary hover:underline">
          Campus SOS
        </a>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                "hover:bg-muted/50",
                isActive
                  ? "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;