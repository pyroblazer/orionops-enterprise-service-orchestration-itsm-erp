'use client';

import { useEffect, useState } from 'react';
import { useColdStartStore } from '@/stores/cold-start-store';
import { Progress } from '@/components/ui/progress';

export function ColdStartBanner() {
  const isWaking = useColdStartStore((state) => state.isWaking);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isWaking) {
      setProgress(0);
      return;
    }

    setProgress(5);
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Cap at 95% while waiting, will complete when service responds
        if (prev >= 95) return prev;
        // Add random 5-15% per interval for smooth progression
        return prev + Math.random() * 10 + 5;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWaking]);

  if (!isWaking) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 p-4 shadow-lg z-50">
      <div className="max-w-md mx-auto">
        <p className="text-sm font-semibold text-yellow-900 mb-2">
          ⏳ Service is waking up, please wait...
        </p>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-yellow-700 mt-2">
          This may take 30-60 seconds on first load.
        </p>
      </div>
    </div>
  );
}
