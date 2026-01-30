# 50/50 Split Rollover System

## Overview
This document explains the new **50/50 Split Rollover** payout logic implemented in the Squares betting pool system. This replaces the previous "100% to next quarter" rollover system.

## Purpose
The 50/50 split system prevents the Quarter 3 pot from exceeding the Final pot when multiple rollovers occur, ensuring a balanced and fair payout distribution throughout the game.

---

## Base Payout Structure

For a **$190 total pot** (example with $10 per square × 100 squares, less 5% house fee):

| Quarter | Percentage | Base Amount |
|---------|-----------|-------------|
| Q1      | 10%       | $19.00      |
| Q2      | 20%       | $38.00      |
| Q3      | 20%       | $38.00      |
| Final   | 50%       | $95.00      |

---

## Rollover Rules

### Quarter 1 or Quarter 2 (No Winner)
If Q1 or Q2 ends with no winner:
- The pot **splits 50/50**
- **50%** goes to the next quarter
- **50%** goes directly to Final

### Quarter 3 (No Winner)
If Q3 ends with no winner:
- The **entire pot rolls 100% to Final**
- (There is no Q4, so no split occurs)

---

## Test Cases

### Test Case 1: No Winners in Q1 or Q2
**Scenario:** Q1 No Winner, Q2 No Winner, Q3 Winner, Final Winner

| Quarter | Base | Rollover Received | Total Available | Winner? | Payout |
|---------|------|-------------------|-----------------|---------|--------|
| Q1      | $19.00 | $0    | $19.00  | ❌ No  | $0     |
| Q2      | $38.00 | +$9.50 (from Q1) | $47.50 | ❌ No | $0 |
| Q3      | $38.00 | +$23.75 (from Q2) | $61.75 | ✅ Yes | **$61.75** |
| Final   | $95.00 | +$9.50 (from Q1) +$23.75 (from Q2) | $128.25 | ✅ Yes | **$128.25** |

**Total Paid:** $61.75 + $128.25 = **$190.00** ✓

**Breakdown:**
1. Q1 ($19) → No winner → Split: $9.50 to Q2, $9.50 to Final
2. Q2 ($38 + $9.50 = $47.50) → No winner → Split: $23.75 to Q3, $23.75 to Final
3. Q3 ($38 + $23.75 = **$61.75**) → Winner takes all
4. Final ($95 + $9.50 + $23.75 = **$128.25**) → Winner takes all

---

### Test Case 2: Only Q1 Rolls Over
**Scenario:** Q1 No Winner, Q2 Winner, Q3 Winner, Final Winner

| Quarter | Base | Rollover Received | Total Available | Winner? | Payout |
|---------|------|-------------------|-----------------|---------|--------|
| Q1      | $19.00 | $0 | $19.00 | ❌ No | $0 |
| Q2      | $38.00 | +$9.50 (from Q1) | $47.50 | ✅ Yes | **$47.50** |
| Q3      | $38.00 | $0 | $38.00 | ✅ Yes | **$38.00** |
| Final   | $95.00 | +$9.50 (from Q1) | $104.50 | ✅ Yes | **$104.50** |

**Total Paid:** $47.50 + $38.00 + $104.50 = **$190.00** ✓

**Breakdown:**
1. Q1 ($19) → No winner → Split: $9.50 to Q2, $9.50 to Final
2. Q2 ($38 + $9.50 = **$47.50**) → Winner takes all
3. Q3 ($38 = **$38.00**) → Winner takes all  
4. Final ($95 + $9.50 = **$104.50**) → Winner takes all

---

### Test Case 3: Total Rollover (Worst Case)
**Scenario:** Q1 No Winner, Q2 No Winner, Q3 No Winner, Final Winner

| Quarter | Base | Rollover Received | Total Available | Winner? | Payout |
|---------|------|-------------------|-----------------|---------|--------|
| Q1      | $19.00 | $0 | $19.00 | ❌ No | $0 |
| Q2      | $38.00 | +$9.50 (from Q1) | $47.50 | ❌ No | $0 |
| Q3      | $38.00 | +$23.75 (from Q2) | $61.75 | ❌ No | $0 |
| Final   | $95.00 | +$9.50 (Q1) +$23.75 (Q2) +$61.75 (Q3) | $190.00 | ✅ Yes | **$190.00** |

**Total Paid:** $190.00 = **$190.00** ✓

**Breakdown:**
1. Q1 ($19) → No winner → Split: $9.50 to Q2, $9.50 to Final
2. Q2 ($38 + $9.50 = $47.50) → No winner → Split: $23.75 to Q3, $23.75 to Final
3. Q3 ($38 + $23.75 = $61.75) → No winner → 100% to Final: $61.75 to Final
4. Final ($95 + $9.50 + $23.75 + $61.75 = **$190.00**) → Winner takes entire pot

---

## Implementation Details

### Files Modified

1. **`/src/utils/payouts.ts`**
   - Completely rewritten with 50/50 split logic
   - Includes detailed comments and test case documentation
   - Processes Q1, Q2, Q3 sequentially with proper split calculations

2. **`/src/app/game/[id]/page.tsx`**
   - Updated `gameStats` useMemo hook
   - Replaced sequential rollover with split rollover logic
   - Correctly calculates `currentPots` for each period

3. **`/src/app/winners/page.tsx`**
   - Updated `rolloverResults` useMemo hook
   - Implements same 50/50 split logic for winners display

4. **`/src/components/GameInfo.tsx`**
   - Added visual "50/50 Split Rollover" warning banner
   - Updated rollover display to show "50/50 Split" vs "→ Final"
   - Added AlertCircle icon import

5. **`/src/app/rules/page.tsx`**
   - Added comprehensive "50/50 Split Rollover" explanation section
   - Includes visual examples and breakdown
   - User-friendly language to prevent confusion

### Visual Indicators

Users will see:
- **Amber warning banner** in the payout schedule explaining the 50/50 split system
- **"50/50 Split"** label on Q1/Q2 rollovers
- **"→ Final"** label on Q3 rollovers (100% to Final)
- **Detailed breakdown** on the Rules page with examples

---

## Benefits of 50/50 Split System

1. **Balanced Payouts:** Prevents Q3 from exceeding Final pot
2. **Fair Distribution:** Both next quarter AND Final benefit from rollovers
3. **Predictable:** Users can easily calculate potential payouts
4. **Transparent:** Clear visual indicators show where money flows
5. **No Confusion:** Detailed documentation and in-app explanations

---

## Testing

All three test cases pass successfully:

```bash
cd /Users/michaelnguyen/Smash/SmashedBox
node test-payouts.js
```

**Output:**
```
🎉 ALL TESTS PASSED! 50/50 Split Rollover logic is working correctly.
```

---

## User Communication

To prevent complaints about money:

1. ✅ **Visual Banner:** Shows on every game page explaining the 50/50 split
2. ✅ **Rules Page:** Dedicated section with examples and breakdowns
3. ✅ **In-App Labels:** Clear "50/50 Split" and "→ Final" indicators
4. ✅ **Rollover Breakdown:** Shows base amount + rollover amount separately
5. ✅ **Total Verification:** All test cases prove 100% of pot is distributed

---

## Future Considerations

If you want to make the split configurable:

```typescript
const ROLLOVER_CONFIG = {
  q1: { nextQuarter: 0.5, final: 0.5 },  // 50/50 split
  q2: { nextQuarter: 0.5, final: 0.5 },  // 50/50 split
  q3: { nextQuarter: 0, final: 1.0 },    // 100% to Final
};
```

This would allow easy adjustment of split percentages without code changes.

---

## Contact

For questions or concerns about the rollover system:
- Review the Rules page in the app
- Check the payment schedule on your game page
- Contact your game host for clarification

**Remember:** 100% of the pot is always distributed to winners. No money disappears!
