'use client';
import { useEffect } from 'react';
import { driver } from 'driver.js';
import "driver.js/dist/driver.css";

export default function Onboarding({ isLoading }: { isLoading: boolean }) {
  useEffect(() => {
    // 1. Don't run if loading or already seen
    if (isLoading) return;
    const hasSeen = localStorage.getItem('squares_onboarding_v1');
    if (hasSeen) return;

    // 2. Double check elements exist before driving
    const topTeam = document.getElementById('tour-team-top');
    const scrambleBtn = document.getElementById('tour-scramble-btn');
    
    if (!topTeam || !scrambleBtn) return;

    // 3. Configure the Tour
    const driverObj = driver({
      showProgress: true,
      animate: true,
      popoverClass: 'driverjs-electric-theme', // Custom Theme Class
      onDestroyed: () => {
        localStorage.setItem('squares_onboarding_v1', 'true');
      },
      steps: [
        {
          element: '#tour-team-top',
          popover: { 
            title: 'Team Top (Column Numbers)', 
            description: 'The last digit of this team\'s score matches the column numbers here.' 
          }
        },
        {
          element: '#tour-team-left',
          popover: { 
            title: 'Team Side (Row Numbers)', 
            description: 'The last digit of this team\'s score matches the row numbers here.' 
          }
        },
        {
          element: '#tour-scramble-btn',
          popover: { 
            title: 'Lock & Load', 
            description: 'When the grid is full, click Scramble to assign random numbers and lock the game.' 
          }
        }
      ]
    });

    driverObj.drive();
  }, [isLoading]);

  return null;
}