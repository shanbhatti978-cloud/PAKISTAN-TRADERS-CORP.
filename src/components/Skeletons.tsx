import React from 'react';

export const ScreenSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="h-28 rounded-3xl bg-surface-2 border border-border/50" />

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="h-24 rounded-2xl bg-surface-2 border border-border/50" />
        <div className="h-24 rounded-2xl bg-surface-2 border border-border/50" />
        <div className="h-24 rounded-2xl bg-surface-2 border border-border/50" />
        <div className="h-24 rounded-2xl bg-surface-2 border border-border/50" />
      </div>

      {/* Main List Table Skeleton */}
      <div className="h-64 rounded-3xl bg-surface-2 border border-border/50" />
    </div>
  );
};

export const ModalSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg h-96 rounded-3xl bg-surface border border-border p-6 space-y-4 animate-pulse">
        <div className="h-8 w-1/2 bg-surface-2 rounded-xl" />
        <div className="h-12 bg-surface-2 rounded-xl" />
        <div className="h-12 bg-surface-2 rounded-xl" />
        <div className="h-24 bg-surface-2 rounded-xl" />
      </div>
    </div>
  );
};
