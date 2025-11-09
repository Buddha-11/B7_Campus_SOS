import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockIssues } from '@/data/mockData';
import { Wifi, Trash2, Shield, Wrench, FileText } from 'lucide-react';

const Categories = () => {
  const categoryData = [
    {
      name: 'WiFi',
      key: 'wifi',
      icon: Wifi,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      count: mockIssues.filter(i => i.category === 'wifi').length,
    },
    {
      name: 'Cleanliness',
      key: 'cleanliness',
      icon: Trash2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      count: mockIssues.filter(i => i.category === 'cleanliness').length,
    },
    {
      name: 'Safety',
      key: 'safety',
      icon: Shield,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      count: mockIssues.filter(i => i.category === 'safety').length,
    },
    {
      name: 'Maintenance',
      key: 'maintenance',
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      count: mockIssues.filter(i => i.category === 'maintenance').length,
    },
    {
      name: 'Other',
      key: 'other',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      count: mockIssues.filter(i => i.category === 'other').length,
    },
  ];

  const totalIssues = mockIssues.length;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar userType="admin" />
      
      <div className="flex-1 flex flex-col">
        <Header title="Categories" subtitle="Issue distribution by category" />
        
        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Issue Categories Overview</h1>
            <p className="text-muted-foreground mt-2">Track frequency of reports by category</p>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryData.map((category) => (
              <Card 
                key={category.key}
                className={`${category.bgColor} border-none transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {category.name}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{category.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((category.count / totalIssues) * 100).toFixed(1)}% of total issues
                  </p>
                  <div className="mt-3 h-2 w-full bg-white/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${category.color} transition-all duration-500`}
                      style={{ width: `${(category.count / totalIssues) * 100}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Total Issues Card */}
            <Card className="bg-gradient-to-br from-primary to-secondary border-none text-white transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Issues
                </CardTitle>
                <div className="p-2 rounded-lg bg-white/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalIssues}</div>
                <p className="text-xs text-white/80 mt-1">
                  All reported issues combined
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category) => (
                  <div key={category.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <category.icon className={`h-4 w-4 ${category.textColor}`} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className={`font-semibold ${category.textColor}`}>
                        {category.count} issues
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${category.color} transition-all duration-500`}
                        style={{ width: `${(category.count / totalIssues) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Categories;
