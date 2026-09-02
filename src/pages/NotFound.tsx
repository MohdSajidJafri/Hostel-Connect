import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-6xl font-bold tracking-tight text-neutral-950">404</h1>
        <h2 className="text-lg font-semibold text-neutral-900">Page not found</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          The page you are looking for might have been moved, removed, or is temporarily unavailable.
        </p>
      </div>
      <Link 
        to="/" 
        className="btn btn-primary text-xs inline-flex items-center gap-1.5"
      >
        <ArrowLeft size={13} />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
};

export default NotFound;

