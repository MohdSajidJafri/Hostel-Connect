import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        <span className="text-xs font-medium text-neutral-500 tracking-wide">Loading Hostel Connect...</span>
      </div>
    </div>
  );
};

export default LoadingScreen;

