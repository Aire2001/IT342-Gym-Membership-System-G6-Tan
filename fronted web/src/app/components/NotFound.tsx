import { Link } from 'react-router';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found</p>
        <Link to="/">
          <Button>Go to Login</Button>
        </Link>
      </div>
    </div>
  );
}
