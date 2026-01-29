// src/utils/tour.ts
import { driver } from 'driver.js';
import "driver.js/dist/driver.css";

export const startTour = (force = false) => {
  // 1. If not forcing (auto-mode), check if seen
  if (!force) {
    const hasSeen = localStorage.getItem('squares_onboarding_v2');
    if (hasSeen) return;
  }

  // 2. The Config
  const driverObj = driver({
    showProgress: true,
    animate: true,
    popoverClass: 'driverjs-electric-theme',
    onDestroyed: () => {
      // Only mark as seen if it wasn't a forced replay
      if (!force) {
        localStorage.setItem('squares_onboarding_v2', 'true');
      }
    },
    steps: [
      {
        element: '#tour-team-top',
        popover: { 
          title: 'How to Win', 
          description: 'Look at the score at the end of each quarter. Take the <strong>last digit</strong> of each team\'s score.' 
        }
      },
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Match the Grid', 
          description: 'If the score is <strong>Chiefs 17 - 49ers 14</strong>, find Column 7 and Row 4. That square wins the quarter!' 
        }
      },
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Claim Your Spot', 
          description: 'Tap any empty square to open the Claim Menu. Enter your name and hit <strong>Confirm</strong> to lock it in.' 
        }
      },
      {
        element: '#tour-pay-btn',
        popover: { 
          title: 'Pay the Host', 
          description: 'Click here to Venmo/Zelle the host and mark your squares as paid.' 
        }
      }
    ]
  });

  driverObj.drive();
};