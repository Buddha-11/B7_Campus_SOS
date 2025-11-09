import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, ArrowLeft, CheckCircle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReportIssue = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
    image: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar userType="student" />
        <div className="flex-1 flex flex-col">
          <Header title="Report Issue" subtitle="Submit a new campus issue" />
          <main className="flex-1 flex items-center justify-center p-6">
            <Card className="max-w-md w-full text-center animate-scale-in">
              <CardContent className="pt-12 pb-8">
                <CheckCircle className="h-16 w-16 text-status-resolved mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Issue Reported Successfully!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your report has been submitted and will be reviewed by our team.
                </p>
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Map
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar userType="student" />
      <div className="flex-1 flex flex-col">
        <Header title="Report a New Issue" subtitle="Help improve our campus" />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wifi">📶 WiFi</SelectItem>
                        <SelectItem value="cleanliness">🧹 Cleanliness</SelectItem>
                        <SelectItem value="safety">🛡️ Safety</SelectItem>
                        <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                        <SelectItem value="other">📝 Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="e.g., Library Level 3, Room 204"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={`pl-10 ${errors.location ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.location && (
                      <p className="text-sm text-destructive">{errors.location}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about the issue..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`min-h-[120px] ${errors.description ? 'border-destructive' : ''}`}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Upload Image (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                        className="cursor-pointer"
                      />
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a photo to help illustrate the problem
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Submit Report
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportIssue;
