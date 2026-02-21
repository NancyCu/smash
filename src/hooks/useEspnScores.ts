"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface EspnScoreData {
  id: string;
  name: string;
  shortName?: string;
  date: string;
  league: string;
  homeTeam: { name: string; score: string; abbreviation: string; logo: string };
  awayTeam: { name: string; score: string; abbreviation: string; logo: string };
  period: number;
  clock: string;
  status: string; // "in", "pre", "post"
  statusDetail: string;
  isLive: boolean;
  competitors?: any[];
}

// Helper to generate a date string (YYYYMMDD) for a specific offset
function formatDateKey(offsetDays: number): string {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// Jittered polling intervals (ms)
const BASE_INTERVAL = 15000;   // 15s base
const JITTER_RANGE = 5000;     // +0-5s random jitter
const BACKOFF_INTERVAL = 30000; // 30s retry on failure
const MAX_BACKOFF = 120000;     // 2min max backoff

export function useEspnScores() {
  const [games, setGames] = useState<EspnScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastGoodGamesRef = useRef<EspnScoreData[]>([]);
  const consecutiveFailsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchScores = useCallback(async () => {
    try {
      // STREET SMART CONFIG: 
      // We define exactly how far to look ahead for EACH league.
      const endpoints = [
        {
          key: "NFL",
          url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
          daysToCheck: 21 // Look ahead 3 weeks for Super Bowl
        },
        {
          key: "NBA",
          url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
          daysToCheck: 7  // Keep NBA list clean (1 week only)
        },
        {
          key: "NCAAM",
          url: "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard",
          daysToCheck: 7  // Keep NCAA list clean (1 week only)
        },
        {
          key: "UEFA",
          url: "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard",
          daysToCheck: 7  // Keep UEFA Champions League list clean (1 week only)
        }
      ];

      // Create a specific list of fetch URLs based on each league's "daysToCheck"
      const fetchConfigs = endpoints.flatMap((ep) => {
        // Generate array of offsets: [0, 1, 2, ... daysToCheck]
        const offsets = Array.from({ length: ep.daysToCheck }, (_, i) => i);

        return offsets.map((offset) => ({
          key: ep.key,
          url: `${ep.url}?dates=${formatDateKey(offset)}`,
        }));
      });

      // Execute all fetches concurrently (with individual error swallowing)
      const responses = await Promise.all(
        fetchConfigs.map((cfg) =>
          fetch(cfg.url)
            .then((res) => {
              if (res.status === 429) {
                console.warn(`[ESPN] Rate limited on ${cfg.key} — backing off`);
                return null;
              }
              return res.ok ? res.json() : null;
            })
            .then((data) => ({ key: cfg.key, data }))
            .catch((err) => {
              // Swallow CORS / network errors silently — don't crash
              console.warn(`[ESPN] Fetch failed for ${cfg.key}:`, err.message || err);
              return { key: cfg.key, data: null };
            })
        )
      );

      let allGames: EspnScoreData[] = [];
      const seenGameIds = new Set<string>();

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const { key, data } of responses) {
        if (!data || !data.events) continue;

        for (const game of data.events) {
          if (seenGameIds.has(game.id)) continue;

          // Double-check: Skip past games (just in case API returns yesterday)
          const gameDate = new Date(game.date);
          if (gameDate < todayStart) continue;

          const competition = game.competitions?.[0];
          if (!competition) continue;

          const competitors = competition.competitors ?? [];
          const home = competitors.find((c: { homeAway: string }) => c.homeAway === "home");
          const away = competitors.find((c: { homeAway: string }) => c.homeAway === "away");

          if (!home || !away) continue;

          const status = competition.status ?? {};
          const statusType = status.type ?? {};
          const state = statusType.state ?? "";
          const detail = statusType.shortDetail ?? status.displayClock ?? "";

          seenGameIds.add(game.id);

          // Log the raw data for debugging
          // console.log(`[ESPN] Game: ${game.name}`, {
          //   id: game.id,
          //   period: status.period,
          //   clock: status.displayClock,
          //   state,
          //   homeScore: home.score,
          //   awayScore: away.score,
          //   homeLinescores: home.linescores?.length || 0,
          //   awayLinescores: away.linescores?.length || 0,
          // });

          allGames.push({
            id: game.id,
            name: game.name,
            shortName: game.shortName,
            date: game.date,
            league: key,
            homeTeam: {
              name: home.team.name,
              score: home.score ?? "0",
              abbreviation: home.team.abbreviation,
              logo: home.team.logo ?? "",
            },
            awayTeam: {
              name: away.team.name,
              score: away.score ?? "0",
              abbreviation: away.team.abbreviation,
              logo: away.team.logo ?? "",
            },
            period: status.period ?? 0,
            clock: status.displayClock ?? "",
            status: state,
            statusDetail: detail,
            competitors: competitors,
            isLive: state === "in",
          });
        }
      }

      // SORTING PRIORITY:
      // 1. "Super Bowl" matches -> TOP
      // 2. All other games -> Sorted by Date
      allGames.sort((a, b) => {
        const isSuperBowlA = a.name.toLowerCase().includes("super bowl") || a.shortName?.toLowerCase().includes("super bowl");
        const isSuperBowlB = b.name.toLowerCase().includes("super bowl") || b.shortName?.toLowerCase().includes("super bowl");

        if (isSuperBowlA && !isSuperBowlB) return -1; // Force A to top
        if (!isSuperBowlA && isSuperBowlB) return 1;  // Force B to top

        // Standard Sort: Earliest games first
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      setGames(allGames);
      lastGoodGamesRef.current = allGames; // Cache last successful result
      consecutiveFailsRef.current = 0; // Reset fail counter on success
      setError(null);
    } catch (err) {
      console.error("ESPN API Error:", err);
      consecutiveFailsRef.current += 1;
      // SAFETY: Preserve last known scores instead of wiping state
      if (lastGoodGamesRef.current.length > 0) {
        setGames(lastGoodGamesRef.current);
        console.warn(`[ESPN] Using cached scores (attempt #${consecutiveFailsRef.current})`);
      }
      setError("Score refresh failed — showing last known data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Schedule next poll with jitter
    const scheduleNext = () => {
      // Exponential backoff on consecutive failures (15s -> 30s -> 60s -> 120s max)
      const backoffMs = consecutiveFailsRef.current > 0
        ? Math.min(BACKOFF_INTERVAL * Math.pow(2, consecutiveFailsRef.current - 1), MAX_BACKOFF)
        : BASE_INTERVAL;
      const jitter = Math.floor(Math.random() * JITTER_RANGE);
      const nextInterval = backoffMs + jitter;

      timerRef.current = setTimeout(async () => {
        await fetchScores();
        scheduleNext(); // Chain the next poll
      }, nextInterval);
    };

    // Initial fetch
    fetchScores().then(() => scheduleNext());

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchScores]);

  return { games, loading, error };
}