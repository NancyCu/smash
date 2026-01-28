// src/utils/payouts.ts

export const getResolvedPayouts = (game: any, totalPot: number) => {
  // These percentages must match your CreateGameForm logic
  const PAYOUT_PERCENTAGES: Record<string, number> = {
    Q1: 0.10,   // $40 of $400
    HALF: 0.20, // $80 of $400
    Q3: 0.20,   // $80 of $400
    FINAL: 0.50 // $200 of $400
  };

  let accumulatedRollover = 0;

  // We map through the quarters in order to "carry" the money forward
  return ["Q1", "HALF", "Q3", "FINAL"].map((id) => {
    const quarterData = game.quarters?.find((q: any) => q.id === id) || {};
    const baseAmount = totalPot * (PAYOUT_PERCENTAGES[id] || 0);
    const currentAvailable = baseAmount + accumulatedRollover;

    // Logic: If the quarter is finished but no one owned the winning square
    if (quarterData.isFinished && !quarterData.winnerId) {
      accumulatedRollover = currentAvailable; // Push the money to the next bucket
      return { 
        ...quarterData, 
        id, 
        displayAmount: 0, 
        baseAmount, 
        isRollover: true 
      };
    }

    // If there's a winner, they take the current base + any rolled over cash
    const finalPrize = currentAvailable;
    accumulatedRollover = 0; // Reset the snowball because someone won it
    return { 
      ...quarterData, 
      id, 
      displayAmount: finalPrize, 
      baseAmount, 
      isRollover: false 
    };
  });
};