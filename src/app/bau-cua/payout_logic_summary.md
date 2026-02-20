# Bau Cua Payout Logic & Money Handling

This document provides a technical overview of how money, bets, and payouts are managed in the Bau Cua game. Use this as a reference for debugging financial inconsistencies.

## 1. Core Architecture
The game follows a **Dealer vs. Player (House)** model in Live Mode. The Host acts as the "House," paying out winners and collecting from losers.

### Key Files
- `src/lib/bau-cua-service.ts`: Contains the Firestore interface, data types, and collection constants.
- `src/app/bau-cua/page.tsx`: Contains the game state machine and settlement logic.
- `src/app/bau-cua/ledger/page.tsx`: The UI for viewing the transaction history.

---

## 2. Data Source of Truth (Firestore)
- **`bau_cua_players`**: Stores each player's `balance`, `wins`, and `losses`.
- **`bau_cua_session`**: A single document (`live_game`) that drives the game state for all clients.
  - `status`: `BETTING` | `ROLLING` | `RESULT`
  - `result`: The 3 animals rolled (e.g., `["deer", "crab", "gourd"]`).
  - `roundStartTime`: A timestamp set by the host when a round results. **Crucial for preventing duplicate payouts.**
- **`bau_cua_bets`**: Real-time storage of every player's active bets for the current round.
- **`bau_cua_transactions`**: Audit trail of every financial event (`WIN`, `LOSS`, `BET`, `DEPOSIT`).

---

## 3. The Payout Lifecycle

### Phase 1: Betting
- Players place bets locally.
- A debounced `useEffect` in `page.tsx` calls `updateBet()` to sync the local `bets` object to the `bau_cua_bets` collection.

### Phase 2: Host Calculation (`confirmResult`)
When the Host reveals the dice:
1. Calls `updateSessionStatus('RESULT', result, Date.now())`.
2. Calculates **Dealer Net Profit**:
   - Iterates through `allBets` (all other players).
   - `Host Gain` from Player A = `Player A Bet Amount` - `Player A Payout`.
3. Updates the Host's Firestore balance and logs a `DEALER WIN/LOSS` transaction.

### Phase 3: Client Calculation (`settleClientRound`)
Clients detect the `RESULT` status via the `subscribeToSession` subscription.
1. `useEffect` triggers the payout logic.
2. **Duplicate Check**: The client checks `localStorage` for `bauCua_lastProcessedRoundTime`.
   - If it matches `session.roundStartTime`, the payout is **skipped** (prevents double-paying on refresh).
3. If new:
   - Calculates individual `payout` (Bets * Matches + Original Bet).
   - Updates Player balance and logs a `WIN/LOSS` transaction.
   - Stores `session.roundStartTime` in `localStorage`.

---

## 4. Financial Calculations
The standard payout formula used in `calculatePayout`:
- **Winner**: Receives their original bet back + (Bet * Number of Matches).
  - Example: Bet $10 on Deer. Result: [Deer, Deer, Crab].
  - Payout: $10 (Return) + $20 (Win x2) = **$30**.
  - Net Profit: **+$20**.
- **Loser**: Original bet is lost.
  - Net Profit: **-$10**.

---

## 5. Common Debug Points
- **Balance not updating**: Check if `updatePlayerStats` or `setPlayerBalance` is failing in `bau-cua-service.ts`.
- **Duplicate Payouts**: Ensure `session.roundStartTime` is being set by the host in `updateSessionStatus` and correctly checked in `page.tsx`.
- **Transactions Missing**: Verify `addTransaction` is called with the correct `newBalance` snapshot.
