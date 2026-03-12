import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h1 className="text-6xl font-extrabold text-slate-900 mb-2 tracking-tight">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Page Not Found</h2>
      <p className="text-slate-500 mb-8 text-center max-w-md text-lg">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        to="/" 
        className="btn btn-primary px-8"
      >
        Return to Homepage
      </Link>
    </div>
  );
};

export default NotFound;
