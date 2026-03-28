import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Check, ArrowLeft, Home } from 'lucide-react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../context/AuthContext';
import { mockMemberships } from '../context/AuthContext';

export function Memberships() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const features = {
    1: [
      'Access to gym facilities',
      'Regular hours only',
      'Basic equipment',
      'Locker room access'
    ],
    2: [
      'All Basic features',
      'Group fitness classes',
      '2 personal training sessions',
      'Extended hours access',
      'Premium equipment',
      'Sauna & steam room'
    ],
    3: [
      'All Premium features',
      '8 personal training sessions',
      '24/7 gym access',
      'Priority class booking',
      'Guest passes (2 per month)',
      'Nutrition consultation',
      'Free gym merchandise'
    ]
  };

  return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Dashboard Button */}
          <div className="flex items-center justify-between mb-6">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Membership Plan</h2>
            <p className="text-muted-foreground">Select the plan that best fits your fitness goals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {mockMemberships.map((membership) => {
              const isPremium = membership.id === 2;

              return (
                  <Card
                      key={membership.id}
                      className={isPremium ? 'border-primary shadow-lg relative' : ''}
                  >
                    {isPremium && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                        </div>
                    )}

                    <CardHeader className={isPremium ? 'pt-8' : ''}>
                      <CardTitle className="text-2xl">{membership.name}</CardTitle>
                      <CardDescription>{membership.description}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="mb-6">
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold">₱{membership.price.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-2">/ {membership.duration_months} {membership.duration_months === 1 ? 'month' : 'months'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ₱{Math.round(membership.price / membership.duration_months).toLocaleString()} per month
                        </p>
                      </div>

                      <ul className="space-y-3">
                        {features[membership.id as keyof typeof features]?.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      <Link to={`/payment/${membership.id}`} className="w-full">
                        <Button
                            className="w-full"
                            variant={isPremium ? 'default' : 'outline'}
                            size="lg"
                        >
                          Select Plan
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Need help choosing?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Not sure which plan is right for you? Our team is here to help you find the perfect membership based on your fitness goals.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">Contact Us</Button>
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
  );
}