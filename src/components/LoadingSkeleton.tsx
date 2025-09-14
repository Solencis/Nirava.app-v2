import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white/90 rounded-2xl p-4 shadow-soft border border-stone/10 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="h-4 bg-stone/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-stone/10 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-stone/10 rounded w-2/3"></div>
            </div>
            <div className="w-4 h-4 bg-stone/20 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-stone/10 rounded w-full"></div>
            <div className="h-3 bg-stone/10 rounded w-4/5"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const HistoryLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-jade/5 rounded-xl p-4 border border-jade/10 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <div className="h-4 bg-jade/20 rounded w-20 mr-2"></div>
                <div className="h-3 bg-jade/10 rounded w-8"></div>
              </div>
              <div className="h-3 bg-stone/10 rounded w-24 mb-1"></div>
              <div className="h-3 bg-jade/10 rounded w-16 mb-1"></div>
              <div className="h-3 bg-stone/10 rounded w-full"></div>
            </div>
            <div className="w-4 h-4 bg-stone/20 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};