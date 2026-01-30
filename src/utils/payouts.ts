// src/utils/payouts.ts

/**
 * Calculate payouts with 50/50 Split Rollover Logic
 * 
 * Base Pots: Q1=$19, Q2=$38, Q3=$38, Final=$95 (per $190 pot)
 * 
 * Rollover Rules:
 * - Q1 no winner: Split 50/50 → Q2 gets half, Final gets half
 * - Q2 no winner: Split 50/50 → Q3 gets half, Final gets half
 * - Q3 no winner: 100% rolls to Final (no Q4 exists)
 * 
 * Test Cases:
 * 1. No Q1/Q2 winners, Q3/Final win: Q1=$0, Q2=$0, Q3=$61.75, Final=$128.25
 * 2. No Q1 winner, others win: Q1=$0, Q2=$47.50, Q3=$38, Final=$104.50
 * 3. No winners Q1/Q2/Q3, Final wins: Final=$190
 */
export const getResolvedPayouts = (game: any, totalPot: number) => {
  // Base percentages (10%, 20%, 20%, 50%)
  const BASE_PERCENTAGES: Record<string, number> = {
    Q1: 0.10,
    HALF: 0.20,
    Q3: 0.20,
    FINAL: 0.50
  };

  // Initialize current pots with base amounts
  const basePots = {
    Q1: totalPot * BASE_PERCENTAGES.Q1,
    HALF: totalPot * BASE_PERCENTAGES.HALF,
    Q3: totalPot * BASE_PERCENTAGES.Q3,
    FINAL: totalPot * BASE_PERCENTAGES.FINAL
  };

  let currentQ1 = basePots.Q1;
  let currentQ2 = basePots.HALF;
  let currentQ3 = basePots.Q3;
  let currentFinal = basePots.FINAL;

  // Process Q1
  const q1Data = game.quarters?.find((q: any) => q.id === "Q1") || {};
  const hasWinnerQ1 = q1Data.isFinished && q1Data.winnerId;
  
  if (q1Data.isFinished && !hasWinnerQ1) {
    const rolloverAmount = currentQ1;
    const splitAmount = rolloverAmount / 2;
    currentQ2 += splitAmount;
    currentFinal += splitAmount;
    currentQ1 = 0;
  }

  // Process Q2 (HALF)
  const q2Data = game.quarters?.find((q: any) => q.id === "HALF") || {};
  const hasWinnerQ2 = q2Data.isFinished && q2Data.winnerId;
  
  if (q2Data.isFinished && !hasWinnerQ2) {
    const rolloverAmount = currentQ2;
    const splitAmount = rolloverAmount / 2;
    currentQ3 += splitAmount;
    currentFinal += splitAmount;
    currentQ2 = 0;
  }

  // Process Q3 (NO SPLIT - 100% to Final)
  const q3Data = game.quarters?.find((q: any) => q.id === "Q3") || {};
  const hasWinnerQ3 = q3Data.isFinished && q3Data.winnerId;
  
  if (q3Data.isFinished && !hasWinnerQ3) {
    currentFinal += currentQ3;
    currentQ3 = 0;
  }

  // Return resolved payouts
  return [
    {
      ...q1Data,
      id: "Q1",
      displayAmount: currentQ1,
      baseAmount: basePots.Q1,
      isRollover: currentQ1 === 0 && q1Data.isFinished,
      rolloverToQ2: !hasWinnerQ1 && q1Data.isFinished ? basePots.Q1 / 2 : 0,
      rolloverToFinal: !hasWinnerQ1 && q1Data.isFinished ? basePots.Q1 / 2 : 0
    },
    {
      ...q2Data,
      id: "HALF",
      displayAmount: currentQ2,
      baseAmount: basePots.HALF,
      isRollover: currentQ2 === 0 && q2Data.isFinished,
      receivedFromQ1: !hasWinnerQ1 && q1Data.isFinished ? basePots.Q1 / 2 : 0,
      rolloverToQ3: !hasWinnerQ2 && q2Data.isFinished ? currentQ2 / 2 : 0,
      rolloverToFinal: !hasWinnerQ2 && q2Data.isFinished ? currentQ2 / 2 : 0
    },
    {
      ...q3Data,
      id: "Q3",
      displayAmount: currentQ3,
      baseAmount: basePots.Q3,
      isRollover: currentQ3 === 0 && q3Data.isFinished,
      receivedFromQ2: !hasWinnerQ2 && q2Data.isFinished ? currentQ2 / 2 : 0,
      rolloverToFinal: !hasWinnerQ3 && q3Data.isFinished ? currentQ3 : 0
    },
    {
      ...game.quarters?.find((q: any) => q.id === "FINAL") || {},
      id: "FINAL",
      displayAmount: currentFinal,
      baseAmount: basePots.FINAL,
      isRollover: false,
      receivedFromQ1: !hasWinnerQ1 && q1Data.isFinished ? basePots.Q1 / 2 : 0,
      receivedFromQ2: !hasWinnerQ2 && q2Data.isFinished ? currentQ2 / 2 : 0,
      receivedFromQ3: !hasWinnerQ3 && q3Data.isFinished ? currentQ3 : 0
    }
  ];
};