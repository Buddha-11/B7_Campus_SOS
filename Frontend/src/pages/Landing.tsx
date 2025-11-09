import React from 'react';
import { ArrowRight, MapPin, TrendingUp, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-campus.jpg';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MapPin,
      title: 'Report campus problems easily',
      description: 'Drop a pin on the map and describe any issue you encounter around campus.',
    },
    {
      icon: TrendingUp,
      title: 'See real-time issue heatmap',
      description: 'Visualize problem areas across campus to understand common issues.',
    },
    {
      icon: CheckCircle,
      title: 'Track resolution status',
      description: 'Follow your reports from submission to resolution with live updates.',
    },
    {
      icon: Users,
      title: 'Upvote & validate issues',
      description: 'Help prioritize campus problems by voting on issues that affect you.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🏫</div>
            <span className="text-xl font-bold text-primary">Campus SOS</span>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/auth/login')}
          >
            Admin Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="relative container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="text-foreground">Campus</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    SOS
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Report, Track & Fix Campus Issues Together.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="bg-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  Report an Issue
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/auth/login')}
                  className="shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Admin Login
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img
                src={heroImage}
                alt="Campus with students using mobile devices"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Make Your Campus Better
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empowering students and staff to create a better campus environment through collaborative problem reporting.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200 border-0 bg-card/50 backdrop-blur">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join hundreds of students already making their campus a better place to learn and grow.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2024 Campus SOS. Made with ❤️ for better campuses.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;