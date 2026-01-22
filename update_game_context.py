import os

content = """\"use client\";

import React, { createContext, useContext, useState, useEffect } from \"react\";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot
} from \"firebase/firestore\";
import { db } from \"@/lib/firebase\";

interface Payout {
  label: string;
  amount: number;
}

interface GameSettings {
  name: string;
  pricePerSquare: number;
  payouts: Payout[];
  teamA: string;
  teamB: string;
  rows: number[];
  cols: number[];
  rules?: string;
}

interface Player {
  id: string;
  name: string;
  squares: number;
  paid: boolean;
}

interface GameState {
  id: string;
  password?: string;
  hostUserId: string;
  hostName: string;
  createdAt: number;
  settings: GameSettings;
  squares: Record<string, string>; // cellKey => playerId
  players: Player[];
  scores: { teamA: number; teamB: number };
}

type CreateGameInput = {
  hostUserId: string;
  hostName: string;
  password?: string;
  settings: Omit<Partial<GameSettings>, \"rows\" | \"cols\">;
};

type JoinGameResult =
  | { ok: true; gameId: string }
  | { ok: false; error: string };

interface GameContextType {
  activeGameId: string | null;
  activeGame: GameState | null;
  availableGames: Array<Pick<GameState, \"id\" | \"createdAt\" | \"hostName\" | \"settings\">>;
  settings: GameSettings;
  squares: Record<string, string>; // cellKey => playerId
  players: Player[];
  scores: { teamA: number; teamB: number };
  createGame: (input: CreateGameInput) => Promise<string>;
  joinGame: (gameId: string, password?: string) => Promise<JoinGameResult>;
  leaveGame: () => void;
  resetGame: () => Promise<void>;
  claimSquare: (row: number, col: number, player: { id: string; name: string }) => Promise<void>;
  togglePaid: (playerId: string) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<GameSettings>) => Promise<void>;
  updateScores: (teamA: number, teamB: number) => Promise<void>;
  scrambleGridDigits: () => Promise<void>;
}

const BASE_DIGITS = Array.from({ length: 10 }, (_, i) => i);

function numericDigits(): number[] {
  return [...BASE_DIGITS];
}

const defaultSettings: GameSettings = {
  name: \"Season Opener 2024\",
  pricePerSquare: 50,
  payouts: [
    { label: \"Q1 Winner\", amount: 500 },
    { label: \"Q2 Winner\", amount: 500 },
    { label: \"Q3 Winner\", amount: 500 },
    { label: \"Final Winner\", amount: 1000 },
  ],
  teamA: \"Baltimore Ravens\",
  teamB: \"Kansas City Chiefs\",
  rows: numericDigits(),
  cols: numericDigits(),
};

function shuffleDigits(): number[] {
  const digits = Array.from({ length: 10 }, (_, i) => i);
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

function generateGameId(): string {
  // Simple random 8-char code. Conflict handling is minimal here but sufficient for small scale.
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<GameState | null>(null);

  // Subscribe to the active game in Firestore
  useEffect(() => {
    if (!activeGameId) {
      setActiveGame(null);
      return;
    }

    const docRef = doc(db, \"games\", activeGameId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setActiveGame(snap.data() as GameState);
      } else {
        // Document deleted or doesnt exist
        setActiveGame(null);
        setActiveGameId(null);
      }
    });

    return () => unsubscribe();
  }, [activeGameId]);

  const createGame = async (input: CreateGameInput) => {
    const id = generateGameId();
    const settings: GameSettings = {
      ...defaultSettings,
      ...input.settings,
      rows: numericDigits(),
      cols: numericDigits(),
    };

    const newGame: GameState = {
      id,
      password: input.password?.trim() || undefined,
      hostUserId: input.hostUserId,
      hostName: input.hostName,
      createdAt: Date.now(),
      settings,
      squares: {},
      players: [],
      scores: { teamA: 0, teamB: 0 },
    };

    await setDoc(doc(db, \"games\", id), newGame);
    setActiveGameId(id);
    return id;
  };

  const joinGame = async (gameId: string, password?: string): Promise<JoinGameResult> => {
    const trimmedId = gameId.trim().toUpperCase();
    const docRef = doc(db, \"games\", trimmedId);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      return { ok: false, error: \"Game not found. Check the code.\" };
    }

    const gameData = snap.data() as GameState;
    if (gameData.password && (password ?? \"\").trim() !== gameData.password) {
      return { ok: false, error: \"Incorrect game password.\" };
    }

    setActiveGameId(trimmedId);
    return { ok: true, gameId: trimmedId };
  };

  const leaveGame = () => {
    setActiveGameId(null);
    setActiveGame(null);
  };

  const resetGame = async () => {
    if (!activeGameId) return;
    const docRef = doc(db, \"games\", activeGameId);
    await updateDoc(docRef, {
      squares: {},
      players: [],
      scores: { teamA: 0, teamB: 0 }
    });
  };

  const claimSquare = async (row: number, col: number, player: { id: string; name: string }) => {
    if (!activeGameId || !activeGame) return;
    const key = f\"{row}-{col}\";
    if (activeGame.squares[key]) return; // Already claimed

    const nextSquares = { ...activeGame.squares, [key]: player.id };
    
    // Recalculate player list locally then push. 
    // In a real app wed use a transaction or separate collections for robustness.
    let nextPlayers = [...activeGame.players];
    const existing = nextPlayers.find((p) => p.id === player.id);
    
    if (!existing) {
      nextPlayers.push({ id: player.id, name: player.name, squares: 1, paid: false });
    } else {
      // Update name if changed? And increment count
      nextPlayers = nextPlayers.map(p => {
        if (p.id !== player.id) return p;
        return { ...p, name: player.name, squares: p.squares + 1 };
      });
    }

    const docRef = doc(db, \"games\", activeGameId);
    await updateDoc(docRef, {
      squares: nextSquares,
      players: nextPlayers
    });
  };

  const togglePaid = async (playerId: string) => {
    if (!activeGameId || !activeGame) return;
    const nextPlayers = activeGame.players.map((p) => (p.id === playerId ? { ...p, paid: !p.paid } : p));
    const docRef = doc(db, \"games\", activeGameId);
    await updateDoc(docRef, { players: nextPlayers });
  };

  const deletePlayer = async (playerId: string) => {
    if (!activeGameId || !activeGame) return;
    
    // Remove their squares
    const nextSquares: Record<string, string> = {};
    for (const [cellKey, claimedBy] of Object.entries(activeGame.squares)) {
      if (claimedBy !== playerId) nextSquares[cellKey] = claimedBy;
    }
    
    const nextPlayers = activeGame.players.filter(p => p.id !== playerId);

    const docRef = doc(db, \"games\", activeGameId);
    await updateDoc(docRef, { squares: nextSquares, players: nextPlayers });
  };

  const updateSettings = async (newSettings: Partial<GameSettings>) => {
    if (!activeGameId || !activeGame) return;
    const nextSettings = { ...activeGame.settings, ...newSettings };
    const docRef = doc(db, \"games\", activeGameId);
    await updateDoc(docRef, { settings: nextSettings });
  };

  const updateScores = async (teamA: number, teamB: number) => {
    if (!activeGameId) return;
    const docRef = doc(db, \"games\", activeGameId);
    await updateDoc(docRef, { scores: { teamA, teamB } });
  };

  const scrambleGridDigits = async () => {
    if (!activeGameId || !activeGame) return;
    const nextSettings = {
      ...activeGame.settings,
      rows: shuffleDigits(),
      cols: shuffleDigits(),
    };
    const docRef = doc(db, \"games\", activeGameId);
    await updateDoc(docRef, { settings: nextSettings });
  };

  const settings = activeGame?.settings ?? defaultSettings;
  const squares = activeGame?.squares ?? {};
  const players = activeGame?.players ?? [];
  const scores = activeGame?.scores ?? { teamA: 0, teamB: 0 };
  const availableGames: GameContextType[\"availableGames\"] = []; // Not used in this version

  return (
    <GameContext.Provider
      value={{
        activeGameId,
        activeGame,
        availableGames,
        settings,
        squares,
        players,
        scores,
        createGame,
        joinGame,
        leaveGame,
        resetGame,
        claimSquare,
        togglePaid,
        deletePlayer,
        updateSettings,
        updateScores,
        scrambleGridDigits,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error(\"useGame must be used within a GameProvider\");
  }
  return context;
}
"""

with open("src/context/GameContext.tsx", "w") as f:
    f.write(content)
print("Successfully overwrote src/context/GameContext.tsx")
