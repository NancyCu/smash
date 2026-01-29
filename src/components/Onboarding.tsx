// src/components/Onboarding.tsx
'use client';
import { useEffect } from 'react';
import { startTour } from '@/utils/tour'; // Import the new function

export default function Onboarding({ isLoading }: { isLoading: boolean }) {
  useEffect(() => {
    if (!isLoading) {
      // Run in "Auto Mode" (checks localStorage)
      startTour(false);
    }
  }, [isLoading]);

  return null;
}