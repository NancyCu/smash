"use client";

import { useState, useEffect } from "react";

export interface EspnScoreData {
  id: string;
  name: string;
  date: string;
  league: string;
  homeTeam: { name: string; score: string; abbreviation: string; logo: string };
  awayTeam: { name: string; score: string; abbreviation: string; logo: string };
  period: number;
  clock: string; // e.g., "12:45"
  status: string; // e.g., "in", "pre", "post"
  statusDetail: string; // e.g., "1/25 - 3:00 PM EST"
  isLive: boolean;
}

const DATE_OFFSETS = [0, 1];

function formatDateKey(offsetDays: number): string {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function useEspnScores() {
  const [games, setGames] = useState<EspnScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const endpoints = [
          { key: "NFL", url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard" },
          { key: "NBA", url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard" },
          { key: "UCL", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard" }
        ];

        const fetchConfigs = endpoints.flatMap((ep) => {
          // For NFL, fetch the default "current week" view (no specific date) to ensure we see upcoming weekend games
          if (ep.key === "NFL") {
            return [{ key: ep.key, url: ep.url }];
          }
          // For others, fetch Today (0) and Tomorrow (1)
          return DATE_OFFSETS.map((offset) => ({
            key: ep.key,
            url: `${ep.url}?dates=${formatDateKey(offset)}`,
          }));
        });

        const responses = await Promise.all(
          fetchConfigs.map((cfg) =>
            fetch(cfg.url)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => ({ key: cfg.key, data }))
              .catch((err) => {
                console.error(`Failed to fetch ${cfg.key}`, err);
                return { key: cfg.key, data: null };
              })
          )
        );

        let allGames: EspnScoreData[] = [];
        const seenGameIds = new Set<string>();

        for (const { key, data } of responses) {
          if (!data || !data.events) continue;
          const competitionList = data.events;
          for (const game of competitionList) {
            if (seenGameIds.has(game.id)) continue;
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

            allGames.push({
              id: game.id,
              name: game.name,
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
              isLive: state === "in",
            });
          }
        }

        allGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setGames(allGames);
        setError(null);
      } catch (err) {
        console.error("ESPN API Error:", err);
        setError("Failed to load scores");
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 15000); // Poll every 15s for fresher clock

    return () => clearInterval(interval);
  }, []);

  return { games, loading, error };
}
