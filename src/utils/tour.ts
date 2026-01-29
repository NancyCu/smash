import { driver } from 'driver.js';
import "driver.js/dist/driver.css";

export const startTour = (force = false) => {
  if (!force) {
    const hasSeen = localStorage.getItem('squares_onboarding_v6'); // Bumped to v6
    if (hasSeen) return;
  }

  const driverObj = driver({
    showProgress: true,
    animate: true,
    popoverClass: 'driverjs-electric-theme',
    onDestroyed: () => {
      if (!force) {
        localStorage.setItem('squares_onboarding_v6', 'true');
      }
    },
    steps: [
      // --- 1. GAME SELECTOR (The Circled Area) ---
      {
        element: '#tour-bet-ticker',
        popover: { 
          title: 'Switch Games Here', 
          description: 'Playing multiple boards? <strong>Tap these buttons</strong> at the top to switch between your active games (like "76ers vs Kings").' 
        }
      },
      
      // --- 2. TEAM OVERLAYS ---
      {
        element: '#tour-team-top',
        popover: { 
          title: 'Teams & Numbers', 
          description: 'These headers show the Teams now. When the game starts, they will turn into your <strong>winning numbers</strong> (0-9).' 
        }
      },

      // --- 3. THE SCOREBOARD ---
      {
        element: '#tour-scoreboard',
        popover: { 
          title: 'Watch the Score', 
          description: 'We use the <strong>last digit</strong> of the score. <br/>Example: <strong>2<span class="text-[#22d3ee]">7</span> - 1<span class="text-[#db2777]">4</span></strong> means the winning square is Col <strong>7</strong>, Row <strong>4</strong>.' 
        }
      },

      // --- 4. THE GRID ---
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Find Your Winner', 
          description: 'Match those numbers on the grid to see if you won the Quarter! The money rolls over if nobody wins.' 
        }
      },

      // --- 5. CLAIMING ---
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Claim a Square', 
          description: 'Tap any <strong>empty square</strong> to open the Claim Menu. Enter your name and hit Confirm.' 
        }
      },

      // --- 6. PAYING ---
      {
        element: '#tour-pay-btn',
        popover: { 
          title: 'Pay the Host', 
          description: 'Click here to Venmo/Zelle the host and mark your squares as "Paid".' 
        }
      },
      
      // --- 7. LIVE BUTTON ---
      {
        element: '#tour-live-btn',
        popover: { 
          title: 'Go Live', 
          description: 'When a game is active, this button will <strong>flash</strong>. Click it to jump to the live action.' 
        }
      }
    ]
  });

  driverObj.drive();
};