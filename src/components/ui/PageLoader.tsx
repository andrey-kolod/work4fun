// src/components/ui/PageLoader.tsx
import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-700 font-medium">Загрузка...</p>
      </div>
    </div>
  );
};
