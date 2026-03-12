import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center animate-in fade-in duration-500">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Loading...</h2>
        <p className="text-slate-500 mt-1">Please wait while we set things up</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
