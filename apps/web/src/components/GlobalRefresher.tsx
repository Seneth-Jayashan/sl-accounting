import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { isNativeApp } from '../services/api';

export const GlobalRefresher: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show the refresher on Native Apps (Desktop / Android)
  if (!isNativeApp()) {
    return null;
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Reload the page completely
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      className="fixed bottom-24 right-6 lg:bottom-6 lg:right-6 z-[9999] bg-[#05668A] hover:bg-[#053A4E] text-white p-3 rounded-full shadow-lg shadow-[#05668A]/30 transition-all flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#05668A] cursor-pointer"
      aria-label="Refresh application"
      title="Refresh application"
    >
      <RefreshCw 
        size={24} 
        className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
      />
    </button>
  );
};
