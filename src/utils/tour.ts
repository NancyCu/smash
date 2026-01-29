import { driver } from 'driver.js';
import "driver.js/dist/driver.css";

export const startTour = (force = false) => {
  if (!force) {
    const hasSeen = localStorage.getItem('squares_onboarding_v8'); // Bumped to v8
    if (hasSeen) return;
  }

  const driverObj = driver({
    showProgress: true,
    animate: true,
    popoverClass: 'driverjs-electric-theme',
    onDestroyed: () => {
      if (!force) {
        localStorage.setItem('squares_onboarding_v8', 'true');
      }
    },
    steps: [
      // --- 1. BET TICKER (Top Buttons) ---
      {
        element: '#tour-bet-ticker',
        popover: { 
          title: 'Switch Games', 
          description: '<strong>Tap these buttons</strong> to jump between different games (e.g. 49ers vs Chiefs). This is your command center.' ,
          side: 'bottom', // <--- Force it below the buttons
          align: 'start'  // <--- Align it to the left
        }
      },
      
      // --- 2. TEAM LOGOS (Hidden Numbers) ---
      {
        element: '#tour-team-top',
        popover: { 
          title: 'Hidden Numbers', 
          description: 'See these <strong>Team Logos</strong>? They are hiding the grid numbers. <br/><br/>Once the game starts, the board is <strong>scrambled</strong> and these logos disappear to reveal your row/column numbers (0-9).' 
        }
      },

      // --- 3. SCOREBOARD (The Rule) ---
      {
        element: '#tour-scoreboard',
        popover: { 
          title: 'The Magic Number', 
          description: 'Look at the score here. We always use the <strong>last digit</strong>.<br/><br/>Example: <strong>2<span class="text-[#22d3ee]">7</span> - 1<span class="text-[#db2777]">4</span></strong> means the winning square is Col <strong>7</strong>, Row <strong>4</strong>.' 
        }
      },

      // --- 4. THE GRID ---
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Find Your Square', 
          description: 'Match those score numbers to the grid to find the winner. If nobody claims the winning square, the money <strong>rolls over</strong> to the next quarter!' 
        }
      },

      // --- 5. CLAIMING ---
      {
        element: '#tour-grid-area',
        popover: { 
          title: 'Claim a Spot', 
          description: 'Tap any <strong>empty square</strong> to open the Claim Menu. Enter your name and hit Confirm to lock it in.' 
        }
      },

      // --- 6. PAYING ---
      {
        element: '#tour-pay-btn',
        popover: { 
          title: 'Pay the Host', 
          description: 'Click here to Venmo/Zelle the host. Paid squares are marked on the board.' 
        }
      },
      
      // --- 7. LIVE BUTTON ---
      {
        element: '#tour-live-btn',
        popover: { 
          title: 'Go Live', 
          description: 'When a game is active, this button will <strong>flash</strong>. Click it to warp straight to the live action.' 
        }
      }
    ]
  });

  driverObj.drive();
};