import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const Heatmap = () => {
  const [filters, setFilters] = useState({
    wifi: true,
    cleanliness: true,
    safety: true,
    maintenance: true,
    other: true,
  });

  const toggleFilter = (category: string) => {
    setFilters(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar userType="admin" />
      
      <div className="flex-1 flex flex-col">
        <Header title="Heatmap" subtitle="Visualize issue density across campus" />
        
        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Issue Heatmap</h1>
            <p className="text-muted-foreground mt-2">Visualize campus areas with frequent reports</p>
          </div>

          <div className="grid gap-6">
            {/* Map Container */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative w-full h-[500px] bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 rounded-lg">
                  {/* Mock Heatmap Overlays */}
                  <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-red-500/30 rounded-full blur-2xl"></div>
                  <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-red-500/40 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-1/4 left-1/2 w-24 h-24 bg-yellow-500/30 rounded-full blur-2xl"></div>
                  <div className="absolute top-3/4 left-1/4 w-28 h-28 bg-yellow-500/25 rounded-full blur-2xl"></div>
                  <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-green-500/20 rounded-full blur-xl"></div>
                  
                  {/* Placeholder Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                      <p className="text-muted-foreground text-center">
                        📍 Interactive campus heatmap<br />
                        <span className="text-sm">Colored zones indicate issue density</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Legend */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Category Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter by Category</CardTitle>
                  <CardDescription>Select categories to display on the heatmap</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: 'wifi', label: 'WiFi Issues', icon: '📶' },
                    { id: 'cleanliness', label: 'Cleanliness', icon: '🧹' },
                    { id: 'safety', label: 'Safety Concerns', icon: '🛡️' },
                    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
                    { id: 'other', label: 'Other', icon: '📝' },
                  ].map(category => (
                    <div key={category.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={category.id}
                        checked={filters[category.id as keyof typeof filters]}
                        onCheckedChange={() => toggleFilter(category.id)}
                      />
                      <Label
                        htmlFor={category.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {category.icon} {category.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>Density Legend</CardTitle>
                  <CardDescription>Understanding the heatmap colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/40 blur-sm"></div>
                    <div>
                      <p className="font-medium text-foreground">High Density</p>
                      <p className="text-sm text-muted-foreground">10+ reports in this area</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/30 blur-sm"></div>
                    <div>
                      <p className="font-medium text-foreground">Medium Density</p>
                      <p className="text-sm text-muted-foreground">5-9 reports in this area</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 blur-sm"></div>
                    <div>
                      <p className="font-medium text-foreground">Low Density</p>
                      <p className="text-sm text-muted-foreground">1-4 reports in this area</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Heatmap;
