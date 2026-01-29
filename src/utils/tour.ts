import { driver } from 'driver.js';
import "driver.js/dist/driver.css";

export const startTour = (force = false) => {
  // 1. Auto-start check
  if (!force) {
    const hasSeen = localStorage.getItem('squares_onboarding_v3'); // Bumped to v3
    if (hasSeen) return;
  }

  const driverObj = driver({
    showProgress: true,
    animate: true,
    popoverClass: 'driverjs-electric-theme',
    onDestroyed: () => {
      if (!force) {
        localStorage.setItem('squares_onboarding_v3', 'true');
      }
    },
    steps: [
      // --- NEW: NAVIGATION ---
      {
        element: '#tour-bet-ticker', // Needs ID
        popover: { 
          title: 'Your Game Dashboard', 
          description: 'Use this ticker to toggle between different games you are betting on.' 
        }
      },
      {
        element: '#tour-live-btn', // Needs ID
        popover: { 
          title: 'Follow the Action', 
          description: 'When a game is LIVE, this button will <strong>flash</strong>. Click it to jump straight into the active game.' 
        }
      },

      // --- EXISTING: GRID RULES ---
      {
        element: '#tour-team-top',
        popover: { 
          title: 'How to Win', 
          description: 'Check the score at the end of each quarter. Match the <strong>last digit</strong> of each team\'s score to the grid numbers.' 
        }
      },
      
      // --- NEW: SCRAMBLE & ROLLOVER RULES ---
      {
        element: '#tour-grid-area',
        popover: { 
          title: '4 Quarters = 4 Grids', 
          description: '<strong>The numbers change every quarter!</strong> We scramble the rows and columns 4 times. Your square stays the same, but your winning numbers will shuffle.' 
        }
      },
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Rollover Pots', 
          description: 'If nobody wins a quarter, the money <strong>rolls over</strong> to the next one. The Final Pot could be huge!' 
        }
      },

      // --- EXISTING: CLAIM & PAY ---
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Claim Your Spot', 
          description: 'Tap any empty square to open the menu. Enter your name and hit <strong>Confirm</strong> to lock it in.' 
        }
      },
      {
        element: '#tour-pay-btn',
        popover: { 
          title: 'Pay the Host', 
          description: 'Don\'t be a deadbeat. Click here to Venmo/Zelle the host and mark your squares as paid.' 
        }
      }
    ]
  });

  driverObj.drive();
};