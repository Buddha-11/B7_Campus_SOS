export interface Issue {
  id: string;
  title: string;
  category: 'wifi' | 'cleanliness' | 'safety' | 'maintenance' | 'other';
  description: string;
  location: { lat: number; lng: number; name: string };
  status: 'open' | 'progress' | 'resolved';
  upvotes: number;
  reportedBy: string;
  reportedAt: string;
  comments: number;
  image?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  points: number;
  reportsCount: number;
}

export const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'WiFi not working in Library Level 3',
    category: 'wifi',
    description: 'WiFi connection keeps dropping every few minutes, making it impossible to work.',
    location: { lat: 40.7128, lng: -74.0060, name: 'Main Library, Level 3' },
    status: 'open',
    upvotes: 24,
    reportedBy: 'Sarah Chen',
    reportedAt: '2024-01-15T10:30:00Z',
    comments: 5,
  },
  {
    id: '2',
    title: 'Broken chair in Room 204',
    category: 'maintenance',
    description: 'Chair is wobbling and unsafe to sit on.',
    location: { lat: 40.7130, lng: -74.0058, name: 'Academic Building, Room 204' },
    status: 'progress',
    upvotes: 12,
    reportedBy: 'Mike Johnson',
    reportedAt: '2024-01-14T14:15:00Z',
    comments: 3,
  },
  {
    id: '3',
    title: 'Poor lighting in parking lot',
    category: 'safety',
    description: 'Several light fixtures are out, making the area poorly lit at night.',
    location: { lat: 40.7125, lng: -74.0055, name: 'North Parking Lot' },
    status: 'resolved',
    upvotes: 18,
    reportedBy: 'Emma Davis',
    reportedAt: '2024-01-13T09:20:00Z',
    comments: 7,
  },
  {
    id: '4',
    title: 'Dirty restrooms in Student Center',
    category: 'cleanliness',
    description: 'Restrooms on the second floor need thorough cleaning and supplies.',
    location: { lat: 40.7132, lng: -74.0062, name: 'Student Center, 2nd Floor' },
    status: 'open',
    upvotes: 31,
    reportedBy: 'Alex Kim',
    reportedAt: '2024-01-16T11:45:00Z',
    comments: 12,
  },
  {
    id: '5',
    title: 'Elevator out of service',
    category: 'maintenance',
    description: 'Main elevator has been out of service for 3 days.',
    location: { lat: 40.7129, lng: -74.0059, name: 'Science Building, Main Entrance' },
    status: 'progress',
    upvotes: 45,
    reportedBy: 'Jordan Smith',
    reportedAt: '2024-01-12T16:00:00Z',
    comments: 8,
  },
];

export const mockUsers: User[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah.chen@college.edu', avatar: '👩‍🎓', points: 150, reportsCount: 8 },
  { id: '2', name: 'Mike Johnson', email: 'mike.j@college.edu', avatar: '👨‍🎓', points: 120, reportsCount: 6 },
  { id: '3', name: 'Emma Davis', email: 'emma.davis@college.edu', avatar: '👩‍💼', points: 200, reportsCount: 12 },
  { id: '4', name: 'Alex Kim', email: 'alex.kim@college.edu', avatar: '👨‍💻', points: 95, reportsCount: 4 },
  { id: '5', name: 'Jordan Smith', email: 'jordan.s@college.edu', avatar: '👩‍🔬', points: 180, reportsCount: 10 },
];

export const categoryColors = {
  wifi: 'bg-blue-100 text-blue-800 border-blue-200',
  cleanliness: 'bg-green-100 text-green-800 border-green-200',
  safety: 'bg-red-100 text-red-800 border-red-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const categoryIcons = {
  wifi: '📶',
  cleanliness: '🧹',
  safety: '🛡️',
  maintenance: '🔧',
  other: '📝',
};